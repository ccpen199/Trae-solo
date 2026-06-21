import dayjs from 'dayjs';

export function formatMoney(amount: number | string | undefined | null, decimals: number = 2): string {
  if (amount === undefined || amount === null || amount === '') {
    return '¥0.00';
  }
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    return '¥0.00';
  }
  const formatted = num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `¥${formatted}`;
}

export function formatDate(date: string | number | Date | undefined | null, format: string = 'YYYY-MM-DD'): string {
  if (!date) {
    return '-';
  }
  const d = dayjs(date);
  if (!d.isValid()) {
    return '-';
  }
  return d.format(format);
}

export function formatDateTime(date: string | number | Date | undefined | null): string {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss');
}

export function formatRelativeTime(date: string | number | Date | undefined | null): string {
  if (!date) {
    return '-';
  }
  const d = dayjs(date);
  if (!d.isValid()) {
    return '-';
  }
  const now = dayjs();
  const diff = now.diff(d, 'minute');
  if (diff < 1) {
    return '刚刚';
  }
  if (diff < 60) {
    return `${diff}分钟前`;
  }
  const diffHours = Math.floor(diff / 60);
  if (diffHours < 24) {
    return `${diffHours}小时前`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays}天前`;
  }
  return d.format('YYYY-MM-DD');
}

export function maskIdNumber(idNumber: string | undefined | null): string {
  if (!idNumber || idNumber.length < 8) {
    return idNumber || '-';
  }
  const prefix = idNumber.substring(0, 6);
  const suffix = idNumber.substring(idNumber.length - 4);
  const middleLength = idNumber.length - 10;
  return `${prefix}${'*'.repeat(middleLength)}${suffix}`;
}

export function maskPhone(phone: string | undefined | null): string {
  if (!phone || phone.length < 11) {
    return phone || '-';
  }
  const prefix = phone.substring(0, 3);
  const suffix = phone.substring(phone.length - 4);
  return `${prefix}****${suffix}`;
}

export function maskName(name: string | undefined | null): string {
  if (!name) {
    return '-';
  }
  if (name.length <= 1) {
    return name;
  }
  if (name.length === 2) {
    return `${name.charAt(0)}*`;
  }
  const first = name.charAt(0);
  const last = name.charAt(name.length - 1);
  const middle = '*'.repeat(name.length - 2);
  return `${first}${middle}${last}`;
}

export function maskBankCard(cardNo: string | undefined | null): string {
  if (!cardNo || cardNo.length < 8) {
    return cardNo || '-';
  }
  const prefix = cardNo.substring(0, 4);
  const suffix = cardNo.substring(cardNo.length - 4);
  const middleLength = cardNo.length - 8;
  return `${prefix} ${'*'.repeat(Math.floor(middleLength / 2))} ${'*'.repeat(Math.ceil(middleLength / 2))} ${suffix}`;
}
