import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DistributionService } from './distribution.service';
import { CreateDistributionDto, ScheduleDistributionDto, RetryDistributionDto } from './dto/distribution.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { DistributionChannel, DistributionStatus, UserRole } from '../common/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('distribution')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DistributionController {
  constructor(private readonly distributionService: DistributionService) {}

  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('channel') channel?: DistributionChannel,
    @Query('status') status?: DistributionStatus,
    @Request() req?,
  ) {
    return this.distributionService.findAll(
      paginationDto,
      req.user.id,
      req.user.role,
      channel,
      status,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.distributionService.findById(id);
  }

  @Post()
  @Roles(UserRole.CHANNEL_OPERATOR, UserRole.CHIEF_EDITOR, UserRole.ADMIN)
  async createDistribution(@Body() dto: CreateDistributionDto, @Request() req) {
    return this.distributionService.createDistribution(dto, req.user.id, req.user.role);
  }

  @Post('schedule')
  @Roles(UserRole.CHANNEL_OPERATOR, UserRole.CHIEF_EDITOR, UserRole.ADMIN)
  async scheduleDistribution(@Body() dto: ScheduleDistributionDto, @Request() req) {
    return this.distributionService.scheduleDistribution(dto, req.user.id, req.user.role);
  }

  @Get('content/:contentId')
  async getContentDistributions(@Param('contentId') contentId: string) {
    return this.distributionService.getContentDistributions(contentId);
  }

  @Get('stats/:contentId')
  async getDistributionStats(@Param('contentId') contentId: string) {
    return this.distributionService.getDistributionStats(contentId);
  }

  @Put(':id/retry')
  @Roles(UserRole.CHANNEL_OPERATOR, UserRole.CHIEF_EDITOR, UserRole.ADMIN)
  async retryDistribution(
    @Param('id') id: string,
    @Body() dto: RetryDistributionDto,
    @Request() req,
  ) {
    return this.distributionService.retryDistribution(id, dto, req.user.id);
  }
}
