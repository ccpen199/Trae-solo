import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import {
  CreateConsultationDto,
  UpdateConsultationDto,
  ConsultationQueryDto,
  RateConsultationDto,
  SendMessageDto,
  CreateConsultationRecordDto,
  AcceptConsultationDto,
  CancelConsultationDto,
} from './dto/consultation.dto';
import type { ConsultationOrder, ConsultationMessage } from '@pet/db';
import type { PaginationResult, PaymentStatus } from '@pet/shared';

@Controller('consultations')
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createConsultationDto: CreateConsultationDto): Promise<ConsultationOrder> {
    return this.consultationService.create(createConsultationDto);
  }

  @Get()
  async findAll(@Query() query: ConsultationQueryDto): Promise<PaginationResult<ConsultationOrder>> {
    return this.consultationService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ConsultationOrder> {
    return this.consultationService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateConsultationDto: UpdateConsultationDto,
  ): Promise<ConsultationOrder> {
    return this.consultationService.update(id, updateConsultationDto);
  }

  @Post(':id/accept')
  async acceptConsultation(
    @Param('id') id: string,
    @Body() acceptConsultationDto: AcceptConsultationDto,
  ): Promise<ConsultationOrder> {
    return this.consultationService.acceptConsultation(id, acceptConsultationDto);
  }

  @Post(':id/start')
  async startConsultation(
    @Param('id') id: string,
    @Body('doctorId') doctorId: string,
  ): Promise<ConsultationOrder> {
    return this.consultationService.startConsultation(id, doctorId);
  }

  @Post(':id/complete')
  async completeConsultation(
    @Param('id') id: string,
    @Body('doctorId') doctorId: string,
  ): Promise<ConsultationOrder> {
    return this.consultationService.completeConsultation(id, doctorId);
  }

  @Post(':id/cancel')
  async cancelConsultation(
    @Param('id') id: string,
    @Body() body: CancelConsultationDto & { userId: string },
  ): Promise<ConsultationOrder> {
    const { userId, ...rest } = body;
    return this.consultationService.cancelConsultation(id, userId, rest);
  }

  @Post(':id/rate')
  async rateConsultation(
    @Param('id') id: string,
    @Body() body: RateConsultationDto & { userId: string },
  ): Promise<ConsultationOrder> {
    const { userId, ...rest } = body;
    return this.consultationService.rateConsultation(id, userId, rest);
  }

  @Get(':id/messages')
  async getMessages(
    @Param('id') id: string,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ): Promise<PaginationResult<ConsultationMessage>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 50;
    return this.consultationService.getMessages(id, pageNum, pageSizeNum);
  }

  @Post(':id/messages')
  async sendMessage(@Body() sendMessageDto: SendMessageDto): Promise<ConsultationMessage> {
    return this.consultationService.sendMessage(sendMessageDto);
  }

  @Post(':id/messages/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markMessagesAsRead(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ): Promise<void> {
    await this.consultationService.markMessagesAsRead(id, userId);
  }

  @Get(':id/messages/unread-count')
  async getUnreadMessageCount(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ): Promise<{ count: number }> {
    const count = await this.consultationService.getUnreadMessageCount(id, userId);
    return { count };
  }

  @Post(':id/records')
  async createConsultationRecord(
    @Body() createConsultationRecordDto: CreateConsultationRecordDto,
  ): Promise<ConsultationOrder> {
    return this.consultationService.createConsultationRecord(createConsultationRecordDto);
  }

  @Get(':id/records')
  async getConsultationRecords(@Param('id') id: string): Promise<any[]> {
    return this.consultationService.getConsultationRecords(id);
  }

  @Put(':id/payment-status')
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body('paymentStatus') paymentStatus: PaymentStatus,
  ): Promise<ConsultationOrder> {
    return this.consultationService.updatePaymentStatus(id, paymentStatus);
  }
}
