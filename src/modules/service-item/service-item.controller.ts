import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceItemService } from './service-item.service';
import { MaterialTemplateService } from './material-template.service';
import { FormTemplateService } from './form-template.service';
import {
  CreateServiceItemDto,
  UpdateServiceItemDto,
  ServiceItemQueryDto,
  CreateMaterialTemplateDto,
  UpdateMaterialTemplateDto,
  CreateFormTemplateDto,
  UpdateFormTemplateDto,
} from './dto/service-item.dto';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('事项')
@Controller('service-items')
export class ServiceItemController {
  constructor(
    private readonly serviceItemService: ServiceItemService,
    private readonly materialService: MaterialTemplateService,
    private readonly formTemplateService: FormTemplateService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建服务事项' })
  async create(@Body() dto: CreateServiceItemDto) {
    return this.serviceItemService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: '获取服务事项列表' })
  async findAll(@Query() query: ServiceItemQueryDto) {
    return this.serviceItemService.findAll(query);
  }

  @Public()
  @Get('tree')
  @ApiOperation({ summary: '获取事项分类树' })
  async getTree() {
    return this.serviceItemService.getTree();
  }

  @Public()
  @Get('hot')
  @ApiOperation({ summary: '获取高频服务事项' })
  async getHotItems(@Query('limit') limit?: number) {
    return this.serviceItemService.getHotItems(limit);
  }

  @Public()
  @Get('code/:itemCode')
  @ApiOperation({ summary: '根据编码获取服务事项' })
  async findByCode(@Param('itemCode') itemCode: string) {
    return this.serviceItemService.findByCode(itemCode);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '获取服务事项详情' })
  async findOne(@Param('id') id: string) {
    return this.serviceItemService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新服务事项' })
  async update(@Param('id') id: string, @Body() dto: UpdateServiceItemDto) {
    return this.serviceItemService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除服务事项' })
  async remove(@Param('id') id: string) {
    return this.serviceItemService.remove(id);
  }

  @Post(':id/materials')
  @ApiBearerAuth()
  @ApiOperation({ summary: '添加材料模板' })
  async createMaterial(@Param('id') serviceItemId: string, @Body() dto: CreateMaterialTemplateDto) {
    return this.materialService.create(serviceItemId, dto);
  }

  @Get(':id/materials')
  @Public()
  @ApiOperation({ summary: '获取事项材料清单' })
  async getMaterials(@Param('id') serviceItemId: string) {
    return this.materialService.findByServiceItem(serviceItemId);
  }

  @Put('materials/:materialId')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新材料模板' })
  async updateMaterial(@Param('materialId') id: string, @Body() dto: UpdateMaterialTemplateDto) {
    return this.materialService.update(id, dto);
  }

  @Delete('materials/:materialId')
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除材料模板' })
  async removeMaterial(@Param('materialId') id: string) {
    return this.materialService.remove(id);
  }

  @Post(':id/forms')
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建电子表单模板' })
  async createForm(@Param('id') serviceItemId: string, @Body() dto: CreateFormTemplateDto) {
    return this.formTemplateService.create(serviceItemId, dto);
  }

  @Get(':id/forms')
  @Public()
  @ApiOperation({ summary: '获取事项表单模板' })
  async getForms(@Param('id') serviceItemId: string) {
    return this.formTemplateService.findByServiceItem(serviceItemId);
  }

  @Get('forms/:formId')
  @Public()
  @ApiOperation({ summary: '获取表单模板详情' })
  async getForm(@Param('formId') id: string) {
    return this.formTemplateService.findOne(id);
  }

  @Put('forms/:formId')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新表单模板' })
  async updateForm(@Param('formId') id: string, @Body() dto: UpdateFormTemplateDto) {
    return this.formTemplateService.update(id, dto);
  }

  @Patch('forms/:formId/active')
  @ApiBearerAuth()
  @ApiOperation({ summary: '启用/停用表单模板' })
  async setFormActive(@Param('formId') id: string, @Body('isActive') isActive: boolean) {
    return this.formTemplateService.setActive(id, isActive);
  }
}
