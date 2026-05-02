import { Router, Response } from 'express';
import { getDatabase } from '../database';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const totalAssets = db.get<{ count: number; totalValue: number }>(
      `SELECT COUNT(*) as count, SUM(totalPrice) as totalValue FROM asset_details`
    );

    const statusCounts = db.all<{ status: string; count: number }>(
      `SELECT status, COUNT(*) as count FROM asset_masters GROUP BY status`
    );

    const departmentCounts = db.all<{ department: string; count: number; totalValue: number }>(
      `SELECT department, COUNT(*) as count, SUM(totalPrice) as totalValue 
       FROM asset_details 
       GROUP BY department`
    );

    const typeCounts = db.all<{ assetType: string; count: number; totalValue: number }>(
      `SELECT assetType, COUNT(*) as count, SUM(totalPrice) as totalValue 
       FROM asset_details 
       GROUP BY assetType`
    );

    const recentAssets = db.all<{
      id: string;
      assetCode: string;
      assetName: string;
      assetType: string;
      totalPrice: number;
      status: string;
      createdAt: string;
      masterNo: string;
    }>(
      `SELECT 
        d.id, d.assetCode, d.assetName, d.assetType, d.totalPrice, d.status, d.createdAt,
        m.masterNo
      FROM asset_details d
      JOIN asset_masters m ON d.masterId = m.id
      ORDER BY d.createdAt DESC
      LIMIT 10`
    );

    const monthlyTrend = db.all<{
      month: string;
      count: number;
      totalValue: number;
    }>(
      `SELECT 
        strftime('%Y-%m', d.createdAt) as month,
        COUNT(*) as count,
        SUM(d.totalPrice) as totalValue
      FROM asset_details d
      GROUP BY strftime('%Y-%m', d.createdAt)
      ORDER BY month DESC
      LIMIT 12`
    );

    res.json({
      success: true,
      data: {
        summary: {
          totalAssets: totalAssets?.count || 0,
          totalValue: totalAssets?.totalValue || 0
        },
        statusCounts,
        departmentCounts,
        typeCounts,
        recentAssets,
        monthlyTrend: monthlyTrend.reverse()
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: '获取看板数据失败'
    });
  }
});

router.get('/assets-by-status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const { status, page = 1, pageSize = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const countQuery = `
      SELECT COUNT(DISTINCT m.id) as total
      FROM asset_masters m
      JOIN asset_details d ON m.id = d.masterId
      ${status ? 'WHERE m.status = ?' : ''}
    `;
    const countParams = status ? [String(status)] : [];
    const countResult = db.get<{ total: number }>(countQuery, countParams);
    const total = countResult?.total || 0;

    const query = `
      SELECT 
        m.id, m.masterNo, m.status, m.createdAt,
        d.assetCode, d.assetName, d.assetType, d.totalPrice, d.department, d.location,
        u.name as managerName
      FROM asset_masters m
      JOIN asset_details d ON m.id = d.masterId
      LEFT JOIN users u ON d.managerId = u.id
      ${status ? 'WHERE m.status = ?' : ''}
      ORDER BY m.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const params = status ? [String(status), Number(pageSize), offset] : [Number(pageSize), offset];
    const assets = db.all(query, params);

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
    console.error('Get assets by status error:', error);
    res.status(500).json({
      success: false,
      message: '获取资产列表失败'
    });
  }
});

router.get('/depreciation-summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const { page = 1, pageSize = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const countQuery = `SELECT COUNT(*) as total FROM asset_details`;
    const countResult = db.get<{ total: number }>(countQuery);
    const total = countResult?.total || 0;

    const query = `
      SELECT 
        d.id, d.assetCode, d.assetName, d.assetType, d.totalPrice,
        d.depreciationMethod, d.useLife, d.residualValueRate,
        d.department, d.status,
        u.name as managerName,
        COALESCE(dr.accumulatedDepreciation, 0) as accumulatedDepreciation,
        (d.totalPrice - COALESCE(dr.accumulatedDepreciation, 0)) as netValue
      FROM asset_details d
      LEFT JOIN users u ON d.managerId = u.id
      LEFT JOIN (
        SELECT assetDetailId, SUM(depreciationAmount) as accumulatedDepreciation
        FROM depreciation_records
        WHERE status = 'APPROVED'
        GROUP BY assetDetailId
      ) dr ON d.id = dr.assetDetailId
      ORDER BY d.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const assets = db.all(query, [Number(pageSize), offset]);

    const summary = db.get<{
      totalOriginalValue: number;
      totalAccumulatedDepreciation: number;
      totalNetValue: number;
    }>(
      `SELECT 
        SUM(d.totalPrice) as totalOriginalValue,
        SUM(COALESCE(dr.accumulatedDepreciation, 0)) as totalAccumulatedDepreciation,
        SUM(d.totalPrice - COALESCE(dr.accumulatedDepreciation, 0)) as totalNetValue
      FROM asset_details d
      LEFT JOIN (
        SELECT assetDetailId, SUM(depreciationAmount) as accumulatedDepreciation
        FROM depreciation_records
        WHERE status = 'APPROVED'
        GROUP BY assetDetailId
      ) dr ON d.id = dr.assetDetailId`
    );

    res.json({
      success: true,
      data: {
        summary: {
          totalOriginalValue: summary?.totalOriginalValue || 0,
          totalAccumulatedDepreciation: summary?.totalAccumulatedDepreciation || 0,
          totalNetValue: summary?.totalNetValue || 0
        },
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
    console.error('Get depreciation summary error:', error);
    res.status(500).json({
      success: false,
      message: '获取折旧汇总失败'
    });
  }
});

router.get('/inventory-history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const { page = 1, pageSize = 20, assetDetailId } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    let whereClause = '1=1';
    const params: (string | number)[] = [];

    if (assetDetailId) {
      whereClause += ' AND ir.assetDetailId = ?';
      params.push(String(assetDetailId));
    }

    const countQuery = `
      SELECT COUNT(*) as total FROM inventory_records ir
      WHERE ${whereClause}
    `;
    const countResult = db.get<{ total: number }>(countQuery, params);
    const total = countResult?.total || 0;

    const query = `
      SELECT 
        ir.*,
        d.assetCode, d.assetName,
        u.name as inventoryByName
      FROM inventory_records ir
      JOIN asset_details d ON ir.assetDetailId = d.id
      LEFT JOIN users u ON ir.inventoryBy = u.id
      WHERE ${whereClause}
      ORDER BY ir.inventoryDate DESC
      LIMIT ? OFFSET ?
    `;

    const records = db.all(query, [...params, Number(pageSize), offset]);

    const resultCounts = db.all<{ inventoryResult: string; count: number }>(
      `SELECT inventoryResult, COUNT(*) as count FROM inventory_records GROUP BY inventoryResult`
    );

    res.json({
      success: true,
      data: {
        list: records,
        resultCounts,
        pagination: {
          page: Number(page),
          pageSize: Number(pageSize),
          total,
          totalPages: Math.ceil(total / Number(pageSize))
        }
      }
    });
  } catch (error) {
    console.error('Get inventory history error:', error);
    res.status(500).json({
      success: false,
      message: '获取盘点历史失败'
    });
  }
});

router.get('/operation-logs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const { page = 1, pageSize = 20, masterId } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    let whereClause = '1=1';
    const params: (string | number)[] = [];

    if (masterId) {
      whereClause += ' AND ol.masterId = ?';
      params.push(String(masterId));
    }

    const countQuery = `
      SELECT COUNT(*) as total FROM operation_logs ol
      WHERE ${whereClause}
    `;
    const countResult = db.get<{ total: number }>(countQuery, params);
    const total = countResult?.total || 0;

    const query = `
      SELECT 
        ol.*,
        u.name as userName
      FROM operation_logs ol
      LEFT JOIN users u ON ol.userId = u.id
      WHERE ${whereClause}
      ORDER BY ol.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const logs = db.all(query, [...params, Number(pageSize), offset]);

    res.json({
      success: true,
      data: {
        list: logs,
        pagination: {
          page: Number(page),
          pageSize: Number(pageSize),
          total,
          totalPages: Math.ceil(total / Number(pageSize))
        }
      }
    });
  } catch (error) {
    console.error('Get operation logs error:', error);
    res.status(500).json({
      success: false,
      message: '获取操作日志失败'
    });
  }
});

export default router;
