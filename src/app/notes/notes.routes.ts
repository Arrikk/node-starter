import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { requireCompany } from "../../middlewares/requireCompany";
import { requireEmailVerified } from "../../middlewares/requireEmailVerified";
import { requirePermissions } from "../../middlewares/requireAccess";
import { createNote, deleteNote, getNote, listNotes, updateNote } from "./notes.controller";
import { createNoteRules, listNotesRules, noteIdRules, updateNoteRules } from "./notes.validator";

const router = Router();

router.use(authenticate, requireEmailVerified, requireCompany);
router.get("/", listNotesRules, listNotes);
router.post("/", requirePermissions("notes.write"), createNoteRules, createNote);
router.get("/:id", noteIdRules, getNote);
router.patch("/:id", requirePermissions("notes.write"), updateNoteRules, updateNote);
router.delete("/:id", requirePermissions("notes.write"), noteIdRules, deleteNote);

export default router;
