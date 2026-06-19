import type {
  CaseCategory,
  ConsultationStatus,
  LawyerVerifyStatus,
  UrgencyLevel,
} from '@/types';

export function formatDate(date: Date | string, format: string = 'YYYY-MM-DD HH:mm'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const map: Record<string, string> = {
    YYYY: String(d.getFullYear()),
    MM: String(d.getMonth() + 1).padStart(2, '0'),
    DD: String(d.getDate()).padStart(2, '0'),
    HH: String(d.getHours()).padStart(2, '0'),
    mm: String(d.getMinutes()).padStart(2, '0'),
    ss: String(d.getSeconds()).padStart(2, '0'),
  };

  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (match) => map[match]);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function maskFileName(name: string): string {
  if (!name) return '';
  const lastDot = name.lastIndexOf('.');
  const ext = lastDot !== -1 ? name.slice(lastDot) : '';
  const base = lastDot !== -1 ? name.slice(0, lastDot) : name;

  if (base.length <= 4) {
    return base + ext;
  }

  const start = base.slice(0, 2);
  const end = base.slice(-2);
  return `${start}***${end}${ext}`;
}

export function getCategoryLabel(category: CaseCategory): string {
  const labels: Record<CaseCategory, string> = {
    marriage: '婚姻家庭',
    labor: '劳动纠纷',
    debt: '债务债权',
    traffic: '交通事故',
    contract: '合同纠纷',
    criminal: '刑事辩护',
    other: '其他',
  };
  return labels[category];
}

export function getStatusLabel(status: ConsultationStatus): string {
  const labels: Record<ConsultationStatus, string> = {
    pending: '待分派',
    matched: '已匹配',
    chatting: '咨询中',
    closed: '已结案',
    reviewed: '已评价',
  };
  return labels[status];
}

export function getVerifyStatusLabel(status: LawyerVerifyStatus): string {
  const labels: Record<LawyerVerifyStatus, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
    frozen: '已冻结',
  };
  return labels[status];
}

export function getUrgencyLabel(urgency: UrgencyLevel): string {
  const labels: Record<UrgencyLevel, string> = {
    low: '低',
    medium: '中',
    high: '高',
  };
  return labels[urgency];
}
