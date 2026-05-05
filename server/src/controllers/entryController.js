const { Barcode, EntryRecord, Department, TimeSlot, HandheldDevice, OperationLog, sequelize } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { redis } = require('../config/redis');
const { Op, Sequelize } = require('sequelize');
const dayjs = require('dayjs');

const validateBarcodeForEntry = async (barcode, deviceInfo) => {
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
    barcode.status = 'expired';
    await barcode.save();
    return { valid: false, errors };
  }
  
  if (barcode.entryCount >= barcode.maxEntryCount) {
    errors.push({ code: 'MAX_COUNT_EXCEEDED', message: `已达最大入场次数（${barcode.entryCount}/${barcode.maxEntryCount}）` });
    return { valid: false, errors };
  }
  
  if (barcode.entryTimeSlots && barcode.entryTimeSlots.length > 0) {
    const currentTime = now.format('HH:mm:ss');
    const timeSlots = await TimeSlot.findAll({
      where: {
        id: { [Op.in]: barcode.entryTimeSlots },
        status: true
      }
    });
    
    const inValidSlot = timeSlots.some(slot => {
      return currentTime >= slot.startTime && currentTime <= slot.endTime;
    });
    
    if (!inValidSlot) {
      errors.push({ code: 'OUT_OF_TIME_SLOT', message: '当前不在允许的入场时段内' });
      return { valid: false, errors };
    }
  }
  
  const lockKey = `entry:lock:${barcode.code}`;
  const lockValue = Date.now().toString();
  const locked = await redis.set(lockKey, lockValue, 'EX', 5, 'NX');
  
  if (!locked) {
    errors.push({ code: 'DUPLICATE_SCAN', message: '条码正在处理中，请稍候' });
    return { valid: false, errors };
  }
  
  return { valid: true, errors: [] };
};

const scanEntry = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { barcodeCode, deviceId, entryType = 'entry', location, offlineSyncId } = req.body;
    
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
    
    const validation = await validateBarcodeForEntry(barcode, device);
    
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
            entryCount: barcode.entryCount,
            maxEntryCount: barcode.maxEntryCount
          }
        }
      });
    }
    
    let currentTimeSlot = null;
    const now = dayjs();
    const currentTime = now.format('HH:mm:ss');
    
    if (barcode.entryTimeSlots && barcode.entryTimeSlots.length > 0) {
      currentTimeSlot = await TimeSlot.findOne({
        where: {
          id: { [Op.in]: barcode.entryTimeSlots },
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
          type: 'entry',
          status: true,
          [Op.and]: [
            Sequelize.literal(`'${currentTime}' >= "startTime"`),
            Sequelize.literal(`'${currentTime}' <= "endTime"`)
          ]
        },
        transaction
      });
    }
    
    const entryRecord = await EntryRecord.create({
      barcodeId: barcode.id,
      barcodeCode: barcode.code,
      barcodeName: barcode.name,
      departmentId: barcode.departmentId,
      timeSlotId: currentTimeSlot?.id,
      deviceId: device?.id,
      deviceCode: device?.deviceId,
      operatorId: req.user?.id,
      operatorName: req.user?.realName || req.user?.username,
      entryType,
      isOffline: !!offlineSyncId,
      offlineSyncId,
      location: location || device?.location
    }, { transaction });
    
    barcode.entryCount += 1;
    if (barcode.entryCount >= barcode.maxEntryCount) {
      barcode.status = 'used';
    }
    await barcode.save({ transaction });
    
    const recordKey = `entry:record:${barcode.code}`;
    await redis.set(recordKey, JSON.stringify({
      id: entryRecord.id,
      barcodeCode: barcode.code,
      entryCount: barcode.entryCount,
      maxEntryCount: barcode.maxEntryCount,
      timestamp: Date.now()
    }), 'EX', 86400);
    
    await redis.del(`entry:lock:${barcode.code}`);
    
    await transaction.commit();
    
    if (req.user) {
      await OperationLog.create({
        userId: req.user.id,
        username: req.user.username,
        module: 'entry',
        action: 'scan',
        targetId: entryRecord.id,
        targetType: 'EntryRecord',
        description: `入场扫码：${barcode.code} - ${barcode.name}`,
        ipAddress: req.ip,
        deviceId: device?.id
      });
    }
    
    res.json({
      success: true,
      message: '入场成功',
      data: {
        record: entryRecord,
        barcode: {
          code: barcode.code,
          name: barcode.name,
          type: barcode.type,
          company: barcode.company,
          department: barcode.department?.name,
          entryCount: barcode.entryCount,
          maxEntryCount: barcode.maxEntryCount,
          remainingCount: barcode.maxEntryCount - barcode.entryCount
        }
      }
    });
  } catch (error) {
    await transaction.rollback();
    if (req.body.barcodeCode) {
      await redis.del(`entry:lock:${req.body.barcodeCode}`);
    }
    next(error);
  }
};

const batchSyncEntries = async (req, res, next) => {
  try {
    const { entries, deviceId } = req.body;
    
    if (!entries || !Array.isArray(entries)) {
      throw new AppError('请提供入场记录数据', 400);
    }
    
    const results = [];
    
    for (const entry of entries) {
      try {
        const mockReq = {
          body: { ...entry, deviceId },
          user: req.user,
          ip: req.ip
        };
        
        const mockRes = {
          status: (code) => ({
            json: (data) => ({ statusCode: code, ...data })
          }),
          json: (data) => ({ statusCode: 200, ...data })
        };
        
        const result = await scanEntry(mockReq, mockRes, (err) => {
          throw err;
        });
        
        results.push({
          barcodeCode: entry.barcodeCode,
          success: result?.success ?? false,
          message: result?.message || '处理完成',
          offlineSyncId: entry.offlineSyncId
        });
      } catch (error) {
        results.push({
          barcodeCode: entry.barcodeCode,
          success: false,
          message: error.message,
          offlineSyncId: entry.offlineSyncId
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    
    if (req.user) {
      await OperationLog.create({
        userId: req.user.id,
        username: req.user.username,
        module: 'entry',
        action: 'batchSync',
        description: `批量同步入场记录：成功${successCount}条，失败${failedCount}条`,
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

const getEntryRecords = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, barcodeCode, departmentId, timeSlotId, deviceId, 
            startDate, endDate, entryType } = req.query;
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
    
    if (entryType) {
      where.entryType = entryType;
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
    
    const { count, rows } = await EntryRecord.findAndCountAll({
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

const getEntryRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const record = await EntryRecord.findByPk(id, {
      include: [
        {
          model: Barcode,
          as: 'barcode',
          attributes: ['id', 'code', 'name', 'type', 'company', 'phone']
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
      ]
    });
    
    if (!record) {
      throw new AppError('记录不存在', 404);
    }
    
    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scanEntry,
  batchSyncEntries,
  getEntryRecords,
  getEntryRecordById
};
