const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

const generateId = () => uuidv4();

const generateOrderNo = (prefix = 'IM') => {
  const timestamp = dayjs().format('YYYYMMDDHHmmss');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

const formatDateTime = (date = new Date()) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

const parseJSON = (str, defaultValue = null) => {
  if (!str) return defaultValue;
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
};

const stringifyJSON = (obj) => {
  if (obj === null || obj === undefined) return null;
  try {
    return JSON.stringify(obj);
  } catch {
    return null;
  }
};

const generateAccessToken = (userId, expiresIn = '7d') => {
  return uuidv4() + uuidv4();
};

module.exports = {
  generateId,
  generateOrderNo,
  formatDateTime,
  parseJSON,
  stringifyJSON,
  generateAccessToken,
};
