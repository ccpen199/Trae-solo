export function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length < 8) return idCard;
  return idCard.slice(0, 4) + '*'.repeat(idCard.length - 8) + idCard.slice(-4);
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

export function maskName(name: string): string {
  if (!name || name.length <= 1) return name;
  if (name.length === 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [username, domain] = email.split('@');
  if (username.length <= 2) return username + '***@' + domain;
  return username.slice(0, 2) + '***@' + domain;
}

export function maskBankCard(cardNo: string): string {
  if (!cardNo || cardNo.length < 8) return cardNo;
  return cardNo.slice(0, 4) + ' **** **** ' + cardNo.slice(-4);
}

export function maskLicensePlate(plate: string): string {
  if (!plate || plate.length < 4) return plate;
  return plate.slice(0, 2) + '**' + plate.slice(-2);
}

export function formatOrderNo(prefix: string, timestamp: number, seq: number): string {
  const dateStr = new Date(timestamp).toISOString().slice(0, 10).replace(/-/g, '');
  const seqStr = seq.toString().padStart(6, '0');
  return `${prefix}${dateStr}${seqStr}`;
}

export function generateTraceId(): string {
  return `TRACE-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
