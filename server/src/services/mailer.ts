import nodemailer from "nodemailer";

/** Письма, «отправленные» в тестовом режиме (NODE_ENV=test) */
export const testOutbox: { to: string; url: string }[] = [];

let transporter: nodemailer.Transporter | undefined;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }
  return transporter;
}

export function buildVerificationUrl(token: string): string {
  const base = (process.env.BASE_URL ?? "").replace(/\/+$/, "");
  return `${base}/api/auth/verify/${token}`;
}

/**
 * Отправляет письмо со ссылкой подтверждения.
 * Возвращает true, если письмо отправлено. Если SMTP не настроен, ссылка выводится в консоль сервера.
 */
export async function sendVerificationMail(email: string, token: string): Promise<boolean> {
  const url = buildVerificationUrl(token);

  if (process.env.NODE_ENV === "test") {
    testOutbox.push({ to: email, url });
    return true;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[mail] SMTP не настроен. Ссылка подтверждения для ${email}: ${url}`);
    return false;
  }

  try {
    await getTransporter().sendMail({
      to: email,
      subject: "Подтверждение регистрации в HappyHome",
      text: `Для подтверждения регистрации перейдите по ссылке: ${url}`,
      html: `Для подтверждения регистрации в HappyHome перейдите по <a href="${url}">этой ссылке</a>.`,
    });
    return true;
  } catch (err) {
    console.error("[mail] не удалось отправить письмо:", err);
    return false;
  }
}
