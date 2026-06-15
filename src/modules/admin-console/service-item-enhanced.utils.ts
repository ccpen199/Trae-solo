const DEPT_LABELS: Record<string, string> = {
  CIVIL_AFFAIRS: '民政局',
  PUBLIC_SECURITY: '公安局',
  TAXATION: '税务局',
  SOCIAL_SECURITY: '社保局',
  HOUSING: '住建局',
  EDUCATION: '教育局',
  HEALTH: '卫健委',
  TRANSPORTATION: '交通局',
  INDUSTRY_COMMERCE: '市场监管局',
  OTHER: '其他部门',
};

const NECESSITY_LABELS: Record<string, string> = {
  REQUIRED: '必需',
  TOLERABLE: '容缺',
  OPTIONAL: '可选',
};

export { DEPT_LABELS, NECESSITY_LABELS };

export function getDeptLabel(dept: string): string {
  return DEPT_LABELS[dept] || dept;
}

export function getReviewStatus(item: any): 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW' {
  if (!item.publishedAt) return 'PENDING';
  if (item.status) return 'APPROVED';
  return 'REJECTED';
}

export function incrementVersion(version: string): string {
  const parts = version.split('.');
  if (parts.length >= 2) {
    parts[1] = String(parseInt(parts[1]) + 1);
    return parts.join('.');
  }
  return '1.1';
}

export function unitLabel(unit: string): string {
  const map: Record<string, string> = {
    working_days: '个工作日',
    calendar_days: '个自然日',
    hours: '小时',
  };
  return map[unit] || unit;
}

export function resolveNecessityType(material: any): {
  type: 'REQUIRED' | 'TOLERABLE' | 'OPTIONAL';
  label: string;
} {
  const desc = material.description || '';
  const marker = extractNecessityMarker(desc);
  if (marker) {
    return { type: marker, label: NECESSITY_LABELS[marker] };
  }
  if (material.isRequired) {
    return { type: 'REQUIRED', label: '必需' };
  }
  return { type: 'OPTIONAL', label: '可选' };
}

export function extractNecessityMarker(desc: string): 'REQUIRED' | 'TOLERABLE' | 'OPTIONAL' | null {
  const match = desc.match(/\[necessity:(REQUIRED|TOLERABLE|OPTIONAL)\]/);
  return match ? (match[1] as 'REQUIRED' | 'TOLERABLE' | 'OPTIONAL') : null;
}

export function patchNecessityTypeInDescription(
  desc: string | null,
  type: 'REQUIRED' | 'TOLERABLE' | 'OPTIONAL',
): string {
  const raw = desc || '';
  const marker = `[necessity:${type}]`;
  const cleaned = raw.replace(/\[necessity:(REQUIRED|TOLERABLE|OPTIONAL)\]/, '');
  return cleaned + marker;
}

export function formatDescription(format: string, maxSize: number): string {
  return `格式: ${format.toUpperCase()}，最大 ${maxSize}MB`;
}

export function buildBlankFormUrl(material: any): string {
  if (material.sampleUrl) {
    const base = material.sampleUrl as string;
    const lastDot = base.lastIndexOf('.');
    if (lastDot > 0) {
      return base.substring(0, lastDot) + '_blank' + base.substring(lastDot);
    }
    return base + '_blank';
  }
  return '';
}

export function extractFillInstructions(description: string | null): string {
  if (!description) return '';
  const match = description.match(/填报须知[:：](.*?)(?:\[necessity|$)/s);
  return match ? match[1].trim() : '';
}
