import { Request } from "express";

export interface APPRequest extends Request {
  prisma?: import("../../config/db").AppPrismaClient;
  useDbTransaction?: boolean;
}
