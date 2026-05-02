import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database';
import { AssetMaster, AssetDetail, AssetStatus, UserRole, TransferRecord, ScrapRecord, User, Message, TimelineRecord, OperationLog } from '../types';

export interface ReceiveAssetRequest {
  masterId: string;
  userId: string;
  userName: string;
  remarks: string;
}

export interface TransferAssetRequest {
  masterId: string;
  assetDetailId: string;
  fromDepartment: string;
  fromManagerId: string;
  toDepartment: string;
  toManagerId: string;
  transferReason: string;
  userId: string;
  userName: string;
}

export interface ScrapAssetRequest {
  masterId: string;
  assetDetailId: string;
  scrapReason: string;
  scrapValue: number;
  userId: string;
  userName: string;
}

export interface ApprovalRequest {
  masterId: string;
  assetDetailId: string;
  approvalType: 'TRANSFER' | 'SCRAP';
  action: 'APPROVE' | 'REJECT';
  remarks: string;
  userId: string;
  userName: string;
}

export class WorkflowRuleEngine {
  private db: Database;
  private now: string;

  constructor(db: Database) {
    this.db = db;
    this.now = new Date().toISOString();
  }

  getNextHandler(currentStatus: AssetStatus, currentRole: UserRole): { role: UserRole; userId?: string } {
    const statusFlow: Record<AssetStatus, { role: UserRole; findUser: boolean }> = {
      'PENDING_REGISTER': { role: 'ASSET_ADMIN', findUser: true },
      'PENDING_RECEIVE': { role: 'DEPARTMENT_USER', findUser: false },
      'PENDING_DEPRECIATION': { role: 'FINANCE', findUser: true },
      'PENDING_INVENTORY': { role: 'DEPARTMENT_USER', findUser: false },
      'PENDING_TRANSFER': { role: 'FINANCE', findUser: true },
      'PENDING_SCRAP': { role: 'AUDIT', findUser: true },
      'IN_USE': { role: 'ASSET_ADMIN', findUser: true },
      'IN_DEPRECIATION': { role: 'FINANCE', findUser: true },
      'TRANSFERRED': { role: 'ASSET_ADMIN', findUser: true },
      'SCRAPPED': { role: 'ASSET_ADMIN', findUser: true },
      'REJECTED': { role: 'ASSET_ADMIN', findUser: true },
      'CANCELLED': { role: 'ASSET_ADMIN', findUser: true }
    };

    const flow = statusFlow[currentStatus];
    if (!flow) {
      return { role: 'ASSET_ADMIN' };
    }

    if (flow.findUser) {
      const user = this.db.get<User>(
        `SELECT * FROM users WHERE role = ? LIMIT 1`,
        [flow.role]
      );
      if (user) {
        return { role: flow.role, userId: user.id };
      }
    }

    return { role: flow.role };
  }

  advanceStatus(currentStatus: AssetStatus, action: 'ADVANCE' | 'REJECT' | 'SPECIAL'): AssetStatus {
    const flowMap: Record<AssetStatus, { advance: AssetStatus; reject: AssetStatus }> = {
      'PENDING_REGISTER': { advance: 'PENDING_RECEIVE', reject: 'REJECTED' },
      'PENDING_RECEIVE': { advance: 'PENDING_DEPRECIATION', reject: 'PENDING_REGISTER' },
      'PENDING_DEPRECIATION': { advance: 'PENDING_INVENTORY', reject: 'PENDING_RECEIVE' },
      'PENDING_INVENTORY': { advance: 'IN_USE', reject: 'PENDING_DEPRECIATION' },
      'PENDING_TRANSFER': { advance: 'TRANSFERRED', reject: 'IN_USE' },
      'PENDING_SCRAP': { advance: 'SCRAPPED', reject: 'IN_USE' },
      'IN_USE': { advance: 'IN_USE', reject: 'IN_USE' },
      'IN_DEPRECIATION': { advance: 'IN_DEPRECIATION', reject: 'IN_DEPRECIATION' },
      'TRANSFERRED': { advance: 'TRANSFERRED', reject: 'TRANSFERRED' },
      'SCRAPPED': { advance: 'SCRAPPED', reject: 'SCRAPPED' },
      'REJECTED': { advance: 'REJECTED', reject: 'REJECTED' },
      'CANCELLED': { advance: 'CANCELLED', reject: 'CANCELLED' }
    };

    if (action === 'REJECT') {
      return flowMap[currentStatus]?.reject || currentStatus;
    }

    return flowMap[currentStatus]?.advance || currentStatus;
  }

  receiveAsset(request: ReceiveAssetRequest): { success: boolean; newStatus: AssetStatus; errors: string[] } {
    const master = this.db.get<AssetMaster>(
      `SELECT * FROM asset_masters WHERE id = ?`,
      [request.masterId]
    );

    if (!master) {
      return { success: false, newStatus: 'PENDING_RECEIVE', errors: ['主单不存在'] };
    }

    if (master.status !== 'PENDING_RECEIVE') {
      return { success: false, newStatus: master.status, errors: ['当前状态不可领用'] };
    }

    const newStatus = this.advanceStatus(master.status, 'ADVANCE');
    const nextHandler = this.getNextHandler(newStatus, master.currentHandlerRole);

    this.db.transaction(() => {
      this.db.run(
        `UPDATE asset_masters SET 
          status = ?, 
          currentHandlerId = ?, 
          currentHandlerRole = ?, 
          updatedAt = ?, 
          version = version + 1 
        WHERE id = ?`,
        [
          newStatus,
          nextHandler.userId || master.currentHandlerId,
          nextHandler.role,
          this.now,
          request.masterId
        ]
      );

      this.db.run(
        `UPDATE asset_details SET status = ?, updatedAt = ? WHERE masterId = ?`,
        [newStatus, this.now, request.masterId]
      );

      this.updateMessagesStatus(request.masterId, request.userId);
      this.createMessages(request.masterId, nextHandler.userId || master.currentHandlerId, newStatus);
      this.createOperationLog(request.masterId, request.userId, 'RECEIVE_ASSET', master.status, newStatus);
      this.createTimeline(
        request.masterId,
        request.userId,
        request.userName,
        '完成资产领用',
        newStatus,
        request.remarks
      );
    });

    return { success: true, newStatus, errors: [] };
  }

  lockTransfer(masterId: string, assetDetailId: string): { success: boolean; lockVersion: number; errors: string[] } {
    const existing = this.db.get<TransferRecord>(
      `SELECT * FROM transfer_records WHERE assetDetailId = ? AND status IN ('PENDING', 'LOCKED')`,
      [assetDetailId]
    );

    if (existing) {
      return { success: false, lockVersion: existing.lockVersion, errors: ['该资产正在调拨流程中，已被锁定'] };
    }

    const transferId = uuidv4();
    const lockVersion = Date.now();

    this.db.run(
      `INSERT INTO transfer_records (
        id, masterId, assetDetailId, fromDepartment, fromManagerId,
        toDepartment, toManagerId, status, lockVersion, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transferId,
        masterId,
        assetDetailId,
        '', '', '', '',
        'LOCKED',
        lockVersion,
        this.now
      ]
    );

    return { success: true, lockVersion, errors: [] };
  }

  initiateTransfer(request: TransferAssetRequest): { success: boolean; transferId: string; newStatus: AssetStatus; errors: string[] } {
    const master = this.db.get<AssetMaster>(
      `SELECT * FROM asset_masters WHERE id = ?`,
      [request.masterId]
    );

    if (!master) {
      return { success: false, transferId: '', newStatus: 'IN_USE', errors: ['主单不存在'] };
    }

    if (!['IN_USE', 'PENDING_TRANSFER'].includes(master.status)) {
      return { success: false, transferId: '', newStatus: master.status, errors: ['当前状态不可调拨'] };
    }

    const asset = this.db.get<AssetDetail>(
      `SELECT * FROM asset_details WHERE id = ?`,
      [request.assetDetailId]
    );

    if (!asset) {
      return { success: false, transferId: '', newStatus: master.status, errors: ['资产不存在'] };
    }

    const transferId = uuidv4();
    const newStatus: AssetStatus = 'PENDING_TRANSFER';
    const nextHandler = this.getNextHandler(newStatus, master.currentHandlerRole);

    this.db.transaction(() => {
      const existingLock = this.db.get<TransferRecord>(
        `SELECT * FROM transfer_records WHERE assetDetailId = ? AND status = 'LOCKED'`,
        [request.assetDetailId]
      );

      if (existingLock) {
        this.db.run(
          `UPDATE transfer_records SET
            fromDepartment = ?, fromManagerId = ?, toDepartment = ?, toManagerId = ?,
            transferReason = ?, status = ?, lockVersion = ?, updatedAt = ?
          WHERE id = ?`,
          [
            request.fromDepartment,
            request.fromManagerId,
            request.toDepartment,
            request.toManagerId,
            request.transferReason,
            'PENDING',
            Date.now(),
            this.now,
            existingLock.id
          ]
        );
      } else {
        this.db.run(
          `INSERT INTO transfer_records (
            id, masterId, assetDetailId, fromDepartment, fromManagerId,
            toDepartment, toManagerId, transferReason, status, lockVersion, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transferId,
            request.masterId,
            request.assetDetailId,
            request.fromDepartment,
            request.fromManagerId,
            request.toDepartment,
            request.toManagerId,
            request.transferReason,
            'PENDING',
            Date.now(),
            this.now
          ]
        );
      }

      this.db.run(
        `UPDATE asset_masters SET 
          status = ?, 
          currentHandlerId = ?, 
          currentHandlerRole = ?, 
          updatedAt = ?, 
          version = version + 1 
        WHERE id = ?`,
        [
          newStatus,
          nextHandler.userId || request.userId,
          nextHandler.role,
          this.now,
          request.masterId
        ]
      );

      this.db.run(
        `UPDATE asset_details SET status = ?, updatedAt = ? WHERE id = ?`,
        [newStatus, this.now, request.assetDetailId]
      );

      this.createMessages(request.masterId, nextHandler.userId || request.userId, newStatus);
      this.createOperationLog(request.masterId, request.userId, 'INITIATE_TRANSFER', master.status, newStatus);
      this.createTimeline(
        request.masterId,
        request.userId,
        request.userName,
        `发起调拨：${request.fromDepartment} → ${request.toDepartment}`,
        newStatus,
        request.transferReason
      );
    });

    return { success: true, transferId, newStatus, errors: [] };
  }

  initiateScrap(request: ScrapAssetRequest): { success: boolean; scrapId: string; newStatus: AssetStatus; errors: string[] } {
    const master = this.db.get<AssetMaster>(
      `SELECT * FROM asset_masters WHERE id = ?`,
      [request.masterId]
    );

    if (!master) {
      return { success: false, scrapId: '', newStatus: 'IN_USE', errors: ['主单不存在'] };
    }

    if (!['IN_USE', 'PENDING_SCRAP'].includes(master.status)) {
      return { success: false, scrapId: '', newStatus: master.status, errors: ['当前状态不可报废'] };
    }

    const scrapId = uuidv4();
    const newStatus: AssetStatus = 'PENDING_SCRAP';
    const nextHandler = this.getNextHandler(newStatus, master.currentHandlerRole);

    this.db.transaction(() => {
      this.db.run(
        `INSERT INTO scrap_records (
          id, masterId, assetDetailId, scrapReason, scrapValue,
          approvalStatus, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          scrapId,
          request.masterId,
          request.assetDetailId,
          request.scrapReason,
          request.scrapValue,
          'PENDING',
          this.now
        ]
      );

      this.db.run(
        `UPDATE asset_masters SET 
          status = ?, 
          currentHandlerId = ?, 
          currentHandlerRole = ?, 
          updatedAt = ?, 
          version = version + 1 
        WHERE id = ?`,
        [
          newStatus,
          nextHandler.userId || request.userId,
          nextHandler.role,
          this.now,
          request.masterId
        ]
      );

      this.db.run(
        `UPDATE asset_details SET status = ?, updatedAt = ? WHERE id = ?`,
        [newStatus, this.now, request.assetDetailId]
      );

      this.createMessages(request.masterId, nextHandler.userId || request.userId, newStatus);
      this.createOperationLog(request.masterId, request.userId, 'INITIATE_SCRAP', master.status, newStatus);
      this.createTimeline(
        request.masterId,
        request.userId,
        request.userName,
        `发起报废：${request.scrapReason}`,
        newStatus,
        `报废价值：${request.scrapValue}`
      );
    });

    return { success: true, scrapId, newStatus, errors: [] };
  }

  processApproval(request: ApprovalRequest): { success: boolean; newStatus: AssetStatus; errors: string[] } {
    const master = this.db.get<AssetMaster>(
      `SELECT * FROM asset_masters WHERE id = ?`,
      [request.masterId]
    );

    if (!master) {
      return { success: false, newStatus: 'PENDING_TRANSFER', errors: ['主单不存在'] };
    }

    if (request.approvalType === 'TRANSFER') {
      const transfer = this.db.get<TransferRecord>(
        `SELECT * FROM transfer_records WHERE masterId = ? AND assetDetailId = ? AND status = 'PENDING'`,
        [request.masterId, request.assetDetailId]
      );

      if (!transfer) {
        return { success: false, newStatus: master.status, errors: ['调拨记录不存在或已处理'] };
      }

      if (request.action === 'APPROVE') {
        const newStatus: AssetStatus = 'TRANSFERRED';
        
        this.db.transaction(() => {
          this.db.run(
            `UPDATE transfer_records SET status = ?, approvedBy = ?, approvedAt = ? WHERE id = ?`,
            ['APPROVED', request.userId, this.now, transfer.id]
          );

          this.db.run(
            `UPDATE asset_details SET 
              department = ?, managerId = ?, status = ?, updatedAt = ? 
            WHERE id = ?`,
            [transfer.toDepartment, transfer.toManagerId, newStatus, this.now, request.assetDetailId]
          );

          this.db.run(
            `UPDATE asset_masters SET status = ?, updatedAt = ?, version = version + 1 WHERE id = ?`,
            [newStatus, this.now, request.masterId]
          );

          this.updateMessagesStatus(request.masterId, request.userId);
          this.createOperationLog(request.masterId, request.userId, 'APPROVE_TRANSFER', master.status, newStatus);
          this.createTimeline(
            request.masterId,
            request.userId,
            request.userName,
            '审批通过调拨',
            newStatus,
            request.remarks
          );
        });

        return { success: true, newStatus, errors: [] };
      } else {
        const newStatus: AssetStatus = 'IN_USE';
        
        this.db.transaction(() => {
          this.db.run(
            `UPDATE transfer_records SET status = ?, approvedBy = ?, approvedAt = ? WHERE id = ?`,
            ['REJECTED', request.userId, this.now, transfer.id]
          );

          this.db.run(
            `UPDATE asset_details SET status = ?, updatedAt = ? WHERE id = ?`,
            [newStatus, this.now, request.assetDetailId]
          );

          this.db.run(
            `UPDATE asset_masters SET status = ?, updatedAt = ?, version = version + 1 WHERE id = ?`,
            [newStatus, this.now, request.masterId]
          );

          this.createOperationLog(request.masterId, request.userId, 'REJECT_TRANSFER', master.status, newStatus);
          this.createTimeline(
            request.masterId,
            request.userId,
            request.userName,
            '驳回调拨申请',
            newStatus,
            request.remarks
          );
        });

        return { success: true, newStatus, errors: [] };
      }
    }

    if (request.approvalType === 'SCRAP') {
      const scrap = this.db.get<ScrapRecord>(
        `SELECT * FROM scrap_records WHERE masterId = ? AND assetDetailId = ? AND approvalStatus = 'PENDING'`,
        [request.masterId, request.assetDetailId]
      );

      if (!scrap) {
        return { success: false, newStatus: master.status, errors: ['报废记录不存在或已处理'] };
      }

      if (request.action === 'APPROVE') {
        const newStatus: AssetStatus = 'SCRAPPED';
        
        this.db.transaction(() => {
          this.db.run(
            `UPDATE scrap_records SET approvalStatus = ?, approvedBy = ?, approvedAt = ? WHERE id = ?`,
            ['APPROVED', request.userId, this.now, scrap.id]
          );

          this.db.run(
            `UPDATE asset_details SET status = ?, updatedAt = ? WHERE id = ?`,
            [newStatus, this.now, request.assetDetailId]
          );

          this.db.run(
            `UPDATE asset_masters SET status = ?, updatedAt = ?, version = version + 1 WHERE id = ?`,
            [newStatus, this.now, request.masterId]
          );

          this.updateMessagesStatus(request.masterId, request.userId);
          this.createOperationLog(request.masterId, request.userId, 'APPROVE_SCRAP', master.status, newStatus);
          this.createTimeline(
            request.masterId,
            request.userId,
            request.userName,
            '审批通过报废',
            newStatus,
            request.remarks
          );
        });

        return { success: true, newStatus, errors: [] };
      } else {
        const newStatus: AssetStatus = 'IN_USE';
        
        this.db.transaction(() => {
          this.db.run(
            `UPDATE scrap_records SET approvalStatus = ?, approvedBy = ?, approvedAt = ? WHERE id = ?`,
            ['REJECTED', request.userId, this.now, scrap.id]
          );

          this.db.run(
            `UPDATE asset_details SET status = ?, updatedAt = ? WHERE id = ?`,
            [newStatus, this.now, request.assetDetailId]
          );

          this.db.run(
            `UPDATE asset_masters SET status = ?, updatedAt = ?, version = version + 1 WHERE id = ?`,
            [newStatus, this.now, request.masterId]
          );

          this.createOperationLog(request.masterId, request.userId, 'REJECT_SCRAP', master.status, newStatus);
          this.createTimeline(
            request.masterId,
            request.userId,
            request.userName,
            '驳回报废申请',
            newStatus,
            request.remarks
          );
        });

        return { success: true, newStatus, errors: [] };
      }
    }

    return { success: false, newStatus: master.status, errors: ['未知审批类型'] };
  }

  private updateMessagesStatus(masterId: string, userId: string): void {
    this.db.run(
      `UPDATE messages SET status = 'COMPLETED' WHERE masterId = ? AND userId = ? AND status = 'UNREAD'`,
      [masterId, userId]
    );
  }

  private createMessages(masterId: string, userId: string, status: AssetStatus): void {
    const master = this.db.get<AssetMaster>(
      `SELECT masterNo FROM asset_masters WHERE id = ?`,
      [masterId]
    );

    if (!master) return;

    const statusMessages: Record<AssetStatus, { title: string; content: string; type: string }> = {
      'PENDING_REGISTER': { 
        title: `待入账：${master.masterNo}`, 
        content: `资产入账申请待处理`,
        type: 'REGISTER'
      },
      'PENDING_RECEIVE': { 
        title: `待领用：${master.masterNo}`, 
        content: `资产领用待处理`,
        type: 'RECEIVE'
      },
      'PENDING_DEPRECIATION': { 
        title: `待折旧：${master.masterNo}`, 
        content: `折旧审批待处理`,
        type: 'DEPRECIATION'
      },
      'PENDING_INVENTORY': { 
        title: `待盘点：${master.masterNo}`, 
        content: `资产盘点待处理`,
        type: 'INVENTORY'
      },
      'PENDING_TRANSFER': { 
        title: `待调拨审批：${master.masterNo}`, 
        content: `调拨申请待审批`,
        type: 'TRANSFER'
      },
      'PENDING_SCRAP': { 
        title: `待报废审批：${master.masterNo}`, 
        content: `报废申请待审批`,
        type: 'SCRAP'
      },
      'IN_USE': { 
        title: `资产已领用：${master.masterNo}`, 
        content: `资产已正常使用`,
        type: 'NOTIFICATION'
      },
      'TRANSFERRED': { 
        title: `调拨完成：${master.masterNo}`, 
        content: `资产调拨已完成`,
        type: 'NOTIFICATION'
      },
      'SCRAPPED': { 
        title: `报废完成：${master.masterNo}`, 
        content: `资产报废已完成`,
        type: 'NOTIFICATION'
      },
      'IN_DEPRECIATION': { 
        title: `折旧中：${master.masterNo}`, 
        content: `资产折旧中`,
        type: 'NOTIFICATION'
      },
      'REJECTED': { 
        title: `申请被驳回：${master.masterNo}`, 
        content: `您的申请已被驳回`,
        type: 'ALERT'
      },
      'CANCELLED': { 
        title: `申请已取消：${master.masterNo}`, 
        content: `申请已取消`,
        type: 'NOTIFICATION'
      }
    };

    const msg = statusMessages[status];
    if (msg) {
      const messageId = uuidv4();
      this.db.run(
        `INSERT INTO messages (
          id, masterId, userId, title, content, type, status, relatedType, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          messageId,
          masterId,
          userId,
          msg.title,
          msg.content,
          msg.type === 'NOTIFICATION' || msg.type === 'ALERT' ? msg.type : 'TODO',
          'UNREAD',
          msg.type === 'NOTIFICATION' || msg.type === 'ALERT' ? 'REGISTER' : msg.type,
          this.now
        ]
      );
    }
  }

  private createOperationLog(
    masterId: string,
    userId: string,
    action: string,
    previousStatus: AssetStatus,
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
    status: AssetStatus,
    remarks?: string
  ): void {
    const timelineId = uuidv4();
    this.db.run(
      `INSERT INTO timeline_records (
        id, masterId, userId, userName, action, status, remarks, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        timelineId,
        masterId,
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
