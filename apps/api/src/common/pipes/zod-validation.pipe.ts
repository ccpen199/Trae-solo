import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown): unknown {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));
        throw new BadRequestException({
          message: '参数验证失败',
          code: 'VALIDATION_ERROR',
          details: errors,
        });
      }
      throw new BadRequestException('验证失败');
    }
  }
}

export function ZodValidation(schema: ZodSchema) {
  return new ZodValidationPipe(schema);
}
