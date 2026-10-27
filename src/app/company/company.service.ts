import { prisma } from "../../config/db";
import { ForbiddenError, NotFoundError } from "../../core/errors";
import { CacheBackendFactory, CacheConfig } from "../service/cache";
import { companyCode, newSessionId, signAccessToken } from "../../utils";
import { CompanyMapper } from "./company.mapper";
import { CompanyRepository } from "./company.repository";
import { CreateCompanyInput } from "./company.interface";

export class CompanyService {
  static async list(userId: number) {
    const rows = await CompanyRepository.memberships(userId);
    return rows.map((row) => CompanyMapper.toDto(row));
  }

  static async current(userId: number, companyId: number) {
    const cache = CacheBackendFactory.get();
    const key = `company:${companyId}:user:${userId}`;
    const cached = await cache.get<ReturnType<typeof CompanyMapper.toDto>>(key);
    if (cached) return cached;
    const row = await CompanyRepository.membership(userId, companyId);
    if (!row) throw new NotFoundError("Company was not found");
    const dto = CompanyMapper.toDto(row);
    await cache.set(key, dto, CacheConfig.ttlMs);
    return dto;
  }

  static async create(userId: number, input: CreateCompanyInput, meta: { ip?: string; userAgent?: string }) {
    const now = new Date();
    const company = await prisma.$transaction(async (tx) => {
      const created = await tx.company.create({
        data: {
          code: companyCode(),
          userId,
          name: input.name.trim(),
          personalCompany: false,
          settings: {},
          customAttributes: {},
          createdAt: now,
          updatedAt: now,
        },
      });
      await tx.companyUser.create({
        data: {
          companyId: created.id,
          userId,
          role: "owner",
          permissions: ["*"],
          joinedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      });
      await tx.user.update({ where: { id: userId }, data: { currentCompanyId: created.id } });
      return created;
    });
    await CacheBackendFactory.get().delete(`company:${company.id}:user:${userId}`);
    const accessToken = await this.issueToken(userId, company.id, meta);
    return {
      company: { id: company.id, code: company.code, name: company.name, role: "owner", permissions: ["*"], personalCompany: false },
      accessToken,
    };
  }

  static async switchCompany(userId: number, companyId: number, meta: { ip?: string; userAgent?: string }) {
    const row = await CompanyRepository.membership(userId, companyId);
    if (!row) throw new ForbiddenError("You are not a member of that company");
    await prisma.user.update({ where: { id: userId }, data: { currentCompanyId: companyId } });
    const accessToken = await this.issueToken(userId, companyId, meta);
    return { company: CompanyMapper.toDto(row), accessToken };
  }

  private static async issueToken(userId: number, companyId: number, meta: { ip?: string; userAgent?: string }) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const session = await prisma.session.create({
      data: {
        id: newSessionId(),
        userId,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        payload: JSON.stringify({ companyId }),
        lastActivity: Math.floor(Date.now() / 1000),
      },
    });
    return signAccessToken(
      {
        sub: String(userId),
        email: user.email,
        companyId,
        currentCompanyId: companyId,
        sessionId: session.id,
      },
      false,
    );
  }
}
