const { body, param, query, validationResult } = require('express-validator');
const { BadRequestError } = require('./errorHandler');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg);
      return next(new BadRequestError(errorMessages.join('; ')));
    }

    next();
  };
};

const registerValidator = validate([
  body('phone')
    .notEmpty().withMessage('手机号不能为空')
    .isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('password')
    .notEmpty().withMessage('密码不能为空')
    .isLength({ min: 6, max: 20 }).withMessage('密码长度为6-20位'),
  body('nickname')
    .optional()
    .isLength({ max: 50 }).withMessage('昵称不能超过50个字符')
]);

const loginValidator = validate([
  body('phone')
    .notEmpty().withMessage('手机号不能为空')
    .isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('password')
    .notEmpty().withMessage('密码不能为空')
]);

const createHouseValidator = validate([
  body('title')
    .notEmpty().withMessage('标题不能为空')
    .isLength({ max: 100 }).withMessage('标题不能超过100个字符'),
  body('type')
    .notEmpty().withMessage('房源类型不能为空')
    .isIn(['apartment', 'house', 'villa', 'loft', 'studio']).withMessage('无效的房源类型'),
  body('city')
    .notEmpty().withMessage('城市不能为空'),
  body('address')
    .notEmpty().withMessage('地址不能为空'),
  body('pricePerNight')
    .notEmpty().withMessage('每晚价格不能为空')
    .isFloat({ min: 0 }).withMessage('价格必须大于等于0'),
  body('maxGuests')
    .optional()
    .isInt({ min: 1 }).withMessage('入住人数必须大于等于1')
]);

const houseSearchValidator = validate([
  query('city')
    .optional({ checkFalsy: true })
    .notEmpty().withMessage('城市不能为空'),
  query('checkInDate')
    .optional({ checkFalsy: true })
    .isDate().withMessage('入住日期格式错误'),
  query('checkOutDate')
    .optional({ checkFalsy: true })
    .isDate().withMessage('退房日期格式错误'),
  query('minPrice')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('最低价格必须大于等于0'),
  query('maxPrice')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('最高价格必须大于等于0'),
  query('page')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('页码必须大于等于1'),
  query('limit')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
]);

const createOrderValidator = validate([
  body('houseId')
    .notEmpty().withMessage('房源ID不能为空'),
  body('checkInDate')
    .notEmpty().withMessage('入住日期不能为空')
    .isDate().withMessage('入住日期格式错误'),
  body('checkOutDate')
    .notEmpty().withMessage('退房日期不能为空')
    .isDate().withMessage('退房日期格式错误'),
  body('guests')
    .optional()
    .isInt({ min: 1 }).withMessage('入住人数必须大于等于1')
]);

const createDemandValidator = validate([
  body('title')
    .notEmpty().withMessage('需求标题不能为空'),
  body('city')
    .notEmpty().withMessage('城市不能为空'),
  body('checkInDate')
    .notEmpty().withMessage('入住日期不能为空')
    .isDate().withMessage('入住日期格式错误'),
  body('checkOutDate')
    .notEmpty().withMessage('退房日期不能为空')
    .isDate().withMessage('退房日期格式错误')
]);

const idParamValidator = validate([
  param('id')
    .notEmpty().withMessage('ID不能为空')
    .isUUID().withMessage('ID格式错误')
]);

const sendMessageValidator = validate([
  body('content')
    .notEmpty().withMessage('消息内容不能为空'),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'order', 'system']).withMessage('无效的消息类型')
]);

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  createHouseValidator,
  houseSearchValidator,
  createOrderValidator,
  createDemandValidator,
  idParamValidator,
  sendMessageValidator
};
