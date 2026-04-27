import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreditEngineService } from '../engines/credit/credit-engine.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private creditEngineService: CreditEngineService,
  ) {}

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        role: true,
        creditScore: true,
        creditLevel: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    const creditLevel = this.creditEngineService.getCreditLevel(user.creditScore);

    return {
      ...user,
      creditLevelInfo: creditLevel,
    };
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  async update(id: string, data: { name?: string; avatar?: string }) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        role: true,
        creditScore: true,
        creditLevel: true,
        updatedAt: true,
      },
    });
  }

  async getCreditHistory(userId: string, page: number = 1, pageSize: number = 20) {
    return this.creditEngineService.getCreditHistory(userId, page, pageSize);
  }

  async getCreditLevels() {
    return this.creditEngineService.getCreditLevels();
  }
}
