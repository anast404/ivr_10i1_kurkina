import { LoginDto, LoginResponseDto, MsgResponseDto, RegisterDto, RegisterResponseDto, VerifyEmailParamsDto } from "@dto/index";
import User from "@models/User";
import checkAuthAndReturnUser, { signToken } from "@routes/index";
import { sendVerificationMail } from "@/services/mailer";
import { HttpError, toHttpError } from "@/utils/errors";
import { parseEmail, parsePassword } from "@/utils/validation";
import { renderVerifyPage } from "@/views/verify-page";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import express, { Request, Response } from "express";

const router = express.Router();

/** Минимальный интервал между письмами для одного пользователя */
export const RESEND_COOLDOWN_MS = 60_000;

const newEmailToken = () => crypto.randomBytes(32).toString("hex");

function sendError(res: Response<any>, err: unknown): Response {
  const httpError = toHttpError(err);
  return res.status(httpError.status).json({ message: httpError.message });
}

// регистрация пользователя
router.post("/register", async (req: Request<{}, {}, RegisterDto>, res: Response<RegisterResponseDto | MsgResponseDto>) => {
  try {
    const email = parseEmail(req.body?.email);
    const password = parsePassword(req.body?.password);

    if (await User.findOne({ email })) {
      throw new HttpError(400, "Такой пользователь уже существует");
    }

    // токен для ссылки верификации и хеш пароля для хранения в базе
    const emailToken = newEmailToken();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ email, password: hashedPassword, emailToken, verificationSentAt: new Date() });
    await user.save();

    const mailSent = await sendVerificationMail(email, emailToken);

    // выдаём токен сразу: приложение покажет экран «Подтвердите почту», пока почта не подтверждена
    return res.status(201).json({
      message: mailSent
        ? "Вы зарегистрированы! Мы отправили письмо со ссылкой для подтверждения почты."
        : "Вы зарегистрированы, но письмо отправить не удалось. Нажмите «Отправить письмо снова».",
      token: signToken(user.id),
      mailSent,
    });
  } catch (err) {
    return sendError(res, err);
  }
});

// верификация почты: пользователь открывает ссылку из письма в браузере, поэтому отвечаем HTML-страницей
router.get("/verify/:token", async (req: Request<VerifyEmailParamsDto>, res: Response) => {
  try {
    const user = await User.findOne({ emailToken: req.params.token });
    if (!user) {
      return res
        .status(400)
        .type("html")
        .send(renderVerifyPage(false, "Ссылка уже использована или устарела. Запросите новое письмо в приложении."));
    }

    user.isVerified = true;
    user.emailToken = undefined;
    await user.save();

    return res
      .type("html")
      .send(renderVerifyPage(true, "Вернитесь в приложение HappyHome и нажмите «Я подтвердил почту»."));
  } catch (err) {
    console.error(err);
    return res.status(500).type("html").send(renderVerifyPage(false, "Что-то пошло не так. Попробуйте позже."));
  }
});

// авторизация (неподтверждённого пользователя пускаем: приложение покажет ему экран верификации)
router.post("/login", async (req: Request<{}, {}, LoginDto>, res: Response<LoginResponseDto | MsgResponseDto>) => {
  try {
    const email = parseEmail(req.body?.email);
    const password = req.body?.password;

    const user = await User.findOne({ email });
    const isMatch = !!user && typeof password === "string" && (await bcrypt.compare(password, user.password));
    if (!user || !isMatch) {
      // одно и то же сообщение, чтобы нельзя было узнать, какие e-mail зарегистрированы
      throw new HttpError(401, "Неверный email или пароль");
    }

    return res.json({ token: signToken(user.id) });
  } catch (err) {
    return sendError(res, err);
  }
});

// повторная отправка письма верификации
router.post("/resend", async (req: Request, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(
    req,
    res,
    async (user) => {
      if (user.isVerified) {
        throw new HttpError(400, "Почта уже подтверждена");
      }

      const waitMs = RESEND_COOLDOWN_MS - (Date.now() - (user.verificationSentAt?.getTime() ?? 0));
      if (waitMs > 0) {
        throw new HttpError(429, `Повторная отправка возможна через ${Math.ceil(waitMs / 1000)} с`);
      }

      const emailToken = user.emailToken ?? newEmailToken();
      user.emailToken = emailToken;
      user.verificationSentAt = new Date();
      await user.save();

      const mailSent = await sendVerificationMail(user.email, emailToken);
      if (!mailSent) {
        throw new HttpError(502, "Не удалось отправить письмо. Попробуйте позже");
      }

      res.json({ message: "Письмо отправлено! Проверьте почту." });
    },
    { allowUnverified: true }
  );
});

export default router;
