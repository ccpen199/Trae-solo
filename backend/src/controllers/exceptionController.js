const exceptionService = require('../services/exceptionService');

const reportException = async (req, res) => {
  try {
    const { orderId, exceptionType, title, description, lat, lng } = req.body;
    const userId = req.user.id;
    
    if (!orderId || !exceptionType || !title) {
      return res.status(400).json({
        success: false,
        message: '订单ID、异常类型和标题不能为空'
      });
    }
    
    const result = await exceptionService.reportException(
      orderId,
      userId,
      exceptionType,
      title,
      description,
      { lat, lng }
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '上报异常失败'
    });
  }
};

const processException = async (req, res) => {
  try {
    const { exceptionId } = req.params;
    const { action, comment } = req.body;
    const operator = req.user;
    
    if (!exceptionId || !action) {
      return res.status(400).json({
        success: false,
        message: '异常单ID和处理动作不能为空'
      });
    }
    
    const validActions = ['approve', 'reject', 'request_more_info', 'reassign'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: '无效的处理动作'
      });
    }
    
    const result = await exceptionService.processException(
      exceptionId,
      operator,
      action,
      comment
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '处理异常失败'
    });
  }
};

const getExceptions = async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const operator = req.user;
    
    const exceptions = await exceptionService.getExceptions(operator, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: exceptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '获取异常列表失败'
    });
  }
};

module.exports = {
  reportException,
  processException,
  getExceptions
};
