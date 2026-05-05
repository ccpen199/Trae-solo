const { Barcode, EntryRecord, CateringRecord, BookletRecord, Department, TimeSlot, HandheldDevice, sequelize } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

const getDashboardStats = async (req, res, next) => {
  try {
    const today = dayjs().startOf('day');
    const tomorrow = dayjs().add(1, 'day').startOf('day');
    
    const [
      totalBarcodes,
      activeBarcodes,
      todayEntryCount,
      todayCateringCount,
      todayBookletCount,
      entryByType,
      cateringByType,
      activeDevices
    ] = await Promise.all([
      Barcode.count(),
      Barcode.count({ where: { status: 'active' } }),
      EntryRecord.count({
        where: {
          createdAt: {
            [Op.gte]: today.toDate(),
            [Op.lt]: tomorrow.toDate()
          }
        }
      }),
      CateringRecord.count({
        where: {
          createdAt: {
            [Op.gte]: today.toDate(),
            [Op.lt]: tomorrow.toDate()
          }
        }
      }),
      BookletRecord.count({
        where: {
          createdAt: {
            [Op.gte]: today.toDate(),
            [Op.lt]: tomorrow.toDate()
          }
        }
      }),
      EntryRecord.findAll({
        attributes: [
          'entryType',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: {
            [Op.gte]: today.toDate(),
            [Op.lt]: tomorrow.toDate()
          }
        },
        group: ['entryType']
      }),
      CateringRecord.findAll({
        attributes: [
          'cateringType',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: {
            [Op.gte]: today.toDate(),
            [Op.lt]: tomorrow.toDate()
          }
        },
        group: ['cateringType']
      }),
      HandheldDevice.count({ where: { status: 'active' } })
    ]);
    
    res.json({
      success: true,
      data: {
        totalBarcodes,
        activeBarcodes,
        todayEntryCount,
        todayCateringCount,
        todayBookletCount,
        activeDevices,
        entryByType,
        cateringByType
      }
    });
  } catch (error) {
    next(error);
  }
};

const getEntryReport = async (req, res, next) => {
  try {
    const { startDate, endDate, departmentId, timeSlotId, groupBy = 'day' } = req.query;
    
    const where = {};
    
    if (startDate) {
      where.createdAt = { [Op.gte]: dayjs(startDate).startOf('day').toDate() };
    }
    
    if (endDate) {
      where.createdAt = {
        ...where.createdAt,
        [Op.lte]: dayjs(endDate).endOf('day').toDate()
      };
    }
    
    if (departmentId) {
      where.departmentId = departmentId;
    }
    
    if (timeSlotId) {
      where.timeSlotId = timeSlotId;
    }
    
    let groupClause = [];
    let dateFormat;
    
    switch (groupBy) {
      case 'hour':
        dateFormat = 'YYYY-MM-DD HH:00';
        break;
      case 'day':
      default:
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        dateFormat = 'YYYY-WW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
    }
    
    const records = await EntryRecord.findAll({
      attributes: [
        [sequelize.fn('date_trunc', groupBy === 'hour' ? 'hour' : groupBy === 'day' ? 'day' : groupBy === 'week' ? 'week' : 'month', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        'entryType'
      ],
      where,
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ],
      group: ['date', 'entryType', 'department.id'],
      order: [['date', 'ASC']]
    });
    
    const summary = await EntryRecord.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalCount'],
        [sequelize.fn('SUM', sequelize.literal(`CASE WHEN "entryType" = 'entry' THEN 1 ELSE 0 END`)), 'entryCount'],
        [sequelize.fn('SUM', sequelize.literal(`CASE WHEN "entryType" = 'exit' THEN 1 ELSE 0 END`)), 'exitCount']
      ],
      where
    });
    
    res.json({
      success: true,
      data: {
        records,
        summary: summary[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCateringReport = async (req, res, next) => {
  try {
    const { startDate, endDate, departmentId, timeSlotId, groupBy = 'day' } = req.query;
    
    const where = {};
    
    if (startDate) {
      where.createdAt = { [Op.gte]: dayjs(startDate).startOf('day').toDate() };
    }
    
    if (endDate) {
      where.createdAt = {
        ...where.createdAt,
        [Op.lte]: dayjs(endDate).endOf('day').toDate()
      };
    }
    
    if (departmentId) {
      where.departmentId = departmentId;
    }
    
    if (timeSlotId) {
      where.timeSlotId = timeSlotId;
    }
    
    const records = await CateringRecord.findAll({
      attributes: [
        [sequelize.fn('date_trunc', groupBy === 'hour' ? 'hour' : groupBy === 'day' ? 'day' : groupBy === 'week' ? 'week' : 'month', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        'cateringType'
      ],
      where,
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ],
      group: ['date', 'cateringType', 'department.id'],
      order: [['date', 'ASC']]
    });
    
    const summary = await CateringRecord.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalCount'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('SUM', sequelize.literal(`CASE WHEN "cateringType" = 'breakfast' THEN 1 ELSE 0 END`)), 'breakfastCount'],
        [sequelize.fn('SUM', sequelize.literal(`CASE WHEN "cateringType" = 'lunch' THEN 1 ELSE 0 END`)), 'lunchCount'],
        [sequelize.fn('SUM', sequelize.literal(`CASE WHEN "cateringType" = 'dinner' THEN 1 ELSE 0 END`)), 'dinnerCount']
      ],
      where
    });
    
    res.json({
      success: true,
      data: {
        records,
        summary: summary[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

const getBookletReport = async (req, res, next) => {
  try {
    const { startDate, endDate, departmentId, timeSlotId, groupBy = 'day' } = req.query;
    
    const where = {};
    
    if (startDate) {
      where.createdAt = { [Op.gte]: dayjs(startDate).startOf('day').toDate() };
    }
    
    if (endDate) {
      where.createdAt = {
        ...where.createdAt,
        [Op.lte]: dayjs(endDate).endOf('day').toDate()
      };
    }
    
    if (departmentId) {
      where.departmentId = departmentId;
    }
    
    if (timeSlotId) {
      where.timeSlotId = timeSlotId;
    }
    
    const records = await BookletRecord.findAll({
      attributes: [
        [sequelize.fn('date_trunc', groupBy === 'hour' ? 'hour' : groupBy === 'day' ? 'day' : groupBy === 'week' ? 'week' : 'month', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        'bookletType'
      ],
      where,
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ],
      group: ['date', 'bookletType', 'department.id'],
      order: [['date', 'ASC']]
    });
    
    const summary = await BookletRecord.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalCount'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.literal(`CASE WHEN "bookletType" = 'general' THEN "quantity" ELSE 0 END`)), 'generalQuantity'],
        [sequelize.fn('SUM', sequelize.literal(`CASE WHEN "bookletType" = 'vip' THEN "quantity" ELSE 0 END`)), 'vipQuantity'],
        [sequelize.fn('SUM', sequelize.literal(`CASE WHEN "bookletType" = 'exhibitor' THEN "quantity" ELSE 0 END`)), 'exhibitorQuantity']
      ],
      where
    });
    
    res.json({
      success: true,
      data: {
        records,
        summary: summary[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

const getDepartmentReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    
    if (startDate) {
      where.createdAt = { [Op.gte]: dayjs(startDate).startOf('day').toDate() };
    }
    
    if (endDate) {
      where.createdAt = {
        ...where.createdAt,
        [Op.lte]: dayjs(endDate).endOf('day').toDate()
      };
    }
    
    const departments = await Department.findAll({
      attributes: ['id', 'name', 'code'],
      where: { status: true }
    });
    
    const results = [];
    
    for (const dept of departments) {
      const deptWhere = { ...where, departmentId: dept.id };
      
      const [entryCount, cateringCount, bookletCount, barcodeCount] = await Promise.all([
        EntryRecord.count({ where: deptWhere }),
        CateringRecord.count({ where: deptWhere }),
        BookletRecord.count({ where: deptWhere }),
        Barcode.count({ where: { departmentId: dept.id } })
      ]);
      
      results.push({
        id: dept.id,
        name: dept.name,
        code: dept.code,
        barcodeCount,
        entryCount,
        cateringCount,
        bookletCount
      });
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

const getBarcodeUsageReport = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, type, status, departmentId } = req.query;
    const offset = (page - 1) * pageSize;
    
    const where = {};
    
    if (type) {
      where.type = type;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (departmentId) {
      where.departmentId = departmentId;
    }
    
    const { count, rows } = await Barcode.findAndCountAll({
      attributes: [
        'id', 'code', 'name', 'type', 'company', 'status',
        'entryCount', 'maxEntryCount',
        'cateringCount', 'maxCateringCount',
        'bookletCount', 'maxBookletCount'
      ],
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
    
    const usageStats = await Barcode.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.col('entryCount')), 'totalEntryCount'],
        [sequelize.fn('SUM', sequelize.col('cateringCount')), 'totalCateringCount'],
        [sequelize.fn('SUM', sequelize.col('bookletCount')), 'totalBookletCount']
      ]
    });
    
    res.json({
      success: true,
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        summary: usageStats
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getEntryReport,
  getCateringReport,
  getBookletReport,
  getDepartmentReport,
  getBarcodeUsageReport
};
