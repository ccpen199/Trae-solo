const MaintenancePlan = require('../models/MaintenancePlan');
const Equipment = require('../models/Equipment');
const { useMockData } = require('../config/db');
const { mockMaintenancePlans, mockEquipments } = require('../utils/mockData');

// 获取保养计划列表
exports.getMaintenancePlans = async (req, res) => {
  try {
    if (useMockData) {
      // 使用模拟数据
      // 模拟populate操作
      const populatedPlans = mockMaintenancePlans.map(plan => {
        const equipment = mockEquipments.find(e => e._id === plan.equipmentId);
        return {
          ...plan,
          equipmentId: equipment || plan.equipmentId
        };
      });
      res.status(200).json({ success: true, plans: populatedPlans });
    } else {
      // 使用数据库
      const plans = await MaintenancePlan.find().populate('equipmentId').populate('executor');
      res.status(200).json({ success: true, plans });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取单个保养计划
exports.getMaintenancePlan = async (req, res) => {
  try {
    const plan = await MaintenancePlan.findById(req.params.id).populate('equipmentId').populate('executor');
    if (!plan) {
      return res.status(404).json({ message: 'Maintenance plan not found' });
    }
    res.status(200).json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 分配保养计划
exports.assignMaintenancePlan = async (req, res) => {
  try {
    const { executor } = req.body;
    
    let plan = await MaintenancePlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Maintenance plan not found' });
    }
    
    plan.executor = executor;
    plan.status = 'inProgress';
    
    await plan.save();
    
    res.status(200).json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 完成保养计划
exports.completeMaintenancePlan = async (req, res) => {
  try {
    const { maintenanceRecord } = req.body;
    
    let plan = await MaintenancePlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Maintenance plan not found' });
    }
    
    // 更新保养计划状态
    plan.status = 'completed';
    plan.maintenanceRecord = maintenanceRecord;
    plan.maintenanceTime = new Date();
    
    // 获取设备信息
    const equipment = await Equipment.findById(plan.equipmentId);
    if (equipment) {
      // 计算下次保养日期
      const nextMaintenanceDate = new Date();
      nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + equipment.maintenanceCycle);
      plan.nextMaintenanceDate = nextMaintenanceDate;
      
      // 更新设备的下次保养日期
      equipment.nextMaintenanceDate = nextMaintenanceDate;
      await equipment.save();
      
      // 生成下次保养计划
      const newPlan = new MaintenancePlan({
        equipmentId: equipment._id,
        planDate: nextMaintenanceDate,
        status: 'pending',
        createdBy: req.user._id
      });
      await newPlan.save();
    }
    
    await plan.save();
    
    res.status(200).json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 取消保养计划
exports.cancelMaintenancePlan = async (req, res) => {
  try {
    let plan = await MaintenancePlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Maintenance plan not found' });
    }
    
    plan.status = 'canceled';
    await plan.save();
    
    res.status(200).json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};