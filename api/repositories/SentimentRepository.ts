import { db } from '../data/database';
import type { SentimentAnalysis } from '../../shared/types';

export interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
  positiveRate: number;
  neutralRate: number;
  negativeRate: number;
}

export interface SentimentTrendItem {
  date: string;
  sentimentScore: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  totalMentions: number;
}

export class SentimentRepository {
  async findByContentId(contentId: string): Promise<SentimentAnalysis[]> {
    return db.sentimentAnalyses.get(contentId) || [];
  }

  async getLatestAnalysis(contentId: string): Promise<SentimentAnalysis | undefined> {
    const analyses = await this.findByContentId(contentId);
    if (analyses.length === 0) return undefined;
    return analyses.sort((a, b) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime())[0];
  }

  async getSentimentDistribution(contentId: string): Promise<SentimentDistribution> {
    const analyses = await this.findByContentId(contentId);
    if (analyses.length === 0) {
      return {
        positive: 0,
        neutral: 0,
        negative: 0,
        positiveRate: 0,
        neutralRate: 0,
        negativeRate: 0,
      };
    }

    const total = analyses.reduce((sum, a) => sum + a.totalMentions, 0);
    const positive = analyses.reduce((sum, a) => sum + a.positiveCount, 0);
    const neutral = analyses.reduce((sum, a) => sum + a.neutralCount, 0);
    const negative = analyses.reduce((sum, a) => sum + a.negativeCount, 0);

    return {
      positive,
      neutral,
      negative,
      positiveRate: total > 0 ? positive / total : 0,
      neutralRate: total > 0 ? neutral / total : 0,
      negativeRate: total > 0 ? negative / total : 0,
    };
  }

  async getSentimentTrend(contentId: string, days: number = 7): Promise<SentimentTrendItem[]> {
    const analyses = await this.findByContentId(contentId);
    return analyses
      .sort((a, b) => new Date(a.analysisDate).getTime() - new Date(b.analysisDate).getTime())
      .slice(0, days)
      .map(a => ({
        date: a.analysisDate,
        sentimentScore: a.sentimentScore,
        positiveCount: a.positiveCount,
        neutralCount: a.neutralCount,
        negativeCount: a.negativeCount,
        totalMentions: a.totalMentions,
      }));
  }

  async getHotTopics(contentId: string): Promise<string[]> {
    const analyses = await this.findByContentId(contentId);
    const topicCount = new Map<string, number>();

    analyses.forEach(a => {
      a.hotTopics.forEach(topic => {
        topicCount.set(topic, (topicCount.get(topic) || 0) + 1);
      });
    });

    return Array.from(topicCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic);
  }

  async getKeyOpinionLeaders(contentId: string): Promise<string[]> {
    const analyses = await this.findByContentId(contentId);
    const kolCount = new Map<string, number>();

    analyses.forEach(a => {
      a.keyOpinionLeaders.forEach(kol => {
        kolCount.set(kol, (kolCount.get(kol) || 0) + 1);
      });
    });

    return Array.from(kolCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([kol]) => kol);
  }

  async getOverallSentimentScore(contentId: string): Promise<number> {
    const analyses = await this.findByContentId(contentId);
    if (analyses.length === 0) return 0;
    
    const total = analyses.reduce((sum, a) => sum + a.totalMentions, 0);
    const weightedScore = analyses.reduce((sum, a) => sum + a.sentimentScore * a.totalMentions, 0);
    
    return total > 0 ? weightedScore / total : 0;
  }
}

export const sentimentRepository = new SentimentRepository();
