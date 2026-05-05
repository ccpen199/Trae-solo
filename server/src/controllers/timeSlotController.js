const { TimeSlot, OperationLog } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const getTimeSlots = async (req, res, next) => {
  try {
    const { page, pageSize, keyword, type, status } = req.query;
    
    const where = {};
    
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    if (type) {
      where.type = type;
    }
    
    if (status !== undefined && status !== '') {
      where.status = status === 'true';
    }
    
    let timeSlots;
    
    if (page && pageSize) {
      const offset = (page - 1) * pageSize;
      const { count, rows } = await TimeSlot.findAndCountAll({
        where,
        order: [['sort', 'ASC'], ['createdAt', 'DESC']],
        limit: parseInt(pageSize),
        offset: parseInt(offset)
      });
      
      timeSlots = {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };
    } else {
      const rows = await TimeSlot.findAll({
        where,
        order: [['sort', 'ASC'], ['createdAt', 'DESC']]
      });
      timeSlots = rows;
    }
    
    res.json({
      success: true,
      data: timeSlots
    });
  } catch (error) {
    next(error);
  }
};

const getTimeSlotById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const timeSlot = await TimeSlot.findByPk(id);
    
    if (!timeSlot) {
      throw new AppError('时段不存在', 404);
    }
    
    res.json({
      success: true,
      data: timeSlot
    });
  } catch (error) {
    next(error);
  }
};

const createTimeSlot = async (req, res, next) => {
  try {
    const { name, code, type, startTime, endTime, effectiveDate, description, sort, status } = req.body;
    
    if (!name || !code || !startTime || !endTime) {
      throw new AppError('时段名称、编码、开始时间和结束时间不能为空', 400);
    }
    
    const existingSlot = await TimeSlot.findOne({ where: { code } });
    if (existingSlot) {
      throw new AppError('时段编码已存在', 400);
    }
    
    const timeSlot = await TimeSlot.create({
      name,
      code,
      type: type || 'general',
      startTime,
      endTime,
      effectiveDate,
      description,
      sort: sort || 0,
      status: status !== undefined ? status : true
    });
    
    await OperationLog.create({
      userId: req.user.id,
      username: req.user.username,
      module: 'timeSlot',
      action: 'create',
      targetId: timeSlot.id,
      targetType: 'TimeSlot',
      description: `创建时段：${name}`,
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: '时段创建成功',
      data: timeSlot
    });
  } catch (error) {
    next(error);
  }
};

const updateTimeSlot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, type, startTime, endTime, effectiveDate, description, sort, status } = req.body;
    
    const timeSlot = await TimeSlot.findByPk(id);
    
    if (!timeSlot) {
      throw new AppError('时段不存在', 404);
    }
    
    if (code && code !== timeSlot.code) {
      const existingSlot = await TimeSlot.findOne({ 
        where: { code, id: { [Op.ne]: id } } 
      });
      if (existingSlot) {
        throw new AppError('时段编码已存在', 400);
      }
    }
    
    await timeSlot.update({
      name,
      code,
      type,
      startTime,
      endTime,
      effectiveDate,
      description,
      sort,
      status
    });
    
    await OperationLog.create({
      userId: req.user.id,
      username: req.user.username,
      module: 'timeSlot',
      action: 'update',
      targetId: timeSlot.id,
      targetType: 'TimeSlot',
      description: `更新时段：${timeSlot.name}`,
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: '时段更新成功'
    });
  } catch (error) {
    next(error);
  }
};

const deleteTimeSlot = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const timeSlot = await TimeSlot.findByPk(id);
    
    if (!timeSlot) {
      throw new AppError('时段不存在', 404);
    }
    
    const name = timeSlot.name;
    await timeSlot.destroy();
    
    await OperationLog.create({
      userId: req.user.id,
      username: req.user.username,
      module: 'timeSlot',
      action: 'delete',
      targetId: id,
      targetType: 'TimeSlot',
      description: `删除时段：${name}`,
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: '时段删除成功'
    });
  } catch (error) {
    next(error);
  }
};

const toggleTimeSlotStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const timeSlot = await TimeSlot.findByPk(id);
    
    if (!timeSlot) {
      throw new AppError('时段不存在', 404);
    }
    
    timeSlot.status = !timeSlot.status;
    await timeSlot.save();
    
    await OperationLog.create({
      userId: req.user.id,
      username: req.user.username,
      module: 'timeSlot',
      action: 'toggle',
      targetId: timeSlot.id,
      targetType: 'TimeSlot',
      description: `切换时段状态：${timeSlot.name} - ${timeSlot.status ? '启用' : '禁用'}`,
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: `时段已${timeSlot.status ? '启用' : '禁用'}`,
      data: { status: timeSlot.status }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTimeSlots,
  getTimeSlotById,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  toggleTimeSlotStatus
};
