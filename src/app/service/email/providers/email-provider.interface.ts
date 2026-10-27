import { SendBulkMailInput, SendMailInput } from "../email.types";

export interface IEmailProvider {
  send(input: SendMailInput): Promise<void>;
  sendBulk(input: SendBulkMailInput): Promise<void>;
}
