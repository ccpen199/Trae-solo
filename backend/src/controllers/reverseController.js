const { ReverseOrderEngine, REVERSE_TYPES, REVERSE_STATUSES } = require('../engines/reverseOrderEngine');

exports.createReverseOrder = async (req, res) => {
  try {
    const { originalOrderId, reverseType, reason } = req.body;
    const userId = req.user.id;
    
    if (!originalOrderId || !reverseType) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const validTypes = Object.values(REVERSE_TYPES);
    if (!validTypes.includes(reverseType)) {
      return res.status(400).json({ error: '无效的逆向类型' });
    }
    
    const result = await ReverseOrderEngine.createReverseOrder(
      originalOrderId,
      reverseType,
      reason || '',
      userId
    );
    
    res.status(201).json(result);
  } catch (err) {
    console.error('创建逆向单错误:', err);
    res.status(500).json({ error: err.message || '创建逆向单失败' });
  }
};

exports.getReverseOrders = async (req, res) => {
  try {
    const { originalOrderId } = req.query;
    
    if (!originalOrderId) {
      return res.status(400).json({ error: '缺少原订单ID' });
    }
    
    const reverseOrders = await ReverseOrderEngine.getReverseOrders(originalOrderId);
    res.json(reverseOrders);
  } catch (err) {
    console.error('获取逆向单列表错误:', err);
    res.status(500).json({ error: '获取逆向单列表失败' });
  }
};

exports.updateReverseStatus = async (req, res) => {
  try {
    const reverseOrderId = req.params.id;
    const { newStatus, comment } = req.body;
    const userId = req.user.id;
    
    if (!newStatus) {
      return res.status(400).json({ error: '缺少新状态' });
    }
    
    const validStatuses = Object.values(REVERSE_STATUSES);
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: '无效的状态' });
    }
    
    const result = await ReverseOrderEngine.updateReverseStatus(
      reverseOrderId,
      newStatus,
      userId,
      comment
    );
    
    res.json(result);
  } catch (err) {
    console.error('更新逆向单状态错误:', err);
    res.status(500).json({ error: err.message || '更新逆向单状态失败' });
  }
};

exports.validateWithMainLedger = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    const result = await ReverseOrderEngine.validateWithMainLedger(orderId);
    res.json(result);
  } catch (err) {
    console.error('校验主台账错误:', err);
    res.status(500).json({ error: err.message || '校验主台账失败' });
  }
};

exports.getReverseTypes = (req, res) => {
  res.json(ReverseOrderEngine.getReverseTypeInfo());
};

exports.getValidTransitions = (req, res) => {
  const currentStatus = req.query.currentStatus;
  
  if (!currentStatus) {
    return res.status(400).json({ error: '缺少当前状态' });
  }
  
  const transitions = ReverseOrderEngine.getValidStatusTransitions(currentStatus);
  res.json({
    currentStatus,
    validTransitions: transitions
  });
};
