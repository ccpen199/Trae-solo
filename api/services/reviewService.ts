import { db } from '../db/index.ts';
import { v4 as uuidv4 } from 'uuid';
import type { ReviewRecord } from '../../shared/types.ts';
import { findUserById } from './userService.ts';

export function getReviewRecords(params: {
  page: number;
  pageSize: number;
  status?: string;
  contentType?: string;
}): { items: ReviewRecord[]; total: number } {
  const { page, pageSize, status, contentType } = params;
  const whereClauses: string[] = [];
  const values: any[] = [];

  if (status) {
    whereClauses.push('rr.status = ?');
    values.push(status);
  }
  if (contentType) {
    whereClauses.push('rr.content_type = ?');
    values.push(contentType);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const total = (db.prepare(`
    SELECT COUNT(*) as count FROM review_records rr ${whereSql}
  `).get(...values) as any).count;

  const rows = db.prepare(`
    SELECT rr.* FROM review_records rr
    ${whereSql}
    ORDER BY rr.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...values, pageSize, (page - 1) * pageSize) as any[];

  const items = rows.map((row) => {
    const record = mapReviewRecord(row);
    const submitter = findUserById(row.submitter_id);
    if (submitter) record.submitter = submitter;
    if (row.reviewer_id) {
      const reviewer = findUserById(row.reviewer_id);
      if (reviewer) record.reviewer = reviewer;
    }
    return record;
  });

  return { items, total };
}

export function getReviewRecordById(id: string): ReviewRecord | null {
  const row = db.prepare('SELECT * FROM review_records WHERE id = ?').get(id) as any;
  if (!row) return null;

  const record = mapReviewRecord(row);
  const submitter = findUserById(row.submitter_id);
  if (submitter) record.submitter = submitter;
  if (row.reviewer_id) {
    const reviewer = findUserById(row.reviewer_id);
    if (reviewer) record.reviewer = reviewer;
  }

  return record;
}

export function createReviewRecord(
  contentType: 'course' | 'video' | 'profile' | 'service',
  contentId: string,
  submitterId: string
): ReviewRecord {
  const id = uuidv4();
  const autoCheckPassed = autoContentCheck(contentType, contentId);

  db.prepare(`
    INSERT INTO review_records (id, content_type, content_id, submitter_id, status, auto_check_passed)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `).run(id, contentType, contentId, submitterId, autoCheckPassed ? 1 : 0);

  if (!autoCheckPassed) {
    db.prepare(`
      UPDATE review_records SET status = 'rejected', reason = ? WHERE id = ?
    `).run('自动审核未通过，包含违规内容', id);
    
    if (contentType === 'course') {
      db.prepare("UPDATE courses SET status = 'rejected' WHERE id = ?").run(contentId);
    }
  }

  return getReviewRecordById(id)!;
}

function autoContentCheck(contentType: string, contentId: string): boolean {
  const blockedWords = ['违规', '色情', '赌博', '诈骗', '违禁'];
  
  let content = '';
  if (contentType === 'course') {
    const course = db.prepare('SELECT title, description FROM courses WHERE id = ?').get(contentId) as any;
    if (course) {
      content = `${course.title} ${course.description || ''}`;
    }
  }
  
  for (const word of blockedWords) {
    if (content.includes(word)) {
      return false;
    }
  }
  return true;
}

export function approveReview(id: string, reviewerId: string): ReviewRecord | null {
  const record = getReviewRecordById(id);
  if (!record || record.status !== 'pending') return null;

  db.prepare(`
    UPDATE review_records 
    SET status = 'approved', reviewer_id = ?, reviewed_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(reviewerId, id);

  if (record.contentType === 'course') {
    db.prepare("UPDATE courses SET status = 'published' WHERE id = ?").run(record.contentId);
  }

  return getReviewRecordById(id);
}

export function rejectReview(id: string, reviewerId: string, reason: string): ReviewRecord | null {
  const record = getReviewRecordById(id);
  if (!record || record.status !== 'pending') return null;

  db.prepare(`
    UPDATE review_records 
    SET status = 'rejected', reviewer_id = ?, reviewed_at = CURRENT_TIMESTAMP, reason = ?
    WHERE id = ?
  `).run(reviewerId, reason, id);

  if (record.contentType === 'course') {
    db.prepare("UPDATE courses SET status = 'rejected' WHERE id = ?").run(record.contentId);
  }

  return getReviewRecordById(id);
}

export function getReviewStats() {
  const pending = (db.prepare("SELECT COUNT(*) as count FROM review_records WHERE status = 'pending'").get() as any).count;
  const approved = (db.prepare("SELECT COUNT(*) as count FROM review_records WHERE status = 'approved'").get() as any).count;
  const rejected = (db.prepare("SELECT COUNT(*) as count FROM review_records WHERE status = 'rejected'").get() as any).count;
  const autoFailed = (db.prepare("SELECT COUNT(*) as count FROM review_records WHERE auto_check_passed = 0").get() as any).count;

  return {
    pending,
    approved,
    rejected,
    autoFailed,
    total: pending + approved + rejected,
  };
}

function mapReviewRecord(row: any): ReviewRecord {
  return {
    id: row.id,
    contentType: row.content_type as ReviewRecord['contentType'],
    contentId: row.content_id,
    submitterId: row.submitter_id,
    reviewerId: row.reviewer_id || undefined,
    status: row.status as 'pending' | 'approved' | 'rejected',
    reason: row.reason || undefined,
    autoCheckPassed: !!row.auto_check_passed,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at || undefined,
  };
}
