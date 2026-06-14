export type CandidateStage =
  | "applied"
  | "screening"
  | "ai_screened"
  | "interview_invited"
  | "interview_scheduled"
  | "first_interview"
  | "second_interview"
  | "background_check"
  | "offer"
  | "hired"
  | "rejected"
  | "withdrawn";

export const STAGE_MAP: Record<CandidateStage, { name: string; color: string }> = {
  applied: { name: "简历已收", color: "#1890ff" },
  screening: { name: "初筛中", color: "#faad14" },
  ai_screened: { name: "AI初筛完成", color: "#13c2c2" },
  interview_invited: { name: "已邀约", color: "#722ed1" },
  interview_scheduled: { name: "面试已排期", color: "#9254de" },
  first_interview: { name: "初试中", color: "#722ed1" },
  second_interview: { name: "复试中", color: "#531dab" },
  background_check: { name: "背调中", color: "#fa8c16" },
  offer: { name: "Offer中", color: "#52c41a" },
  hired: { name: "已入职", color: "#389e0d" },
  rejected: { name: "已拒绝", color: "#ff4d4f" },
  withdrawn: { name: "已放弃", color: "#8c8c8c" },
};

export const ALL_STAGES: CandidateStage[] = [
  "applied",
  "screening",
  "ai_screened",
  "interview_invited",
  "interview_scheduled",
  "first_interview",
  "second_interview",
  "background_check",
  "offer",
  "hired",
  "rejected",
  "withdrawn",
];

export const getStageInfo = (stage: string) => {
  return STAGE_MAP[stage as CandidateStage] || { name: stage, color: "#8c8c8c" };
};

export const INTERVIEW_ROUND_MAP: Record<string, string> = {
  first: "初试",
  second: "复试",
  third: "三试",
  final: "终试",
  hr: "HR面",
};

export const INTERVIEW_STATUS_MAP: Record<string, { color: string; text: string }> = {
  scheduled: { color: "blue", text: "已安排" },
  in_progress: { color: "processing", text: "进行中" },
  completed: { color: "success", text: "已完成" },
  cancelled: { color: "default", text: "已取消" },
  no_show: { color: "error", text: "未到场" },
};

export const PUBLISH_CHANNEL_MAP: Record<string, string> = {
  boss: "BOSS直聘",
  zhilian: "前程无忧",
  lagou: "猎聘",
  liepin: "猎聘",
  "51job": "51job",
  internal: "内部推荐",
};

export const AUDIT_STATUS_MAP: Record<string, string> = {
  normal: "正常",
  pending: "待审核",
  warning: "警告",
  violation: "违规",
};

export const ENCRYPTION_TYPE_MAP: Record<string, string> = {
  "AES-256": "AES-256端到端加密",
};

export const BEHAVIOR_MARKERS = [
  "自信",
  "紧张",
  "诚实",
  "回答模糊",
  "夸大经历",
  "专业",
  "团队协作",
  "领导力",
];

export const INTERVIEW_RECOMMENDATION_MAP: Record<string, string> = {
  strong_hire: "强烈推荐",
  hire: "推荐",
  no_hire: "不推荐",
  pending: "待定",
};
