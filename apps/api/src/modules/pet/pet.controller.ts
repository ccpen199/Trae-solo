import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PetService } from './pet.service';
import { CreatePetDto, UpdatePetDto, CreateVaccineRecordDto, UpdateVaccineRecordDto, CreateHealthRecordDto, UpdateHealthRecordDto } from './dto';
import { User } from '@pet/db';
import { getListQueryParams } from '@pet/shared/utils';

@Controller('pets')
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  async getMyPets(@Req() req: Request & { user: User }) {
    return this.petService.getMyPets(req.user.id);
  }

  @Get('my/:petId')
  @UseGuards(AuthGuard('jwt'))
  async getMyPet(
    @Req() req: Request & { user: User },
    @Param('petId') petId: string,
  ) {
    return this.petService.getPetById(req.user.id, petId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createPet(
    @Req() req: Request & { user: User },
    @Body() dto: CreatePetDto,
  ) {
    return this.petService.createPet(req.user.id, dto);
  }

  @Put(':petId')
  @UseGuards(AuthGuard('jwt'))
  async updatePet(
    @Req() req: Request & { user: User },
    @Param('petId') petId: string,
    @Body() dto: UpdatePetDto,
  ) {
    return this.petService.updatePet(req.user.id, petId, dto);
  }

  @Delete(':petId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePet(
    @Req() req: Request & { user: User },
    @Param('petId') petId: string,
  ) {
    return this.petService.deletePet(req.user.id, petId);
  }

  @Get(':petId/vaccines')
  @UseGuards(AuthGuard('jwt'))
  async getVaccineRecords(
    @Req() req: Request & { user: User },
    @Param('petId') petId: string,
  ) {
    return this.petService.getVaccineRecords(req.user.id, petId);
  }

  @Post(':petId/vaccines')
  @UseGuards(AuthGuard('jwt'))
  async createVaccineRecord(
    @Req() req: Request & { user: User },
    @Param('petId') petId: string,
    @Body() dto: CreateVaccineRecordDto,
  ) {
    return this.petService.createVaccineRecord(req.user.id, petId, dto);
  }

  @Put(':petId/vaccines/:recordId')
  @UseGuards(AuthGuard('jwt'))
  async updateVaccineRecord(
    @Req() req: Request & { user: User },
    @Param('petId') petId: string,
    @Param('recordId') recordId: string,
    @Body() dto: UpdateVaccineRecordDto,
  ) {
    return this.petService.updateVaccineRecord(req.user.id, petId, recordId, dto);
  }

  @Delete(':petId/vaccines/:recordId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteVaccineRecord(
    @Req() req: Request & { user: User },
    @Param('petId') petId: string,
    @Param('recordId') recordId: string,
  ) {
    return this.petService.deleteVaccineRecord(req.user.id, petId, recordId);
  }

  @Get(':petId/health-records')
  @UseGuards(AuthGuard('jwt'))
  async getHealthRecords(
    @Req() req: Request & { user: User },
    @Param('petId') petId: string,
  ) {
    return this.petService.getHealthRecords(req.user.id, petId);
  }

  @Post(':petId/health-records')
  @UseGuards(AuthGuard('jwt'))
  async createHealthRecord(
    @Req() req: Request & { user: User },
    @Param('petId') petId: string,
    @Body() dto: CreateHealthRecordDto,
  ) {
    return this.petService.createHealthRecord(req.user.id, petId, dto);
  }

  @Put(':petId/health-records/:recordId')
  @UseGuards(AuthGuard('jwt'))
  async updateHealthRecord(
    @Req() req: Request & { user: User },
    @Param('petId') petId: string,
    @Param('recordId') recordId: string,
    @Body() dto: UpdateHealthRecordDto,
  ) {
    return this.petService.updateHealthRecord(req.user.id, petId, recordId, dto);
  }

  @Delete(':petId/health-records/:recordId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteHealthRecord(
    @Req() req: Request & { user: User },
    @Param('petId') petId: string,
    @Param('recordId') recordId: string,
  ) {
    return this.petService.deleteHealthRecord(req.user.id, petId, recordId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getPetList(@Query() query: Record<string, unknown>) {
    const params = getListQueryParams(query);
    return this.petService.getPetList(params);
  }

  @Get(':petId/detail')
  @UseGuards(AuthGuard('jwt'))
  async getPetDetail(@Param('petId') petId: string) {
    return this.petService.getPetDetail(petId);
  }
}
