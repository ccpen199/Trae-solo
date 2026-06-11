import type { AnalyticsData } from '@/types/analytics';

export const mockAnalytics: AnalyticsData = {
  qualityTrend: [
    { date: '2026-01', avgEdits: 8.2, atsPassRate: 62 },
    { date: '2026-02', avgEdits: 7.5, atsPassRate: 65 },
    { date: '2026-03', avgEdits: 6.8, atsPassRate: 68 },
    { date: '2026-04', avgEdits: 6.1, atsPassRate: 72 },
    { date: '2026-05', avgEdits: 5.6, atsPassRate: 75 },
    { date: '2026-06', avgEdits: 5.2, atsPassRate: 78 },
  ],
  templateHeatmap: [
    { templateId: 'modern-1', templateName: '现代简约', industry: '互联网', usageCount: 1250 },
    { templateId: 'modern-1', templateName: '现代简约', industry: '金融', usageCount: 580 },
    { templateId: 'classic-1', templateName: '经典商务', industry: '金融', usageCount: 920 },
    { templateId: 'classic-1', templateName: '经典商务', industry: '咨询', usageCount: 760 },
    { templateId: 'creative-1', templateName: '创意设计', industry: '媒体', usageCount: 640 },
    { templateId: 'creative-1', templateName: '创意设计', industry: '互联网', usageCount: 420 },
    { templateId: 'tech-1', templateName: '科技极客', industry: '互联网', usageCount: 890 },
    { templateId: 'tech-1', templateName: '科技极客', industry: '制造业', usageCount: 310 },
    { templateId: 'elegant-1', templateName: '优雅学术', industry: '教育', usageCount: 530 },
    { templateId: 'elegant-1', templateName: '优雅学术', industry: '医疗', usageCount: 280 },
    { templateId: 'minimal-1', templateName: '极简留白', industry: '互联网', usageCount: 670 },
    { templateId: 'minimal-1', templateName: '极简留白', industry: '零售', usageCount: 190 },
  ],
  userActivity: [
    { date: '2026-01', dau: 1200, mau: 15000, retention: 0.42 },
    { date: '2026-02', dau: 1450, mau: 17500, retention: 0.45 },
    { date: '2026-03', dau: 1680, mau: 20000, retention: 0.48 },
    { date: '2026-04', dau: 1920, mau: 23000, retention: 0.51 },
    { date: '2026-05', dau: 2100, mau: 25000, retention: 0.53 },
    { date: '2026-06', dau: 2350, mau: 28000, retention: 0.56 },
  ],
};
