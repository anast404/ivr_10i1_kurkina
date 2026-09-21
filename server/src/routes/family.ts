import express, { Request, Response } from "express";
import Family from "@models/Family";
import { CreateFamilyDto, MsgResponseDto, FamilyResponseDto, GetFamilyQueryDto } from "@dto/index";
import checkAuthAndReturnUser from "@routes/index";

const router = express.Router();

// создаем семью
router.post("/create", async (req: Request<{}, {}, CreateFamilyDto>, res: Response<FamilyResponseDto | MsgResponseDto>) => {
  // проверяем валидацию и возвращаем запись активного пользователя
  await checkAuthAndReturnUser(req, res, async (user) => {
    try {
      const { name } = req.body;

      // создаем семью и как владельца записываем текущего пользователя
      const family = new Family({ name, owner_id: user._id });
      await family.save();

      // записываем айди семьи в профиле пользователя
      user.family_id = family._id;
      await user.save();

      res.json({ family_id: family._id.toString(), name: family.name });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ message: message });
    }
  });
});

// забираем объект семьи по айдишнику
router.get("", async (req: Request<{}, {}, {}, GetFamilyQueryDto>, res: Response<FamilyResponseDto | MsgResponseDto>) => {
  // проверяем автоизацию
  await checkAuthAndReturnUser(req, res, async () => {
    try {
      // проверяем а есть ли семья с таким айдишником
      const family = await Family.findById(req.query.id);
      if (!family) {
        throw new Error("Нет такой семьи");
      }

      res.json({ family_id: family._id.toString(), name: family.name });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ message: message });
    }
  });
});

export default router;
