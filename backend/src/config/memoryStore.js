const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

const HOUSEHOLD_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MOVED: 'moved',
  DELETED: 'deleted'
};

const OPERATION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  MOVE_IN: 'move_in',
  MOVE_OUT: 'move_out',
  LOGIN: 'login',
  LOGOUT: 'logout',
  QUERY: 'query'
};

let users = new Map();
let households = new Map();
let operationLogs = [];

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const validatePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

const initDefaultData = async () => {
  const adminExists = Array.from(users.values()).find(u => u.username === 'admin');
  
  if (!adminExists) {
    const adminId = uuidv4();
    const hashedPassword = await hashPassword('admin123');
    
    users.set(adminId, {
      id: adminId,
      username: 'admin',
      password: hashedPassword,
      realName: '系统管理员',
      role: USER_ROLES.ADMIN,
      department: '系统管理部',
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log('默认管理员账户创建成功: 用户名 admin, 密码 admin123');
  }
};

const createUser = async (userData) => {
  const id = uuidv4();
  const hashedPassword = await hashPassword(userData.password);
  
  const user = {
    id,
    username: userData.username,
    password: hashedPassword,
    realName: userData.realName,
    role: userData.role || USER_ROLES.USER,
    department: userData.department || null,
    isActive: userData.isActive !== undefined ? userData.isActive : true,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  users.set(id, user);
  return { ...user, password: undefined };
};

const findUserByUsername = (username) => {
  return Array.from(users.values()).find(u => u.username === username);
};

const findUserById = (id) => {
  const user = users.get(id);
  return user ? { ...user, password: undefined } : null;
};

const updateUser = async (id, updateData) => {
  const user = users.get(id);
  if (!user) return null;
  
  if (updateData.realName !== undefined) user.realName = updateData.realName;
  if (updateData.role !== undefined) user.role = updateData.role;
  if (updateData.department !== undefined) user.department = updateData.department;
  if (updateData.isActive !== undefined) user.isActive = updateData.isActive;
  if (updateData.password) {
    user.password = await hashPassword(updateData.password);
  }
  
  user.updatedAt = new Date().toISOString();
  users.set(id, user);
  
  return { ...user, password: undefined };
};

const updateLastLogin = (id) => {
  const user = users.get(id);
  if (user) {
    user.lastLoginAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    users.set(id, user);
  }
};

const deleteUser = (id) => {
  return users.delete(id);
};

const getAllUsers = (params = {}) => {
  let result = Array.from(users.values());
  
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    result = result.filter(u => 
      u.username.toLowerCase().includes(keyword) ||
      u.realName.toLowerCase().includes(keyword)
    );
  }
  
  if (params.role) {
    result = result.filter(u => u.role === params.role);
  }
  
  if (params.isActive !== undefined) {
    result = result.filter(u => u.isActive === params.isActive);
  }
  
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const page = parseInt(params.page) || 1;
  const pageSize = parseInt(params.pageSize) || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  const paginatedResult = result.slice(start, end).map(u => ({ ...u, password: undefined }));
  
  return {
    users: paginatedResult,
    pagination: {
      total: result.length,
      page,
      pageSize,
      totalPages: Math.ceil(result.length / pageSize)
    }
  };
};

const createHousehold = (householdData) => {
  const existing = Array.from(households.values()).find(h => h.idCard === householdData.idCard);
  if (existing) {
    throw new Error('该身份证号已存在户籍记录');
  }
  
  const id = uuidv4();
  const household = {
    id,
    name: householdData.name,
    idCard: householdData.idCard,
    gender: householdData.gender,
    age: householdData.age,
    birthday: householdData.birthday || null,
    ethnicity: householdData.ethnicity || null,
    birthPlace: householdData.birthPlace || null,
    currentAddress: householdData.currentAddress,
    householdAddress: householdData.householdAddress,
    status: householdData.status || HOUSEHOLD_STATUS.ACTIVE,
    householdType: householdData.householdType || null,
    education: householdData.education || null,
    occupation: householdData.occupation || null,
    maritalStatus: householdData.maritalStatus || null,
    phone: householdData.phone || null,
    emergencyContact: householdData.emergencyContact || null,
    emergencyPhone: householdData.emergencyPhone || null,
    note: householdData.note || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  households.set(id, household);
  return household;
};

const findHouseholdById = (id) => {
  return households.get(id);
};

const findHouseholdByIdCard = (idCard) => {
  return Array.from(households.values()).find(h => h.idCard === idCard);
};

const updateHousehold = (id, updateData) => {
  const household = households.get(id);
  if (!household) return null;
  
  if (updateData.idCard && updateData.idCard !== household.idCard) {
    const existing = Array.from(households.values()).find(h => h.idCard === updateData.idCard && h.id !== id);
    if (existing) {
      throw new Error('该身份证号已存在其他户籍记录');
    }
  }
  
  const updatableFields = [
    'name', 'idCard', 'gender', 'age', 'birthday', 'ethnicity', 'birthPlace',
    'currentAddress', 'householdAddress', 'status', 'householdType', 'education',
    'occupation', 'maritalStatus', 'phone', 'emergencyContact', 'emergencyPhone', 'note'
  ];
  
  updatableFields.forEach(field => {
    if (updateData[field] !== undefined) {
      household[field] = updateData[field];
    }
  });
  
  household.updatedAt = new Date().toISOString();
  households.set(id, household);
  
  return household;
};

const getAllHouseholds = (params = {}) => {
  let result = Array.from(households.values());
  
  if (params.name) {
    const name = params.name.toLowerCase();
    result = result.filter(h => h.name.toLowerCase().includes(name));
  }
  
  if (params.idCard) {
    const idCard = params.idCard.toLowerCase();
    result = result.filter(h => h.idCard.toLowerCase().includes(idCard));
  }
  
  if (params.status) {
    result = result.filter(h => h.status === params.status);
  }
  
  if (params.currentAddress) {
    const address = params.currentAddress.toLowerCase();
    result = result.filter(h => h.currentAddress.toLowerCase().includes(address));
  }
  
  if (params.householdAddress) {
    const address = params.householdAddress.toLowerCase();
    result = result.filter(h => h.householdAddress.toLowerCase().includes(address));
  }
  
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const page = parseInt(params.page) || 1;
  const pageSize = parseInt(params.pageSize) || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  const paginatedResult = result.slice(start, end);
  
  return {
    households: paginatedResult,
    pagination: {
      total: result.length,
      page,
      pageSize,
      totalPages: Math.ceil(result.length / pageSize)
    }
  };
};

const searchHouseholds = (params = {}) => {
  const keyword = params.keyword?.toLowerCase() || '';
  const type = params.type || 'all';
  
  let result = Array.from(households.values());
  
  if (keyword) {
    if (type === 'name') {
      result = result.filter(h => h.name.toLowerCase().includes(keyword));
    } else if (type === 'idCard') {
      result = result.filter(h => h.idCard.toLowerCase().includes(keyword));
    } else {
      result = result.filter(h => 
        h.name.toLowerCase().includes(keyword) ||
        h.idCard.toLowerCase().includes(keyword)
      );
    }
  }
  
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return { households: result.slice(0, 50) };
};

const getHouseholdStatistics = () => {
  const all = Array.from(households.values());
  const active = all.filter(h => h.status === HOUSEHOLD_STATUS.ACTIVE).length;
  const moved = all.filter(h => h.status === HOUSEHOLD_STATUS.MOVED).length;
  const deleted = all.filter(h => h.status === HOUSEHOLD_STATUS.DELETED).length;
  const inactive = all.filter(h => h.status === HOUSEHOLD_STATUS.INACTIVE).length;
  
  return {
    statistics: {
      total: all.length,
      active,
      moved,
      deleted,
      inactive
    }
  };
};

const createOperationLog = (logData) => {
  const log = {
    id: uuidv4(),
    userId: logData.userId || null,
    username: logData.username,
    operationType: logData.operationType,
    targetType: logData.targetType || null,
    targetId: logData.targetId || null,
    targetName: logData.targetName || null,
    oldValue: logData.oldValue ? JSON.stringify(logData.oldValue) : null,
    newValue: logData.newValue ? JSON.stringify(logData.newValue) : null,
    description: logData.description || null,
    ipAddress: logData.ipAddress || null,
    userAgent: logData.userAgent || null,
    createdAt: new Date().toISOString()
  };
  
  operationLogs.unshift(log);
  
  if (operationLogs.length > 10000) {
    operationLogs = operationLogs.slice(0, 10000);
  }
  
  return log;
};

const getOperationLogs = (params = {}) => {
  let result = [...operationLogs];
  
  if (params.operationType) {
    result = result.filter(l => l.operationType === params.operationType);
  }
  
  if (params.username) {
    const username = params.username.toLowerCase();
    result = result.filter(l => l.username.toLowerCase().includes(username));
  }
  
  if (params.startDate) {
    const start = new Date(params.startDate);
    result = result.filter(l => new Date(l.createdAt) >= start);
  }
  
  if (params.endDate) {
    const end = new Date(params.endDate);
    result = result.filter(l => new Date(l.createdAt) <= end);
  }
  
  const page = parseInt(params.page) || 1;
  const pageSize = parseInt(params.pageSize) || 20;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  const paginatedResult = result.slice(start, end);
  
  return {
    logs: paginatedResult,
    pagination: {
      total: result.length,
      page,
      pageSize,
      totalPages: Math.ceil(result.length / pageSize)
    }
  };
};

module.exports = {
  USER_ROLES,
  HOUSEHOLD_STATUS,
  OPERATION_TYPES,
  
  initDefaultData,
  hashPassword,
  validatePassword,
  
  createUser,
  findUserByUsername,
  findUserById,
  updateUser,
  updateLastLogin,
  deleteUser,
  getAllUsers,
  
  createHousehold,
  findHouseholdById,
  findHouseholdByIdCard,
  updateHousehold,
  getAllHouseholds,
  searchHouseholds,
  getHouseholdStatistics,
  
  createOperationLog,
  getOperationLogs
};
