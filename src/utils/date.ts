import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format);
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

export function formatRelativeTime(date: string | Date): string {
  return dayjs(date).fromNow();
}

export function getDateRange(startDate: string | Date, endDate: string | Date): string {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  if (start.isSame(end, 'year')) {
    if (start.isSame(end, 'month')) {
      return `${start.format('YYYY年M月D日')} - ${end.format('D日')}`;
    }
    return `${start.format('M月D日')} - ${end.format('M月D日')}`;
  }
  return `${start.format('YYYY年M月D日')} - ${end.format('YYYY年M月D日')}`;
}
