import { get, post } from '@/utils/request';
import type { RecommendService, UserBehaviorAnalysis, RecommendFeedbackParams } from '@/types/recommend';
import { mockRecommendServices, mockUserBehaviorAnalysis } from '@/data/recommends';

export const getRecommendServices = async (limit: number = 6): Promise<RecommendService[]> => {
  console.log('[RecommendService] 获取推荐服务');
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockRecommendServices.slice(0, limit);
};

export const getUserBehaviorAnalysis = async (): Promise<UserBehaviorAnalysis> => {
  console.log('[RecommendService] 获取用户行为分析');
  await new Promise(resolve => setTimeout(resolve, 800));
  return mockUserBehaviorAnalysis;
};

export const refreshRecommend = async (): Promise<RecommendService[]> => {
  console.log('[RecommendService] 刷新推荐');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const shuffled = [...mockRecommendServices].sort(() => Math.random() - 0.5);
  return shuffled;
};

export const submitRecommendFeedback = async (params: RecommendFeedbackParams): Promise<boolean> => {
  console.log('[RecommendService] 提交推荐反馈', params);
  await new Promise(resolve => setTimeout(resolve, 500));
  return true;
};

export const reportNotInterested = async (recommendId: string, reason: string): Promise<boolean> => {
  console.log('[RecommendService] 标记不感兴趣', recommendId, reason);
  await new Promise(resolve => setTimeout(resolve, 500));
  return true;
};

export const getRecommendReasons = async (): Promise<string[]> => {
  console.log('[RecommendService] 获取推荐原因列表');
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return [
    '基于您的参保信息推荐',
    '基于您的证照到期提醒',
    '基于您的工作地变更历史',
    '基于您的位置信息推荐',
    '基于您的历史办件记录',
    '基于您的浏览行为分析',
    '基于长三角跨省通办政策'
  ];
};
