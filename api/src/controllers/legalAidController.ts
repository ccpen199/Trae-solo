import { Request, Response } from 'express';
import db from '@/db/index.js';
import type {
  LegalAidApplyRequest,
  LawyerMatchResponse,
  Lawyer,
  CaseListResponse,
  LegalCase,
  CaseType,
} from '@shared/types';

export const apply = (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const { caseType, caseTitle, caseDescription, evidenceIds } = req.body as LegalAidApplyRequest;

    if (!caseType || !caseTitle || !caseDescription) {
      res.status(400).json({ success: false, message: '请填写完整的案件信息' });
      return;
    }

    const validCaseTypes: CaseType[] = ['labor', 'civil', 'criminal', 'other'];
    if (!validCaseTypes.includes(caseType)) {
      res.status(400).json({ success: false, message: '无效的案件类型' });
      return;
    }

    const result = db
      .prepare(
        'INSERT INTO legal_aid_cases (user_id, case_type, case_title, case_description, status) VALUES (?, ?, ?, ?, ?)'
      )
      .run(userId, caseType, caseTitle, caseDescription, 'pending');

    res.status(201).json({
      success: true,
      data: { caseId: result.lastInsertRowid },
      message: '援助申请已提交，正在为您匹配律师',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '提交申请失败，服务器错误' });
  }
};

export const matchLawyers = (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { caseId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const caseItem = db.prepare('SELECT * FROM legal_aid_cases WHERE id = ? AND user_id = ?').get(caseId, userId) as any;

    if (!caseItem) {
      res.status(404).json({ success: false, message: '未找到该案件' });
      return;
    }

    const lawyersRaw = db
      .prepare(
        `SELECT l.id, u.name, l.specialty, l.experience_years, l.case_count, l.rating
         FROM lawyers l
         JOIN users u ON l.user_id = u.id
         WHERE l.verified = 1
         ORDER BY l.rating DESC, l.case_count DESC
         LIMIT 5`
      )
      .all() as any[];

    const caseTypeMap: Record<string, string> = {
      labor: '劳动争议',
      civil: '民事纠纷',
      criminal: '刑事辩护',
      other: '综合',
    };

    const targetSpecialty = caseTypeMap[caseItem.case_type] || '';

    const lawyers: Lawyer[] = lawyersRaw.map((l) => {
      const specialties = l.specialty.split(',');
      const matchScore = specialties.some((s: string) => s.includes(targetSpecialty)) ? 1.5 : 1;
      return {
        id: l.id,
        name: l.name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${l.id}`,
        specialty: specialties,
        experienceYears: l.experience_years,
        caseCount: l.case_count,
        rating: Math.min(5, l.rating * matchScore),
      };
    });

    lawyers.sort((a, b) => b.rating - a.rating);

    const data: LawyerMatchResponse = { lawyers };

    res.status(200).json({ success: true, data, message: '律师匹配成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '匹配律师失败，服务器错误' });
  }
};

export const getCases = (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const casesRaw = db
      .prepare(
        `SELECT c.id, c.case_title, c.case_type, c.status, c.created_at, u.name as lawyer_name
         FROM legal_aid_cases c
         LEFT JOIN lawyers l ON c.lawyer_id = l.id
         LEFT JOIN users u ON l.user_id = u.id
         WHERE c.user_id = ?
         ORDER BY c.created_at DESC`
      )
      .all(userId) as any[];

    const typeMap: Record<string, string> = {
      labor: '劳动争议',
      civil: '民事纠纷',
      criminal: '刑事辩护',
      other: '其他',
    };

    const cases: LegalCase[] = casesRaw.map((c) => ({
      id: c.id,
      title: c.case_title,
      type: typeMap[c.case_type] || c.case_type,
      status: c.status,
      lawyerName: c.lawyer_name,
      createDate: c.created_at,
    }));

    const data: CaseListResponse = { cases };

    res.status(200).json({ success: true, data, message: '获取案件列表成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取案件列表失败，服务器错误' });
  }
};

export const getCaseDetail = (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { caseId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const caseItem = db
      .prepare(
        `SELECT c.*, u.name as lawyer_name, l.specialty, l.experience_years
         FROM legal_aid_cases c
         LEFT JOIN lawyers l ON c.lawyer_id = l.id
         LEFT JOIN users u ON l.user_id = u.id
         WHERE c.id = ? AND c.user_id = ?`
      )
      .get(caseId, userId) as any;

    if (!caseItem) {
      res.status(404).json({ success: false, message: '未找到该案件' });
      return;
    }

    const typeMap: Record<string, string> = {
      labor: '劳动争议',
      civil: '民事纠纷',
      criminal: '刑事辩护',
      other: '其他',
    };

    const statusMap: Record<string, string> = {
      pending: '待匹配',
      matched: '已匹配',
      processing: '处理中',
      closed: '已结案',
    };

    const data = {
      id: caseItem.id,
      title: caseItem.case_title,
      type: typeMap[caseItem.case_type] || caseItem.case_type,
      description: caseItem.case_description,
      status: caseItem.status,
      statusText: statusMap[caseItem.status] || caseItem.status,
      lawyerName: caseItem.lawyer_name,
      lawyerSpecialty: caseItem.specialty?.split(',') || [],
      lawyerExperienceYears: caseItem.experience_years,
      createDate: caseItem.created_at,
    };

    res.status(200).json({ success: true, data, message: '获取案件详情成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取案件详情失败，服务器错误' });
  }
};
