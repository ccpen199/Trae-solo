const SparePart = require('../models/SparePart');
const { useMockData } = require('../config/db');
const { mockSpareParts } = require('../utils/mockData');

// 创建备件
exports.createSparePart = async (req, res) => {
  try {
    const { name, code, type, model, manufacturer, stockQuantity, minimumStock, unit, price } = req.body;
    
    // 创建备件
    const sparePart = new SparePart({
      name,
      code,
      type,
      model,
      manufacturer,
      stockQuantity,
      minimumStock,
      unit,
      price,
      createdBy: req.user._id
    });
    
    await sparePart.save();
    
    res.status(201).json({ success: true, sparePart });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取备件列表
exports.getSpareParts = async (req, res) => {
  try {
    if (useMockData) {
      // 使用模拟数据
      res.status(200).json({ success: true, spareParts: mockSpareParts });
    } else {
      // 使用数据库
      const spareParts = await SparePart.find();
      res.status(200).json({ success: true, spareParts });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取单个备件信息
exports.getSparePart = async (req, res) => {
  try {
    const sparePart = await SparePart.findById(req.params.id);
    if (!sparePart) {
      return res.status(404).json({ message: 'Spare part not found' });
    }
    res.status(200).json({ success: true, sparePart });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 更新备件信息
exports.updateSparePart = async (req, res) => {
  try {
    const { name, code, type, model, manufacturer, stockQuantity, minimumStock, unit, price } = req.body;
    
    let sparePart = await SparePart.findById(req.params.id);
    if (!sparePart) {
      return res.status(404).json({ message: 'Spare part not found' });
    }
    
    // 更新备件信息
    sparePart.name = name || sparePart.name;
    sparePart.code = code || sparePart.code;
    sparePart.type = type || sparePart.type;
    sparePart.model = model || sparePart.model;
    sparePart.manufacturer = manufacturer || sparePart.manufacturer;
    sparePart.stockQuantity = stockQuantity !== undefined ? stockQuantity : sparePart.stockQuantity;
    sparePart.minimumStock = minimumStock !== undefined ? minimumStock : sparePart.minimumStock;
    sparePart.unit = unit || sparePart.unit;
    sparePart.price = price !== undefined ? price : sparePart.price;
    
    await sparePart.save();
    
    res.status(200).json({ success: true, sparePart });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 删除备件
exports.deleteSparePart = async (req, res) => {
  try {
    const sparePart = await SparePart.findById(req.params.id);
    if (!sparePart) {
      return res.status(404).json({ message: 'Spare part not found' });
    }
    
    await sparePart.remove();
    
    res.status(200).json({ success: true, message: 'Spare part deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 盘点备件
exports.inventorySparePart = async (req, res) => {
  try {
    const { actualQuantity } = req.body;
    
    let sparePart = await SparePart.findById(req.params.id);
    if (!sparePart) {
      return res.status(404).json({ message: 'Spare part not found' });
    }
    
    // 更新备件库存
    sparePart.stockQuantity = actualQuantity;
    await sparePart.save();
    
    res.status(200).json({ success: true, sparePart });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};