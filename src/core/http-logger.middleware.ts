import morgan from "morgan";
import { NextFunction, Request, Response } from "express";
import { HTTP_LOG, MODE } from "../config/env";

const devModes = new Set(["development", "dev", "test"]);

function resolveFormat(): string | false {
  const configured = (HTTP_LOG || "").trim().toLowerCase();
  if (configured === "off" || configured === "false" || configured === "0") return false;
  if (["dev", "combined", "tiny", "short"].includes(configured)) return configured;
  return devModes.has(MODE) ? "dev" : "combined";
}

const format = resolveFormat();

const skipStatic = (req: Request) => {
  if (req.method === "OPTIONS") return true;
  const url = req.originalUrl || req.url || "";
  return url.startsWith("/uploads") || url.startsWith("/resources");
};

export const httpRequestLogger =
  format === false
    ? (_req: Request, _res: Response, next: NextFunction) => next()
    : morgan(format, { skip: skipStatic });

export function logRequestBody(req: Request, _res: Response, next: NextFunction) {
  if (!devModes.has(MODE)) {
    next();
    return;
  }
  if (!["POST", "PUT", "PATCH"].includes(req.method)) {
    next();
    return;
  }
  if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
    const safe = { ...req.body } as Record<string, unknown>;
    for (const key of ["password", "token", "code", "secret"]) {
      if (key in safe) safe[key] = "[redacted]";
    }
    console.log(`→ ${req.method} ${req.originalUrl} body`, safe);
  }
  next();
}
