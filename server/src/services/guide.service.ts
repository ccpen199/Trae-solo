import { TourGroupStatus, AuditAction } from '../types/constants';
import prisma from '../lib/prisma';
import { JWTPayload, PaginatedResponse } from '../types';
import { createAuditLog } from '../services/audit.service';

interface CreateTripReportParams {
  groupId: string;
  dayNumber: number;
  title: string;
  content: string;
  weather?: string;
  issues?: string;
  touristStatus?: string;
  attachments?: string;
}

interface GuideTaskListParams {
  page?: number;
  pageSize?: number;
  status?: TourGroupStatus;
}

export class GuideService {
  async getGuideTasks(guideId: string, params: GuideTaskListParams): Promise<PaginatedResponse<any>> {
    const {
      page = 1,
      pageSize = 20,
      status,
    } = params;

    const skip = (page - 1) * pageSize;

    const where: any = {
      guideId,
    };

    if (status) {
      where.status = status;
    } else {
      where.status = {
        in: [
          TourGroupStatus.PUBLISHED,
          TourGroupStatus.CONFIRMED,
          TourGroupStatus.IN_PROGRESS,
        ],
      };
    }

    const [tasks, total] = await Promise.all([
      prisma.tourGroup.findMany({
        where,
        include: {
          tour: true,
          itineraryDays: {
            orderBy: { dayNumber: 'asc' },
          },
          orders: {
            where: {
              status: {
                in: ['PAID', 'CONFIRMED'],
              },
            },
            include: {
              passengers: true,
            },
          },
          sales: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: {
          startDate: 'asc',
        },
        skip,
        take: pageSize,
      }),
      prisma.tourGroup.count({ where }),
    ]);

    const tasksWithStats = tasks.map((group) => {
      const passengerCount = group.orders.reduce((sum, order) => {
        return sum + order.passengers.length;
      }, 0);

      const adultCount = group.orders.reduce((sum, order) => sum + order.adultCount, 0);
      const childCount = group.orders.reduce((sum, order) => sum + order.childCount, 0);

      return {
        ...group,
        passengerCount,
        adultCount,
        childCount,
      };
    });

    return {
      data: tasksWithStats,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getTaskDetail(guideId: string, groupId: string) {
    const group = await prisma.tourGroup.findUnique({
      where: { id: groupId },
      include: {
        tour: true,
        itineraryDays: {
          orderBy: { dayNumber: 'asc' },
        },
        orders: {
          where: {
            status: {
              in: ['PAID', 'CONFIRMED'],
            },
            isArchived: false,
          },
          include: {
            passengers: true,
            tourist: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        sales: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        reports: {
          orderBy: { createdAt: 'desc' },
          include: {
            reporter: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new Error('团期不存在');
    }

    if (group.guideId !== guideId) {
      throw new Error('您没有权限查看该团期');
    }

    const allPassengers = group.orders.flatMap((order) =>
      order.passengers.map((p) => ({
        ...p,
        orderId: order.id,
        touristName: order.tourist?.name,
        touristPhone: order.tourist?.phone,
      }))
    );

    const adultCount = allPassengers.filter((p) => !p.isChild).length;
    const childCount = allPassengers.filter((p) => p.isChild).length;

    return {
      ...group,
      allPassengers,
      passengerCount: allPassengers.length,
      adultCount,
      childCount,
    };
  }

  async startTour(guideId: string, groupId: string) {
    const group = await prisma.tourGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new Error('团期不存在');
    }

    if (group.guideId !== guideId) {
      throw new Error('您没有权限操作该团期');
    }

    if (group.status !== TourGroupStatus.CONFIRMED && group.status !== TourGroupStatus.PUBLISHED) {
      throw new Error('团期状态不支持开始行程');
    }

    const oldValue = { status: group.status };

    const updatedGroup = await prisma.tourGroup.update({
      where: { id: groupId },
      data: { status: TourGroupStatus.IN_PROGRESS },
    });

    await createAuditLog({
      user: { userId: guideId, username: '', role: 'GUIDE' },
      action: AuditAction.STATUS_CHANGE,
      entityType: 'TourGroup',
      entityId: groupId,
      entityName: group.code,
      oldValue,
      newValue: { status: TourGroupStatus.IN_PROGRESS },
    });

    return updatedGroup;
  }

  async completeTour(guideId: string, groupId: string) {
    const group = await prisma.tourGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new Error('团期不存在');
    }

    if (group.guideId !== guideId) {
      throw new Error('您没有权限操作该团期');
    }

    if (group.status !== TourGroupStatus.IN_PROGRESS) {
      throw new Error('只有进行中的团期可以完成');
    }

    const oldValue = { status: group.status };

    const updatedGroup = await prisma.tourGroup.update({
      where: { id: groupId },
      data: { status: TourGroupStatus.COMPLETED },
    });

    await createAuditLog({
      user: { userId: guideId, username: '', role: 'GUIDE' },
      action: AuditAction.STATUS_CHANGE,
      entityType: 'TourGroup',
      entityId: groupId,
      entityName: group.code,
      oldValue,
      newValue: { status: TourGroupStatus.COMPLETED },
    });

    return updatedGroup;
  }

  async createTripReport(user: JWTPayload, params: CreateTripReportParams) {
    const { groupId, dayNumber, title, content, weather, issues, touristStatus, attachments } = params;

    const group = await prisma.tourGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new Error('团期不存在');
    }

    if (group.guideId !== user.userId) {
      throw new Error('您没有权限为该团期创建报告');
    }

    const report = await prisma.tripReport.create({
      data: {
        groupId,
        reporterId: user.userId,
        reportDate: new Date(),
        dayNumber,
        title,
        content,
        weather,
        issues,
        touristStatus,
        attachments,
      },
    });

    await createAuditLog({
      user,
      action: AuditAction.CREATE,
      entityType: 'TripReport',
      entityId: report.id,
      entityName: report.title,
      newValue: {
        groupId,
        dayNumber,
        title,
        weather,
      },
    });

    return report;
  }

  async getGroupReports(groupId: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [reports, total] = await Promise.all([
      prisma.tripReport.findMany({
        where: {
          groupId,
          isArchived: false,
        },
        include: {
          reporter: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          reportDate: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.tripReport.count({
        where: {
          groupId,
          isArchived: false,
        },
      }),
    ]);

    return {
      data: reports,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getTouristsList(groupId: string) {
    const orders = await prisma.order.findMany({
      where: {
        groupId,
        status: {
          in: ['PAID', 'CONFIRMED'],
        },
        isArchived: false,
      },
      include: {
        passengers: true,
        tourist: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    const passengers = orders.flatMap((order) =>
      order.passengers.map((p) => ({
        ...p,
        orderId: order.id,
        touristName: order.tourist?.name,
        touristPhone: order.tourist?.phone,
        specialRequests: order.specialRequests,
      }))
    );

    return {
      total: passengers.length,
      adultCount: passengers.filter((p) => !p.isChild).length,
      childCount: passengers.filter((p) => p.isChild).length,
      passengers,
    };
  }
}

export const guideService = new GuideService();
