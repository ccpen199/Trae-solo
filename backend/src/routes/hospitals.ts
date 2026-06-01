import { Router, Response } from 'express';
import db from '../db';
import { logOperation, LogRequest } from '../middleware/logger';
import { ApiResponse, Hospital, Doctor, Patient } from '../types';

const router = Router();

router.get('/hospitals', (req: LogRequest, res: Response) => {
  try {
    const hospitals = db.prepare(`
      SELECT * FROM hospitals ORDER BY created_at DESC
    `).all() as Hospital[];
    
    const response: ApiResponse = {
      success: true,
      data: hospitals,
      message: '获取医院列表成功'
    };
    
    res.json(response);
  } catch (err: any) {
    const response: ApiResponse = {
      success: false,
      message: `获取医院列表失败: ${err.message}`
    };
    res.status(500).json(response);
  }
});

router.get('/hospitals/:id/doctors', (req: LogRequest, res: Response) => {
  try {
    const { id } = req.params;
    const hospitalId = parseInt(id, 10);
    
    const hospital = db.prepare(`
      SELECT * FROM hospitals WHERE id = ?
    `).get(hospitalId) as Hospital | undefined;
    
    if (!hospital) {
      const response: ApiResponse = {
        success: false,
        message: '医院不存在'
      };
      return res.status(404).json(response);
    }
    
    const doctors = db.prepare(`
      SELECT * FROM doctors WHERE hospital_id = ? ORDER BY department, name
    `).all(hospitalId) as Doctor[];
    
    const response: ApiResponse = {
      success: true,
      data: doctors,
      message: '获取医生列表成功'
    };
    
    res.json(response);
  } catch (err: any) {
    const response: ApiResponse = {
      success: false,
      message: `获取医生列表失败: ${err.message}`
    };
    res.status(500).json(response);
  }
});

router.get('/doctors', (req: LogRequest, res: Response) => {
  try {
    const { hospital_id, department } = req.query;
    
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (hospital_id) {
      conditions.push('hospital_id = ?');
      params.push(parseInt(hospital_id as string, 10));
    }
    if (department) {
      conditions.push('department = ?');
      params.push(department);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const doctors = db.prepare(`
      SELECT * FROM doctors ${whereClause} ORDER BY hospital_name, department, name
    `).all(...params) as Doctor[];
    
    const response: ApiResponse = {
      success: true,
      data: doctors,
      message: '获取医生列表成功'
    };
    
    res.json(response);
  } catch (err: any) {
    const response: ApiResponse = {
      success: false,
      message: `获取医生列表失败: ${err.message}`
    };
    res.status(500).json(response);
  }
});

router.get('/patients', (req: LogRequest, res: Response) => {
  try {
    const { keyword, page = '1', pageSize = '20' } = req.query;
    
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (keyword) {
      conditions.push('(name LIKE ? OR id_card LIKE ? OR phone LIKE ?)');
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM patients ${whereClause}
    `).get(...params) as { total: number };
    
    const offset = (parseInt(page as string, 10) - 1) * parseInt(pageSize as string, 10);
    const limit = parseInt(pageSize as string, 10);
    
    const patients = db.prepare(`
      SELECT * FROM patients ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as Patient[];
    
    const response: ApiResponse = {
      success: true,
      data: {
        list: patients,
        total: countResult.total,
        page: parseInt(page as string, 10),
        pageSize: parseInt(pageSize as string, 10)
      },
      message: '获取患者列表成功'
    };
    
    res.json(response);
  } catch (err: any) {
    const response: ApiResponse = {
      success: false,
      message: `获取患者列表失败: ${err.message}`
    };
    res.status(500).json(response);
  }
});

router.post('/patients', (req: LogRequest, res: Response) => {
  try {
    const {
      name,
      gender,
      age,
      id_card,
      phone,
      address = '',
      medical_history = '',
      allergies = ''
    } = req.body;
    
    if (!name || !gender || !age || !id_card || !phone) {
      const response: ApiResponse = {
        success: false,
        message: '必填参数不能为空'
      };
      return res.status(400).json(response);
    }
    
    if (!['male', 'female'].includes(gender)) {
      const response: ApiResponse = {
        success: false,
        message: '性别参数无效'
      };
      return res.status(400).json(response);
    }
    
    if (typeof age !== 'number' || age < 0 || age > 150) {
      const response: ApiResponse = {
        success: false,
        message: '年龄参数无效'
      };
      return res.status(400).json(response);
    }
    
    if (!/^\d{17}[\dXx]$/.test(id_card)) {
      const response: ApiResponse = {
        success: false,
        message: '身份证号格式无效'
      };
      return res.status(400).json(response);
    }
    
    const existing = db.prepare(`
      SELECT id FROM patients WHERE id_card = ?
    `).get(id_card);
    
    if (existing) {
      const response: ApiResponse = {
        success: false,
        message: '该身份证号已存在'
      };
      return res.status(400).json(response);
    }
    
    const result = db.prepare(`
      INSERT INTO patients (
        name, gender, age, id_card, phone, address, medical_history, allergies
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, gender, age, id_card, phone, address, medical_history, allergies);
    
    const userId = req.userId || 1;
    const userName = req.userName || 'system';
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    logOperation(userId, userName, '新增患者', ip, `患者姓名: ${name}, 身份证: ${id_card}`);
    
    const patient = db.prepare(`
      SELECT * FROM patients WHERE id = ?
    `).get(result.lastInsertRowid) as Patient;
    
    const response: ApiResponse = {
      success: true,
      data: patient,
      message: '新增患者成功'
    };
    
    res.status(201).json(response);
  } catch (err: any) {
    const response: ApiResponse = {
      success: false,
      message: `新增患者失败: ${err.message}`
    };
    res.status(500).json(response);
  }
});

export default router;
