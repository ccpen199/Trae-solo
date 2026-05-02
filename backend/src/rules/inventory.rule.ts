import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database';
import { AssetDetail, InventoryRecord, AssetStatus, QRCode } from '../types';

export interface InventorySubmitRequest {
  masterId: string;
  assetDetailId: string;
  inventoryResult: 'NORMAL' | 'MISSING' | 'DAMAGED' | 'TRANSFERRED';
  actualQuantity: number;
  remarks: string;
  qrScanned: boolean;
  qrCode?: string;
  userId: string;
  userName: string;
}

export interface InventoryValidationResult {
  valid: boolean;
  systemQuantity: number;
  difference: number;
  errors: string[];
  warnings: string[];
}

export class InventoryRuleEngine {
  private db: Database;
  private now: string;

  constructor(db: Database) {
    this.db = db;
    this.now = new Date().toISOString();
  }

  validateQRCode(qrCode: string, assetDetailId: string): { valid: boolean; error: string } {
    const qrRecord = this.db.get<QRCode>(
      `SELECT * FROM qr_codes WHERE qrCode = ?`,
      [qrCode]
    );

    if (!qrRecord) {
      return { valid: false, error: '二维码不存在' };
    }

    if (qrRecord.assetDetailId !== assetDetailId) {
      return { valid: false, error: '二维码与资产不匹配' };
    }

    return { valid: true, error: '' };
  }

  validateInventory(request: InventorySubmitRequest): InventoryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!request.assetDetailId) {
      errors.push('资产明细ID不能为空');
    }

    if (!request.inventoryResult) {
      errors.push('盘点结果不能为空');
    }

    const asset = this.db.get<AssetDetail>(
      `SELECT * FROM asset_details WHERE id = ?`,
      [request.assetDetailId]
    );

    if (!asset) {
      errors.push('资产不存在');
      return { valid: false, systemQuantity: 0, difference: 0, errors, warnings };
    }

    const systemQuantity = asset.quantity;
    const difference = request.actualQuantity - systemQuantity;

    if (request.actualQuantity < 0) {
      errors.push('实际数量不能为负数');
    }

    if (request.qrScanned && request.qrCode) {
      const qrValidation = this.validateQRCode(request.qrCode, request.assetDetailId);
      if (!qrValidation.valid) {
        errors.push(qrValidation.error);
      }
    } else if (!request.qrScanned) {
      warnings.push('未扫描二维码，建议扫码确认');
    }

    if (difference !== 0) {
      if (!request.remarks) {
        errors.push('数量存在差异时必须填写备注说明');
      }
      warnings.push(`数量差异：系统数量 ${systemQuantity}，实际数量 ${request.actualQuantity}`);
    }

    return {
      valid: errors.length === 0,
      systemQuantity,
      difference,
      errors,
      warnings
    };
  }

  submitInventory(request: InventorySubmitRequest): { 
    success: boolean; 
    inventoryId: string; 
    newStatus: AssetStatus;
    errors: string[];
    warnings: string[];
  } {
    const validation = this.validateInventory(request);
    if (!validation.valid) {
      return {
        success: false,
        inventoryId: '',
        newStatus: 'PENDING_INVENTORY',
        errors: validation.errors,
        warnings: validation.warnings
      };
    }

    const inventoryId = uuidv4();
    const asset = this.db.get<AssetDetail>(
      `SELECT * FROM asset_details WHERE id = ?`,
      [request.assetDetailId]
    );

    if (!asset) {
      return {
        success: false,
        inventoryId: '',
        newStatus: 'PENDING_INVENTORY',
        errors: ['资产不存在'],
        warnings: []
      };
    }

    let newStatus: AssetStatus = 'PENDING_INVENTORY';

    this.db.transaction(() => {
      this.db.run(
        `INSERT INTO inventory_records (
          id, masterId, assetDetailId, inventoryDate, inventoryResult,
          inventoryBy, qrScanned, actualQuantity, systemQuantity,
          difference, remarks, status, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          inventoryId,
          request.masterId,
          request.assetDetailId,
          this.now,
          request.inventoryResult,
          request.userId,
          request.qrScanned ? 1 : 0,
          request.actualQuantity,
          validation.systemQuantity,
          validation.difference,
          request.remarks,
          'COMPLETED',
          this.now
        ]
      );

      if (request.qrScanned && request.qrCode) {
        this.db.run(
          `UPDATE qr_codes SET scannedCount = scannedCount + 1, lastScannedAt = ? WHERE qrCode = ?`,
          [this.now, request.qrCode]
        );
      }

      if (request.inventoryResult === 'NORMAL') {
        newStatus = 'IN_USE';
        this.db.run(
          `UPDATE asset_details SET status = ? WHERE id = ?`,
          [newStatus, request.assetDetailId]
        );
      } else if (request.inventoryResult === 'DAMAGED') {
        this.db.run(
          `UPDATE asset_details SET status = ? WHERE id = ?`,
          ['PENDING_SCRAP', request.assetDetailId]
        );
        newStatus = 'PENDING_SCRAP';
      } else if (request.inventoryResult === 'MISSING') {
        this.db.run(
          `UPDATE asset_details SET status = ? WHERE id = ?`,
          ['PENDING_SCRAP', request.assetDetailId]
        );
        newStatus = 'PENDING_SCRAP';
      }

      this.createOperationLog(
        request.masterId,
        request.assetDetailId,
        request.userId,
        'COMPLETE_INVENTORY',
        asset.status,
        newStatus
      );

      this.createTimeline(
        request.masterId,
        request.assetDetailId,
        request.userId,
        request.userName,
        `完成盘点：${request.inventoryResult}`,
        newStatus,
        request.remarks
      );
    });

    return {
      success: true,
      inventoryId,
      newStatus,
      errors: [],
      warnings: validation.warnings
    };
  }

  getPendingInventoryItems(userId: string): {
    masterId: string;
    masterNo: string;
    assetDetailId: string;
    assetCode: string;
    assetName: string;
    location: string;
    department: string;
    qrCode: string;
  }[] {
    const results = this.db.all<{
      masterId: string;
      masterNo: string;
      assetDetailId: string;
      assetCode: string;
      assetName: string;
      location: string;
      department: string;
      qrCode: string;
    }>(
      `SELECT 
        m.id as masterId,
        m.masterNo,
        d.id as assetDetailId,
        d.assetCode,
        d.assetName,
        d.location,
        d.department,
        q.qrCode
      FROM asset_masters m
      JOIN asset_details d ON m.id = d.masterId
      LEFT JOIN qr_codes q ON d.qrCodeId = q.id
      WHERE m.status = 'PENDING_INVENTORY'
      AND (d.managerId = ? OR m.currentHandlerId = ?)
      ORDER BY m.createdAt DESC`,
      [userId, userId]
    );

    return results;
  }

  private createOperationLog(
    masterId: string,
    assetDetailId: string,
    userId: string,
    action: string,
    previousStatus: AssetStatus,
    newStatus: AssetStatus
  ): void {
    const logId = uuidv4();
    this.db.run(
      `INSERT INTO operation_logs (
        id, masterId, assetDetailId, userId, action, previousStatus, newStatus, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        masterId,
        assetDetailId,
        userId,
        action,
        previousStatus,
        newStatus,
        this.now
      ]
    );
  }

  private createTimeline(
    masterId: string,
    assetDetailId: string,
    userId: string,
    userName: string,
    action: string,
    status: AssetStatus,
    remarks?: string
  ): void {
    const timelineId = uuidv4();
    this.db.run(
      `INSERT INTO timeline_records (
        id, masterId, assetDetailId, userId, userName, action, status, remarks, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        timelineId,
        masterId,
        assetDetailId,
        userId,
        userName,
        action,
        status,
        remarks || '',
        this.now
      ]
    );
  }
}
