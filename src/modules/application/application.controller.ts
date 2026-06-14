import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ApplicationService } from './application.service';
import { MaterialUploadService } from './material-upload.service';
import { ApprovalService } from './approval.service';
import { ApplicationTimelineService } from './application-timeline.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CurrentUser, CurrentUserPayload } from '@/common/decorators/current-user.decorator';
import { CreateApplicationDto, UpdateApplicationDto, ApplicationQueryDto, ApproveDto } from './dto/application.dto';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('办件')
@Controller('applications')
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly materialService: MaterialUploadService,
    private readonly approvalService: ApprovalService,
    private readonly timelineService: ApplicationTimelineService,
    @InjectQueue('application') private applicationQueue: Queue,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建办件申请/预约' })
  async create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateApplicationDto) {
    return this.applicationService.create(user, dto);
  }

  @Post(':id/submit')
  @ApiBearerAuth()
  @ApiOperation({ summary: '提交办件进入预审' })
  async submit(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    const result = await this.applicationService.submit(user, id);
    await this.applicationQueue.add(
      'pre-review',
      { applicationId: id },
      { delay: 3000, removeOnComplete: true },
    );
    return result;
  }

  @Post(':id/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: '取消办件' })
  async cancel(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.applicationService.cancel(user, id, reason);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取办件列表' })
  async findAll(@Query() query: ApplicationQueryDto) {
    return this.applicationService.findAll(query);
  }

  @Public()
  @Get('statistics')
  @ApiOperation({ summary: '办件统计数据' })
  async getStatistics() {
    return this.applicationService.getStatistics();
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取办件详情' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.applicationService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新办件' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateApplicationDto) {
    return this.applicationService.update(id, dto);
  }

  @Get(':id/timeline')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取办件进度时间线' })
  async getTimeline(@Param('id', ParseUUIDPipe) id: string) {
    return this.timelineService.getTimeline(id);
  }

  @Post(':id/materials/:templateId/upload')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: '上传办件材料' })
  async uploadMaterial(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) applicationId: string,
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.materialService.uploadMaterial(user, applicationId, templateId, file);
  }

  @Get(':id/materials')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取办件材料列表' })
  async getMaterials(@Param('id', ParseUUIDPipe) id: string) {
    return this.materialService.getMaterials(id);
  }

  @Delete('materials/:materialId')
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除办件材料' })
  async deleteMaterial(
    @CurrentUser() user: CurrentUserPayload,
    @Param('materialId', ParseUUIDPipe) materialId: string,
  ) {
    return this.materialService.deleteMaterial(user, materialId);
  }

  @Post(':id/approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: '部门审批' })
  async approve(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ApproveDto) {
    return this.approvalService.approve({
      applicationId: id,
      approverId: user.userId,
      approverName: user.realName || '审批人',
      department: dto.department,
      action: dto.action,
      opinion: dto.opinion,
      signatureUrl: dto.signatureUrl,
      transferTo: dto.transferTo,
    });
  }
}
