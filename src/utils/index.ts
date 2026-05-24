import type { UserRole } from '../../api/types';
import { STATUS_LABELS, STATUS_COLORS, ROLE_LABELS } from './constants';

export function formatPrice(price: number): string {
  return `¥${price.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function formatDateOnly(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getStatusLabel(status: string, type: string): string {
  const labels = STATUS_LABELS[type];
  if (!labels) return status;
  return labels[status] || status;
}

export function getStatusColor(status: string, type: string): string {
  const colors = STATUS_COLORS[type];
  if (!colors) return 'bg-gray-100 text-gray-800';
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] || role;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}
