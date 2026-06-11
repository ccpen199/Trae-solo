import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto, UpdateDoctorDto, DoctorQueryDto, AuditDoctorDto, UpdateOnlineStatusDto } from './dto/doctor.dto';
import type { DoctorProfile } from '@pet/db';
import type { PaginationResult } from '@pet/shared';

@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDoctorDto: CreateDoctorDto): Promise<DoctorProfile> {
    return this.doctorService.create(createDoctorDto);
  }

  @Get()
  async findAll(@Query() query: DoctorQueryDto): Promise<PaginationResult<DoctorProfile>> {
    return this.doctorService.findAll(query);
  }

  @Get('online')
  async findOnlineDoctors(@Query('limit') limit: string): Promise<DoctorProfile[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.doctorService.findOnlineDoctors(limitNum);
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string): Promise<DoctorProfile> {
    return this.doctorService.findByUserId(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<DoctorProfile> {
    return this.doctorService.findOne(id);
  }

  @Get(':id/statistics')
  async getDoctorStatistics(@Param('id') id: string): Promise<{
    totalConsultations: number;
    totalReviews: number;
    averageRating: number;
    todayConsultations: number;
  }> {
    return this.doctorService.getDoctorStatistics(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDoctorDto: UpdateDoctorDto & { userId: string },
  ): Promise<DoctorProfile> {
    const { userId, ...rest } = updateDoctorDto;
    return this.doctorService.update(id, userId, rest);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.doctorService.remove(id);
  }

  @Post(':id/audit')
  async auditDoctor(
    @Param('id') id: string,
    @Body() auditDoctorDto: AuditDoctorDto,
  ): Promise<DoctorProfile> {
    return this.doctorService.auditDoctor(id, auditDoctorDto);
  }

  @Put(':id/online-status')
  async updateOnlineStatus(
    @Param('id') id: string,
    @Body() body: UpdateOnlineStatusDto & { userId: string },
  ): Promise<DoctorProfile> {
    const { userId, isOnline } = body;
    return this.doctorService.updateOnlineStatus(id, userId, isOnline);
  }
}
