import Fuse from 'fuse.js';
import { db } from '../db/init';
import { GarbageItem, GarbageCategory, SearchResult } from '../../shared/types';

interface SearchIndexItem {
  id: string;
  name: string;
  aliases: string;
  cityId: string;
  categoryId: string;
  requirements: string;
  misconceptions: string;
}

class SearchService {
  private fuse: Fuse<SearchIndexItem> | null = null;
  private indexItems: SearchIndexItem[] = [];
  private lastBuildTime = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000;

  private buildIndex(cityId: string) {
    const now = Date.now();
    if (this.fuse && now - this.lastBuildTime < this.CACHE_TTL) {
      return;
    }

    const items = db.prepare(`
      SELECT gi.id, gi.name, gi.aliases, gi.city_id as cityId, 
             gi.category_id as categoryId, gi.requirements, gi.misconceptions
      FROM garbage_items gi
      WHERE gi.city_id = ?
    `).all(cityId) as Array<{
      id: string;
      name: string;
      aliases: string;
      cityId: string;
      categoryId: string;
      requirements: string;
      misconceptions: string;
    }>;

    this.indexItems = items.map(item => ({
      ...item,
      aliases: item.aliases || '[]'
    }));

    const options = {
      includeScore: true,
      threshold: 0.4,
      keys: [
        { name: 'name', weight: 0.6 },
        { name: 'aliases', weight: 0.4 }
      ]
    };

    this.fuse = new Fuse(this.indexItems, options);
    this.lastBuildTime = now;
  }

  search(query: string, cityId: string, limit: number = 10): SearchResult[] {
    if (!query.trim()) return [];

    this.buildIndex(cityId);
    if (!this.fuse) return [];

    const results = this.fuse.search(query, { limit });

    const categoryIds = [...new Set(results.map(r => r.item.categoryId))];
    const placeholders = categoryIds.map(() => '?').join(',');
    const categories = db.prepare(`
      SELECT id, city_id as cityId, code, name, icon, color, 
             guidelines, misconceptions, update_timestamp as updateTimestamp
      FROM categories
      WHERE id IN (${placeholders})
    `).all(...categoryIds) as GarbageCategory[];

    const categoryMap = new Map(categories.map(c => [c.id, c]));

    return results.map(result => {
      const item: GarbageItem = {
        id: result.item.id,
        name: result.item.name,
        aliases: JSON.parse(result.item.aliases || '[]'),
        categoryId: result.item.categoryId,
        cityId: result.item.cityId,
        requirements: result.item.requirements,
        misconceptions: result.item.misconceptions
      };

      const category = categoryMap.get(result.item.categoryId);
      const aliases = JSON.parse(result.item.aliases || '[]') as string[];
      let matchedAlias: string | undefined;
      
      for (const alias of aliases) {
        if (alias.toLowerCase().includes(query.toLowerCase())) {
          matchedAlias = alias;
          break;
        }
      }

      return {
        item,
        category: category!,
        matchScore: 1 - (result.score || 0),
        matchedAlias
      };
    }).filter(r => r.category);
  }

  getHotSearches(cityId: string, limit: number = 8): GarbageItem[] {
    const items = db.prepare(`
      SELECT gi.id, gi.name, gi.aliases, gi.category_id as categoryId,
             gi.city_id as cityId, gi.requirements, gi.misconceptions
      FROM garbage_items gi
      WHERE gi.city_id = ?
      LIMIT ?
    `).all(cityId, limit) as Array<{
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

export const searchService = new SearchService();
