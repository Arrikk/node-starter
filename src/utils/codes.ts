import { randomBytes, randomInt, randomUUID } from "crypto";
import { PASSWORD_RESET_CODE_LENGTH } from "../config/env";

export function companyCode(): string {
  return randomBytes(8).toString("hex");
}

export function numericCode(length = PASSWORD_RESET_CODE_LENGTH): string {
  const size = Math.min(12, Math.max(4, length));
  return String(randomInt(0, 10 ** size)).padStart(size, "0");
}

export function newSessionId(): string {
  return randomUUID();
}
