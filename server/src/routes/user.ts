import { MsgResponseDto, UpdateUserDto, UserResponseDto } from "@dto/index";
import Family from "@models/Family";
import checkAuthAndReturnUser from "@routes/index";
import { leaveFamily } from "@/services/family";
import { optionalText } from "@/utils/validation";
import express, { Request, Response } from "express";
import { isValidObjectId } from "mongoose";

const router = express.Router();

// получить профиль текущего пользователя (доступен и без подтверждённой почты)
router.get("", async (req: Request, res: Response<UserResponseDto | MsgResponseDto>) => {
  await checkAuthAndReturnUser(
    req,
    res,
    async (user) => {
      res.json({
        name: user.name,
        family_id: user.family_id?.toString(),
        email: user.email,
        isVerified: user.isVerified,
      });
    },
    { allowUnverified: true }
  );
});

// изменение профиля
router.put("/update", async (req: Request<{}, {}, UpdateUserDto>, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const name = optionalText(req.body?.name, "Имя", 50);
    const { family_id } = req.body ?? {};

    if (name) {
      user.name = name;
    }

    // присоединение к семье по идентификатору
    if (family_id) {
      if (!isValidObjectId(family_id)) {
        res.status(400).json({ message: "Некорректный family_id" });
        return;
      }
      const family = await Family.findById(family_id);
      if (!family) {
        res.status(404).json({ message: "Семья с таким идентификатором не найдена" });
        return;
      }
      // при переходе в другую семью корректно выходим из прежней
      if (user.family_id && String(user.family_id) !== String(family._id)) {
        await leaveFamily(user);
      }
      user.family_id = family._id;
    }

    await user.save();
    res.json({ message: "Профиль пользователя успешно обновлен" });
  });
});

// выход из семьи
router.delete("/leave-family", async (req: Request, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    await leaveFamily(user);
    res.json({ message: "Вы вышли из семьи" });
  });
});

export default router;
