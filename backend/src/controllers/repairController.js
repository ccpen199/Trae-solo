const RepairOrder = require('../models/RepairOrder');
const Equipment = require('../models/Equipment');
const SparePart = require('../models/SparePart');
const { useMockData } = require('../config/db');
const { mockRepairOrders, mockEquipments, mockSpareParts } = require('../utils/mockData');

// 创建维修工单
exports.createRepairOrder = async (req, res) => {
  try {
    const { equipmentId, faultDescription, images } = req.body;
    
    // 创维修工单
    const repairOrder = new RepairOrder({
      equipmentId,
      requester: req.user._id,
      faultDescription,
      images,
      status: 'pending'
    });
    
    await repairOrder.save();
    
    // 更新设备状态为维修中
    const equipment = await Equipment.findById(equipmentId);
    if (equipment) {
      equipment.status = 'repair';
      await equipment.save();
    }
    
    res.status(201).json({ success: true, repairOrder });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取维修工单列表
exports.getRepairOrders = async (req, res) => {
  try {
    if (useMockData) {
      // 使用模拟数据
      // 模拟populate操作
      const populatedOrders = mockRepairOrders.map(order => {
        const equipment = mockEquipments.find(e => e._id === order.equipmentId);
        const usedSpareParts = order.usedSpareParts.map(used => {
          const sparePart = mockSpareParts.find(s => s._id === used.sparePartId);
          return {
            ...used,
            sparePartId: sparePart || used.sparePartId
          };
        });
        return {
          ...order,
          equipmentId: equipment || order.equipmentId,
          usedSpareParts
        };
      });
      res.status(200).json({ success: true, orders: populatedOrders });
    } else {
      // 使用数据库
      const orders = await RepairOrder.find().populate('equipmentId').populate('requester').populate('technician').populate('usedSpareParts.sparePartId');
      res.status(200).json({ success: true, orders });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取单个维修工单
exports.getRepairOrder = async (req, res) => {
  try {
    const order = await RepairOrder.findById(req.params.id).populate('equipmentId').populate('requester').populate('technician').populate('usedSpareParts.sparePartId');
    if (!order) {
      return res.status(404).json({ message: 'Repair order not found' });
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 分配维修工单
exports.assignRepairOrder = async (req, res) => {
  try {
    const { technician } = req.body;
    
    let order = await RepairOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Repair order not found' });
    }
    
    order.technician = technician;
    order.status = 'assigned';
    
    await order.save();
    
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 开始维修
exports.startRepair = async (req, res) => {
  try {
    let order = await RepairOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Repair order not found' });
    }
    
    order.status = 'inProgress';
    order.repairTime = new Date();
    
    await order.save();
    
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 完成维修
exports.completeRepair = async (req, res) => {
  try {
    const { faultReason, solution, usedSpareParts } = req.body;
    
    let order = await RepairOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Repair order not found' });
    }
    
    // 更新维修工单状态
    order.status = 'completed';
    order.faultReason = faultReason;
    order.solution = solution;
    order.usedSpareParts = usedSpareParts;
    order.completionTime = new Date();
    order.acceptanceStatus = 'pending';
    
    // 扣减备件库存
    for (const usedPart of usedSpareParts) {
      const sparePart = await SparePart.findById(usedPart.sparePartId);
      if (sparePart) {
        sparePart.stockQuantity -= usedPart.quantity;
        await sparePart.save();
        
        // 检查库存是否不足
        if (sparePart.stockQuantity < sparePart.minimumStock) {
          // 这里可以添加补货提醒逻辑
          console.log(`Spare part ${sparePart.name} is low in stock`);
        }
      }
    }
    
    await order.save();
    
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 验收维修
exports.acceptRepair = async (req, res) => {
  try {
    const { acceptanceStatus, acceptanceRemark } = req.body;
    
    let order = await RepairOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Repair order not found' });
    }
    
    order.acceptanceStatus = acceptanceStatus;
    order.acceptanceRemark = acceptanceRemark;
    
    if (acceptanceStatus === 'accepted') {
      order.status = 'closed';
      
      // 更新设备状态为正常
      const equipment = await Equipment.findById(order.equipmentId);
      if (equipment) {
        equipment.status = 'normal';
        await equipment.save();
      }
    } else if (acceptanceStatus === 'rejected') {
      order.status = 'rejected';
    }
    
    await order.save();
    
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};