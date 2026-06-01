const apiBase = window.__API_BASE__ || '';

export async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (options.headers) {
    Object.assign(headers, options.headers);
  }
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    throw new Error(typeof payload === 'string' ? payload : payload.error || `HTTP ${response.status}`);
  }
  return payload;
}

export function parseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value); } catch { return []; }
}

export function formatSeconds(totalSeconds = 0) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes ? `${minutes}分${seconds}秒` : `${seconds}秒`;
}

export function statusLabel(status) {
  const labels = {
    draft: '草稿', active: '进行中', paused: '暂停', completed: '已完成',
    pending: '待确认', confirmed: '已确认', cancelled: '已取消',
    scheduled: '已排期', 'in_progress': '进行中', recording: '录制中',
    open: '未解决', resolved: '已解决', closed: '已关闭',
    off: '未录制', ready: '就绪', on: '录制中'
  };
  return labels[status] || status || '未设置';
}

export function categoryLabel(category) {
  const labels = {
    navigation: '导航', form: '表单', content: '内容', interaction: '交互',
    comprehension: '理解偏差', misoperation: '误操作', suggestion: '建议', other: '其他'
  };
  return labels[category] || category || '其他';
}

export function severityClass(severity) {
  return severity || 'medium';
}

export function formatDate(dateStr) {
  if (!dateStr) return '待定';
  return dateStr;
}
