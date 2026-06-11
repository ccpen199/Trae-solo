import db from '../db/database.js';
import crypto from 'crypto';
import { Submission, SubmissionCreateRequest, SubmissionReviewRequest, ApiResponse, SubmissionFile, IPRecord, UserRole, UserStatus } from '../../shared/types.js';
import { parseTask } from './task.service.js';

function parseUser(row: Record<string, unknown>) {
  if (!row) return undefined;
  return {
    id: row.id as number,
    email: row.email as string,
    phone: (row.phone as string) || '',
    name: row.name as string,
    avatar: (row.avatar as string) || null,
    role: row.role as UserRole,
    status: row.status as UserStatus,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function parseSubmissionFile(file: SubmissionFile): SubmissionFile {
  return {
    id: file.id,
    name: file.name,
    url: file.url,
    size: file.size,
    type: file.type,
    hash: file.hash,
  };
}

function parseSubmission(row: Record<string, unknown>): Submission {
  return {
    id: row.id as number,
    taskId: row.task_id as number,
    providerId: row.provider_id as number,
    version: row.version as number,
    title: row.title as string,
    description: (row.description as string) || '',
    files: row.files ? JSON.parse(row.files as string) : [],
    status: row.status as Submission['status'],
    reviewComment: (row.review_comment as string) || null,
    reviewScore: (row.review_score as number) || null,
    reviewedBy: (row.reviewed_by as number) || null,
    reviewedAt: (row.reviewed_at as string) || null,
    createdAt: row.created_at as string,
  };
}

function parseIPRecord(row: Record<string, unknown>): IPRecord {
  return {
    id: row.id as number,
    submissionId: row.submission_id as number,
    taskId: row.task_id as number,
    providerId: row.provider_id as number,
    fileHash: row.file_hash as string,
    fileName: row.file_name as string,
    timestamp: row.timestamp as number,
    blockHeight: (row.block_height as number) || null,
    txHash: (row.tx_hash as string) || null,
    createdAt: row.created_at as string,
  };
}

export class SubmissionService {
  async getSubmissionsByTask(taskId: number, userId: number, role: UserRole): Promise<ApiResponse<Submission[]>> {
    const taskRow = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId) as Record<string, unknown> | undefined;
    if (!taskRow) {
      return { success: false, message: '任务不存在' };
    }
    const task = parseTask(taskRow);

    if (role !== 'admin' && task.employerId !== userId && task.providerId !== userId) {
      return { success: false, message: '无权访问' };
    }

    const rows = db.prepare(`
      SELECT * FROM submissions WHERE task_id = ?
      ORDER BY version DESC, created_at DESC
    `).all(taskId) as Record<string, unknown>[];

    const submissions = rows.map(row => {
      const sub = parseSubmission(row);
      const providerRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(sub.providerId) as Record<string, unknown> | undefined;
      sub.provider = parseUser(providerRow);

      if (sub.reviewedBy) {
        const reviewerRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(sub.reviewedBy) as Record<string, unknown> | undefined;
        sub.reviewer = parseUser(reviewerRow);
      }

      const ipRow = db.prepare(`SELECT * FROM ip_records WHERE submission_id = ?`).get(sub.id) as Record<string, unknown> | undefined;
      if (ipRow) {
        sub.ipRecord = parseIPRecord(ipRow);
      }

      return sub;
    });

    return { success: true, data: submissions };
  }

  async createSubmission(taskId: number, data: SubmissionCreateRequest, providerId: number): Promise<ApiResponse<Submission>> {
    const taskRow = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId) as Record<string, unknown> | undefined;
    if (!taskRow) {
      return { success: false, message: '任务不存在' };
    }
    const task = parseTask(taskRow);

    if (task.providerId !== providerId) {
      return { success: false, message: '无权提交稿件' };
    }

    if (task.status !== 'in_progress' && task.status !== 'revising') {
      return { success: false, message: '当前状态无法提交稿件' };
    }

    const lastVersionRow = db.prepare(`
      SELECT MAX(version) as max_version FROM submissions WHERE task_id = ?
    `).get(taskId) as { max_version: number | null };
    const newVersion = (lastVersionRow.max_version || 0) + 1;

    const filesWithHash = data.files.map(file => ({
      ...file,
      hash: file.hash || crypto.createHash('sha256').update(file.name + Date.now()).digest('hex'),
    }));

    const result = db.prepare(`
      INSERT INTO submissions (task_id, provider_id, version, title, description, files, status)
      VALUES (?, ?, ?, ?, ?, ?, 'submitted')
    `).run(
      taskId,
      providerId,
      newVersion,
      data.title,
      data.description,
      JSON.stringify(filesWithHash)
    );

    filesWithHash.forEach(file => {
      db.prepare(`
        INSERT INTO ip_records (submission_id, task_id, provider_id, file_hash, file_name, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        result.lastInsertRowid,
        taskId,
        providerId,
        file.hash,
        file.name,
        Math.floor(Date.now() / 1000)
      );
    });

    db.prepare(`
      UPDATE tasks SET status = 'submitted', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(taskId);

    db.prepare(`
      INSERT INTO messages (task_id, sender_id, content, type)
      VALUES (?, ?, ?, 'submission')
    `).run(taskId, providerId, `提交了新版本稿件：${data.title}`);

    const row = db.prepare(`SELECT * FROM submissions WHERE id = ?`).get(result.lastInsertRowid) as Record<string, unknown>;
    const submission = parseSubmission(row);

    const ipRow = db.prepare(`SELECT * FROM ip_records WHERE submission_id = ?`).get(submission.id) as Record<string, unknown> | undefined;
    if (ipRow) {
      submission.ipRecord = parseIPRecord(ipRow);
    }

    return { success: true, message: '稿件提交成功，已进行知识产权存证', data: submission };
  }

  async reviewSubmission(submissionId: number, data: SubmissionReviewRequest, reviewerId: number, role: UserRole): Promise<ApiResponse<Submission>> {
    const row = db.prepare(`SELECT * FROM submissions WHERE id = ?`).get(submissionId) as Record<string, unknown> | undefined;
    if (!row) {
      return { success: false, message: '稿件不存在' };
    }
    const submission = parseSubmission(row);

    const taskRow = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(submission.taskId) as Record<string, unknown> | undefined;
    if (!taskRow) {
      return { success: false, message: '任务不存在' };
    }
    const task = parseTask(taskRow);

    if (role !== 'admin' && task.employerId !== reviewerId) {
      return { success: false, message: '无权评审此稿件' };
    }

    db.prepare(`
      UPDATE submissions
      SET status = ?, review_comment = ?, review_score = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(data.status, data.comment, data.score || null, reviewerId, submissionId);

    let taskStatus = task.status;
    if (data.status === 'approved') {
      taskStatus = 'completed';
    } else if (data.status === 'revision_requested') {
      taskStatus = 'revising';
    } else if (data.status === 'rejected') {
      taskStatus = 'revising';
    }

    db.prepare(`
      UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(taskStatus, submission.taskId);

    db.prepare(`
      INSERT INTO messages (task_id, sender_id, content, type)
      VALUES (?, ?, ?, 'system')
    `).run(
      submission.taskId,
      reviewerId,
      `稿件评审${data.status === 'approved' ? '通过' : data.status === 'rejected' ? '拒绝' : '需要修改'}：${data.comment}`
    );

    const updatedRow = db.prepare(`SELECT * FROM submissions WHERE id = ?`).get(submissionId) as Record<string, unknown>;
    const updated = parseSubmission(updatedRow);

    const providerRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(updated.providerId) as Record<string, unknown> | undefined;
    updated.provider = parseUser(providerRow);

    const reviewerRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(reviewerId) as Record<string, unknown> | undefined;
    updated.reviewer = parseUser(reviewerRow);

    return { success: true, message: '评审完成', data: updated };
  }

  async getIPRecords(taskId: number): Promise<ApiResponse<IPRecord[]>> {
    const rows = db.prepare(`
      SELECT * FROM ip_records WHERE task_id = ?
      ORDER BY created_at DESC
    `).all(taskId) as Record<string, unknown>[];

    const records = rows.map(parseIPRecord);
    return { success: true, data: records };
  }
}

export default new SubmissionService();
