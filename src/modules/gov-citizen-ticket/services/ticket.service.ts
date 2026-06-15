import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, Brackets } from 'typeorm';
import { nanoid } from 'nanoid';
import { Ticket, TicketStatus, TicketSource } from '../entities/ticket.entity';
import { TicketAttachment } from '../entities/ticket-attachment.entity';
import { TicketFlowLog } from '../entities/ticket-flow-log.entity';
import { TicketUrgencyLog } from '../entities/ticket-urgency-log.entity';
import { CreateTicketDto, TicketListQueryDto, TicketUrgencyDto, TicketCancelDto } from '../dto/ticket.dto';
import { Sm4Util } from '../../../common/utils/sm4.util';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(TicketAttachment)
    private readonly attachmentRepo: Repository<TicketAttachment>,
    @InjectRepository(TicketFlowLog)
    private readonly flowLogRepo: Repository<TicketFlowLog>,
    @InjectRepository(TicketUrgencyLog)
    private readonly urgencyLogRepo: Repository<TicketUrgencyLog>,
    private readonly sm4Util: Sm4Util,
  ) {}

  async createTicket(
    dto: CreateTicketDto,
    submitterId?: string,
  ): Promise<Ticket> {
    const ticketNo = this.generateTicketNo();

    const ticket = this.ticketRepo.create({
      ticketNo,
      title: dto.title,
      content: dto.content,
      contactName: dto.contactName || null,
      contactPhone: dto.contactPhone ? this.sm4Util.encrypt(dto.contactPhone) : null,
      categoryId: dto.categoryId || null,
      subCategoryId: dto.subCategoryId || null,
      source: dto.source || 'app',
      priority: dto.priority || 'normal',
      status: 'pending',
      submitterId: submitterId || null,
      createTime: new Date(),
      expectReplyTime: dto.expectReplyTime ? new Date(dto.expectReplyTime) : null,
    });

    const saved = await this.ticketRepo.save(ticket);

    await this.addFlowLog({
      ticketId: saved.id,
      operatorType: submitterId ? 'user' : 'admin',
      operatorId: submitterId || null,
      operatorName: dto.contactName || null,
      action: 'create',
      fromStatus: null,
      toStatus: 'pending',
      remark: '工单创建',
    });

    if (dto.attachments && dto.attachments.length > 0) {
      const attachments = dto.attachments.map(att =>
        this.attachmentRepo.create({
          ticketId: saved.id,
          fileName: att.fileName,
          fileUrl: att.fileUrl,
          fileSize: att.fileSize || null,
          fileType: att.fileType || null,
          uploaderId: submitterId || null,
          uploadTime: new Date(),
        }),
      );
      await this.attachmentRepo.save(attachments);
    }

    this.logger.log(`工单创建成功: ${ticketNo}`);
    return saved;
  }

  async getMyTickets(
    submitterId: string,
    query: TicketListQueryDto,
  ): Promise<{ list: Ticket[]; total: number; page: number; pageSize: number }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;

    const qb = this.ticketRepo
      .createQueryBuilder('t')
      .where('t.submitter_id = :submitterId', { submitterId })
      .andWhere('t.deleted_at IS NULL');

    this.applyQueryFilters(qb, query);

    qb.orderBy('t.create_time', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();

    for (const t of list) {
      if (t.contactPhone) {
        t.contactPhone = this.maskPhone(this.sm4Util.decrypt(t.contactPhone));
      }
    }

    return { list, total, page, pageSize };
  }

  async getTicketDetail(ticketId: string, submitterId?: string): Promise<Ticket & { attachments?: TicketAttachment[]; flowLogs?: TicketFlowLog[] }> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    if (submitterId && ticket.submitterId !== submitterId) {
      throw new NotFoundException('工单不存在或无权访问');
    }

    if (ticket.contactPhone) {
      ticket.contactPhone = this.maskPhone(this.sm4Util.decrypt(ticket.contactPhone));
    }

    const [attachments, flowLogs] = await Promise.all([
      this.attachmentRepo.find({
        where: { ticketId },
        order: { uploadTime: 'ASC' },
      }),
      this.flowLogRepo.find({
        where: { ticketId },
        order: { createTime: 'ASC' },
      }),
    ]);

    return { ...ticket, attachments, flowLogs };
  }

  async urgencyTicket(
    dto: TicketUrgencyDto,
    userId?: string,
  ): Promise<TicketUrgencyLog> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: dto.ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    if (ticket.status === 'closed' || ticket.status === 'cancelled') {
      throw new BadRequestException('工单已办结或已取消，无法催办');
    }

    ticket.urgentCount = (ticket.urgentCount || 0) + 1;
    await this.ticketRepo.save(ticket);

    const log = this.urgencyLogRepo.create({
      ticketId: dto.ticketId,
      userId: userId || null,
      urgencyReason: dto.urgencyReason || null,
      contactPhone: dto.contactPhone ? this.sm4Util.encrypt(dto.contactPhone) : null,
      urgencyTime: new Date(),
    });

    await this.addFlowLog({
      ticketId: dto.ticketId,
      operatorType: userId ? 'user' : 'admin',
      operatorId: userId || null,
      action: 'urgent',
      fromStatus: ticket.status,
      toStatus: ticket.status,
      remark: dto.urgencyReason || `第${ticket.urgentCount}次催办`,
    });

    this.logger.log(`工单[${ticket.ticketNo}]被催办，累计催办${ticket.urgentCount}次`);
    return this.urgencyLogRepo.save(log);
  }

  async cancelTicket(
    ticketId: string,
    dto: TicketCancelDto,
    submitterId?: string,
  ): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    if (submitterId && ticket.submitterId !== submitterId) {
      throw new BadRequestException('无权取消此工单');
    }

    if (ticket.status === 'closed' || ticket.status === 'cancelled') {
      throw new BadRequestException('工单已办结或已取消');
    }

    const oldStatus = ticket.status;
    ticket.status = 'cancelled';
    ticket.closeTime = new Date();
    await this.ticketRepo.save(ticket);

    await this.addFlowLog({
      ticketId,
      operatorType: submitterId ? 'user' : 'admin',
      operatorId: submitterId || null,
      action: 'cancel',
      fromStatus: oldStatus,
      toStatus: 'cancelled',
      remark: dto.cancelReason,
    });

    this.logger.log(`工单[${ticket.ticketNo}]已取消`);
    return ticket;
  }

  async getTicketByNo(ticketNo: string): Promise<Ticket | null> {
    return this.ticketRepo.findOne({ where: { ticketNo } });
  }

  async getUrgencyLogs(ticketId: string): Promise<TicketUrgencyLog[]> {
    const logs = await this.urgencyLogRepo.find({
      where: { ticketId },
      order: { urgencyTime: 'DESC' },
    });

    for (const log of logs) {
      if (log.contactPhone) {
        log.contactPhone = this.maskPhone(this.sm4Util.decrypt(log.contactPhone));
      }
    }

    return logs;
  }

  private generateTicketNo(): string {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const random = nanoid(8).toUpperCase();
    return `GCT${yyyy}${mm}${dd}${random}`;
  }

  private maskPhone(phone: string): string {
    if (!phone || phone.length < 7) return phone;
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
  }

  private applyQueryFilters(qb: any, query: TicketListQueryDto): void {
    if (query.status) {
      qb.andWhere('t.status = :status', { status: query.status });
    }
    if (query.source) {
      qb.andWhere('t.source = :source', { source: query.source });
    }
    if (query.priority) {
      qb.andWhere('t.priority = :priority', { priority: query.priority });
    }
    if (query.ticketNo) {
      qb.andWhere('t.ticket_no LIKE :ticketNo', { ticketNo: `%${query.ticketNo}%` });
    }
    if (query.categoryId) {
      qb.andWhere('(t.category_id = :categoryId OR t.sub_category_id = :categoryId)', { categoryId: query.categoryId });
    }
    if (query.keyword) {
      qb.andWhere(new Brackets(sq => {
        sq.where('t.title LIKE :keyword', { keyword: `%${query.keyword}%` })
          .orWhere('t.content LIKE :keyword', { keyword: `%${query.keyword}%` });
      }));
    }
    if (query.startDate) {
      const start = new Date(query.startDate);
      start.setHours(0, 0, 0, 0);
      qb.andWhere('t.create_time >= :start', { start });
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('t.create_time <= :end', { end });
    }
  }

  async addFlowLog(data: {
    ticketId: string;
    operatorType: 'user' | 'dept' | 'admin';
    operatorId: string | null;
    operatorName?: string | null;
    action: string;
    fromStatus: string | null;
    toStatus: string | null;
    fromDeptCode?: string | null;
    toDeptCode?: string | null;
    remark?: string | null;
  }): Promise<TicketFlowLog> {
    const log = this.flowLogRepo.create({
      ...data,
      createTime: new Date(),
      fromDeptCode: data.fromDeptCode || null,
      toDeptCode: data.toDeptCode || null,
    });
    return this.flowLogRepo.save(log);
  }
}
