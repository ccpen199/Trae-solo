import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { MerchantService } from './merchant.service';
import { ApplyMerchantDto, ApproveMerchantDto, MerchantQueryDto } from './dto';
import { User } from '@pet/db';

@Controller('merchants')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Post('apply')
  @UseGuards(AuthGuard('jwt'))
  async apply(@Req() req: Request & { user: User }, @Body() dto: ApplyMerchantDto) {
    return this.merchantService.apply(req.user.id, dto);
  }

  @Post('approve')
  @UseGuards(AuthGuard('jwt'))
  async approve(@Body() dto: ApproveMerchantDto) {
    return this.merchantService.approve(dto);
  }

  @Get()
  async findPaginated(@Query() query: MerchantQueryDto) {
    return this.merchantService.findPaginated(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.merchantService.findById(id);
  }
}
