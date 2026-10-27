import { prisma, AppPrismaClient } from "../../config/db";
import { PublicUser } from "./identity.interface";

type Db = AppPrismaClient;

export class IdentityRepository {
  static db(client?: Db): Db {
    return client ?? prisma;
  }

  static findActiveByEmail(email: string, client?: Db) {
    return this.db(client).user.findFirst({ where: { email, deletedAt: null } });
  }

  static findActiveById(id: number, client?: Db) {
    return this.db(client).user.findFirst({ where: { id, deletedAt: null, isActive: true } });
  }

  static createSession(input: {
    id: string;
    userId: number;
    ipAddress?: string;
    userAgent?: string;
    companyId: number | null;
  }, client?: Db) {
    return this.db(client).session.create({
      data: {
        id: input.id,
        userId: input.userId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        payload: JSON.stringify({ companyId: input.companyId }),
        lastActivity: Math.floor(Date.now() / 1000),
      },
    });
  }

  static deleteSession(id: string) {
    return prisma.session.deleteMany({ where: { id } });
  }

  static toPublic(user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    emailVerifiedAt: Date | null;
    currentCompanyId: number | null;
    profilePhotoPath: string | null;
  }): PublicUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
      currentCompanyId: user.currentCompanyId,
      profilePhotoPath: user.profilePhotoPath,
    };
  }
}
