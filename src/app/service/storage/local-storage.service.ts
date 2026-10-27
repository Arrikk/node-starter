import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { IStorageConfig, IStorageService, IUploadResult, MediaKeyPrefix } from "./types";

const ALLOWED = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

export default class LocalStorageService implements IStorageService {
  private uploadDir: string;
  private publicUrl: string;
  private config: IStorageConfig;

  constructor(config: IStorageConfig) {
    if (!config.local) throw new Error("Local storage configuration is required");
    this.config = config;
    this.uploadDir = config.local.uploadDir;
    this.publicUrl = config.local.publicUrl.replace(/\/$/, "");
    fs.mkdirSync(path.resolve(process.cwd(), this.uploadDir), { recursive: true });
  }

  async uploadMedia(fileBuffer: Buffer, mimeType: string, userId: string, keyPrefix: MediaKeyPrefix): Promise<IUploadResult> {
    const check = this.validateFile(mimeType, fileBuffer.length);
    if (!check.valid) throw new Error(check.error || "Invalid file");
    const extension = mimeType.split("/")[1] || "bin";
    const fileName = `${uuidv4()}.${extension === "jpeg" ? "jpg" : extension}`;
    const relativeDir = path.join(keyPrefix, userId);
    const absoluteDir = path.resolve(process.cwd(), this.uploadDir, relativeDir);
    fs.mkdirSync(absoluteDir, { recursive: true });
    const key = path.posix.join(keyPrefix, userId, fileName);
    fs.writeFileSync(path.join(absoluteDir, fileName), fileBuffer);
    return {
      url: `${this.publicUrl}/uploads/${key}`,
      key,
      bucket: "local",
      fileSize: fileBuffer.length,
      mimeType,
      storageType: "local",
    };
  }

  async deleteMedia(key: string): Promise<boolean> {
    const filePath = path.resolve(process.cwd(), this.uploadDir, key);
    if (!fs.existsSync(filePath)) return false;
    fs.unlinkSync(filePath);
    return true;
  }

  async getSignedUrl(key: string): Promise<string> {
    return `${this.publicUrl}/uploads/${key}`;
  }

  validateFile(mimeType: string, fileSize: number): { valid: boolean; error?: string } {
    if (!ALLOWED.has(mimeType)) return { valid: false, error: "File type not allowed" };
    const limit = mimeType.startsWith("image/") ? this.config.maxImageSize : this.config.maxFileSize;
    if (fileSize > limit) return { valid: false, error: "File is too large" };
    return { valid: true };
  }
}
