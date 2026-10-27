import { PrismaClient as PostgresPrismaClient } from "@prisma/client-pg";
import { PrismaClient as MysqlPrismaClient } from "@prisma/client-mysql";
import { DATABASE_PROVIDER, DATABASE_URL } from "./env";

export type DbProvider = "postgresql" | "mysql";
export type AppPrismaClient = PostgresPrismaClient;

function inferProvider(): DbProvider {
  const explicit = DATABASE_PROVIDER.toLowerCase();
  if (explicit === "mysql" || explicit === "mariadb") return "mysql";
  if (explicit === "postgresql" || explicit === "postgres" || explicit === "pg") return "postgresql";
  if (DATABASE_URL.startsWith("mysql")) return "mysql";
  return "postgresql";
}

export const dbProvider: DbProvider = inferProvider();

const log: Array<"error" | "warn"> = process.env.MODE === "development" ? ["error", "warn"] : ["error"];

const globalForPrisma = globalThis as unknown as { prisma?: AppPrismaClient };

function createClient(): AppPrismaClient {
  if (dbProvider === "mysql") {
    return new MysqlPrismaClient({ log }) as unknown as AppPrismaClient;
  }
  return new PostgresPrismaClient({ log });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.MODE !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function connectDB(): Promise<void> {
  if (!DATABASE_URL) {
    throw new Error("Configure DATABASE_URL in your .env file");
  }
  await prisma.$connect();
  console.log(dbProvider === "mysql" ? "Connected to MySQL" : "Connected to PostgreSQL");
}

export default connectDB;
