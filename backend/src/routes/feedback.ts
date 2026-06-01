import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db, Status, Feedback, Attachment, StatusLog, Comment } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

export const upload = multer({ storage });

const router = Router();

interface CreateFeedbackBody {
  title: string;
  description: string;
  page_url?: string;
  browser_info?: string;
  os_info?: string;
  screen_resolution?: string;
  user_agent?: string;
  problem_type: string;
  severity: string;
  contact?: string;
  reproduce_steps?: string;
  console_errors?: string;
  network_errors?: string;
  module?: string;
  version?: string;
  source_channel?: string;
}

router.post('/', upload.array('attachments', 10), (req: Request, res: Response) => {
  try {
    const body = req.body as CreateFeedbackBody;
    const now = Date.now();
    const id = uuidv4();

    const consoleErrors = body.console_errors
      ? JSON.stringify(Array.isArray(body.console_errors) ? body.console_errors : [body.console_errors])
      : null;
    const networkErrors = body.network_errors
      ? JSON.stringify(Array.isArray(body.network_errors) ? body.network_errors : [body.network_errors])
      : null;

    const insertFeedback = db.prepare(`
      INSERT INTO feedbacks (
        id, title, description, page_url, browser_info, os_info, screen_resolution,
        user_agent, problem_type, severity, contact, reproduce_steps, console_errors,
        network_errors, status, module, version, affected_users_count, source_channel,
        merge_parent_id, defect_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertFeedback.run(
      id,
      body.title,
      body.description,
      body.page_url || '',
      body.browser_info || '',
      body.os_info || '',
      body.screen_resolution || '',
      body.user_agent || '',
      body.problem_type,
      body.severity,
      body.contact || '',
      body.reproduce_steps || '',
      consoleErrors,
      networkErrors,
      'pending' as Status,
      body.module || '',
      body.version || '',
      1,
      body.source_channel || 'web',
      null,
      null,
      now,
      now
    );

    const insertAttachment = db.prepare(`
      INSERT INTO attachments (
        id, feedback_id, filename, original_name, file_path, file_size, content_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const insertMany = db.transaction((attachments: any[]) => {
        for (const att of attachments) {
          insertAttachment.run(
            att.id,
            att.feedback_id,
            att.filename,
            att.original_name,
            att.file_path,
            att.file_size,
            att.content_type,
            att.created_at
          );
        }
      });

      const attachments = files.map((file) => ({
        id: uuidv4(),
        feedback_id: id,
        filename: file.filename,
        original_name: file.originalname,
        file_path: file.path,
        file_size: file.size,
        content_type: file.mimetype,
        created_at: now
      }));

      insertMany(attachments);
    }

    const insertStatusLog = db.prepare(`
      INSERT INTO status_logs (id, feedback_id, old_status, new_status, operator, remark, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertStatusLog.run(uuidv4(), id, null, 'pending', 'system', '反馈已创建', now);

    const feedback = db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(id) as Feedback;

    res.status(201).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('创建反馈失败:', error);
    res.status(500).json({
      success: false,
      error: '创建反馈失败'
    });
  }
});

router.get('/', (req: Request, res: Response) => {
  try {
    const {
      module,
      status,
      version,
      source_channel,
      min_affected,
      max_affected,
      sort_by = 'created_at',
      sort_order = 'desc',
      page = '1',
      page_size = '20'
    } = req.query;

    const validSortFields = ['affected_users_count', 'created_at', 'updated_at', 'severity'];
    const sortField = validSortFields.includes(sort_by as string) ? sort_by : 'created_at';
    const sortOrder = sort_order === 'asc' ? 'ASC' : 'DESC';

    const conditions: string[] = [];
    const params: any[] = [];

    if (module) {
      conditions.push('module = ?');
      params.push(module);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (version) {
      conditions.push('version = ?');
      params.push(version);
    }
    if (source_channel) {
      conditions.push('source_channel = ?');
      params.push(source_channel);
    }
    if (min_affected) {
      conditions.push('affected_users_count >= ?');
      params.push(parseInt(min_affected as string, 10));
    }
    if (max_affected) {
      conditions.push('affected_users_count <= ?');
      params.push(parseInt(max_affected as string, 10));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM feedbacks ${whereClause}`;
    const countResult = db.prepare(countQuery).get(...params) as { total: number };
    const total = countResult.total;

    const pageNum = parseInt(page as string, 10);
    const pageSize = parseInt(page_size as string, 10);
    const offset = (pageNum - 1) * pageSize;

    const listQuery = `
      SELECT * FROM feedbacks ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    const listParams = [...params, pageSize, offset];
    const feedbacks = db.prepare(listQuery).all(...listParams) as Feedback[];

    const parsedFeedbacks = feedbacks.map((f) => {
      let consoleErrors = null;
      let networkErrors = null;
      try {
        if (f.console_errors) {
          consoleErrors = typeof f.console_errors === 'string'
            ? JSON.parse(f.console_errors)
            : f.console_errors;
        }
      } catch (e) {}
      try {
        if (f.network_errors) {
          networkErrors = typeof f.network_errors === 'string'
            ? JSON.parse(f.network_errors)
            : f.network_errors;
        }
      } catch (e) {}
      return { ...f, console_errors: consoleErrors, network_errors: networkErrors };
    });

    res.json({
      success: true,
      data: {
        list: parsedFeedbacks,
        pagination: {
          page: pageNum,
          page_size: pageSize,
          total,
          total_pages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取反馈列表失败'
    });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const feedback = db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(id) as Feedback;
    if (!feedback) {
      res.status(404).json({
        success: false,
        error: '反馈不存在'
      });
      return;
    }

    const attachments = db.prepare('SELECT * FROM attachments WHERE feedback_id = ?').all(id) as Attachment[];
    const statusLogs = db.prepare('SELECT * FROM status_logs WHERE feedback_id = ? ORDER BY created_at ASC').all(id) as StatusLog[];
    const comments = db.prepare('SELECT * FROM comments WHERE feedback_id = ? ORDER BY created_at ASC').all(id) as Comment[];

    let parsedConsoleErrors = null;
    let parsedNetworkErrors = null;
    try {
      if (feedback.console_errors) {
        parsedConsoleErrors = typeof feedback.console_errors === 'string'
          ? JSON.parse(feedback.console_errors)
          : feedback.console_errors;
      }
    } catch (e) {
      console.warn('解析 console_errors 失败:', e);
    }
    try {
      if (feedback.network_errors) {
        parsedNetworkErrors = typeof feedback.network_errors === 'string'
          ? JSON.parse(feedback.network_errors)
          : feedback.network_errors;
      }
    } catch (e) {
      console.warn('解析 network_errors 失败:', e);
    }

    res.json({
      success: true,
      data: {
        ...feedback,
        console_errors: parsedConsoleErrors,
        network_errors: parsedNetworkErrors,
        attachments,
        status_logs: statusLogs,
        comments
      }
    });
  } catch (error) {
    console.error('获取反馈详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取反馈详情失败'
    });
  }
});

router.put('/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, operator, remark, assignee, verifier, close_reason } = req.body as { 
      status: Status; 
      operator?: string; 
      remark?: string;
      assignee?: string;
      verifier?: string;
      close_reason?: string;
    };

    const validStatuses: Status[] = ['pending', 'accepted', 'supplementing', 'processing', 'fixed', 'verifying', 'closed'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: '无效的状态值'
      });
      return;
    }

    const feedback = db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(id) as Feedback;
    if (!feedback) {
      res.status(404).json({
        success: false,
        error: '反馈不存在'
      });
      return;
    }

    const now = Date.now();
    
    // 构建更新字段
    const updateFields: string[] = ['status = ?', 'updated_at = ?'];
    const updateParams: any[] = [status, now];
    
    if (assignee !== undefined) {
      updateFields.push('assignee = ?');
      updateParams.push(assignee);
    }
    if (verifier !== undefined) {
      updateFields.push('verifier = ?');
      updateParams.push(verifier);
    }
    if (close_reason !== undefined) {
      updateFields.push('close_reason = ?');
      updateParams.push(close_reason);
    }
    
    const updateFeedback = db.prepare(`UPDATE feedbacks SET ${updateFields.join(', ')} WHERE id = ?`);
    updateParams.push(id);
    updateFeedback.run(...updateParams);

    const insertStatusLog = db.prepare(`
      INSERT INTO status_logs (id, feedback_id, old_status, new_status, operator, remark, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertStatusLog.run(uuidv4(), id, feedback.status, status, operator || 'system', remark || '', now);

    const updatedFeedback = db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(id) as Feedback;

    res.json({
      success: true,
      data: updatedFeedback
    });
  } catch (error) {
    console.error('更新状态失败:', error);
    res.status(500).json({
      success: false,
      error: '更新状态失败'
    });
  }
});

router.post('/:id/comments', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { author, content } = req.body as { author?: string; content: string };

    if (!content || !content.trim()) {
      res.status(400).json({
        success: false,
        error: '评论内容不能为空'
      });
      return;
    }

    const feedback = db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(id) as Feedback;
    if (!feedback) {
      res.status(404).json({
        success: false,
        error: '反馈不存在'
      });
      return;
    }

    const now = Date.now();
    const commentId = uuidv4();

    const insertComment = db.prepare(`
      INSERT INTO comments (id, feedback_id, author, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertComment.run(commentId, id, author || '匿名', content.trim(), now);

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId) as Comment;

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({
      success: false,
      error: '添加评论失败'
    });
  }
});

router.post('/merge', (req: Request, res: Response) => {
  try {
    const { parent_id, child_ids } = req.body as { parent_id: string; child_ids: string[] };

    if (!parent_id || !child_ids || child_ids.length === 0) {
      res.status(400).json({
        success: false,
        error: '缺少必要参数'
      });
      return;
    }

    const parentFeedback = db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(parent_id) as Feedback;
    if (!parentFeedback) {
      res.status(404).json({
        success: false,
        error: '主反馈不存在'
      });
      return;
    }

    const now = Date.now();
    const updateChild = db.prepare('UPDATE feedbacks SET merge_parent_id = ?, updated_at = ? WHERE id = ?');
    const updateParentCount = db.prepare('UPDATE feedbacks SET affected_users_count = affected_users_count + 1, updated_at = ? WHERE id = ?');

    const mergeTransaction = db.transaction(() => {
      for (const childId of child_ids) {
        const child = db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(childId) as Feedback;
        if (child && !child.merge_parent_id) {
          updateChild.run(parent_id, now, childId);
          updateParentCount.run(now, parent_id);
        }
      }
    });

    mergeTransaction();

    const updatedParent = db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(parent_id) as Feedback;

    res.json({
      success: true,
      data: {
        parent: updatedParent,
        merged_count: child_ids.length
      }
    });
  } catch (error) {
    console.error('合并反馈失败:', error);
    res.status(500).json({
      success: false,
      error: '合并反馈失败'
    });
  }
});

router.post('/:id/link-defect', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { defect_id } = req.body as { defect_id: string };

    if (!defect_id || !defect_id.trim()) {
      res.status(400).json({
        success: false,
        error: '缺陷ID不能为空'
      });
      return;
    }

    const feedback = db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(id) as Feedback;
    if (!feedback) {
      res.status(404).json({
        success: false,
        error: '反馈不存在'
      });
      return;
    }

    const now = Date.now();
    const updateFeedback = db.prepare('UPDATE feedbacks SET defect_id = ?, updated_at = ? WHERE id = ?');
    updateFeedback.run(defect_id.trim(), now, id);

    const updatedFeedback = db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(id) as Feedback;

    res.json({
      success: true,
      data: updatedFeedback
    });
  } catch (error) {
    console.error('关联缺陷失败:', error);
    res.status(500).json({
      success: false,
      error: '关联缺陷失败'
    });
  }
});

export default router;
