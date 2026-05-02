import { Router, Response } from 'express';
import { getDatabase } from '../database';
import { authMiddleware, AuthenticatedRequest, roleMiddleware } from '../middleware/auth';
import { DepreciationRuleEngine, DepreciationApprovalRequest } from '../rules/depreciation.rule';
import { InventoryRuleEngine, InventorySubmitRequest } from '../rules/inventory.rule';
import { WorkflowRuleEngine, TransferAssetRequest, ScrapAssetRequest, ApprovalRequest } from '../rules/workflow.rule';
import { AssetDetail, DepreciationRecord, TransferRecord, ScrapRecord } from '../types';

const router = Router();

router.use(authMiddleware);

router.get('/depreciation/pending', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const assets = db.all<{
      masterId: string;
      masterNo: string;
      assetDetailId: string;
      assetCode: string;
      assetName: string;
      totalPrice: number;
      useLife: number;
      residualValueRate: number;
      depreciationMethod: string;
      department: string;
      managerName: string;
    }>(
      `SELECT 
        m.id as masterId, m.masterNo,
        d.id as assetDetailId, d.assetCode, d.assetName, d.totalPrice,
        d.useLife, d.residualValueRate, d.depreciationMethod, d.department,
        u.name as managerName
      FROM asset_masters m
      JOIN asset_details d ON m.id = d.masterId
      LEFT JOIN users u ON d.managerId = u.id
      WHERE m.status = 'PENDING_DEPRECIATION'
      AND (m.currentHandlerId = ? OR d.managerId = ?)
      ORDER BY m.createdAt DESC`,
      [req.user.userId, req.user.userId]
    );

    res.json({
      success: true,
      data: assets
    });
  } catch (error) {
    console.error('Get pending depreciation error:', error);
    res.status(500).json({
      success: false,
      message: '获取待折旧资产失败'
    });
  }
});

router.post('/depreciation/calculate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const { assetDetailId, masterId } = req.body;

    if (!assetDetailId || !masterId) {
      res.status(400).json({
        success: false,
        message: '参数不完整'
      });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const asset = db.get<AssetDetail>(
      `SELECT * FROM asset_details WHERE id = ?`,
      [assetDetailId]
    );

    if (!asset) {
      res.status(404).json({
        success: false,
        message: '资产不存在'
      });
      return;
    }

    const engine = new DepreciationRuleEngine(db);
    const period = engine.generatePeriod();
    const calculation = engine.calculateDepreciation(asset, period);

    res.json({
      success: true,
      data: {
        period,
        originalValue: calculation.originalValue,
        accumulatedDepreciation: calculation.accumulatedDepreciation,
        netValue: calculation.netValue,
        depreciationAmount: calculation.depreciationAmount,
        depreciationMethod: calculation.depreciationMethod
      }
    });
  } catch (error) {
    console.error('Calculate depreciation error:', error);
    res.status(500).json({
      success: false,
      message: '折旧计算失败'
    });
  }
});

router.post('/depreciation/approve', roleMiddleware('FINANCE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const request: DepreciationApprovalRequest = {
      recordId: req.body.recordId,
      masterId: req.body.masterId,
      assetDetailId: req.body.assetDetailId,
      action: req.body.action,
      remarks: req.body.remarks || '',
      userId: req.user.userId,
      userName: req.user.name,
      reassignTo: req.body.reassignTo
    };

    const engine = new DepreciationRuleEngine(db);
    const result = engine.processApproval(request);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.errors.join('; ')
      });
      return;
    }

    res.json({
      success: true,
      data: {
        status: result.status
      }
    });
  } catch (error) {
    console.error('Approve depreciation error:', error);
    res.status(500).json({
      success: false,
      message: '折旧审批失败'
    });
  }
});

router.get('/inventory/pending', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const engine = new InventoryRuleEngine(db);
    const items = engine.getPendingInventoryItems(req.user.userId);

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Get pending inventory error:', error);
    res.status(500).json({
      success: false,
      message: '获取待盘点资产失败'
    });
  }
});

router.post('/inventory/submit', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const request: InventorySubmitRequest = {
      masterId: req.body.masterId,
      assetDetailId: req.body.assetDetailId,
      inventoryResult: req.body.inventoryResult,
      actualQuantity: req.body.actualQuantity,
      remarks: req.body.remarks || '',
      qrScanned: req.body.qrScanned || false,
      qrCode: req.body.qrCode,
      userId: req.user.userId,
      userName: req.user.name
    };

    const engine = new InventoryRuleEngine(db);
    const result = engine.submitInventory(request);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.errors.join('; '),
        warnings: result.warnings
      });
      return;
    }

    res.json({
      success: true,
      data: {
        inventoryId: result.inventoryId,
        newStatus: result.newStatus,
        warnings: result.warnings
      }
    });
  } catch (error) {
    console.error('Submit inventory error:', error);
    res.status(500).json({
      success: false,
      message: '盘点提交失败'
    });
  }
});

router.post('/transfer/lock', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const { masterId, assetDetailId } = req.body;

    if (!masterId || !assetDetailId) {
      res.status(400).json({
        success: false,
        message: '参数不完整'
      });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const engine = new WorkflowRuleEngine(db);
    const result = engine.lockTransfer(masterId, assetDetailId);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.errors.join('; '),
        lockVersion: result.lockVersion
      });
      return;
    }

    res.json({
      success: true,
      data: {
        lockVersion: result.lockVersion
      }
    });
  } catch (error) {
    console.error('Lock transfer error:', error);
    res.status(500).json({
      success: false,
      message: '锁定调拨失败'
    });
  }
});

router.post('/transfer/initiate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const request: TransferAssetRequest = {
      masterId: req.body.masterId,
      assetDetailId: req.body.assetDetailId,
      fromDepartment: req.body.fromDepartment,
      fromManagerId: req.body.fromManagerId,
      toDepartment: req.body.toDepartment,
      toManagerId: req.body.toManagerId,
      transferReason: req.body.transferReason || '',
      userId: req.user.userId,
      userName: req.user.name
    };

    const engine = new WorkflowRuleEngine(db);
    const result = engine.initiateTransfer(request);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.errors.join('; ')
      });
      return;
    }

    res.json({
      success: true,
      data: {
        transferId: result.transferId,
        newStatus: result.newStatus
      }
    });
  } catch (error) {
    console.error('Initiate transfer error:', error);
    res.status(500).json({
      success: false,
      message: '发起调拨失败'
    });
  }
});

router.post('/scrap/initiate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const request: ScrapAssetRequest = {
      masterId: req.body.masterId,
      assetDetailId: req.body.assetDetailId,
      scrapReason: req.body.scrapReason,
      scrapValue: req.body.scrapValue || 0,
      userId: req.user.userId,
      userName: req.user.name
    };

    const engine = new WorkflowRuleEngine(db);
    const result = engine.initiateScrap(request);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.errors.join('; ')
      });
      return;
    }

    res.json({
      success: true,
      data: {
        scrapId: result.scrapId,
        newStatus: result.newStatus
      }
    });
  } catch (error) {
    console.error('Initiate scrap error:', error);
    res.status(500).json({
      success: false,
      message: '发起报废失败'
    });
  }
});

router.post('/approval/process', roleMiddleware('FINANCE', 'AUDIT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const request: ApprovalRequest = {
      masterId: req.body.masterId,
      assetDetailId: req.body.assetDetailId,
      approvalType: req.body.approvalType,
      action: req.body.action,
      remarks: req.body.remarks || '',
      userId: req.user.userId,
      userName: req.user.name
    };

    const engine = new WorkflowRuleEngine(db);
    const result = engine.processApproval(request);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.errors.join('; ')
      });
      return;
    }

    res.json({
      success: true,
      data: {
        newStatus: result.newStatus
      }
    });
  } catch (error) {
    console.error('Process approval error:', error);
    res.status(500).json({
      success: false,
      message: '审批处理失败'
    });
  }
});

router.get('/transfer/pending', roleMiddleware('FINANCE'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const transfers = db.all<TransferRecord & {
      masterNo: string;
      assetCode: string;
      assetName: string;
      fromManagerName: string;
      toManagerName: string;
    }>(
      `SELECT 
        t.*,
        m.masterNo,
        d.assetCode, d.assetName,
        u1.name as fromManagerName,
        u2.name as toManagerName
      FROM transfer_records t
      JOIN asset_masters m ON t.masterId = m.id
      JOIN asset_details d ON t.assetDetailId = d.id
      LEFT JOIN users u1 ON t.fromManagerId = u1.id
      LEFT JOIN users u2 ON t.toManagerId = u2.id
      WHERE t.status = 'PENDING'
      ORDER BY t.createdAt DESC`
    );

    res.json({
      success: true,
      data: transfers
    });
  } catch (error) {
    console.error('Get pending transfers error:', error);
    res.status(500).json({
      success: false,
      message: '获取待审批调拨失败'
    });
  }
});

router.get('/scrap/pending', roleMiddleware('AUDIT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const scraps = db.all<ScrapRecord & {
      masterNo: string;
      assetCode: string;
      assetName: string;
      assetTotalPrice: number;
    }>(
      `SELECT 
        s.*,
        m.masterNo,
        d.assetCode, d.assetName, d.totalPrice as assetTotalPrice
      FROM scrap_records s
      JOIN asset_masters m ON s.masterId = m.id
      JOIN asset_details d ON s.assetDetailId = d.id
      WHERE s.approvalStatus = 'PENDING'
      ORDER BY s.createdAt DESC`
    );

    res.json({
      success: true,
      data: scraps
    });
  } catch (error) {
    console.error('Get pending scraps error:', error);
    res.status(500).json({
      success: false,
      message: '获取待审批报废失败'
    });
  }
});

export default router;
