const dayjs = require('dayjs');

const generateOrderNo = () => {
  const prefix = 'AR';
  const dateStr = dayjs().format('YYYYMMDDHHmmss');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${random}`;
};

const generateId = (prefix) => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}${random}`;
};

module.exports = {
  generateOrderNo,
  generateId
};
