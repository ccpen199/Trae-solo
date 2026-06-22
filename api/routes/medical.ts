import { Router, type Response } from 'express';
import type { ApiResponse, MedicalRecord, PaginationParams, PaginationResponse } from '@shared/types';
import { getDb } from '../models/db.js';
import { type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/records', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'user_001';
  const db = getDb();
  
  const { page = 1, pageSize = 10 } = req.query as PaginationParams;
  
  const countResult = db.prepare(`
    SELECT COUNT(*) as count 
    FROM medical_records 
    WHERE user_id = ?
  `).get(userId) as { count: number };
  const total = countResult.count;
  
  const records = db.prepare(`
    SELECT mr.*, h.name as hospital_name 
    FROM medical_records mr
    LEFT JOIN hospitals h ON mr.hospital_id = h.id
    WHERE mr.user_id = ?
    ORDER BY mr.visit_date DESC
    LIMIT ? OFFSET ?
  `).all(userId, Number(pageSize), (Number(page) - 1) * Number(pageSize)) as any[];
  
  const formattedRecords: MedicalRecord[] = records.map(r => ({
    id: r.id,
    visitDate: r.visit_date,
    hospital: r.hospital_name,
    hospitalId: r.hospital_id,
    department: r.department,
    doctor: r.doctor,
    diagnosis: JSON.parse(r.diagnosis || '[]'),
    symptoms: r.symptoms || '',
    prescriptions: JSON.parse(r.prescriptions || '[]'),
    examinations: JSON.parse(r.examinations || '[]'),
    cost: JSON.parse(r.cost || '{}')
  }));
  
  const response: ApiResponse<PaginationResponse<MedicalRecord>> = {
    code: 0,
    message: '获取成功',
    data: {
      list: formattedRecords,
      total,
      page: Number(page),
      pageSize: Number(pageSize)
    }
  };
  
  res.json(response);
});

router.get('/records/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'user_001';
  const { id } = req.params;
  const db = getDb();
  
  const record = db.prepare(`
    SELECT mr.*, h.name as hospital_name 
    FROM medical_records mr
    LEFT JOIN hospitals h ON mr.hospital_id = h.id
    WHERE mr.id = ? AND mr.user_id = ?
  `).get(id, userId) as any;
  
  if (!record) {
    const response: ApiResponse<null> = {
      code: 404,
      message: '就诊记录不存在',
      data: null
    };
    res.status(404).json(response);
    return;
  }
  
  const formattedRecord: MedicalRecord = {
    id: record.id,
    visitDate: record.visit_date,
    hospital: record.hospital_name,
    hospitalId: record.hospital_id,
    department: record.department,
    doctor: record.doctor,
    diagnosis: JSON.parse(record.diagnosis || '[]'),
    symptoms: record.symptoms || '',
    prescriptions: JSON.parse(record.prescriptions || '[]'),
    examinations: JSON.parse(record.examinations || '[]'),
    cost: JSON.parse(record.cost || '{}')
  };
  
  const response: ApiResponse<MedicalRecord> = {
    code: 0,
    message: '获取成功',
    data: formattedRecord
  };
  
  res.json(response);
});

export default router;
