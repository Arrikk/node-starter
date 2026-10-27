export type EmailProviderType = "console" | "nodeMailer";

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export interface SendBulkMailInput {
  bcc: string[];
  subject: string;
  html: string;
}
