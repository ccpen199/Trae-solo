const dispatchService = require('../services/dispatchService');

const createDispatch = async (req, res) => {
  try {
    const { orderId, vehicleId, dispatchType, priority, description, expectedTime } = req.body;
    const dispatcher = req.user;
    
    if (!orderId || !vehicleId || !dispatchType) {
      return res.status(400).json({
        success: false,
        message: '订单ID、车辆ID和调度类型不能为空'
      });
    }
    
    const result = await dispatchService.createDispatch(
      orderId,
      vehicleId,
      dispatcher,
      dispatchType,
      {
        priority,
        description,
        expectedTime
      }
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '创建调度失败'
    });
  }
};

const assignOperator = async (req, res) => {
  try {
    const { dispatchId } = req.params;
    const { operatorId } = req.body;
    const dispatcher = req.user;
    
    if (!dispatchId || !operatorId) {
      return res.status(400).json({
        success: false,
        message: '调度单ID和运维人员ID不能为空'
      });
    }
    
    const result = await dispatchService.assignOperator(
      dispatchId,
      dispatcher,
      operatorId
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '派单失败'
    });
  }
};

const completeDispatch = async (req, res) => {
  try {
    const { dispatchId } = req.params;
    const { result } = req.body;
    const operator = req.user;
    
    if (!dispatchId) {
      return res.status(400).json({
        success: false,
        message: '调度单ID不能为空'
      });
    }
    
    const completionResult = await dispatchService.completeDispatch(
      dispatchId,
      operator,
      result
    );
    
    res.json({
      success: true,
      data: completionResult
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '完成调度失败'
    });
  }
};

const getDispatches = async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const user = req.user;
    
    const dispatches = await dispatchService.getDispatches(user, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: dispatches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '获取调度列表失败'
    });
  }
};

const getVehicles = async (req, res) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;
    
    const vehicles = await dispatchService.getAvailableVehicles({
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '获取车辆列表失败'
    });
  }
};

module.exports = {
  createDispatch,
  assignOperator,
  completeDispatch,
  getDispatches,
  getVehicles
};
