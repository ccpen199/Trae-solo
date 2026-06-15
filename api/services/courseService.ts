import { db } from '../db/index.ts';
import { v4 as uuidv4 } from 'uuid';
import type { Course, Chapter, Review } from '../../shared/types.ts';
import { findUserById } from './userService.ts';

export function getCourses(params: {
  page: number;
  pageSize: number;
  category?: string;
  keyword?: string;
  creatorId?: string;
  status?: string;
}): { items: Course[]; total: number } {
  const { page, pageSize, category, keyword, creatorId, status = 'published' } = params;
  const whereClauses: string[] = [];
  const values: any[] = [];

  if (status) {
    whereClauses.push('c.status = ?');
    values.push(status);
  }
  if (category) {
    whereClauses.push('c.category = ?');
    values.push(category);
  }
  if (keyword) {
    whereClauses.push('(c.title LIKE ? OR c.description LIKE ?)');
    values.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (creatorId) {
    whereClauses.push('c.creator_id = ?');
    values.push(creatorId);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const total = (db.prepare(`
    SELECT COUNT(*) as count FROM courses c ${whereSql}
  `).get(...values) as any).count;

  const rows = db.prepare(`
    SELECT c.* FROM courses c
    ${whereSql}
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...values, pageSize, (page - 1) * pageSize) as any[];

  const items = rows.map((row) => {
    const course = mapCourse(row);
    const creator = findUserById(row.creator_id);
    if (creator) course.creator = creator;
    return course;
  });

  return { items, total };
}

export function getCourseById(id: string): Course | null {
  const row = db.prepare('SELECT * FROM courses WHERE id = ?').get(id) as any;
  if (!row) return null;

  const course = mapCourse(row);
  const creator = findUserById(row.creator_id);
  if (creator) course.creator = creator;

  course.chapters = getChaptersByCourseId(id);
  return course;
}

export function createCourse(creatorId: string, data: Partial<Course>): Course {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO courses (id, creator_id, title, description, cover_image, category, price, subscription_price, is_subscription, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    creatorId,
    data.title || '',
    data.description || '',
    data.coverImage || '',
    data.category || '',
    data.price || 0,
    data.subscriptionPrice || null,
    data.isSubscription ? 1 : 0,
    'draft'
  );
  return getCourseById(id)!;
}

export function updateCourse(id: string, data: Partial<Course>): Course | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.coverImage !== undefined) { fields.push('cover_image = ?'); values.push(data.coverImage); }
  if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
  if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price); }
  if (data.subscriptionPrice !== undefined) { fields.push('subscription_price = ?'); values.push(data.subscriptionPrice); }
  if (data.isSubscription !== undefined) { fields.push('is_subscription = ?'); values.push(data.isSubscription ? 1 : 0); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }

  if (fields.length === 0) return getCourseById(id);

  values.push(id);
  db.prepare(`UPDATE courses SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getCourseById(id);
}

export function submitForReview(courseId: string, submitterId: string): void {
  updateCourse(courseId, { status: 'reviewing' });
  db.prepare(`
    INSERT INTO review_records (id, content_type, content_id, submitter_id, status)
    VALUES (?, 'course', ?, ?, 'pending')
  `).run(uuidv4(), courseId, submitterId);
}

export function getChaptersByCourseId(courseId: string): Chapter[] {
  const rows = db.prepare(`
    SELECT * FROM chapters WHERE course_id = ? ORDER BY order_index ASC
  `).all(courseId) as any[];
  return rows.map(mapChapter);
}

export function addChapter(courseId: string, data: Partial<Chapter>): Chapter {
  const id = uuidv4();
  const maxOrder = (db.prepare('SELECT MAX(order_index) as max_order FROM chapters WHERE course_id = ?').get(courseId) as any).max_order || 0;
  
  db.prepare(`
    INSERT INTO chapters (id, course_id, title, video_url, duration, order_index, is_free)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    courseId,
    data.title || '',
    data.videoUrl || '',
    data.duration || 0,
    maxOrder + 1,
    data.isFree ? 1 : 0
  );

  return db.prepare('SELECT * FROM chapters WHERE id = ?').get(id) as any;
}

export function updateChapter(id: string, data: Partial<Chapter>): Chapter | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.videoUrl !== undefined) { fields.push('video_url = ?'); values.push(data.videoUrl); }
  if (data.duration !== undefined) { fields.push('duration = ?'); values.push(data.duration); }
  if (data.isFree !== undefined) { fields.push('is_free = ?'); values.push(data.isFree ? 1 : 0); }
  if (data.order !== undefined) { fields.push('order_index = ?'); values.push(data.order); }

  if (fields.length === 0) {
    const row = db.prepare('SELECT * FROM chapters WHERE id = ?').get(id);
    return row ? mapChapter(row as any) : null;
  }

  values.push(id);
  db.prepare(`UPDATE chapters SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const row = db.prepare('SELECT * FROM chapters WHERE id = ?').get(id);
  return row ? mapChapter(row as any) : null;
}

export function deleteChapter(id: string): boolean {
  const result = db.prepare('DELETE FROM chapters WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getCourseReviews(courseId: string, page: number, pageSize: number): { items: Review[]; total: number } {
  const total = (db.prepare('SELECT COUNT(*) as count FROM reviews WHERE course_id = ?').get(courseId) as any).count;
  const rows = db.prepare(`
    SELECT * FROM reviews WHERE course_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(courseId, pageSize, (page - 1) * pageSize) as any[];

  const items = rows.map((row) => {
    const review = mapReview(row);
    const user = findUserById(row.user_id);
    if (user) review.user = user;
    return review;
  });

  return { items, total };
}

export function addCourseReview(courseId: string, userId: string, rating: number, content: string): Review {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO reviews (id, course_id, user_id, rating, content)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, courseId, userId, rating, content);

  const avgResult = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE course_id = ?').get(courseId) as any;
  db.prepare('UPDATE courses SET rating = ?, review_count = ? WHERE id = ?').run(avgResult.avg || 5, avgResult.count || 0, courseId);

  const row = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id) as any;
  return mapReview(row);
}

export function purchaseCourse(userId: string, courseId: string, type: 'one_time' | 'subscription' = 'one_time'): boolean {
  try {
    const expiresAt = type === 'subscription' 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const existing = db.prepare('SELECT 1 FROM user_courses WHERE user_id = ? AND course_id = ?').get(userId, courseId);
    if (existing) {
      db.prepare(`
        UPDATE user_courses SET purchase_type = ?, expires_at = ? WHERE user_id = ? AND course_id = ?
      `).run(type, expiresAt, userId, courseId);
    } else {
      db.prepare(`
        INSERT INTO user_courses (user_id, course_id, purchase_type, expires_at)
        VALUES (?, ?, ?, ?)
      `).run(userId, courseId, type, expiresAt);
      
      db.prepare('UPDATE courses SET student_count = student_count + 1 WHERE id = ?').run(courseId);
    }
    return true;
  } catch (e) {
    return false;
  }
}

export function hasCourseAccess(userId: string, courseId: string): boolean {
  const row = db.prepare(`
    SELECT 1 FROM user_courses 
    WHERE user_id = ? AND course_id = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
  `).get(userId, courseId);
  return !!row;
}

export function getUserCourses(userId: string, page: number, pageSize: number): { items: Course[]; total: number } {
  const total = (db.prepare('SELECT COUNT(*) as count FROM user_courses WHERE user_id = ?').get(userId) as any).count;
  const rows = db.prepare(`
    SELECT c.* FROM user_courses uc
    JOIN courses c ON uc.course_id = c.id
    WHERE uc.user_id = ?
    ORDER BY uc.created_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, pageSize, (page - 1) * pageSize) as any[];

  const items = rows.map((row) => {
    const course = mapCourse(row);
    const creator = findUserById(row.creator_id);
    if (creator) course.creator = creator;
    return course;
  });

  return { items, total };
}

function mapCourse(row: any): Course {
  return {
    id: row.id,
    creatorId: row.creator_id,
    title: row.title,
    description: row.description || undefined,
    coverImage: row.cover_image || undefined,
    category: row.category || undefined,
    price: row.price,
    subscriptionPrice: row.subscription_price || undefined,
    isSubscription: !!row.is_subscription,
    studentCount: row.student_count,
    rating: row.rating,
    reviewCount: row.review_count,
    status: row.status as 'draft' | 'reviewing' | 'published' | 'rejected',
    createdAt: row.created_at,
  };
}

function mapChapter(row: any): Chapter {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    videoUrl: row.video_url || undefined,
    duration: row.duration,
    order: row.order_index,
    isFree: !!row.is_free,
  };
}

function mapReview(row: any): Review {
  return {
    id: row.id,
    orderId: row.order_id || undefined,
    courseId: row.course_id || undefined,
    userId: row.user_id,
    rating: row.rating,
    content: row.content || undefined,
    createdAt: row.created_at,
  };
}
