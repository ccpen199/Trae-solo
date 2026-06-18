export function formatPrice(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function formatOrderNo(prefix: string): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${timestamp}${random}`;
}

export function formatDate(date: Date | string, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const tokens: Record<string, string> = {
    YYYY: d.getFullYear().toString(),
    MM: (d.getMonth() + 1).toString().padStart(2, '0'),
    DD: d.getDate().toString().padStart(2, '0'),
    HH: d.getHours().toString().padStart(2, '0'),
    mm: d.getMinutes().toString().padStart(2, '0'),
    ss: d.getSeconds().toString().padStart(2, '0'),
  };

  let result = format;
  for (const [token, value] of Object.entries(tokens)) {
    result = result.replace(token, value);
  }

  return result;
}

export function formatPhone(phone: string): string {
  if (phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}

export function formatIdCard(idCard: string): string {
  if (idCard.length < 8) return idCard;
  const start = idCard.slice(0, 4);
  const end = idCard.slice(-4);
  const middle = '*'.repeat(idCard.length - 8);
  return `${start}${middle}${end}`;
}
