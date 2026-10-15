// dotenv должен подгрузиться ДО остальных импортов: auth.ts создаёт почтовый транспорт при импорте
import "dotenv/config";
import express from "express";
import connectDB from "./config/db";
import authRoutes from "./routes/auth";
import familyRoutes from "./routes/family";
import pillRoutes from "./routes/pill";
import plantRoutes from "./routes/plant";
import shoppingRoutes from "./routes/shopping";
import userRoutes from "./routes/user";

const REQUIRED_ENV = ["JWT_SECRET", "MONGO_URI"];
const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Не заданы переменные окружения: ${missing.join(", ")}. См. server/.env.example`);
  process.exit(1);
}
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn("EMAIL_USER/EMAIL_PASS не заданы: письма верификации отправляться не будут");
}

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/pill", pillRoutes);
app.use("/api/plant", plantRoutes);
app.use("/api/shopping", shoppingRoutes);

const PORT = process.env.PORT || 5000;

// поднимаем HTTP только после успешного подключения к базе
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
