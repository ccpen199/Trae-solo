import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Ticket, TicketStatus } from '../entities/ticket.entity';
import { DeptResponse } from '../entities/dept-response.entity';
import { TicketAttachment } from '../entities/ticket-attachment.entity';
import { TicketService } from './ticket.service';
import { DeptDispatchService } from './dept-dispatch.service';
import {
  DispatchTicketDto,
  TransferTicketDto,
  ReturnTicketDto,
  ExtendTicketDto,
  ReplyTicketDto,
  CloseTicketDto,
  AdminTicketListQueryDto,
} from '../dto/ticket-flow.dto';
import { TicketListQueryDto } from '../dto/ticket.dto';

@Injectable()
export class TicketFlowService {
  private readonly logger = new Logger(TicketFlowService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(DeptResponse)
    private readonly deptResponseRepo: Repository<DeptResponse>,
    @InjectRepository(TicketAttachment)
    private readonly attachmentRepo: Repository<TicketAttachment>,
    private readonly ticketService: TicketService,
    private readonly deptDispatchService: DeptDispatchService,
  ) {}

  async dispatchTicket(
    dto: DispatchTicketDto,
    operatorId: string,
    operatorName?: string,
  ): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: dto.ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    const validTransitions: Record<TicketStatus, TicketStatus[]> = {
      pending: ['dispatched'],
      dispatched: ['dispatched', 'processing', 'transferred', 'closed', 'cancelled'],
      processing: ['processing', 'transferred', 'closed', 'cancelled'],
      transferred: ['dispatched', 'processing', 'closed', 'cancelled'],
      closed: [],
      cancelled: [],
    };

    if (!validTransitions[ticket.status]?.includes('dispatched' as any) && ticket.status !== 'pending') {
      throw new BadRequestException(`当前状态[${ticket.status}]不支持分派操作`);
    }

    const oldStatus = ticket.status;
    ticket.deptCode = dto.deptCode;
    ticket.status = 'dispatched';
    ticket.dispatchTime = new Date();
    await this.ticketRepo.save(ticket);

    await this.ticketService.addFlowLog({
      ticketId: dto.ticketId,
      operatorType: 'admin',
      operatorId,
      operatorName: operatorName || null,
      action: 'dispatch',
      fromStatus: oldStatus,
      toStatus: 'dispatched',
      fromDeptCode: null,
      toDeptCode: dto.deptCode,
      remark: dto.remark || `分派至${dto.deptName || dto.deptCode}`,
    });

    this.logger.log(`工单[${ticket.ticketNo}]已分派至部门[${dto.deptCode}]`);
    return ticket;
  }

  async autoDispatch(ticketId: string): Promise<{ deptCode: string; matched: boolean }> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    const result = await this.deptDispatchService.dispatch(ticket);

    if (result.matched && result.deptCode) {
      const oldStatus = ticket.status;
      ticket.deptCode = result.deptCode;
      ticket.status = 'dispatched';
      ticket.dispatchTime = new Date();
      await this.ticketRepo.save(ticket);

      await this.ticketService.addFlowLog({
        ticketId,
        operatorType: 'admin',
        operatorId: 'system',
        operatorName: '智能分单系统',
        action: 'dispatch',
        fromStatus: oldStatus,
        toStatus: 'dispatched',
        toDeptCode: result.deptCode,
        remark: `智能分单: ${result.reason || '规则匹配'}`,
      });

      this.logger.log(`工单[${ticket.ticketNo}]智能分派至[${result.deptCode}]`);
    }

    return result;
  }

  async transferTicket(
    dto: TransferTicketDto,
    operatorId: string,
    operatorName?: string,
    currentDeptCode?: string,
  ): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: dto.ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    if (ticket.status === 'closed' || ticket.status === 'cancelled') {
      throw new BadRequestException('工单已办结或已取消');
    }

    if (currentDeptCode && ticket.deptCode !== currentDeptCode) {
      throw new BadRequestException('无权转办不属于本部门的工单');
    }

    const oldDeptCode = ticket.deptCode;
    const oldStatus = ticket.status;
    ticket.deptCode = dto.targetDeptCode;
    ticket.status = 'transferred';
    await this.ticketRepo.save(ticket);

    await this.ticketService.addFlowLog({
      ticketId: dto.ticketId,
      operatorType: 'dept',
      operatorId,
      operatorName: operatorName || null,
      action: 'transfer',
      fromStatus: oldStatus,
      toStatus: 'transferred',
      fromDeptCode: oldDeptCode,
      toDeptCode: dto.targetDeptCode,
      remark: dto.transferReason,
    });

    this.logger.log(`工单[${ticket.ticketNo}]从[${oldDeptCode}]转办至[${dto.targetDeptCode}]`);
    return ticket;
  }

  async returnTicket(
    dto: ReturnTicketDto,
    operatorId: string,
    operatorName?: string,
    currentDeptCode?: string,
  ): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: dto.ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    if (currentDeptCode && ticket.deptCode !== currentDeptCode) {
      throw new BadRequestException('无权退回不属于本部门的工单');
    }

    const oldDeptCode = ticket.deptCode;
    const oldStatus = ticket.status;
    ticket.deptCode = null;
    ticket.status = 'pending';
    await this.ticketRepo.save(ticket);

    await this.ticketService.addFlowLog({
      ticketId: dto.ticketId,
      operatorType: 'dept',
      operatorId,
      operatorName: operatorName || null,
      action: 'return',
      fromStatus: oldStatus,
      toStatus: 'pending',
      fromDeptCode: oldDeptCode,
      toDeptCode: null,
      remark: dto.returnReason,
    });

    this.logger.log(`工单[${ticket.ticketNo}]从[${oldDeptCode}]退回`);
    return ticket;
  }

  async extendTicket(
    dto: ExtendTicketDto,
    operatorId: string,
    operatorName?: string,
    currentDeptCode?: string,
  ): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: dto.ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    if (ticket.status === 'closed' || ticket.status === 'cancelled') {
      throw new BadRequestException('工单已办结或已取消，无法延期');
    }

    if (currentDeptCode && ticket.deptCode !== currentDeptCode) {
      throw new BadRequestException('无权操作不属于本部门的工单');
    }

    ticket.expectReplyTime = new Date(dto.expectReplyTime);
    if (ticket.status !== 'processing') {
      ticket.status = 'processing';
    }
    await this.ticketRepo.save(ticket);

    await this.ticketService.addFlowLog({
      ticketId: dto.ticketId,
      operatorType: 'dept',
      operatorId,
      operatorName: operatorName || null,
      action: 'extend',
      fromStatus: ticket.status,
      toStatus: ticket.status,
      remark: `延期至${dto.expectReplyTime}，原因: ${dto.extendReason}`,
    });

    this.logger.log(`工单[${ticket.ticketNo}]已延期`);
    return ticket;
  }

  async replyTicket(
    dto: ReplyTicketDto,
    operatorId: string,
    operatorName?: string,
    deptCode?: string,
    deptName?: string,
  ): Promise<DeptResponse> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: dto.ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    if (ticket.status === 'closed' || ticket.status === 'cancelled') {
      throw new BadRequestException('工单已办结或已取消');
    }

    const actualDeptCode = deptCode || ticket.deptCode;
    const oldStatus = ticket.status;
    if (ticket.status !== 'processing') {
      ticket.status = 'processing';
    }
    await this.ticketRepo.save(ticket);

    const response = this.deptResponseRepo.create({
      ticketId: dto.ticketId,
      deptCode: actualDeptCode || '',
      deptName: deptName || null,
      handlerId: operatorId,
      handlerName: operatorName || null,
      responseContent: dto.responseContent,
      attachments: dto.attachments || null,
      responseTime: new Date(),
      isFinal: dto.isFinal || false,
    });
    const saved = await this.deptResponseRepo.save(response);

    await this.ticketService.addFlowLog({
      ticketId: dto.ticketId,
      operatorType: 'dept',
      operatorId,
      operatorName: operatorName || null,
      action: 'reply',
      fromStatus: oldStatus,
      toStatus: ticket.status,
      remark: dto.isFinal ? '最终回复' : '阶段性回复',
    });

    this.logger.log(`部门[${actualDeptCode}]回复工单[${ticket.ticketNo}]`);
    return saved;
  }

  async closeTicket(
    dto: CloseTicketDto,
    operatorId: string,
    operatorName?: string,
    currentDeptCode?: string,
  ): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: dto.ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    if (ticket.status === 'closed' || ticket.status === 'cancelled') {
      throw new BadRequestException('工单已办结或已取消');
    }

    if (currentDeptCode && ticket.deptCode !== currentDeptCode) {
      throw new BadRequestException('无权办结不属于本部门的工单');
    }

    if (dto.finalResponse) {
      const response = this.deptResponseRepo.create({
        ticketId: dto.ticketId,
        deptCode: ticket.deptCode || '',
        handlerId: operatorId,
        handlerName: operatorName || null,
        responseContent: dto.finalResponse,
        responseTime: new Date(),
        isFinal: true,
      });
      await this.deptResponseRepo.save(response);
    }

    const oldStatus = ticket.status;
    ticket.status = 'closed';
    ticket.closeTime = new Date();
    await this.ticketRepo.save(ticket);

    await this.ticketService.addFlowLog({
      ticketId: dto.ticketId,
      operatorType: 'dept',
      operatorId,
      operatorName: operatorName || null,
      action: 'close',
      fromStatus: oldStatus,
      toStatus: 'closed',
      remark: dto.conclusion,
    });

    this.logger.log(`工单[${ticket.ticketNo}]已办结`);
    return ticket;
  }

  async getDeptTickets(
    deptCode: string,
    query: TicketListQueryDto & AdminTicketListQueryDto,
  ): Promise<{ list: Ticket[]; total: number; page: number; pageSize: number }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;

    const qb = this.ticketRepo
      .createQueryBuilder('t')
      .where('t.deleted_at IS NULL');

    if (query.deptCode) {
      qb.andWhere('t.dept_code = :deptCode', { deptCode: query.deptCode });
    } else if (deptCode) {
      qb.andWhere('t.dept_code = :deptCode', { deptCode });
    }

    if (query.mine) {
    }

    if (query.status) {
      qb.andWhere('t.status = :status', { status: query.status });
    }
    if (query.priority) {
      qb.andWhere('t.priority = :priority', { priority: query.priority });
    }
    if (query.ticketNo) {
      qb.andWhere('t.ticket_no LIKE :ticketNo', { ticketNo: `%${query.ticketNo}%` });
    }
    if (query.keyword) {
      qb.andWhere(new Brackets(sq => {
        sq.where('t.title LIKE :keyword', { keyword: `%${query.keyword}%` })
          .orWhere('t.content LIKE :keyword', { keyword: `%${query.keyword}%` });
      }));
    }

    qb.orderBy('CASE t.priority WHEN "urgent" THEN 1 WHEN "high" THEN 2 WHEN "normal" THEN 3 ELSE 4 END', 'ASC')
      .addOrderBy('t.create_time', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, pageSize };
  }

  async getStatistics(startDate?: string, endDate?: string): Promise<any> {
    const qb = this.ticketRepo
      .createQueryBuilder('t')
      .where('t.deleted_at IS NULL');

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      qb.andWhere('t.create_time >= :start', { start });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('t.create_time <= :end', { end });
    }

    const all = await qb.getMany();

    const total = all.length;
    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let avgHandleDays = 0;
    let closedCount = 0;

    for (const t of all) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      bySource[t.source] = (bySource[t.source] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;

      if (t.status === 'closed' && t.closeTime) {
        closedCount++;
        const days = (t.closeTime.getTime() - t.createTime.getTime()) / (1000 * 3600 * 24);
        avgHandleDays += days;
      }
    }

    if (closedCount > 0) {
      avgHandleDays = avgHandleDays / closedCount;
    }

    return {
      total,
      closedCount,
      pendingCount: byStatus['pending'] || 0,
      processingCount: (byStatus['dispatched'] || 0) + (byStatus['processing'] || 0) + (byStatus['transferred'] || 0),
      cancelledCount: byStatus['cancelled'] || 0,
      byStatus,
      bySource,
      byPriority,
      avgHandleDays: Number(avgHandleDays.toFixed(2)),
      closeRate: total > 0 ? Number((closedCount / total * 100).toFixed(2)) : 0,
    };
  }

  async getResponses(ticketId: string): Promise<DeptResponse[]> {
    return this.deptResponseRepo.find({
      where: { ticketId },
      order: { responseTime: 'ASC' },
    });
  }
}
