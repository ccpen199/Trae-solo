const db = require('../config/database');

const generateOrderNo = (prefix = 'ORD') => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000) + 1000;
  
  return `${prefix}${year}${month}${day}${hour}${minute}${second}${random}`;
};

const generateCustomerNo = () => {
  return generateOrderNo('CUS');
};

const generateProductNo = () => {
  return generateOrderNo('PROD');
};

const generateDepositNo = () => {
  return generateOrderNo('DEP');
};

const generateStockInNo = () => {
  return generateOrderNo('SI');
};

const generateStockOutNo = () => {
  return generateOrderNo('SO');
};

const generateReturnNo = () => {
  return generateOrderNo('RET');
};

const generateCheckNo = () => {
  return generateOrderNo('CK');
};

module.exports = {
  generateOrderNo,
  generateCustomerNo,
  generateProductNo,
  generateDepositNo,
  generateStockInNo,
  generateStockOutNo,
  generateReturnNo,
  generateCheckNo
};
