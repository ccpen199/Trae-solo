import { Request, Response } from 'express';
import db from '@/db/index.js';
import { verifyPolice, verifySocial } from '@/mock/externalServices.js';
import type {
  MembershipApplyRequest,
  PoliceVerifyResponse,
  SocialVerifyResponse,
  MembershipStatus,
  MembershipStatusResponse,
  ApprovalHistory,
} from '@shared/types';

export const apply = (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const { personalInfo, workInfo, unionId } = req.body as MembershipApplyRequest;

    if (!personalInfo || !workInfo || !unionId) {
      res.status(400).json({ success: false, message: '请填写完整的申请信息' });
      return;
    }

    const existingApplication = db
      .prepare('SELECT * FROM membership_applications WHERE user_id = ? AND status != ?')
      .get(userId, 'rejected') as any;

    if (existingApplication) {
      res.status(409).json({ success: false, message: '您已有正在处理的入会申请' });
      return;
    }

    const result = db
      .prepare(
        'INSERT INTO membership_applications (user_id, union_id, status, current_step) VALUES (?, ?, ?, ?)'
      )
      .run(userId, unionId, 'police_verify', 1);

    res.status(201).json({
      success: true,
      data: { applicationId: result.lastInsertRowid },
      message: '入会申请已提交，请等待公安核验',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '提交申请失败，服务器错误' });
  }
};

export const verifyPolice = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const application = db
      .prepare('SELECT * FROM membership_applications WHERE user_id = ? AND status = ?')
      .get(userId, 'police_verify') as any;

    if (!application) {
      res.status(404).json({ success: false, message: '未找到待核验的申请' });
      return;
    }

    const user = db.prepare('SELECT id_card, name FROM users WHERE id = ?').get(userId) as any;

    const result = await verifyPolice(user.id_card, user.name);

    const data: PoliceVerifyResponse = {
      verified: result.verified,
      nameMatch: result.nameMatch,
    };

    if (result.verified && result.nameMatch) {
      db.prepare(
        'UPDATE membership_applications SET police_verified = ?, status = ?, current_step = ? WHERE id = ?'
      ).run(true, 'social_verify', 2, application.id);

      res.status(200).json({
        success: true,
        data,
        message: '公安核验通过，请进行社保核验',
      });
    } else {
      db.prepare(
        'UPDATE membership_applications SET police_verified = ?, status = ?, current_step = ? WHERE id = ?'
      ).run(false, 'rejected', 1, application.id);

      db.prepare('UPDATE users SET member_status = ? WHERE id = ?').run('rejected', userId);

      res.status(200).json({
        success: true,
        data,
        message: '公安核验未通过，申请已拒绝',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '公安核验失败，服务器错误' });
  }
};

export const verifySocial = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const application = db
      .prepare('SELECT * FROM membership_applications WHERE user_id = ? AND status = ?')
      .get(userId, 'social_verify') as any;

    if (!application) {
      res.status(404).json({ success: false, message: '未找到待核验的申请' });
      return;
    }

    const user = db.prepare('SELECT id_card FROM users WHERE id = ?').get(userId) as any;

    const result = await verifySocial(user.id_card);

    const data: SocialVerifyResponse = {
      verified: result.verified,
      contributionMonths: result.contributionMonths,
      lastContributionDate: result.lastContributionDate,
    };

    if (result.verified && result.contributionMonths >= 6) {
      db.prepare(
        'UPDATE membership_applications SET social_verified = ?, social_security_months = ?, status = ?, current_step = ? WHERE id = ?'
      ).run(true, result.contributionMonths, 'union_review', 3, application.id);

      res.status(200).json({
        success: true,
        data,
        message: '社保核验通过，请等待工会审核',
      });
    } else {
      db.prepare(
        'UPDATE membership_applications SET social_verified = ?, status = ?, current_step = ? WHERE id = ?'
      ).run(false, 'rejected', 2, application.id);

      db.prepare('UPDATE users SET member_status = ? WHERE id = ?').run('rejected', userId);

      res.status(200).json({
        success: true,
        data,
        message: '社保核验未通过，申请已拒绝',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '社保核验失败，服务器错误' });
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
      .prepare('SELECT * FROM membership_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(userId) as any;

    if (!application) {
      res.status(404).json({ success: false, message: '未找到入会申请记录' });
      return;
    }

    const statusMap: Record<string, number> = {
      draft: 0,
      police_verify: 1,
      social_verify: 2,
      union_review: 3,
      provincial_review: 4,
      approved: 5,
      rejected: -1,
    };

    const totalSteps = 5;
    const currentStep = statusMap[application.status] ?? 0;

    const approvalHistory: ApprovalHistory[] = [];

    if (application.police_verified) {
      approvalHistory.push({
        step: '公安核验',
        status: '通过',
        date: application.created_at,
        remark: '身份信息核验通过',
      });
    }

    if (application.social_verified) {
      approvalHistory.push({
        step: '社保核验',
        status: '通过',
        date: application.created_at,
        remark: `社保缴纳 ${application.social_security_months} 个月`,
      });
    }

    if (application.status === 'union_review' || application.status === 'provincial_review' || application.status === 'approved') {
      approvalHistory.push({
        step: '工会审核',
        status: application.status === 'approved' ? '通过' : '进行中',
        date: application.created_at,
      });
    }

    if (application.status === 'provincial_review' || application.status === 'approved') {
      approvalHistory.push({
        step: '省总工会审批',
        status: application.status === 'approved' ? '通过' : '进行中',
        date: application.created_at,
      });
    }

    if (application.status === 'approved') {
      approvalHistory.push({
        step: '入会完成',
        status: '已完成',
        date: application.created_at,
        remark: '恭喜您成为工会会员',
      });
    }

    if (application.status === 'rejected') {
      approvalHistory.push({
        step: '申请拒绝',
        status: '已拒绝',
        date: application.created_at,
        remark: '申请未通过审核',
      });
    }

    const data: MembershipStatusResponse = {
      status: application.status as MembershipStatus,
      currentStep: currentStep === -1 ? 0 : currentStep,
      totalSteps,
      approvalHistory,
    };

    res.status(200).json({ success: true, data, message: '获取申请状态成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取申请状态失败，服务器错误' });
  }
};
