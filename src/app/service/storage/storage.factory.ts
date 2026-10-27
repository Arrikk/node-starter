import {
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
  AWS_S3_BUCKET,
  AWS_S3_BUCKET_URL,
  AWS_S3_ROLE,
  AWS_SECRET_ACCESS_KEY,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_FOLDER,
  LOCAL_PUBLIC_URL,
  LOCAL_UPLOAD_DIR,
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
  STORAGE_TYPE,
} from "../../../config/env";
import CloudinaryStorageService from "./cloudinary-storage.service";
import LocalStorageService from "./local-storage.service";
import S3StorageService from "./s3-storage.service";
import { IStorageConfig, IStorageService } from "./types";

export default class StorageFactory {
  static create(config: IStorageConfig = StorageFactory.config()): IStorageService {
    if (config.storageType === "s3") return new S3StorageService(config);
    if (config.storageType === "cloudinary") return new CloudinaryStorageService(config);
    if (config.storageType === "local") return new LocalStorageService(config);
    throw new Error(`Unsupported storage type: ${config.storageType}`);
  }

  static config(): IStorageConfig {
    const storageType = (STORAGE_TYPE as IStorageConfig["storageType"]) || "local";
    return {
      storageType,
      maxFileSize: MAX_FILE_SIZE,
      maxImageSize: MAX_IMAGE_SIZE,
      s3: {
        bucket: AWS_S3_BUCKET,
        region: AWS_REGION,
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
        role: AWS_S3_ROLE,
        bucketUrl: AWS_S3_BUCKET_URL,
      },
      local: { uploadDir: LOCAL_UPLOAD_DIR, publicUrl: LOCAL_PUBLIC_URL },
      cloudinary: {
        cloudName: CLOUDINARY_CLOUD_NAME,
        apiKey: CLOUDINARY_API_KEY,
        apiSecret: CLOUDINARY_API_SECRET,
        folder: CLOUDINARY_FOLDER,
      },
    };
  }
}
