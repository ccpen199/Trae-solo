import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkTracksService {
  constructor(private prisma: PrismaService) {}

  async findByOrder(orderId: string) {
    return this.prisma.workTrack.findMany({
      where: { orderId },
      orderBy: { timestamp: 'asc' },
    });
  }

  async create(
    orderId: string,
    data: {
      lng: number;
      lat: number;
      timestamp: Date;
      speed?: number;
      altitude?: number;
      accuracy?: number;
    },
  ) {
    return this.prisma.workTrack.create({
      data: {
        orderId,
        ...data,
      },
    });
  }
}
