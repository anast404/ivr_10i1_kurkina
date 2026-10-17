/** Страница, которую видит пользователь после перехода по ссылке из письма */
export function renderVerifyPage(ok: boolean, text: string): string {
  const color = ok ? "#4a7c59" : "#b3261e";
  const icon = ok ? "✅" : "⚠️";
  const title = ok ? "Почта подтверждена" : "Ссылка недействительна";
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>HappyHome — ${title}</title>
  <style>
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
           font-family: -apple-system, Roboto, "Segoe UI", sans-serif; background: #faf7f2; color: #2b2b2b; }
    .card { max-width: 360px; margin: 16px; padding: 32px 24px; background: #fff; border-radius: 24px;
            text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,.08); }
    .icon { font-size: 48px; }
    h1 { margin: 12px 0 8px; font-size: 22px; color: ${color}; }
    p { margin: 0; font-size: 15px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${text}</p>
  </div>
</body>
</html>`;
}
