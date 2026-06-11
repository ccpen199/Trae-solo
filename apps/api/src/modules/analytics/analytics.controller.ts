import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto, UserProfileQueryDto, PetProfileQueryDto, TagQueryDto } from './dto';
import { User } from '@pet/db';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  async trackEvent(@Body() dto: TrackEventDto) {
    return this.analyticsService.trackEvent(dto);
  }

  @Get('user-profile')
  @UseGuards(AuthGuard('jwt'))
  async getUserProfile(@Query() query: UserProfileQueryDto) {
    return this.analyticsService.getUserProfile(query);
  }

  @Get('pet-profile')
  @UseGuards(AuthGuard('jwt'))
  async getPetProfile(@Query() query: PetProfileQueryDto) {
    return this.analyticsService.getPetProfile(query);
  }

  @Get('user-tags')
  @UseGuards(AuthGuard('jwt'))
  async getUserTags(@Req() req: Request & { user: User }, @Query() query: TagQueryDto) {
    return this.analyticsService.getUserTags(req.user.id, query);
  }

  @Get('pet-tags')
  @UseGuards(AuthGuard('jwt'))
  async getPetTags(@Query('petId') petId: string, @Query() query: TagQueryDto) {
    return this.analyticsService.getPetTags(petId, query);
  }
}
