const { v4: uuidv4 } = require('uuid');

const generateId = () => {
  return uuidv4();
};

const generatePlanNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `VP${year}${month}${day}${random}`;
};

const generateTaskNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TK${year}${month}${day}${random}`;
};

const generateAppointmentNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `GA${year}${month}${day}${random}`;
};

const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

const getCurrentTime = () => {
  return formatDate(new Date());
};

const validateContainerNo = (containerNo) => {
  if (!containerNo || containerNo.length < 11) {
    return { valid: false, message: '箱号长度不足11位' };
  }
  const ownerCode = containerNo.slice(0, 4);
  if (!/^[A-Z]{4}$/.test(ownerCode)) {
    return { valid: false, message: '箱号前缀必须是4位大写字母' };
  }
  const serialNo = containerNo.slice(4, 10);
  if (!/^\d{6}$/.test(serialNo)) {
    return { valid: false, message: '箱号序列号必须是6位数字' };
  }
  const checkDigit = containerNo.slice(10, 11);
  if (!/^\d$/.test(checkDigit)) {
    return { valid: false, message: '校验码必须是数字' };
  }
  return { valid: true };
};

const getNextStatus = (currentStatus, action) => {
  const statusFlow = {
    'DRAFT': {
      'SUBMIT': 'PENDING_APPROVAL',
      'SAVE': 'DRAFT'
    },
    'PENDING_APPROVAL': {
      'APPROVE': 'APPROVED',
      'REJECT': 'REJECTED',
      'REQUEST_SUPPLEMENT': 'PENDING_SUPPLEMENT'
    },
    'PENDING_SUPPLEMENT': {
      'SUBMIT_SUPPLEMENT': 'PENDING_APPROVAL'
    },
    'APPROVED': {
      'START': 'IN_PROGRESS'
    },
    'IN_PROGRESS': {
      'COMPLETE': 'COMPLETED',
      'REASSIGN': 'IN_PROGRESS'
    },
    'COMPLETED': {
      'RELEASE': 'RELEASED'
    }
  };

  if (statusFlow[currentStatus] && statusFlow[currentStatus][action]) {
    return statusFlow[currentStatus][action];
  }
  return null;
};

const getAvailableActions = (status, userRole) => {
  const roleActions = {
    'DISPATCHER': {
      'DRAFT': ['SUBMIT', 'SAVE'],
      'PENDING_APPROVAL': ['VIEW'],
      'REJECTED': ['RESUBMIT', 'VIEW'],
      'PENDING_SUPPLEMENT': ['SUBMIT_SUPPLEMENT', 'VIEW'],
      'APPROVED': ['START', 'VIEW'],
      'IN_PROGRESS': ['VIEW'],
      'COMPLETED': ['VIEW'],
      'RELEASED': ['VIEW']
    },
    'YARD_WORKER': {
      'DRAFT': ['VIEW'],
      'PENDING_APPROVAL': ['VIEW'],
      'APPROVED': ['VIEW'],
      'IN_PROGRESS': ['COMPLETE', 'REASSIGN', 'VIEW'],
      'COMPLETED': ['VIEW'],
      'RELEASED': ['VIEW']
    },
    'ADMIN': {
      'DRAFT': ['VIEW'],
      'PENDING_APPROVAL': ['APPROVE', 'REJECT', 'REQUEST_SUPPLEMENT', 'VIEW'],
      'REJECTED': ['VIEW'],
      'PENDING_SUPPLEMENT': ['VIEW'],
      'APPROVED': ['VIEW'],
      'IN_PROGRESS': ['VIEW'],
      'COMPLETED': ['RELEASE', 'VIEW'],
      'RELEASED': ['VIEW']
    }
  };

  const actions = roleActions[userRole]?.[status] || ['VIEW'];
  return actions;
};

module.exports = {
  generateId,
  generatePlanNo,
  generateTaskNo,
  generateAppointmentNo,
  formatDate,
  getCurrentTime,
  validateContainerNo,
  getNextStatus,
  getAvailableActions
};
