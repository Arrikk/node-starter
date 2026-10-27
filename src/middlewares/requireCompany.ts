import { NextFunction, Request, Response } from "express";
import ResponseMessage from "../core/responseMessage/message.class";

export function requireCompany(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.companyId) {
    return ResponseMessage.send(
      res,
      ResponseMessage.error({ message: "Current company is required" }, "Current company is required", 403),
    );
  }
  req.companyId = req.user.companyId;
  return next();
}
