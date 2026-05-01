import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile as UploadedFileDecorator,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService, UploadedFile } from './services/media.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('assetType') assetType?: string,
    @Request() req?,
  ) {
    return this.mediaService.findAll(paginationDto, req.user.id, assetType);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.mediaService.findById(id);
  }

  @Get(':id/url')
  async getFileUrl(@Param('id') id: string) {
    const url = await this.mediaService.getFileUrl(id);
    return { url };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFileDecorator() file: any, @Request() req) {
    const uploadedFile: UploadedFile = {
      originalname: file.originalname,
      mimetype: file.mimetype,
      buffer: file.buffer,
      size: file.size,
    };
    return this.mediaService.uploadFile(uploadedFile, req.user.id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    return this.mediaService.delete(id, req.user.id);
  }
}
