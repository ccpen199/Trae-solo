import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ContentsService } from './contents.service';
import {
  CreateContentDto,
  UpdateContentDto,
  UpdateStatusDto,
  CreateCategoryDto,
} from './dto/content.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ContentStatus, UserRole } from '../common/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('contents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: ContentStatus,
    @Query('categoryId') categoryId?: string,
    @Request() req?,
  ) {
    return this.contentsService.findAll(
      paginationDto,
      req.user.id,
      req.user.role,
      status,
      categoryId,
    );
  }

  @Get('categories')
  async findAllCategories() {
    return this.contentsService.findAllCategories();
  }

  @Post('categories')
  @Roles(UserRole.ADMIN, UserRole.CHIEF_EDITOR)
  async createCategory(@Body() createCategoryDto: CreateCategoryDto, @Request() req) {
    return this.contentsService.createCategory(createCategoryDto, req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.contentsService.findById(id, req.user.id, req.user.role);
  }

  @Post()
  @Roles(UserRole.EDITOR, UserRole.CHIEF_EDITOR)
  async create(@Body() createContentDto: CreateContentDto, @Request() req) {
    return this.contentsService.create(createContentDto, req.user.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateContentDto: UpdateContentDto,
    @Request() req,
  ) {
    return this.contentsService.update(id, updateContentDto, req.user.id, req.user.role);
  }

  @Put(':id/status')
  @Roles(UserRole.CHIEF_EDITOR)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @Request() req,
  ) {
    return this.contentsService.updateStatus(id, updateStatusDto, req.user.id, req.user.role);
  }

  @Get(':id/versions')
  async getVersions(@Param('id') id: string) {
    return this.contentsService.getVersions(id);
  }

  @Get(':id/versions/:versionNumber')
  async getVersion(@Param('id') id: string, @Param('versionNumber') versionNumber: number) {
    return this.contentsService.getVersion(id, versionNumber);
  }

  @Get(':id/compare/:version1/:version2')
  async compareVersions(
    @Param('id') id: string,
    @Param('version1') version1: number,
    @Param('version2') version2: number,
  ) {
    return this.contentsService.compareVersions(id, version1, version2);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    return this.contentsService.delete(id, req.user.id, req.user.role);
  }
}
