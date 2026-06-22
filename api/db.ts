import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import type {
  NewsArticle,
  WorkOrder,
  WorkOrderProgress,
  EmergencyAlert,
  ServiceOutlet,
  PublicOpinion,
} from '../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '..', 'data.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function initDb(): void {
  const database = getDb();
  database.exec(`
    CREATE TABLE IF NOT EXISTS news_article (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT,
      content TEXT NOT NULL,
      cover_image TEXT,
      category TEXT NOT NULL DEFAULT 'general',
      type TEXT NOT NULL DEFAULT 'article',
      video_url TEXT,
      source TEXT,
      publish_time TEXT NOT NULL,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS news_tag (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      tag_name TEXT NOT NULL,
      FOREIGN KEY (article_id) REFERENCES news_article(id)
    );

    CREATE TABLE IF NOT EXISTS work_order (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      responsible_dept TEXT,
      submit_time TEXT NOT NULL,
      deadline TEXT,
      rating INTEGER
    );

    CREATE TABLE IF NOT EXISTS order_progress (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      status TEXT NOT NULL,
      operator TEXT,
      remark TEXT,
      time TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES work_order(id)
    );

    CREATE TABLE IF NOT EXISTS emergency_alert (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      level TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      publish_time TEXT NOT NULL,
      effective_time TEXT,
      scope TEXT
    );

    CREATE TABLE IF NOT EXISTS service_outlet (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      address TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      phone TEXT,
      open_hours TEXT,
      queue_count INTEGER DEFAULT 0,
      queue_wait_time INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS public_opinion (
      id TEXT PRIMARY KEY,
      keyword TEXT NOT NULL,
      sentiment_score REAL NOT NULL,
      spread_count INTEGER NOT NULL,
      risk_level TEXT NOT NULL
    );
  `);
}

function mapNewsArticle(row: Record<string, unknown>, tags: string[]): NewsArticle {
  return {
    id: row.id as string,
    title: row.title as string,
    summary: (row.summary as string) || '',
    content: row.content as string,
    coverImage: (row.cover_image as string) || undefined,
    category: row.category as NewsArticle['category'],
    type: row.type as NewsArticle['type'],
    videoUrl: (row.video_url as string) || undefined,
    tags,
    source: (row.source as string) || '',
    publishTime: row.publish_time as string,
    views: row.views as number,
    likes: row.likes as number,
  };
}

function getTagsForArticle(articleId: string): string[] {
  const database = getDb();
  const rows = database
    .prepare('SELECT tag_name FROM news_tag WHERE article_id = ?')
    .all(articleId) as Array<{ tag_name: string }>;
  return rows.map((r) => r.tag_name);
}

export function getNewsArticles(params?: {
  category?: string;
  type?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): { list: NewsArticle[]; total: number } {
  const database = getDb();
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params?.category) {
    conditions.push('category = ?');
    values.push(params.category);
  }
  if (params?.type) {
    conditions.push('type = ?');
    values.push(params.type);
  }
  if (params?.search) {
    conditions.push('(title LIKE ? OR content LIKE ?)');
    values.push(`%${params.search}%`, `%${params.search}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRow = database
    .prepare(`SELECT COUNT(*) as count FROM news_article ${whereClause}`)
    .get(...values) as { count: number };
  const total = countRow.count;

  const rows = database
    .prepare(
      `SELECT * FROM news_article ${whereClause} ORDER BY publish_time DESC LIMIT ? OFFSET ?`,
    )
    .all(...values, pageSize, offset) as Array<Record<string, unknown>>;

  const list = rows.map((row) => mapNewsArticle(row, getTagsForArticle(row.id as string)));

  return { list, total };
}

export function getNewsArticleById(id: string): NewsArticle | null {
  const database = getDb();
  const row = database
    .prepare('SELECT * FROM news_article WHERE id = ?')
    .get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return mapNewsArticle(row, getTagsForArticle(id));
}

export function incrementNewsViews(id: string): void {
  const database = getDb();
  database.prepare('UPDATE news_article SET views = views + 1 WHERE id = ?').run(id);
}

export function likeNewsArticle(id: string): number {
  const database = getDb();
  database.prepare('UPDATE news_article SET likes = likes + 1 WHERE id = ?').run(id);
  const row = database
    .prepare('SELECT likes FROM news_article WHERE id = ?')
    .get(id) as { likes: number };
  return row.likes;
}

export function insertNewsArticle(article: Omit<NewsArticle, 'id'>): NewsArticle {
  const database = getDb();
  const id = nanoid();
  const insert = database.prepare(`
    INSERT INTO news_article (id, title, summary, content, cover_image, category, type, video_url, source, publish_time, views, likes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insert.run(
    id,
    article.title,
    article.summary,
    article.content,
    article.coverImage || null,
    article.category,
    article.type,
    article.videoUrl || null,
    article.source,
    article.publishTime,
    article.views,
    article.likes,
  );
  const insertTag = database.prepare(
    'INSERT INTO news_tag (id, article_id, tag_name) VALUES (?, ?, ?)',
  );
  for (const tag of article.tags) {
    insertTag.run(nanoid(), id, tag);
  }
  return { ...article, id };
}

function mapWorkOrder(
  row: Record<string, unknown>,
  progress: WorkOrderProgress[],
): WorkOrder {
  return {
    id: row.id as string,
    orderNo: row.order_no as string,
    title: row.title as string,
    category: row.category as string,
    description: row.description as string,
    status: row.status as WorkOrder['status'],
    responsibleDept: (row.responsible_dept as string) || '',
    submitTime: row.submit_time as string,
    deadline: (row.deadline as string) || '',
    progress,
    rating: row.rating ? (row.rating as number) : undefined,
  };
}

function getProgressForOrder(orderId: string): WorkOrderProgress[] {
  const database = getDb();
  const rows = database
    .prepare('SELECT * FROM order_progress WHERE order_id = ? ORDER BY time ASC')
    .all(orderId) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    time: r.time as string,
    status: r.status as string,
    operator: (r.operator as string) || '',
    remark: (r.remark as string) || '',
  }));
}

export function getWorkOrders(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}): { list: WorkOrder[]; total: number } {
  const database = getDb();
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params?.status) {
    conditions.push('status = ?');
    values.push(params.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRow = database
    .prepare(`SELECT COUNT(*) as count FROM work_order ${whereClause}`)
    .get(...values) as { count: number };
  const total = countRow.count;

  const rows = database
    .prepare(
      `SELECT * FROM work_order ${whereClause} ORDER BY submit_time DESC LIMIT ? OFFSET ?`,
    )
    .all(...values, pageSize, offset) as Array<Record<string, unknown>>;

  const list = rows.map((row) => mapWorkOrder(row, getProgressForOrder(row.id as string)));

  return { list, total };
}

export function getWorkOrderById(id: string): WorkOrder | null {
  const database = getDb();
  const row = database
    .prepare('SELECT * FROM work_order WHERE id = ?')
    .get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return mapWorkOrder(row, getProgressForOrder(id));
}

export function insertWorkOrder(
  order: Omit<WorkOrder, 'id' | 'orderNo' | 'progress'>,
): WorkOrder {
  const database = getDb();
  const id = nanoid();
  const orderNo = `WO${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')}`;

  database
    .prepare(`
    INSERT INTO work_order (id, order_no, title, category, description, status, responsible_dept, submit_time, deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .run(
      id,
      orderNo,
      order.title,
      order.category,
      order.description,
      order.status,
      order.responsibleDept || null,
      order.submitTime,
      order.deadline || null,
    );

  const progress: WorkOrderProgress = {
    time: order.submitTime,
    status: '已提交',
    operator: '系统',
    remark: '工单已成功提交，等待受理',
  };
  database
    .prepare(`
    INSERT INTO order_progress (id, order_id, status, operator, remark, time)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
    .run(nanoid(), id, progress.status, progress.operator, progress.remark, progress.time);

  return {
    ...order,
    id,
    orderNo,
    progress: [progress],
  };
}

export function rateWorkOrder(id: string, rating: number): void {
  const database = getDb();
  database.prepare('UPDATE work_order SET rating = ? WHERE id = ?').run(rating, id);
}

function mapEmergencyAlert(row: Record<string, unknown>): EmergencyAlert {
  return {
    id: row.id as string,
    title: row.title as string,
    level: row.level as EmergencyAlert['level'],
    type: row.type as EmergencyAlert['type'],
    content: row.content as string,
    publishTime: row.publish_time as string,
    effectiveTime: (row.effective_time as string) || '',
    scope: (row.scope as string) || '',
  };
}

export function getEmergencyAlerts(activeOnly = false): EmergencyAlert[] {
  const database = getDb();
  let sql = 'SELECT * FROM emergency_alert';
  const params: unknown[] = [];
  if (activeOnly) {
    sql += ' WHERE effective_time >= ?';
    params.push(new Date().toISOString());
  }
  sql += ' ORDER BY publish_time DESC';
  const rows = database.prepare(sql).all(...params) as Array<Record<string, unknown>>;
  return rows.map(mapEmergencyAlert);
}

export function getEmergencyAlertById(id: string): EmergencyAlert | null {
  const database = getDb();
  const row = database
    .prepare('SELECT * FROM emergency_alert WHERE id = ?')
    .get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return mapEmergencyAlert(row);
}

export function insertEmergencyAlert(alert: Omit<EmergencyAlert, 'id'>): EmergencyAlert {
  const database = getDb();
  const id = nanoid();
  database
    .prepare(`
    INSERT INTO emergency_alert (id, title, level, type, content, publish_time, effective_time, scope)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .run(
      id,
      alert.title,
      alert.level,
      alert.type,
      alert.content,
      alert.publishTime,
      alert.effectiveTime,
      alert.scope,
    );
  return { ...alert, id };
}

function mapServiceOutlet(row: Record<string, unknown>): ServiceOutlet {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as ServiceOutlet['type'],
    address: row.address as string,
    lat: row.lat as number,
    lng: row.lng as number,
    phone: (row.phone as string) || '',
    openHours: (row.open_hours as string) || '',
    queueCount: (row.queue_count as number) || 0,
    queueWaitTime: (row.queue_wait_time as number) || 0,
  };
}

export function getServiceOutlets(type?: string): ServiceOutlet[] {
  const database = getDb();
  let sql = 'SELECT * FROM service_outlet';
  const params: unknown[] = [];
  if (type) {
    sql += ' WHERE type = ?';
    params.push(type);
  }
  const rows = database.prepare(sql).all(...params) as Array<Record<string, unknown>>;
  return rows.map(mapServiceOutlet);
}

export function getServiceOutletById(id: string): ServiceOutlet | null {
  const database = getDb();
  const row = database
    .prepare('SELECT * FROM service_outlet WHERE id = ?')
    .get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return mapServiceOutlet(row);
}

export function insertServiceOutlet(outlet: Omit<ServiceOutlet, 'id'>): ServiceOutlet {
  const database = getDb();
  const id = nanoid();
  database
    .prepare(`
    INSERT INTO service_outlet (id, name, type, address, lat, lng, phone, open_hours, queue_count, queue_wait_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .run(
      id,
      outlet.name,
      outlet.type,
      outlet.address,
      outlet.lat,
      outlet.lng,
      outlet.phone,
      outlet.openHours,
      outlet.queueCount,
      outlet.queueWaitTime,
    );
  return { ...outlet, id };
}

export function getPublicOpinions(): PublicOpinion[] {
  const database = getDb();
  const rows = database
    .prepare('SELECT * FROM public_opinion ORDER BY spread_count DESC')
    .all() as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: row.id as string,
    keyword: row.keyword as string,
    sentimentScore: row.sentiment_score as number,
    spreadCount: row.spread_count as number,
    riskLevel: row.risk_level as PublicOpinion['riskLevel'],
    relatedArticles: [],
    trend: [],
  }));
}

export function insertPublicOpinion(
  opinion: Omit<PublicOpinion, 'id' | 'relatedArticles' | 'trend'>,
): PublicOpinion {
  const database = getDb();
  const id = nanoid();
  database
    .prepare(`
    INSERT INTO public_opinion (id, keyword, sentiment_score, spread_count, risk_level)
    VALUES (?, ?, ?, ?, ?)
  `)
    .run(
      id,
      opinion.keyword,
      opinion.sentimentScore,
      opinion.spreadCount,
      opinion.riskLevel,
    );
  return {
    ...opinion,
    id,
    relatedArticles: [],
    trend: [],
  };
}

export function clearAllTables(): void {
  const database = getDb();
  database.exec(`
    DELETE FROM news_tag;
    DELETE FROM news_article;
    DELETE FROM order_progress;
    DELETE FROM work_order;
    DELETE FROM emergency_alert;
    DELETE FROM service_outlet;
    DELETE FROM public_opinion;
  `);
}
