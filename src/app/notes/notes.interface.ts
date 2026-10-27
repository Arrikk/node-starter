export interface NoteDto {
  id: string;
  companyId: number;
  title: string;
  body: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoteWrite {
  title: string;
  body?: string;
}
