import { CreateFamilyDto, FamilyResponseDto, GetFamilyQueryDto, MsgResponseDto } from "@dto/index";
import Family from "@models/Family";
import checkAuthAndReturnUser from "@routes/index";
import express, { Request, Response } from "express";

const router = express.Router();

// создаем семью
router.post("/create", async (req: Request<{}, {}, CreateFamilyDto>, res: Response<FamilyResponseDto | MsgResponseDto>) => {
  // проверяем валидацию и возвращаем запись активного пользователя
  await checkAuthAndReturnUser(req, res, async (user) => {
    const { name } = req.body;

    // создаем семью и как владельца записываем текущего пользователя
    const family = new Family({ name, owner_id: user._id });
    await family.save();

    // записываем айди семьи в профиле пользователя
    user.family_id = family._id;
    await user.save();

    res.json({ family_id: family._id.toString(), name: family.name });
  });
});

// забираем объект семьи по айдишнику
router.get("", async (req: Request<{}, {}, {}, GetFamilyQueryDto>, res: Response<FamilyResponseDto | MsgResponseDto>) => {
  // проверяем автоизацию
  await checkAuthAndReturnUser(req, res, async () => {
    // проверяем а есть ли семья с таким айдишником
    const family = await Family.findById(req.query.id);
    if (!family) {
      throw new Error("Нет такой семьи");
    }

    res.json({ family_id: family._id.toString(), name: family.name });
  });
});

export default router;
