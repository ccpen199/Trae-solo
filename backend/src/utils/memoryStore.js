const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const SALT_ROUNDS = 10;

let users = [];
let roles = [];
let organizations = [];
let permissions = [];
let resources = [];
let operations = [];
let userRoles = [];
let rolePermissions = [];
let roleResources = [];
let roleOperations = [];
let auditLogs = [];
let ipBlacklist = [];

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function initMemoryStore() {
  const hashedAdminPassword = await hashPassword('admin123');
  const hashedUserPassword = await hashPassword('123456');
  
  roles = [
    {
      id: 'role-sys-admin',
      name: '系统管理员',
      code: 'SYS_ADMIN',
      description: '系统最高权限管理员',
      parentId: null,
      sortOrder: 0,
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    },
    {
      id: 'role-admin',
      name: '管理员',
      code: 'ADMIN',
      description: '普通管理员',
      parentId: 'role-sys-admin',
      sortOrder: 1,
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    },
    {
      id: 'role-user',
      name: '普通用户',
      code: 'USER',
      description: '普通用户角色',
      parentId: 'role-admin',
      sortOrder: 2,
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    }
  ];
  
  organizations = [
    {
      id: 'org-headquarters',
      orgNo: 'ORG001',
      name: '总公司',
      parentId: null,
      description: '总部组织',
      sortOrder: 0,
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    },
    {
      id: 'org-it',
      orgNo: 'ORG002',
      name: '技术部',
      parentId: 'org-headquarters',
      description: '技术部门',
      sortOrder: 1,
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    }
  ];
  
  users = [
    {
      id: 'user-admin',
      userNo: 'U001',
      username: 'admin',
      password: hashedAdminPassword,
      name: '系统管理员',
      email: 'admin@example.com',
      phone: '13800138000',
      avatar: null,
      status: 1,
      orgId: 'org-headquarters',
      lastLoginAt: null,
      lastLoginIp: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    },
    {
      id: 'user-test',
      userNo: 'U002',
      username: 'test',
      password: hashedUserPassword,
      name: '测试用户',
      email: 'test@example.com',
      phone: '13800138001',
      avatar: null,
      status: 1,
      orgId: 'org-it',
      lastLoginAt: null,
      lastLoginIp: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    }
  ];
  
  userRoles = [
    { id: 'ur-1', userId: 'user-admin', roleId: 'role-sys-admin', createdAt: new Date() },
    { id: 'ur-2', userId: 'user-test', roleId: 'role-user', createdAt: new Date() }
  ];
  
  console.log('=========================================');
  console.log('  内存数据存储已初始化');
  console.log('  默认账户:');
  console.log('  管理员: admin / admin123');
  console.log('  测试用户: test / 123456');
  console.log('=========================================');
}

function getUserByUsername(username) {
  const user = users.find(u => u.username === username && u.deletedAt === null);
  if (!user) return null;
  
  const org = organizations.find(o => o.id === user.orgId) || null;
  const urList = userRoles.filter(ur => ur.userId === user.id);
  const userRoleList = urList.map(ur => {
    const role = roles.find(r => r.id === ur.roleId);
    return {
      id: ur.id,
      userId: ur.userId,
      roleId: ur.roleId,
      role: role || null
    };
  }).filter(ur => ur.role && ur.role.deletedAt === null);
  
  return {
    ...user,
    org,
    userRoles: userRoleList
  };
}

function getUserById(id) {
  const user = users.find(u => u.id === id && u.deletedAt === null);
  if (!user) return null;
  
  const org = organizations.find(o => o.id === user.orgId) || null;
  const urList = userRoles.filter(ur => ur.userId === user.id);
  const userRoleList = urList.map(ur => {
    const role = roles.find(r => r.id === ur.roleId);
    return {
      id: ur.id,
      userId: ur.userId,
      roleId: ur.roleId,
      role: role || null
    };
  }).filter(ur => ur.role && ur.role.deletedAt === null);
  
  return {
    ...user,
    org,
    userRoles: userRoleList
  };
}

function getUserList({ page = 1, pageSize = 10, keyword, userNo, username, name, orgId, status }) {
  let filteredUsers = users.filter(u => u.deletedAt === null);
  
  if (keyword) {
    filteredUsers = filteredUsers.filter(u => 
      u.userNo.includes(keyword) ||
      u.username.includes(keyword) ||
      u.name.includes(keyword)
    );
  }
  if (userNo) {
    filteredUsers = filteredUsers.filter(u => u.userNo.includes(userNo));
  }
  if (username) {
    filteredUsers = filteredUsers.filter(u => u.username.includes(username));
  }
  if (name) {
    filteredUsers = filteredUsers.filter(u => u.name.includes(name));
  }
  if (orgId) {
    filteredUsers = filteredUsers.filter(u => u.orgId === orgId);
  }
  if (status !== undefined && status !== null) {
    filteredUsers = filteredUsers.filter(u => u.status === parseInt(status));
  }
  
  const total = filteredUsers.length;
  const skip = (page - 1) * pageSize;
  const list = filteredUsers.slice(skip, skip + pageSize).map(u => {
    const org = organizations.find(o => o.id === u.orgId) || null;
    const urList = userRoles.filter(ur => ur.userId === u.id);
    const rolesList = urList.map(ur => {
      const role = roles.find(r => r.id === ur.roleId);
      return role ? { id: role.id, name: role.name, code: role.code } : null;
    }).filter(Boolean);
    
    return {
      ...u,
      password: undefined,
      org,
      roles: rolesList
    };
  });
  
  return {
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

async function createUser({ userNo, username, password, name, email, phone, avatar, status = 1, orgId, roleIds }) {
  const existingUser = users.find(u => 
    (u.username === username || u.userNo === userNo) && u.deletedAt === null
  );
  
  if (existingUser) {
    return { success: false, message: existingUser.username === username ? '用户名已存在' : '用户编号已存在' };
  }
  
  const hashedPassword = await hashPassword(password);
  const newUser = {
    id: uuidv4(),
    userNo,
    username,
    password: hashedPassword,
    name,
    email: email || null,
    phone: phone || null,
    avatar: avatar || null,
    status,
    orgId: orgId || null,
    lastLoginAt: null,
    lastLoginIp: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null
  };
  
  users.push(newUser);
  
  if (roleIds && roleIds.length > 0) {
    roleIds.forEach(roleId => {
      const existing = userRoles.find(ur => ur.userId === newUser.id && ur.roleId === roleId);
      if (!existing) {
        userRoles.push({
          id: uuidv4(),
          userId: newUser.id,
          roleId,
          createdAt: new Date()
        });
      }
    });
  }
  
  return { success: true, data: { ...newUser, password: undefined } };
}

async function updateUser(id, { userNo, username, password, name, email, phone, avatar, status, orgId, roleIds }) {
  const userIndex = users.findIndex(u => u.id === id && u.deletedAt === null);
  
  if (userIndex === -1) {
    return { success: false, message: '用户不存在' };
  }
  
  const existingUser = users.find(u => 
    u.id !== id && 
    (u.username === username || u.userNo === userNo) && 
    u.deletedAt === null
  );
  
  if (existingUser) {
    return { success: false, message: existingUser.username === username ? '用户名已存在' : '用户编号已存在' };
  }
  
  if (userNo !== undefined) users[userIndex].userNo = userNo;
  if (username !== undefined) users[userIndex].username = username;
  if (name !== undefined) users[userIndex].name = name;
  if (email !== undefined) users[userIndex].email = email;
  if (phone !== undefined) users[userIndex].phone = phone;
  if (avatar !== undefined) users[userIndex].avatar = avatar;
  if (status !== undefined) users[userIndex].status = status;
  if (orgId !== undefined) users[userIndex].orgId = orgId;
  users[userIndex].updatedAt = new Date();
  
  if (password) {
    users[userIndex].password = await hashPassword(password);
  }
  
  if (roleIds !== undefined) {
    userRoles = userRoles.filter(ur => ur.userId !== id);
    if (roleIds.length > 0) {
      roleIds.forEach(roleId => {
        userRoles.push({
          id: uuidv4(),
          userId: id,
          roleId,
          createdAt: new Date()
        });
      });
    }
  }
  
  return { success: true, data: { ...users[userIndex], password: undefined } };
}

function deleteUser(id) {
  const userIndex = users.findIndex(u => u.id === id && u.deletedAt === null);
  
  if (userIndex === -1) {
    return { success: false, message: '用户不存在' };
  }
  
  users[userIndex].deletedAt = new Date();
  userRoles = userRoles.filter(ur => ur.userId !== id);
  
  return { success: true };
}

async function resetUserPassword(id, newPassword) {
  const userIndex = users.findIndex(u => u.id === id && u.deletedAt === null);
  
  if (userIndex === -1) {
    return { success: false, message: '用户不存在' };
  }
  
  users[userIndex].password = await hashPassword(newPassword);
  users[userIndex].updatedAt = new Date();
  
  return { success: true };
}

function updateLastLogin(id, ip) {
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex !== -1) {
    users[userIndex].lastLoginAt = new Date();
    users[userIndex].lastLoginIp = ip;
  }
}

function checkIPBlacklist(ip) {
  const entry = ipBlacklist.find(e => 
    e.ip === ip && 
    (!e.expiresAt || e.expiresAt > new Date())
  );
  return entry !== undefined;
}

function addAuditLog({ userId, username, action, module, ip, userAgent, requestData, responseData, status = 1, message }) {
  auditLogs.push({
    id: uuidv4(),
    userId: userId || null,
    username: username || null,
    action,
    module,
    ip: ip || null,
    userAgent: userAgent || null,
    requestData: requestData ? JSON.stringify(requestData) : null,
    responseData: responseData ? JSON.stringify(responseData) : null,
    status,
    message: message || null,
    createdAt: new Date()
  });
}

function getAllRoles() {
  return roles.filter(r => r.deletedAt === null);
}

module.exports = {
  initMemoryStore,
  hashPassword,
  getUserByUsername,
  getUserById,
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  updateLastLogin,
  checkIPBlacklist,
  addAuditLog,
  getAllRoles
};
