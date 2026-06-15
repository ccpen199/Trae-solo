import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    const xForwardedFor = req.headers?.['x-forwarded-for'];
    let ip: string;
    if (xForwardedFor) {
      const ips = Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : xForwardedFor.split(',')[0];
      ip = ips?.trim() || req.ip || req.socket?.remoteAddress || 'unknown';
    } else {
      ip = req.ip || req.socket?.remoteAddress || 'unknown';
    }
    return Promise.resolve(ip);
  }
}
