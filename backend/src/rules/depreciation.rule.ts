import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database';
import { AssetDetail, DepreciationRecord, DepreciationMethod, AssetStatus, ApprovalAction } from '../types';

export interface DepreciationCalculation {
  period: string;
  originalValue: number;
  accumulatedDepreciation: number;
  netValue: number;
  depreciationAmount: number;
  depreciationMethod: DepreciationMethod;
}

export interface DepreciationApprovalRequest {
  recordId: string;
  masterId: string;
  assetDetailId: string;
  action: ApprovalAction;
  remarks: string;
  userId: string;
  userName: string;
  reassignTo?: string;
}

export class DepreciationRuleEngine {
  private db: Database;
  private now: string;

  constructor(db: Database) {
    this.db = db;
    this.now = new Date().toISOString();
  }

  calculateStraightLine(
    originalValue: number,
    residualValueRate: number,
    useLifeMonths: number,
    accumulatedDepreciation: number
  ): { monthlyDepreciation: number; accumulatedDepreciation: number; netValue: number } {
    const residualValue = originalValue * residualValueRate;
    const totalDepreciableValue = originalValue - residualValue;
    const monthlyDepreciation = totalDepreciableValue / useLifeMonths;
    
    const newAccumulatedDepreciation = accumulatedDepreciation + monthlyDepreciation;
    const netValue = originalValue - newAccumulatedDepreciation;

    return {
      monthlyDepreciation: this.round(monthlyDepreciation, 2),
      accumulatedDepreciation: this.round(newAccumulatedDepreciation, 2),
      netValue: this.round(Math.max(netValue, residualValue), 2)
    };
  }

  calculateDecliningBalance(
    originalValue: number,
    residualValueRate: number,
    useLifeMonths: number,
    accumulatedDepreciation: number,
    period: number
  ): { monthlyDepreciation: number; accumulatedDepreciation: number; netValue: number } {
    const residualValue = originalValue * residualValueRate;
    const netBookValue = originalValue - accumulatedDepreciation;
    
    const depreciationRate = 2 / (useLifeMonths / 12);
    const monthlyRate = depreciationRate / 12;
    
    let monthlyDepreciation = netBookValue * monthlyRate;
    
    if (netBookValue - monthlyDepreciation < residualValue) {
      monthlyDepreciation = netBookValue - residualValue;
    }

    const newAccumulatedDepreciation = accumulatedDepreciation + monthlyDepreciation;
    const netValue = originalValue - newAccumulatedDepreciation;

    return {
      monthlyDepreciation: this.round(monthlyDepreciation, 2),
      accumulatedDepreciation: this.round(newAccumulatedDepreciation, 2),
      netValue: this.round(Math.max(netValue, residualValue), 2)
    };
  }

  calculateSumOfYearsDigits(
    originalValue: number,
    residualValueRate: number,
    useLifeMonths: number,
    accumulatedDepreciation: number,
    period: number
  ): { monthlyDepreciation: number; accumulatedDepreciation: number; netValue: number } {
    const residualValue = originalValue * residualValueRate;
    const totalDepreciableValue = originalValue - residualValue;
    
    const useLifeYears = Math.ceil(useLifeMonths / 12);
    const sumOfYears = (useLifeYears * (useLifeYears + 1)) / 2;
    
    const currentYear = Math.ceil(period / 12);
    const remainingLife = useLifeYears - currentYear + 1;
    
    const yearlyDepreciation = totalDepreciableValue * (remainingLife / sumOfYears);
    const monthlyDepreciation = yearlyDepreciation / 12;

    const newAccumulatedDepreciation = accumulatedDepreciation + monthlyDepreciation;
    const netValue = originalValue - newAccumulatedDepreciation;

    return {
      monthlyDepreciation: this.round(monthlyDepreciation, 2),
      accumulatedDepreciation: this.round(newAccumulatedDepreciation, 2),
      netValue: this.round(Math.max(netValue, residualValue), 2)
    };
  }

  calculateDepreciation(
    asset: AssetDetail,
    period: string
  ): DepreciationCalculation {
    const existingRecords = this.db.all<DepreciationRecord>(
      `SELECT * FROM depreciation_records WHERE assetDetailId = ? ORDER BY createdAt DESC`,
      [asset.id]
    );

    const accumulatedDepreciation = existingRecords.reduce((sum, r) => sum + r.depreciationAmount, 0);
    const periodCount = existingRecords.length + 1;

    let result;
    switch (asset.depreciationMethod) {
      case 'DECLINING_BALANCE':
        result = this.calculateDecliningBalance(
          asset.totalPrice,
          asset.residualValueRate,
          asset.useLife,
          accumulatedDepreciation,
          periodCount
        );
        break;
      case 'SUM_OF_YEARS_DIGITS':
        result = this.calculateSumOfYearsDigits(
          asset.totalPrice,
          asset.residualValueRate,
          asset.useLife,
          accumulatedDepreciation,
          periodCount
        );
        break;
      case 'STRAIGHT_LINE':
      default:
        result = this.calculateStraightLine(
          asset.totalPrice,
          asset.residualValueRate,
          asset.useLife,
          accumulatedDepreciation
        );
        break;
    }

    return {
      period,
      originalValue: asset.totalPrice,
      accumulatedDepreciation: result.accumulatedDepreciation,
      netValue: result.netValue,
      depreciationAmount: result.monthlyDepreciation,
      depreciationMethod: asset.depreciationMethod
    };
  }

  generatePeriod(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  createDepreciationRecord(
    assetDetailId: string,
    masterId: string,
    calculation: DepreciationCalculation
  ): string {
    const recordId = uuidv4();
    
    this.db.run(
      `INSERT INTO depreciation_records (
        id, assetDetailId, period, originalValue, accumulatedDepreciation,
        netValue, depreciationAmount, depreciationMethod, status, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recordId,
        assetDetailId,
        calculation.period,
        calculation.originalValue,
        calculation.accumulatedDepreciation,
        calculation.netValue,
        calculation.depreciationAmount,
        calculation.depreciationMethod,
        'PENDING',
        this.now
      ]
    );

    return recordId;
  }

  validateApproval(request: DepreciationApprovalRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.recordId) {
      errors.push('折旧记录ID不能为空');
    }

    if (!request.action) {
      errors.push('审批动作不能为空');
    }

    const record = this.db.get<DepreciationRecord>(
      `SELECT * FROM depreciation_records WHERE id = ?`,
      [request.recordId]
    );

    if (!record) {
      errors.push('折旧记录不存在');
    } else if (record.status !== 'PENDING') {
      errors.push('该折旧记录已被处理');
    }

    if (request.action === 'REASSIGN' && !request.reassignTo) {
      errors.push('转派必须指定目标用户');
    }

    return { valid: errors.length === 0, errors };
  }

  processApproval(request: DepreciationApprovalRequest): { success: boolean; status: string; errors: string[] } {
    const validation = this.validateApproval(request);
    if (!validation.valid) {
      return { success: false, status: '', errors: validation.errors };
    }

    const record = this.db.get<DepreciationRecord>(
      `SELECT * FROM depreciation_records WHERE id = ?`,
      [request.recordId]
    );

    if (!record) {
      return { success: false, status: '', errors: ['折旧记录不存在'] };
    }

    let newStatus = record.status;
    const timestamp = new Date().toISOString();

    switch (request.action) {
      case 'APPROVE':
        newStatus = 'APPROVED';
        this.db.run(
          `UPDATE depreciation_records SET status = ?, approvedBy = ?, approvedAt = ? WHERE id = ?`,
          [newStatus, request.userId, timestamp, request.recordId]
        );
        
        this.updateAssetAfterApproval(record.assetDetailId);
        break;

      case 'REJECT':
        newStatus = 'REJECTED';
        this.db.run(
          `UPDATE depreciation_records SET status = ?, approvedBy = ?, approvedAt = ? WHERE id = ?`,
          [newStatus, request.userId, timestamp, request.recordId]
        );
        
        this.createTimelineRecord(
          request.masterId,
          record.assetDetailId,
          request.userId,
          request.userName,
          '驳回折旧申请',
          'PENDING_DEPRECIATION',
          request.action,
          request.remarks
        );
        break;

      case 'SUPPLEMENT':
        this.createTimelineRecord(
          request.masterId,
          record.assetDetailId,
          request.userId,
          request.userName,
          '要求补充资料',
          'PENDING_DEPRECIATION',
          request.action,
          request.remarks
        );
        break;

      case 'REASSIGN':
        if (request.reassignTo) {
          this.createTimelineRecord(
            request.masterId,
            record.assetDetailId,
            request.userId,
            request.userName,
            `转派给用户 ${request.reassignTo}`,
            'PENDING_DEPRECIATION',
            request.action,
            request.remarks
          );
        }
        break;
    }

    return { success: true, status: newStatus, errors: [] };
  }

  private updateAssetAfterApproval(assetDetailId: string): void {
    const latestRecord = this.db.get<DepreciationRecord>(
      `SELECT * FROM depreciation_records WHERE assetDetailId = ? AND status = 'APPROVED' ORDER BY createdAt DESC LIMIT 1`,
      [assetDetailId]
    );

    if (latestRecord) {
      const isFullyDepreciated = latestRecord.netValue <= latestRecord.originalValue * 0.05;
      
      if (isFullyDepreciated) {
        this.db.run(
          `UPDATE asset_details SET status = ? WHERE id = ?`,
          ['IN_DEPRECIATION', assetDetailId]
        );
      }
    }
  }

  private createTimelineRecord(
    masterId: string,
    assetDetailId: string,
    userId: string,
    userName: string,
    action: string,
    status: AssetStatus,
    approvalAction: ApprovalAction,
    remarks?: string
  ): void {
    const timelineId = uuidv4();
    this.db.run(
      `INSERT INTO timeline_records (
        id, masterId, assetDetailId, userId, userName, action, status,
        approvalAction, remarks, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        timelineId,
        masterId,
        assetDetailId,
        userId,
        userName,
        action,
        status,
        approvalAction,
        remarks || '',
        this.now
      ]
    );
  }

  private round(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
}
