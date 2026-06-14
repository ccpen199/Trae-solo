import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';

export const success = (data: any = null, message: string = 'success') => {
  return {
    code: 200,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

export const error = (message: string = 'error', code: number = 500, data: any = null) => {
  return {
    code,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

export const getPagination = (page: number = 1, pageSize: number = 10) => {
  const p = Math.max(1, Number(page) || 1);
  const ps = Math.max(1, Math.min(100, Number(pageSize) || 10));
  const offset = (p - 1) * ps;
  return { page: p, pageSize: ps, offset, limit: ps };
};

export const getPagedResult = <T>(items: T[], total: number, page: number, pageSize: number) => {
  return {
    list: items,
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
};

export const generateRequestNo = () => {
  const timestamp = dayjs().format('YYYYMMDDHHmmss');
  const random = Math.floor(100000 + Math.random() * 900000);
  return `TASK${timestamp}${random}`;
};

export const generateTransactionNo = () => {
  const timestamp = dayjs().format('YYYYMMDDHHmmss');
  const random = Math.floor(100000 + Math.random() * 900000);
  return `TXN${timestamp}${random}`;
};

export const generateToken = (user: { id: number; email: string; userType: string; name: string }) => {
  const secret = process.env.JWT_SECRET || 'crowdsourcing-platform-secret-key-2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  return (jwt.sign as any)(
    { id: user.id, email: user.email, userType: user.userType, name: user.name },
    secret,
    { expiresIn }
  );
};

export const hashPassword = (password: string) => {
  return bcrypt.hashSync(password, 10);
};

export const comparePassword = (password: string, hash: string) => {
  return bcrypt.compareSync(password, hash);
};

export const generateHash = (content: string) => {
  return createHash('sha256').update(content + uuidv4() + Date.now()).digest('hex');
};

export const generateEvidenceHash = (data: any) => {
  const content = JSON.stringify(data) + Date.now() + uuidv4();
  return createHash('sha256').update(content).digest('hex');
};

export const logAudit = (
  userId: number | null,
  module: string,
  action: string,
  options: {
    targetId?: number;
    targetType?: string;
    details?: any;
    ip?: string;
    userAgent?: string;
    riskLevel?: 'low' | 'medium' | 'high';
  } = {}
) => {
  const { targetId, targetType, details, ip, userAgent, riskLevel = 'low' } = options;

  db.prepare(`
    INSERT INTO audit_logs (userId, module, action, targetId, targetType, details, ip, userAgent, riskLevel)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    module,
    action,
    targetId,
    targetType,
    details ? JSON.stringify(details) : null,
    ip,
    userAgent,
    riskLevel
  );
};

export const parseJsonField = <T = any>(value: string | null, defaultValue: T): T => {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
};

export const stringifyJsonField = (value: any): string | null => {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
};

export const toFrontendRole = (userType?: string) => {
  if (userType === 'platform') return 'employer';
  if (userType === 'ops') return 'provider';
  return userType || 'employer';
};

export const toBackendUserType = (role?: string) => {
  if (role === 'employer') return 'platform';
  if (role === 'provider') return 'ops';
  return role || 'platform';
};

export const normalizeUser = (user: any) => {
  if (!user) return user;
  return {
    ...user,
    role: toBackendUserType(user.userType || user.role),
    verified: Boolean(user.realNameVerified ?? user.verified ?? false),
    rating: Number(user.rating ?? 5),
    reviewCount: Number(user.reviewCount ?? 0),
  };
};

export const normalizeTask = (task: any) => {
  if (!task) return task;
  const skills = Array.isArray(task.skills)
    ? task.skills
    : parseJsonField(task.skillsRequired, []);
  const attachments = Array.isArray(task.attachments)
    ? task.attachments
    : parseJsonField(task.attachments, []);
  const status = task.status === 'pending_review'
    ? 'pending'
    : task.status === 'revision'
    ? 'revising'
    : task.status;

  return {
    ...task,
    status,
    taskNo: task.taskNo || task.requestNo,
    skills,
    skillsRequired: skills,
    attachments,
    category: task.category || task.categoryName || 'consulting',
    selectedProviderId: task.selectedProviderId || task.providerId,
    selectedProviderName: task.selectedProviderName || task.providerName,
    bidCount: Number(task.bidCount ?? 0),
    viewCount: Number(task.viewCount ?? 0),
    milestones: Array.isArray(task.milestones) ? task.milestones : [],
    deliveryStandards: Array.isArray(task.deliveryStandards) ? task.deliveryStandards : [],
  };
};

export const normalizeProvider = (provider: any) => {
  if (!provider) return provider;
  const skills = Array.isArray(provider.skills)
    ? provider.skills
    : parseJsonField(provider.skills, []);
  return normalizeUser({
    ...provider,
    role: 'provider',
    nickname: provider.nickname || provider.name,
    skills,
    reviewCount: Number(provider.reviewCount ?? provider.completedTasks ?? 0),
    verified: provider.verified ?? provider.verificationStatus === 'verified',
  });
};
