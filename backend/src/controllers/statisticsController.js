const Equipment = require('../models/Equipment');
const RepairOrder = require('../models/RepairOrder');
const MaintenancePlan = require('../models/MaintenancePlan');
const SparePart = require('../models/SparePart');
const { useMockData } = require('../config/db');
const { mockStatistics } = require('../utils/mockData');

// 设备故障率统计
exports.getEquipmentFailureRate = async (req, res) => {
  try {
    // 获取设备总数
    const totalEquipment = await Equipment.countDocuments();
    
    // 获取故障设备数
    const failedEquipment = await RepairOrder.distinct('equipmentId');
    const failureCount = failedEquipment.length;
    
    // 计算故障率
    const failureRate = totalEquipment > 0 ? (failureCount / totalEquipment) * 100 : 0;
    
    res.status(200).json({ success: true, failureRate, totalEquipment, failureCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// MTBF (平均无故障时间) 统计
exports.getMTBF = async (req, res) => {
  try {
    // 获取所有维修工单
    const repairOrders = await RepairOrder.find({ status: 'closed' }).populate('equipmentId');
    
    // 按设备分组计算MTBF
    const equipmentMTBF = {};
    
    repairOrders.forEach(order => {
      const equipmentId = order.equipmentId._id.toString();
      if (!equipmentMTBF[equipmentId]) {
        equipmentMTBF[equipmentId] = {
          name: order.equipmentId.name,
          code: order.equipmentId.code,
          repairCount: 0,
          totalTime: 0
        };
      }
      
      equipmentMTBF[equipmentId].repairCount++;
      
      // 计算故障间隔时间（简化计算，实际应该从设备安装日期开始计算）
      const installDate = new Date(order.equipmentId.installDate);
      const completionDate = new Date(order.completionTime);
      const timeDiff = (completionDate - installDate) / (1000 * 60 * 60 * 24); // 转换为天
      equipmentMTBF[equipmentId].totalTime = timeDiff;
    });
    
    // 计算每个设备的MTBF
    Object.keys(equipmentMTBF).forEach(key => {
      const equipment = equipmentMTBF[key];
      equipment.mtbf = equipment.repairCount > 0 ? equipment.totalTime / equipment.repairCount : 0;
    });
    
    res.status(200).json({ success: true, equipmentMTBF });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// MTTR (平均修复时间) 统计
exports.getMTTR = async (req, res) => {
  try {
    // 获取所有已完成的维修工单
    const repairOrders = await RepairOrder.find({ status: 'closed' });
    
    let totalRepairTime = 0;
    let repairCount = 0;
    
    repairOrders.forEach(order => {
      if (order.repairTime && order.completionTime) {
        const repairTime = new Date(order.repairTime);
        const completionTime = new Date(order.completionTime);
        const timeDiff = (completionTime - repairTime) / (1000 * 60 * 60); // 转换为小时
        totalRepairTime += timeDiff;
        repairCount++;
      }
    });
    
    // 计算MTTR
    const mttr = repairCount > 0 ? totalRepairTime / repairCount : 0;
    
    res.status(200).json({ success: true, mttr, repairCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 维保成本统计
exports.getMaintenanceCost = async (req, res) => {
  try {
    // 获取所有维修工单
    const repairOrders = await RepairOrder.find({ status: 'closed' }).populate('usedSpareParts.sparePartId');
    
    let totalCost = 0;
    
    // 计算备件成本
    repairOrders.forEach(order => {
      order.usedSpareParts.forEach(usedPart => {
        if (usedPart.sparePartId) {
          totalCost += usedPart.sparePartId.price * usedPart.quantity;
        }
      });
    });
    
    res.status(200).json({ success: true, totalCost });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 设备健康度评分
exports.getEquipmentHealthScore = async (req, res) => {
  try {
    // 获取所有设备
    const equipments = await Equipment.find();
    
    const healthScores = [];
    
    for (const equipment of equipments) {
      // 计算健康度评分（简化计算，实际应该根据多个因素综合评估）
      let score = 100;
      
      // 根据设备状态扣分
      if (equipment.status === 'repair') {
        score -= 30;
      } else if (equipment.status === 'maintenance') {
        score -= 10;
      }
      
      // 根据下次保养日期扣分
      const nextMaintenanceDate = new Date(equipment.nextMaintenanceDate);
      const today = new Date();
      const daysUntilMaintenance = (nextMaintenanceDate - today) / (1000 * 60 * 60 * 24);
      
      if (daysUntilMaintenance < 0) {
        score -= 20; //  overdue maintenance
      } else if (daysUntilMaintenance < 7) {
        score -= 10; //  maintenance due soon
      }
      
      // 确保分数在0-100之间
      score = Math.max(0, Math.min(100, score));
      
      healthScores.push({
        equipmentId: equipment._id,
        equipmentName: equipment.name,
        code: equipment.code,
        status: equipment.status,
        healthScore: score
      });
    }
    
    res.status(200).json({ success: true, healthScores });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 综合统计
exports.getStatistics = async (req, res) => {
  try {
    if (useMockData) {
      // 使用模拟数据
      res.status(200).json({
        success: true,
        statistics: mockStatistics
      });
    } else {
      // 使用数据库
      // 获取设备总数
      const totalEquipment = await Equipment.countDocuments();
      
      // 获取故障设备数
      const failedEquipment = await RepairOrder.distinct('equipmentId');
      const failureCount = failedEquipment.length;
      
      // 计算故障率
      const failureRate = totalEquipment > 0 ? parseFloat(((failureCount / totalEquipment) * 100).toFixed(2)) : 0;
      
      // 计算MTBF
      const repairOrders = await RepairOrder.find({ status: 'closed' }).populate('equipmentId');
      const equipmentMTBF = {};
      
      repairOrders.forEach(order => {
        const equipmentId = order.equipmentId._id.toString();
        if (!equipmentMTBF[equipmentId]) {
          equipmentMTBF[equipmentId] = {
            name: order.equipmentId.name,
            code: order.equipmentId.code,
            repairCount: 0,
            totalTime: 0
          };
        }
        
        equipmentMTBF[equipmentId].repairCount++;
        
        const installDate = new Date(order.equipmentId.installDate);
        const completionDate = new Date(order.completionTime);
        const timeDiff = (completionDate - installDate) / (1000 * 60 * 60 * 24); // 转换为天
        equipmentMTBF[equipmentId].totalTime = timeDiff;
      });
      
      let totalMTBF = 0;
      let mtbfCount = 0;
      Object.keys(equipmentMTBF).forEach(key => {
        const equipment = equipmentMTBF[key];
        if (equipment.repairCount > 0) {
          totalMTBF += equipment.totalTime / equipment.repairCount;
          mtbfCount++;
        }
      });
      const mtbf = mtbfCount > 0 ? parseFloat((totalMTBF / mtbfCount).toFixed(2)) : 0;
      
      // 计算MTTR
      let totalRepairTime = 0;
      let repairCount = 0;
      
      repairOrders.forEach(order => {
        if (order.repairTime && order.completionTime) {
          const repairTime = new Date(order.repairTime);
          const completionTime = new Date(order.completionTime);
          const timeDiff = (completionTime - repairTime) / (1000 * 60 * 60); // 转换为小时
          totalRepairTime += timeDiff;
          repairCount++;
        }
      });
      
      const mttr = repairCount > 0 ? parseFloat((totalRepairTime / repairCount).toFixed(2)) : 0;
      
      // 计算维保成本
      let maintenanceCost = 0;
      
      repairOrders.forEach(order => {
        order.usedSpareParts.forEach(usedPart => {
          if (usedPart.sparePartId) {
            maintenanceCost += usedPart.sparePartId.price * usedPart.quantity;
          }
        });
      });
      maintenanceCost = parseFloat(maintenanceCost.toFixed(2));
      
      // 获取设备健康度评分
      const equipments = await Equipment.find();
      const healthScores = [];
      
      for (const equipment of equipments) {
        let score = 100;
        
        if (equipment.status === 'repair') {
          score -= 30;
        } else if (equipment.status === 'maintenance') {
          score -= 10;
        }
        
        const nextMaintenanceDate = new Date(equipment.nextMaintenanceDate);
        const today = new Date();
        const daysUntilMaintenance = (nextMaintenanceDate - today) / (1000 * 60 * 60 * 24);
        
        if (daysUntilMaintenance < 0) {
          score -= 20;
        } else if (daysUntilMaintenance < 7) {
          score -= 10;
        }
        
        score = Math.max(0, Math.min(100, score));
        score = parseFloat(score.toFixed(2));
        
        healthScores.push({
          equipmentId: equipment._id,
          equipmentName: equipment.name,
          healthScore: score
        });
      }
      
      res.status(200).json({
        success: true,
        statistics: {
          failureRate,
          mtbf,
          mttr,
          maintenanceCost,
          healthScores
        }
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};