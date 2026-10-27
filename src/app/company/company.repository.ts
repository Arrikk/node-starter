import { prisma } from "../../config/db";

export class CompanyRepository {
  static memberships(userId: number) {
    return prisma.companyUser.findMany({
      where: { userId, isActive: true, deletedAt: null, company: { deletedAt: null, isActive: true } },
      include: { company: true },
      orderBy: { id: "asc" },
    });
  }

  static membership(userId: number, companyId: number) {
    return prisma.companyUser.findFirst({
      where: {
        userId,
        companyId,
        isActive: true,
        deletedAt: null,
        company: { deletedAt: null, isActive: true },
      },
      include: { company: true },
    });
  }
}
