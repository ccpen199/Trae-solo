import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { error } from './response';

export function validateRequest(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(e => e.msg).join('; ');
    return error(res, errorMessages);
  }
  next();
}

export const registerValidation = [
  body('account')
    .notEmpty().withMessage('账号不能为空')
    .isLength({ min: 3, max: 20 }).withMessage('账号长度必须在 3-20 个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('账号只能包含字母、数字和下划线'),
  body('password')
    .notEmpty().withMessage('密码不能为空'),
  body('nickname')
    .notEmpty().withMessage('昵称不能为空')
    .isLength({ max: 50 }).withMessage('昵称不能超过 50 个字符'),
  body('email')
    .optional()
    .isEmail().withMessage('邮箱格式不正确'),
  body('phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
  validateRequest,
];

export const loginValidation = [
  body('account')
    .notEmpty().withMessage('账号不能为空'),
  body('password')
    .notEmpty().withMessage('密码不能为空'),
  validateRequest,
];

export const updateProfileValidation = [
  body('nickname')
    .optional()
    .isLength({ max: 50 }).withMessage('昵称不能超过 50 个字符'),
  body('email')
    .optional()
    .isEmail().withMessage('邮箱格式不正确'),
  body('phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
  body('avatar')
    .optional()
    .isURL().withMessage('头像地址格式不正确'),
  validateRequest,
];

export const changePasswordValidation = [
  body('oldPassword')
    .notEmpty().withMessage('原密码不能为空'),
  body('newPassword')
    .notEmpty().withMessage('新密码不能为空'),
  validateRequest,
];

export const createUserValidation = [
  body('account')
    .notEmpty().withMessage('账号不能为空')
    .isLength({ min: 3, max: 20 }).withMessage('账号长度必须在 3-20 个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('账号只能包含字母、数字和下划线'),
  body('password')
    .notEmpty().withMessage('密码不能为空'),
  body('nickname')
    .notEmpty().withMessage('昵称不能为空'),
  body('roleId')
    .notEmpty().withMessage('角色不能为空'),
  validateRequest,
];

export const updateUserValidation = [
  body('nickname')
    .optional()
    .isLength({ max: 50 }).withMessage('昵称不能超过 50 个字符'),
  body('email')
    .optional()
    .isEmail().withMessage('邮箱格式不正确'),
  body('phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
  validateRequest,
];
