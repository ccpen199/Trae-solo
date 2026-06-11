import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LogisticsService } from './logistics.service';
import { LogisticsQueryDto, SubscribeLogisticsDto, LogisticsListQueryDto } from './dto';

@Controller('logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get('query')
  @UseGuards(AuthGuard('jwt'))
  async query(@Query() dto: LogisticsQueryDto) {
    return this.logisticsService.query(dto);
  }

  @Post('subscribe')
  @UseGuards(AuthGuard('jwt'))
  async subscribe(@Body() dto: SubscribeLogisticsDto) {
    return this.logisticsService.subscribe(dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findPaginated(@Query() query: LogisticsListQueryDto) {
    return this.logisticsService.findPaginated(query);
  }
}
