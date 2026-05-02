import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database';
import { AssetMaster, AssetDetail, AssetStatus, UserRole, Message, OperationLog, TimelineRecord, QRCode, User } from '../types';

export interface RegisterAssetRequest {
  assetDetails: {
    assetName: string;
    assetType: string;
    spec: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    purchaseDate: string;
    supplier: string;
    location: string;
    department: string;
    managerId: string;
    useLife: number;
    residualValueRate: number;
    depreciationMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'SUM_OF_YEARS_DIGITS';
  }[];
  attachments: {
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
  }[];
  expectedCompleteTime: string;
  createdBy: string;
}

export interface RegisterAssetResult {
  success: boolean;
  masterId: string;
  masterNo: string;
  messages: string[];
  errors: string[];
}

export class AssetRegisterRuleEngine {
  private db: Database;
  private now: string;

  constructor(db: Database) {
    this.db = db;
    this.now = new Date().toISOString();
  }

  generateMasterNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const prefix = `AM${year}${month}${day}`;
    
    const existing = this.db.all<{ masterNo: string }>(
      `SELECT masterNo FROM asset_masters WHERE masterNo LIKE ? ORDER BY masterNo DESC LIMIT 1`,
      [`${prefix}%`]
    );

    let sequence = 1;
    if (existing.length > 0) {
      const lastNo = existing[0].masterNo;
      const lastSeq = parseInt(lastNo.slice(-4), 10);
      sequence = lastSeq + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  generateAssetCode(assetType: string, index: number): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const typePrefix = this.getTypePrefix(assetType);
    const prefix = `ASSET-${typePrefix}${year}${month}`;
    
    const existing = this.db.all<{ assetCode: string }>(
      `SELECT assetCode FROM asset_details WHERE assetCode LIKE ? ORDER BY assetCode DESC LIMIT 1`,
      [`${prefix}%`]
    );

    let sequence = index + 1;
    if (existing.length > 0) {
      const lastCode = existing[0].assetCode;
      const lastSeq = parseInt(lastCode.slice(-6), 10);
      sequence = Math.max(sequence, lastSeq + 1);
    }

    return `${prefix}${String(sequence).padStart(6, '0')}`;
  }

  private getTypePrefix(assetType: string): string {
    const typeMap: Record<string, string> = {
      '电子设备': 'EL',
      '办公家具': 'OF',
      '运输设备': 'TR',
      '机器设备': 'MA',
      '房屋建筑': 'BU',
      '无形资产': 'IN',
    };
    return typeMap[assetType] || 'OT';
  }

  validateRequest(request: RegisterAssetRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.assetDetails || request.assetDetails.length === 0) {
      errors.push('至少需要填写一项资产明细');
    }

    if (!request.createdBy) {
      errors.push('创建人不能为空');
    }

    const user = this.db.get<User>(
      `SELECT * FROM users WHERE id = ?`,
      [request.createdBy]
    );

    if (!user) {
      errors.push('创建人不存在');
    } else if (user.role !== 'ASSET_ADMIN') {
      errors.push('只有资产管理员可以执行入账操作');
    }

    request.assetDetails?.forEach((detail, index) => {
      if (!detail.assetName) {
        errors.push(`第${index + 1}项资产：资产名称不能为空`);
      }
      if (!detail.assetType) {
        errors.push(`第${index + 1}项资产：资产类型不能为空`);
      }
      if (detail.quantity <= 0) {
        errors.push(`第${index + 1}项资产：数量必须大于0`);
      }
      if (detail.unitPrice < 0) {
        errors.push(`第${index + 1}项资产：单价不能为负数`);
      }
      if (detail.useLife <= 0) {
        errors.push(`第${index + 1}项资产：使用年限必须大于0`);
      }
      if (detail.residualValueRate < 0 || detail.residualValueRate > 1) {
        errors.push(`第${index + 1}项资产：残值率必须在0-1之间`);
      }
    });

    return { valid: errors.length === 0, errors };
  }

  execute(request: RegisterAssetRequest): RegisterAssetResult {
    const validation = this.validateRequest(request);
    if (!validation.valid) {
      return {
        success: false,
        masterId: '',
        masterNo: '',
        messages: [],
        errors: validation.errors
      };
    }

    const messages: string[] = [];
    const masterNo = this.generateMasterNo();
    const masterId = uuidv4();

    this.db.transaction(() => {
      const user = this.db.get<User>(
        `SELECT * FROM users WHERE id = ?`,
        [request.createdBy]
      );

      const assetAdmin = this.db.get<User>(
        `SELECT * FROM users WHERE role = 'ASSET_ADMIN' LIMIT 1`
      );

      const handlerId = assetAdmin?.id || request.createdBy;
      const handlerRole = assetAdmin?.role || 'ASSET_ADMIN';

      this.db.run(
        `INSERT INTO asset_masters (
          id, masterNo, status, currentHandlerId, currentHandlerRole,
          expectedCompleteTime, createdAt, updatedAt, createdBy, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          masterId,
          masterNo,
          'PENDING_REGISTER' as AssetStatus,
          handlerId,
          handlerRole as UserRole,
          request.expectedCompleteTime || null,
          this.now,
          this.now,
          request.createdBy,
          1
        ]
      );

      for (let i = 0; i < request.assetDetails.length; i++) {
        const detail = request.assetDetails[i];
        const detailId = uuidv4();
        const assetCode = this.generateAssetCode(detail.assetType, i);
        const totalPrice = detail.quantity * detail.unitPrice;
        const qrCodeId = uuidv4();

        this.db.run(
          `INSERT INTO asset_details (
            id, masterId, assetCode, assetName, assetType, spec, unit,
            quantity, unitPrice, totalPrice, purchaseDate, supplier,
            location, department, managerId, useLife, residualValueRate,
            depreciationMethod, qrCodeId, status, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            detailId,
            masterId,
            assetCode,
            detail.assetName,
            detail.assetType,
            detail.spec,
            detail.unit,
            detail.quantity,
            detail.unitPrice,
            totalPrice,
            detail.purchaseDate,
            detail.supplier,
            detail.location,
            detail.department,
            detail.managerId,
            detail.useLife,
            detail.residualValueRate,
            detail.depreciationMethod,
            qrCodeId,
            'PENDING_REGISTER' as AssetStatus,
            this.now,
            this.now
          ]
        );

        const qrCode = this.generateQRCode(assetCode, detailId);
        this.db.run(
          `INSERT INTO qr_codes (
            id, assetDetailId, qrCode, qrContent, generatedAt,
            scannedCount, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            qrCodeId,
            detailId,
            qrCode.code,
            qrCode.content,
            this.now,
            0,
            this.now
          ]
        );

        messages.push(`资产 ${assetCode}(${detail.assetName}) 创建成功`);
      }

      for (const attachment of request.attachments) {
        const attachId = uuidv4();
        this.db.run(
          `INSERT INTO attachments (
            id, masterId, fileName, fileType, fileSize, fileUrl,
            uploadedBy, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            attachId,
            masterId,
            attachment.fileName,
            attachment.fileType,
            attachment.fileSize,
            attachment.fileUrl,
            request.createdBy,
            this.now
          ]
        );
      }

      this.createMessages(masterId, handlerId, masterNo);
      this.createOperationLog(masterId, request.createdBy, 'CREATE_ASSET', null, 'PENDING_REGISTER');
      this.createTimeline(masterId, request.createdBy, user?.name || '系统', '提交资产入账', 'PENDING_REGISTER');
    });

    return {
      success: true,
      masterId,
      masterNo,
      messages,
      errors: []
    };
  }

  private generateQRCode(assetCode: string, detailId: string): { code: string; content: string } {
    const code = `QR-${assetCode.replace(/\s/g, '')}`;
    const content = JSON.stringify({
      assetCode,
      detailId,
      generatedAt: this.now,
      type: 'ASSET_QR'
    });
    return { code, content };
  }

  private createMessages(masterId: string, handlerId: string, masterNo: string): void {
    const messageId = uuidv4();
    this.db.run(
      `INSERT INTO messages (
        id, masterId, userId, title, content, type, status, relatedType, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        messageId,
        masterId,
        handlerId,
        `待处理：资产入账申请 ${masterNo}`,
        `您有新的资产入账申请需要处理，主单号：${masterNo}`,
        'TODO' as const,
        'UNREAD' as const,
        'REGISTER' as const,
        this.now
      ]
    );
  }

  private createOperationLog(
    masterId: string,
    userId: string,
    action: string,
    previousStatus: AssetStatus | null,
    newStatus: AssetStatus
  ): void {
    const logId = uuidv4();
    this.db.run(
      `INSERT INTO operation_logs (
        id, masterId, userId, action, previousStatus, newStatus, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        masterId,
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
    userId: string,
    userName: string,
    action: string,
    status: AssetStatus
  ): void {
    const timelineId = uuidv4();
    this.db.run(
      `INSERT INTO timeline_records (
        id, masterId, userId, userName, action, status, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        timelineId,
        masterId,
        userId,
        userName,
        action,
        status,
        this.now
      ]
    );
  }
}
