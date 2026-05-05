import prisma from '../prisma/client.js';
import logger from '../utils/logger.js';

class RecordService {
  async createRecord(data) {
    try {
      const record = await prisma.userRecord.create({
        data: {
          channelCode: data.channelCode,
          productId: data.productId,
          phonePlain: data.phonePlain,
          phoneMd5: data.phoneMd5,
          accessResult: data.accessResult,
          accessCode: data.accessCode,
          collisionResult: data.collisionResult,
          collisionCode: data.collisionCode,
          registerResult: data.registerResult,
          registerCode: data.registerCode,
          returnCode: data.returnCode,
          returnMessage: data.returnMessage,
          isOldUser: data.isOldUser,
          downloadUrl: data.downloadUrl
        }
      });
      logger.info(`Created record for phoneMd5: ${data.phoneMd5}`);
      return record;
    } catch (error) {
      logger.error(`Failed to create record: ${error.message}`);
      throw error;
    }
  }

  async getRecords(filters = {}, options = {}) {
    const { page = 1, pageSize = 20, orderBy = 'createdAt', order = 'desc' } = options;
    
    const where = {};
    if (filters.channelCode) {
      where.channelCode = filters.channelCode;
    }
    if (filters.phoneMd5) {
      where.phoneMd5 = filters.phoneMd5;
    }
    if (filters.returnCode) {
      where.returnCode = parseInt(filters.returnCode);
    }
    if (filters.startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };
    }

    const total = await prisma.userRecord.count({ where });
    
    const records = await prisma.userRecord.findMany({
      where,
      orderBy: { [orderBy]: order },
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize)
    });

    return {
      records,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / pageSize)
    };
  }

  async getRecordById(id) {
    return await prisma.userRecord.findUnique({
      where: { id }
    });
  }

  async getStats(startDate, endDate) {
    const where = {};
    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    const total = await prisma.userRecord.count({ where });
    
    const successCount = await prisma.userRecord.count({
      where: { ...where, returnCode: 200 }
    });

    const oldUserCount = await prisma.userRecord.count({
      where: { ...where, isOldUser: true }
    });

    const newUserCount = await prisma.userRecord.count({
      where: { ...where, isOldUser: false }
    });

    return {
      total,
      successCount,
      oldUserCount,
      newUserCount,
      rejectCount: total - successCount
    };
  }
}

export default new RecordService();
