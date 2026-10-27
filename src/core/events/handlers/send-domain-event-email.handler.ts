import { APP_NAME } from "../../../config/env";
import { prisma } from "../../../config/db";
import { EmailService } from "../../../app/service/email";
import { DomainEmailJobPayload, DomainEventType } from "../domain-event.types";

const EMAIL_EVENTS = new Set(["user.registered", "password.reset_requested"]);

export function isEmailEventType(eventType: DomainEventType): boolean {
  return EMAIL_EVENTS.has(eventType);
}

export async function sendDomainEventEmail(job: DomainEmailJobPayload): Promise<void> {
  const email = typeof job.payload.email === "string" ? job.payload.email : "";
  const userId = Number(job.entityId);
  if (!email || !Number.isFinite(userId)) return;

  if (job.eventType === "user.registered") {
    const token = await prisma.emailVerificationToken.findFirst({
      where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!token) return;
    await EmailService.default().send({
      to: email,
      subject: `Verify your ${APP_NAME} email`,
      html: `<p>Your verification code is <strong>${token.code}</strong>.</p>`,
    });
    return;
  }

  if (job.eventType === "password.reset_requested") {
    const token = await prisma.passwordResetToken.findFirst({
      where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!token) return;
    await EmailService.default().send({
      to: email,
      subject: `Reset your ${APP_NAME} password`,
      html: `<p>Your reset code is <strong>${token.code}</strong>.</p>`,
    });
  }
}
