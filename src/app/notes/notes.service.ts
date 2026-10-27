import { NotFoundError } from "../../core/errors";
import { publishDomainEvent } from "../../core/events/domain-event.helper";
import { pageQuery, pageResult } from "../../utils";
import { NoteWrite } from "./notes.interface";
import { NotesMapper } from "./notes.mapper";
import { NotesRepository } from "./notes.repository";

export class NotesService {
  static async list(companyId: number, query: { page?: unknown; limit?: unknown }) {
    const page = pageQuery(query);
    const [rows, total] = await NotesRepository.list(companyId, page);
    return pageResult(rows.map((row) => NotesMapper.toDto(row)), total, page);
  }

  static async get(companyId: number, id: string) {
    const row = await NotesRepository.find(companyId, id);
    if (!row) throw new NotFoundError("Note was not found");
    return NotesMapper.toDto(row);
  }

  static async create(companyId: number, userId: number, input: NoteWrite) {
    const row = await NotesRepository.create({
      companyId,
      createdBy: userId,
      title: input.title.trim(),
      body: input.body ?? "",
    });
    publishDomainEvent({
      type: "note.created",
      organizationId: String(companyId),
      actorId: String(userId),
      entityType: "note",
      entityId: row.id,
      payload: { title: row.title },
    });
    return NotesMapper.toDto(row);
  }

  static async update(companyId: number, userId: number, id: string, input: Partial<NoteWrite>) {
    const existing = await NotesRepository.find(companyId, id);
    if (!existing) throw new NotFoundError("Note was not found");
    const row = await NotesRepository.update(id, {
      title: input.title?.trim(),
      body: input.body,
    });
    publishDomainEvent({
      type: "note.updated",
      organizationId: String(companyId),
      actorId: String(userId),
      entityType: "note",
      entityId: row.id,
      payload: { title: row.title },
    });
    return NotesMapper.toDto(row);
  }

  static async remove(companyId: number, userId: number, id: string) {
    const existing = await NotesRepository.find(companyId, id);
    if (!existing) throw new NotFoundError("Note was not found");
    await NotesRepository.softDelete(id);
    publishDomainEvent({
      type: "note.deleted",
      organizationId: String(companyId),
      actorId: String(userId),
      entityType: "note",
      entityId: id,
      payload: {},
    });
    return { id, deleted: true };
  }
}
