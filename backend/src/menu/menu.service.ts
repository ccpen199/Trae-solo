import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuCategory } from '../entities/menu-category.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { MenuItemStatus, SpiceLevel } from '../../common/types';

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(
    @InjectRepository(MenuCategory)
    private categoryRepository: Repository<MenuCategory>,
    @InjectRepository(MenuItem)
    private itemRepository: Repository<MenuItem>,
  ) {}

  async createCategory(
    categoryData: {
      name: string;
      description?: string;
      iconUrl?: string;
      sortOrder?: number;
    },
  ): Promise<MenuCategory> {
    const category = this.categoryRepository.create({
      ...categoryData,
      isActive: true,
    });

    return this.categoryRepository.save(category);
  }

  async getAllCategories(): Promise<MenuCategory[]> {
    return this.categoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
      relations: ['items'],
    });
  }

  async getCategoryById(id: string): Promise<MenuCategory> {
    return this.categoryRepository.findOne({
      where: { id },
      relations: ['items'],
    });
  }

  async updateCategory(
    id: string,
    updates: Partial<MenuCategory>,
  ): Promise<MenuCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new Error(`分类不存在: ${id}`);
    }

    Object.assign(category, updates);

    return this.categoryRepository.save(category);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!category) {
      throw new Error(`分类不存在: ${id}`);
    }

    if (category.items && category.items.length > 0) {
      throw new Error('该分类下还有菜品，无法删除');
    }

    category.isActive = false;
    await this.categoryRepository.save(category);
  }

  async createMenuItem(
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
    const category = await this.categoryRepository.findOne({
      where: { id: itemData.categoryId },
    });

    if (!category) {
      throw new Error(`分类不存在: ${itemData.categoryId}`);
    }

    const item = this.itemRepository.create({
      ...itemData,
      status: MenuItemStatus.AVAILABLE,
    });

    return this.itemRepository.save(item);
  }

  async getAllMenuItems(): Promise<MenuItem[]> {
    return this.itemRepository.find({
      relations: ['category'],
      order: {
        category: { sortOrder: 'ASC' },
        sortOrder: 'ASC',
      },
    });
  }

  async getActiveMenuItems(): Promise<MenuItem[]> {
    return this.itemRepository.find({
      where: { status: MenuItemStatus.AVAILABLE },
      relations: ['category'],
      order: {
        category: { sortOrder: 'ASC' },
        sortOrder: 'ASC',
      },
    });
  }

  async getMenuItemById(id: string): Promise<MenuItem> {
    return this.itemRepository.findOne({
      where: { id },
      relations: ['category'],
    });
  }

  async getMenuItemsByCategory(categoryId: string): Promise<MenuItem[]> {
    return this.itemRepository.find({
      where: { categoryId, status: MenuItemStatus.AVAILABLE },
      order: { sortOrder: 'ASC' },
    });
  }

  async updateMenuItem(
    id: string,
    updates: Partial<MenuItem>,
  ): Promise<MenuItem> {
    const item = await this.itemRepository.findOne({
      where: { id },
    });

    if (!item) {
      throw new Error(`菜品不存在: ${id}`);
    }

    Object.assign(item, updates);

    return this.itemRepository.save(item);
  }

  async updateMenuItemStatus(
    id: string,
    status: MenuItemStatus,
  ): Promise<MenuItem> {
    const item = await this.itemRepository.findOne({
      where: { id },
    });

    if (!item) {
      throw new Error(`菜品不存在: ${id}`);
    }

    item.status = status;

    return this.itemRepository.save(item);
  }

  async markAsSoldOut(id: string): Promise<MenuItem> {
    return this.updateMenuItemStatus(id, MenuItemStatus.SOLD_OUT);
  }

  async markAsAvailable(id: string): Promise<MenuItem> {
    return this.updateMenuItemStatus(id, MenuItemStatus.AVAILABLE);
  }

  async deleteMenuItem(id: string): Promise<void> {
    const item = await this.itemRepository.findOne({
      where: { id },
    });

    if (!item) {
      throw new Error(`菜品不存在: ${id}`);
    }

    item.status = MenuItemStatus.DISCONTINUED;
    await this.itemRepository.save(item);
  }

  async getMenuForCustomer(): Promise<MenuCategory[]> {
    const categories = await this.categoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });

    const items = await this.itemRepository.find({
      where: { status: MenuItemStatus.AVAILABLE },
      order: { sortOrder: 'ASC' },
    });

    const categoryMap = new Map<string, MenuCategory & { items: MenuItem[] }>();

    for (const category of categories) {
      categoryMap.set(category.id, {
        ...category,
        items: [],
      });
    }

    for (const item of items) {
      const category = categoryMap.get(item.categoryId);
      if (category) {
        category.items.push(item);
      }
    }

    return Array.from(categoryMap.values()).filter((c) => c.items.length > 0);
  }

  async incrementSalesCount(itemId: string, quantity: number): Promise<void> {
    const item = await this.itemRepository.findOne({
      where: { id: itemId },
    });

    if (item) {
      item.salesCount = item.salesCount + quantity;
      await this.itemRepository.save(item);
    }
  }
}
