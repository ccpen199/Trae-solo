import { TourStatus, AuditAction, TourGroupStatus } from '../types/constants';
import prisma from '../lib/prisma';
import { JWTPayload, PaginatedResponse } from '../types';
import { createAuditLog, getChangeSummary } from '../services/audit.service';
import { generateTourCode } from '../utils/auth';

interface CreateTourParams {
  name: string;
  description?: string;
  destination: string;
  days: number;
  nights: number;
  routeDetails?: string;
  includeItems?: string;
  excludeItems?: string;
  notes?: string;
  category?: string;
  image?: string;
  basePrice: number;
  childPrice: number;
  minGroupSize?: number;
  maxGroupSize?: number;
}

interface UpdateTourParams extends Partial<CreateTourParams> {
  status?: TourStatus;
}

interface TourListParams {
  page?: number;
  pageSize?: number;
  status?: TourStatus;
  destination?: string;
  category?: string;
  keyword?: string;
}

export class TourService {
  async createTour(user: JWTPayload, params: CreateTourParams) {
    const code = await this.generateUniqueCode();

    const tour = await prisma.tour.create({
      data: {
        code,
        ...params,
        creatorId: user.userId,
        status: TourStatus.DRAFT,
        minGroupSize: params.minGroupSize || 10,
        maxGroupSize: params.maxGroupSize || 50,
      },
    });

    await createAuditLog({
      user,
      action: AuditAction.CREATE,
      entityType: 'Tour',
      entityId: tour.id,
      entityName: tour.name,
      newValue: {
        code: tour.code,
        name: tour.name,
        destination: tour.destination,
        days: tour.days,
        nights: tour.nights,
        basePrice: tour.basePrice.toString(),
      },
    });

    return tour;
  }

  async updateTour(user: JWTPayload, tourId: string, params: UpdateTourParams) {
    const existingTour = await prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!existingTour) {
      throw new Error('线路不存在');
    }

    if (existingTour.status === TourStatus.ARCHIVED) {
      throw new Error('已归档的线路无法修改');
    }

    const oldValue = { ...existingTour };

    const updatedTour = await prisma.tour.update({
      where: { id: tourId },
      data: params,
    });

    const changes = getChangeSummary(oldValue, updatedTour);

    if (Object.keys(changes).length > 0) {
      await createAuditLog({
        user,
        action: AuditAction.UPDATE,
        entityType: 'Tour',
        entityId: tourId,
        entityName: updatedTour.name,
        oldValue,
        newValue: updatedTour,
        changes,
      });
    }

    return updatedTour;
  }

  async publishTour(user: JWTPayload, tourId: string) {
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      throw new Error('线路不存在');
    }

    if (tour.status !== TourStatus.DRAFT) {
      throw new Error('只有草稿状态的线路可以发布');
    }

    const oldValue = { status: tour.status };

    const updatedTour = await prisma.tour.update({
      where: { id: tourId },
      data: { status: TourStatus.PUBLISHED },
    });

    await createAuditLog({
      user,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'Tour',
      entityId: tourId,
      entityName: tour.name,
      oldValue,
      newValue: { status: TourStatus.PUBLISHED },
      changes: getChangeSummary(oldValue, { status: TourStatus.PUBLISHED }),
    });

    return updatedTour;
  }

  async archiveTour(user: JWTPayload, tourId: string) {
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      throw new Error('线路不存在');
    }

    const activeGroups = await prisma.tourGroup.count({
      where: {
        tourId,
        status: {
          in: [
            TourGroupStatus.PUBLISHED,
            TourGroupStatus.IN_PROGRESS,
            TourGroupStatus.FULL,
            TourGroupStatus.CONFIRMED,
          ],
        },
      },
    });

    if (activeGroups > 0) {
      throw new Error('该线路存在进行中的团期，无法归档');
    }

    const oldValue = { status: tour.status, isArchived: tour.isArchived };

    const updatedTour = await prisma.tour.update({
      where: { id: tourId },
      data: {
        status: TourStatus.ARCHIVED,
        isArchived: true,
      },
    });

    await createAuditLog({
      user,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'Tour',
      entityId: tourId,
      entityName: tour.name,
      oldValue,
      newValue: { status: TourStatus.ARCHIVED, isArchived: true },
      changes: getChangeSummary(oldValue, { status: TourStatus.ARCHIVED, isArchived: true }),
    });

    return updatedTour;
  }

  async getTour(tourId: string, includeGroups: boolean = false) {
    const include: any = {
      creator: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      agency: true,
    };

    if (includeGroups) {
      include.groups = {
        orderBy: { startDate: 'asc' },
      };
    }

    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      include,
    });

    if (!tour) {
      throw new Error('线路不存在');
    }

    return tour;
  }

  async getTourList(params: TourListParams): Promise<PaginatedResponse<any>> {
    const {
      page = 1,
      pageSize = 20,
      status,
      destination,
      category,
      keyword,
    } = params;

    const skip = (page - 1) * pageSize;

    const where: any = {
      isArchived: false,
    };

    if (status) {
      where.status = status;
    }

    if (destination) {
      where.destination = { contains: destination };
    }

    if (category) {
      where.category = category;
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
        { destination: { contains: keyword } },
      ];
    }

    const [tours, total] = await Promise.all([
      prisma.tour.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { groups: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.tour.count({ where }),
    ]);

    return {
      data: tours,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getPublicTourList(params: TourListParams): Promise<PaginatedResponse<any>> {
    const {
      page = 1,
      pageSize = 20,
      destination,
      category,
      keyword,
    } = params;

    const skip = (page - 1) * pageSize;

    const where: any = {
      status: TourStatus.PUBLISHED,
      isArchived: false,
    };

    if (destination) {
      where.destination = { contains: destination };
    }

    if (category) {
      where.category = category;
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
        { destination: { contains: keyword } },
      ];
    }

    const [tours, total] = await Promise.all([
      prisma.tour.findMany({
        where,
        include: {
          groups: {
            where: {
              status: TourGroupStatus.PUBLISHED,
              startDate: { gte: new Date() },
            },
            orderBy: { startDate: 'asc' },
            take: 3,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.tour.count({ where }),
    ]);

    return {
      data: tours,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  private async generateUniqueCode(): Promise<string> {
    const code = generateTourCode();

    const existing = await prisma.tour.findUnique({
      where: { code },
    });

    if (existing) {
      return this.generateUniqueCode();
    }

    return code;
  }

  async getTourStats(tourId: string) {
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      include: {
        groups: {
          include: {
            orders: {
              where: {
                isArchived: false,
              },
            },
          },
        },
      },
    });

    if (!tour) {
      throw new Error('线路不存在');
    }

    let totalOrders = 0;
    let totalPassengers = 0;
    let totalRevenue = 0;
    let confirmedGroups = 0;

    tour.groups.forEach((group) => {
      totalOrders += group.orders.length;

      const groupPassengers = group.orders.reduce((sum, order) => {
        return sum + order.adultCount + order.childCount;
      }, 0);
      totalPassengers += groupPassengers;

      const groupRevenue = group.orders.reduce((sum, order) => {
        return sum + order.paidAmount.toNumber();
      }, 0);
      totalRevenue += groupRevenue;

      if (groupPassengers >= group.minGroupSize) {
        confirmedGroups++;
      }
    });

    const confirmationRate = tour.groups.length > 0
      ? (confirmedGroups / tour.groups.length) * 100
      : 0;

    return {
      tourId: tour.id,
      tourCode: tour.code,
      tourName: tour.name,
      totalGroups: tour.groups.length,
      confirmedGroups,
      confirmationRate: confirmationRate.toFixed(2) + '%',
      totalOrders,
      totalPassengers,
      totalRevenue,
      averageRevenuePerOrder: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0',
    };
  }
}

export const tourService = new TourService();
