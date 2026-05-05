const { Op } = require('sequelize');
const { PregnancyRecord, FetalMovement } = require('../models');

const createPregnancyRecord = async (req, res) => {
  try {
    const {
      recordDate,
      weight,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      fundalHeight,
      abdominalCircumference,
      fetalHeartRate,
      notes,
      mood,
      symptoms
    } = req.body;

    if (!recordDate) {
      return res.status(400).json({
        success: false,
        message: '记录日期不能为空'
      });
    }

    const record = await PregnancyRecord.create({
      userId: req.user.id,
      recordDate,
      weight,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      fundalHeight,
      abdominalCircumference,
      fetalHeartRate,
      notes,
      mood,
      symptoms: symptoms || []
    });

    res.status(201).json({
      success: true,
      message: '记录创建成功',
      data: record
    });
  } catch (error) {
    console.error('创建孕期记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const getPregnancyRecords = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, startDate, endDate } = req.query;
    const offset = (page - 1) * pageSize;

    const where = { userId: req.user.id };
    
    if (startDate || endDate) {
      where.recordDate = {};
      if (startDate) where.recordDate[Op.gte] = startDate;
      if (endDate) where.recordDate[Op.lte] = endDate;
    }

    const { count, rows } = await PregnancyRecord.findAndCountAll({
      where,
      order: [['recordDate', 'DESC']],
      limit: parseInt(pageSize),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('获取孕期记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const getPregnancyRecordDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await PregnancyRecord.findOne({
      where: { id, userId: req.user.id }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '记录不存在'
      });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('获取孕期记录详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const updatePregnancyRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const record = await PregnancyRecord.findOne({
      where: { id, userId: req.user.id }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '记录不存在'
      });
    }

    await record.update(updateData);

    res.json({
      success: true,
      message: '更新成功',
      data: record
    });
  } catch (error) {
    console.error('更新孕期记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const deletePregnancyRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await PregnancyRecord.findOne({
      where: { id, userId: req.user.id }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '记录不存在'
      });
    }

    await record.destroy();

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除孕期记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const createFetalMovement = async (req, res) => {
  try {
    const {
      recordDate,
      startTime,
      endTime,
      durationMinutes,
      movementCount,
      intensity,
      notes
    } = req.body;

    if (!recordDate || !startTime || !endTime || movementCount === undefined) {
      return res.status(400).json({
        success: false,
        message: '必填字段不能为空'
      });
    }

    const record = await FetalMovement.create({
      userId: req.user.id,
      recordDate,
      startTime,
      endTime,
      durationMinutes,
      movementCount,
      intensity: intensity || 'normal',
      notes
    });

    res.status(201).json({
      success: true,
      message: '胎动记录创建成功',
      data: record
    });
  } catch (error) {
    console.error('创建胎动记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const getFetalMovements = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, startDate, endDate } = req.query;
    const offset = (page - 1) * pageSize;

    const where = { userId: req.user.id };
    
    if (startDate || endDate) {
      where.recordDate = {};
      if (startDate) where.recordDate[Op.gte] = startDate;
      if (endDate) where.recordDate[Op.lte] = endDate;
    }

    const { count, rows } = await FetalMovement.findAndCountAll({
      where,
      order: [['recordDate', 'DESC'], ['startTime', 'DESC']],
      limit: parseInt(pageSize),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('获取胎动记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const getFetalMovementStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = { userId: req.user.id };
    
    if (startDate || endDate) {
      where.recordDate = {};
      if (startDate) where.recordDate[Op.gte] = startDate;
      if (endDate) where.recordDate[Op.lte] = endDate;
    }

    const records = await FetalMovement.findAll({
      where,
      order: [['recordDate', 'ASC']]
    });

    const totalCount = records.reduce((sum, r) => sum + r.movementCount, 0);
    const avgCount = records.length > 0 ? Math.round(totalCount / records.length) : 0;
    
    const dateStats = {};
    records.forEach(r => {
      const date = r.recordDate;
      if (!dateStats[date]) {
        dateStats[date] = { count: 0, sessions: 0 };
      }
      dateStats[date].count += r.movementCount;
      dateStats[date].sessions += 1;
    });

    res.json({
      success: true,
      data: {
        totalCount,
        avgCount,
        totalSessions: records.length,
        dateStats: Object.entries(dateStats).map(([date, stats]) => ({
          date,
          ...stats
        }))
      }
    });
  } catch (error) {
    console.error('获取胎动统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

module.exports = {
  createPregnancyRecord,
  getPregnancyRecords,
  getPregnancyRecordDetail,
  updatePregnancyRecord,
  deletePregnancyRecord,
  createFetalMovement,
  getFetalMovements,
  getFetalMovementStats
};
