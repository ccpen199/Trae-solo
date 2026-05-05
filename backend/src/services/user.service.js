const memoryStore = require('../utils/memoryStore');
const AuthService = require('./auth.service');
const logger = require('../utils/logger');

let useMemoryMode = true;

async function checkPrismaAvailable() {
  try {
    const prisma = require('../utils/prisma');
    await prisma.$queryRaw`SELECT 1`;
    useMemoryMode = false;
    return true;
  } catch (err) {
    useMemoryMode = true;
    return false;
  }
}

const UserService = {
  checkPrismaAvailable,
  
  async create({ userNo, username, password, name, email, phone, avatar, status = 1, orgId, roleIds }) {
    if (useMemoryMode) {
      return memoryStore.createUser({ userNo, username, password, name, email, phone, avatar, status, orgId, roleIds });
    }
    
    const prisma = require('../utils/prisma');
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { userNo }
        ],
        deletedAt: null
      }
    });
    
    if (existingUser) {
      if (existingUser.username === username) {
        return { success: false, message: '用户名已存在' };
      }
      return { success: false, message: '用户编号已存在' };
    }
    
    const hashedPassword = await AuthService.hashPassword(password);
    
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          userNo,
          username,
          password: hashedPassword,
          name,
          email,
          phone,
          avatar,
          status,
          orgId
        }
      });
      
      if (roleIds && roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map(roleId => ({
            userId: newUser.id,
            roleId
          })),
          skipDuplicates: true
        });
      }
      
      return newUser;
    });
    
    return { success: true, data: user };
  },
  
  async update(id, { userNo, username, password, name, email, phone, avatar, status, orgId, roleIds }) {
    if (useMemoryMode) {
      return memoryStore.updateUser(id, { userNo, username, password, name, email, phone, avatar, status, orgId, roleIds });
    }
    
    const prisma = require('../utils/prisma');
    const existingUser = await prisma.user.findUnique({
      where: { id, deletedAt: null }
    });
    
    if (!existingUser) {
      return { success: false, message: '用户不存在' };
    }
    
    if (username || userNo) {
      const duplicateCheck = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { deletedAt: null },
            {
              OR: [
                username ? { username } : {},
                userNo ? { userNo } : {}
              ]
            }
          ]
        }
      });
      
      if (duplicateCheck) {
        if (duplicateCheck.username === username) {
          return { success: false, message: '用户名已存在' };
        }
        return { success: false, message: '用户编号已存在' };
      }
    }
    
    const updateData = {};
    if (userNo !== undefined) updateData.userNo = userNo;
    if (username !== undefined) updateData.username = username;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (status !== undefined) updateData.status = status;
    if (orgId !== undefined) updateData.orgId = orgId;
    
    if (password) {
      updateData.password = await AuthService.hashPassword(password);
    }
    
    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: updateData
      });
      
      if (roleIds !== undefined) {
        await tx.userRole.deleteMany({
          where: { userId: id }
        });
        
        if (roleIds.length > 0) {
          await tx.userRole.createMany({
            data: roleIds.map(roleId => ({
              userId: id,
              roleId
            })),
            skipDuplicates: true
          });
        }
      }
      
      return user;
    });
    
    return { success: true, data: updatedUser };
  },
  
  async delete(id) {
    if (useMemoryMode) {
      return memoryStore.deleteUser(id);
    }
    
    const prisma = require('../utils/prisma');
    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null }
    });
    
    if (!user) {
      return { success: false, message: '用户不存在' };
    }
    
    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: id } }),
      prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() }
      })
    ]);
    
    return { success: true };
  },
  
  async getById(id) {
    if (useMemoryMode) {
      return memoryStore.getUserById(id);
    }
    
    const prisma = require('../utils/prisma');
    return prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        org: true,
        userRoles: {
          include: { role: true }
        }
      }
    });
  },
  
  async getList({ page = 1, pageSize = 10, keyword, userNo, username, name, orgId, status }) {
    if (useMemoryMode) {
      return memoryStore.getUserList({ page, pageSize, keyword, userNo, username, name, orgId, status });
    }
    
    const prisma = require('../utils/prisma');
    const skip = (page - 1) * pageSize;
    
    const where = { deletedAt: null };
    
    if (keyword) {
      where.OR = [
        { userNo: { contains: keyword } },
        { username: { contains: keyword } },
        { name: { contains: keyword } }
      ];
    }
    if (userNo) {
      where.userNo = { contains: userNo };
    }
    if (username) {
      where.username = { contains: username };
    }
    if (name) {
      where.name = { contains: name };
    }
    if (orgId) {
      where.orgId = orgId;
    }
    if (status !== undefined && status !== null) {
      where.status = parseInt(status);
    }
    
    const [total, list] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          org: true,
          userRoles: {
            include: { role: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);
    
    return {
      list: list.map(user => ({
        ...user,
        password: undefined,
        roles: user.userRoles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          code: ur.role.code
        }))
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  },
  
  async batchDelete(ids) {
    if (useMemoryMode) {
      for (const id of ids) {
        memoryStore.deleteUser(id);
      }
      return { success: true };
    }
    
    const prisma = require('../utils/prisma');
    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: { in: ids } } }),
      prisma.user.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() }
      })
    ]);
    
    return { success: true };
  },
  
  async resetPassword(id, newPassword) {
    if (useMemoryMode) {
      return memoryStore.resetUserPassword(id, newPassword);
    }
    
    const prisma = require('../utils/prisma');
    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null }
    });
    
    if (!user) {
      return { success: false, message: '用户不存在' };
    }
    
    const hashedPassword = await AuthService.hashPassword(newPassword);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });
    
    return { success: true };
  }
};

module.exports = UserService;
