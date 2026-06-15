import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SatisfactionSurvey } from '../entities/satisfaction-survey.entity';
import { Ticket } from '../entities/ticket.entity';
import {
  SubmitSatisfactionDto,
  SatisfactionQueryDto,
  ReplySatisfactionDto,
  SatisfactionStatsQueryDto,
  PublicSatisfactionListDto,
} from '../dto/satisfaction.dto';

@Injectable()
export class SatisfactionService {
  private readonly logger = new Logger(SatisfactionService.name);

  constructor(
    @InjectRepository(SatisfactionSurvey)
    private readonly surveyRepo: Repository<SatisfactionSurvey>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}

  async generateSurvey(ticketId: string): Promise<SatisfactionSurvey | null> {
    const existing = await this.surveyRepo.findOne({
      where: { ticketId },
    });
    if (existing) return existing;

    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
    });
    if (!ticket || ticket.status !== 'closed') {
      return null;
    }

    return null;
  }

  async submitSatisfaction(
    dto: SubmitSatisfactionDto,
    submitterId?: string,
  ): Promise<SatisfactionSurvey> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: dto.ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    if (ticket.status !== 'closed') {
      throw new BadRequestException('工单尚未办结，暂不能评价');
    }

    if (submitterId && ticket.submitterId && ticket.submitterId !== submitterId) {
      throw new BadRequestException('只能评价自己提交的工单');
    }

    const existing = await this.surveyRepo.findOne({
      where: { ticketId: dto.ticketId },
    });

    if (existing) {
      throw new BadRequestException('该工单已提交过评价');
    }

    const survey = this.surveyRepo.create({
      ticketId: dto.ticketId,
      rating: dto.rating,
      subRatings: dto.subRatings || null,
      comment: dto.comment || null,
      isPublic: dto.isPublic || false,
      submitterId: submitterId || null,
      surveyTime: new Date(),
    });

    const saved = await this.surveyRepo.save(survey);
    this.logger.log(`工单[${ticket.ticketNo}]满意度评价已提交，评分: ${dto.rating}`);
    return saved;
  }

  async getSurveyByTicket(ticketId: string): Promise<SatisfactionSurvey | null> {
    return this.surveyRepo.findOne({
      where: { ticketId },
    });
  }

  async getSurveyList(
    query: SatisfactionQueryDto,
  ): Promise<{ list: SatisfactionSurvey[]; total: number; page: number; pageSize: number }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;

    const qb = this.surveyRepo
      .createQueryBuilder('s')
      .where('s.deleted_at IS NULL');

    if (query.ticketId) {
      qb.andWhere('s.ticket_id = :ticketId', { ticketId: query.ticketId });
    }
    if (query.minRating !== undefined) {
      qb.andWhere('s.rating >= :minRating', { minRating: query.minRating });
    }
    if (query.maxRating !== undefined) {
      qb.andWhere('s.rating <= :maxRating', { maxRating: query.maxRating });
    }
    if (query.onlyPublic) {
      qb.andWhere('s.is_public = true');
    }
    if (query.startDate) {
      const start = new Date(query.startDate);
      start.setHours(0, 0, 0, 0);
      qb.andWhere('s.survey_time >= :start', { start });
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('s.survey_time <= :end', { end });
    }

    qb.orderBy('s.survey_time', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, pageSize };
  }

  async getPublicList(
    query: PublicSatisfactionListDto,
  ): Promise<{ list: SatisfactionSurvey[]; total: number; page: number; pageSize: number }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;

    const qb = this.surveyRepo
      .createQueryBuilder('s')
      .leftJoinAndMapOne('s.ticket', Ticket, 't', 't.id = s.ticket_id')
      .where('s.deleted_at IS NULL')
      .andWhere('s.is_public = true')
      .andWhere('s.comment IS NOT NULL')
      .andWhere('s.comment != :empty', { empty: '' });

    if (query.categoryId) {
      qb.andWhere('(t.category_id = :categoryId OR t.sub_category_id = :categoryId)', {
        categoryId: query.categoryId,
      });
    }

    qb.orderBy('s.survey_time', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();

    for (const item of list) {
      const ticket = (item as any).ticket;
      if (ticket) {
        delete (item as any).ticket;
        (item as any).ticketInfo = {
          id: ticket.id,
          ticketNo: ticket.ticketNo,
          title: ticket.title,
          categoryId: ticket.categoryId,
        };
      }
    }

    return { list, total, page, pageSize };
  }

  async replySatisfaction(
    dto: ReplySatisfactionDto,
    operatorId: string,
    operatorName?: string,
  ): Promise<SatisfactionSurvey> {
    const survey = await this.surveyRepo.findOne({
      where: { id: dto.surveyId },
    });

    if (!survey) {
      throw new NotFoundException('评价记录不存在');
    }

    if (survey.replyContent) {
      throw new BadRequestException('该评价已回复过');
    }

    survey.replyContent = dto.replyContent;
    survey.replyTime = new Date();

    const saved = await this.surveyRepo.save(survey);
    this.logger.log(`评价[${dto.surveyId}]已回复，回复人: ${operatorName || operatorId}`);
    return saved;
  }

  async getStatistics(query: SatisfactionStatsQueryDto): Promise<any> {
    const qb = this.surveyRepo
      .createQueryBuilder('s')
      .where('s.deleted_at IS NULL');

    if (query.deptCode) {
      qb.innerJoin(Ticket, 't', 't.id = s.ticket_id AND t.dept_code = :deptCode', {
        deptCode: query.deptCode,
      });
    }
    if (query.startDate) {
      const start = new Date(query.startDate);
      start.setHours(0, 0, 0, 0);
      qb.andWhere('s.survey_time >= :start', { start });
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('s.survey_time <= :end', { end });
    }

    const all = await qb.getMany();

    const total = all.length;
    const byRating: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    let responseSpeedSum = 0;
    let attitudeSum = 0;
    let resolutionSum = 0;
    let subRatingCount = 0;
    let publicCount = 0;
    let repliedCount = 0;

    for (const s of all) {
      byRating[s.rating] = (byRating[s.rating] || 0) + 1;
      totalRating += s.rating;
      if (s.isPublic) publicCount++;
      if (s.replyContent) repliedCount++;

      if (s.subRatings) {
        const sr = s.subRatings as any;
        if (sr.responseSpeed) { responseSpeedSum += sr.responseSpeed; subRatingCount++; }
        if (sr.attitude) attitudeSum += sr.attitude;
        if (sr.resolutionEffect) resolutionSum += sr.resolutionEffect;
      }
    }

    const avgRating = total > 0 ? (totalRating / total) : 0;
    const goodRate = total > 0 ? (((byRating[4] || 0) + (byRating[5] || 0)) / total * 100) : 0;

    return {
      totalSurveys: total,
      avgRating: Number(avgRating.toFixed(2)),
      goodRate: Number(goodRate.toFixed(2)),
      byRating,
      avgSubRatings: subRatingCount > 0 ? {
        responseSpeed: Number((responseSpeedSum / subRatingCount).toFixed(2)),
        attitude: Number((attitudeSum / subRatingCount).toFixed(2)),
        resolutionEffect: Number((resolutionSum / subRatingCount).toFixed(2)),
      } : null,
      publicCount,
      repliedCount,
      replyRate: total > 0 ? Number((repliedCount / total * 100).toFixed(2)) : 0,
    };
  }
}
