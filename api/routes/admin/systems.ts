import { Router, type Request, type Response } from 'express';
import { mockSystemStatus, type ApiResponse, type SystemStatus } from '../../data/mockData.js';
import { authMiddleware, requireAdmin, type AuthRequest } from '../../middleware/auth.js';

const router = Router();

let systemStatusData = [...mockSystemStatus];

router.get('/status', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refresh = 'false' } = req.query;

    if (refresh === 'true') {
      systemStatusData = systemStatusData.map(s => ({
        ...s,
        responseTime: s.status === 'error' ? 0 : Math.floor(Math.random() * 100) + 20,
        lastChecked: new Date(),
      }));
    }

    const summary = {
      total: systemStatusData.length,
      normal: systemStatusData.filter(s => s.status === 'normal').length,
      warning: systemStatusData.filter(s => s.status === 'warning').length,
      error: systemStatusData.filter(s => s.status === 'error').length,
      failover: systemStatusData.filter(s => s.isFailover).length,
    };

    res.status(200).json({
      success: true,
      data: {
        list: systemStatusData,
        summary,
      },
      message: '获取系统状态成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取系统状态失败',
    } as ApiResponse);
  }
});

router.get('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const system = systemStatusData.find(s => s.id === id);

    if (!system) {
      res.status(404).json({
        success: false,
        message: '系统不存在',
      } as ApiResponse);
      return;
    }

    const history = [];
    for (let i = 23; i >= 0; i--) {
      history.push({
        time: `${i}:00`,
        responseTime: Math.floor(Math.random() * 100) + 20,
        status: Math.random() > 0.1 ? 'normal' : 'warning',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...system,
        history,
      },
      message: '获取系统详情成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取系统详情失败',
    } as ApiResponse);
  }
});

router.post('/:id/failover', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const systemIndex = systemStatusData.findIndex(s => s.id === id);

    if (systemIndex === -1) {
      res.status(404).json({
        success: false,
        message: '系统不存在',
      } as ApiResponse);
      return;
    }

    const system = systemStatusData[systemIndex];

    if (action === 'enable') {
      system.isFailover = true;
      system.status = 'warning';
      system.lastChecked = new Date();
    } else if (action === 'disable') {
      system.isFailover = false;
      system.status = 'normal';
      system.responseTime = Math.floor(Math.random() * 50) + 20;
      system.lastChecked = new Date();
    } else {
      res.status(400).json({
        success: false,
        message: '无效的操作类型',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: system,
      message: `容灾切换${action === 'enable' ? '启用' : '禁用'}成功`,
    } as ApiResponse<SystemStatus>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '容灾切换操作失败',
    } as ApiResponse);
  }
});

router.post('/:id/restart', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const systemIndex = systemStatusData.findIndex(s => s.id === id);

    if (systemIndex === -1) {
      res.status(404).json({
        success: false,
        message: '系统不存在',
      } as ApiResponse);
      return;
    }

    const system = systemStatusData[systemIndex];
    system.status = 'normal';
    system.responseTime = Math.floor(Math.random() * 50) + 20;
    system.isFailover = false;
    system.lastChecked = new Date();

    res.status(200).json({
      success: true,
      data: {
        ...system,
        restartTime: new Date(),
      },
      message: '系统重启成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '系统重启失败',
    } as ApiResponse);
  }
});

router.get('/disaster-recovery/overview', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const drOverview = {
      primarySite: {
        name: '主数据中心（北京）',
        status: 'normal',
        systems: systemStatusData.length,
        activeSystems: systemStatusData.filter(s => s.status !== 'error').length,
        lastSync: new Date(),
      },
      backupSite: {
        name: '灾备数据中心（上海）',
        status: 'standby',
        systems: systemStatusData.length,
        readySystems: systemStatusData.length,
        lastSync: new Date(),
      },
      failoverStatus: {
        activeFailovers: systemStatusData.filter(s => s.isFailover).length,
        totalSystems: systemStatusData.length,
        rto: '30分钟',
        rpo: '5分钟',
      },
      drills: [
        { id: 'drill_1', name: '2024年Q1容灾演练', status: 'completed', date: new Date('2024-03-15'), duration: '2小时' },
        { id: 'drill_2', name: '2024年Q2容灾演练', status: 'scheduled', date: new Date('2024-06-20'), duration: '3小时' },
      ],
    };

    res.status(200).json({
      success: true,
      data: drOverview,
      message: '获取容灾概览成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取容灾概览失败',
    } as ApiResponse);
  }
});

router.post('/disaster-recovery/drill', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { systemIds, drillType = 'partial' } = req.body;

    const drillResult = {
      drillId: `drill_${Date.now()}`,
      drillType,
      systemIds: systemIds || systemStatusData.filter(s => s.status === 'normal').map(s => s.id),
      startTime: new Date(),
      status: 'running',
      estimatedDuration: drillType === 'full' ? '2小时' : '30分钟',
    };

    res.status(200).json({
      success: true,
      data: drillResult,
      message: '容灾演练已启动',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '启动容灾演练失败',
    } as ApiResponse);
  }
});

router.get('/alerts', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const alerts = [
      { id: 'alert_1', level: 'critical', systemId: 'sys6', systemName: '税务业务系统', message: '系统响应超时，已自动切换到灾备中心', time: new Date(Date.now() - 300000), status: 'processing' },
      { id: 'alert_2', level: 'warning', systemId: 'sys3', systemName: '卫健业务系统', message: '系统响应时间超过100ms，请关注', time: new Date(Date.now() - 600000), status: 'acknowledged' },
      { id: 'alert_3', level: 'info', systemId: 'sys1', systemName: '人社业务系统', message: '系统进行例行维护，可能会有短暂中断', time: new Date(Date.now() - 3600000), status: 'resolved' },
    ];

    res.status(200).json({
      success: true,
      data: alerts,
      message: '获取告警列表成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取告警列表失败',
    } as ApiResponse);
  }
});

export default router;
