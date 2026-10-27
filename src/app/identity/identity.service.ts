import { MODE, EMAIL_VERIFICATION_TTL_MS, PASSWORD_RESET_CODE_TTL_MS } from "../../config/env";
import { prisma } from "../../config/db";
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from "../../core/errors";
import { publishDomainEvent } from "../../core/events/domain-event.helper";
import { companyCode, hashPassword, newSessionId, numericCode, signAccessToken, verifyPassword } from "../../utils";
import { StorageFactory } from "../service/storage";
import { AuthSession, LoginInput, RegisterInput } from "./identity.interface";
import { IdentityMapper } from "./identity.mapper";
import { IdentityRepository } from "./identity.repository";

const dev = MODE === "development" || MODE === "dev" || MODE === "test";

export class IdentityService {
  static async register(input: RegisterInput, meta: { ip?: string; userAgent?: string }) {
    const existing = await IdentityRepository.findActiveByEmail(input.email.toLowerCase());
    if (existing) throw new ConflictError("This email is already registered");

    const password = await hashPassword(input.password);
    const now = new Date();
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          password,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          phoneNumber: input.phoneNumber?.trim() || null,
          settings: {},
          customAttributes: {},
          createdAt: now,
          updatedAt: now,
        },
      });
      const company = await tx.company.create({
        data: {
          code: companyCode(),
          userId: user.id,
          name: input.companyName.trim(),
          personalCompany: true,
          email: user.email,
          settings: {},
          customAttributes: {},
          createdAt: now,
          updatedAt: now,
        },
      });
      await tx.companyUser.create({
        data: {
          companyId: company.id,
          userId: user.id,
          role: "owner",
          isPrimary: true,
          permissions: ["*"],
          joinedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      });
      const updated = await tx.user.update({
        where: { id: user.id },
        data: { currentCompanyId: company.id },
      });
      const verification = await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          code: numericCode(),
          expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
        },
      });
      return { user: updated, company, verification };
    });

    const session = await this.openSession(created.user.id, created.company.id, meta);
    publishDomainEvent({
      type: "user.registered",
      organizationId: String(created.company.id),
      actorId: String(created.user.id),
      entityType: "user",
      entityId: String(created.user.id),
      payload: { email: created.user.email },
    });

    return {
      ...this.session(created.user, created.company.id, session.id, false),
      ...(dev ? { verificationCode: created.verification.code } : {}),
    };
  }

  static async login(input: LoginInput, meta: { ip?: string; userAgent?: string }): Promise<AuthSession> {
    const user = await IdentityRepository.findActiveByEmail(input.email.toLowerCase());
    if (!user || !user.isActive || !(await verifyPassword(input.password, user.password))) {
      throw new UnauthorizedError("Invalid email or password");
    }
    const session = await this.openSession(user.id, user.currentCompanyId, meta);
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: meta.ip ?? null },
    });
    return this.session(user, user.currentCompanyId, session.id, Boolean(input.remember));
  }

  static async logout(sessionId: string) {
    await IdentityRepository.deleteSession(sessionId);
    return { loggedOut: true };
  }

  static async me(userId: number) {
    const user = await IdentityRepository.findActiveById(userId);
    if (!user) throw new UnauthorizedError("Unauthorized");
    return IdentityMapper.user(user);
  }

  static async verifyEmail(email: string, code: string) {
    const user = await IdentityRepository.findActiveByEmail(email.toLowerCase());
    if (!user) throw new NotFoundError("Account was not found");
    const token = await prisma.emailVerificationToken.findFirst({
      where: { userId: user.id, code, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!token) throw new BadRequestError("Verification code is invalid or expired");
    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      await tx.emailVerificationToken.update({ where: { id: token.id }, data: { usedAt: now } });
      return tx.user.update({ where: { id: user.id }, data: { emailVerifiedAt: now } });
    });
    return IdentityMapper.user(updated);
  }

  static async forgotPassword(email: string) {
    const user = await IdentityRepository.findActiveByEmail(email.toLowerCase());
    if (!user) return { sent: true };
    const code = numericCode();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_CODE_TTL_MS),
      },
    });
    publishDomainEvent({
      type: "password.reset_requested",
      organizationId: String(user.currentCompanyId ?? ""),
      actorId: String(user.id),
      entityType: "user",
      entityId: String(user.id),
      payload: { email: user.email },
    });
    return { sent: true, ...(dev ? { resetCode: code } : {}) };
  }

  static async resetPassword(email: string, code: string, password: string) {
    const user = await IdentityRepository.findActiveByEmail(email.toLowerCase());
    if (!user) throw new BadRequestError("Reset code is invalid or expired");
    const token = await prisma.passwordResetToken.findFirst({
      where: { userId: user.id, code, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!token) throw new BadRequestError("Reset code is invalid or expired");
    const hashed = await hashPassword(password);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { password: hashed } });
      await tx.passwordResetToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });
      await tx.session.deleteMany({ where: { userId: user.id } });
    });
    return { reset: true };
  }

  static async uploadAvatar(userId: number, file: Express.Multer.File) {
    const stored = await StorageFactory.create().uploadMedia(file.buffer, file.mimetype, String(userId), "avatars");
    const user = await prisma.user.update({
      where: { id: userId },
      data: { profilePhotoPath: stored.url },
    });
    return IdentityMapper.user(user);
  }

  private static openSession(userId: number, companyId: number | null, meta: { ip?: string; userAgent?: string }) {
    return IdentityRepository.createSession({
      id: newSessionId(),
      userId,
      companyId,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    });
  }

  private static session(
    user: Parameters<typeof IdentityMapper.user>[0],
    companyId: number | null,
    sessionId: string,
    remember: boolean,
  ): AuthSession {
    return {
      accessToken: signAccessToken(
        {
          sub: String(user.id),
          email: user.email,
          companyId,
          currentCompanyId: companyId,
          sessionId,
        },
        remember,
      ),
      user: IdentityMapper.user(user),
      companyId,
    };
  }
}
