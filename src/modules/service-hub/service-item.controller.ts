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
  SetMetadata,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ResponseUtil, ApiResponse as ApiRespType } from '../../common/utils/response.util';
import { JwtAuthGuard, IS_PUBLIC_KEY } from '../../common/guards/jwt-auth.guard';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { ServiceCategoryService } from './services/service-category.service';
import { ServiceItemService } from './services/service-item.service';
import { ServiceSubitemService } from './services/service-subitem.service';
import { ScenarioGuideService } from './services/scenario-guide.service';
import {
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
  QueryServiceCategoryDto,
} from './dto/service-category.dto';
import {
  CreateServiceItemDto,
  UpdateServiceItemDto,
  QueryServiceItemDto,
} from './dto/service-item.dto';
import {
  SubmitScenarioGuideDto,
  SmartMatchSubitemDto,
} from './dto/scenario-guide.dto';
import { ServiceCategory } from './entities/service-category.entity';
import { ServiceItem } from './entities/service-item.entity';
import { ServiceSubitem } from './entities/service-subitem.entity';
import { ScenarioTree } from './entities/scenario-tree.entity';
import { ScenarioGuideResult } from './services/scenario-guide.service';

const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@ApiTags('服务事项-事项管理')
@Controller('service-hub')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServiceItemController {
  private readonly logger = new Logger(ServiceItemController.name);

  constructor(
    private readonly categoryService: ServiceCategoryService,
    private readonly itemService: ServiceItemService,
    private readonly subitemService: ServiceSubitemService,
    private readonly scenarioGuideService: ScenarioGuideService,
  ) {}

  @Public()
  @Get('categories/tree')
  @ApiOperation({ summary: '获取事项分类树', description: '按层级返回事项分类树状结构' })
  @ApiQuery({ name: 'deptCode', description: '委办局编码', required: false })
  @AuditLog({ module: 'service-hub', action: 'query', description: '查询事项分类树', recordRequest: false })
  async getCategoryTree(
    @Query('deptCode') deptCode?: string,
  ): Promise<ApiRespType<ServiceCategory[]>> {
    const tree = await this.categoryService.getCategoryTree(deptCode);
    return ResponseUtil.success(tree, '获取成功');
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: '查询事项分类列表' })
  @AuditLog({ module: 'service-hub', action: 'query', description: '查询事项分类列表', recordRequest: false })
  async getCategories(
    @Query() query: QueryServiceCategoryDto,
  ): Promise<ApiRespType<ServiceCategory[]>> {
    const list = await this.categoryService.findAll(query);
    return ResponseUtil.success(list, '获取成功');
  }

  @Post('categories')
  @ApiOperation({ summary: '创建事项分类' })
  @AuditLog({ module: 'service-hub', action: 'create', description: '创建事项分类' })
  async createCategory(
    @Body() dto: CreateServiceCategoryDto,
  ): Promise<ApiRespType<ServiceCategory>> {
    const result = await this.categoryService.create(dto);
    return ResponseUtil.created(result, '创建成功');
  }

  @Put('categories/:id')
  @ApiOperation({ summary: '更新事项分类' })
  @AuditLog({ module: 'service-hub', action: 'update', description: '更新事项分类' })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateServiceCategoryDto,
  ): Promise<ApiRespType<ServiceCategory>> {
    const result = await this.categoryService.update(id, dto);
    return ResponseUtil.success(result, '更新成功');
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: '删除事项分类' })
  @AuditLog({ module: 'service-hub', action: 'delete', description: '删除事项分类' })
  async deleteCategory(@Param('id') id: string): Promise<ApiRespType<null>> {
    await this.categoryService.delete(id);
    return ResponseUtil.success(null, '删除成功');
  }

  @Public()
  @Get('items')
  @ApiOperation({ summary: '事项列表查询', description: '按分类/委办局/关键词查询事项列表' })
  @AuditLog({ module: 'service-hub', action: 'query', description: '查询事项列表', recordRequest: false })
  async getItems(
    @Query() query: QueryServiceItemDto,
  ): Promise<ApiRespType<{ list: ServiceItem[]; total: number }>> {
    const result = await this.itemService.findAll(query);
    return ResponseUtil.success(result, '获取成功');
  }

  @Public()
  @Get('items/:id')
  @ApiOperation({ summary: '事项详情', description: '获取事项详情，包含子项列表' })
  @AuditLog({ module: 'service-hub', action: 'query', description: '查询事项详情', recordRequest: false })
  async getItemDetail(@Param('id') id: string): Promise<ApiRespType<ServiceItem>> {
    const item = await this.itemService.findDetail(id);
    return ResponseUtil.success(item, '获取成功');
  }

  @Post('items')
  @ApiOperation({ summary: '创建事项' })
  @AuditLog({ module: 'service-hub', action: 'create', description: '创建服务事项' })
  async createItem(
    @Body() dto: CreateServiceItemDto,
  ): Promise<ApiRespType<ServiceItem>> {
    const result = await this.itemService.create(dto);
    return ResponseUtil.created(result, '创建成功');
  }

  @Put('items/:id')
  @ApiOperation({ summary: '更新事项' })
  @AuditLog({ module: 'service-hub', action: 'update', description: '更新服务事项' })
  async updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateServiceItemDto,
  ): Promise<ApiRespType<ServiceItem>> {
    const result = await this.itemService.update(id, dto);
    return ResponseUtil.success(result, '更新成功');
  }

  @Delete('items/:id')
  @ApiOperation({ summary: '删除事项' })
  @AuditLog({ module: 'service-hub', action: 'delete', description: '删除服务事项' })
  async deleteItem(@Param('id') id: string): Promise<ApiRespType<null>> {
    await this.itemService.delete(id);
    return ResponseUtil.success(null, '删除成功');
  }

  @Public()
  @Get('items/:id/subitems')
  @ApiOperation({ summary: '获取事项子项列表' })
  @AuditLog({ module: 'service-hub', action: 'query', description: '查询事项子项', recordRequest: false })
  async getSubitems(@Param('id') itemId: string): Promise<ApiRespType<ServiceSubitem[]>> {
    const list = await this.subitemService.findByItemId(itemId);
    return ResponseUtil.success(list, '获取成功');
  }

  @Public()
  @Get('items/:itemId/scenario/tree')
  @ApiOperation({ summary: '获取情形引导树', description: '获取指定事项的情形引导问题树' })
  @AuditLog({ module: 'service-hub', action: 'query', description: '查询情形引导树', recordRequest: false })
  async getScenarioTree(
    @Param('itemId') itemId: string,
  ): Promise<ApiRespType<ScenarioTree | null>> {
    const tree = await this.scenarioGuideService.getScenarioTree(itemId);
    return ResponseUtil.success(tree, '获取成功');
  }

  @Public()
  @Post('items/scenario/match')
  @ApiOperation({ summary: '提交情形引导匹配', description: '根据用户回答的问题路径进行情形引导匹配，返回匹配的子项' })
  @AuditLog({ module: 'service-hub', action: 'query', description: '提交情形引导匹配' })
  async submitScenarioMatch(
    @Body() dto: SubmitScenarioGuideDto,
  ): Promise<ApiRespType<ScenarioGuideResult>> {
    const result = await this.scenarioGuideService.submitAnswers(dto);
    return ResponseUtil.success(result, result.matched ? '匹配成功' : '请继续作答');
  }

  @Public()
  @Post('items/scenario/smart-match')
  @ApiOperation({ summary: '智能匹配子项', description: '根据条件表达式智能匹配事项子项' })
  @AuditLog({ module: 'service-hub', action: 'query', description: '智能匹配子项' })
  async smartMatchSubitem(
    @Body() dto: SmartMatchSubitemDto,
  ): Promise<ApiRespType<ScenarioGuideResult>> {
    const result = await this.scenarioGuideService.smartMatchSubitem(dto);
    return ResponseUtil.success(result, result.matched ? '匹配成功' : '智能匹配未命中');
  }

  @Public()
  @Get('items/:id/materials')
  @ApiOperation({ summary: '获取事项所需材料清单' })
  @AuditLog({ module: 'service-hub', action: 'query', description: '查询事项材料清单', recordRequest: false })
  async getItemMaterials(@Param('id') itemId: string): Promise<ApiRespType<any[]>> {
    const materials = await this.itemService.getMaterialsRequired(itemId);
    return ResponseUtil.success(materials, '获取成功');
  }
}
