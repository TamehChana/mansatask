import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as fs from 'fs';
import * as path from 'path';

export interface UploadResult {
  url: string;
  key: string;
  storageType: 's3' | 'local';
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly useS3: boolean;
  private readonly localStorageDir: string;

  constructor(private readonly configService: ConfigService) {
    const awsConfig = this.configService.get('config.aws');
    const nodeEnv = this.configService.get<string>('config.nodeEnv') || 'development';

    // Check if AWS credentials are provided
    this.useS3 = !!(
      awsConfig?.accessKeyId &&
      awsConfig?.secretAccessKey &&
      awsConfig?.s3BucketName
    );

    if (this.useS3) {
      this.bucketName = awsConfig.s3BucketName;
      this.region = awsConfig.s3Region || 'us-east-1';

      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: awsConfig.accessKeyId,
          secretAccessKey: awsConfig.secretAccessKey,
        },
      });

      this.logger.log(`✅ S3 storage enabled (bucket: ${this.bucketName}, region: ${this.region})`);
    } else {
      this.logger.warn(
        `⚠️  S3 credentials not provided - using local storage. ` +
        `This is fine for development, but S3 is recommended for production.`,
      );
    }

    // Local storage directory (fallback)
    this.localStorageDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.localStorageDir)) {
      fs.mkdirSync(this.localStorageDir, { recursive: true });
    }
  }

  /**
   * Upload a file to S3 or local storage
   * @param file Buffer or file path
   * @param key S3 key or local file path (e.g., 'products/image.jpg' or 'receipts/receipt.pdf')
   * @param contentType MIME type (e.g., 'image/jpeg', 'application/pdf')
   * @returns Upload result with URL
   */
  async uploadFile(
    file: Buffer | string,
    key: string,
    contentType?: string,
  ): Promise<UploadResult> {
    if (this.useS3 && this.s3Client) {
      return this.uploadToS3(file, key, contentType);
    } else {
      return this.uploadToLocal(file, key);
    }
  }

  /**
   * Upload file to AWS S3
   */
  private async uploadToS3(
    file: Buffer | string,
    key: string,
    contentType?: string,
  ): Promise<UploadResult> {
    if (!this.s3Client || !this.bucketName) {
      throw new Error('S3 client not initialized');
    }

    try {
      // Read file if it's a path
      const fileBuffer = typeof file === 'string' ? fs.readFileSync(file) : file;

      // Upload to S3 without ACL (bucket policies should handle public access if needed)
      // Note: Modern S3 buckets have ACLs disabled by default
      // Use bucket policies or presigned URLs for public access instead
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType || this.getContentType(key),
          // ACL removed - use bucket policies for public access if needed
          // Objects will be private by default, accessible via our proxy endpoint
        },
      });

      await upload.done();

      // Generate S3 URL
      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      this.logger.log(`File uploaded to S3: ${key}`);

      return {
        url,
        key,
        storageType: 's3',
      };
    } catch (error) {
      this.logger.error(`Failed to upload to S3: ${error.message}`, error.stack);
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  /**
   * Upload file to local storage (fallback)
   */
  private async uploadToLocal(file: Buffer | string, key: string): Promise<UploadResult> {
    try {
      const filePath = path.join(this.localStorageDir, key);
      const dir = path.dirname(filePath);

      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      if (typeof file === 'string') {
        // If it's a path, copy the file
        fs.copyFileSync(file, filePath);
      } else {
        // If it's a buffer, write it
        fs.writeFileSync(filePath, file);
      }

      // Generate local URL (relative to uploads directory)
      const url = `/uploads/${key}`;

      this.logger.log(`File uploaded to local storage: ${filePath}`);

      return {
        url,
        key,
        storageType: 'local',
      };
    } catch (error) {
      this.logger.error(`Failed to upload to local storage: ${error.message}`, error.stack);
      throw new Error(`Local upload failed: ${error.message}`);
    }
  }

  /**
   * Delete a file from S3 or local storage
   */
  async deleteFile(key: string): Promise<void> {
    if (this.useS3 && this.s3Client) {
      await this.deleteFromS3(key);
    } else {
      await this.deleteFromLocal(key);
    }
  }

  /**
   * Delete file from S3
   */
  private async deleteFromS3(key: string): Promise<void> {
    if (!this.s3Client || !this.bucketName) {
      throw new Error('S3 client not initialized');
    }

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      this.logger.log(`File deleted from S3: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete from S3: ${error.message}`, error.stack);
      throw new Error(`S3 delete failed: ${error.message}`);
    }
  }

  /**
   * Delete file from local storage
   */
  private async deleteFromLocal(key: string): Promise<void> {
    try {
      const filePath = path.join(this.localStorageDir, key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`File deleted from local storage: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete from local storage: ${error.message}`, error.stack);
      throw new Error(`Local delete failed: ${error.message}`);
    }
  }

  /**
   * Get file content from S3 or local storage
   */
  async getFile(key: string): Promise<Buffer> {
    if (this.useS3 && this.s3Client) {
      return this.getFromS3(key);
    } else {
      return this.getFromLocal(key);
    }
  }

  /**
   * Get file from S3
   */
  private async getFromS3(key: string): Promise<Buffer> {
    if (!this.s3Client || !this.bucketName) {
      throw new Error('S3 client not initialized');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const chunks: Uint8Array[] = [];

      if (response.Body) {
        for await (const chunk of response.Body as any) {
          chunks.push(chunk);
        }
      }

      return Buffer.concat(chunks);
    } catch (error) {
      this.logger.error(`Failed to get file from S3: ${error.message}`, error.stack);
      throw new Error(`S3 get failed: ${error.message}`);
    }
  }

  /**
   * Get file from local storage
   */
  private getFromLocal(key: string): Buffer {
    try {
      const filePath = path.join(this.localStorageDir, key);
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      return fs.readFileSync(filePath);
    } catch (error) {
      this.logger.error(`Failed to get file from local storage: ${error.message}`, error.stack);
      throw new Error(`Local get failed: ${error.message}`);
    }
  }

  /**
   * Get content type from file extension
   */
  private getContentType(key: string): string {
    const ext = path.extname(key).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.svg': 'image/svg+xml',
    };
    return contentTypes[ext] || 'application/octet-stream';
  }

  /**
   * Check if S3 is configured and available
   */
  isS3Enabled(): boolean {
    return this.useS3;
  }
}

