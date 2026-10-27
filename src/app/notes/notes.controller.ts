import asyncHandler from "../../core/request/async.request";
import ResponseMessage from "../../core/responseMessage/message.class";
import { successMessage } from "../../core/responseMessage/message";
import { NotesService } from "./notes.service";

export const listNotes = asyncHandler(async (req, res) => {
  const result = await NotesService.list(req.companyId!, req.query);
  return ResponseMessage.send(res, successMessage(result, "Notes"));
});

export const getNote = asyncHandler(async (req, res) => {
  const result = await NotesService.get(req.companyId!, String(req.params.id));
  return ResponseMessage.send(res, successMessage(result, "Note"));
});

export const createNote = asyncHandler(async (req, res) => {
  const result = await NotesService.create(req.companyId!, req.user!.id, req.body);
  return ResponseMessage.send(res, successMessage(result, "Note created", 201));
});

export const updateNote = asyncHandler(async (req, res) => {
  const result = await NotesService.update(req.companyId!, req.user!.id, String(req.params.id), req.body);
  return ResponseMessage.send(res, successMessage(result, "Note updated"));
});

export const deleteNote = asyncHandler(async (req, res) => {
  const result = await NotesService.remove(req.companyId!, req.user!.id, String(req.params.id));
  return ResponseMessage.send(res, successMessage(result, "Note deleted"));
});
