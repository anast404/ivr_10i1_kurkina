import {
  MsgResponseDto,
  UpdateUserDto,
  UserResponseDto,
} from "@dto/index";
import Family from "@models/Family";
import checkAuthAndReturnUser from "@routes/index";
import express, { Request, Response } from "express";
import { isValidObjectId } from "mongoose";

const router = express.Router();

// получить профиль текущего пользователя
router.get("", async (req: Request, res: Response<UserResponseDto | MsgResponseDto>) => {
  // проверяем авторизацию и возвращаем текущего пользователя
  await checkAuthAndReturnUser(req, res, async (user) => {
    res.json({
      name: user.name,
      family_id: user.family_id?.toString(),
      email: user.email,
      isVerified: user.isVerified,
    });
  });
});

// изменение профиля
router.put(
  "/update",
  async (
    req: Request<{}, {}, UpdateUserDto>,
    res: Response<UserResponseDto | MsgResponseDto>
  ) => {
    // проверяем авторизацию и возвращаем текущего пользователя
    await checkAuthAndReturnUser(req, res, async (user) => {
      const { name, family_id } = req.body;

      // если передали/изменилось имя
      if (name) {
        user.name = name;
      }

      // если передали/изменилось семья
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
        user.family_id = family._id;
      }

      await user.save();

      res.json({ message: "Профиль пользователя успешно обновлен" });
    });
  }
);

// изменение профиля
router.delete(
  "/leave-family",
  async (
    req: Request,
    res: Response<MsgResponseDto>
  ) => {
    // проверяем авторизацию и возвращаем текущего пользователя
    await checkAuthAndReturnUser(req, res, async (user) => {
      user.family_id = undefined;

      await user.save();

      res.json({ message: "Вы вышли из семьи" });
    });
  }
);

export default router;
