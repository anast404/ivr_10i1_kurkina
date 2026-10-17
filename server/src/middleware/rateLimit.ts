import { NextFunction, Request, Response } from "express";

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

/**
 * Простой ограничитель частоты запросов в памяти процесса (по IP).
 * Защищает /auth от перебора паролей; для нескольких инстансов нужен общий стор (Redis).
 */
export function rateLimit({ windowMs, max }: RateLimitOptions) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  const cleaner = setInterval(() => {
    const now = Date.now();
    hits.forEach((entry, key) => {
      if (entry.resetAt <= now) {
        hits.delete(key);
      }
    });
  }, windowMs);
  // не даём таймеру удерживать процесс (тип таймера различается в Node и DOM-типах)
  (cleaner as unknown as { unref?: () => void }).unref?.();

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = req.ip ?? "unknown";

    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    if (entry.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      res.status(429).json({ message: "Слишком много запросов. Попробуйте позже" });
      return;
    }
    next();
  };
}
