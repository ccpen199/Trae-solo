import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuditService } from './audit.service';
import { AuditActionDto, AuditQueryDto } from './dto';
import { User } from '@pet/db';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findPaginated(@Query() query: AuditQueryDto) {
    return this.auditService.findPaginated(query);
  }

  @Get('pending-count')
  @UseGuards(AuthGuard('jwt'))
  async getPendingCount() {
    return this.auditService.getPendingCount();
  }

  @Post('action')
  @UseGuards(AuthGuard('jwt'))
  async auditAction(@Req() req: Request & { user: User }, @Body() dto: AuditActionDto) {
    return this.auditService.auditAction(req.user.id, dto);
  }

  @Post('auto')
  @UseGuards(AuthGuard('jwt'))
  async autoAudit(@Body() body: { contentId: string; contentType: string; content: string }) {
    return this.auditService.autoAudit(body.contentId, body.contentType, body.content);
  }
}
