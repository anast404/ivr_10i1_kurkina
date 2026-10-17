import { CreateFamilyDto, FamilyMembersResponseDto, FamilyResponseDto, GetFamilyQueryDto, MsgResponseDto } from "@dto/index";
import Family from "@models/Family";
import User from "@models/User";
import checkAuthAndReturnUser, { HttpError, requireFamily } from "@routes/index";
import { requiredText } from "@/utils/validation";
import express, { Request, Response } from "express";

const router = express.Router();

// создаем семью
router.post("/create", async (req: Request<{}, {}, CreateFamilyDto>, res: Response<FamilyResponseDto | MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    if (user.family_id) {
      throw new HttpError(400, "Вы уже состоите в семье. Сначала выйдите из неё");
    }
    const name = requiredText(req.body?.name, "Название семьи", 60);

    // создаем семью и как владельца записываем текущего пользователя
    const family = new Family({ name, owner_id: user._id });
    await family.save();

    // записываем айди семьи в профиле пользователя
    user.family_id = family._id;
    await user.save();

    res.json({ family_id: family._id.toString(), name: family.name, message: "Семья создана" });
  });
});

// участники семьи текущего пользователя
router.get("/members", async (req: Request, res: Response<FamilyMembersResponseDto | MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const familyId = requireFamily(user);
    const [family, members] = await Promise.all([
      Family.findById(familyId),
      User.find({ family_id: familyId }).sort({ _id: 1 }),
    ]);

    res.json(
      members.map((member) => ({
        id: member._id.toString(),
        name: member.name,
        email: member.email,
        isOwner: !!family && String(family.owner_id) === String(member._id),
      }))
    );
  });
});

// забираем объект семьи по айдишнику
router.get("", async (req: Request<{}, {}, {}, GetFamilyQueryDto>, res: Response<FamilyResponseDto | MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    // отдаём только семью текущего пользователя
    if (!user.family_id || String(user.family_id) !== String(req.query.id)) {
      throw new HttpError(403, "Нет доступа к этой семье");
    }
    const family = await Family.findById(user.family_id);
    if (!family) {
      throw new HttpError(404, "Нет такой семьи");
    }

    res.json({ family_id: family._id.toString(), name: family.name });
  });
});

export default router;
