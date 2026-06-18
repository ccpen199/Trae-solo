import type { Request, Response, NextFunction } from 'express';
import type { Tenant } from '@neighborhood/shared';
import { prisma } from '../config/database.js';

declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
    }
  }
}

const SKIP_SUBDOMAIN_HOSTS = ['localhost', '127.0.0.1'];
const SKIP_TENANT_ROUTES = ['/api/auth/saml', '/api/auth/login', '/api/auth/register', '/api/auth/sms-code', '/api/auth/refresh', '/api/admin'];

export async function tenantResolver(req: Request, res: Response, next: NextFunction) {
  try {
    const hostname = req.hostname;

    if (SKIP_SUBDOMAIN_HOSTS.includes(hostname)) {
      return next();
    }

    for (const route of SKIP_TENANT_ROUTES) {
      if (req.path.startsWith(route)) {
        return next();
      }
    }

    const parts = hostname.split('.');
    if (parts.length < 3) {
      return next();
    }

    const subdomain = parts[0];

    const tenant = await prisma.tenant.findUnique({
      where: { subdomain },
    });

    if (!tenant) {
      return res.status(404).json({ code: 404, message: 'Tenant not found' });
    }

    if (tenant.status !== 'active') {
      return res.status(403).json({ code: 403, message: 'Tenant is not active' });
    }

    req.tenant = tenant as Tenant;
    next();
  } catch (error) {
    next(error);
  }
}
