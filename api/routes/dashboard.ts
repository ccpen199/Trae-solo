import { Router, type Request, type Response } from 'express';
import { mockContents } from '../data/contentData.js';
import { mockAppeals } from '../data/appealData.js';
import { mockEmergencies } from '../data/emergencyData.js';
import { mockOpinionSummary } from '../data/opinionData.js';
import { getRandomInt } from '../data/utils.js';

const router = Router();

router.get('/stats', (req: Request, res: Response): void => {
  const totalUsers = 1285634;
  const todayPublished = mockContents.filter((c) => c.status === 'published').length;
  const pendingAppeals = mockAppeals.filter(
    (a) => a.status === 'pending' || a.status === 'processing',
  ).length;
  const activeEmergencies = mockEmergencies.filter((e) => e.status === 'published');
  const emergencyLevel = activeEmergencies.some((e) => e.level === 'red')
    ? 'red'
    : activeEmergencies.some((e) => e.level === 'orange')
      ? 'orange'
      : activeEmergencies.some((e) => e.level === 'yellow')
        ? 'yellow'
        : 'normal';

  const data = {
    totalUsers,
    todayPublished,
    pendingAppeals,
    emergencyLevel,
    userTrend: getRandomInt(2, 15),
    contentTrend: getRandomInt(-5, 20),
    appealTrend: getRandomInt(-10, 10),
  };

  res.json({ success: true, data });
});

router.get('/quick-entries', (req: Request, res: Response): void => {
  const entries = [
    { id: 'content', name: '内容发布', icon: 'FileText', color: 'blue' },
    { id: 'appeal', name: '诉求处理', icon: 'MessageSquare', color: 'green' },
    { id: 'emergency', name: '应急发布', icon: 'AlertTriangle', color: 'red' },
    { id: 'gis-map', name: '地图服务', icon: 'Map', color: 'cyan' },
    { id: 'audit', name: '内容审核', icon: 'CheckSquare', color: 'yellow' },
    { id: 'public-opinion', name: '舆情分析', icon: 'TrendingUp', color: 'purple' },
  ];

  res.json({ success: true, data: entries });
});

router.get('/active-emergencies', (req: Request, res: Response): void => {
  const active = mockEmergencies.filter((e) => e.status === 'published' && e.isPinned).slice(0, 3);
  res.json({ success: true, data: active });
});

router.get('/recent-contents', (req: Request, res: Response): void => {
  const recent = mockContents
    .filter((c) => c.status === 'published')
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      title: c.title,
      channel: c.channel,
      viewCount: c.viewCount,
      publishTime: c.publishTime,
    }));

  res.json({ success: true, data: recent });
});

router.get('/appeal-summary', (req: Request, res: Response): void => {
  const total = mockAppeals.length;
  const pending = mockAppeals.filter((a) => a.status === 'pending').length;
  const processing = mockAppeals.filter((a) => a.status === 'processing').length;
  const resolved = mockAppeals.filter((a) => a.status === 'resolved' || a.status === 'closed').length;
  const transferred = mockAppeals.filter((a) => a.status === 'transferred').length;

  res.json({
    success: true,
    data: {
      total,
      pending,
      processing,
      resolved,
      transferred,
    },
  });
});

router.get('/opinion-brief', (req: Request, res: Response): void => {
  const brief = {
    heatIndex: mockOpinionSummary.heatIndex,
    trend: mockOpinionSummary.trend,
    hotTopics: mockOpinionSummary.hotTopics.slice(0, 5),
    totalMentions: mockOpinionSummary.totalMentions,
    positiveRate: mockOpinionSummary.positiveRate,
  };

  res.json({ success: true, data: brief });
});

export default router;
