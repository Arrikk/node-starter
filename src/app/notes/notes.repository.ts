import { prisma } from "../../config/db";
import { PageQuery } from "../../utils";

export class NotesRepository {
  static list(companyId: number, page: PageQuery) {
    return prisma.$transaction([
      prisma.note.findMany({
        where: { companyId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        skip: page.skip,
        take: page.limit,
      }),
      prisma.note.count({ where: { companyId, deletedAt: null } }),
    ]);
  }

  static find(companyId: number, id: string) {
    return prisma.note.findFirst({ where: { id, companyId, deletedAt: null } });
  }

  static create(input: { companyId: number; title: string; body: string; createdBy: number }) {
    return prisma.note.create({ data: input });
  }

  static update(id: string, input: { title?: string; body?: string }) {
    return prisma.note.update({ where: { id }, data: input });
  }

  static softDelete(id: string) {
    return prisma.note.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
