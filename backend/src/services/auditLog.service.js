const memoryStore = require('../utils/memoryStore');
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

const AuditLogService = {
  checkPrismaAvailable,
  
  async log({ userId, username, action, module, ip, userAgent, requestData, responseData, status = 1, message }) {
    try {
      if (useMemoryMode) {
        memoryStore.addAuditLog({ userId, username, action, module, ip, userAgent, requestData, responseData, status, message });
        return;
      }
      
      const prisma = require('../utils/prisma');
      await prisma.auditLog.create({
        data: {
          userId,
          username,
          action,
          module,
          ip,
          userAgent,
          requestData: requestData ? JSON.stringify(requestData) : null,
          responseData: responseData ? JSON.stringify(responseData) : null,
          status,
          message
        }
      });
    } catch (err) {
      logger.error('保存审计日志失败:', err.message);
    }
  },
  
  async getList({ page = 1, pageSize = 10, userId, username, module, action, status, startDate, endDate }) {
    const skip = (page - 1) * pageSize;
    
    const where = { deletedAt: null };
    
    if (userId) {
      where.userId = userId;
    }
    if (username) {
      where.username = { contains: username };
    }
    if (module) {
      where.module = { contains: module };
    }
    if (action) {
      where.action = { contains: action };
    }
    if (status !== undefined && status !== null) {
      where.status = parseInt(status);
    }
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate + ' 23:59:59')
      };
    }
    
    if (useMemoryMode) {
      const auditLogs = require('../utils/memoryStore').auditLogs || [];
      let filtered = [...auditLogs];
      
      return {
        list: filtered.slice(skip, skip + pageSize),
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize)
      };
    }
    
    const prisma = require('../utils/prisma');
    const [total, list] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      })
    ]);
    
    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  },
  
  async getById(id) {
    if (useMemoryMode) {
      const auditLogs = require('../utils/memoryStore').auditLogs || [];
      return auditLogs.find(log => log.id === id) || null;
    }
    
    const prisma = require('../utils/prisma');
    return prisma.auditLog.findUnique({
      where: { id }
    });
  }
};

module.exports = AuditLogService;
