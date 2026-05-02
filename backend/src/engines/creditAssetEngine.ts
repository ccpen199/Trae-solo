import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/database.js';
import { AuditService, auditActions } from '../services/auditService.js';
import { BusinessOrderService, BusinessOrderType } from '../services/businessOrderService.js';
import { PackageType, TransactionType, MemberPackageStatus } from '../types/index.js';

export interface CreditDeductionParams {
  memberId: string;
  packageId?: string;
  sessionsToDeduct: number;
  referenceType: string;
  referenceId: string;
  operatorId: string;
  operatorRole: string;
  description: string;
}

export interface CreditAdditionParams {
  memberId: string;
  packageId: string;
  totalSessions: number;
  price: number;
  expiryDate: Date;
  referenceType: string;
  referenceId: string;
  operatorId: string;
  operatorRole: string;
  description: string;
}

export interface DeductionResult {
  success: boolean;
  message: string;
  memberPackageId?: string;
  businessOrderId?: string;
  remainingSessions?: number;
}

export class CreditAssetEngine {
  static async deductCredit(params: CreditDeductionParams): Promise<DeductionResult> {
    const db = await getDb();
    const businessOrderId = BusinessOrderService.generateOrderNumber(BusinessOrderType.TRANSACTION);

    try {
      await db.run('BEGIN TRANSACTION');

      let memberPackage = null;
      
      if (params.packageId) {
        memberPackage = await db.get(`
          SELECT * FROM member_packages 
          WHERE member_id = ? AND package_id = ? AND status = 'active'
        `, [params.memberId, params.packageId]);
      } else {
        memberPackage = await db.get(`
          SELECT * FROM member_packages 
          WHERE member_id = ? AND status = 'active'
          ORDER BY remaining_sessions ASC
          LIMIT 1
        `, [params.memberId]);
      }

      if (!memberPackage) {
        await db.run('ROLLBACK');
        return {
          success: false,
          message: '没有可用的有效套餐'
        };
      }

      if (memberPackage.remaining_sessions < params.sessionsToDeduct) {
        await db.run('ROLLBACK');
        return {
          success: false,
          message: `课时不足，剩余 ${memberPackage.remaining_sessions} 课时，需要 ${params.sessionsToDeduct} 课时`
        };
      }

      const now = new Date();
      const expiryDate = new Date(memberPackage.expiry_date);
      
      if (now > expiryDate) {
        await db.run('ROLLBACK');
        return {
          success: false,
          message: '套餐已过期'
        };
      }

      const newRemainingSessions = memberPackage.remaining_sessions - params.sessionsToDeduct;
      const newStatus = newRemainingSessions <= 0 ? MemberPackageStatus.USED_UP : MemberPackageStatus.ACTIVE;

      const oldValue = {
        remainingSessions: memberPackage.remaining_sessions,
        status: memberPackage.status
      };

      const newValue = {
        remainingSessions: newRemainingSessions,
        status: newStatus
      };

      await db.run(`
        UPDATE member_packages 
        SET remaining_sessions = ?, status = ?, updated_at = ?
        WHERE id = ?
      `, [newRemainingSessions, newStatus, now.toISOString(), memberPackage.id]);

      const transactionId = uuidv4();
      await db.run(`
        INSERT INTO transactions (
          id, member_id, type, amount, sessions, reference_type, 
          reference_id, business_order_id, operator_id, description, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        transactionId,
        params.memberId,
        TransactionType.DEDUCTION,
        0,
        params.sessionsToDeduct,
        params.referenceType,
        params.referenceId,
        businessOrderId,
        params.operatorId,
        params.description,
        now.toISOString()
      ]);

      await db.run('COMMIT');

      await AuditService.log({
        action: auditActions.DEDUCT,
        entityType: 'MemberPackage',
        entityId: memberPackage.id,
        businessOrderId,
        operatorId: params.operatorId,
        operatorRole: params.operatorRole,
        oldValue,
        newValue,
        details: params.description
      });

      return {
        success: true,
        message: '扣减成功',
        memberPackageId: memberPackage.id,
        businessOrderId,
        remainingSessions: newRemainingSessions
      };

    } catch (error: any) {
      await db.run('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      await db.close();
    }
  }

  static async addCredit(params: CreditAdditionParams): Promise<{ success: boolean; message: string; memberPackageId?: string; businessOrderId?: string }> {
    const db = await getDb();
    const businessOrderId = BusinessOrderService.generateOrderNumber(BusinessOrderType.TRANSACTION);

    try {
      await db.run('BEGIN TRANSACTION');

      const pkg = await db.get('SELECT * FROM packages WHERE id = ?', [params.packageId]);
      
      if (!pkg) {
        await db.run('ROLLBACK');
        return {
          success: false,
          message: '套餐不存在'
        };
      }

      const memberPackageId = uuidv4();
      const now = new Date();

      await db.run(`
        INSERT INTO member_packages (
          id, member_id, package_id, total_sessions, remaining_sessions,
          purchase_date, expiry_date, status, business_order_id, created_by, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        memberPackageId,
        params.memberId,
        params.packageId,
        params.totalSessions,
        params.totalSessions,
        now.toISOString(),
        params.expiryDate.toISOString(),
        MemberPackageStatus.ACTIVE,
        businessOrderId,
        params.operatorId,
        now.toISOString(),
        now.toISOString()
      ]);

      const transactionId = uuidv4();
      await db.run(`
        INSERT INTO transactions (
          id, member_id, type, amount, sessions, reference_type, 
          reference_id, business_order_id, operator_id, description, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        transactionId,
        params.memberId,
        TransactionType.PURCHASE,
        params.price,
        params.totalSessions,
        params.referenceType,
        params.referenceId,
        businessOrderId,
        params.operatorId,
        params.description,
        now.toISOString()
      ]);

      await db.run('COMMIT');

      await AuditService.log({
        action: auditActions.PURCHASE,
        entityType: 'MemberPackage',
        entityId: memberPackageId,
        businessOrderId,
        operatorId: params.operatorId,
        operatorRole: params.operatorRole,
        newValue: {
          packageId: params.packageId,
          totalSessions: params.totalSessions,
          price: params.price,
          expiryDate: params.expiryDate
        },
        details: params.description
      });

      return {
        success: true,
        message: '添加成功',
        memberPackageId,
        businessOrderId
      };

    } catch (error: any) {
      await db.run('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      await db.close();
    }
  }

  static async checkMemberCredit(memberId: string): Promise<{
    totalSessions: number;
    usedSessions: number;
    remainingSessions: number;
    packages: any[];
  }> {
    const db = await getDb();

    const packages = await db.all(`
      SELECT mp.*, p.name as package_name, p.type as package_type, p.price as package_price
      FROM member_packages mp
      JOIN packages p ON mp.package_id = p.id
      WHERE mp.member_id = ?
      ORDER BY mp.created_at DESC
    `, [memberId]);

    const totalSessions = packages.reduce((sum, pkg) => sum + pkg.total_sessions, 0);
    const remainingSessions = packages.reduce((sum, pkg) => sum + pkg.remaining_sessions, 0);
    const usedSessions = totalSessions - remainingSessions;

    await db.close();

    return {
      totalSessions,
      usedSessions,
      remainingSessions,
      packages
    };
  }

  static async getMemberTransactions(memberId: string, limit: number = 50): Promise<any[]> {
    const db = await getDb();

    const transactions = await db.all(`
      SELECT t.*, u.name as operator_name
      FROM transactions t
      LEFT JOIN users u ON t.operator_id = u.id
      WHERE t.member_id = ?
      ORDER BY t.created_at DESC
      LIMIT ?
    `, [memberId, limit]);

    await db.close();
    return transactions;
  }
}
