import { NextFunction, Request, Response } from "express";
import ResponseMessage from "../core/responseMessage/message.class";

export function requireEmailVerified(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.emailVerifiedAt) {
    return ResponseMessage.send(
      res,
      ResponseMessage.error({ message: "Verify your email before continuing" }, "Email verification required", 403),
    );
  }
  return next();
}
