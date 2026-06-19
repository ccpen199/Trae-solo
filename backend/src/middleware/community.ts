import type { Request, Response, NextFunction } from 'express';
import { isIP } from 'net';
import { getDb } from '../database';
import type { AuthenticatedRequest, Community } from '../types';

export function extractSubdomain(req: Request, res: Response, next: NextFunction): void {
  const host = (req.headers.host || '').split(':')[0];
  const parts = host.split('.');
  const subdomain = parts.length >= 3 ? parts[0] : '';

  (req as AuthenticatedRequest).community = undefined;

  if (host !== 'localhost' && !isIP(host) && subdomain && subdomain !== 'www' && subdomain !== 'api') {
    (req as any).__subdomain = subdomain;
  }

  next();
}

export function resolveCommunity(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;
  const subdomain = (req as any).__subdomain;

  const db = getDb();

  if (subdomain) {
    const community = db.prepare('SELECT * FROM communities WHERE subdomain = ?').get(subdomain) as Community | undefined;

    if (!community) {
      res.status(404).json({ success: false, error: '社区不存在' });
      return;
    }

    authReq.community = community;
    next();
    return;
  }

  const communityIdHeader = req.headers['x-community-id'] as string | undefined;
  if (communityIdHeader) {
    const community = db.prepare('SELECT * FROM communities WHERE id = ?').get(parseInt(communityIdHeader)) as Community | undefined;

    if (community) {
      authReq.community = community;
    }
  }

  next();
}
