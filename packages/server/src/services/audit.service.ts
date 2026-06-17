import { prisma } from '../utils/prisma';
import { JWTPayload } from '@platform/shared';

export async function createAuditLog(
  user: JWTPayload | { userId: string },
  actionType: string,
  targetType: string,
  options: {
    targetId?: string;
    beforeData?: any;
    afterData?: any;
    ipAddress?: string;
    traceId?: string;
  } = {},
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        actionType,
        targetType,
        targetId: options.targetId,
        beforeData: options.beforeData,
        afterData: options.afterData,
        ipAddress: options.ipAddress,
        traceId: options.traceId,
      },
    });
  } catch (err) {
    console.error('Audit log create failed:', err);
  }
}

export const AuditActions = {
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  IDENTITY_VERIFY_SUBMIT: 'IDENTITY_VERIFY_SUBMIT',
  IDENTITY_VERIFY_PASS: 'IDENTITY_VERIFY_PASS',
  IDENTITY_VERIFY_REJECT: 'IDENTITY_VERIFY_REJECT',
  ORDER_CREATE: 'ORDER_CREATE',
  ORDER_STATUS_CHANGE: 'ORDER_STATUS_CHANGE',
  ORDER_CANCEL: 'ORDER_CANCEL',
  PAYMENT_INIT: 'PAYMENT_INIT',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_REFUND: 'PAYMENT_REFUND',
  OCR_SUBMIT: 'OCR_SUBMIT',
  OCR_RESULT: 'OCR_RESULT',
  COURIER_TASK_ASSIGN: 'COURIER_TASK_ASSIGN',
  COURIER_TASK_ACCEPT: 'COURIER_TASK_ACCEPT',
  COURIER_TASK_COMPLETE: 'COURIER_TASK_COMPLETE',
  APPROVAL_SUBMIT: 'APPROVAL_SUBMIT',
  APPROVAL_PASS: 'APPROVAL_PASS',
  APPROVAL_REJECT: 'APPROVAL_REJECT',
  CITY_CONFIG_UPDATE: 'CITY_CONFIG_UPDATE',
  FUND_TRANSFER: 'FUND_TRANSFER',
  ALERT_HANDLE: 'ALERT_HANDLE',
} as const;
