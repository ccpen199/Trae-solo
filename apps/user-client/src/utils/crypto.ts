import CryptoJS from 'crypto-js';
import { generateDeviceFingerprint } from './deviceFingerprint';

const deriveKey = (): string => {
  const fingerprint = generateDeviceFingerprint();
  return CryptoJS.SHA256(fingerprint).toString();
};

export const encryptFeature = (featureData: string): string => {
  const key = deriveKey();
  return CryptoJS.AES.encrypt(featureData, key).toString();
};

export const decryptFeature = (encrypted: string): string => {
  const key = deriveKey();
  const bytes = CryptoJS.AES.decrypt(encrypted, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const hashFeature = (featureData: string): string => {
  return CryptoJS.SHA256(featureData).toString();
};
