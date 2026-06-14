import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PolicyService } from './policy.service';
import { CreatePolicyDto, UpdatePolicyDto, PolicyQueryDto } from './dto/policy.dto';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('政策')
@Controller('policies')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建政策文件' })
  async create(@Body() dto: CreatePolicyDto) {
    return this.policyService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: '获取政策文件列表' })
  async findAll(@Query() query: PolicyQueryDto) {
    return this.policyService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '获取政策文件详情' })
  async findOne(@Param('id') id: string) {
    return this.policyService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新政策文件' })
  async update(@Param('id') id: string, @Body() dto: UpdatePolicyDto) {
    return this.policyService.update(id, dto);
  }

  @Post(':id/trained')
  @ApiBearerAuth()
  @ApiOperation({ summary: '标记政策已用于AI训练' })
  async markTrained(@Param('id') id: string) {
    return this.policyService.markTrained(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除政策文件' })
  async remove(@Param('id') id: string) {
    return this.policyService.remove(id);
  }
}
