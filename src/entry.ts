import { PORT, LOCAL_UPLOAD_DIR } from "./config/env";
import express from "express";
import path from "path";
import connectDB from "./config/db";
import cors from "cors";
import bodyParser from "body-parser";
import http from "http";
import { Server } from "socket.io";
import { httpRequestLogger, logRequestBody } from "./core/http-logger.middleware";
import { domainEventContextMiddleware } from "./core/events/domain-event.context";
import AncillaryRoutes from "./router/ancillary.routes";
import { ApplicationError } from "./core/errors";
import { toPublicError } from "./core/public-error";
import ResponseMessage from "./core/responseMessage/message.class";
import { rateLimit } from "./middlewares/rateLimit";
import dbTransaction from "./middlewares/dbTransaction";
import { closeAllQueues } from "./core/bullmq/bullmq.config";

const server = express();
const httpServer = http.createServer(server);
const io = new Server(httpServer, {
  pingTimeout: 60000,
  pingInterval: 25000,
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["websocket", "polling"],
});

export type RouteHandler = express.Router | express.RequestHandler;
export type RouteEntry = [string, RouteHandler] | RouteHandler;

export interface RouteGroup {
  path: string;
  routes: RouteEntry[];
}

export async function init(routeGroups: RouteGroup[], port?: number): Promise<void> {
  const listenPort = port ?? (PORT ? +PORT : 0);
  if (!listenPort) throw new Error("Port is not provided. Set PORT in .env");

  await connectDB();

  try {
    const { registerDomainEventListeners } = require("./core/events/register-domain-event-listeners") as typeof import("./core/events/register-domain-event-listeners");
    registerDomainEventListeners();
    console.log("Domain event listeners registered.");
  } catch (err) {
    console.error("Failed to register domain event listeners:", err);
  }

  server.use(bodyParser.json({ limit: "10mb" }));
  server.use(cors({ origin: "*" }));
  server.use(rateLimit());
  server.use(dbTransaction);
  server.use(domainEventContextMiddleware);
  server.use(logRequestBody);
  server.use(httpRequestLogger);
  server.set("io", io);
  server.use("/uploads", express.static(path.join(process.cwd(), LOCAL_UPLOAD_DIR)));

  routeGroups.forEach((group) => {
    group.routes.forEach((entry) => {
      let subPath = "";
      let handler: RouteHandler = entry as RouteHandler;
      if (Array.isArray(entry)) {
        subPath = entry[0];
        handler = entry[1];
      }
      const fullPath = `/${group.path}/${subPath || ""}`.replace(/\/+/g, "/");
      server.use(fullPath, handler);
    });
  });

  server.use(AncillaryRoutes);

  server.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) return next(err);
    if (!(err instanceof ApplicationError)) console.error(err);
    return ResponseMessage.send(res, ResponseMessage.error(toPublicError(err)));
  });

  httpServer.listen(listenPort, "0.0.0.0", () => console.log("Listening on port " + listenPort));
  registerGracefulShutdown();
}

function registerGracefulShutdown() {
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}, shutting down gracefully...`);
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    await closeAllQueues().catch((error) => console.error("Failed to close queues:", error));
    process.exit(0);
  };
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}

export { io };
