import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { BomService } from './bom.service';
import { CreateBomDto, UpdateBomDto } from './dto';

@Controller('boms')
export class BomController {
  constructor(private readonly bomService: BomService) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('productCode') productCode?: string,
    @Query('productName') productName?: string,
  ) {
    return this.bomService.findAll(page, pageSize, productCode, productName);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bomService.findOne(id);
  }

  @Post()
  async create(@Body() createBomDto: CreateBomDto) {
    return this.bomService.create(createBomDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateBomDto: UpdateBomDto) {
    return this.bomService.update(id, updateBomDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.bomService.remove(id);
  }
}
