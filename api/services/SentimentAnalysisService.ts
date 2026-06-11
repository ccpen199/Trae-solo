import { sentimentRepository, type SentimentDistribution, type SentimentTrendItem } from '../repositories/SentimentRepository';
import type { SentimentAnalysis } from '../../shared/types';

export interface SentimentAnalysisResult {
  latestAnalysis: SentimentAnalysis | undefined;
  distribution: SentimentDistribution;
  overallScore: number;
  trend: SentimentTrendItem[];
  hotTopics: string[];
  keyOpinionLeaders: string[];
}

export interface EmotionDistributionData {
  name: string;
  value: number;
  rate: number;
}

export interface SentimentTrendData {
  date: string;
  sentimentScore: number;
  positive: number;
  neutral: number;
  negative: number;
}

export class SentimentAnalysisService {
  async getSentimentAnalysis(contentId: string): Promise<SentimentAnalysisResult> {
    const [
      latestAnalysis,
      distribution,
      overallScore,
      trend,
      hotTopics,
      keyOpinionLeaders,
    ] = await Promise.all([
      sentimentRepository.getLatestAnalysis(contentId),
      sentimentRepository.getSentimentDistribution(contentId),
      sentimentRepository.getOverallSentimentScore(contentId),
      sentimentRepository.getSentimentTrend(contentId),
      sentimentRepository.getHotTopics(contentId),
      sentimentRepository.getKeyOpinionLeaders(contentId),
    ]);

    return {
      latestAnalysis,
      distribution,
      overallScore,
      trend,
      hotTopics,
      keyOpinionLeaders,
    };
  }

  async getEmotionDistribution(contentId: string): Promise<EmotionDistributionData[]> {
    const distribution = await sentimentRepository.getSentimentDistribution(contentId);
    
    return [
      {
        name: '正面',
        value: distribution.positive,
        rate: distribution.positiveRate,
      },
      {
        name: '中性',
        value: distribution.neutral,
        rate: distribution.neutralRate,
      },
      {
        name: '负面',
        value: distribution.negative,
        rate: distribution.negativeRate,
      },
    ];
  }

  async getSentimentTrend(contentId: string, days: number = 7): Promise<SentimentTrendData[]> {
    const trend = await sentimentRepository.getSentimentTrend(contentId, days);
    
    return trend.map(item => ({
      date: item.date,
      sentimentScore: item.sentimentScore,
      positive: item.positiveCount,
      neutral: item.neutralCount,
      negative: item.negativeCount,
    }));
  }

  async getHotTopics(contentId: string, limit: number = 10): Promise<Array<{ topic: string; count: number }>> {
    const analyses = await sentimentRepository.findByContentId(contentId);
    const topicCount = new Map<string, number>();

    analyses.forEach(a => {
      a.hotTopics.forEach(topic => {
        topicCount.set(topic, (topicCount.get(topic) || 0) + 1);
      });
    });

    return Array.from(topicCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([topic, count]) => ({ topic, count }));
  }

  async getKeyOpinionLeaders(contentId: string, limit: number = 10): Promise<Array<{ name: string; count: number }>> {
    const analyses = await sentimentRepository.findByContentId(contentId);
    const kolCount = new Map<string, number>();

    analyses.forEach(a => {
      a.keyOpinionLeaders.forEach(kol => {
        kolCount.set(kol, (kolCount.get(kol) || 0) + 1);
      });
    });

    return Array.from(kolCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  }

  async getOverallSentimentScore(contentId: string): Promise<{
    score: number;
    level: 'excellent' | 'good' | 'normal' | 'poor' | 'bad';
    description: string;
  }> {
    const score = await sentimentRepository.getOverallSentimentScore(contentId);
    
    let level: 'excellent' | 'good' | 'normal' | 'poor' | 'bad';
    let description: string;

    if (score >= 0.8) {
      level = 'excellent';
      description = '舆论评价极好';
    } else if (score >= 0.6) {
      level = 'good';
      description = '舆论评价良好';
    } else if (score >= 0.4) {
      level = 'normal';
      description = '舆论评价一般';
    } else if (score >= 0.2) {
      level = 'poor';
      description = '舆论评价较差';
    } else {
      level = 'bad';
      description = '舆论评价很差';
    }

    return {
      score: Math.round(score * 10000) / 10000,
      level,
      description,
    };
  }

  async getSentimentAlert(contentId: string): Promise<{
    hasAlert: boolean;
    alertLevel: 'low' | 'medium' | 'high';
    alerts: string[];
  }> {
    const distribution = await sentimentRepository.getSentimentDistribution(contentId);
    const alerts: string[] = [];
    let alertLevel: 'low' | 'medium' | 'high' = 'low';

    if (distribution.negativeRate > 0.3) {
      alertLevel = 'high';
      alerts.push(`负面评价占比过高: ${(distribution.negativeRate * 100).toFixed(1)}%`);
    } else if (distribution.negativeRate > 0.15) {
      alertLevel = 'medium';
      alerts.push(`负面评价占比偏高: ${(distribution.negativeRate * 100).toFixed(1)}%`);
    }

    if (distribution.positiveRate < 0.4) {
      alertLevel = alertLevel === 'high' ? 'high' : 'medium';
      alerts.push(`正面评价占比偏低: ${(distribution.positiveRate * 100).toFixed(1)}%`);
    }

    return {
      hasAlert: alerts.length > 0,
      alertLevel,
      alerts,
    };
  }
}

export const sentimentAnalysisService = new SentimentAnalysisService();
