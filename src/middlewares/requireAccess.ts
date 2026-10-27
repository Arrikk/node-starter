import { NextFunction, Request, Response } from "express";
import ResponseMessage from "../core/responseMessage/message.class";

function denied(res: Response) {
  return ResponseMessage.send(res, ResponseMessage.error({ message: "Forbidden" }, "Forbidden", 403));
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) return denied(res);
    return next();
  };
}

export function requirePermissions(...needed: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const granted = req.user?.permissions ?? [];
    const ok = granted.includes("*") || needed.every((item) => granted.includes(item));
    if (!ok) return denied(res);
    return next();
  };
}
