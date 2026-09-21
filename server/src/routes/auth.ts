import crypto from "crypto";
import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "@models/User";
import {
  MsgResponseDto,
  LoginDto,
  LoginResponseDto,
  RegisterDto,
  VerifyEmailParamsDto,
} from "@dto/index";

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// регистрация пользователя
router.post("/register", async (req: Request<{}, {}, RegisterDto>, res: Response<MsgResponseDto>) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Такой пользователь уже существует" });
    }

    // создаем токен на основе почты для верификации
    const emailToken = crypto.randomBytes(64).toString("hex");
    // создаем кеш пароля для хранения в базе и последующей валиджации по нему
    const hashedPassword = await bcrypt.hash(password, 10);

    // создаем нового пользователя
    user = new User({ email, password: hashedPassword, emailToken });
    await user.save();

    // создаем ссылку валидации и отправляем письмо
    const url = `${process.env.BASE_URL}/api/auth/verify/${emailToken}`;
    await transporter.sendMail({
      to: email,
      subject: "Подтверждение регистрации",
      html: `Перейдите по этой ссылке <a href="${url}">here</a> для верификации регистрации`,
    });

    return res.json({
      message: "Вы зарегистрированы! Вам отправлено письмо для верификации регистрации. Доступ будет открыт после успешной верификации.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ message: message });
  }
});

// верификация почты
router.get("/verify/:token", async (req: Request<VerifyEmailParamsDto>, res: Response<MsgResponseDto>) => {
  try {
    // проверяем наличие токена верификации среди пользователей
    const user = await User.findOne({ emailToken: req.params.token });
    if (!user) {
      return res.status(400).json({ message: "Несуществующий код верификации" });
    }

    // верифицируем пользователя
    user.isVerified = true;
    user.emailToken = undefined;
    await user.save();
    return res.json({ message: "Верификация прошла успешно. Доступ открыт." });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ message: message });
  }
});

// авторизация
router.post(
  "/login",
  async (req: Request<{}, {}, LoginDto>, res: Response<LoginResponseDto | MsgResponseDto>) => {
    const { email, password } = req.body;

    // ищем пользователя
    const user = await User.findOne({ email });
    if (!user || !user.isVerified) {
      return res.status(400).json({ message: "Не найден такой пользователь или он не верифицирован" });
    }

    // проверяем пароль
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Некорректный пароль" });
    }

    // создаем новый токен авторизации
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, { expiresIn: "8h" });

    return res.json({
      token
    });
  }
);

export default router;
