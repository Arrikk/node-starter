import { body, param, query } from "express-validator";
import validate from "../../core/validator";

export const listNotesRules = validate([
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
]);

export const noteIdRules = validate([param("id").isUUID()]);

export const createNoteRules = validate([
  body("title").trim().isLength({ min: 1, max: 255 }),
  body("body").optional().isString(),
]);

export const updateNoteRules = validate([
  param("id").isUUID(),
  body("title").optional().trim().isLength({ min: 1, max: 255 }),
  body("body").optional().isString(),
]);
