const { Barcode, CateringRecord, Department, TimeSlot, HandheldDevice, OperationLog, sequelize } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { redis } = require('../config/redis');
const { Op, Sequelize } = require('sequelize');
const dayjs = require('dayjs');

const validateBarcodeForCatering = async (barcode, deviceInfo) => {
  const errors = [];
  
  if (barcode.status !== 'active') {
    errors.push({ code: 'INVALID_STATUS', message: `条码状态无效：${barcode.status}` });
    return { valid: false, errors };
  }
  
  const now = dayjs();
  
  if (barcode.validFrom && now.isBefore(dayjs(barcode.validFrom))) {
    errors.push({ code: 'NOT_YET_VALID', message: '条码尚未生效' });
    return { valid: false, errors };
  }
  
  if (barcode.validTo && now.isAfter(dayjs(barcode.validTo))) {
    errors.push({ code: 'EXPIRED', message: '条码已过期' });
    return { valid: false, errors };
  }
  
  if (barcode.cateringCount >= barcode.maxCateringCount) {
    errors.push({ code: 'MAX_COUNT_EXCEEDED', message: `已达最大餐饮次数（${barcode.cateringCount}/${barcode.maxCateringCount}）` });
    return { valid: false, errors };
  }
  
  if (barcode.cateringTimeSlots && barcode.cateringTimeSlots.length > 0) {
    const currentTime = now.format('HH:mm:ss');
    const timeSlots = await TimeSlot.findAll({
      where: {
        id: { [Op.in]: barcode.cateringTimeSlots },
        status: true
      }
    });
    
    const inValidSlot = timeSlots.some(slot => {
      return currentTime >= slot.startTime && currentTime <= slot.endTime;
    });
    
    if (!inValidSlot) {
      errors.push({ code: 'OUT_OF_TIME_SLOT', message: '当前不在允许的餐饮时段内' });
      return { valid: false, errors };
    }
  }
  
  const lockKey = `catering:lock:${barcode.code}`;
  const locked = await redis.set(lockKey, Date.now().toString(), 'EX', 5, 'NX');
  
  if (!locked) {
    errors.push({ code: 'DUPLICATE_SCAN', message: '条码正在处理中，请稍候' });
    return { valid: false, errors };
  }
  
  return { valid: true, errors: [] };
};

const scanCatering = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { barcodeCode, deviceId, cateringType = 'lunch', amount = 0, quantity = 1, location, offlineSyncId } = req.body;
    
    if (!barcodeCode) {
      throw new AppError('条码编号不能为空', 400);
    }
    
    let device = null;
    if (deviceId) {
      device = await HandheldDevice.findOne({ where: { deviceId } }, { transaction });
    }
    
    const barcode = await Barcode.findOne({
      where: { code: barcodeCode },
      include: [{ model: Department, as: 'department' }],
      transaction
    });
    
    if (!barcode) {
      throw new AppError('条码不存在', 404);
    }
    
    const validation = await validateBarcodeForCatering(barcode, device);
    
    if (!validation.valid) {
      await transaction.rollback();
      return res.status(200).json({
        success: false,
        code: validation.errors[0]?.code || 'VALIDATION_FAILED',
        message: validation.errors[0]?.message || '验证失败',
        data: {
          barcode: {
            code: barcode.code,
            name: barcode.name,
            type: barcode.type,
            cateringCount: barcode.cateringCount,
            maxCateringCount: barcode.maxCateringCount
          }
        }
      });
    }
    
    let currentTimeSlot = null;
    const now = dayjs();
    const currentTime = now.format('HH:mm:ss');
    
    if (barcode.cateringTimeSlots && barcode.cateringTimeSlots.length > 0) {
      currentTimeSlot = await TimeSlot.findOne({
        where: {
          id: { [Op.in]: barcode.cateringTimeSlots },
          status: true,
          [Op.and]: [
            Sequelize.literal(`'${currentTime}' >= "startTime"`),
            Sequelize.literal(`'${currentTime}' <= "endTime"`)
          ]
        },
        transaction
      });
    } else {
      currentTimeSlot = await TimeSlot.findOne({
        where: {
          type: 'catering',
          status: true,
          [Op.and]: [
            Sequelize.literal(`'${currentTime}' >= "startTime"`),
            Sequelize.literal(`'${currentTime}' <= "endTime"`)
          ]
        },
        transaction
      });
    }
    
    const cateringRecord = await CateringRecord.create({
      barcodeId: barcode.id,
      barcodeCode: barcode.code,
      barcodeName: barcode.name,
      departmentId: barcode.departmentId,
      timeSlotId: currentTimeSlot?.id,
      deviceId: device?.id,
      deviceCode: device?.deviceId,
      operatorId: req.user?.id,
      operatorName: req.user?.realName || req.user?.username,
      cateringType,
      amount,
      quantity,
      isOffline: !!offlineSyncId,
      offlineSyncId,
      location: location || device?.location
    }, { transaction });
    
    barcode.cateringCount += 1;
    await barcode.save({ transaction });
    
    const recordKey = `catering:record:${barcode.code}`;
    await redis.set(recordKey, JSON.stringify({
      id: cateringRecord.id,
      barcodeCode: barcode.code,
      cateringCount: barcode.cateringCount,
      maxCateringCount: barcode.maxCateringCount,
      timestamp: Date.now()
    }), 'EX', 86400);
    
    await redis.del(`catering:lock:${barcode.code}`);
    
    await transaction.commit();
    
    if (req.user) {
      await OperationLog.create({
        userId: req.user.id,
        username: req.user.username,
        module: 'catering',
        action: 'scan',
        targetId: cateringRecord.id,
        targetType: 'CateringRecord',
        description: `餐饮扫码：${barcode.code} - ${barcode.name}`,
        ipAddress: req.ip,
        deviceId: device?.id
      });
    }
    
    res.json({
      success: true,
      message: '餐饮消费成功',
      data: {
        record: cateringRecord,
        barcode: {
          code: barcode.code,
          name: barcode.name,
          type: barcode.type,
          company: barcode.company,
          department: barcode.department?.name,
          cateringCount: barcode.cateringCount,
          maxCateringCount: barcode.maxCateringCount,
          remainingCount: barcode.maxCateringCount - barcode.cateringCount
        }
      }
    });
  } catch (error) {
    await transaction.rollback();
    if (req.body.barcodeCode) {
      await redis.del(`catering:lock:${req.body.barcodeCode}`);
    }
    next(error);
  }
};

const batchSyncCatering = async (req, res, next) => {
  try {
    const { records, deviceId } = req.body;
    
    if (!records || !Array.isArray(records)) {
      throw new AppError('请提供餐饮记录数据', 400);
    }
    
    const results = [];
    
    for (const record of records) {
      try {
        const mockReq = {
          body: { ...record, deviceId },
          user: req.user,
          ip: req.ip
        };
        
        const mockRes = {
          status: (code) => ({
            json: (data) => ({ statusCode: code, ...data })
          }),
          json: (data) => ({ statusCode: 200, ...data })
        };
        
        const result = await scanCatering(mockReq, mockRes, (err) => {
          throw err;
        });
        
        results.push({
          barcodeCode: record.barcodeCode,
          success: result?.success ?? false,
          message: result?.message || '处理完成',
          offlineSyncId: record.offlineSyncId
        });
      } catch (error) {
        results.push({
          barcodeCode: record.barcodeCode,
          success: false,
          message: error.message,
          offlineSyncId: record.offlineSyncId
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    
    if (req.user) {
      await OperationLog.create({
        userId: req.user.id,
        username: req.user.username,
        module: 'catering',
        action: 'batchSync',
        description: `批量同步餐饮记录：成功${successCount}条，失败${failedCount}条`,
        ipAddress: req.ip
      });
    }
    
    res.json({
      success: true,
      message: `批量同步完成：成功${successCount}条，失败${failedCount}条`,
      data: {
        total: results.length,
        success: successCount,
        failed: failedCount,
        results
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCateringRecords = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, barcodeCode, departmentId, timeSlotId, deviceId,
            startDate, endDate, cateringType } = req.query;
    const offset = (page - 1) * pageSize;
    
    const where = {};
    
    if (barcodeCode) {
      where.barcodeCode = { [Op.like]: `%${barcodeCode}%` };
    }
    
    if (departmentId) {
      where.departmentId = departmentId;
    }
    
    if (timeSlotId) {
      where.timeSlotId = timeSlotId;
    }
    
    if (deviceId) {
      where.deviceId = deviceId;
    }
    
    if (cateringType) {
      where.cateringType = cateringType;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = dayjs(startDate).startOf('day').toDate();
      }
      if (endDate) {
        where.createdAt[Op.lte] = dayjs(endDate).endOf('day').toDate();
      }
    }
    
    const { count, rows } = await CateringRecord.findAndCountAll({
      where,
      include: [
        {
          model: Barcode,
          as: 'barcode',
          attributes: ['id', 'code', 'name', 'type', 'company']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        },
        {
          model: TimeSlot,
          as: 'timeSlot',
          attributes: ['id', 'name', 'startTime', 'endTime']
        },
        {
          model: HandheldDevice,
          as: 'device',
          attributes: ['id', 'deviceId', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scanCatering,
  batchSyncCatering,
  getCateringRecords
};
