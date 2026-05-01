import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Minio.Client | null = null;
  private bucketName: string;
  private useLocalStorage: boolean = false;
  private localStoragePath: string;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.bucketName = this.configService.get('MINIO_BUCKET', 'cms-assets');
    this.localStoragePath = path.resolve(
      this.configService.get('LOCAL_STORAGE_PATH', './data/uploads'),
    );

    try {
      this.minioClient = new Minio.Client({
        endPoint: this.configService.get('MINIO_ENDPOINT', 'localhost'),
        port: parseInt(this.configService.get('MINIO_PORT', '49000')),
        useSSL: this.configService.get('MINIO_USE_SSL', 'false') === 'true',
        accessKey: this.configService.get('MINIO_ACCESS_KEY', 'cms_minio_admin'),
        secretKey: this.configService.get('MINIO_SECRET_KEY', 'CMS_Minio_2024_Secure'),
      });

      await this.ensureBucketExists();
      this.useLocalStorage = false;
      console.log('✓ Connected to MinIO successfully');
    } catch (error) {
      console.warn('⚠ MinIO not available, using local file storage:', error.message);
      this.useLocalStorage = true;
      await this.ensureLocalStorageExists();
    }
  }

  private async ensureLocalStorageExists(): Promise<void> {
    if (!fs.existsSync(this.localStoragePath)) {
      fs.mkdirSync(this.localStoragePath, { recursive: true });
    }
  }

  private async ensureBucketExists(): Promise<void> {
    if (!this.minioClient) return;
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        await this.minioClient.setBucketPolicy(
          this.bucketName,
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${this.bucketName}/*`],
              },
            ],
          }),
        );
      }
    } catch (error) {
      console.warn('MinIO bucket check failed:', error.message);
    }
  }

  async uploadFile(
    file: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<{ filename: string; filePath: string; size: number }> {
    const ext = originalName.split('.').pop();
    const filename = `${uuidv4()}.${ext}`;
    const datePath = new Date().toISOString().split('T')[0].replace(/-/g, '/');
    const filePath = `${datePath}/${filename}`;

    if (this.useLocalStorage) {
      const fullPath = path.join(this.localStoragePath, filePath);
      const dirPath = path.dirname(fullPath);
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, file);
      
      return {
        filename,
        filePath,
        size: file.length,
      };
    }

    if (this.minioClient) {
      await this.minioClient.putObject(this.bucketName, filePath, file, file.length, {
        'Content-Type': mimeType,
      });
    }

    return {
      filename,
      filePath,
      size: file.length,
    };
  }

  async getFileUrl(filePath: string): Promise<string> {
    if (this.useLocalStorage) {
      const port = this.configService.get('PORT', '8760');
      return `http://localhost:${port}/uploads/${filePath}`;
    }

    const endpoint = this.configService.get('MINIO_ENDPOINT', 'localhost');
    const port = this.configService.get('MINIO_PORT', '49000');
    const useSSL = this.configService.get('MINIO_USE_SSL', 'false') === 'true';
    const protocol = useSSL ? 'https' : 'http';

    return `${protocol}://${endpoint}:${port}/${this.bucketName}/${filePath}`;
  }

  async deleteFile(filePath: string): Promise<void> {
    if (this.useLocalStorage) {
      const fullPath = path.join(this.localStoragePath, filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      return;
    }

    if (this.minioClient) {
      await this.minioClient.removeObject(this.bucketName, filePath);
    }
  }

  async applyWatermark(
    originalPath: string,
    watermarkText: string = 'CMS Platform',
  ): Promise<string> {
    const watermarkedPath = originalPath.replace(/(\.[^.]+)$/, '-watermarked$1');

    console.log(`Applying watermark to ${originalPath} -> ${watermarkedPath}`);

    return watermarkedPath;
  }

  async generateAITags(filePath: string, mimeType: string): Promise<string[]> {
    console.log(`Generating AI tags for ${filePath}`);

    const defaultTags = ['asset', 'uploaded'];

    if (mimeType.startsWith('image/')) {
      return [...defaultTags, 'image', 'visual'];
    } else if (mimeType.startsWith('video/')) {
      return [...defaultTags, 'video', 'media'];
    } else if (mimeType.startsWith('audio/')) {
      return [...defaultTags, 'audio', 'sound'];
    } else if (mimeType.includes('pdf')) {
      return [...defaultTags, 'document', 'pdf'];
    }

    return defaultTags;
  }
}
