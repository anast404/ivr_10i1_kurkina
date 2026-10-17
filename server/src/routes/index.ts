import { MsgResponseDto } from "@dto/index";
import User, { IUser } from "@models/User";
import { HttpError, toHttpError } from "@/utils/errors";
import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export { HttpError };

/** Пользователь должен состоять в семье, иначе данные некуда привязывать */
export function requireFamily(user: IUser) {
  if (!user.family_id) {
    throw new HttpError(400, "Сначала создайте семью или присоединитесь к ней");
  }
  return user.family_id;
}

type UserHandler = (user: IUser) => Promise<void> | void;

interface AuthJwtPayload extends JwtPayload {
  id: string;
}

interface AuthOptions {
  /** Пустить пользователя с неподтверждённой почтой (профиль, повторная отправка письма) */
  allowUnverified?: boolean;
}

export function signToken(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "30d") as jwt.SignOptions["expiresIn"],
  });
}

async function checkAuthAndReturnUser(
  req: Request<any, any, any, any>,
  res: Response<any>,
  next: UserHandler,
  options: AuthOptions = {}
): Promise<Response | void> {
  // токен принимаем и как есть, и в формате "Bearer <token>"
  const token = req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return res.status(401).json({ message: "Отсутствует авторизационная информация" });
  }

  let user: IUser | null = null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthJwtPayload;
    user = await User.findById(decoded.id);
    if (!user) {
      throw new Error("User not found");
    }
  } catch {
    return res.status(401).json({ message: "Некорректная авторизационная информация" });
  }

  if (!user.isVerified && !options.allowUnverified) {
    return res.status(403).json({ message: "Подтвердите почту, чтобы продолжить" });
  }

  try {
    await next(user);
  } catch (err) {
    const httpError = toHttpError(err);
    if (!res.headersSent) {
      res.status(httpError.status).json({ message: httpError.message });
    }
  }
}

export default checkAuthAndReturnUser;
