import { createTransport, SendMailOptions, Transporter } from "nodemailer";
import { EMAIL_SENDER, EMAIL_USER, SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER } from "./env";

const transporter: Transporter = createTransport({
  port: Number(SMTP_PORT) || 587,
  host: SMTP_HOST,
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
  secure: Number(SMTP_PORT) === 465,
});

function sendWithTransporter(mailInfo: SendMailOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailInfo, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export async function sendMail(
  to: string,
  subject: string,
  html: string,
  attachment: SendMailOptions["attachments"] = [],
): Promise<void> {
  const fromName = EMAIL_USER || EMAIL_SENDER;
  await sendWithTransporter({
    from: EMAIL_SENDER ? `${fromName} <${EMAIL_SENDER}>` : SMTP_USER,
    to,
    subject,
    html,
    attachments: attachment,
  });
}

export async function sendBulkMail(bcc: string[], subject: string, html: string): Promise<void> {
  await sendWithTransporter({
    from: EMAIL_SENDER ? `${EMAIL_USER} <${EMAIL_SENDER}>` : SMTP_USER,
    to: EMAIL_SENDER || SMTP_USER,
    bcc,
    subject,
    html,
  });
}
