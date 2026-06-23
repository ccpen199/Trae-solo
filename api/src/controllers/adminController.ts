import { Request, Response } from 'express';
import db from '@/db/index.js';
import type {
  OrgChartResponse,
  OrgChartNode,
  SentimentAnalysisResponse,
  SentimentCategories,
  TrendDataPoint,
  FundAuditResponse,
  FundFlow,
  AuditLog,
  FundStatus,
} from '@shared/types';

const buildOrgTree = (orgs: any[], parentId: number | null = null): OrgChartNode[] => {
  return orgs
    .filter((org) => org.parent_id === parentId)
    .map((org) => ({
      id: org.id,
      name: org.name,
      type: org.type,
      memberCount: org.member_count,
      coverageRate: org.coverage_rate,
      children: buildOrgTree(orgs, org.id),
    }));
};

export const getOrgChart = (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    if (userRole !== 'union_admin' && userRole !== 'provincial_admin') {
      res.status(403).json({ success: false, message: '无权限访问' });
      return;
    }

    const orgs = db.prepare('SELECT * FROM union_organizations ORDER BY type, parent_id').all() as any[];

    const rootOrgs = buildOrgTree(orgs, null);

    const root: OrgChartNode = {
      id: 0,
      name: '全国总工会',
      type: 'provincial',
      memberCount: orgs.reduce((sum: number, org: any) => sum + org.member_count, 0),
      coverageRate: Math.round(
        (orgs.reduce((sum: number, org: any) => sum + org.coverage_rate, 0) / orgs.length) * 100
      ) / 100,
      children: rootOrgs,
    };

    const data: OrgChartResponse = { root };

    res.status(200).json({ success: true, data, message: '获取组织图谱成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取组织图谱失败，服务器错误' });
  }
};

export const getSentimentAnalysis = (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    if (userRole !== 'union_admin' && userRole !== 'provincial_admin') {
      res.status(403).json({ success: false, message: '无权限访问' });
      return;
    }

    const { period = '30d' } = req.query;

    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const appeals = db
      .prepare(
        'SELECT category, sentiment, created_at FROM appeals WHERE created_at >= ? ORDER BY created_at ASC'
      )
      .all(startDate.toISOString()) as any[];

    const categories: SentimentCategories = {
      complaint: 0,
      suggestion: 0,
      praise: 0,
    };

    appeals.forEach((a) => {
      if (a.category === 'complaint') categories.complaint++;
      else if (a.category === 'suggestion') categories.suggestion++;
      else if (a.category === 'praise') categories.praise++;
    });

    const trendData: TrendDataPoint[] = [];
    const dateMap: Record<string, TrendDataPoint> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap[dateStr] = {
        date: dateStr,
        complaint: 0,
        suggestion: 0,
        praise: 0,
      };
    }

    appeals.forEach((a) => {
      const dateStr = a.created_at.split('T')[0];
      if (dateMap[dateStr]) {
        if (a.category === 'complaint') dateMap[dateStr].complaint++;
        else if (a.category === 'suggestion') dateMap[dateStr].suggestion++;
        else if (a.category === 'praise') dateMap[dateStr].praise++;
      }
    });

    for (const dateStr in dateMap) {
      trendData.push(dateMap[dateStr]);
    }

    const data: SentimentAnalysisResponse = {
      period: period as string,
      totalCount: appeals.length,
      categories,
      trendData,
    };

    res.status(200).json({ success: true, data, message: '获取诉求情感分析成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取诉求情感分析失败，服务器错误' });
  }
};

export const getFundAudit = (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    if (userRole !== 'provincial_admin') {
      res.status(403).json({ success: false, message: '无权限访问' });
      return;
    }

    const fundFlowsRaw = db
      .prepare('SELECT * FROM fund_flows ORDER BY created_at DESC LIMIT 50')
      .all() as any[];

    const auditLogsRaw = db
      .prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100')
      .all() as any[];

    const totalFund = fundFlowsRaw.reduce((sum: number, f: any) => sum + f.amount, 0);

    const fundFlows: FundFlow[] = fundFlowsRaw.map((f) => ({
      id: f.id,
      from: f.from_org,
      to: f.to_org,
      amount: f.amount,
      date: f.created_at,
      purpose: f.purpose,
      status: f.status as FundStatus,
    }));

    const auditTrail: AuditLog[] = auditLogsRaw.map((log) => ({
      fundId: log.fund_id,
      action: log.action,
      operator: log.operator,
      timestamp: log.created_at,
      details: log.details,
    }));

    const uniqueApplicationIds = new Set(fundFlowsRaw.map((f: any) => f.application_id));
    const totalProjects = uniqueApplicationIds.size;

    const data: FundAuditResponse = {
      totalFund,
      totalProjects,
      fundFlow: fundFlows,
      auditTrail,
    };

    res.status(200).json({ success: true, data, message: '获取资金审计数据成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取资金审计数据失败，服务器错误' });
  }
};
