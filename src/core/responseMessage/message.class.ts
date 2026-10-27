import { Response } from "express";
import { IResponseMessage } from "./messages.interface";
import { StatusCodes } from "../statusCodes";
import { ApplicationError } from "../errors";
import { toPublicError } from "../public-error";

class ResponseMessage {
  public static success<T>(data: unknown, message?: string, statusCode?: number): IResponseMessage<unknown, T> {
    const payload = data as Record<string, unknown> | null;
    return {
      message: message ?? (typeof payload?.message === "string" ? payload.message : "Success"),
      status: true,
      statusCode: statusCode ?? (typeof payload?.statusCode === "number" ? payload.statusCode : StatusCodes.OK),
      data: payload?.data ?? data,
    };
  }

  public static error<E>(data: unknown, message?: string, statusCode?: number): IResponseMessage<unknown, E> {
    if (data instanceof Error) {
      const mapped = data instanceof ApplicationError ? data : toPublicError(data);
      return {
        message: message ?? mapped.message,
        status: false,
        statusCode: statusCode ?? mapped.statusCode,
        error: (mapped.errors as E) ?? ({ message: mapped.message } as E),
      };
    }
    const err = data as Record<string, unknown> | null;
    const appError = data instanceof ApplicationError ? data : null;
    return {
      message: message ?? appError?.message ?? (typeof err?.message === "string" ? err.message : "Failed"),
      status: false,
      statusCode:
        statusCode ??
        appError?.statusCode ??
        (typeof err?.statusCode === "number" ? err.statusCode : StatusCodes.BAD_REQUEST),
      error: (err?.error as E) ?? (data as E),
    };
  }

  public static send(res: Response, data: unknown, message?: string, statusCode?: number): Response {
    if (data instanceof Error) {
      data = ResponseMessage.error(toPublicError(data));
    }
    const payload = data as Record<string, unknown> | null;
    const statusS = !payload?.error;
    const code =
      statusCode ??
      (typeof payload?.statusCode === "number" ? payload.statusCode : statusS ? StatusCodes.OK : StatusCodes.BAD_REQUEST);
    const response: IResponseMessage<unknown, unknown> = {
      message:
        message ??
        (typeof payload?.message === "string"
          ? payload.message
          : typeof (payload?.data as Record<string, unknown> | undefined)?.message === "string"
            ? ((payload?.data as Record<string, unknown>).message as string)
            : "Message"),
      status: statusS,
      statusCode: code,
      data: statusS ? (payload?.data ?? data) : null,
      error: statusS ? undefined : (payload?.error ?? data),
    };
    res.status(code).json(response);
    return res;
  }
}

export default ResponseMessage;
