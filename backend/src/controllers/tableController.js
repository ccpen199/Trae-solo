const db = require('../models');
const { Op } = require('sequelize');

const getTables = async (req, res) => {
  try {
    const { status, area, keyword } = req.query;
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (area) {
      where.area = area;
    }
    
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    const tables = await db.Table.findAll({
      where,
      order: [['sort', 'ASC'], ['name', 'ASC']]
    });
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: tables
    });
    
  } catch (error) {
    console.error('获取桌台列表错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const getTableById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const table = await db.Table.findByPk(id, {
      include: [
        {
          model: db.Order,
          as: 'orders',
          where: { status: { [Op.notIn]: ['paid', 'cancelled'] } },
          required: false
        }
      ]
    });
    
    if (!table) {
      return res.status(404).json({
        code: 404,
        message: '桌台不存在'
      });
    }
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: table
    });
    
  } catch (error) {
    console.error('获取桌台详情错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const createTable = async (req, res) => {
  try {
    const { name, code, area, capacity, sort } = req.body;
    
    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '桌台名称不能为空'
      });
    }
    
    const table = await db.Table.create({
      name,
      code,
      area,
      capacity: capacity || 4,
      sort: sort || 0
    });
    
    return res.json({
      code: 200,
      message: '创建成功',
      data: table
    });
    
  } catch (error) {
    console.error('创建桌台错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, area, capacity, sort } = req.body;
    
    const table = await db.Table.findByPk(id);
    if (!table) {
      return res.status(404).json({
        code: 404,
        message: '桌台不存在'
      });
    }
    
    await table.update({
      name,
      code,
      area,
      capacity,
      sort
    });
    
    return res.json({
      code: 200,
      message: '更新成功',
      data: table
    });
    
  } catch (error) {
    console.error('更新桌台错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['available', 'occupied', 'reserved', 'cleaning', 'maintenance'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        code: 400,
        message: '无效的状态值'
      });
    }
    
    const table = await db.Table.findByPk(id);
    if (!table) {
      return res.status(404).json({
        code: 404,
        message: '桌台不存在'
      });
    }
    
    await table.update({ status });
    
    return res.json({
      code: 200,
      message: '状态更新成功',
      data: table
    });
    
  } catch (error) {
    console.error('更新桌台状态错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    
    const table = await db.Table.findByPk(id);
    if (!table) {
      return res.status(404).json({
        code: 404,
        message: '桌台不存在'
      });
    }
    
    if (table.status === 'occupied') {
      return res.status(400).json({
        code: 400,
        message: '该桌台正在使用中，不能删除'
      });
    }
    
    await table.destroy();
    
    return res.json({
      code: 200,
      message: '删除成功'
    });
    
  } catch (error) {
    console.error('删除桌台错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const getAreas = async (req, res) => {
  try {
    const areas = await db.Table.findAll({
      attributes: ['area'],
      group: ['area'],
      where: { area: { [Op.ne]: null } }
    });
    
    const areaList = areas.map(a => a.area);
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: areaList
    });
    
  } catch (error) {
    console.error('获取区域列表错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getTables,
  getTableById,
  createTable,
  updateTable,
  updateTableStatus,
  deleteTable,
  getAreas
};
