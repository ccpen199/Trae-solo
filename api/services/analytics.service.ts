import type { RecruitmentMetrics, ChannelFunnel, KnowledgeGraph, PromotionPath, IndustryType } from '@shared/types';
import { mockRecruitmentMetrics, mockKnowledgeGraphs } from '@shared/mock/data.js';

export class AnalyticsService {
  static async getRecruitmentMetrics(
    companyId?: string
  ): Promise<{ success: boolean; data?: RecruitmentMetrics; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    if (companyId) {
      return { success: true, data: mockRecruitmentMetrics };
    }

    return { success: true, data: mockRecruitmentMetrics };
  }

  static async getChannelFunnelData(): Promise<{ success: boolean; data?: ChannelFunnel[]; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const channelFunnel = mockRecruitmentMetrics.channelFunnel;
    return { success: true, data: channelFunnel };
  }

  static async getTimeToHireByRole(): Promise<{
    success: boolean;
    data?: Record<string, number>;
    error?: string;
  }> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const timeToHireByRole = mockRecruitmentMetrics.timeToHireByRole;
    return { success: true, data: timeToHireByRole };
  }

  static async getKnowledgeGraphs(): Promise<{ success: boolean; data?: KnowledgeGraph[]; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 250));

    return { success: true, data: mockKnowledgeGraphs };
  }

  static async getPromotionPaths(
    industry?: IndustryType,
    jobTitle?: string
  ): Promise<{ success: boolean; data?: PromotionPath[]; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 200));

    let filteredGraphs = mockKnowledgeGraphs;

    if (industry) {
      filteredGraphs = filteredGraphs.filter(g => g.industry === industry);
    }

    if (jobTitle) {
      filteredGraphs = filteredGraphs.filter(g => g.jobTitle === jobTitle);
    }

    const promotionPaths: PromotionPath[] = [];
    for (const graph of filteredGraphs) {
      promotionPaths.push(...graph.promotionPaths);
    }

    return { success: true, data: promotionPaths };
  }
}
