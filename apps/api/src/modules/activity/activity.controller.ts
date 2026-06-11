import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ActivityService } from './activity.service';
import { CreateActivityEventDto, UpdateActivityEventDto, ParticipateDto, LotteryDto, DeliverPrizeDto, ActivityQueryDto } from './dto';
import { User } from '@pet/db';

@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  async create(@Body() dto: CreateActivityEventDto) {
    return this.activityService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateActivityEventDto) {
    return this.activityService.update(id, dto);
  }

  @Get()
  async findPaginated(@Query() query: ActivityQueryDto) {
    return this.activityService.findPaginated(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.activityService.findById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.activityService.delete(id);
  }

  @Post('participate')
  @UseGuards(AuthGuard('jwt'))
  async participate(@Req() req: Request & { user: User }, @Body() dto: ParticipateDto) {
    return this.activityService.participate(req.user.id, dto);
  }

  @Post('lottery')
  @UseGuards(AuthGuard('jwt'))
  async lottery(@Req() req: Request & { user: User }, @Body() dto: LotteryDto) {
    return this.activityService.lottery(req.user.id, dto);
  }

  @Post('deliver-prize')
  async deliverPrize(@Body() dto: DeliverPrizeDto) {
    return this.activityService.deliverPrize(dto);
  }
}
