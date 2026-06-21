const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const config = require('../config');

function generateToken(user, extraPayload = {}) {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    ...extraPayload
  };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (e) {
    return null;
  }
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function generateUUID() {
  return uuidv4();
}

function generateDeviceSN() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `IPC-${timestamp}-${random}`;
}

function generateTemporaryToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function validateIMEI(imei) {
  if (!imei || imei.length !== 15) return false;
  if (!/^\d+$/.test(imei)) return false;
  
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(imei[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(imei[14]);
}

function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone;
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
}

function getClientIp(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || '127.0.0.1';
}

function calculateFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateUUID,
  generateDeviceSN,
  generateTemporaryToken,
  generateOTP,
  validateIMEI,
  maskPhone,
  getClientIp,
  calculateFileSize
};
