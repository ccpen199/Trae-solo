import { Router, Response } from 'express';
import { getDatabase } from '../database';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { AssetRegisterRuleEngine, RegisterAssetRequest } from '../rules/asset-register.rule';
import { WorkflowRuleEngine, ReceiveAssetRequest } from '../rules/workflow.rule';
import { AssetMaster, AssetDetail, QRCode, TimelineRecord, User } from '../types';

const router = Router();

router.use(authMiddleware);

router.post('/register', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const request: RegisterAssetRequest = {
      assetDetails: req.body.assetDetails || [],
      attachments: req.body.attachments || [],
      expectedCompleteTime: req.body.expectedCompleteTime || '',
      createdBy: req.user.userId
    };

    const engine = new AssetRegisterRuleEngine(db);
    const result = engine.execute(request);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.errors.join('; '),
        errors: result.errors
      });
      return;
    }

    res.json({
      success: true,
      data: {
        masterId: result.masterId,
        masterNo: result.masterNo,
        messages: result.messages
      }
    });
  } catch (error) {
    console.error('Register asset error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: `资产入账失败: ${errorMessage}`,
      errors: [errorMessage]
    });
  }
});

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const { status, page = 1, pageSize = 20, keyword } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    let whereClause = `1=1`;
    const params: (string | number)[] = [];

    if (status) {
      whereClause += ` AND m.status = ?`;
      params.push(String(status));
    }

    if (keyword) {
      whereClause += ` AND (m.masterNo LIKE ? OR d.assetName LIKE ? OR d.assetCode LIKE ?)`;
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }

    const countQuery = `
      SELECT COUNT(DISTINCT m.id) as total 
      FROM asset_masters m 
      LEFT JOIN asset_details d ON m.id = d.masterId 
      WHERE ${whereClause}
    `;
    const countResult = db.get<{ total: number }>(countQuery, params);
    const total = countResult?.total || 0;

    const query = `
      SELECT 
        m.id, m.masterNo, m.status, m.currentHandlerId, m.currentHandlerRole,
        m.expectedCompleteTime, m.createdAt, m.updatedAt, m.createdBy, m.version,
        u.name as createdByName,
        h.name as handlerName,
        (SELECT COUNT(*) FROM asset_details WHERE masterId = m.id) as detailCount,
        (SELECT SUM(totalPrice) FROM asset_details WHERE masterId = m.id) as totalAmount
      FROM asset_masters m
      LEFT JOIN users u ON m.createdBy = u.id
      LEFT JOIN users h ON m.currentHandlerId = h.id
      WHERE ${whereClause}
      GROUP BY m.id
      ORDER BY m.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const assets = db.all<AssetMaster & { createdByName: string; handlerName: string; detailCount: number; totalAmount: number }>(
      query,
      [...params, Number(pageSize), offset]
    );

    res.json({
      success: true,
      data: {
        list: assets,
        pagination: {
          page: Number(page),
          pageSize: Number(pageSize),
          total,
          totalPages: Math.ceil(total / Number(pageSize))
        }
      }
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({
      success: false,
      message: '获取资产列表失败'
    });
  }
});

router.get('/:masterId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const { masterId } = req.params;
    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const master = db.get<AssetMaster & { createdByName: string; handlerName: string }>(
      `SELECT m.*, u.name as createdByName, h.name as handlerName
       FROM asset_masters m
       LEFT JOIN users u ON m.createdBy = u.id
       LEFT JOIN users h ON m.currentHandlerId = h.id
       WHERE m.id = ?`,
      [masterId]
    );

    if (!master) {
      res.status(404).json({
        success: false,
        message: '资产主单不存在'
      });
      return;
    }

    const details = db.all<AssetDetail & { qrCode: string; managerName: string }>(
      `SELECT d.*, q.qrCode, u.name as managerName
       FROM asset_details d
       LEFT JOIN qr_codes q ON d.qrCodeId = q.id
       LEFT JOIN users u ON d.managerId = u.id
       WHERE d.masterId = ?
       ORDER BY d.createdAt`,
      [masterId]
    );

    const timelines = db.all<TimelineRecord & { userName: string }>(
      `SELECT t.*, u.name as userName
       FROM timeline_records t
       LEFT JOIN users u ON t.userId = u.id
       WHERE t.masterId = ?
       ORDER BY t.createdAt DESC`,
      [masterId]
    );

    res.json({
      success: true,
      data: {
        master,
        details,
        timelines
      }
    });
  } catch (error) {
    console.error('Get asset detail error:', error);
    res.status(500).json({
      success: false,
      message: '获取资产详情失败'
    });
  }
});

router.post('/receive', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const { masterId, remarks } = req.body;

    if (!masterId) {
      res.status(400).json({
        success: false,
        message: '主单ID不能为空'
      });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const request: ReceiveAssetRequest = {
      masterId,
      userId: req.user.userId,
      userName: req.user.name,
      remarks: remarks || ''
    };

    const engine = new WorkflowRuleEngine(db);
    const result = engine.receiveAsset(request);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.errors.join('; '),
        errors: result.errors
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
    console.error('Receive asset error:', error);
    res.status(500).json({
      success: false,
      message: '领用操作失败'
    });
  }
});

router.get('/qr/:qrCode', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const { qrCode } = req.params;
    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const qrRecord = db.get<QRCode>(
      `SELECT * FROM qr_codes WHERE qrCode = ?`,
      [qrCode]
    );

    if (!qrRecord) {
      res.status(404).json({
        success: false,
        message: '二维码不存在'
      });
      return;
    }

    const asset = db.get<AssetDetail & { masterNo: string; masterStatus: string; qrCode: string }>(
      `SELECT d.*, m.masterNo, m.status as masterStatus, q.qrCode
       FROM asset_details d
       JOIN asset_masters m ON d.masterId = m.id
       JOIN qr_codes q ON d.qrCodeId = q.id
       WHERE d.id = ?`,
      [qrRecord.assetDetailId]
    );

    res.json({
      success: true,
      data: asset
    });
  } catch (error) {
    console.error('Get QR code asset error:', error);
    res.status(500).json({
      success: false,
      message: '获取二维码资产信息失败'
    });
  }
});

export default router;
