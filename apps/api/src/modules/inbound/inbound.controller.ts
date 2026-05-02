import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { InboundService } from './inbound.service';
import { CreateInboundDto } from './dto';

@Controller('inbounds')
export class InboundController {
  constructor(private readonly inboundService: InboundService) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('materialCode') materialCode?: string,
    @Query('supplierCode') supplierCode?: string,
    @Query('batchNumber') batchNumber?: string,
  ) {
    return this.inboundService.findAll(page, pageSize, materialCode, supplierCode, batchNumber);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.inboundService.findOne(id);
  }

  @Post()
  async create(@Body() createInboundDto: CreateInboundDto) {
    return this.inboundService.create(createInboundDto);
  }
}
