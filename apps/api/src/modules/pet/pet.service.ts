import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@pet/db';
import { buildPaginationResult, calculateOffset } from '@pet/shared/utils';
import type { PaginationResult, ListQueryParams } from '@pet/shared/types';
import type { CreatePetDto, UpdatePetDto, CreateVaccineRecordDto, UpdateVaccineRecordDto, CreateHealthRecordDto, UpdateHealthRecordDto } from './dto';

@Injectable()
export class PetService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getMyPets(userId: string) {
    return this.prisma.petProfile.findMany({
      where: { userId },
      include: {
        vaccineRecords: {
          orderBy: { vaccineDate: 'desc' },
          take: 5,
        },
        healthRecords: {
          orderBy: { recordDate: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPetById(userId: string, petId: string) {
    const pet = await this.prisma.petProfile.findUnique({
      where: { id: petId },
      include: {
        vaccineRecords: {
          orderBy: { vaccineDate: 'desc' },
        },
        healthRecords: {
          orderBy: { recordDate: 'desc' },
        },
      },
    });
    if (!pet) {
      throw new NotFoundException('宠物档案不存在');
    }
    if (pet.userId !== userId) {
      throw new ForbiddenException('无权访问该宠物档案');
    }
    return pet;
  }

  async createPet(userId: string, dto: CreatePetDto) {
    const data: Record<string, unknown> = {
      ...dto,
      userId,
    };
    if (dto.birthday) {
      data.birthday = new Date(dto.birthday);
    }
    return this.prisma.petProfile.create({
      data,
    });
  }

  async updatePet(userId: string, petId: string, dto: UpdatePetDto) {
    const pet = await this.prisma.petProfile.findUnique({ where: { id: petId } });
    if (!pet) {
      throw new NotFoundException('宠物档案不存在');
    }
    if (pet.userId !== userId) {
      throw new ForbiddenException('无权修改该宠物档案');
    }
    const data: Record<string, unknown> = { ...dto };
    if (dto.birthday) {
      data.birthday = new Date(dto.birthday);
    }
    return this.prisma.petProfile.update({
      where: { id: petId },
      data,
    });
  }

  async deletePet(userId: string, petId: string) {
    const pet = await this.prisma.petProfile.findUnique({ where: { id: petId } });
    if (!pet) {
      throw new NotFoundException('宠物档案不存在');
    }
    if (pet.userId !== userId) {
      throw new ForbiddenException('无权删除该宠物档案');
    }
    await this.prisma.petProfile.delete({ where: { id: petId } });
    return { success: true };
  }

  async getVaccineRecords(userId: string, petId: string) {
    const pet = await this.prisma.petProfile.findUnique({ where: { id: petId } });
    if (!pet) {
      throw new NotFoundException('宠物档案不存在');
    }
    if (pet.userId !== userId) {
      throw new ForbiddenException('无权访问该宠物档案');
    }
    return this.prisma.petVaccineRecord.findMany({
      where: { petId },
      orderBy: { vaccineDate: 'desc' },
    });
  }

  async createVaccineRecord(userId: string, petId: string, dto: CreateVaccineRecordDto) {
    const pet = await this.prisma.petProfile.findUnique({ where: { id: petId } });
    if (!pet) {
      throw new NotFoundException('宠物档案不存在');
    }
    if (pet.userId !== userId) {
      throw new ForbiddenException('无权修改该宠物档案');
    }
    const data: Record<string, unknown> = {
      ...dto,
      petId,
      vaccineDate: new Date(dto.vaccineDate),
    };
    if (dto.nextVaccineDate) {
      data.nextVaccineDate = new Date(dto.nextVaccineDate);
    }
    return this.prisma.petVaccineRecord.create({ data });
  }

  async updateVaccineRecord(
    userId: string,
    petId: string,
    recordId: string,
    dto: UpdateVaccineRecordDto,
  ) {
    const pet = await this.prisma.petProfile.findUnique({ where: { id: petId } });
    if (!pet) {
      throw new NotFoundException('宠物档案不存在');
    }
    if (pet.userId !== userId) {
      throw new ForbiddenException('无权修改该宠物档案');
    }
    const record = await this.prisma.petVaccineRecord.findUnique({ where: { id: recordId } });
    if (!record || record.petId !== petId) {
      throw new NotFoundException('疫苗记录不存在');
    }
    const data: Record<string, unknown> = { ...dto };
    if (dto.vaccineDate) {
      data.vaccineDate = new Date(dto.vaccineDate);
    }
    if (dto.nextVaccineDate) {
      data.nextVaccineDate = new Date(dto.nextVaccineDate);
    }
    return this.prisma.petVaccineRecord.update({
      where: { id: recordId },
      data,
    });
  }

  async deleteVaccineRecord(userId: string, petId: string, recordId: string) {
    const pet = await this.prisma.petProfile.findUnique({ where: { id: petId } });
    if (!pet) {
      throw new NotFoundException('宠物档案不存在');
    }
    if (pet.userId !== userId) {
      throw new ForbiddenException('无权修改该宠物档案');
    }
    const record = await this.prisma.petVaccineRecord.findUnique({ where: { id: recordId } });
    if (!record || record.petId !== petId) {
      throw new NotFoundException('疫苗记录不存在');
    }
    await this.prisma.petVaccineRecord.delete({ where: { id: recordId } });
    return { success: true };
  }

  async getHealthRecords(userId: string, petId: string) {
    const pet = await this.prisma.petProfile.findUnique({ where: { id: petId } });
    if (!pet) {
      throw new NotFoundException('宠物档案不存在');
    }
    if (pet.userId !== userId) {
      throw new ForbiddenException('无权访问该宠物档案');
    }
    return this.prisma.petHealthRecord.findMany({
      where: { petId },
      orderBy: { recordDate: 'desc' },
    });
  }

  async createHealthRecord(userId: string, petId: string, dto: CreateHealthRecordDto) {
    const pet = await this.prisma.petProfile.findUnique({ where: { id: petId } });
    if (!pet) {
      throw new NotFoundException('宠物档案不存在');
    }
    if (pet.userId !== userId) {
      throw new ForbiddenException('无权修改该宠物档案');
    }
    return this.prisma.petHealthRecord.create({
      data: {
        ...dto,
        petId,
        recordDate: new Date(dto.recordDate),
      },
    });
  }

  async updateHealthRecord(
    userId: string,
    petId: string,
    recordId: string,
    dto: UpdateHealthRecordDto,
  ) {
    const pet = await this.prisma.petProfile.findUnique({ where: { id: petId } });
    if (!pet) {
      throw new NotFoundException('宠物档案不存在');
    }
    if (pet.userId !== userId) {
      throw new ForbiddenException('无权修改该宠物档案');
    }
    const record = await this.prisma.petHealthRecord.findUnique({ where: { id: recordId } });
    if (!record || record.petId !== petId) {
      throw new NotFoundException('健康记录不存在');
    }
    const data: Record<string, unknown> = { ...dto };
    if (dto.recordDate) {
      data.recordDate = new Date(dto.recordDate);
    }
    return this.prisma.petHealthRecord.update({
      where: { id: recordId },
      data,
    });
  }

  async deleteHealthRecord(userId: string, petId: string, recordId: string) {
    const pet = await this.prisma.petProfile.findUnique({ where: { id: petId } });
    if (!pet) {
      throw new NotFoundException('宠物档案不存在');
    }
    if (pet.userId !== userId) {
      throw new ForbiddenException('无权修改该宠物档案');
    }
    const record = await this.prisma.petHealthRecord.findUnique({ where: { id: recordId } });
    if (!record || record.petId !== petId) {
      throw new NotFoundException('健康记录不存在');
    }
    await this.prisma.petHealthRecord.delete({ where: { id: recordId } });
    return { success: true };
  }

  async getPetList(params: ListQueryParams): Promise<PaginationResult<unknown>> {
    const { page, pageSize, keyword, sortBy, sortOrder } = params;
    const where = keyword
      ? {
          OR: [
            { name: { contains: keyword } },
            { breed: { contains: keyword } },
          ],
        }
      : {};

    const orderBy = sortBy
      ? { [sortBy]: sortOrder || 'desc' }
      : { createdAt: 'desc' as const };

    const [total, items] = await Promise.all([
      this.prisma.petProfile.count({ where }),
      this.prisma.petProfile.findMany({
        where,
        skip: calculateOffset(page, pageSize),
        take: pageSize,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      }),
    ]);

    return buildPaginationResult(items, total, page, pageSize);
  }

  async getPetDetail(petId: string) {
    const pet = await this.prisma.petProfile.findUnique({
      where: { id: petId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        vaccineRecords: {
          orderBy: { vaccineDate: 'desc' },
        },
        healthRecords: {
          orderBy: { recordDate: 'desc' },
        },
      },
    });
    if (!pet) {
      throw new NotFoundException('宠物档案不存在');
    }
    return pet;
  }
}
