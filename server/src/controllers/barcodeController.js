const { Barcode, Department, OperationLog, EntryRecord, CateringRecord, BookletRecord } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const getBarcodes = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, keyword, type, departmentId, status } = req.query;
    const offset = (page - 1) * pageSize;
    
    const where = {};
    
    if (keyword) {
      where[Op.or] = [
        { code: { [Op.like]: `%${keyword}%` } },
        { name: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
        { company: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    if (type) {
      where.type = type;
    }
    
    if (departmentId) {
      where.departmentId = departmentId;
    }
    
    if (status) {
      where.status = status;
    }
    
    const { count, rows } = await Barcode.findAndCountAll({
      where,
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
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

const getBarcodeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const barcode = await Barcode.findByPk(id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    if (!barcode) {
      throw new AppError('条码不存在', 404);
    }
    
    res.json({
      success: true,
      data: barcode
    });
  } catch (error) {
    next(error);
  }
};

const getBarcodeByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    
    const barcode = await Barcode.findOne({
      where: { code },
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    if (!barcode) {
      throw new AppError('条码不存在', 404);
    }
    
    res.json({
      success: true,
      data: barcode
    });
  } catch (error) {
    next(error);
  }
};

const createBarcode = async (req, res, next) => {
  try {
    const {
      code, name, type, departmentId, phone, email, company, position,
      maxEntryCount, maxCateringCount, maxBookletCount,
      validFrom, validTo, entryTimeSlots, cateringTimeSlots, bookletTimeSlots,
      remark
    } = req.body;
    
    if (!code || !name) {
      throw new AppError('条码编号和名称不能为空', 400);
    }
    
    const existingBarcode = await Barcode.findOne({ where: { code } });
    if (existingBarcode) {
      throw new AppError('条码编号已存在', 400);
    }
    
    const barcode = await Barcode.create({
      code,
      name,
      type: type || 'attendee',
      departmentId,
      phone,
      email,
      company,
      position,
      maxEntryCount: maxEntryCount || 1,
      maxCateringCount: maxCateringCount || 1,
      maxBookletCount: maxBookletCount || 1,
      validFrom,
      validTo,
      entryTimeSlots,
      cateringTimeSlots,
      bookletTimeSlots,
      remark,
      status: 'active'
    });
    
    await OperationLog.create({
      userId: req.user.id,
      username: req.user.username,
      module: 'barcode',
      action: 'create',
      targetId: barcode.id,
      targetType: 'Barcode',
      description: `创建条码：${code} - ${name}`,
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: '条码创建成功',
      data: barcode
    });
  } catch (error) {
    next(error);
  }
};

const batchCreateBarcodes = async (req, res, next) => {
  try {
    const { barcodes } = req.body;
    
    if (!barcodes || !Array.isArray(barcodes) || barcodes.length === 0) {
      throw new AppError('请提供条码数据', 400);
    }
    
    const codes = barcodes.map(b => b.code);
    const existingBarcodes = await Barcode.findAll({
      where: { code: { [Op.in]: codes } }
    });
    
    if (existingBarcodes.length > 0) {
      const existingCodes = existingBarcodes.map(b => b.code);
      throw new AppError(`以下条码编号已存在：${existingCodes.join(', ')}`, 400);
    }
    
    const newBarcodes = barcodes.map(b => ({
      code: b.code,
      name: b.name,
      type: b.type || 'attendee',
      departmentId: b.departmentId,
      phone: b.phone,
      email: b.email,
      company: b.company,
      position: b.position,
      maxEntryCount: b.maxEntryCount || 1,
      maxCateringCount: b.maxCateringCount || 1,
      maxBookletCount: b.maxBookletCount || 1,
      validFrom: b.validFrom,
      validTo: b.validTo,
      entryTimeSlots: b.entryTimeSlots,
      cateringTimeSlots: b.cateringTimeSlots,
      bookletTimeSlots: b.bookletTimeSlots,
      remark: b.remark,
      status: 'active'
    }));
    
    const createdBarcodes = await Barcode.bulkCreate(newBarcodes, { returning: true });
    
    await OperationLog.create({
      userId: req.user.id,
      username: req.user.username,
      module: 'barcode',
      action: 'batchCreate',
      description: `批量创建条码，共${createdBarcodes.length}条`,
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: `成功创建 ${createdBarcodes.length} 条条码`,
      data: { count: createdBarcodes.length }
    });
  } catch (error) {
    next(error);
  }
};

const updateBarcode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const barcode = await Barcode.findByPk(id);
    
    if (!barcode) {
      throw new AppError('条码不存在', 404);
    }
    
    if (updateData.code && updateData.code !== barcode.code) {
      const existingBarcode = await Barcode.findOne({ 
        where: { code: updateData.code, id: { [Op.ne]: id } } 
      });
      if (existingBarcode) {
        throw new AppError('条码编号已存在', 400);
      }
    }
    
    const allowedFields = [
      'name', 'type', 'departmentId', 'phone', 'email', 'company', 'position',
      'maxEntryCount', 'maxCateringCount', 'maxBookletCount',
      'validFrom', 'validTo', 'entryTimeSlots', 'cateringTimeSlots', 'bookletTimeSlots',
      'status', 'remark'
    ];
    
    const filteredUpdate = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredUpdate[field] = updateData[field];
      }
    }
    
    await barcode.update(filteredUpdate);
    
    await OperationLog.create({
      userId: req.user.id,
      username: req.user.username,
      module: 'barcode',
      action: 'update',
      targetId: barcode.id,
      targetType: 'Barcode',
      description: `更新条码：${barcode.code}`,
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: '条码更新成功'
    });
  } catch (error) {
    next(error);
  }
};

const deleteBarcode = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const barcode = await Barcode.findByPk(id);
    
    if (!barcode) {
      throw new AppError('条码不存在', 404);
    }
    
    const code = barcode.code;
    const name = barcode.name;
    await barcode.destroy();
    
    await OperationLog.create({
      userId: req.user.id,
      username: req.user.username,
      module: 'barcode',
      action: 'delete',
      targetId: id,
      targetType: 'Barcode',
      description: `删除条码：${code} - ${name}`,
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: '条码删除成功'
    });
  } catch (error) {
    next(error);
  }
};

const getBarcodeRecords = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type = 'all' } = req.query;
    
    const barcode = await Barcode.findByPk(id);
    
    if (!barcode) {
      throw new AppError('条码不存在', 404);
    }
    
    const result = {
      barcodeInfo: {
        code: barcode.code,
        name: barcode.name,
        type: barcode.type,
        entryCount: barcode.entryCount,
        maxEntryCount: barcode.maxEntryCount,
        cateringCount: barcode.cateringCount,
        maxCateringCount: barcode.maxCateringCount,
        bookletCount: barcode.bookletCount,
        maxBookletCount: barcode.maxBookletCount
      }
    };
    
    if (type === 'all' || type === 'entry') {
      result.entryRecords = await EntryRecord.findAll({
        where: { barcodeId: id },
        order: [['createdAt', 'DESC']],
        limit: 50
      });
    }
    
    if (type === 'all' || type === 'catering') {
      result.cateringRecords = await CateringRecord.findAll({
        where: { barcodeId: id },
        order: [['createdAt', 'DESC']],
        limit: 50
      });
    }
    
    if (type === 'all' || type === 'booklet') {
      result.bookletRecords = await BookletRecord.findAll({
        where: { barcodeId: id },
        order: [['createdAt', 'DESC']],
        limit: 50
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBarcodes,
  getBarcodeById,
  getBarcodeByCode,
  createBarcode,
  batchCreateBarcodes,
  updateBarcode,
  deleteBarcode,
  getBarcodeRecords
};
