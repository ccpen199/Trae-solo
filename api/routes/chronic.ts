import { Router, type Response } from 'express';
import type { ApiResponse, ChronicDisease } from '@shared/types';
import { getDb } from '../models/db.js';
import { type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/list', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'user_001';
  const db = getDb();
  
  const diseases = db.prepare(`
    SELECT * FROM chronic_diseases 
    WHERE user_id = ?
    ORDER BY confirmed_date DESC
  `).all(userId) as any[];
  
  const formattedDiseases: ChronicDisease[] = diseases.map(d => ({
    id: d.id,
    diseaseType: d.disease_type,
    diseaseName: getDiseaseName(d.disease_type),
    confirmedDate: d.confirmed_date,
    expiryDate: d.expiry_date,
    status: d.status as ChronicDisease['status'],
    materials: JSON.parse(d.materials || '[]'),
    approvalNotes: d.status === 'approved' ? '符合慢特病认定标准，予以认定' : undefined
  }));
  
  const response: ApiResponse<ChronicDisease[]> = {
    code: 0,
    message: '获取成功',
    data: formattedDiseases
  };
  
  res.json(response);
});

router.post('/apply', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'user_001';
  const { diseaseType, materials } = req.body as { diseaseType: string; materials: string[] };
  
  if (!diseaseType || !materials || materials.length === 0) {
    const response: ApiResponse<null> = {
      code: 400,
      message: '缺少必要参数',
      data: null
    };
    res.status(400).json(response);
    return;
  }
  
  const db = getDb();
  
  const existing = db.prepare(`
    SELECT * FROM chronic_diseases 
    WHERE user_id = ? AND disease_type = ? AND status IN ('approved', 'pending')
  `).get(userId, diseaseType);
  
  if (existing) {
    const response: ApiResponse<null> = {
      code: 400,
      message: '该病种已存在有效认定或正在审核中',
      data: null
    };
    res.status(400).json(response);
    return;
  }
  
  const id = `chronic_${Date.now()}`;
  const now = new Date();
  const expiryDate = new Date(now);
  expiryDate.setFullYear(expiryDate.getFullYear() + 5);
  
  db.prepare(`
    INSERT INTO chronic_diseases (id, user_id, disease_type, confirmed_date, expiry_date, status, materials)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    diseaseType,
    now.toISOString().split('T')[0],
    expiryDate.toISOString().split('T')[0],
    'pending',
    JSON.stringify(materials)
  );
  
  const newDisease: ChronicDisease = {
    id,
    diseaseType,
    diseaseName: getDiseaseName(diseaseType),
    confirmedDate: now.toISOString().split('T')[0],
    expiryDate: expiryDate.toISOString().split('T')[0],
    status: 'pending',
    materials
  };
  
  const response: ApiResponse<ChronicDisease> = {
    code: 0,
    message: '申请提交成功，请等待审核',
    data: newDisease
  };
  
  res.json(response);
});

function getDiseaseName(type: string): string {
  const diseaseMap: Record<string, string> = {
    '高血压': '原发性高血压',
    '糖尿病': '2型糖尿病',
    '冠心病': '冠状动脉粥样硬化性心脏病',
    '慢性肾病': '慢性肾脏病',
    '恶性肿瘤': '恶性肿瘤放化疗',
    '帕金森': '帕金森病',
    '类风湿': '类风湿性关节炎',
    '系统性红斑狼疮': '系统性红斑狼疮',
    '肝硬化': '肝硬化失代偿期',
    '肺结核': '活动性肺结核'
  };
  return diseaseMap[type] || type;
}

export default router;
