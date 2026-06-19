import { Request, Response } from 'express';
import db from '@/db/index.js';
import {
  verifyMinimumAllowance,
  verifyDisability,
  verifySeriousIllness,
} from '@/mock/externalServices.js';
import type {
  AssistanceApplyRequest,
  AssistanceType,
  AutoReviewResponse,
  AutoReviewCheck,
  AssistanceStatusResponse,
  AuditTrail,
  AssistanceStatus,
} from '@shared/types';

export const apply = (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const { assistanceType, familyIncome, familyMemberCount, description, documentIds } =
      req.body as AssistanceApplyRequest;

    if (!assistanceType || !familyIncome || !familyMemberCount || !description) {
      res.status(400).json({ success: false, message: '请填写完整的申请信息' });
      return;
    }

    const validTypes: AssistanceType[] = [
      'minimum_allowance',
      'disability',
      'serious_illness',
      'disaster',
      'other',
    ];
    if (!validTypes.includes(assistanceType)) {
      res.status(400).json({ success: false, message: '无效的帮扶类型' });
      return;
    }

    const existingApplication = db
      .prepare("SELECT * FROM assistance_applications WHERE user_id = ? AND status NOT IN ('funded', 'rejected')")
      .get(userId) as any;

    if (existingApplication) {
      res.status(409).json({ success: false, message: '您已有正在处理的帮扶申请' });
      return;
    }

    const result = db
      .prepare(
        'INSERT INTO assistance_applications (user_id, assistance_type, family_income, family_member_count, description, status) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(userId, assistanceType, familyIncome, familyMemberCount, description, 'auto_review');

    res.status(201).json({
      success: true,
      data: { applicationId: result.lastInsertRowid },
      message: '帮扶申请已提交，正在进行智能初审',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '提交申请失败，服务器错误' });
  }
};

export const autoReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const application = db
      .prepare('SELECT * FROM assistance_applications WHERE user_id = ? AND status = ?')
      .get(userId, 'auto_review') as any;

    if (!application) {
      res.status(404).json({ success: false, message: '未找到待审核的申请' });
      return;
    }

    const user = db.prepare('SELECT id_card FROM users WHERE id = ?').get(userId) as any;

    const checks: AutoReviewCheck[] = [];
    let totalScore = 0;

    if (application.assistance_type === 'minimum_allowance' || application.assistance_type === 'other') {
      const result = await verifyMinimumAllowance(user.id_card);
      checks.push({
        type: 'minimum_allowance',
        matched: result.matched,
        details: result.details,
      });
      if (result.matched) totalScore += 30;
    }

    if (application.assistance_type === 'disability' || application.assistance_type === 'other') {
      const result = await verifyDisability(user.id_card);
      checks.push({
        type: 'disability',
        matched: result.matched,
        details: result.details,
      });
      if (result.matched) totalScore += 30;
    }

    if (application.assistance_type === 'serious_illness' || application.assistance_type === 'other') {
      const result = await verifySeriousIllness(user.id_card);
      checks.push({
        type: 'serious_illness',
        matched: result.matched,
        details: result.details,
      });
      if (result.matched) totalScore += 30;
    }

    if (application.family_income < 3000) totalScore += 15;
    else if (application.family_income < 5000) totalScore += 10;
    else if (application.family_income < 8000) totalScore += 5;

    if (application.family_member_count >= 5) totalScore += 10;
    else if (application.family_member_count >= 4) totalScore += 5;

    const passed = totalScore >= 40;
    const needManualReview = totalScore >= 40 && totalScore < 60;

    const newStatus: AssistanceStatus = passed
      ? needManualReview
        ? 'manual_review'
        : 'union_approved'
      : 'rejected';

    db.prepare(
      'UPDATE assistance_applications SET auto_review_passed = ?, auto_review_score = ?, status = ? WHERE id = ?'
    ).run(passed, totalScore, newStatus, application.id);

    if (newStatus === 'rejected') {
      db.prepare(
        'INSERT INTO audit_logs (fund_id, action, operator, operator_role, details) VALUES (?, ?, ?, ?, ?)'
      ).run(`APP${application.id}`, '智能初审拒绝', '系统', 'system', '智能初审未通过，综合评分不足');
    } else {
      db.prepare(
        'INSERT INTO audit_logs (fund_id, action, operator, operator_role, details) VALUES (?, ?, ?, ?, ?)'
      ).run(
        `APP${application.id}`,
        '智能初审通过',
        '系统',
        'system',
        `综合评分 ${totalScore} 分，${needManualReview ? '需人工复核' : '自动通过'}`
      );
    }

    const data: AutoReviewResponse = {
      passed,
      score: totalScore,
      checks,
      needManualReview,
    };

    const message = passed
      ? needManualReview
        ? '初审通过，需人工复核'
        : '初审通过，已进入工会审核'
      : '初审未通过';

    res.status(200).json({ success: true, data, message });
  } catch (error) {
    res.status(500).json({ success: false, message: '智能初审失败，服务器错误' });
  }
};

export const getStatus = (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const application = db
      .prepare('SELECT * FROM assistance_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(userId) as any;

    if (!application) {
      res.status(404).json({ success: false, message: '未找到帮扶申请记录' });
      return;
    }

    const auditLogs = db
      .prepare("SELECT * FROM audit_logs WHERE fund_id = ? ORDER BY created_at ASC")
      .all(`APP${application.id}`) as any[];

    const auditTrail: AuditTrail[] = auditLogs.map((log) => ({
      action: log.action,
      operator: log.operator,
      date: log.created_at,
      remark: log.details,
    }));

    if (auditTrail.length === 0) {
      auditTrail.push({
        action: '提交申请',
        operator: '用户',
        date: application.created_at,
        remark: '帮扶申请已提交',
      });
    }

    const typeMap: Record<string, string> = {
      minimum_allowance: '最低生活保障',
      disability: '残疾补助',
      serious_illness: '大病救助',
      disaster: '灾害救助',
      other: '其他困难',
    };

    const statusMap: Record<string, string> = {
      draft: '草稿',
      auto_review: '智能初审中',
      manual_review: '人工复核中',
      union_approved: '工会审核通过',
      provincial_approved: '省总工会审批通过',
      funded: '资金已拨付',
      rejected: '已拒绝',
    };

    const data: AssistanceStatusResponse = {
      status: application.status as AssistanceStatus,
      fundAmount: application.fund_amount,
      fundDate: application.fund_amount ? application.created_at : undefined,
      auditTrail,
    };

    res.status(200).json({ success: true, data, message: '获取申请状态成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取申请状态失败，服务器错误' });
  }
};
