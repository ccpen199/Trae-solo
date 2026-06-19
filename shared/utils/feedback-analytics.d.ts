import type { ServiceFeedback, FeedbackCluster } from '../types';
export declare function clusterFeedbacks(feedbacks: ServiceFeedback[], similarityThreshold?: number): FeedbackCluster[];
export declare function analyzeFeedbackTrend(feedbacks: ServiceFeedback[], periodDays?: number): {
    date: string;
    avgRating: number;
    count: number;
    negativeCount: number;
}[];
export declare function generateWorkOrderFromFeedback(feedback: ServiceFeedback): {
    title: string;
    type: 'complaint' | 'suggestion' | 'consultation' | 'supervision';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    tags: string[];
    deadline: string;
};
//# sourceMappingURL=feedback-analytics.d.ts.map