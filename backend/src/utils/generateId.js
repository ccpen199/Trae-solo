const { v4: uuidv4 } = require('uuid');

const generateTransactionId = () => {
  const date = new Date();
  const prefix = 'TXN';
  const timestamp = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

const generateAlertId = () => {
  const date = new Date();
  const prefix = 'ALT';
  const timestamp = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

const generateWorkOrderId = () => {
  const date = new Date();
  const prefix = 'WO';
  const timestamp = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

const generateOTAId = () => {
  const date = new Date();
  const prefix = 'OTA';
  const timestamp = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

const generateEnergyRecordId = () => {
  const date = new Date();
  const prefix = 'ENG';
  const timestamp = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

const generateUUID = () => {
  return uuidv4();
};

const generateCardNumber = () => {
  const prefix = '6222';
  const random1 = Math.floor(Math.random() * 9000 + 1000);
  const random2 = Math.floor(Math.random() * 9000 + 1000);
  const random3 = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}${random1}${random2}${random3}`;
};

const generateDeviceId = () => {
  const prefix = 'DEV';
  const random = Math.floor(Math.random() * 900000 + 100000);
  return `${prefix}${random}`;
};

module.exports = {
  generateTransactionId,
  generateAlertId,
  generateWorkOrderId,
  generateOTAId,
  generateEnergyRecordId,
  generateUUID,
  generateCardNumber,
  generateDeviceId
};
