import { validationResult } from "express-validator";
import ResponseMessage from "./responseMessage/message.class";

export default (schemas: unknown, _status: number = 400) => {
  const validationCheck = async (request: unknown, response: unknown, next: () => void) => {
    const errors = validationResult(request as Parameters<typeof validationResult>[0]);
    if (!errors.isEmpty()) {
      const mappedErrors = Object.entries(errors.mapped()).reduce(
        (accumulator: Record<string, string>, [key, value]) => {
          accumulator[key] = (value as { msg: string }).msg;
          return accumulator;
        },
        {},
      );
      const validationErrors = ResponseMessage.error(
        { ...mappedErrors, message: "Please check your inputs" },
        "Payload Validation Error",
        400,
      );
      return ResponseMessage.send(response as import("express").Response, validationErrors);
    }
    return next();
  };

  const schemaList = Array.isArray(schemas) ? schemas : schemas ? [schemas] : [];
  return [...schemaList, validationCheck];
};
