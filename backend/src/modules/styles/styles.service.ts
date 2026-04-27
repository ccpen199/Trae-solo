import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Style } from './entities/style.entity';
import { StyleHistory } from './entities/style-history.entity';
import { StyleStatus } from '../../common/enums/style-status.enum';
import { Role } from '../../common/enums/role.enum';
import { NumberGeneratorService } from '../engines/number-generator.service';
import { ProcessFlowEngine } from '../engines/process-flow.engine';
import { CreateStyleDto } from './dto/create-style.dto';
import { UpdateStyleDto } from './dto/update-style.dto';

@Injectable()
export class StylesService {
  private readonly logger = new Logger(StylesService.name);

  constructor(
    @InjectRepository(Style)
    private styleRepository: Repository<Style>,
    @InjectRepository(StyleHistory)
    private styleHistoryRepository: Repository<StyleHistory>,
    private entityManager: EntityManager,
    private numberGeneratorService: NumberGeneratorService,
    private processFlowEngine: ProcessFlowEngine,
  ) {}

  async create(
    createStyleDto: CreateStyleDto,
    designerId: string,
  ): Promise<Style> {
    return this.entityManager.transaction(async (manager) => {
      const style = manager.create(Style, {
        ...createStyleDto,
        styleNumber: this.numberGeneratorService.generateStyleNumber(
          createStyleDto.year,
        ),
        status: StyleStatus.DRAFT,
        designerId,
        createdBy: designerId,
      });

      const savedStyle = await manager.save(style);

      const history = manager.create(StyleHistory, {
        styleId: savedStyle.id,
        operatorId: designerId,
        oldStatus: null,
        newStatus: StyleStatus.DRAFT,
        actionType: 'CREATE',
        actionDescription: '创建款式档案',
      });

      await manager.save(history);

      this.logger.log(`款式创建成功: ${savedStyle.styleNumber}`);

      return savedStyle;
    });
  }

  async findAll(
    designerId?: string,
    status?: StyleStatus,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{
    data: Style[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const query = this.styleRepository
      .createQueryBuilder('style')
      .leftJoinAndSelect('style.designer', 'designer')
      .where('style.deletedAt IS NULL');

    if (designerId) {
      query.andWhere('style.designerId = :designerId', { designerId });
    }

    if (status) {
      query.andWhere('style.status = :status', { status });
    }

    query.orderBy('style.updatedAt', 'DESC');

    const [data, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string): Promise<Style> {
    const style = await this.styleRepository.findOne({
      where: { id },
      relations: ['designer', 'patterns', 'boms', 'histories', 'communications'],
    });

    if (!style) {
      throw new NotFoundException(`款式不存在: ${id}`);
    }

    return style;
  }

  async update(
    id: string,
    updateStyleDto: UpdateStyleDto,
    operatorId: string,
  ): Promise<Style> {
    return this.entityManager.transaction(async (manager) => {
      const style = await manager.findOne(Style, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!style) {
        throw new NotFoundException(`款式不存在: ${id}`);
      }

      const changedFields: { [key: string]: { old: any; new: any } } = {};

      for (const [key, value] of Object.entries(updateStyleDto)) {
        if (value !== undefined && value !== style[key]) {
          changedFields[key] = {
            old: style[key],
            new: value,
          };
        }
      }

      Object.assign(style, updateStyleDto);
      style.updatedBy = operatorId;

      const updatedStyle = await manager.save(style);

      if (Object.keys(changedFields).length > 0) {
        const history = manager.create(StyleHistory, {
          styleId: style.id,
          operatorId,
          oldStatus: style.status,
          newStatus: style.status,
          actionType: 'UPDATE',
          actionDescription: '更新款式信息',
          changedFields,
        });

        await manager.save(history);
      }

      return updatedStyle;
    });
  }

  async submitForPattern(
    styleId: string,
    designerId: string,
  ): Promise<Style> {
    const style = await this.findOne(styleId);

    if (style.designerId !== designerId) {
      throw new BadRequestException('只有设计师本人可以提交款式');
    }

    if (style.status !== StyleStatus.DRAFT) {
      throw new BadRequestException(
        `款式状态不允许提交: ${style.status}`,
      );
    }

    return this.processFlowEngine.transitionStyleStatus(
      styleId,
      StyleStatus.PENDING_PATTERN,
      designerId,
      '设计师提交款式，等待版师打版',
    );
  }

  async confirmPattern(
    styleId: string,
    designerId: string,
    confirmed: boolean,
    revisionNotes?: string,
  ): Promise<Style> {
    const style = await this.findOne(styleId);

    if (style.designerId !== designerId) {
      throw new BadRequestException('只有设计师本人可以确认打版');
    }

    if (style.status !== StyleStatus.PENDING_CONFIRMATION) {
      throw new BadRequestException(
        `款式状态不允许确认: ${style.status}`,
      );
    }

    if (confirmed) {
      return this.processFlowEngine.transitionStyleStatus(
        styleId,
        StyleStatus.CONFIRMED,
        designerId,
        '设计师确认打版通过',
      );
    } else {
      const updatedStyle = await this.processFlowEngine.transitionStyleStatus(
        styleId,
        StyleStatus.PATTERN_IN_PROGRESS,
        designerId,
        '设计师要求修改打版',
      );

      if (revisionNotes) {
        updatedStyle.detailNotes = updatedStyle.detailNotes
          ? `${updatedStyle.detailNotes}\n修改要求: ${revisionNotes}`
          : `修改要求: ${revisionNotes}`;
        await this.styleRepository.save(updatedStyle);
      }

      return updatedStyle;
    }
  }

  async getHistories(
    styleId: string,
  ): Promise<StyleHistory[]> {
    return this.styleHistoryRepository.find({
      where: { styleId },
      relations: ['operator'],
      order: { createdAt: 'DESC' },
    });
  }

  async getStatusInfo(status: StyleStatus) {
    return this.processFlowEngine.getStatusDescription(status);
  }

  async getNextStatuses(currentStatus: StyleStatus) {
    return this.processFlowEngine.getNextPossibleStatuses(currentStatus);
  }
}
