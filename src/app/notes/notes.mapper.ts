import { NoteDto } from "./notes.interface";

export class NotesMapper {
  static toDto(row: {
    id: string;
    companyId: number;
    title: string;
    body: string;
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
  }): NoteDto {
    return {
      id: row.id,
      companyId: row.companyId,
      title: row.title,
      body: row.body,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
