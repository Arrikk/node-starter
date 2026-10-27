import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

function loadDotEnv() {
  const envPath = resolve(ROOT, ".env");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function resolveDatabaseUrl() {
  const value = (process.env.DATABASE_URL || "").trim();
  if (!value.startsWith("postgres://") && !value.startsWith("postgresql://")) {
    return;
  }
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
      const absolute = isAbsolute(sslRoot) ? sslRoot : resolve(ROOT, sslRoot);
      url.searchParams.set("sslrootcert", absolute);
    }
    process.env.DATABASE_URL = url.toString();
  } catch {
    return;
  }
}

loadDotEnv();
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/app";
}
resolveDatabaseUrl();

export function resolveDbProvider(env = process.env) {
  const explicit = (env.DB_PROVIDER || env.DATABASE_PROVIDER || "").trim().toLowerCase();
  if (explicit === "postgresql" || explicit === "mysql") return explicit;
  const url = (env.DATABASE_URL || "").trim().toLowerCase();
  if (url.startsWith("mysql:") || url.startsWith("mysql2:")) return "mysql";
  if (url.startsWith("postgres:") || url.startsWith("postgresql:")) return "postgresql";
  return "postgresql";
}

function schemaPath(provider) {
  return resolve(ROOT, "prisma", provider, "schema.prisma");
}

function runPrisma(args) {
  const result = spawnSync("npx", ["prisma", ...args], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (result.error) throw result.error;
  if (result.status) process.exit(result.status);
}

const command = process.argv[2];
const provider = resolveDbProvider();

if (!command || !["generate", "generate:all", "migrate:dev", "migrate:deploy"].includes(command)) {
  console.error("Usage: node scripts/prisma-env.mjs <generate|generate:all|migrate:dev|migrate:deploy>");
  process.exit(1);
}

if (command === "generate:all") {
  runPrisma(["generate", "--schema", schemaPath("postgresql")]);
  runPrisma(["generate", "--schema", schemaPath("mysql")]);
  process.exit(0);
}

const schema = schemaPath(provider);
console.log(`DB provider: ${provider}`);
console.log(`Prisma schema: prisma/${provider}/schema.prisma`);

if (command === "generate") {
  runPrisma(["generate", "--schema", schema]);
}

if (command === "migrate:deploy") {
  runPrisma(["migrate", "deploy", "--schema", schema, ...process.argv.slice(3)]);
}

if (command === "migrate:dev") {
  runPrisma(["migrate", "dev", "--schema", schema, ...process.argv.slice(3)]);
}
