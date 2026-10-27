import { EMAIL_PROVIDER } from "../../../config/env";
import { EmailProviderType, SendBulkMailInput, SendMailInput } from "./email.types";
import { ConsoleEmailProvider } from "./providers/console.provider";
import { IEmailProvider } from "./providers/email-provider.interface";
import { NodemailerProvider } from "./providers/nodemailer.provider";

export class EmailService {
  private provider: IEmailProvider;

  constructor(type: EmailProviderType = EMAIL_PROVIDER as EmailProviderType) {
    this.provider = EmailService.createProvider(type);
  }

  static default(): EmailService {
    return new EmailService(EMAIL_PROVIDER as EmailProviderType);
  }

  static createProvider(type: EmailProviderType): IEmailProvider {
    if (type === "console") return new ConsoleEmailProvider();
    if (type === "nodeMailer") return new NodemailerProvider();
    throw new Error(`Unsupported email provider: ${type}`);
  }

  async send(input: SendMailInput): Promise<void> {
    await this.provider.send(input);
  }

  async sendBulk(input: SendBulkMailInput): Promise<void> {
    await this.provider.sendBulk(input);
  }
}
