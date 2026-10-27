import { createLogger } from "./logger";
import {
  ApplicationError,
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
} from "./errors";

const log = createLogger("errors");

const UNIQUE_FIELDS: Record<string, string> = {
  email: "This email is already registered",
  phone: "This phone number is already registered",
  phone_number: "This phone number is already registered",
  phonenumber: "This phone number is already registered",
  code: "This code is already in use",
};

const CONSTRAINT_NOISE = new Set(["key", "idx", "index", "unique", "users", "user", "companies", "company"]);

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function prismaCode(error: unknown): string | null {
  const record = asRecord(error);
  const code = record.code;
  if (typeof code === "string" && /^P\d{4}$/.test(code)) return code;
  const name = typeof record.name === "string" ? record.name : "";
  const message = error instanceof Error ? error.message : "";
  if (
    name.startsWith("PrismaClient") ||
    message.includes("Invalid `prisma.") ||
    message.includes("Unique constraint failed") ||
    message.includes("invocation in")
  ) {
    return typeof code === "string" ? code : "PRISMA";
  }
  return null;
}

function uniqueTarget(error: unknown): string {
  const meta = asRecord(asRecord(error).meta);
  const parts = [meta.target, meta.constraint, meta.model_name, meta.modelName];
  const collected: string[] = [];
  for (const part of parts) {
    if (typeof part === "string" && part.trim()) collected.push(part.trim());
    else if (Array.isArray(part)) collected.push(...part.map((item) => String(item)));
  }
  const message = error instanceof Error ? error.message : "";
  const constraint = message.match(/constraint:\s*`([^`]+)`/i);
  if (constraint?.[1]) collected.push(constraint[1]);
  return collected.join(" ");
}

function fieldTokens(value: string): string[] {
  return value
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function uniqueMessage(error: unknown): string {
  const tokens = fieldTokens(uniqueTarget(error));
  for (let index = 0; index < tokens.length; index += 1) {
    const single = tokens[index];
    if (UNIQUE_FIELDS[single]) return UNIQUE_FIELDS[single];
    const pair = tokens[index + 1] ? `${single}_${tokens[index + 1]}` : "";
    if (pair && UNIQUE_FIELDS[pair]) return UNIQUE_FIELDS[pair];
  }
  const field = [...tokens].reverse().find((token) => !CONSTRAINT_NOISE.has(token));
  if (field) return `This ${field.replace(/_/g, " ").toUpperCase()} is already in use`;
  return "A unique field is already in use";
}

function isUnsafeMessage(message: string) {
  return (
    message.includes("Invalid `prisma.") ||
    message.includes("Unique constraint failed") ||
    message.includes("invocation in") ||
    message.includes("\n") ||
    /\/Users\/|\/home\/|\\\\/.test(message)
  );
}

export function toPublicError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) return error;

  const code = prismaCode(error);
  if (code) {
    log.error("Database request failed", {
      code,
      name: error instanceof Error ? error.name : undefined,
    });
    const message = error instanceof Error ? error.message : "";
    if (code === "P2002" || /Unique constraint failed/i.test(message)) {
      return new ConflictError(uniqueMessage(error));
    }
    if (code === "P2025") return new NotFoundError("Record was not found");
    if (code === "P2003" || code === "P2000" || code === "P2011" || code === "P2012") {
      return new BadRequestError("The request could not be saved");
    }
    return new InternalServerError("Something went wrong. Please try again.");
  }

  if (error instanceof Error) {
    if (isUnsafeMessage(error.message)) {
      log.error("Unsafe error message suppressed", { name: error.name });
      return new InternalServerError("Something went wrong. Please try again.");
    }
    const status = (error as Error & { statusCode?: number }).statusCode;
    if (typeof status === "number" && status >= 400 && status < 600) {
      return new ApplicationError(status, error.message);
    }
    log.error("Unhandled error", { name: error.name, message: error.message });
    return new InternalServerError("Something went wrong. Please try again.");
  }

  log.error("Unknown error", {});
  return new InternalServerError("Something went wrong. Please try again.");
}
