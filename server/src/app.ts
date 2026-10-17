import express, { ErrorRequestHandler, RequestHandler } from "express";
import { rateLimit } from "./middleware/rateLimit";
import authRoutes from "./routes/auth";
import familyRoutes from "./routes/family";
import pillRoutes from "./routes/pill";
import plantRoutes from "./routes/plant";
import shoppingRoutes from "./routes/shopping";
import userRoutes from "./routes/user";

const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Маршрут не найден" });
};

// 4 аргумента обязательны: так express распознаёт обработчик ошибок
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ message: "Некорректный JSON в теле запроса" });
    return;
  }
  console.error(err);
  res.status(500).json({ message: "Внутренняя ошибка сервера" });
};

/** Собирает express-приложение без запуска сервера и подключения к базе (удобно для тестов) */
export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  // за обратным прокси (nginx, облачный балансировщик) задайте TRUST_PROXY=1, чтобы лимит считался по реальному IP
  const proxyHops = Number(process.env.TRUST_PROXY);
  if (proxyHops > 0) {
    app.set("trust proxy", proxyHops);
  }

  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 50,
  });

  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/family", familyRoutes);
  app.use("/api/pill", pillRoutes);
  app.use("/api/plant", plantRoutes);
  app.use("/api/shopping", shoppingRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
