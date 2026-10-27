import { Request, Response, NextFunction } from "express";
import { toPublicError } from "../public-error";
import ResponseMessage from "../responseMessage/message.class";

export default (asyncFunction: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      return await asyncFunction(req, res, next);
    } catch (error) {
      return ResponseMessage.send(res, ResponseMessage.error(toPublicError(error)));
    }
  };
};

export const socketWrapper = (handler: (...args: unknown[]) => Promise<void>) => {
  return async (socket: import("socket.io").Socket, ...args: unknown[]) => {
    try {
      await handler(socket, ...args);
    } catch (error: unknown) {
      const mapped = toPublicError(error);
      console.error("Error handling socket event:", mapped.message);
      socket.emit("app_error", { message: mapped.message });
    }
  };
};
