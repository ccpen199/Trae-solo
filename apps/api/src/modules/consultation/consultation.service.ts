import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaClient, ConsultationOrder, ConsultationMessage, ConsultationStatus, PaymentStatus, DoctorStatus } from '@pet/db';
import { DatabaseService } from '@pet/db';
import { buildPaginationResult, calculateOffset, generateConsultationOrderNo } from '@pet/shared';
import type { PaginationResult } from '@pet/shared';
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
import { DoctorService } from '../doctor/doctor.service';

@Injectable()
export class ConsultationService {
  private readonly prisma: PrismaClient;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly doctorService: DoctorService,
  ) {
    this.prisma = DatabaseService.getClient();
  }

  async create(createConsultationDto: CreateConsultationDto): Promise<ConsultationOrder> {
    const { userId, doctorId, ...rest } = createConsultationDto;

    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('医生不存在');
    }

    if (doctor.status !== DoctorStatus.VERIFIED) {
      throw new BadRequestException('医生未通过认证，无法接诊');
    }

    const orderNo = generateConsultationOrderNo();

    const consultation = await this.prisma.consultationOrder.create({
      data: {
        ...rest,
        userId,
        doctorId,
        orderNo,
        status: ConsultationStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
          },
        },
        pet: true,
      },
    });

    this.eventEmitter.emit('consultation.created', { consultation });

    return consultation;
  }

  async findAll(query: ConsultationQueryDto): Promise<PaginationResult<ConsultationOrder>> {
    const { page, pageSize, userId, doctorId, status, paymentStatus, type, sortBy, sortOrder } = query;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (type) {
      where.type = type;
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [total, items] = await Promise.all([
      this.prisma.consultationOrder.count({ where }),
      this.prisma.consultationOrder.findMany({
        where,
        orderBy,
        skip: calculateOffset(page, pageSize),
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true,
                },
              },
            },
          },
          pet: true,
        },
      }),
    ]);

    return buildPaginationResult(items, total, page, pageSize);
  }

  async findOne(id: string): Promise<ConsultationOrder> {
    const consultation = await this.prisma.consultationOrder.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            phone: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
                phone: true,
              },
            },
          },
        },
        pet: true,
        messages: {
          take: 50,
          orderBy: { createdAt: 'asc' },
        },
        records: true,
      },
    });

    if (!consultation) {
      throw new NotFoundException('问诊订单不存在');
    }

    return consultation;
  }

  async update(id: string, updateConsultationDto: UpdateConsultationDto): Promise<ConsultationOrder> {
    await this.findOne(id);

    return this.prisma.consultationOrder.update({
      where: { id },
      data: updateConsultationDto,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async acceptConsultation(id: string, acceptConsultationDto: AcceptConsultationDto): Promise<ConsultationOrder> {
    const consultation = await this.findOne(id);

    if (consultation.status !== ConsultationStatus.PENDING) {
      throw new BadRequestException('该问诊订单状态不允许接受');
    }

    if (consultation.doctorId !== acceptConsultationDto.doctorId) {
      throw new ForbiddenException('无权限接受此问诊');
    }

    const updatedConsultation = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.consultationOrder.update({
        where: { id },
        data: {
          status: ConsultationStatus.ACCEPTED,
          startedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      await tx.doctorProfile.update({
        where: { id: acceptConsultationDto.doctorId },
        data: { consultationCount: { increment: 1 } },
      });

      return updated;
    });

    this.eventEmitter.emit('consultation.accepted', { consultation: updatedConsultation });

    return updatedConsultation;
  }

  async startConsultation(id: string, doctorId: string): Promise<ConsultationOrder> {
    const consultation = await this.findOne(id);

    if (consultation.status !== ConsultationStatus.ACCEPTED) {
      throw new BadRequestException('该问诊订单状态不允许开始');
    }

    if (consultation.doctorId !== doctorId) {
      throw new ForbiddenException('无权限开始此问诊');
    }

    const updatedConsultation = await this.prisma.consultationOrder.update({
      where: { id },
      data: {
        status: ConsultationStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    this.eventEmitter.emit('consultation.started', { consultation: updatedConsultation });

    return updatedConsultation;
  }

  async completeConsultation(id: string, doctorId: string): Promise<ConsultationOrder> {
    const consultation = await this.findOne(id);

    if (consultation.status !== ConsultationStatus.IN_PROGRESS) {
      throw new BadRequestException('该问诊订单状态不允许完成');
    }

    if (consultation.doctorId !== doctorId) {
      throw new ForbiddenException('无权限完成此问诊');
    }

    const updatedConsultation = await this.prisma.consultationOrder.update({
      where: { id },
      data: {
        status: ConsultationStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    this.eventEmitter.emit('consultation.completed', { consultation: updatedConsultation });

    return updatedConsultation;
  }

  async cancelConsultation(id: string, userId: string, cancelConsultationDto: CancelConsultationDto): Promise<ConsultationOrder> {
    const consultation = await this.findOne(id);

    if (
      consultation.status !== ConsultationStatus.PENDING &&
      consultation.status !== ConsultationStatus.ACCEPTED
    ) {
      throw new BadRequestException('该问诊订单状态不允许取消');
    }

    if (consultation.userId !== userId) {
      throw new ForbiddenException('无权限取消此问诊');
    }

    const updatedConsultation = await this.prisma.consultationOrder.update({
      where: { id },
      data: {
        status: ConsultationStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: cancelConsultationDto.cancelReason,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    this.eventEmitter.emit('consultation.cancelled', { consultation: updatedConsultation });

    return updatedConsultation;
  }

  async rateConsultation(id: string, userId: string, rateConsultationDto: RateConsultationDto): Promise<ConsultationOrder> {
    const consultation = await this.findOne(id);

    if (consultation.status !== ConsultationStatus.COMPLETED) {
      throw new BadRequestException('只有已完成的问诊才能评价');
    }

    if (consultation.userId !== userId) {
      throw new ForbiddenException('无权限评价此问诊');
    }

    if (consultation.rating) {
      throw new BadRequestException('该问诊已评价过');
    }

    const { rating, reviewContent } = rateConsultationDto;

    const updatedConsultation = await this.prisma.consultationOrder.update({
      where: { id },
      data: {
        rating,
        reviewContent,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    await this.doctorService.updateRating(consultation.doctorId, rating);

    this.eventEmitter.emit('consultation.rated', { consultation: updatedConsultation, rating, reviewContent });

    return updatedConsultation;
  }

  async sendMessage(sendMessageDto: SendMessageDto): Promise<ConsultationMessage> {
    const { consultationId, senderId, senderRole, ...rest } = sendMessageDto;

    const consultation = await this.findOne(consultationId);

    if (
      consultation.status !== ConsultationStatus.ACCEPTED &&
      consultation.status !== ConsultationStatus.IN_PROGRESS
    ) {
      throw new BadRequestException('该问诊订单状态不允许发送消息');
    }

    if (senderRole === 'user' && consultation.userId !== senderId) {
      throw new ForbiddenException('无权限在此问诊中发送消息');
    }

    if (senderRole === 'doctor' && consultation.doctorId !== senderId) {
      throw new ForbiddenException('无权限在此问诊中发送消息');
    }

    const message = await this.prisma.consultationMessage.create({
      data: {
        ...rest,
        consultationId,
        senderId,
        senderRole,
        isRead: false,
      },
    });

    this.eventEmitter.emit('consultation.message.sent', { message, consultation });

    return message;
  }

  async getMessages(
    consultationId: string,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<PaginationResult<ConsultationMessage>> {
    await this.findOne(consultationId);

    const where: any = { consultationId };

    const [total, items] = await Promise.all([
      this.prisma.consultationMessage.count({ where }),
      this.prisma.consultationMessage.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: calculateOffset(page, pageSize),
        take: pageSize,
      }),
    ]);

    return buildPaginationResult(items, total, page, pageSize);
  }

  async markMessagesAsRead(consultationId: string, userId: string): Promise<void> {
    const consultation = await this.findOne(consultationId);

    const isUser = consultation.userId === userId;
    const isDoctor = consultation.doctorId === userId;

    if (!isUser && !isDoctor) {
      throw new ForbiddenException('无权限操作此问诊消息');
    }

    const senderRole = isUser ? 'doctor' : 'user';

    await this.prisma.consultationMessage.updateMany({
      where: {
        consultationId,
        senderRole,
        isRead: false,
      },
      data: { isRead: true },
    });

    this.eventEmitter.emit('consultation.messages.read', { consultationId, userId });
  }

  async createConsultationRecord(
    createConsultationRecordDto: CreateConsultationRecordDto,
  ): Promise<ConsultationOrder> {
    const { consultationId, doctorId, ...rest } = createConsultationRecordDto;

    const consultation = await this.findOne(consultationId);

    if (consultation.status !== ConsultationStatus.IN_PROGRESS && consultation.status !== ConsultationStatus.COMPLETED) {
      throw new BadRequestException('该问诊订单状态不允许创建病历');
    }

    if (consultation.doctorId !== doctorId) {
      throw new ForbiddenException('无权限为此问诊创建病历');
    }

    const updatedConsultation = await this.prisma.$transaction(async (tx) => {
      await tx.consultationRecord.create({
        data: {
          ...rest,
          consultationId,
          doctorId,
        },
      });

      return tx.consultationOrder.update({
        where: { id: consultationId },
        data: { status: ConsultationStatus.COMPLETED, completedAt: new Date() },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true,
                },
              },
            },
          },
          records: true,
        },
      });
    });

    this.eventEmitter.emit('consultation.record.created', { consultation: updatedConsultation });

    return updatedConsultation;
  }

  async getConsultationRecords(consultationId: string): Promise<any[]> {
    const consultation = await this.findOne(consultationId);

    return this.prisma.consultationRecord.findMany({
      where: { consultationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnreadMessageCount(consultationId: string, userId: string): Promise<number> {
    const consultation = await this.findOne(consultationId);

    const isUser = consultation.userId === userId;
    const isDoctor = consultation.doctorId === userId;

    if (!isUser && !isDoctor) {
      throw new ForbiddenException('无权限查看此问诊消息');
    }

    const senderRole = isUser ? 'doctor' : 'user';

    return this.prisma.consultationMessage.count({
      where: {
        consultationId,
        senderRole,
        isRead: false,
      },
    });
  }

  async updatePaymentStatus(consultationId: string, paymentStatus: PaymentStatus): Promise<ConsultationOrder> {
    await this.findOne(consultationId);

    const updatedConsultation = await this.prisma.consultationOrder.update({
      where: { id: consultationId },
      data: {
        paymentStatus,
        paidAt: paymentStatus === PaymentStatus.PAID ? new Date() : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    this.eventEmitter.emit('consultation.payment.updated', { consultation: updatedConsultation, paymentStatus });

    return updatedConsultation;
  }
}
