import {
  Injectable,
  NestMiddleware,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Reflector } from '@nestjs/core';
import { Sm4Util } from '../utils/sm4.util';
import { SM4_DECRYPT_KEY, Sm4DecryptOption } from '../decorators/sm4-decrypt.decorator';

@Injectable()
export class Sm4EncryptMiddleware implements NestMiddleware {
  private readonly logger = new Logger(Sm4EncryptMiddleware.name);

  constructor(
    private readonly sm4Util: Sm4Util,
    private readonly reflector: Reflector,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const decryptOption = this.getSm4DecryptOption(req);

    this.decryptRequestBody(req, decryptOption);
    this.patchResponseEncryption(res);

    next();
  }

  private getSm4DecryptOption(req: Request): Sm4DecryptOption | undefined {
    const handler = this.extractHandler(req);
    if (!handler) {
      return undefined;
    }
    return this.reflector.get<Sm4DecryptOption>(SM4_DECRYPT_KEY, handler);
  }

  private extractHandler(req: Request): CallableFunction | undefined {
    const typedReq = req as {
      route?: { stack?: Array<{ handle?: CallableFunction }> };
    };
    if (typedReq.route?.stack?.length) {
      return typedReq.route.stack.find((layer) => layer.handle)?.handle;
    }
    return undefined;
  }

  private decryptRequestBody(
    req: Request,
    option?: Sm4DecryptOption,
  ): void {
    if (!req.body || typeof req.body !== 'object') {
      return;
    }

    if (!option) {
      return;
    }

    try {
      if (option.decryptAll) {
        const encryptedData = req.body.data as string | undefined;
        if (encryptedData && typeof encryptedData === 'string') {
          req.body = this.sm4Util.decryptObject<Record<string, unknown>>(
            encryptedData,
          );
          return;
        }
        req.body = this.sm4Util.decryptValue(req.body) as Record<
          string,
          unknown
        >;
        return;
      }

      if (option.fields && option.fields.length > 0) {
        for (const field of option.fields) {
          if (req.body[field] && typeof req.body[field] === 'string') {
            req.body[field] = this.sm4Util.decrypt(req.body[field] as string);
          }
        }
      }
    } catch (error) {
      this.logger.error(`SM4请求解密失败: ${(error as Error).message}`);
      throw new BadRequestException('请求数据解密失败，请检查加密格式');
    }
  }

  private patchResponseEncryption(res: Response): void {
    const originalSend = res.json.bind(res);

    res.json = ((body: unknown): Response => {
      const shouldEncrypt = res.getHeader('X-Encrypt-Response') === 'true';
      if (!shouldEncrypt) {
        return originalSend(body);
      }
      try {
        if (body && typeof body === 'object') {
          const encryptedData = this.sm4Util.encryptObject(
            body as Record<string, unknown>,
          );
          return originalSend({ data: encryptedData });
        }
        return originalSend(body);
      } catch (error) {
        this.logger.error(`SM4响应加密失败: ${(error as Error).message}`);
        return originalSend(body);
      }
    }) as Response['json'];
  }
}
