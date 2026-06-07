import { BaseRepository } from './BaseRepository.js';
import type { Post } from '../types/index.js';

export class PostRepository extends BaseRepository<Post> {
  protected tableName = 'posts';
  protected columns = [
    'id',
    'title',
    'content',
    'category',
    'author_id',
    'status',
    'views',
    'created_at',
    'updated_at',
  ];

  public findByCategory(category: string): Post[] {
    return this.findAllByField('category', category);
  }

  public findByStatus(status: string): Post[] {
    return this.findAllByField('status', status);
  }

  public getPublishedPosts(page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;
    
    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE status = 'published'`;
    const dataSql = `
      SELECT 
        p.*,
        u.name as author_name,
        u.avatar as author_avatar
      FROM ${this.tableName} p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published'
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const { total } = this.executeGet<{ total: number }>(countSql) || { total: 0 };
    const items = this.executeQuery(dataSql, [pageSize, offset]);
    
    return {
      items,
      total,
      page,
      page_size: pageSize,
    };
  }

  public getPostsWithDetails(page: number = 1, pageSize: number = 10, filters?: Record<string, unknown>) {
    const offset = (page - 1) * pageSize;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters) {
      if (filters.category) {
        conditions.push('p.category = ?');
        params.push(filters.category);
      }
      if (filters.status) {
        conditions.push('p.status = ?');
        params.push(filters.status);
      }
      if (filters.author_id) {
        conditions.push('p.author_id = ?');
        params.push(filters.author_id);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} p ${whereClause}`;
    const dataSql = `
      SELECT 
        p.*,
        u.name as author_name,
        u.avatar as author_avatar
      FROM ${this.tableName} p
      LEFT JOIN users u ON p.author_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countParams = [...params];
    const dataParams = [...params, pageSize, offset];

    const { total } = this.executeGet<{ total: number }>(countSql, countParams) || { total: 0 };
    const items = this.executeQuery(dataSql, dataParams);

    return {
      items,
      total,
      page,
      page_size: pageSize,
    };
  }

  public incrementViews(postId: number): boolean {
    const sql = `UPDATE ${this.tableName} SET views = views + 1 WHERE id = ?`;
    const result = this.executeRun(sql, [postId]);
    return result.changes > 0;
  }

  public getPostWithAuthor(postId: number) {
    const sql = `
      SELECT 
        p.*,
        u.name as author_name,
        u.avatar as author_avatar
      FROM ${this.tableName} p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `;
    return this.executeGet(sql, [postId]);
  }

  public searchPosts(keyword: string, page: number = 1, pageSize: number = 10) {
    const searchPattern = `%${keyword}%`;
    const offset = (page - 1) * pageSize;
    
    const countSql = `
      SELECT COUNT(*) as total 
      FROM ${this.tableName} 
      WHERE status = 'published' AND (title LIKE ? OR content LIKE ?)
    `;
    
    const dataSql = `
      SELECT 
        p.*,
        u.name as author_name,
        u.avatar as author_avatar
      FROM ${this.tableName} p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published' AND (p.title LIKE ? OR p.content LIKE ?)
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const { total } = this.executeGet<{ total: number }>(countSql, [searchPattern, searchPattern]) || { total: 0 };
    const items = this.executeQuery(dataSql, [searchPattern, searchPattern, pageSize, offset]);
    
    return {
      items,
      total,
      page,
      page_size: pageSize,
    };
  }

  public getPostStats() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived,
        SUM(views) as total_views
      FROM ${this.tableName}
    `;
    return this.executeGet(sql);
  }
}

export default PostRepository;
