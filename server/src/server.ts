// dotenv должен подгрузиться ДО остальных импортов
import "dotenv/config";
import mongoose from "mongoose";
import { createApp } from "./app";
import connectDB from "./config/db";

const REQUIRED_ENV = ["JWT_SECRET", "MONGO_URI"];
const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Не заданы переменные окружения: ${missing.join(", ")}. См. server/.env.example`);
  process.exit(1);
}
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn("EMAIL_USER/EMAIL_PASS не заданы: ссылки подтверждения будут выводиться в консоль сервера");
}

const PORT = process.env.PORT || 5000;

// поднимаем HTTP только после успешного подключения к базе
connectDB().then(() => {
  const server = createApp().listen(PORT, () => console.log(`Server running on port ${PORT}`));

  // корректное завершение (docker stop / Ctrl+C)
  const shutdown = () => {
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
});
