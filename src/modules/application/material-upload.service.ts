import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CurrentUserPayload } from '@/common/decorators/current-user.decorator';
import { BusinessException } from '@/common/exceptions/business.exception';
import { ApplicationStatus } from '@prisma/client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MaterialUploadService {
  private uploadPath: string;

  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {
    this.uploadPath = process.env.FILE_STORAGE_PATH || './uploads';
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async uploadMaterial(
    user: CurrentUserPayload,
    applicationId: string,
    templateId: string,
    file: Express.Multer.File,
  ) {
    this.logger.log(`上传办件材料: app=${applicationId} template=${templateId}`, 'MaterialUploadService');
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { serviceItem: true },
    });
    if (!application) throw new NotFoundException('办件不存在');
    if (application.userId !== user.userId) throw new BusinessException('无权操作', 'PERMISSION_DENIED');

    const template = await this.prisma.materialTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundException('材料模板不存在');
    if (template.serviceItemId !== application.serviceItemId) {
      throw new BusinessException('材料模板与办件事项不匹配', 'INVALID_TEMPLATE');
    }

    const allowedFormats = template.format.split(',').map((f) => f.trim().toLowerCase());
    const fileExt = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (!allowedFormats.includes(fileExt)) {
      throw new BusinessException(`不支持的文件格式，仅支持: ${template.format}`, 'INVALID_FORMAT');
    }
    if (file.size > template.maxSize * 1024 * 1024) {
      throw new BusinessException(`文件超过最大限制: ${template.maxSize}MB`, 'FILE_TOO_LARGE');
    }

    const savedFilename = `${uuidv4()}.${fileExt}`;
    const savedPath = path.join(this.uploadPath, savedFilename);
    fs.writeFileSync(savedPath, file.buffer);

    const material = await this.prisma.applicationMaterial.create({
      data: {
        applicationId,
        templateId,
        fileName: file.originalname,
        fileUrl: `/uploads/${savedFilename}`,
        fileSize: file.size,
        fileType: fileExt,
        uploaderId: user.userId,
        uploaderName: user.realName || '用户',
      },
    });

    const materialCount = await this.prisma.applicationMaterial.count({ where: { applicationId } });
    const requiredCount = await this.prisma.materialTemplate.count({
      where: { serviceItemId: application.serviceItemId, isRequired: true },
    });
    if (materialCount >= requiredCount && application.status === ApplicationStatus.APPOINTED) {
      await this.prisma.application.update({
        where: { id: applicationId },
        data: { status: ApplicationStatus.MATERIALS_UPLOADED, currentNode: 'materials_uploaded' },
      });
    }

    return material;
  }

  async getMaterials(applicationId: string) {
    return this.prisma.applicationMaterial.findMany({
      where: { applicationId },
      include: { template: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteMaterial(user: CurrentUserPayload, materialId: string) {
    const material = await this.prisma.applicationMaterial.findUnique({
      where: { id: materialId },
      include: { application: true },
    });
    if (!material) throw new NotFoundException('材料不存在');
    if (material.application.userId !== user.userId) {
      throw new BusinessException('无权操作', 'PERMISSION_DENIED');
    }
    const filePath = path.join(this.uploadPath, path.basename(material.fileUrl));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return this.prisma.applicationMaterial.delete({ where: { id: materialId } });
  }
}
