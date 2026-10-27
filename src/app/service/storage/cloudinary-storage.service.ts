import { v2 as cloudinary } from "cloudinary";
import { v4 as uuidv4 } from "uuid";
import { IStorageConfig, IStorageService, IUploadResult, MediaKeyPrefix } from "./types";

export default class CloudinaryStorageService implements IStorageService {
  private folder: string;
  private config: IStorageConfig;

  constructor(config: IStorageConfig) {
    if (!config.cloudinary?.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
      throw new Error("Cloudinary credentials are required");
    }
    this.config = config;
    this.folder = config.cloudinary.folder || "app";
    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
    });
  }

  async uploadMedia(fileBuffer: Buffer, mimeType: string, userId: string, keyPrefix: MediaKeyPrefix): Promise<IUploadResult> {
    const check = this.validateFile(mimeType, fileBuffer.length);
    if (!check.valid) throw new Error(check.error || "Invalid file");
    const publicId = `${this.folder}/${keyPrefix}/${userId}/${uuidv4()}`;
    const uploaded = await cloudinary.uploader.upload(`data:${mimeType};base64,${fileBuffer.toString("base64")}`, {
      public_id: publicId,
      resource_type: "auto",
    });
    return {
      url: uploaded.secure_url,
      key: uploaded.public_id,
      fileSize: fileBuffer.length,
      mimeType,
      storageType: "cloudinary",
    };
  }

  async deleteMedia(key: string): Promise<boolean> {
    const result = await cloudinary.uploader.destroy(key);
    return result.result === "ok" || result.result === "not found";
  }

  async getSignedUrl(key: string): Promise<string> {
    return cloudinary.url(key, { secure: true });
  }

  validateFile(mimeType: string, fileSize: number): { valid: boolean; error?: string } {
    const limit = mimeType.startsWith("image/") ? this.config.maxImageSize : this.config.maxFileSize;
    if (fileSize > limit) return { valid: false, error: "File is too large" };
    return { valid: true };
  }
}
