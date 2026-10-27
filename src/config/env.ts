import { config } from "dotenv";
import fs from "fs";
import path from "path";

config();

function resolveSslRootCert(certPath: string): string {
  const trimmed = certPath.trim();
  if (!trimmed) return "";
  return path.isAbsolute(trimmed) ? trimmed : path.resolve(process.cwd(), trimmed);
}

function resolveDatabaseUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  const isPostgres = value.startsWith("postgres://") || value.startsWith("postgresql://");
  if (!isPostgres) return value;

  try {
    const url = new URL(value);
    const sslMode =
      process.env.DATABASE_SSLMODE?.trim() ||
      process.env.PGSSLMODE?.trim() ||
      url.searchParams.get("sslmode") ||
      "";
    const sslRoot =
      process.env.DATABASE_SSL_ROOT_CERT?.trim() ||
      process.env.PGSSLROOTCERT?.trim() ||
      url.searchParams.get("sslrootcert") ||
      "";
    if (sslMode) url.searchParams.set("sslmode", sslMode);
    if (sslRoot) {
      const absolute = resolveSslRootCert(sslRoot);
      if (!fs.existsSync(absolute)) {
        console.warn(`DATABASE SSL root cert not found at ${absolute}`);
      }
      url.searchParams.set("sslrootcert", absolute);
    }
    const resolved = url.toString();
    process.env.DATABASE_URL = resolved;
    return resolved;
  } catch {
    return value;
  }
}

type JwtExpiry = "30m" | "1h" | "1d" | "7d" | "30d";

export const PORT: number | string = process.env.PORT || 8080;
export const DATABASE_URL: string = resolveDatabaseUrl(process.env.DATABASE_URL || "");
export const DATABASE_PROVIDER: string = process.env.DATABASE_PROVIDER || process.env.DB_PROVIDER || "";
export const JWT_SECRET: string = process.env.JWT_SECRET || "";
export const JWT_EXPIRES_IN: JwtExpiry = (process.env.JWT_EXPIRES_IN as JwtExpiry) || "1h";
export const JWT_REMEMBER_EXPIRES_IN: JwtExpiry =
  (process.env.JWT_REMEMBER_EXPIRES_IN as JwtExpiry) || "7d";
export const MODE: string = process.env.MODE || "development";

const transactionModes = new Set(["production", "live", "staging", "prod"]);

export const ENABLE_DB_TRANSACTIONS =
  process.env.DATABASE_TRANSACTIONS === "true" ||
  (process.env.DATABASE_TRANSACTIONS !== "false" && transactionModes.has(MODE.toLowerCase()));

export const HTTP_LOG: string = process.env.HTTP_LOG || "";
export const APP_NAME = process.env.APP_NAME || "MyApp";
export const APP_URL = process.env.APP_URL || "";
export const PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || process.env.APP_URL || "";
export const REDIS_URL = process.env.REDIS_URL || "";
export const QUEUE_PREFIX = (process.env.QUEUE_PREFIX || "app").replace(/[^a-z0-9-]/gi, "").toLowerCase() || "app";
export const SALT_ROUNDS = process.env.SALT_ROUNDS || "10";
export const CACHE_BACKEND = (process.env.CACHE_BACKEND || "memory").toLowerCase();

export const STORAGE_TYPE = process.env.STORAGE_TYPE || "local";
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "104857600", 10);
export const MAX_IMAGE_SIZE = parseInt(process.env.MAX_IMAGE_SIZE || "10485760", 10);

export const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || "";
export const AWS_REGION = process.env.AWS_REGION || "us-east-1";
export const AWS_S3_ROLE = process.env.AWS_S3_ROLE || "";
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "";
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "";
export const AWS_S3_BUCKET_URL = process.env.AWS_S3_BUCKET_URL || "";

export const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || "uploads";
export const LOCAL_PUBLIC_URL = process.env.LOCAL_PUBLIC_URL || "http://localhost:8080";

export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "";
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "";
export const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "app";

export const SMTP_HOST = process.env.SMTP_HOST || "";
export const SMTP_PORT = process.env.SMTP_PORT || "";
export const SMTP_USER = process.env.SMTP_USER || "";
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
export const EMAIL_SENDER = process.env.FROM_EMAIL_ADDRESS || "";
export const EMAIL_USER = process.env.FROM_USER_NAME || APP_NAME;
export const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "console";

export const DOMAIN_EVENT_OUTBOX_MAX_ATTEMPTS = parseInt(
  process.env.DOMAIN_EVENT_OUTBOX_MAX_ATTEMPTS || "5",
  10,
);
export const DOMAIN_EVENT_EMAIL_MAX_ATTEMPTS = parseInt(
  process.env.DOMAIN_EVENT_EMAIL_MAX_ATTEMPTS || "5",
  10,
);
export const PASSWORD_RESET_CODE_TTL_MS = parseInt(
  process.env.PASSWORD_RESET_CODE_TTL_MS || String(60 * 60 * 1000),
  10,
);
export const PASSWORD_RESET_CODE_LENGTH = parseInt(process.env.PASSWORD_RESET_CODE_LENGTH || "6", 10);
export const EMAIL_VERIFICATION_TTL_MS = PASSWORD_RESET_CODE_TTL_MS;
