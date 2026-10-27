import { SendBulkMailInput, SendMailInput } from "../email.types";
import { IEmailProvider } from "./email-provider.interface";

export class ConsoleEmailProvider implements IEmailProvider {
  async send(input: SendMailInput): Promise<void> {
    console.log(`[email] to=${input.to} subject=${input.subject}`);
    console.log(input.html);
  }

  async sendBulk(input: SendBulkMailInput): Promise<void> {
    console.log(`[email] bcc=${input.bcc.join(",")} subject=${input.subject}`);
    console.log(input.html);
  }
}
