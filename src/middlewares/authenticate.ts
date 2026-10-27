import { Request, Response, NextFunction } from "express";
import { JWT_SECRET } from "../config/env";
import { prisma } from "../config/db";
import ResponseMessage from "../core/responseMessage/message.class";
import { readPermissions } from "../utils/http";
import { AccessTokenClaims, verifyAccessToken } from "../utils/token";

export interface AuthenticatedUser {
  id: number;
  email: string;
  companyId: number | null;
  currentCompanyId: number | null;
  sessionId: string;
  role: string | null;
  permissions: string[];
  emailVerifiedAt: Date | null;
}

function sendUnauthorized(res: Response) {
  return ResponseMessage.send(res, ResponseMessage.error({ message: "Unauthorized" }, "Unauthorized", 401));
}

export async function resolveUser(payload: AccessTokenClaims): Promise<AuthenticatedUser | null> {
  if (payload.type !== "access") return null;
  const userId = Number(payload.sub);
  if (!Number.isFinite(userId)) return null;

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null, isActive: true },
  });
  if (!user) return null;

  if (payload.sessionId) {
    const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
    if (!session || session.userId !== user.id) return null;
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivity: Math.floor(Date.now() / 1000) },
    });
  }

  const companyId = payload.currentCompanyId ?? payload.companyId ?? user.currentCompanyId;
  let role: string | null = null;
  let permissions: string[] = [];
  if (companyId) {
    const membership = await prisma.companyUser.findFirst({
      where: { userId: user.id, companyId, isActive: true, deletedAt: null },
    });
    role = membership?.role ?? null;
    permissions = readPermissions(membership?.permissions);
  }

  return {
    id: user.id,
    email: user.email,
    companyId,
    currentCompanyId: user.currentCompanyId,
    sessionId: payload.sessionId ?? "",
    role,
    permissions,
    emailVerifiedAt: user.emailVerifiedAt,
  };
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  if (!JWT_SECRET) return sendUnauthorized(res);
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return sendUnauthorized(res);
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return sendUnauthorized(res);
  try {
    const payload = verifyAccessToken(token);
    const user = await resolveUser(payload);
    if (!user) return sendUnauthorized(res);
    req.user = user;
    req.companyId = user.companyId;
    return next();
  } catch {
    return sendUnauthorized(res);
  }
}
