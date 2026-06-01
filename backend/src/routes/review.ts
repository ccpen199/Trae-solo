import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/:taskId', authenticate, (req, res) => {
  const task = db.prepare(`
    SELECT t.*, u.name as handler_name
    FROM claim_tasks t
    LEFT JOIN users u ON t.current_handler_id = u.id
    WHERE t.id = ?
  `).get(req.params.taskId);

  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const photos = db.prepare(`
    SELECT p.*, u.name as uploader_name
    FROM photos p
    LEFT JOIN users u ON p.uploaded_by = u.id
    WHERE p.task_id = ?
    ORDER BY p.created_at DESC
  `).all(req.params.taskId);

  const lossItems = db.prepare(`
    SELECT l.*, u.name as creator_name
    FROM loss_items l
    LEFT JOIN users u ON l.created_by = u.id
    WHERE l.task_id = ?
    ORDER BY l.version DESC, l.created_at DESC
  `).all(req.params.taskId);

  const reviewLogs = db.prepare(`
    SELECT r.*, u.name as reviewer_name
    FROM review_logs r
    LEFT JOIN users u ON r.reviewer_id = u.id
    WHERE r.task_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.taskId);

  const assessmentVersions = db.prepare(`
    SELECT av.*, u.name as creator_name
    FROM assessment_versions av
    LEFT JOIN users u ON av.created_by = u.id
    WHERE av.task_id = ?
    ORDER BY av.version DESC
  `).all(req.params.taskId);

  const historicalClaims = db.prepare(`
    SELECT COUNT(*) as claim_count,
           SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
           AVG(CASE WHEN av.total_amount IS NOT NULL THEN av.total_amount ELSE 0 END) as avg_amount
    FROM claim_tasks t
    LEFT JOIN assessment_versions av ON t.id = av.task_id
    WHERE t.owner_phone = (SELECT owner_phone FROM claim_tasks WHERE id = ?)
      AND t.id != ?
  `).get(req.params.taskId, req.params.taskId);

  res.json({
    task,
    photos,
    loss_items: lossItems,
    review_logs: reviewLogs,
    assessment_versions: assessmentVersions,
    historical_risk: historicalClaims,
  });
});

router.post('/:taskId', authenticate, (req, res) => {
  const { version, review_result, review_comments, historical_risk } = req.body;
  const taskId = req.params.taskId;

  const id = uuidv4();
  db.prepare(`
    INSERT INTO review_logs (
      id, task_id, version, reviewer_id, review_result, review_comments, historical_risk
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    taskId,
    version || 1,
    req.user!.id,
    review_result,
    review_comments || null,
    historical_risk || null
  );

  let newStatus = 'reviewing';
  if (review_result === 'approved') {
    newStatus = 'completed';
  } else if (review_result === 'rejected') {
    newStatus = 'rejected';
  }

  db.prepare(`
    UPDATE claim_tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(newStatus, taskId);

  const log = db.prepare(`
    SELECT r.*, u.name as reviewer_name
    FROM review_logs r
    LEFT JOIN users u ON r.reviewer_id = u.id
    WHERE r.id = ?
  `).get(id);

  res.status(201).json(log);
});

router.get('/:taskId/logs', authenticate, (req, res) => {
  const logs = db.prepare(`
    SELECT r.*, u.name as reviewer_name
    FROM review_logs r
    LEFT JOIN users u ON r.reviewer_id = u.id
    WHERE r.task_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.taskId);

  res.json(logs);
});

router.get('/statistics/queue', authenticate, (req, res) => {
  const queue = db.prepare(`
    SELECT
      COUNT(*) as pending_review,
      SUM(CASE WHEN t.status = 'reviewing' THEN 1 ELSE 0 END) as reviewing,
      SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN t.status = 'rejected' THEN 1 ELSE 0 END) as rejected
    FROM claim_tasks t
    WHERE t.status IN ('assessing', 'reviewing', 'completed', 'rejected')
  `).get();

  res.json(queue);
});

export default router;
