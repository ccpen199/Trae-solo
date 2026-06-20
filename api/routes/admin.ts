import { Router, type Request, type Response } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { AdminService } from '../services/admin.service.js';
import type { EntityType, RiskLevel, VerificationStatus } from '@shared/types/index.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/pending-companies', async (req: Request, res: Response): Promise<void> => {
  try {
    const pendingCompanies = await AdminService.getPendingCompanies();
    res.status(200).json({
      success: true,
      data: pendingCompanies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取待审核公司列表失败',
    });
  }
});

router.put('/company-qualification/:id/review', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body as { status: VerificationStatus; notes?: string };

    if (!status) {
      res.status(400).json({
        success: false,
        error: '缺少审核状态参数',
      });
      return;
    }

    const updatedQualification = await AdminService.reviewCompanyQualification({
      qualificationId: id,
      status,
      notes,
    });

    res.status(200).json({
      success: true,
      data: updatedQualification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '审核公司资质失败',
    });
  }
});

router.get('/risk-scores', async (req: Request, res: Response): Promise<void> => {
  try {
    const { entityType } = req.query as { entityType?: EntityType };

    const riskScores = await AdminService.getRiskScores(entityType);

    res.status(200).json({
      success: true,
      data: riskScores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取风险评分列表失败',
    });
  }
});

router.put('/risk-score/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { riskLevel, riskFactors, overallScore } = req.body as {
      riskLevel: RiskLevel;
      riskFactors: string[];
      overallScore: number;
    };

    if (!riskLevel || !riskFactors || overallScore === undefined) {
      res.status(400).json({
        success: false,
        error: '缺少必要参数: riskLevel, riskFactors, overallScore',
      });
      return;
    }

    const updatedRiskScore = await AdminService.updateRiskScore({
      id,
      riskLevel,
      riskFactors,
      overallScore,
    });

    res.status(200).json({
      success: true,
      data: updatedRiskScore,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '更新风险评分失败',
    });
  }
});

router.get('/regional-labor-data', async (req: Request, res: Response): Promise<void> => {
  try {
    const { region, industry, minHeatIndex, trend } = req.query as {
      region?: string;
      industry?: string;
      minHeatIndex?: string;
      trend?: string;
    };

    const params = {
      region,
      industry,
      minHeatIndex: minHeatIndex !== undefined ? Number(minHeatIndex) : undefined,
      trend,
    };

    const laborData = await AdminService.getRegionalLaborData(params);

    res.status(200).json({
      success: true,
      data: laborData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取区域劳动力数据失败',
    });
  }
});

router.get('/heatmap-data', async (req: Request, res: Response): Promise<void> => {
  try {
    const heatMapData = await AdminService.getHeatMapData();

    res.status(200).json({
      success: true,
      data: heatMapData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取热力图数据失败',
    });
  }
});

router.post('/blacklist', async (req: Request, res: Response): Promise<void> => {
  try {
    const { entityId, entityType, reason } = req.body as {
      entityId: string;
      entityType: EntityType;
      reason: string;
    };

    if (!entityId || !entityType || !reason) {
      res.status(400).json({
        success: false,
        error: '缺少必要参数: entityId, entityType, reason',
      });
      return;
    }

    const result = await AdminService.blacklistEntity({
      entityId,
      entityType,
      reason,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '加入黑名单失败',
    });
  }
});

router.post('/whitelist', async (req: Request, res: Response): Promise<void> => {
  try {
    const { entityId, entityType } = req.body as {
      entityId: string;
      entityType: EntityType;
    };

    if (!entityId || !entityType) {
      res.status(400).json({
        success: false,
        error: '缺少必要参数: entityId, entityType',
      });
      return;
    }

    const result = await AdminService.whitelistEntity({
      entityId,
      entityType,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '加入白名单失败',
    });
  }
});

export default router;
