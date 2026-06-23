import { db, generateId } from '../db/init';
import { City, GarbageCategory, GarbageItem, StandardPackage, CategoryWithItems } from '../../shared/types';

class StandardService {
  getCities(): City[] {
    return db.prepare(`
      SELECT id, name, province, created_at as createdAt
      FROM cities
      ORDER BY name
    `).all() as City[];
  }

  getCityById(cityId: string): City | undefined {
    return db.prepare(`
      SELECT id, name, province, created_at as createdAt
      FROM cities WHERE id = ?
    `).get(cityId) as City | undefined;
  }

  getCategoriesByCity(cityId: string): GarbageCategory[] {
    return db.prepare(`
      SELECT id, city_id as cityId, code, name, icon, color,
             guidelines, misconceptions, update_timestamp as updateTimestamp
      FROM categories
      WHERE city_id = ?
      ORDER BY code
    `).all(cityId) as GarbageCategory[];
  }

  getStandardPackage(cityId: string): StandardPackage | null {
    const city = this.getCityById(cityId);
    if (!city) return null;

    const categories = this.getCategoriesByCity(cityId);
    const categoryIds = categories.map(c => c.id);
    
    const items = db.prepare(`
      SELECT id, name, aliases, category_id as categoryId,
             city_id as cityId, requirements, misconceptions
      FROM garbage_items
      WHERE city_id = ?
    `).all(cityId) as Array<{
      id: string;
      name: string;
      aliases: string;
      categoryId: string;
      cityId: string;
      requirements: string;
      misconceptions: string;
    }>;

    const itemsByCategory = new Map<string, GarbageItem[]>();
    for (const item of items) {
      const parsedItem: GarbageItem = {
        ...item,
        aliases: JSON.parse(item.aliases || '[]')
      };
      const list = itemsByCategory.get(item.categoryId) || [];
      list.push(parsedItem);
      itemsByCategory.set(item.categoryId, list);
    }

    const categoriesWithItems: CategoryWithItems[] = categories.map(cat => ({
      ...cat,
      items: itemsByCategory.get(cat.id) || []
    }));

    const maxTimestamp = Math.max(...categories.map(c => c.updateTimestamp), 0);

    return {
      city,
      categories: categoriesWithItems,
      updateTimestamp: maxTimestamp
    };
  }

  createCategory(cityId: string, data: Omit<GarbageCategory, 'id' | 'cityId' | 'updateTimestamp'>): GarbageCategory {
    const id = generateId();
    const now = Date.now();
    db.prepare(`
      INSERT INTO categories (id, city_id, code, name, icon, color, guidelines, misconceptions, update_timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, cityId, data.code, data.name, data.icon, data.color, data.guidelines, data.misconceptions || '', now);

    return {
      id,
      cityId,
      updateTimestamp: now,
      ...data
    };
  }

  updateCategory(id: string, data: Partial<Omit<GarbageCategory, 'id' | 'cityId' | 'updateTimestamp'>>): GarbageCategory | null {
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!existing) return null;

    const now = Date.now();
    const fields = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    fields.push('update_timestamp = ?');
    values.push(now, id);

    db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    return db.prepare(`
      SELECT id, city_id as cityId, code, name, icon, color,
             guidelines, misconceptions, update_timestamp as updateTimestamp
      FROM categories WHERE id = ?
    `).get(id) as GarbageCategory;
  }

  deleteCategory(id: string): boolean {
    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return result.changes > 0;
  }

  createItem(cityId: string, data: { name: string; aliases: string[]; categoryId: string; requirements: string; misconceptions?: string }): GarbageItem {
    const id = generateId();
    db.prepare(`
      INSERT INTO garbage_items (id, name, aliases, category_id, city_id, requirements, misconceptions)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.name, JSON.stringify(data.aliases), data.categoryId, cityId, data.requirements, data.misconceptions || '');

    return {
      id,
      cityId,
      ...data
    };
  }

  updateItem(id: string, data: Partial<{ name: string; aliases: string[]; categoryId: string; requirements: string; misconceptions: string }>): GarbageItem | null {
    const existing = db.prepare('SELECT * FROM garbage_items WHERE id = ?').get(id);
    if (!existing) return null;

    const fields = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        if (key === 'aliases') {
          fields.push('aliases = ?');
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    }
    values.push(id);

    db.prepare(`UPDATE garbage_items SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const result = db.prepare(`
      SELECT id, name, aliases, category_id as categoryId,
             city_id as cityId, requirements, misconceptions
      FROM garbage_items WHERE id = ?
    `).get(id) as {
      id: string;
      name: string;
      aliases: string;
      categoryId: string;
      cityId: string;
      requirements: string;
      misconceptions: string;
    };

    return result ? { ...result, aliases: JSON.parse(result.aliases || '[]') } : null;
  }

  deleteItem(id: string): boolean {
    const result = db.prepare('DELETE FROM garbage_items WHERE id = ?').run(id);
    return result.changes > 0;
  }

  getItemsByCategory(categoryId: string): GarbageItem[] {
    const items = db.prepare(`
      SELECT id, name, aliases, category_id as categoryId,
             city_id as cityId, requirements, misconceptions
      FROM garbage_items WHERE category_id = ?
    `).all(categoryId) as Array<{
      id: string;
      name: string;
      aliases: string;
      categoryId: string;
      cityId: string;
      requirements: string;
      misconceptions: string;
    }>;

    return items.map(item => ({
      ...item,
      aliases: JSON.parse(item.aliases || '[]')
    }));
  }
}

export const standardService = new StandardService();
