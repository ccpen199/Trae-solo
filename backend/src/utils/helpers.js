const { v4: uuidv4 } = require('uuid');

const generateOrderNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BO${year}${month}${day}${random}`;
};

const generateDetailNo = (mainOrderNo, index) => {
  return `${mainOrderNo}-${String(index + 1).padStart(3, '0')}`;
};

const generateBillNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BL${year}${month}${day}${random}`;
};

const generateContainerNo = (prefix = 'MSKU') => {
  const numbers = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  const checkDigit = Math.floor(Math.random() * 10);
  return `${prefix}${numbers}${checkDigit}`;
};

const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

const formatDateTime = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().replace('T', ' ').substring(0, 19);
};

const validateContainerNo = (containerNo) => {
  if (!containerNo || containerNo.length < 11) return false;
  const pattern = /^[A-Z]{4}\d{7}$/;
  return pattern.test(containerNo);
};

const calculateCheckDigit = (containerNo) => {
  if (!containerNo || containerNo.length < 10) return null;
  
  const letters = containerNo.substring(0, 4);
  const numbers = containerNo.substring(4, 10);
  
  const letterValues = {
    A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19,
    J: 20, K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29,
    S: 30, T: 31, U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38
  };
  
  let sum = 0;
  for (let i = 0; i < 4; i++) {
    const value = letterValues[letters[i]] || 0;
    sum += value * Math.pow(2, i);
  }
  
  for (let i = 0; i < 6; i++) {
    const value = parseInt(numbers[i], 10) || 0;
    sum += value * Math.pow(2, i + 4);
  }
  
  const checkDigit = sum % 11;
  return checkDigit === 10 ? 0 : checkDigit;
};

const validateContainerCheckDigit = (containerNo) => {
  if (!containerNo || containerNo.length < 11) return false;
  const calculated = calculateCheckDigit(containerNo);
  const actual = parseInt(containerNo[10], 10);
  return calculated === actual;
};

const generateUUID = () => {
  return uuidv4();
};

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const snakeToCamel = (str) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

const camelToSnake = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

const convertKeysToCamel = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysToCamel(item));
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = snakeToCamel(key);
      result[camelKey] = convertKeysToCamel(obj[key]);
      return result;
    }, {});
  }
  return obj;
};

const statusToUpperCase = (status) => {
  if (!status) return status;
  return status.toUpperCase().replace(/_+/g, '_');
};

const convertStatusesToUpperCase = (bookings) => {
  if (Array.isArray(bookings)) {
    return bookings.map(booking => {
      if (booking && booking.status) {
        return { ...booking, status: statusToUpperCase(booking.status) };
      }
      return booking;
    });
  }
  if (bookings && bookings.status) {
    return { ...bookings, status: statusToUpperCase(bookings.status) };
  }
  return bookings;
};

const FIELD_MAPPING = {
  mainOrderNo: 'mainNo',
  consignorName: 'shipperName',
  departurePort: 'pol',
  arrivalPort: 'pod',
  expectedDepartureDate: 'expectedDepartureDate',
  expectedArrivalDate: 'expectedArrivalDate',
  deadline: 'expectedCompleteTime',
  responsiblePerson: 'responsiblePerson',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  cargoName: 'cargoName',
  cargoWeight: 'cargoWeight',
  cargoVolume: 'cargoVolume',
  containerCount: 'containerCount',
  containerType: 'containerType',
  status: 'status',
  statusLabel: 'statusLabel',
  id: 'id',
  vesselName: 'vesselName',
  voyageNumber: 'voyageNumber',
  consignorId: 'consignorId',
  forwarderId: 'forwarderId',
  shippingCompanyId: 'shippingCompanyId',
  scheduleId: 'scheduleId',
  scheduleDepartureDate: 'scheduleDepartureDate',
  scheduleArrivalDate: 'scheduleArrivalDate',
  remark: 'remark',
  forwarderName: 'forwarderName',
  shippingCompanyName: 'shippingCompanyName',
  creatorName: 'creatorName',
};

const mapFields = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => mapFields(item));
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const newKey = FIELD_MAPPING[key] || key;
      result[newKey] = mapFields(obj[key]);
      return result;
    }, {});
  }
  return obj;
};

const transformBooking = (booking) => {
  if (!booking) return booking;
  let result = convertKeysToCamel(booking);
  result = mapFields(result);
  if (result.status) {
    result.status = statusToUpperCase(result.status);
  }
  return result;
};

const transformBookings = (bookings) => {
  if (Array.isArray(bookings)) {
    return bookings.map(booking => transformBooking(booking));
  }
  return transformBooking(bookings);
};

module.exports = {
  generateOrderNo,
  generateDetailNo,
  generateBillNo,
  generateContainerNo,
  formatDate,
  formatDateTime,
  validateContainerNo,
  calculateCheckDigit,
  validateContainerCheckDigit,
  generateUUID,
  sleep,
  snakeToCamel,
  camelToSnake,
  convertKeysToCamel,
  statusToUpperCase,
  convertStatusesToUpperCase,
  mapFields,
  transformBooking,
  transformBookings,
};
