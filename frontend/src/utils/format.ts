import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export const formatTime = (date: string | Date) => {
  return dayjs(date).fromNow();
};

export const formatDateTime = (date: string | Date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const formatDate = (date: string | Date) => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const formatDistance = (meters?: number) => {
  if (!meters) return '';
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

export const formatCouponDiscount = (type: string, value: number) => {
  switch (type) {
    case 'PERCENTAGE':
      return `${10 - value / 10}折`;
    case 'FIXED_AMOUNT':
      return `¥${value}`;
    case 'BUY_X_GET_Y':
      return `买${value}赠${value}`;
    default:
      return '';
  }
};

export const getPostTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    NEWS: '资讯',
    REVIEW: '探店',
    ACTIVITY: '活动',
    HELP: '求助',
    INFO: '便民',
    NOTICE: '通知',
    EMERGENCY: '紧急',
  };
  return labels[type] || type;
};

export const getPostTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    NEWS: 'bg-blue-100 text-blue-700',
    REVIEW: 'bg-orange-100 text-orange-700',
    ACTIVITY: 'bg-green-100 text-green-700',
    HELP: 'bg-yellow-100 text-yellow-700',
    INFO: 'bg-teal-100 text-teal-700',
    NOTICE: 'bg-purple-100 text-purple-700',
    EMERGENCY: 'bg-red-100 text-red-700',
  };
  return colors[type] || 'bg-gray-100 text-gray-700';
};

export const getSourceLevelLabel = (level: string) => {
  const labels: Record<string, string> = {
    ORDINARY: '',
    V: '认证用户',
    OFFICIAL: '官方',
    GOV: '政府',
  };
  return labels[level] || '';
};

export const getSourceLevelColor = (level: string) => {
  const colors: Record<string, string> = {
    ORDINARY: '',
    V: 'bg-yellow-500',
    OFFICIAL: 'bg-blue-500',
    GOV: 'bg-red-500',
  };
  return colors[level] || '';
};

export const getSourceLevelDesc = (level: string) => {
  const descs: Record<string, string> = {
    ORDINARY: '',
    V: '个人实名认证用户，内容可信度高',
    OFFICIAL: '经官方机构认证，信息权威可靠',
    GOV: '政府机构发布，具有最高公信力',
  };
  return descs[level] || '';
};

export const getRiskLevelLabel = (level: string) => {
  const labels: Record<string, string> = {
    LOW: '低风险',
    MEDIUM: '待核验',
    HIGH: '高风险',
    CRITICAL: '极高风险',
  };
  return labels[level] || level;
};

export const getRiskLevelColor = (level: string) => {
  const colors: Record<string, string> = {
    LOW: 'bg-green-100 text-green-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    HIGH: 'bg-orange-100 text-orange-700',
    CRITICAL: 'bg-red-100 text-red-700',
  };
  return colors[level] || 'bg-gray-100 text-gray-700';
};

export const getAuditActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    AI_PASS: 'AI审核通过',
    AI_FLAG: 'AI风险标记',
    APPROVE: '人工审核通过',
    REJECT: '内容驳回',
    RUMOR: '谣言标记',
    CLARIFY: '辟谣澄清',
  };
  return labels[action] || action;
};

export const getAuditActionColor = (action: string) => {
  const colors: Record<string, string> = {
    AI_PASS: 'bg-green-100 text-green-700',
    AI_FLAG: 'bg-yellow-100 text-yellow-700',
    APPROVE: 'bg-blue-100 text-blue-700',
    REJECT: 'bg-red-100 text-red-700',
    RUMOR: 'bg-red-100 text-red-700',
    CLARIFY: 'bg-purple-100 text-purple-700',
  };
  return colors[action] || 'bg-gray-100 text-gray-700';
};

export const getHelpTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    SECOND_HAND: '闲置置换',
    SKILL_EXCHANGE: '技能交换',
    EMERGENCY: '紧急求助',
    OTHER: '其他',
  };
  return labels[type] || type;
};

export const getHelpTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    SECOND_HAND: 'bg-green-100 text-green-700 border-green-200',
    SKILL_EXCHANGE: 'bg-purple-100 text-purple-700 border-purple-200',
    EMERGENCY: 'bg-red-100 text-red-700 border-red-300',
    OTHER: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return colors[type] || '';
};

export const getHelpStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    OPEN: '待响应',
    IN_PROGRESS: '处理中',
    RESOLVED: '已解决',
    CLOSED: '已关闭',
  };
  return labels[status] || status;
};

export const getHelpStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    OPEN: 'bg-yellow-500',
    IN_PROGRESS: 'bg-blue-500',
    RESOLVED: 'bg-green-500',
    CLOSED: 'bg-gray-400',
  };
  return colors[status] || '';
};

export const getRedemptionRateColor = (rate: number) => {
  if (rate >= 80) return 'text-green-600';
  if (rate >= 50) return 'text-yellow-600';
  return 'text-gray-500';
};
