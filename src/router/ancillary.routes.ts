import { Router, Response, Request } from "express";
import { APP_NAME, MODE } from "../config/env";
import { prisma } from "../config/db";
import { successMessage, errorMessage } from "../core/responseMessage/message";
import ResponseMessage from "../core/responseMessage/message.class";

export const AncillaryRoutes = Router();

AncillaryRoutes.get("/", (_req: Request, res: Response) => {
  ResponseMessage.send(res, successMessage({ name: APP_NAME, version: "1.0", mode: MODE }, APP_NAME));
});

AncillaryRoutes.get("/ready", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    ResponseMessage.send(res, successMessage({ ok: true }, "Ready"));
  } catch {
    ResponseMessage.send(res, errorMessage({ message: "Database unavailable" }, "Database unavailable", 503));
  }
});

AncillaryRoutes.all("*", (req: Request, res: Response) => {
  ResponseMessage.send(
    res,
    errorMessage(
      { method: req.method, path: req.originalUrl, timestamp: new Date().toISOString() },
      "The requested resource could not be found",
      404,
    ),
  );
});

export default AncillaryRoutes;
