import request from '../request';
import type { AuditLog } from '../../types';

export const getAuditLogs = (params?: any): Promise<AuditLog[]> => {
  return request.get('/audit-logs', { params });
};
