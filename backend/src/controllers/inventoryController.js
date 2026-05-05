const db = require('../models');
const { Op } = require('sequelize');

const getInventories = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, type, category, status, keyword } = req.query;
    
    const where = {};
    
    if (type) {
      where.type = type;
    }
    
    if (category) {
      where.category = category;
    }
    
    if (status !== undefined && status !== '') {
      where.status = parseInt(status);
    }
    
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    
    const { count, rows } = await db.Inventory.findAndCountAll({
      where,
      include: [
        { model: db.Dish, as: 'dish' }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
    
  } catch (error) {
    console.error('获取库存列表错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const inventory = await db.Inventory.findByPk(id, {
      include: [
        { model: db.Dish, as: 'dish' },
        { 
          model: db.InventoryLog, 
          as: 'logs',
          include: [
            { model: db.User, as: 'operator' }
          ],
          order: [['createdAt', 'DESC']],
          limit: 20
        }
      ]
    });
    
    if (!inventory) {
      return res.status(404).json({
        code: 404,
        message: '库存不存在'
      });
    }
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: inventory
    });
    
  } catch (error) {
    console.error('获取库存详情错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const createInventory = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { name, code, type, category, unit, quantity, minQuantity, maxQuantity, costPrice, dishId, status } = req.body;
    
    if (!name) {
      await transaction.rollback();
      return res.status(400).json({
        code: 400,
        message: '库存名称不能为空'
      });
    }
    
    const totalCost = (parseFloat(quantity) || 0) * (parseFloat(costPrice) || 0);
    
    const inventory = await db.Inventory.create({
      name,
      code,
      type: type || 'material',
      category,
      unit: unit || '份',
      quantity: parseFloat(quantity) || 0,
      minQuantity: parseFloat(minQuantity) || 0,
      maxQuantity: parseFloat(maxQuantity) || 9999,
      costPrice: parseFloat(costPrice) || 0,
      totalCost,
      dishId,
      status: status ?? 1
    }, { transaction });
    
    await db.InventoryLog.create({
      inventoryId: inventory.id,
      type: 'in',
      quantity: parseFloat(quantity) || 0,
      beforeQuantity: 0,
      afterQuantity: parseFloat(quantity) || 0,
      unitPrice: parseFloat(costPrice) || 0,
      totalAmount: totalCost,
      sourceType: 'manual',
      operatorId: req.user?.id,
      remark: '初始化库存'
    }, { transaction });
    
    await transaction.commit();
    
    return res.json({
      code: 200,
      message: '创建成功',
      data: inventory
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('创建库存错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, type, category, unit, minQuantity, maxQuantity, costPrice, dishId, status } = req.body;
    
    const inventory = await db.Inventory.findByPk(id);
    if (!inventory) {
      return res.status(404).json({
        code: 404,
        message: '库存不存在'
      });
    }
    
    await inventory.update({
      name,
      code,
      type,
      category,
      unit,
      minQuantity,
      maxQuantity,
      costPrice,
      dishId,
      status
    });
    
    return res.json({
      code: 200,
      message: '更新成功',
      data: inventory
    });
    
  } catch (error) {
    console.error('更新库存错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const adjustInventory = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { type, quantity, unitPrice, remark } = req.body;
    
    if (!type || !['in', 'out', 'adjust'].includes(type)) {
      await transaction.rollback();
      return res.status(400).json({
        code: 400,
        message: '无效的调整类型'
      });
    }
    
    if (quantity === undefined || quantity === null) {
      await transaction.rollback();
      return res.status(400).json({
        code: 400,
        message: '数量不能为空'
      });
    }
    
    const inventory = await db.Inventory.findByPk(id, { transaction });
    if (!inventory) {
      await transaction.rollback();
      return res.status(404).json({
        code: 404,
        message: '库存不存在'
      });
    }
    
    const beforeQuantity = parseFloat(inventory.quantity);
    const adjustQuantity = parseFloat(quantity);
    let afterQuantity;
    
    if (type === 'in') {
      afterQuantity = beforeQuantity + adjustQuantity;
    } else if (type === 'out') {
      afterQuantity = beforeQuantity - adjustQuantity;
      if (afterQuantity < 0) {
        await transaction.rollback();
        return res.status(400).json({
          code: 400,
          message: '出库数量不能大于当前库存'
        });
      }
    } else {
      afterQuantity = adjustQuantity;
    }
    
    const price = parseFloat(unitPrice) || parseFloat(inventory.costPrice) || 0;
    const totalAmount = adjustQuantity * price;
    const totalCost = afterQuantity * price;
    
    await inventory.update({
      quantity: afterQuantity,
      totalCost
    }, { transaction });
    
    await db.InventoryLog.create({
      inventoryId: inventory.id,
      type,
      quantity: adjustQuantity,
      beforeQuantity,
      afterQuantity,
      unitPrice: price,
      totalAmount,
      sourceType: 'manual',
      operatorId: req.user?.id,
      remark: remark || (type === 'in' ? '手工入库' : type === 'out' ? '手工出库' : '盘点调整')
    }, { transaction });
    
    await transaction.commit();
    
    return res.json({
      code: 200,
      message: '库存调整成功',
      data: inventory
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('调整库存错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const inventory = await db.Inventory.findByPk(id);
    if (!inventory) {
      return res.status(404).json({
        code: 404,
        message: '库存不存在'
      });
    }
    
    await inventory.destroy();
    
    return res.json({
      code: 200,
      message: '删除成功'
    });
    
  } catch (error) {
    console.error('删除库存错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const getLowStockAlert = async (req, res) => {
  try {
    let lowStockItems;
    
    if (db.isMemoryMode) {
      const allInventories = await db.Inventory.findAll({
        where: { status: 1 },
        include: [
          { model: db.Dish, as: 'dish' }
        ]
      });
      
      lowStockItems = allInventories.filter(item => 
        item.quantity <= item.minQuantity || item.quantity === 0
      ).sort((a, b) => a.quantity - b.quantity);
    } else {
      lowStockItems = await db.Inventory.findAll({
        where: {
          status: 1,
          [Op.or]: [
            { quantity: { [Op.lte]: db.sequelize.col('min_quantity') } },
            { quantity: 0 }
          ]
        },
        include: [
          { model: db.Dish, as: 'dish' }
        ],
        order: [['quantity', 'ASC']]
      });
    }
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: lowStockItems
    });
    
  } catch (error) {
    console.error('获取库存预警错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const getInventoryLogs = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, inventoryId, type, startDate, endDate } = req.query;
    
    const where = {};
    
    if (inventoryId) {
      where.inventoryId = inventoryId;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(`${endDate} 23:59:59`);
      }
    }
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    
    const { count, rows } = await db.InventoryLog.findAndCountAll({
      where,
      include: [
        { model: db.Inventory, as: 'inventory' },
        { model: db.User, as: 'operator' }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
    
  } catch (error) {
    console.error('获取库存日志错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getInventories,
  getInventoryById,
  createInventory,
  updateInventory,
  adjustInventory,
  deleteInventory,
  getLowStockAlert,
  getInventoryLogs
};
