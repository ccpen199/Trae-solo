import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { UploadFileDto, BatchUploadDto } from './dto';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('file')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ) {
    return this.uploadService.uploadFile(file, dto);
  }

  @Post('files')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FilesInterceptor('files', 9))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: BatchUploadDto,
  ) {
    return this.uploadService.uploadFiles(files, { ...dto, fileType: dto.fileType });
  }
}
