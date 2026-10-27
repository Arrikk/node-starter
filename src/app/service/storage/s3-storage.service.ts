import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { IStorageConfig, IStorageService, IUploadResult, MediaKeyPrefix } from "./types";

export default class S3StorageService implements IStorageService {
  private s3: AWS.S3;
  private bucket: string;
  private config: IStorageConfig;

  constructor(config: IStorageConfig) {
    if (!config.s3?.bucket || !config.s3.region) throw new Error("S3 bucket and region are required");
    this.config = config;
    this.bucket = config.s3.bucket;
    this.s3 = new AWS.S3({
      region: config.s3.region,
      accessKeyId: config.s3.accessKeyId || undefined,
      secretAccessKey: config.s3.secretAccessKey || undefined,
    });
  }

  async uploadMedia(fileBuffer: Buffer, mimeType: string, userId: string, keyPrefix: MediaKeyPrefix): Promise<IUploadResult> {
    const check = this.validateFile(mimeType, fileBuffer.length);
    if (!check.valid) throw new Error(check.error || "Invalid file");
    const extension = mimeType.split("/")[1] || "bin";
    const key = `${keyPrefix}/${userId}/${uuidv4()}.${extension}`;
    await this.s3.upload({ Bucket: this.bucket, Key: key, Body: fileBuffer, ContentType: mimeType }).promise();
    const bucketUrl = this.config.s3?.bucketUrl?.replace(/\/$/, "");
    return {
      url: bucketUrl ? `${bucketUrl}/${key}` : `https://${this.bucket}.s3.amazonaws.com/${key}`,
      key,
      bucket: this.bucket,
      fileSize: fileBuffer.length,
      mimeType,
      storageType: "s3",
    };
  }

  async deleteMedia(key: string): Promise<boolean> {
    await this.s3.deleteObject({ Bucket: this.bucket, Key: key }).promise();
    return true;
  }

  async getSignedUrl(key: string, expiresInSeconds = 900): Promise<string> {
    return this.s3.getSignedUrlPromise("getObject", { Bucket: this.bucket, Key: key, Expires: expiresInSeconds });
  }

  validateFile(mimeType: string, fileSize: number): { valid: boolean; error?: string } {
    const limit = mimeType.startsWith("image/") ? this.config.maxImageSize : this.config.maxFileSize;
    if (fileSize > limit) return { valid: false, error: "File is too large" };
    return { valid: true };
  }
}
