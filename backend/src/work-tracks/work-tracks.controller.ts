import { Controller, Get, Post, Param, Body, Request, Query } from '@nestjs/common';
import { WorkTracksService } from './work-tracks.service';
import { CreateWorkTrackDto, TrackPointDto } from './dto/create-work-track.dto';

@Controller('work-tracks')
export class WorkTracksController {
  constructor(private workTracksService: WorkTracksService) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateWorkTrackDto) {
    return this.workTracksService.create(req.user.id, dto);
  }

  @Get('order/:orderId')
  async findByOrder(@Param('orderId') orderId: string) {
    return this.workTracksService.findByOrder(orderId);
  }

  @Get('order/:orderId/points')
  async findPointsByOrder(
    @Param('orderId') orderId: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    return this.workTracksService.findPointsByOrder(orderId, startTime, endTime);
  }

  @Get('order/:orderId/stats')
  async getOrderStats(@Param('orderId') orderId: string) {
    return this.workTracksService.getOrderStats(orderId);
  }

  @Get('order/:orderId/verify')
  async verifyTracks(@Param('orderId') orderId: string) {
    return this.workTracksService.verifyTracks(orderId);
  }
}
