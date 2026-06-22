import { Response } from 'express';
import mongoose from 'mongoose';
import { Report, FilterLog } from '../models/Moderation';
import Diary from '../models/Diary';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { NON_STANDARD_QUOTE_PHRASES, INAPPROPRIATE_WORDS, SUSPICIOUS_PATTERNS } from '../config/constants';
import { isDbConnected } from '../config/database';
import { MOCK_DIARIES, MOCK_TRANSACTIONS, MOCK_REPORTS, MOCK_USERS, findMockUserById, getApprovedDesigners } from '../utils/mockData';

export interface FilterResult {
  passed: boolean;
  originalContent: string;
  filteredContent: string;
  matchedWords: string[];
  matchedPatterns: string[];
  action: 'blocked' | 'censored' | 'flagged';
  riskLevel: 'low' | 'medium' | 'high';
}

export const filterContent = (
  content: string,
  contentType: 'diary' | 'comment' | 'message' | 'portfolio' = 'comment'
): FilterResult => {
  if (!content) {
    return {
      passed: true,
      originalContent: '',
      filteredContent: '',
      matchedWords: [],
      matchedPatterns: [],
      action: 'censored',
      riskLevel: 'low'
    };
  }

  let filteredContent = content;
  const matchedWords: string[] = [];
  const matchedPatterns: string[] = [];

  NON_STANDARD_QUOTE_PHRASES.forEach(phrase => {
    const regex = new RegExp(phrase, 'gi');
    const matches = content.match(regex);
    if (matches) {
      matchedWords.push(...matches);
      filteredContent = filteredContent.replace(regex, '*'.repeat(phrase.length));
    }
  });

  INAPPROPRIATE_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    const matches = content.match(regex);
    if (matches) {
      matchedWords.push(...matches);
      filteredContent = filteredContent.replace(regex, '*'.repeat(word.length));
    }
  });

  SUSPICIOUS_PATTERNS.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matchedPatterns.push(...matches);
      filteredContent = filteredContent.replace(pattern, (m) => '*'.repeat(m.length));
    }
  });

  const hasNonStandardPhrases = matchedWords.some(w =>
    NON_STANDARD_QUOTE_PHRASES.some(p => w.toLowerCase().includes(p.toLowerCase()))
  );
  const hasInappropriate = matchedWords.some(w =>
    INAPPROPRIATE_WORDS.some(i => w.toLowerCase().includes(i.toLowerCase()))
  );
  const hasPatterns = matchedPatterns.length > 0;

  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  let action: 'blocked' | 'censored' | 'flagged' = 'censored';
  let passed = true;

  if (hasInappropriate) {
    riskLevel = 'high';
    action = contentType === 'diary' || contentType === 'portfolio' ? 'flagged' : 'blocked';
    passed = false;
  } else if (hasNonStandardPhrases && matchedWords.length >= 3) {
    riskLevel = 'high';
    action = 'flagged';
  } else if (hasNonStandardPhrases || hasPatterns) {
    riskLevel = 'medium';
    action = 'censored';
  }

  return {
    passed,
    originalContent: content,
    filteredContent,
    matchedWords,
    matchedPatterns,
    action,
    riskLevel
  };
};

export const checkContent = async (req: AuthRequest, res: Response) => {
  try {
    if (!isDbConnected()) {
      const { content = '' } = req.body;
      return res.json({
        success: true,
        data: {
          passed: true,
          originalContent: content,
          filteredContent: content,
          matchedWords: [],
          matchedPatterns: [],
          action: 'pass' as const,
          riskLevel: 'low' as const
        }
      });
    }

    const { content, contentType = 'comment' } = req.body;
    const result = filterContent(content, contentType);

    if (result.matchedWords.length > 0 || result.matchedPatterns.length > 0) {
      await FilterLog.create({
        userId: new mongoose.Types.ObjectId(req.user?._id),
        contentType,
        originalContent: result.originalContent,
        filteredContent: result.filteredContent,
        matchedWords: result.matchedWords,
        action: result.action
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    const { content = '' } = req.body;
    res.json({
      success: true,
      data: {
        passed: true,
        originalContent: content,
        filteredContent: content,
        matchedWords: [],
        matchedPatterns: [],
        action: 'pass' as const,
        riskLevel: 'low' as const
      }
    });
  }
};

export const submitReport = async (req: AuthRequest, res: Response) => {
  try {
    const {
      targetType,
      targetId,
      targetUserId,
      reportType,
      description
    } = req.body;

    if (!targetType || !targetId || !targetUserId || !reportType || !description) {
      return res.status(400).json({ success: false, message: '请填写完整举报信息' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } || {};
    const evidenceImages = files.evidenceImages?.map(f => `/uploads/evidence/${f.filename}`) || [];

    let contentSnapshot: any = { timestamp: new Date() };

    if (targetType === 'diary') {
      const diary = await Diary.findById(targetId);
      if (diary) {
        contentSnapshot.title = diary.title;
        contentSnapshot.content = diary.description;
        contentSnapshot.images = diary.images;
      }
    }

    const existingReports = await Report.find({
      reporterId: req.user?._id,
      targetType,
      targetId,
      status: { $in: ['pending', 'investigating'] }
    });

    if (existingReports.length > 0) {
      return res.status(400).json({
        success: false,
        message: '您已举报过此内容，正在处理中'
      });
    }

    const relatedReports = await Report.find({
      targetType,
      targetId,
      _id: { $ne: null }
    }).select('_id').limit(10);

    const report = await Report.create({
      reporterId: new mongoose.Types.ObjectId(req.user?._id),
      targetType,
      targetId: new mongoose.Types.ObjectId(targetId),
      targetUserId: new mongoose.Types.ObjectId(targetUserId),
      reportType,
      description,
      evidenceImages,
      status: 'pending',
      relatedReports: relatedReports.map(r => r._id),
      contentSnapshot
    });

    res.status(201).json({
      success: true,
      message: '举报已提交，我们将在24小时内处理',
      data: {
        reportId: report._id,
        status: report.status,
        reportCount: relatedReports.length + 1
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '提交举报失败' });
  }
};

export const getMyReports = async (req: AuthRequest, res: Response) => {
  try {
    if (!isDbConnected()) {
      const userId = req.user?._id;
      const filtered = MOCK_REPORTS.filter(r => r.reporterId === userId);
      const reports = filtered.length > 0 ? filtered : MOCK_REPORTS;
      return res.json({
        success: true,
        data: reports
      });
    }

    const reports = await Report.find({ reporterId: req.user?._id })
      .sort({ createdAt: -1 })
      .populate('targetUserId', 'username avatar');

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    const userId = req.user?._id;
    const filtered = MOCK_REPORTS.filter(r => r.reporterId === userId);
    const reports = filtered.length > 0 ? filtered : MOCK_REPORTS;
    res.json({
      success: true,
      data: reports
    });
  }
};

export const getReportsForModeration = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: '仅管理员可访问' });
    }

    const { status, reportType, page = 1, limit = 20 } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (reportType) query.reportType = reportType;

    const skip = (Number(page) - 1) * Number(limit);

    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ status: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('reporterId', 'username avatar')
        .populate('targetUserId', 'username avatar role'),
      Report.countDocuments(query)
    ]);

    const pendingCount = await Report.countDocuments({ status: 'pending' });
    const investigatingCount = await Report.countDocuments({ status: 'investigating' });

    res.json({
      success: true,
      data: {
        reports,
        statistics: {
          pending: pendingCount,
          investigating: investigatingCount,
          total
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取举报列表失败' });
  }
};

export const processReport = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: '仅管理员可处理' });
    }

    const { status, actionTaken, actionDescription, investigationNotes } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: '举报不存在' });
    }

    report.status = status;
    report.actionTaken = actionTaken;
    report.actionDescription = actionDescription;
    report.investigationNotes = investigationNotes;
    report.assignedTo = new mongoose.Types.ObjectId(req.user?._id);

    if (status === 'resolved' || status === 'rejected') {
      report.resolvedAt = new Date();
    }

    if (actionTaken === 'content_removed' && report.targetType === 'diary') {
      await Diary.findByIdAndUpdate(report.targetId, { isPublished: false });
    }

    if (actionTaken === 'user_suspended' || actionTaken === 'user_banned') {
      await User.findByIdAndUpdate(report.targetUserId, {
        designerStatus: actionTaken === 'user_banned' ? 'suspended' : undefined
      });
    }

    await report.save();

    res.json({
      success: true,
      message: '举报处理完成',
      data: report
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '处理失败' });
  }
};

export const getFilterStats = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: '仅管理员可访问' });
    }

    const [totalLogs, blockedCount, censoredCount, flaggedCount, byContentType] = await Promise.all([
      FilterLog.countDocuments(),
      FilterLog.countDocuments({ action: 'blocked' }),
      FilterLog.countDocuments({ action: 'censored' }),
      FilterLog.countDocuments({ action: 'flagged' }),
      FilterLog.aggregate([
        { $group: { _id: '$contentType', count: { $sum: 1 } } }
      ])
    ]);

    const recentLogs = await FilterLog.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'username avatar role');

    res.json({
      success: true,
      data: {
        statistics: {
          total: totalLogs,
          blocked: blockedCount,
          censored: censoredCount,
          flagged: flaggedCount,
          byContentType
        },
        recentLogs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取统计失败' });
  }
};
