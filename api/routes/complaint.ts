import { Router } from 'express';
import type { DbInstance } from '../db-type';

const router = Router();

const branchMap: Record<string, string> = {
  damage: '理赔中心',
  lost: '丢失调查组',
  delay: '时效保障组',
  service: '服务质量部',
  other: '综合处理组',
};

function mapComplaintRow(row: any) {
  const slaDeadline = row.sla_deadline;
  let slaRemaining = 0;
  if (slaDeadline) {
    slaRemaining = Math.max(0, new Date(slaDeadline).getTime() - Date.now());
  }
  return {
    id: row.id,
    waybillId: row.waybill_id,
    waybillNo: row.waybill_no || '',
    type: row.type,
    description: row.description,
    evidence: [],
    status: row.status,
    assignedBranch: row.assigned_branch || '',
    slaDeadline: slaDeadline || '',
    slaRemaining,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get('/', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const { status } = req.query;
    let query = `SELECT c.*, w.waybill_no FROM complaint_tickets c LEFT JOIN waybills w ON c.waybill_id = w.id`;
    const params: unknown[] = [];
    if (status) {
      query += ' WHERE c.status = ?';
      params.push(status as string);
    }
    query += ' ORDER BY c.created_at DESC';
    const rows = db.prepare(query).all(...params) as any[];
    res.json(rows.map(mapComplaintRow));
  } catch (error) {
    console.error('Failed to fetch complaints:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const row = db.prepare(`SELECT c.*, w.waybill_no FROM complaint_tickets c LEFT JOIN waybills w ON c.waybill_id = w.id WHERE c.id = ?`).get(req.params.id) as any;
    if (!row) {
      res.status(404).json({ error: 'Complaint ticket not found' });
      return;
    }
    res.json(mapComplaintRow(row));
  } catch (error) {
    console.error('Failed to fetch complaint:', error);
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
});

router.post('/', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const { waybillId, type, description } = req.body;
    if (!waybillId || !type || !description) {
      res.status(400).json({ error: 'waybillId, type, and description are required' });
      return;
    }

    const id = `c${Date.now()}`;
    const assignedBranch = branchMap[type] || '综合处理组';
    const slaDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);

    db.prepare(
      `INSERT INTO complaint_tickets (id, waybill_id, type, description, status, assigned_branch, sla_deadline)
       VALUES (?, ?, ?, ?, 'assigned', ?, ?)`
    ).run(id, waybillId, type, description, assignedBranch, slaDeadline);

    const row = db.prepare(`SELECT c.*, w.waybill_no FROM complaint_tickets c LEFT JOIN waybills w ON c.waybill_id = w.id WHERE c.id = ?`).get(id) as any;
    res.status(201).json(mapComplaintRow(row));
  } catch (error) {
    console.error('Failed to create complaint:', error);
    res.status(500).json({ error: 'Failed to create complaint' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const existing = db.prepare('SELECT * FROM complaint_tickets WHERE id = ?').get(req.params.id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Complaint ticket not found' });
      return;
    }

    const { status, description } = req.body;
    db.prepare(
      `UPDATE complaint_tickets SET
        status = COALESCE(?, status),
        description = COALESCE(?, description),
        updated_at = datetime('now')
       WHERE id = ?`
    ).run(status ?? null, description ?? null, req.params.id);

    const row = db.prepare(`SELECT c.*, w.waybill_no FROM complaint_tickets c LEFT JOIN waybills w ON c.waybill_id = w.id WHERE c.id = ?`).get(req.params.id) as any;
    res.json(mapComplaintRow(row));
  } catch (error) {
    console.error('Failed to update complaint:', error);
    res.status(500).json({ error: 'Failed to update complaint' });
  }
});

router.post('/:id/assign', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const existing = db.prepare('SELECT * FROM complaint_tickets WHERE id = ?').get(req.params.id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Complaint ticket not found' });
      return;
    }

    const { branch } = req.body;
    if (!branch) {
      res.status(400).json({ error: 'branch is required' });
      return;
    }

    const slaDeadline = existing.sla_deadline || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
    db.prepare(
      `UPDATE complaint_tickets SET assigned_branch = ?, sla_deadline = ?, status = 'assigned', updated_at = datetime('now') WHERE id = ?`
    ).run(branch, slaDeadline, req.params.id);

    const row = db.prepare(`SELECT c.*, w.waybill_no FROM complaint_tickets c LEFT JOIN waybills w ON c.waybill_id = w.id WHERE c.id = ?`).get(req.params.id) as any;
    res.json(mapComplaintRow(row));
  } catch (error) {
    console.error('Failed to assign complaint:', error);
    res.status(500).json({ error: 'Failed to assign complaint' });
  }
});

export default router;
