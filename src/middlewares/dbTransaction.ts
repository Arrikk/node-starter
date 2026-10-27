import { NextFunction, Request, Response } from "express";
import { ENABLE_DB_TRANSACTIONS } from "../config/env";
import { prisma } from "../config/db";

export default function dbTransaction(req: Request, _res: Response, next: NextFunction) {
  req.prisma = prisma;
  req.useDbTransaction = ENABLE_DB_TRANSACTIONS;
  next();
}
