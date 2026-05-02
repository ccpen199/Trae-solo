import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuItem } from './entities/menu-item.entity';
import { MenuItemStatus, SpiceLevel, UserRole } from '../common/types';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('菜单')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Public()
  @Get('customer')
  @ApiOperation({ summary: '获取顾客端菜单' })
  async getMenuForCustomer(): Promise<MenuCategory[]> {
    return this.menuService.getMenuForCustomer();
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: '获取所有分类' })
  async getAllCategories(): Promise<MenuCategory[]> {
    return this.menuService.getAllCategories();
  }

  @Post('categories')
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '创建分类' })
  async createCategory(
    @Body()
    categoryData: {
      name: string;
      description?: string;
      iconUrl?: string;
      sortOrder?: number;
    },
  ): Promise<MenuCategory> {
    return this.menuService.createCategory(categoryData);
  }

  @Public()
  @Get('categories/:id')
  @ApiOperation({ summary: '获取分类详情' })
  async getCategoryById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MenuCategory> {
    return this.menuService.getCategoryById(id);
  }

  @Put('categories/:id')
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '更新分类' })
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updates: Partial<MenuCategory>,
  ): Promise<MenuCategory> {
    return this.menuService.updateCategory(id, updates);
  }

  @Delete('categories/:id')
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '删除分类' })
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.menuService.deleteCategory(id);
  }

  @Public()
  @Get('items')
  @ApiOperation({ summary: '获取所有菜品' })
  async getAllMenuItems(): Promise<MenuItem[]> {
    return this.menuService.getAllMenuItems();
  }

  @Public()
  @Get('items/active')
  @ApiOperation({ summary: '获取可用菜品' })
  async getActiveMenuItems(): Promise<MenuItem[]> {
    return this.menuService.getActiveMenuItems();
  }

  @Post('items')
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '创建菜品' })
  async createMenuItem(
    @Body()
    itemData: {
      name: string;
      description?: string;
      price: number;
      originalPrice?: number;
      imageUrl?: string;
      categoryId: string;
      spiceLevel?: SpiceLevel;
      attributes?: {
        vegetarian?: boolean;
        spicy?: boolean;
        cold?: boolean;
        new?: boolean;
        recommended?: boolean;
      };
      specifications?: Array<{
        name: string;
        priceAdjustment: number;
      }>;
      sortOrder?: number;
      preparationTime?: number;
    },
  ): Promise<MenuItem> {
    return this.menuService.createMenuItem(itemData);
  }

  @Public()
  @Get('items/:id')
  @ApiOperation({ summary: '获取菜品详情' })
  async getMenuItemById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MenuItem> {
    return this.menuService.getMenuItemById(id);
  }

  @Public()
  @Get('categories/:categoryId/items')
  @ApiOperation({ summary: '获取分类下的菜品' })
  async getMenuItemsByCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ): Promise<MenuItem[]> {
    return this.menuService.getMenuItemsByCategory(categoryId);
  }

  @Put('items/:id')
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '更新菜品' })
  async updateMenuItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updates: Partial<MenuItem>,
  ): Promise<MenuItem> {
    return this.menuService.updateMenuItem(id, updates);
  }

  @Put('items/:id/sold-out')
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.CHEF)
  @ApiOperation({ summary: '标记菜品为售罄' })
  async markAsSoldOut(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MenuItem> {
    return this.menuService.markAsSoldOut(id);
  }

  @Put('items/:id/available')
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '标记菜品为可用' })
  async markAsAvailable(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MenuItem> {
    return this.menuService.markAsAvailable(id);
  }

  @Delete('items/:id')
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '删除菜品' })
  async deleteMenuItem(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.menuService.deleteMenuItem(id);
  }
}
