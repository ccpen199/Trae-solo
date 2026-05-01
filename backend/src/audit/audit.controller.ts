import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '../common/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Roles(UserRole.ADMIN, UserRole.CHIEF_EDITOR)
  async findAllLogs(
    @Query() paginationDto: PaginationDto,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.auditService.findAllLogs(
      paginationDto,
      userId,
      action,
      resourceType,
      start,
      end,
    );
  }

  @Get('logs/:id')
  @Roles(UserRole.ADMIN, UserRole.CHIEF_EDITOR)
  async findLogById(@Param('id') id: string) {
    return this.auditService.findLogById(id);
  }

  @Get('logs/content/:contentId')
  @Roles(UserRole.ADMIN, UserRole.CHIEF_EDITOR)
  async getContentAuditTrail(@Param('contentId') contentId: string) {
    return this.auditService.getContentAuditTrail(contentId);
  }

  @Get('logs/my-activity')
  async getUserActivityLog(
    @Query() paginationDto: PaginationDto,
    @Request() req,
  ) {
    return this.auditService.getUserActivityLog(req.user.id, paginationDto);
  }

  @Get('sensitive-words')
  @Roles(UserRole.ADMIN, UserRole.CHIEF_EDITOR)
  async findAllSensitiveWordLogs(
    @Query() paginationDto: PaginationDto,
    @Query('contentId') contentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.auditService.findAllSensitiveWordLogs(
      paginationDto,
      contentId,
      start,
      end,
    );
  }

  @Post('check-sensitive')
  async checkSensitiveWords(
    @Body() body: { content: string; contentId?: string; contentVersionId?: string },
    @Request() req,
  ) {
    return this.auditService.checkSensitiveWords(
      body.content,
      body.contentId,
      body.contentVersionId,
      req.user.id,
    );
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.DATA_ANALYST)
  async getAuditStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.auditService.getAuditStatistics(start, end);
  }
}
