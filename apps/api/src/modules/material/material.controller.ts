import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { MaterialService } from './material.service';
import { CreateMaterialDto, UpdateMaterialDto } from './dto';

@Controller('materials')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('name') name?: string,
    @Query('code') code?: string,
    @Query('category') category?: string,
  ) {
    return this.materialService.findAll(page, pageSize, name, code, category);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.materialService.findOne(id);
  }

  @Post()
  async create(@Body() createMaterialDto: CreateMaterialDto) {
    return this.materialService.create(createMaterialDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateMaterialDto: UpdateMaterialDto) {
    return this.materialService.update(id, updateMaterialDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.materialService.remove(id);
  }
}
