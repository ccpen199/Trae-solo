import { db, generateId, now } from '../data/database';
import type { Content, ContentType, ContentStatus, PageResponse } from '../../shared/types';

export interface ContentQueryParams {
  page?: number;
  pageSize?: number;
  status?: ContentStatus;
  type?: ContentType;
  category?: string;
  region?: string;
  authorId?: string;
  keyword?: string;
}

export class ContentRepository {
  async findById(id: string): Promise<Content | undefined> {
    return db.contents.get(id);
  }

  async findAll(params: ContentQueryParams = {}): Promise<PageResponse<Content>> {
    const { page = 1, pageSize = 10, status, type, category, region, authorId, keyword } = params;
    
    let contents = Array.from(db.contents.values());

    if (status) {
      contents = contents.filter(c => c.status === status);
    }
    if (type) {
      contents = contents.filter(c => c.type === type);
    }
    if (category) {
      contents = contents.filter(c => c.category === category);
    }
    if (region) {
      contents = contents.filter(c => c.region === region);
    }
    if (authorId) {
      contents = contents.filter(c => c.authorId === authorId);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      contents = contents.filter(c => 
        c.title.toLowerCase().includes(kw) || 
        c.summary.toLowerCase().includes(kw)
      );
    }

    contents.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const total = contents.length;
    const start = (page - 1) * pageSize;
    const list = contents.slice(start, start + pageSize);

    return { list, total, page, pageSize };
  }

  async create(contentData: Omit<Content, 'id' | 'views' | 'likes' | 'shares' | 'comments' | 'createdAt' | 'updatedAt'>): Promise<Content> {
    const content: Content = {
      ...contentData,
      id: generateId(),
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      createdAt: now(),
      updatedAt: now(),
    };
    db.contents.set(content.id, content);
    return content;
  }

  async update(id: string, updates: Partial<Content>): Promise<Content | undefined> {
    const content = db.contents.get(id);
    if (!content) return undefined;

    const updated: Content = {
      ...content,
      ...updates,
      updatedAt: now(),
    };
    db.contents.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return db.contents.delete(id);
  }

  async updateStatus(id: string, status: ContentStatus): Promise<Content | undefined> {
    return this.update(id, { status, updatedAt: now() });
  }

  async incrementViews(id: string): Promise<void> {
    const content = db.contents.get(id);
    if (content) {
      content.views += 1;
      content.updatedAt = now();
      db.contents.set(id, content);
    }
  }

  async incrementLikes(id: string): Promise<void> {
    const content = db.contents.get(id);
    if (content) {
      content.likes += 1;
      content.updatedAt = now();
      db.contents.set(id, content);
    }
  }

  async incrementShares(id: string): Promise<void> {
    const content = db.contents.get(id);
    if (content) {
      content.shares += 1;
      content.updatedAt = now();
      db.contents.set(id, content);
    }
  }

  async incrementComments(id: string): Promise<void> {
    const content = db.contents.get(id);
    if (content) {
      content.comments += 1;
      content.updatedAt = now();
      db.contents.set(id, content);
    }
  }

  async publish(id: string): Promise<Content | undefined> {
    const content = db.contents.get(id);
    if (!content) return undefined;
    return this.update(id, {
      status: 'published',
      publishedAt: now(),
      updatedAt: now(),
    });
  }

  async offline(id: string): Promise<Content | undefined> {
    return this.updateStatus(id, 'offline');
  }
}

export const contentRepository = new ContentRepository();
