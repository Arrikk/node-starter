import multer from "multer";
import { NextFunction, Request, Response } from "express";
import { MAX_FILE_SIZE } from "../config/env";
import ResponseMessage from "../core/responseMessage/message.class";

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new Error(`File type ${file.mimetype} is not allowed`));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 10 },
});

export function handleUploadErrors(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (!err) {
    next();
    return;
  }
  const message = err instanceof Error ? err.message : "Upload failed";
  ResponseMessage.send(res, ResponseMessage.error({ message }, message, 400));
}
