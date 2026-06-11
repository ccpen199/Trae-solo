import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { generateUUID } from '@pet/shared/utils';
import type { UploadFileDto } from './dto';

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi'];
const ALLOWED_GIF_EXTENSIONS = ['.gif'];

@Injectable()
export class UploadService {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    this.baseUrl = this.configService.get<string>('UPLOAD_BASE_URL', '/uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, dto: UploadFileDto) {
    this.validateFile(file, dto.fileType);
    const relativePath = this.buildFilePath(dto.folder, file.originalname);
    const absolutePath = path.join(this.uploadDir, relativePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(absolutePath, file.buffer);
    const url = `${this.baseUrl}/${relativePath}`;
    return {
      url,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async uploadFiles(files: Express.Multer.File[], dto: UploadFileDto) {
    const maxCount = dto.maxCount ?? 9;
    if (files.length > maxCount) {
      throw new BadRequestException(`最多上传${maxCount}个文件`);
    }
    const results = await Promise.all(
      files.map(file => this.uploadFile(file, dto)),
    );
    return results;
  }

  private validateFile(file: Express.Multer.File, fileType: string) {
    const ext = path.extname(file.originalname).toLowerCase();
    let allowedExtensions: string[];
    switch (fileType) {
      case 'image':
        allowedExtensions = ALLOWED_IMAGE_EXTENSIONS;
        break;
      case 'video':
        allowedExtensions = ALLOWED_VIDEO_EXTENSIONS;
        break;
      case 'gif':
        allowedExtensions = ALLOWED_GIF_EXTENSIONS;
        break;
      default:
        throw new BadRequestException('不支持的文件类型');
    }
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException(`不支持的文件扩展名: ${ext}`);
    }
  }

  private buildFilePath(folder: string, originalName: string): string {
    const ext = path.extname(originalName);
    const filename = `${generateUUID()}${ext}`;
    const datePath = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
    return `${folder}/${datePath}/${filename}`;
  }
}
