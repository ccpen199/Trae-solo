export type LifeEventTag = '恋爱' | '职场' | '学业' | '家庭' | '社交' | '经济' | '健康' | '成长';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical' | 'crisis';

export interface UserProfile {
  id: string;
  anonymous_name: string;
  phq9_score: number;
  gad7_score: number;
  life_event_tags: LifeEventTag[];
  counseling_goals: string;
  risk_level: RiskLevel;
  created_at: string;
}

export interface EmotionClustering {
  anxiety: number;
  depression: number;
  anger: number;
  calm: number;
  hope: number;
  fear: number;
}

export interface VentRecord {
  id: string;
  profile_id: string;
  content: string;
  emotion_clustering: EmotionClustering;
  risk_level: RiskLevel;
  keywords: string[];
}

export interface Counselor {
  id: string;
  anonymous_name: string;
  avatar: string;
  credential_type: string;
  ocr_status: 'pending' | 'verified' | 'rejected';
  db_match_status: 'pending' | 'matched' | 'mismatched';
  expertise_tags: LifeEventTag[];
  rating: number;
  session_count: number;
  created_at: string;
}

export interface TimeSlot {
  id: string;
  counselor_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_available: number;
}

export interface MatchResult {
  counselor: Counselor;
  score: number;
  breakdown: {
    expertise_score: number;
    schedule_score: number;
    preference_score: number;
  };
}

export interface Session {
  id: string;
  profile_id: string;
  counselor_id: string;
  counselor_name?: string;
  counselor_tags?: LifeEventTag[];
  scheduled_at: string;
  duration: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
}

export interface SessionSummary {
  id: string;
  session_id: string;
  emotion_state: string;
  core_issues: string[];
  suggested_actions: string[];
  next_focus: string;
}

export interface EmotionTrend {
  id: string;
  profile_id: string;
  record_date: string;
  phq9_score: number;
  gad7_score: number;
  dominant_emotion: string;
}

export const LIFE_EVENT_LABELS: Record<LifeEventTag, string> = {
  '恋爱': '💕 恋爱',
  '职场': '💼 职场',
  '学业': '📚 学业',
  '家庭': '🏠 家庭',
  '社交': '🤝 社交',
  '经济': '💰 经济',
  '健康': '🌿 健康',
  '成长': '🌱 成长',
};

export const RISK_LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: '低风险', color: 'text-mint-500', bg: 'bg-mint-100' },
  medium: { label: '中风险', color: 'text-yellow-500', bg: 'bg-yellow-100' },
  high: { label: '高风险', color: 'text-orange-500', bg: 'bg-orange-100' },
  critical: { label: '危机', color: 'text-red-500', bg: 'bg-red-100' },
  crisis: { label: '危机', color: 'text-red-500', bg: 'bg-red-100' },
};

export const PHQ9_QUESTIONS = [
  '做事时提不起劲或没有兴趣',
  '感到心情低落、沮丧或绝望',
  '入睡困难、睡不安稳或睡眠过多',
  '感觉疲倦或没有活力',
  '食欲不振或吃太多',
  '觉得自己很糟，或觉得自己是个失败者',
  '对事物专注有困难',
  '动作或说话速度缓慢，或相反——烦躁不安',
  '有不如死掉或用某种方式伤害自己的念头',
];

export const GAD7_QUESTIONS = [
  '感到紧张、焦虑或急切',
  '不能停止或控制担忧',
  '对各种各样的事情担忧过多',
  '很难放松下来',
  '由于不安而无法静坐',
  '变得容易烦恼或急躁',
  '感到似乎将有可怕的事情发生',
];

export const SCALE_OPTIONS = [
  { value: 0, label: '完全没有' },
  { value: 1, label: '有几天' },
  { value: 2, label: '一半以上天数' },
  { value: 3, label: '几乎每天' },
];

export const COUNSELING_GOAL_TEMPLATES = [
  '学会情绪管理',
  '改善人际关系',
  '增强自我认知',
  '缓解焦虑情绪',
  '走出低落状态',
  '提升自信心',
  '处理亲密关系',
  '职业发展方向',
];
