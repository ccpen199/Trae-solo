import prisma from '../../utils/prisma';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLogData {
  userId: string;
  action: string;
  module: string;
  targetType: string;
  targetId?: string;
  description?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  riskLevel?: string;
  status: string;
  errorMessage?: string;
}

export interface ApprovalLevelInfo {
  level: number;
  requiredRoles: string[];
  threshold: number;
}

const APPROVAL_LEVELS: ApprovalLevelInfo[] = [
  { level: 1, requiredRoles: ['FINANCIAL_MANAGER', 'CFO', 'ADMIN'], threshold: 10000 },
  { level: 2, requiredRoles: ['CFO', 'ADMIN'], threshold: 100000 },
  { level: 3, requiredRoles: ['CFO', 'ADMIN'], threshold: Infinity },
];

class SecurityVault {
  async recordAuditLog(data: AuditLogData): Promise<any> {
    try {
      const log = await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action || 'VIEW',
          module: data.module || 'SYSTEM',
          targetType: data.targetType,
          targetId: data.targetId,
          description: data.description,
          oldValue: data.oldValue,
          newValue: data.newValue,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          requestId: data.requestId || uuidv4(),
          riskLevel: data.riskLevel || 'LOW',
          status: data.status || 'SUCCESS',
          errorMessage: data.errorMessage,
        },
      });
      return log;
    } catch (error) {
      console.error('Failed to record audit log:', error);
      return null;
    }
  }

  async checkPaymentApprovalLevel(amount: number): Promise<ApprovalLevelInfo> {
    const amountNum = Number(amount);
    
    if (amountNum < APPROVAL_LEVELS[0].threshold) {
      return APPROVAL_LEVELS[0];
    }
    
    if (amountNum < APPROVAL_LEVELS[1].threshold) {
      return APPROVAL_LEVELS[1];
    }
    
    return APPROVAL_LEVELS[2];
  }

  async verifyCertificate(certificateId: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const cert = await prisma.securityCertificate.findUnique({
        where: { id: certificateId },
      });

      if (!cert) {
        return { valid: false, error: '证书不存在' };
      }

      if (cert.status !== 'ACTIVE') {
        return { valid: false, error: `证书状态无效: ${cert.status}` };
      }

      const now = new Date();
      if (now < cert.validFrom) {
        return { valid: false, error: '证书尚未生效' };
      }
      if (now > cert.validTo) {
        return { valid: false, error: '证书已过期' };
      }

      await prisma.securityCertificate.update({
        where: { id: certificateId },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
        },
      });

      return { valid: true };
    } catch (error) {
      console.error('Certificate verification error:', error);
      return { valid: false, error: '证书验证失败' };
    }
  }

  determineRiskLevel(module: string, action: string): string {
    const highRiskActions = ['DELETE', 'APPROVE', 'REJECT', 'SYNC', 'EXECUTE'];
    const highRiskModules = ['PAYMENT', 'APPROVAL', 'BANK_ACCOUNT'];

    if (highRiskActions.includes(action) && highRiskModules.includes(module)) {
      return 'HIGH';
    }
    if (highRiskActions.includes(action) || highRiskModules.includes(module)) {
      return 'MEDIUM';
    }
    return 'LOW';
  }
}

const securityVault = new SecurityVault();
export default securityVault;
