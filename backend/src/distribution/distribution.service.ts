import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Distribution, DistributionSchedule } from './entities/distribution.entity';
import { CreateDistributionDto, ScheduleDistributionDto, RetryDistributionDto } from './dto/distribution.dto';
import { ContentsService } from '../contents/contents.service';
import { AuditService } from '../audit/audit.service';
import {
  DistributionChannel,
  DistributionStatus,
  ContentStatus,
  UserRole,
} from '../common/enums';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class DistributionService {
  constructor(
    @InjectRepository(Distribution)
    private distributionRepository: Repository<Distribution>,
    @InjectRepository(DistributionSchedule)
    private scheduleRepository: Repository<DistributionSchedule>,
    private dataSource: DataSource,
    private contentsService: ContentsService,
    private auditService: AuditService,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
    userId: string,
    userRole: UserRole,
    channel?: DistributionChannel,
    status?: DistributionStatus,
  ): Promise<PaginatedResponseDto<Distribution>> {
    const { page, limit, sortBy, sortOrder } = paginationDto;
    const queryBuilder = this.distributionRepository
      .createQueryBuilder('distribution')
      .leftJoinAndSelect('distribution.content', 'content')
      .leftJoinAndSelect('content.author', 'author');

    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.CHANNEL_OPERATOR &&
      userRole !== UserRole.DATA_ANALYST
    ) {
      queryBuilder.andWhere('content.authorId = :userId', { userId });
    }

    if (channel) {
      queryBuilder.andWhere('distribution.channel = :channel', { channel });
    }

    if (status) {
      queryBuilder.andWhere('distribution.status = :status', { status });
    }

    if (sortBy) {
      queryBuilder.orderBy(`distribution.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('distribution.createdAt', 'DESC');
    }

    const [distributions, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return new PaginatedResponseDto(distributions, total, page, limit);
  }

  async findById(id: string): Promise<Distribution> {
    const distribution = await this.distributionRepository.findOne({
      where: { id },
      relations: ['content', 'content.author'],
    });

    if (!distribution) {
      throw new NotFoundException(`Distribution with ID ${id} not found`);
    }

    return distribution;
  }

  async createDistribution(
    dto: CreateDistributionDto,
    userId: string,
    userRole: UserRole,
  ): Promise<Distribution[]> {
    const { contentId, channels, scheduledAt } = dto;

    const content = await this.contentsService.findById(contentId, userId, userRole);

    if (content.status !== ContentStatus.APPROVED) {
      throw new ConflictException('Content must be approved before distribution');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const distributions: Distribution[] = [];

      for (const channel of channels) {
        const existingDistribution = await this.distributionRepository.findOne({
          where: { contentId, channel },
        });

        if (existingDistribution) {
          throw new ConflictException(
            `Content already distributed to ${channel}`,
          );
        }

        const distribution = this.distributionRepository.create({
          contentId,
          contentVersionId: null,
          channel,
          status: scheduledAt ? DistributionStatus.SCHEDULED : DistributionStatus.PENDING,
          scheduledAt,
        });

        const savedDistribution = await queryRunner.manager.save(distribution);
        distributions.push(savedDistribution);

        if (!scheduledAt) {
          await this.publishToChannel(savedDistribution, userId);
        }
      }

      if (!scheduledAt) {
        const allPublished = distributions.every((d) => d.status === DistributionStatus.PUBLISHED);
        if (allPublished) {
          await this.contentsService.updateStatus(
            contentId,
            { status: ContentStatus.PUBLISHED },
            userId,
            userRole,
          );
        }
      }

      await queryRunner.commitTransaction();

      await this.auditService.logAction({
        userId,
        action: 'DISTRIBUTION_CREATE',
        resourceType: 'DISTRIBUTION',
        resourceId: contentId,
        resourceTitle: content.title,
        newValue: {
          channels,
          scheduledAt: scheduledAt || 'Immediate',
        },
      });

      return distributions;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async scheduleDistribution(dto: ScheduleDistributionDto, userId: string, userRole: UserRole) {
    const { contentId, channels, scheduledAt } = dto;

    const content = await this.contentsService.findById(contentId, userId, userRole);

    if (content.status !== ContentStatus.APPROVED) {
      throw new ConflictException('Content must be approved before scheduling');
    }

    const schedule = this.scheduleRepository.create({
      contentId,
      channels,
      scheduledAt,
      status: DistributionStatus.SCHEDULED,
    });

    const savedSchedule = await this.scheduleRepository.save(schedule);

    await this.auditService.logAction({
      userId,
      action: 'DISTRIBUTION_SCHEDULE',
      resourceType: 'DISTRIBUTION',
      resourceId: savedSchedule.id,
      resourceTitle: content.title,
      newValue: {
        channels,
        scheduledAt,
      },
    });

    return savedSchedule;
  }

  async getContentDistributions(contentId: string): Promise<Distribution[]> {
    return this.distributionRepository.find({
      where: { contentId },
      order: { createdAt: 'DESC' },
      relations: ['content'],
    });
  }

  async retryDistribution(
    id: string,
    dto: RetryDistributionDto,
    userId: string,
  ): Promise<Distribution> {
    const distribution = await this.findById(id);

    if (distribution.status !== DistributionStatus.FAILED) {
      throw new ConflictException('Only failed distributions can be retried');
    }

    distribution.retryCount += 1;
    distribution.status = DistributionStatus.RETRYING;
    distribution.errorMessage = dto.reason;

    const updatedDistribution = await this.distributionRepository.save(distribution);

    await this.publishToChannel(updatedDistribution, userId);

    await this.auditService.logAction({
      userId,
      action: 'DISTRIBUTION_RETRY',
      resourceType: 'DISTRIBUTION',
      resourceId: id,
      resourceTitle: distribution.content.title,
      newValue: {
        retryCount: distribution.retryCount,
        reason: dto.reason,
      },
    });

    return updatedDistribution;
  }

  private async publishToChannel(
    distribution: Distribution,
    userId: string,
  ): Promise<Distribution> {
    console.log(`Publishing to ${distribution.channel}...`);

    try {
      await this.simulateChannelPublish(distribution);

      distribution.status = DistributionStatus.PUBLISHED;
      distribution.publishedAt = new Date();
      distribution.channelUrl = `https://${distribution.channel.toLowerCase()}.example.com/content/${distribution.id}`;
      distribution.channelContentId = `CH-${distribution.id.slice(0, 8)}`;
    } catch (error) {
      distribution.status = DistributionStatus.FAILED;
      distribution.errorMessage = error.message;
    }

    return this.distributionRepository.save(distribution);
  }

  private async simulateChannelPublish(distribution: Distribution): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (Math.random() < 0.1) {
      throw new Error('Channel publish failed - simulated error');
    }
  }

  async getDistributionStats(contentId: string) {
    const distributions = await this.distributionRepository.find({
      where: { contentId },
    });

    const stats = {
      total: distributions.length,
      published: distributions.filter((d) => d.status === DistributionStatus.PUBLISHED).length,
      pending: distributions.filter((d) => d.status === DistributionStatus.PENDING).length,
      failed: distributions.filter((d) => d.status === DistributionStatus.FAILED).length,
      byChannel: {} as Record<string, number>,
    };

    for (const distribution of distributions) {
      stats.byChannel[distribution.channel] = (stats.byChannel[distribution.channel] || 0) + 1;
    }

    return stats;
  }
}
