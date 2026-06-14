import type { Sentiment } from "../../shared/types";

export interface SentimentConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeClass: string;
  icon: "smile" | "meh" | "frown";
  description: string;
}

export interface OpinionLevelConfig {
  level: 1 | 2 | 3 | 4 | 5;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

const sentimentConfigs: Record<Sentiment, SentimentConfig> = {
  positive: {
    label: "积极",
    color: "#10b981",
    bgColor: "#d1fae5",
    borderColor: "#6ee7b7",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-300",
    icon: "smile",
    description: "正面评价，内容积极向上",
  },
  neutral: {
    label: "中性",
    color: "#6b7280",
    bgColor: "#f3f4f6",
    borderColor: "#d1d5db",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-300",
    icon: "meh",
    description: "客观陈述，无明显情感倾向",
  },
  negative: {
    label: "消极",
    color: "#ef4444",
    bgColor: "#fee2e2",
    borderColor: "#fca5a5",
    badgeClass: "bg-red-100 text-red-700 border-red-300",
    icon: "frown",
    description: "负面评价，存在不满或投诉",
  },
};

const opinionLevelConfigs: OpinionLevelConfig[] = [
  {
    level: 1,
    label: "极低风险",
    color: "#10b981",
    bgColor: "#d1fae5",
    description: "内容合规，无风险",
  },
  {
    level: 2,
    label: "低风险",
    color: "#3b82f6",
    bgColor: "#dbeafe",
    description: "轻微问题，可正常发布",
  },
  {
    level: 3,
    label: "中风险",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    description: "需要关注，建议审核",
  },
  {
    level: 4,
    label: "高风险",
    color: "#f97316",
    bgColor: "#ffedd5",
    description: "存在敏感内容，需人工审核",
  },
  {
    level: 5,
    label: "极高风险",
    color: "#ef4444",
    bgColor: "#fee2e2",
    description: "违规内容，应屏蔽处理",
  },
];

export function getSentimentConfig(sentiment: Sentiment): SentimentConfig {
  return sentimentConfigs[sentiment];
}

export function getSentimentByScore(score: number): Sentiment {
  if (score >= 0.33) return "positive";
  if (score <= -0.33) return "negative";
  return "neutral";
}

export function getSentimentConfigByScore(score: number): SentimentConfig {
  const sentiment = getSentimentByScore(score);
  return sentimentConfigs[sentiment];
}

export function getOpinionLevelConfig(
  level: 1 | 2 | 3 | 4 | 5
): OpinionLevelConfig {
  const config = opinionLevelConfigs.find((c) => c.level === level);
  return config || opinionLevelConfigs[2];
}

export function formatSentimentScore(score: number): string {
  const percentage = Math.round((score + 1) * 50);
  return `${percentage}%`;
}

export function getSentimentBarWidth(score: number): number {
  return Math.round((score + 1) * 50);
}
