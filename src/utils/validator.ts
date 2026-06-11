export const validateWaybillNo = (waybillNo: string): boolean => {
  if (!waybillNo || waybillNo.length < 8) return false;
  const regex = /^[A-Za-z0-9]{8,20}$/;
  return regex.test(waybillNo);
};

export const validatePhone = (phone: string): boolean => {
  const regex = /^1[3-9]\d{9}$/;
  return regex.test(phone);
};

export const validateIdCard = (idCard: string): boolean => {
  const regex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
  if (!regex.test(idCard)) return false;

  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard[i]) * weights[i];
  }
  const checkCode = checkCodes[sum % 11];
  return idCard[17].toUpperCase() === checkCode;
};

export const validateChineseName = (name: string): boolean => {
  const regex = /^[\u4e00-\u9fa5·]{2,20}$/;
  return regex.test(name);
};

export const validateAddress = (address: string): boolean => {
  if (!address || address.length < 5) return false;
  if (address.length > 200) return false;
  return true;
};

export const validateWeight = (weight: number): boolean => {
  return weight > 0 && weight <= 100;
};

export const validateGoodsDescription = (description: string): boolean => {
  if (!description || description.length < 2) return false;
  if (description.length > 100) return false;
  return true;
};

export const validateExceptionDescription = (description: string): boolean => {
  if (!description || description.length < 5) return false;
  if (description.length > 500) return false;
  return true;
};

export const validateLatitude = (lat: number): boolean => {
  return !isNaN(lat) && lat >= -90 && lat <= 90;
};

export const validateLongitude = (lng: number): boolean => {
  return !isNaN(lng) && lng >= -180 && lng <= 180;
};

export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const a = radLat1 - radLat2;
  const b = (lng1 * Math.PI) / 180 - (lng2 * Math.PI) / 180;
  let s = 2 * Math.asin(Math.sqrt(Math.sin(a / 2) ** 2 + Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(b / 2) ** 2));
  s = s * 6378.137;
  return Math.round(s * 10000) / 10000;
};

export const isPointInFence = (
  pointLat: number,
  pointLng: number,
  centerLat: number,
  centerLng: number,
  radius: number
): boolean => {
  if (!validateLatitude(pointLat) || !validateLongitude(pointLng)) return false;
  if (!validateLatitude(centerLat) || !validateLongitude(centerLng)) return false;

  const distance = calculateDistance(pointLat, pointLng, centerLat, centerLng);
  return distance * 1000 <= radius;
};

export const generateEvidenceHash = (data: Record<string, unknown>): string => {
  const str = JSON.stringify(data) + Date.now() + Math.random();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return '0x' + Math.abs(hash).toString(16).padStart(64, '0').substring(0, 64);
};

export const detectNegativeKeywords = (content: string, keywords: string[]): string[] => {
  if (!content) return [];
  const found: string[] = [];
  for (const keyword of keywords) {
    if (content.includes(keyword) && !found.includes(keyword)) {
      found.push(keyword);
    }
  }
  return found;
};

export const formatWaybillNoDisplay = (waybillNo: string): string => {
  if (!waybillNo) return '';
  if (waybillNo.length <= 8) return waybillNo;
  const first4 = waybillNo.substring(0, 4);
  const last4 = waybillNo.substring(waybillNo.length - 4);
  const middle = '*'.repeat(waybillNo.length - 8);
  return `${first4}${middle}${last4}`;
};

export const formatPhoneDisplay = (phone: string): string => {
  if (!phone || phone.length !== 11) return phone;
  return `${phone.substring(0, 3)}****${phone.substring(7)}`;
};

export const formatIdCardDisplay = (idCard: string): string => {
  if (!idCard) return '';
  if (idCard.length === 18) {
    return `${idCard.substring(0, 6)}********${idCard.substring(14)}`;
  }
  return idCard;
};
