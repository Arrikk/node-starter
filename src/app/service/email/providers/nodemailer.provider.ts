import { sendBulkMail, sendMail } from "../../../../config/node-mailer";
import { SendBulkMailInput, SendMailInput } from "../email.types";
import { IEmailProvider } from "./email-provider.interface";

export class NodemailerProvider implements IEmailProvider {
  async send(input: SendMailInput): Promise<void> {
    await sendMail(
      input.to,
      input.subject,
      input.html,
      input.attachments?.map((item) => ({
        filename: item.filename,
        content: item.content,
        contentType: item.contentType,
      })),
    );
  }

  async sendBulk(input: SendBulkMailInput): Promise<void> {
    await sendBulkMail(input.bcc, input.subject, input.html);
  }
}
