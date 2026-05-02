const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const generateId = () => uuidv4();

const generateOrderNo = () => {
  const date = moment().format('YYYYMMDD');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `ORD${date}${random}`;
};

const generateDispatchNo = () => {
  const date = moment().format('YYYYMMDD');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `DSP${date}${random}`;
};

const generateRepairNo = () => {
  const date = moment().format('YYYYMMDD');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `RPR${date}${random}`;
};

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const calculateFee = (durationMinutes, distanceKm) => {
  const baseFee = 1.5;
  const perMinuteRate = 0.05;
  const perKmRate = 0.3;
  
  let total = baseFee;
  if (durationMinutes > 30) {
    total += (durationMinutes - 30) * perMinuteRate;
  }
  total += distanceKm * perKmRate;
  
  return Math.round(total * 100) / 100;
};

const getOrderStatusActions = (status, userRole) => {
  const actions = {
    pending_scan: {
      rider: ['scan_unlock'],
      default: []
    },
    pending_ride: {
      rider: ['start_ride', 'cancel'],
      default: []
    },
    riding: {
      rider: ['end_ride', 'report_exception'],
      default: []
    },
    pending_billing: {
      rider: ['confirm_billing', 'dispute'],
      default: []
    },
    billing_confirmed: {
      rider: ['pay'],
      default: []
    },
    pending_exception: {
      rider: [],
      service: ['approve', 'reject', 'request_more_info', 'reassign'],
      default: []
    },
    pending_dispatch: {
      dispatcher: ['assign_operator', 'reassign'],
      maintainer: ['accept', 'start_repair', 'complete'],
      default: []
    },
    completed: {
      default: ['view_history']
    },
    cancelled: {
      default: ['view_history']
    }
  };
  
  const statusActions = actions[status] || actions[status.toLowerCase()];
  if (!statusActions) return [];
  
  return statusActions[userRole] || statusActions.default || [];
};

const getNextStatus = (currentStatus, action) => {
  const statusTransitions = {
    pending_scan: {
      scan_unlock: 'pending_ride'
    },
    pending_ride: {
      start_ride: 'riding',
      cancel: 'cancelled'
    },
    riding: {
      end_ride: 'pending_billing',
      report_exception: 'pending_exception'
    },
    pending_billing: {
      confirm_billing: 'billing_confirmed',
      dispute: 'pending_exception'
    },
    billing_confirmed: {
      pay: 'completed'
    },
    pending_exception: {
      approve: 'pending_dispatch',
      reject: 'riding',
      request_more_info: 'pending_exception',
      reassign: 'pending_exception'
    },
    pending_dispatch: {
      assign_operator: 'pending_dispatch',
      accept: 'pending_dispatch',
      start_repair: 'pending_dispatch',
      complete: 'completed'
    }
  };
  
  const transitions = statusTransitions[currentStatus];
  if (!transitions) return null;
  
  return transitions[action] || null;
};

module.exports = {
  generateId,
  generateOrderNo,
  generateDispatchNo,
  generateRepairNo,
  calculateDistance,
  calculateFee,
  getOrderStatusActions,
  getNextStatus
};
