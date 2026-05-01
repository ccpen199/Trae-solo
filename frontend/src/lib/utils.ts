import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('zh-CN').format(num);
}

export function formatPercentage(num: number, decimals = 2): string {
  return `${num.toFixed(decimals)}%`;
}

export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    DRAFT: 'badge-default',
    PENDING_REVIEW: 'badge-warning',
    REVIEW_REJECTED: 'badge-danger',
    REVIEW_APPROVED: 'badge-primary',
    PENDING_SEND: 'badge-primary',
    SENDING: 'badge-warning',
    COMPLETED: 'badge-success',
    PAUSED: 'badge-default',
    CANCELLED: 'badge-danger',
    RUNNING: 'badge-primary',
    PENDING: 'badge-default',
    APPROVED: 'badge-success',
    REJECTED: 'badge-danger',
    SENT: 'badge-success',
    DELIVERED: 'badge-success',
    OPENED: 'badge-primary',
    CLICKED: 'badge-success',
    BOUNCED: 'badge-danger',
    UNSUBSCRIBED: 'badge-danger',
    FAILED: 'badge-danger',
    SPAM: 'badge-danger',
  };
  
  return statusMap[status] || 'badge-default';
}

export function getStatusDot(status: string): string {
  const statusMap: Record<string, string> = {
    DRAFT: 'status-dot-neutral',
    PENDING_REVIEW: 'status-dot-warning',
    REVIEW_REJECTED: 'status-dot-danger',
    REVIEW_APPROVED: 'status-dot-success',
    PENDING_SEND: 'status-dot-primary',
    SENDING: 'status-dot-warning',
    COMPLETED: 'status-dot-success',
    PAUSED: 'status-dot-neutral',
    CANCELLED: 'status-dot-danger',
    RUNNING: 'status-dot-primary',
    SENT: 'status-dot-success',
    DELIVERED: 'status-dot-success',
    OPENED: 'status-dot-primary',
    CLICKED: 'status-dot-success',
    BOUNCED: 'status-dot-danger',
    UNSUBSCRIBED: 'status-dot-danger',
    FAILED: 'status-dot-danger',
  };
  
  return statusMap[status] || 'status-dot-neutral';
}

export function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    DRAFT: '草稿',
    PENDING_REVIEW: '待审核',
    REVIEW_REJECTED: '审核驳回',
    REVIEW_APPROVED: '审核通过',
    PENDING_SEND: '待发送',
    SENDING: '发送中',
    COMPLETED: '已完成',
    PAUSED: '已暂停',
    CANCELLED: '已取消',
    RUNNING: '运行中',
    PENDING: '待处理',
    APPROVED: '已通过',
    REJECTED: '已驳回',
    SENT: '已发送',
    DELIVERED: '已送达',
    OPENED: '已打开',
    CLICKED: '已点击',
    BOUNCED: '已退信',
    UNSUBSCRIBED: '已退订',
    FAILED: '发送失败',
    SPAM: '垃圾邮件',
  };
  
  return statusMap[status] || status;
}

export function getRoleLabel(role: string): string {
  const roleMap: Record<string, string> = {
    ADMIN: '系统管理员',
    MARKETING_OPERATOR: '市场运营',
    COPYWRITER: '文案策划',
    DATA_ANALYST: '数据分析师',
    VIEWER: '只读用户',
  };
  
  return roleMap[role] || role;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
