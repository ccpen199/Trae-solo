const { body, param, query, validationResult } = require('express-validator');
const { UserRole, StationStatus, CleaningOrderStatus, MaintenanceOrderStatus, FaultSeverity, HealthLevel } = require('../config/enums');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: '参数校验失败',
      details: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

const loginValidation = [
  body('username').isString().notEmpty().withMessage('用户名不能为空'),
  body('password').isString().notEmpty().withMessage('密码不能为空'),
  validate
];

const stationIdParamValidation = [
  param('stationId').isUUID().withMessage('电站ID格式不正确'),
  validate
];

const orderIdParamValidation = [
  param('orderId').isUUID().withMessage('工单ID格式不正确'),
  validate
];

const faultIdParamValidation = [
  param('faultId').isUUID().withMessage('故障ID格式不正确'),
  validate
];

const createStationValidation = [
  body('name').isString().notEmpty().isLength({ max: 100 }).withMessage('电站名称不能为空，最多100字符'),
  body('code').isString().notEmpty().isLength({ max: 20 }).withMessage('电站编号不能为空，最多20字符'),
  body('capacity_kw').isFloat({ min: 0 }).withMessage('装机容量必须为非负数'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('纬度必须在-90到90之间'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('经度必须在-180到180之间'),
  body('status').optional().isIn(Object.values(StationStatus)).withMessage('无效的电站状态'),
  body('pr_target').optional().isFloat({ min: 0, max: 1 }).withMessage('PR目标值必须在0到1之间'),
  validate
];

const updateStationValidation = [
  param('stationId').isUUID().withMessage('电站ID格式不正确'),
  body('name').optional().isString().notEmpty().isLength({ max: 100 }).withMessage('电站名称最多100字符'),
  body('capacity_kw').optional().isFloat({ min: 0 }).withMessage('装机容量必须为非负数'),
  body('status').optional().isIn(Object.values(StationStatus)).withMessage('无效的电站状态'),
  body('health_level').optional().isIn(Object.values(HealthLevel)).withMessage('无效的健康等级'),
  validate
];

const createCleaningOrderValidation = [
  body('stationId').isUUID().withMessage('电站ID格式不正确'),
  body('cause').isIn(Object.values(require('../config/enums').CleaningCause)).withMessage('无效的清洗原因'),
  body('current_degradation_percent').optional().isFloat({ min: 0, max: 100 }).withMessage('衰减百分比必须在0到100之间'),
  body('assigned_worker_id').optional().isUUID().withMessage('工人ID格式不正确'),
  body('priority').optional().isInt({ min: 1, max: 5 }).withMessage('优先级必须在1到5之间'),
  validate
];

const completeCleaningOrderValidation = [
  param('orderId').isUUID().withMessage('工单ID格式不正确'),
  body('worker_notes').optional().isString().isLength({ max: 500 }).withMessage('备注最多500字符'),
  validate
];

const createMaintenanceOrderValidation = [
  body('stationId').isUUID().withMessage('电站ID格式不正确'),
  body('problem_description').isString().notEmpty().isLength({ min: 5, max: 1000 }).withMessage('问题描述需要5到1000字符'),
  body('fault_id').optional().isUUID().withMessage('故障ID格式不正确'),
  body('assigned_worker_id').optional().isUUID().withMessage('工人ID格式不正确'),
  body('priority').optional().isInt({ min: 1, max: 5 }).withMessage('优先级必须在1到5之间'),
  body('estimated_repair_time_hours').optional().isFloat({ min: 0 }).withMessage('预计修复时间必须为非负数'),
  validate
];

const updateMaintenanceOrderValidation = [
  param('orderId').isUUID().withMessage('工单ID格式不正确'),
  body('status').optional().isIn(Object.values(MaintenanceOrderStatus)).withMessage('无效的维修单状态'),
  body('worker_feedback').optional().isString().isLength({ max: 1000 }).withMessage('反馈最多1000字符'),
  body('parts_used').optional().isString().isLength({ max: 500 }).withMessage('配件信息最多500字符'),
  validate
];

const inverterDataValidation = [
  body('inverter_id').isUUID().withMessage('逆变器ID格式不正确'),
  body('collect_time').optional().isISO8601().withMessage('采集时间格式不正确'),
  body('active_power').optional().isFloat({ min: 0 }).withMessage('有功功率必须为非负数'),
  body('dc_voltage').optional().isFloat().withMessage('直流电压格式不正确'),
  body('dc_current').optional().isFloat({ min: 0 }).withMessage('直流电流必须为非负数'),
  body('ac_voltage').optional().isFloat().withMessage('交流电压格式不正确'),
  body('ac_current').optional().isFloat({ min: 0 }).withMessage('交流电流必须为非负数'),
  body('efficiency').optional().isFloat({ min: 0, max: 1 }).withMessage('效率必须在0到1之间'),
  body('temperature').optional().isFloat().withMessage('温度格式不正确'),
  body('daily_generation_kwh').optional().isFloat({ min: 0 }).withMessage('日发电量必须为非负数'),
  body('total_generation_kwh').optional().isFloat({ min: 0 }).withMessage('累计发电量必须为非负数'),
  body('alarm_code').optional().isString().withMessage('告警码格式不正确'),
  validate
];

const settlementDateValidation = [
  query('start_date').optional().isDate().withMessage('开始日期格式不正确'),
  query('end_date').optional().isDate().withMessage('结束日期格式不正确'),
  validate
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须大于等于1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1到100之间'),
  validate
];

const createFaultValidation = [
  body('station_id').isUUID().withMessage('电站ID格式不正确'),
  body('inverter_id').optional().isUUID().withMessage('逆变器ID格式不正确'),
  body('string_id').optional().isUUID().withMessage('组串ID格式不正确'),
  body('fault_code').optional().isString().isLength({ max: 20 }).withMessage('故障码最多20字符'),
  body('fault_description').isString().notEmpty().isLength({ min: 5, max: 500 }).withMessage('故障描述需要5到500字符'),
  body('severity').isIn(Object.values(FaultSeverity)).withMessage('无效的故障严重程度'),
  validate
];

module.exports = {
  validate,
  loginValidation,
  stationIdParamValidation,
  orderIdParamValidation,
  faultIdParamValidation,
  createStationValidation,
  updateStationValidation,
  createCleaningOrderValidation,
  completeCleaningOrderValidation,
  createMaintenanceOrderValidation,
  updateMaintenanceOrderValidation,
  inverterDataValidation,
  settlementDateValidation,
  paginationValidation,
  createFaultValidation
};
