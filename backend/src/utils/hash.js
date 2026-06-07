const crypto = require('crypto');

const generateHash = (content) => {
  return crypto.createHash('sha256').update(content).digest('hex');
};

const generateOrderNo = () => {
  const date = new Date();
  const timestamp = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${timestamp}${random}`;
};

const generateTraceCode = (prefix) => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix || 'P'}-${timestamp}-${random}`;
};

module.exports = {
  generateHash,
  generateOrderNo,
  generateTraceCode
};
