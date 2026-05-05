import crypto from 'crypto';
import config from '../config/index.js';

export const generateSignature = (params, secretKey = config.secretKey) => {
  const sortedKeys = Object.keys(params).sort();
  let signStr = '';
  sortedKeys.forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      signStr += `${key}=${params[key]}&`;
    }
  });
  signStr += `secret=${secretKey}`;
  
  return crypto.createHash('md5').update(signStr, 'utf8').digest('hex').toUpperCase();
};

export const verifySignature = (params, receivedSign, secretKey = config.secretKey) => {
  const { sign, ...restParams } = params;
  const expectedSign = generateSignature(restParams, secretKey);
  return expectedSign === receivedSign.toUpperCase();
};

export const md5 = (str) => {
  return crypto.createHash('md5').update(str, 'utf8').digest('hex');
};

export const encryptData = (data, secretKey = config.secretKey) => {
  const cipher = crypto.createCipher('aes-256-cbc', secretKey.substring(0, 32));
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

export const decryptData = (encryptedData, secretKey = config.secretKey) => {
  const decipher = crypto.createDecipher('aes-256-cbc', secretKey.substring(0, 32));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
};
