import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('工作流')
@ApiBearerAuth()
@Controller('workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get()
  @Roles('ADMIN', 'REGISTRAR')
  @ApiOperation({ summary: '获取所有工作流定义' })
  async getAllDefinitions() {
    return this.workflowService.getAllWorkflowDefinitions();
  }

  @Get(':entityType')
  @Roles('ADMIN', 'REGISTRAR', 'DOCTOR', 'NURSE')
  @ApiOperation({ summary: '获取指定实体的工作流定义' })
  async getDefinition(@Param('entityType') entityType: 'appointment' | 'registration' | 'queue') {
    return this.workflowService.getWorkflowDefinition(entityType);
  }
}
