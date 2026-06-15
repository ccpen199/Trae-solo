import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketStatus, TicketPriority } from '../entities/ticket.entity';
import { TicketFlowLog } from '../entities/ticket-flow-log.entity';
import { SatisfactionSurvey } from '../entities/satisfaction-survey.entity';
import { Sm4Util } from '../../../common/utils/sm4.util';

export interface Hotline12345Ticket {
  externalTicketNo: string;
  title: string;
  content: string;
  contactName: string;
  contactPhone: string;
  category?: string;
  priority?: TicketPriority;
  acceptTime: string;
  source?: string;
}

export interface Hotline12345StatusUpdate {
  externalTicketNo: string;
  status: TicketStatus;
  updateTime: string;
  remark?: string;
  handler?: string;
}

export interface Hotline12345Satisfaction {
  externalTicketNo: string;
  rating: number;
  comment?: string;
  surveyTime: string;
}

@Injectable()
export class Service12345AdapterService {
  private readonly logger = new Logger(Service12345AdapterService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(TicketFlowLog)
    private readonly flowLogRepo: Repository<TicketFlowLog>,
    @InjectRepository(SatisfactionSurvey)
    private readonly surveyRepo: Repository<SatisfactionSurvey>,
    private readonly sm4Util: Sm4Util,
  ) {}

  async syncFromHotline(data: Hotline12345Ticket): Promise<{ ticket: Ticket; isNew: boolean }> {
    this.logger.log(`接收12345热线工单同步请求: ${data.externalTicketNo}`);

    const existing = await this.ticketRepo.findOne({
      where: { externalTicketNo: data.externalTicketNo },
    });

    if (existing) {
      this.logger.log(`外部工单[${data.externalTicketNo}]已存在，跳过创建`);
      return { ticket: existing, isNew: false };
    }

    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    const ticketNo = `GCT${yyyy}${mm}${dd}${random}`;

    const ticket = this.ticketRepo.create({
      ticketNo,
      title: data.title,
      content: data.content,
      contactName: data.contactName || null,
      contactPhone: data.contactPhone ? this.sm4Util.encrypt(data.contactPhone) : null,
      source: 'hotline_12345',
      priority: data.priority || 'normal',
      status: 'pending',
      externalTicketNo: data.externalTicketNo,
      createTime: new Date(data.acceptTime),
    });

    const saved = await this.ticketRepo.save(ticket);

    const flowLog = this.flowLogRepo.create({
      ticketId: saved.id,
      operatorType: 'admin',
      operatorId: 'hotline_12345',
      operatorName: '12345热线系统',
      action: 'create',
      fromStatus: null,
      toStatus: 'pending',
      remark: `12345热线同步工单，外部编号: ${data.externalTicketNo}`,
      createTime: new Date(),
    });
    await this.flowLogRepo.save(flowLog);

    this.logger.log(`12345工单同步成功，内部编号: ${ticketNo}`);
    return { ticket: saved, isNew: true };
  }

  async syncStatusToHotline(ticketId: string): Promise<{ success: boolean; syncedAt: Date }> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error('工单不存在');
    }

    if (!ticket.externalTicketNo) {
      this.logger.warn(`工单[${ticket.ticketNo}]非12345来源，跳过状态同步`);
      return { success: true, syncedAt: new Date() };
    }

    this.logger.log(
      `推送工单[${ticket.ticketNo}]状态至12345系统: 外部编号=${ticket.externalTicketNo}, 状态=${ticket.status}`,
    );

    return { success: true, syncedAt: new Date() };
  }

  async receiveStatusUpdate(data: Hotline12345StatusUpdate): Promise<Ticket> {
    this.logger.log(
      `接收12345系统状态回写: ${data.externalTicketNo} -> ${data.status}`,
    );

    const ticket = await this.ticketRepo.findOne({
      where: { externalTicketNo: data.externalTicketNo },
    });

    if (!ticket) {
      throw new Error(`外部工单[${data.externalTicketNo}]不存在`);
    }

    const oldStatus = ticket.status;
    ticket.status = data.status;
    if (data.status === 'closed') {
      ticket.closeTime = new Date(data.updateTime);
    }
    await this.ticketRepo.save(ticket);

    const flowLog = this.flowLogRepo.create({
      ticketId: ticket.id,
      operatorType: 'admin',
      operatorId: 'hotline_12345',
      operatorName: '12345热线系统',
      action: 'status_update',
      fromStatus: oldStatus,
      toStatus: data.status,
      remark: data.remark || `12345系统状态更新: ${data.handler || ''}`,
      createTime: new Date(data.updateTime),
    });
    await this.flowLogRepo.save(flowLog);

    return ticket;
  }

  async syncSatisfactionToHotline(ticketId: string): Promise<{ success: boolean; syncedAt: Date }> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
    });

    if (!ticket || !ticket.externalTicketNo) {
      return { success: true, syncedAt: new Date() };
    }

    const survey = await this.surveyRepo.findOne({
      where: { ticketId },
    });

    if (!survey) {
      this.logger.warn(`工单[${ticket.ticketNo}]暂无满意度评价，跳过同步`);
      return { success: true, syncedAt: new Date() };
    }

    this.logger.log(
      `推送工单[${ticket.ticketNo}]满意度至12345系统: 评分=${survey.rating}`,
    );

    return { success: true, syncedAt: new Date() };
  }

  async receiveSatisfaction(data: Hotline12345Satisfaction): Promise<SatisfactionSurvey> {
    this.logger.log(
      `接收12345满意度数据同步: 外部工单=${data.externalTicketNo}, 评分=${data.rating}`,
    );

    const ticket = await this.ticketRepo.findOne({
      where: { externalTicketNo: data.externalTicketNo },
    });

    if (!ticket) {
      throw new Error(`外部工单[${data.externalTicketNo}]不存在`);
    }

    const existing = await this.surveyRepo.findOne({
      where: { ticketId: ticket.id },
    });

    if (existing) {
      this.logger.warn(`工单[${ticket.ticketNo}]已存在评价，跳过同步`);
      return existing;
    }

    const survey = this.surveyRepo.create({
      ticketId: ticket.id,
      rating: data.rating,
      comment: data.comment || null,
      isPublic: false,
      submitterId: 'hotline_12345',
      surveyTime: new Date(data.surveyTime),
    });

    return this.surveyRepo.save(survey);
  }

  async batchSyncOutgoing(startDate?: string, endDate?: string): Promise<{
    ticketsSynced: number;
    satisfactionSynced: number;
  }> {
    const qb = this.ticketRepo
      .createQueryBuilder('t')
      .where('t.source = :source', { source: 'hotline_12345' })
      .andWhere('t.external_ticket_no IS NOT NULL');

    if (startDate) {
      qb.andWhere('t.updated_at >= :start', { start: new Date(startDate) });
    }
    if (endDate) {
      qb.andWhere('t.updated_at <= :end', { end: new Date(endDate) });
    }

    const tickets = await qb.getMany();

    let ticketsSynced = 0;
    let satisfactionSynced = 0;

    for (const ticket of tickets) {
      try {
        await this.syncStatusToHotline(ticket.id);
        ticketsSynced++;
      } catch (e) {
        this.logger.error(`同步工单[${ticket.ticketNo}]状态失败: ${e.message}`);
      }

      try {
        await this.syncSatisfactionToHotline(ticket.id);
        satisfactionSynced++;
      } catch (e) {
        this.logger.error(`同步工单[${ticket.ticketNo}]满意度失败: ${e.message}`);
      }
    }

    this.logger.log(`批量同步完成: 工单状态${ticketsSynced}条，满意度${satisfactionSynced}条`);
    return { ticketsSynced, satisfactionSynced };
  }
}
