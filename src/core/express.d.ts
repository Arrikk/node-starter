import { AppPrismaClient } from "../config/db";
import { Server } from "socket.io";
import { AuthenticatedUser } from "../middlewares/authenticate";

declare global {
  namespace Express {
    interface Request {
      prisma?: AppPrismaClient;
      useDbTransaction?: boolean;
      get(name: "io"): Server;
      user?: AuthenticatedUser;
      companyId?: number | null;
    }
  }
}

export {};
