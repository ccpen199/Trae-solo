import CryptoJS from 'crypto-js';
import { config } from '../config/index.js';

const SECRET = config.encryptionKey;

export const encrypt = (data) => {
  if (!data) return null;
  return CryptoJS.AES.encrypt(String(data), SECRET).toString();
};

export const decrypt = (encrypted) => {
  if (!encrypted) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return encrypted;
  }
};

export const maskPhone = (phone) => {
  if (!phone) return '';
  const decrypted = decrypt(phone) || phone;
  return decrypted.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

export const maskIdCard = (idCard) => {
  if (!idCard) return '';
  const decrypted = decrypt(idCard) || idCard;
  if (decrypted.length === 18) {
    return decrypted.substring(0, 6) + '********' + decrypted.substring(14);
  }
  return '*'.repeat(decrypted.length - 4) + decrypted.slice(-4);
};

export const maskLocation = (lat, lng) => {
  if (!lat || !lng) return { lat, lng };
  return {
    lat: Math.round(parseFloat(lat) * 100) / 100,
    lng: Math.round(parseFloat(lng) * 100) / 100,
  };
};

export const addWatermark = (data, userId, requestId) => {
  return {
    ...data,
    _watermark: {
      userId,
      requestId,
      timestamp: Date.now(),
      hash: CryptoJS.SHA256(`${userId}-${requestId}-${Date.now()}-${SECRET}`).toString(),
    },
  };
};
