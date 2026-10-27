import { Request } from "express";
import { asStringList } from "../core/coercion.utils";

export function readPermissions(value: unknown): string[] {
  if (typeof value === "string") {
    try {
      return asStringList(JSON.parse(value));
    } catch {
      return [];
    }
  }
  return asStringList(value);
}

export function clientIp(req: Pick<Request, "ip" | "socket" | "headers">): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}
