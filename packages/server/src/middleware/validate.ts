import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { error } from '../utils/response';

export const validate = (schema: Joi.ObjectSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error: validationError } = schema.validate(req[source], {
      abortEarly: false,
      allowUnknown: false,
    });

    if (validationError) {
      const messages = validationError.details.map((d) => d.message).join(', ');
      error(res, messages, 422);
      return;
    }

    next();
  };
};

export default validate;
