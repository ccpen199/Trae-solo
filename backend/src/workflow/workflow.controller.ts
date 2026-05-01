import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { StartWorkflowDto, ProcessReviewDto } from './dto/workflow.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('workflow')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('start')
  async startWorkflow(@Body() dto: StartWorkflowDto, @Request() req) {
    return this.workflowService.startWorkflow(dto, req.user.id, req.user.role);
  }

  @Get('active/:contentId')
  async getActiveWorkflow(@Param('contentId') contentId: string) {
    return this.workflowService.getActiveWorkflow(contentId);
  }

  @Get('history/:contentId')
  async getWorkflowHistory(@Param('contentId') contentId: string) {
    return this.workflowService.getWorkflowHistory(contentId);
  }

  @Get('pending')
  async getPendingReviews(@Request() req) {
    return this.workflowService.getPendingReviews(req.user.id, req.user.role);
  }

  @Put('review/:stepId')
  @Roles(UserRole.CHIEF_EDITOR, UserRole.EDITOR)
  async processReview(
    @Param('stepId') stepId: string,
    @Body() dto: ProcessReviewDto,
    @Request() req,
  ) {
    return this.workflowService.processReview(stepId, dto, req.user.id, req.user.role);
  }

  @Get('reviews/:contentId')
  async getReviewHistory(@Param('contentId') contentId: string) {
    return this.workflowService.getReviewHistory(contentId);
  }
}
