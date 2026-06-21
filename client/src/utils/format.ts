import dayjs from 'dayjs';

export function formatTime(value?: string | Date, format: string = 'YYYY-MM-DD HH:mm:ss') {
  if (!value) return '-';
  return dayjs(value).format(format);
}

export function formatDate(value?: string | Date) {
  return formatTime(value, 'YYYY-MM-DD');
}

export function formatRelativeTime(value: string | Date) {
  if (!value) return '-';
  const now = dayjs();
  const target = dayjs(value);
  const diffMs = now.diff(target);
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return formatDate(value);
}

export function formatDuration(seconds?: number) {
  if (!seconds) return '0秒';
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}时${m}分${s}秒`;
}

export function formatFileSize(bytes?: number) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getOnlineStatusText(status: number) {
  return status === 1 ? '在线' : '离线';
}

export function getEventLevelText(level: string) {
  const map: Record<string, string> = {
    low: '低',
    normal: '普通',
    high: '高',
    critical: '严重'
  };
  return map[level] || level;
}

export function getEventLevelColor(level: string) {
  const map: Record<string, string> = {
    low: 'green',
    normal: 'blue',
    high: 'orange',
    critical: 'red'
  };
  return map[level] || 'default';
}

export function getEventTypeText(type: string) {
  const map: Record<string, string> = {
    person_detect: '人形侦测',
    motion_detect: '移动侦测',
    face_recognize: '人脸识别',
    vehicle_detect: '车辆检测',
    intrusion: '区域入侵',
    line_cross: '越界侦测',
    offline: '设备离线',
    fire: '火焰检测',
    smoke: '烟雾检测'
  };
  return map[type] || type;
}

export function getPermissionText(perm: string) {
  const map: Record<string, string> = {
    owner: '全部权限',
    view: '只看',
    talk: '可对讲',
    config: '可配置'
  };
  return map[perm] || perm;
}

export function getRoleText(role: string) {
  const map: Record<string, string> = {
    owner: '主账号',
    member: '家庭成员',
    guest: '访客'
  };
  return map[role] || role;
}

export function getRiskLevelColor(level: string) {
  const map: Record<string, string> = {
    low: 'green',
    medium: 'orange',
    high: 'red'
  };
  return map[level] || 'default';
}

export function maskPhone(phone?: string) {
  if (!phone || phone.length < 7) return phone || '-';
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
}

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    import('antd').then(({ message }) => message.success('已复制'));
  }).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    import('antd').then(({ message }) => message.success('已复制'));
  });
}
