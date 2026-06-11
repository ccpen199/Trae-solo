import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AdoptionService } from './adoption.service';
import { CreateAdoptionPostDto, ApplyAdoptionDto, ReviewAdoptionDto, AdoptionQueryDto } from './dto';
import { User } from '@pet/db';

@Controller('adoptions')
export class AdoptionController {
  constructor(private readonly adoptionService: AdoptionService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createPost(@Req() req: Request & { user: User }, @Body() dto: CreateAdoptionPostDto) {
    return this.adoptionService.createPost(req.user.id, dto);
  }

  @Get()
  async findPaginated(@Query() query: AdoptionQueryDto) {
    return this.adoptionService.findPaginated(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.adoptionService.findById(id);
  }

  @Post('apply')
  @UseGuards(AuthGuard('jwt'))
  async apply(@Req() req: Request & { user: User }, @Body() dto: ApplyAdoptionDto) {
    return this.adoptionService.apply(req.user.id, dto);
  }

  @Post('review')
  @UseGuards(AuthGuard('jwt'))
  async review(@Req() req: Request & { user: User }, @Body() dto: ReviewAdoptionDto) {
    return this.adoptionService.review(req.user.id, dto);
  }
}
