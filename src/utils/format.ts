export function formatMoney(
  amount: number,
  options: {
    symbol?: string;
    decimals?: number;
    thousandsSeparator?: string;
    decimalSeparator?: string;
  } = {}
): string {
  const {
    symbol = "¥",
    decimals = 2,
    thousandsSeparator = ",",
    decimalSeparator = ".",
  } = options;

  if (!Number.isFinite(amount)) {
    return `${symbol}0${decimalSeparator}${"0".repeat(decimals)}`;
  }

  const fixed = Math.abs(amount).toFixed(decimals);
  const [integerPart, decimalPart] = fixed.split(".");
  const withThousands = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    thousandsSeparator
  );

  const sign = amount < 0 ? "-" : "";
  const result = decimalPart
    ? `${withThousands}${decimalSeparator}${decimalPart}`
    : withThousands;

  return `${sign}${symbol}${result}`;
}

export function formatDate(
  input: string | Date | number,
  format: string = "YYYY-MM-DD"
): string {
  const date = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (n: number, len: number = 2): string => String(n).padStart(len, "0");

  const replacements: Record<string, string> = {
    YYYY: String(date.getFullYear()),
    MM: pad(date.getMonth() + 1),
    DD: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
    Y: String(date.getFullYear()),
    M: String(date.getMonth() + 1),
    D: String(date.getDate()),
    H: String(date.getHours()),
    h: String(date.getHours() % 12 || 12),
    m: String(date.getMinutes()),
    s: String(date.getSeconds()),
  };

  return format.replace(
    /YYYY|MM|DD|HH|mm|ss|Y|M|D|H|h|m|s/g,
    (match) => replacements[match] || match
  );
}

export function formatDateTime(
  input: string | Date | number,
  format: string = "YYYY-MM-DD HH:mm"
): string {
  return formatDate(input, format);
}

export function maskIdCard(idCard: string): string {
  if (!idCard) {
    return "";
  }

  const clean = idCard.replace(/\s/g, "");

  if (clean.length <= 6) {
    return clean;
  }

  if (clean.length === 15) {
    return `${clean.slice(0, 6)}${"*".repeat(6)}${clean.slice(-3)}`;
  }

  if (clean.length === 18) {
    return `${clean.slice(0, 6)}${"*".repeat(8)}${clean.slice(-4)}`;
  }

  const visibleStart = Math.min(6, Math.floor(clean.length / 4));
  const visibleEnd = Math.min(4, Math.floor(clean.length / 5));
  const maskedLength = Math.max(clean.length - visibleStart - visibleEnd, 4);

  return `${clean.slice(0, visibleStart)}${"*".repeat(maskedLength)}${clean.slice(-visibleEnd)}`;
}

export interface Coordinate {
  lat: number;
  lng: number;
}

export function haversineDistance(
  point1: Coordinate,
  point2: Coordinate,
  unit: "km" | "m" = "km"
): number {
  const R = unit === "km" ? 6371 : 6371000;

  const toRad = (deg: number): number => (deg * Math.PI) / 180;

  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);

  const lat1 = toRad(point1.lat);
  const lat2 = toRad(point2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
