import { Injectable, NotFoundException, Injectable as Injectable2 } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaAsset, ContentMedia } from '../entities/media-asset.entity';
import { MinioService } from './minio.service';
import { AuditService } from '../../audit/audit.service';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(MediaAsset)
    private mediaRepository: Repository<MediaAsset>,
    @InjectRepository(ContentMedia)
    private contentMediaRepository: Repository<ContentMedia>,
    private minioService: MinioService,
    private auditService: AuditService,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
    userId: string,
    assetType?: string,
  ): Promise<PaginatedResponseDto<MediaAsset>> {
    const { page, limit, sortBy, sortOrder } = paginationDto;
    const queryBuilder = this.mediaRepository.createQueryBuilder('media');

    queryBuilder.andWhere('media.uploadedById = :userId', { userId });

    if (assetType) {
      queryBuilder.andWhere('media.assetType = :assetType', { assetType });
    }

    if (sortBy) {
      queryBuilder.orderBy(`media.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('media.createdAt', 'DESC');
    }

    const [assets, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return new PaginatedResponseDto(assets, total, page, limit);
  }

  async findById(id: string): Promise<MediaAsset> {
    const asset = await this.mediaRepository.findOne({
      where: { id },
      relations: ['uploadedBy'],
    });

    if (!asset) {
      throw new NotFoundException(`Media asset with ID ${id} not found`);
    }

    return asset;
  }

  async uploadFile(file: UploadedFile, userId: string): Promise<MediaAsset> {
    const { originalname, mimetype, buffer } = file;

    const uploaded = await this.minioService.uploadFile(buffer, originalname, mimetype);

    const assetType = this.determineAssetType(mimetype);

    const asset = this.mediaRepository.create({
      filename: uploaded.filename,
      originalFilename: originalname,
      filePath: uploaded.filePath,
      fileSize: uploaded.size,
      mimeType: mimetype,
      assetType,
      uploadedById: userId,
      aiTags: [],
    });

    const savedAsset = await this.mediaRepository.save(asset);

    const watermarkedPath = await this.minioService.applyWatermark(uploaded.filePath);
    const aiTags = await this.minioService.generateAITags(uploaded.filePath, mimetype);

    savedAsset.watermarkedPath = watermarkedPath;
    savedAsset.aiTags = aiTags;
    await this.mediaRepository.save(savedAsset);

    await this.auditService.logAction({
      userId,
      action: 'MEDIA_UPLOAD',
      resourceType: 'MEDIA',
      resourceId: savedAsset.id,
      resourceTitle: savedAsset.originalFilename,
      newValue: {
        filename: savedAsset.filename,
        assetType: savedAsset.assetType,
        aiTags: savedAsset.aiTags,
      },
    });

    return savedAsset;
  }

  async getFileUrl(assetId: string): Promise<string> {
    const asset = await this.findById(assetId);
    const path = asset.watermarkedPath || asset.filePath;
    return this.minioService.getFileUrl(path);
  }

  async delete(id: string, userId: string): Promise<void> {
    const asset = await this.findById(id);

    if (asset.uploadedById !== userId) {
      throw new NotFoundException(`Media asset with ID ${id} not found`);
    }

    await this.minioService.deleteFile(asset.filePath);
    if (asset.watermarkedPath) {
      await this.minioService.deleteFile(asset.watermarkedPath);
    }

    await this.auditService.logAction({
      userId,
      action: 'MEDIA_DELETE',
      resourceType: 'MEDIA',
      resourceId: id,
      resourceTitle: asset.originalFilename,
      oldValue: asset,
    });

    await this.mediaRepository.delete(id);
  }

  async linkContentMedia(
    contentId: string,
    mediaIds: string[],
    featuredId?: string,
  ): Promise<void> {
    await this.contentMediaRepository.delete({ contentId });

    for (let i = 0; i < mediaIds.length; i++) {
      const contentMedia = this.contentMediaRepository.create({
        contentId,
        mediaAssetId: mediaIds[i],
        sortOrder: i,
        isFeatured: mediaIds[i] === featuredId,
      });
      await this.contentMediaRepository.save(contentMedia);

      await this.mediaRepository.update(mediaIds[i], { isUsed: true });
    }
  }

  async getContentMedia(contentId: string): Promise<MediaAsset[]> {
    const contentMedia = await this.contentMediaRepository.find({
      where: { contentId },
      order: { sortOrder: 'ASC' },
    });

    const mediaIds = contentMedia.map((cm) => cm.mediaAssetId);

    if (mediaIds.length === 0) {
      return [];
    }

    return this.mediaRepository
      .createQueryBuilder('media')
      .whereInIds(mediaIds)
      .leftJoinAndSelect('media.uploadedBy', 'uploadedBy')
      .getMany();
  }

  private determineAssetType(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'IMAGE';
    } else if (mimeType.startsWith('video/')) {
      return 'VIDEO';
    } else if (mimeType.startsWith('audio/')) {
      return 'AUDIO';
    } else if (mimeType.includes('pdf') || mimeType.includes('document')) {
      return 'DOCUMENT';
    }
    return 'OTHER';
  }
}
