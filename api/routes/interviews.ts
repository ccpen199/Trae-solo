import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/init.js';
import authMiddleware, { type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/my', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;

    let interviews: any[] = [];

    if (user.role === 'employer') {
      const employer = db.prepare('SELECT id FROM employers WHERE user_id = ?').get(userId) as any;
      interviews = db.prepare(`
        SELECT i.*, ja.job_id, ja.job_seeker_id, j.title, u.name as job_seeker_name
        FROM interviews i
        JOIN job_applications ja ON i.application_id = ja.id
        JOIN jobs j ON ja.job_id = j.id
        JOIN job_seekers js ON ja.job_seeker_id = js.id
        JOIN users u ON js.user_id = u.id
        WHERE j.employer_id = ?
        ORDER BY i.scheduled_at DESC
      `).all(employer.id);
    } else if (user.role === 'job_seeker') {
      const jobSeeker = db.prepare('SELECT id FROM job_seekers WHERE user_id = ?').get(userId) as any;
      interviews = db.prepare(`
        SELECT i.*, ja.job_id, j.title, e.company_name
        FROM interviews i
        JOIN job_applications ja ON i.application_id = ja.id
        JOIN jobs j ON ja.job_id = j.id
        JOIN employers e ON j.employer_id = e.id
        WHERE ja.job_seeker_id = ?
        ORDER BY i.scheduled_at DESC
      `).all(jobSeeker.id);
    }

    res.json({ success: true, data: interviews });
  } catch (error) {
    console.error('Get my interviews error:', error);
    res.status(500).json({ success: false, error: '获取面试列表失败' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { application_id, scheduled_at, interview_type } = req.body;

    if (!application_id || !scheduled_at || !interview_type) {
      res.status(400).json({ success: false, error: '申请ID、面试时间和面试类型为必填项' });
      return;
    }

    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    if (user.role !== 'employer') {
      res.status(403).json({ success: false, error: '只有雇主可以安排面试' });
      return;
    }

    const employer = db.prepare('SELECT id FROM employers WHERE user_id = ?').get(userId) as any;

    const application = db.prepare(`
      SELECT ja.id FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.id = ? AND j.employer_id = ?
    `).get(application_id, employer.id);

    if (!application) {
      res.status(404).json({ success: false, error: '申请不存在或无权限' });
      return;
    }

    const interviewId = uuidv4();
    db.prepare(`
      INSERT INTO interviews (id, application_id, scheduled_at, interview_type)
      VALUES (?, ?, ?, ?)
    `).run(interviewId, application_id, scheduled_at, interview_type);

    db.prepare(`
      UPDATE job_applications SET status = 'interview', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(application_id);

    res.status(201).json({ success: true, message: '面试安排成功', data: { id: interviewId } });
  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({ success: false, error: '安排面试失败' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { interviewer_notes, interviewer_rating, interviewee_notes, interviewee_rating, status, recording_url } = req.body;

    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;

    const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(id) as any;
    if (!interview) {
      res.status(404).json({ success: false, error: '面试不存在' });
      return;
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (user.role === 'employer') {
      if (interviewer_notes !== undefined) { updateFields.push('interviewer_notes = ?'); updateValues.push(interviewer_notes); }
      if (interviewer_rating !== undefined) { updateFields.push('interviewer_rating = ?'); updateValues.push(interviewer_rating); }
    } else if (user.role === 'job_seeker') {
      if (interviewee_notes !== undefined) { updateFields.push('interviewee_notes = ?'); updateValues.push(interviewee_notes); }
      if (interviewee_rating !== undefined) { updateFields.push('interviewee_rating = ?'); updateValues.push(interviewee_rating); }
    }

    if (status !== undefined) { updateFields.push('status = ?'); updateValues.push(status); }
    if (recording_url !== undefined) { updateFields.push('recording_url = ?'); updateValues.push(recording_url); }

    if (updateFields.length > 0) {
      updateValues.push(id);
      db.prepare(`UPDATE interviews SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...updateValues);
    }

    res.json({ success: true, message: '面试信息更新成功' });
  } catch (error) {
    console.error('Update interview error:', error);
    res.status(500).json({ success: false, error: '更新面试信息失败' });
  }
});

export default router;
