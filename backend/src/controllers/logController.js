const Log = require('../models/Log');

// 获取日志列表
exports.getLogs = async (req, res) => {
  try {
    const { resourceType, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (resourceType) {
      query.resourceType = resourceType;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    const logs = await Log.find(query)
      .populate('user', 'name role')
      .populate('resourceId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Log.countDocuments(query);
    
    res.status(200).json({
      success: true,
      logs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取设备履历
exports.getEquipmentHistory = async (req, res) => {
  try {
    const { equipmentId } = req.params;
    
    const logs = await Log.find({
      resourceType: 'equipment',
      resourceId: equipmentId
    })
      .populate('user', 'name role')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取保养记录
exports.getMaintenanceHistory = async (req, res) => {
  try {
    const { equipmentId } = req.query;
    
    const query = { resourceType: 'maintenance' };
    if (equipmentId) {
      query.resourceId = equipmentId;
    }
    
    const logs = await Log.find(query)
      .populate('user', 'name role')
      .populate('resourceId')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取维修记录
exports.getRepairHistory = async (req, res) => {
  try {
    const { equipmentId } = req.query;
    
    const query = { resourceType: 'repair' };
    if (equipmentId) {
      query.resourceId = equipmentId;
    }
    
    const logs = await Log.find(query)
      .populate('user', 'name role')
      .populate('resourceId')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取备件消耗记录
exports.getSparePartHistory = async (req, res) => {
  try {
    const logs = await Log.find({ resourceType: 'sparePart' })
      .populate('user', 'name role')
      .populate('resourceId')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};