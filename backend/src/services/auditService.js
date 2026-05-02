const prisma = require('../prisma');

class AuditService {
  static async createLog({
    action,
    tableName,
    recordId,
    oldValues = null,
    newValues = null,
    operatorId = null,
    operatorName = null,
    remark = null
  }) {
    try {
      return await prisma.auditLog.create({
        data: {
          action,
          tableName,
          recordId,
          oldValues,
          newValues,
          operatorId,
          operatorName,
          remark
        }
      });
    } catch (error) {
      console.error('Audit log creation error:', error);
    }
  }

  static async getLogsByRecord(tableName, recordId) {
    return await prisma.auditLog.findMany({
      where: {
        tableName,
        recordId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  static async getLogsByDateRange(startDate, endDate, tableName = null) {
    const where = {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    };

    if (tableName) {
      where.tableName = tableName;
    }

    return await prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}

module.exports = AuditService;
