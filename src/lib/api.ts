import type { NewsItem } from '@/components/NewsCard';
import type { TimelineEvent } from '@/components/WorkOrderTimeline';
import type { AlertItem } from '@/store';

type ApiEnvelope<T> = {
  data?: T;
};

const newsCategoryMap: Record<string, string> = {
  policy: '民生政策',
  livelihood: '便民提示',
  culture: '民生动态',
  general: '政务要闻',
};

const newsCategoryReverseMap: Record<string, string> = {
  民生政策: 'policy',
  便民提示: 'livelihood',
  民生动态: 'culture',
  政务要闻: 'general',
  政策解读: 'policy',
  应急预警: 'general',
  全部: '',
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function unwrapApiData<T>(payload: T | ApiEnvelope<T> | null | undefined): T | undefined {
  if (!payload || typeof payload !== 'object') {
    return payload as T | undefined;
  }

  if ('data' in payload) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
}

export function formatDisplayTime(value?: string): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toNewsApiCategory(label: string): string {
  return newsCategoryReverseMap[label] ?? label;
}

export function normalizeNewsItem(article: any, index = 0): NewsItem {
  const category = typeof article?.category === 'string'
    ? (newsCategoryMap[article.category] ?? article.category)
    : '政务要闻';

  return {
    id: article?.id ?? String(index),
    title: article?.title ?? '未命名新闻',
    summary: article?.summary ?? '',
    cover: article?.cover ?? article?.coverImage,
    category,
    publishTime: formatDisplayTime(article?.publishTime),
    views: Number(article?.views ?? 0),
    featured: Boolean(article?.featured ?? index === 0),
  };
}

export function normalizeAlertItem(alert: any): AlertItem {
  const level = ['blue', 'yellow', 'orange', 'red'].includes(alert?.level) ? alert.level : 'blue';

  return {
    id: alert?.id ?? '',
    level,
    title: alert?.title ?? '预警通知',
    content: alert?.content ?? '',
    timestamp: formatDisplayTime(alert?.timestamp ?? alert?.publishTime),
  };
}

export function normalizeWorkOrderItem(order: any) {
  const status = order?.status === 'assigned'
    ? 'processing'
    : ['pending', 'processing', 'completed', 'closed'].includes(order?.status)
      ? order.status
      : 'pending';
  const lastProgress = Array.isArray(order?.progress) && order.progress.length > 0
    ? order.progress[order.progress.length - 1]
    : undefined;

  return {
    id: order?.id ?? '',
    title: order?.title ?? '未命名工单',
    description: order?.description ?? '',
    category: order?.category ?? '其他',
    status,
    priority: status === 'processing' ? 'high' : 'normal',
    createTime: formatDisplayTime(order?.submitTime),
    updateTime: formatDisplayTime(lastProgress?.time ?? order?.deadline ?? order?.submitTime),
    handler: order?.responsibleDept || undefined,
    expectedDays: undefined,
  };
}

function normalizeTimelineStatus(status?: string): TimelineEvent['status'] {
  switch (status) {
    case 'assigned':
    case '已派单':
      return 'assigned';
    case 'processing':
    case '处理中':
      return 'processing';
    case 'completed':
    case '已完成':
      return 'completed';
    case 'closed':
    case '已归档':
      return 'closed';
    case 'submitted':
    case '已提交':
    default:
      return 'submitted';
  }
}

export function normalizeTimeline(progress: any[]): TimelineEvent[] {
  return progress.map((item, index) => ({
    id: item?.id ?? `${index}`,
    status: normalizeTimelineStatus(item?.status),
    title: typeof item?.status === 'string' ? item.status : '进度更新',
    description: item?.remark ?? '',
    time: formatDisplayTime(item?.time),
    operator: item?.operator ?? '',
  }));
}

export function toRichTextHtml(content?: string): string {
  if (!content) {
    return '<p>暂无内容</p>';
  }

  return content
    .split(/\n+/)
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join('');
}
