const Equipment = require('../models/Equipment');
const MaintenancePlan = require('../models/MaintenancePlan');
const { useMockData } = require('../config/db');
const { mockEquipments, mockMaintenancePlans } = require('../utils/mockData');

// 设备建档
exports.createEquipment = async (req, res) => {
  try {
    const { name, code, type, model, manufacturer, purchaseDate, installDate, location, maintenanceCycle, associatedSpareParts } = req.body;
    
    // 计算下次保养日期
    const nextMaintenanceDate = new Date();
    nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + maintenanceCycle);
    
    // 创建设备
    const equipment = new Equipment({
      name,
      code,
      type,
      model,
      manufacturer,
      purchaseDate,
      installDate,
      location,
      maintenanceCycle,
      nextMaintenanceDate,
      associatedSpareParts,
      createdBy: req.user._id
    });
    
    await equipment.save();
    
    // 生成初始保养计划
    const maintenancePlan = new MaintenancePlan({
      equipmentId: equipment._id,
      planDate: nextMaintenanceDate,
      status: 'pending',
      createdBy: req.user._id
    });
    
    await maintenancePlan.save();
    
    res.status(201).json({ success: true, equipment });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取设备列表
exports.getEquipments = async (req, res) => {
  try {
    if (useMockData) {
      // 使用模拟数据
      res.status(200).json({ success: true, equipments: mockEquipments });
    } else {
      // 使用数据库
      const equipments = await Equipment.find().populate('associatedSpareParts.sparePartId');
      res.status(200).json({ success: true, equipments });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取单个设备信息
exports.getEquipment = async (req, res) => {
  try {
    if (useMockData) {
      // 使用模拟数据
      const equipment = mockEquipments.find(e => e._id === req.params.id);
      if (!equipment) {
        return res.status(404).json({ message: 'Equipment not found' });
      }
      res.status(200).json({ success: true, equipment });
    } else {
      // 使用数据库
      const equipment = await Equipment.findById(req.params.id).populate('associatedSpareParts.sparePartId');
      if (!equipment) {
        return res.status(404).json({ message: 'Equipment not found' });
      }
      res.status(200).json({ success: true, equipment });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 更新设备信息
exports.updateEquipment = async (req, res) => {
  try {
    const { name, code, type, model, manufacturer, purchaseDate, installDate, location, maintenanceCycle, associatedSpareParts, status } = req.body;
    
    let equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    // 更新设备信息
    equipment.name = name || equipment.name;
    equipment.code = code || equipment.code;
    equipment.type = type || equipment.type;
    equipment.model = model || equipment.model;
    equipment.manufacturer = manufacturer || equipment.manufacturer;
    equipment.purchaseDate = purchaseDate || equipment.purchaseDate;
    equipment.installDate = installDate || equipment.installDate;
    equipment.location = location || equipment.location;
    equipment.status = status || equipment.status;
    
    // 如果保养周期改变，更新下次保养日期
    if (maintenanceCycle && maintenanceCycle !== equipment.maintenanceCycle) {
      equipment.maintenanceCycle = maintenanceCycle;
      const nextMaintenanceDate = new Date();
      nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + maintenanceCycle);
      equipment.nextMaintenanceDate = nextMaintenanceDate;
    }
    
    // 更新关联备件
    if (associatedSpareParts) {
      equipment.associatedSpareParts = associatedSpareParts;
    }
    
    await equipment.save();
    
    res.status(200).json({ success: true, equipment });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 删除设备
exports.deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    await equipment.remove();
    
    res.status(200).json({ success: true, message: 'Equipment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 设备报废
exports.scrapEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    // 更新设备状态为报废
    equipment.status = 'scrapped';
    await equipment.save();
    
    res.status(200).json({ success: true, equipment });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};