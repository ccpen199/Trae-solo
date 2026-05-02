import { Controller, Get, Post, Param, Body, Request, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UserRole } from '../types/enums';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, req.user.role, dto);
  }

  @Get('order/:orderId')
  async findByOrder(@Param('orderId') orderId: string) {
    return this.reviewsService.findByOrder(orderId);
  }

  @Get('user/:userId')
  async findByReviewee(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    return this.reviewsService.findByReviewee(userId, page, pageSize);
  }

  @Get('stats')
  async getReviewStats(@Request() req) {
    return this.reviewsService.getReviewStats(req.user.id);
  }
}
