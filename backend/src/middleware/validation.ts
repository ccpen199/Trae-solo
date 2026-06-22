import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { error } from '../utils/response';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error: validationError } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
    });

    if (validationError) {
      const errors = validationError.details.map((detail) => detail.message);
      return error(res, `参数验证失败: ${errors.join(', ')}`, 400);
    }

    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error: validationError } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: true,
    });

    if (validationError) {
      const errors = validationError.details.map((detail) => detail.message);
      return error(res, `查询参数验证失败: ${errors.join(', ')}`, 400);
    }

    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error: validationError } = schema.validate(req.params, {
      abortEarly: false,
      allowUnknown: true,
    });

    if (validationError) {
      const errors = validationError.details.map((detail) => detail.message);
      return error(res, `路径参数验证失败: ${errors.join(', ')}`, 400);
    }

    next();
  };
};
