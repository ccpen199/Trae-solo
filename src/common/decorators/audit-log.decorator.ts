import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log';

export type AuditLogAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'query'
  | 'export'
  | 'import'
  | 'login'
  | 'logout'
  | 'upload'
  | 'download'
  | 'approve'
  | 'reject'
  | string;

export interface AuditLogOption {
  module: string;
  action: AuditLogAction;
  description?: string;
  recordRequest?: boolean;
  recordResponse?: boolean;
  excludeFields?: string[];
}

export const AuditLog = (
  options: AuditLogOption,
): ReturnType<typeof SetMetadata> => {
  return SetMetadata<string, AuditLogOption>(AUDIT_LOG_KEY, {
    recordRequest: true,
    recordResponse: false,
    excludeFields: [],
    ...options,
  });
};
