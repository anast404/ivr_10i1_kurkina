import { MsgResponseDto } from "@dto/index";
import User, { IUser } from "@models/User";
import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

type UserHandler = (user: IUser) => Promise<void> | void;

interface AuthJwtPayload extends JwtPayload {
  id: string;
}

async function checkAuthAndReturnUser(
  req: Request<any, any, any, any>,
  res: Response<MsgResponseDto>,
  next: UserHandler
): Promise<Response | void> {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(401).json({ message: "Отсутсвует авторизационная информация" });
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

  try {
    await next(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ message: message });
  }
}

export default checkAuthAndReturnUser;
