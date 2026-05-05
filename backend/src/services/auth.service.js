const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
const memoryStore = require('../utils/memoryStore');

let useMemoryMode = true;

async function checkPrismaAvailable() {
  try {
    const prisma = require('../utils/prisma');
    await prisma.$queryRaw`SELECT 1`;
    useMemoryMode = false;
    logger.info('Prisma database connected, using database mode');
    return true;
  } catch (err) {
    logger.warn('Prisma database not available, using memory mode');
    useMemoryMode = true;
    await memoryStore.initMemoryStore();
    return false;
  }
}

const AuthService = {
  checkPrismaAvailable,
  
  async login({ username, password, ip, userAgent }) {
    if (useMemoryMode) {
      return this.loginMemory({ username, password, ip });
    }
    
    const prisma = require('../utils/prisma');
    const user = await prisma.user.findUnique({
      where: { username, deletedAt: null },
      include: {
        org: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePerms: { include: { permission: true } },
                roleResources: { include: { resource: true } },
                roleOperations: { include: { operation: true } }
              }
            }
          }
        }
      }
    });
    
    if (!user) {
      return { success: false, message: '用户名或密码错误' };
    }
    
    if (user.status !== 1) {
      return { success: false, message: '用户已被禁用' };
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { success: false, message: '用户名或密码错误' };
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip
      }
    });
    
    const token = jwt.sign(
      {
        id: user.id,
        userNo: user.userNo,
        username: user.username,
        name: user.name
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    const permissions = this.extractPermissions(user);
    const resources = this.extractResources(user);
    const operations = this.extractOperations(user);
    
    return {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          userNo: user.userNo,
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          org: user.org ? { id: user.org.id, name: user.org.name, orgNo: user.org.orgNo } : null,
          roles: user.userRoles.map(ur => ({
            id: ur.role.id,
            name: ur.role.name,
            code: ur.role.code
          }))
        },
        permissions,
        resources,
        operations
      }
    };
  },
  
  async loginMemory({ username, password, ip }) {
    const user = memoryStore.getUserByUsername(username);
    
    if (!user) {
      return { success: false, message: '用户名或密码错误' };
    }
    
    if (user.status !== 1) {
      return { success: false, message: '用户已被禁用' };
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { success: false, message: '用户名或密码错误' };
    }
    
    memoryStore.updateLastLogin(user.id, ip);
    
    const token = jwt.sign(
      {
        id: user.id,
        userNo: user.userNo,
        username: user.username,
        name: user.name
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    const roles = user.userRoles?.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      code: ur.role.code
    })) || [];
    
    return {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          userNo: user.userNo,
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          org: user.org ? { id: user.org.id, name: user.org.name, orgNo: user.org.orgNo } : null,
          roles
        },
        permissions: [],
        resources: [],
        operations: []
      }
    };
  },
  
  extractPermissions(user) {
    const perms = new Set();
    user.userRoles.forEach(ur => {
      ur.role.rolePerms.forEach(rp => {
        if (rp.permission.status === 1) {
          perms.add(rp.permission.code);
        }
      });
    });
    return Array.from(perms);
  },
  
  extractResources(user) {
    const resources = new Set();
    user.userRoles.forEach(ur => {
      ur.role.roleResources.forEach(rr => {
        if (rr.resource.status === 1) {
          resources.add(rr.resource.path);
        }
      });
    });
    return Array.from(resources);
  },
  
  extractOperations(user) {
    const operations = new Set();
    user.userRoles.forEach(ur => {
      ur.role.roleOperations.forEach(ro => {
        if (ro.operation.status === 1) {
          operations.add(ro.operation.code);
        }
      });
    });
    return Array.from(operations);
  },
  
  async getUserInfo(userId) {
    if (useMemoryMode) {
      return this.getUserInfoMemory(userId);
    }
    
    const prisma = require('../utils/prisma');
    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        org: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePerms: { include: { permission: true } },
                roleResources: { include: { resource: true } },
                roleOperations: { include: { operation: true } }
              }
            }
          }
        }
      }
    });
    
    if (!user) {
      return null;
    }
    
    const permissions = this.extractPermissions(user);
    const resources = this.extractResources(user);
    const operations = this.extractOperations(user);
    
    return {
      user: {
        id: user.id,
        userNo: user.userNo,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        org: user.org ? { id: user.org.id, name: user.org.name, orgNo: user.org.orgNo } : null,
        roles: user.userRoles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          code: ur.role.code
        }))
      },
      permissions,
      resources,
      operations
    };
  },
  
  async getUserInfoMemory(userId) {
    const user = memoryStore.getUserById(userId);
    
    if (!user) {
      return null;
    }
    
    const roles = user.userRoles?.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      code: ur.role.code
    })) || [];
    
    return {
      user: {
        id: user.id,
        userNo: user.userNo,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        org: user.org ? { id: user.org.id, name: user.org.name, orgNo: user.org.orgNo } : null,
        roles
      },
      permissions: [],
      resources: [],
      operations: []
    };
  },
  
  async hashPassword(password) {
    return bcrypt.hash(password, config.bcrypt.saltRounds);
  }
};

module.exports = AuthService;
