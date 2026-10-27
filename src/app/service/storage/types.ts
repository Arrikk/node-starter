export enum EMediaContentType {
  image = "image",
  video = "video",
  audio = "audio",
  text = "text",
  document = "document",
}

export type MediaKeyPrefix = "media" | "avatars" | "uploads" | "files" | "documents";

export interface IUploadResult {
  url: string;
  key: string;
  bucket?: string;
  expiresAt?: Date;
  fileSize: number;
  mimeType: string;
  storageType: "local" | "s3" | "cloudinary";
}

export interface IStorageService {
  uploadMedia(fileBuffer: Buffer, mimeType: string, userId: string, keyPrefix: MediaKeyPrefix): Promise<IUploadResult>;
  deleteMedia(key: string): Promise<boolean>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  validateFile(mimeType: string, fileSize: number): { valid: boolean; error?: string };
}

export interface IStorageConfig {
  storageType: "local" | "s3" | "cloudinary";
  s3?: {
    bucket: string;
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    role?: string;
    bucketUrl?: string;
  };
  local?: { uploadDir: string; publicUrl: string };
  cloudinary?: { cloudName: string; apiKey: string; apiSecret: string; folder?: string };
  maxFileSize: number;
  maxImageSize: number;
}
