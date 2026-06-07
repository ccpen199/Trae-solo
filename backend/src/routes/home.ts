import { Router, Request, Response } from 'express';
import { db } from '../models/database';

const router = Router();

function getGreenLevel(score: number): string {
  if (score >= 90) return '节能明星';
  if (score >= 70) return '环保先锋';
  if (score >= 50) return '绿色达人';
  return '节能新手';
}

const protocolInfo: Record<string, { label: string; description: string; icon: string }> = {
  uhome: {
    label: '海尔UHome',
    description: '海尔原生智能家居协议，支持全品类设备互联互通',
    icon: 'home'
  },
  matter: {
    label: 'Matter标准',
    description: '跨品牌通用协议，实现多生态设备无缝协作',
    icon: 'link'
  },
  wifi: {
    label: 'Wi-Fi直连',
    description: '无需网关，Wi-Fi设备直接接入云端控制',
    icon: 'wifi'
  },
  zigbee: {
    label: 'Zigbee传感',
    description: '低功耗传感网络，适合传感器和智能开关设备',
    icon: 'radio'
  },
  ir_bridge: {
    label: '红外桥接',
    description: '通过红外网关实现传统家电智能化控制',
    icon: 'zap'
  }
};

const demoAccountInfo: Record<string, { role_name: string; description: string; features: string[] }> = {
  admin: {
    role_name: '超级管理员',
    description: '全平台系统管理',
    features: ['权限管理', '数据分析', '灰度发布']
  },
  platform: {
    role_name: '平台运营',
    description: '服务工单与商城运营',
    features: ['工单管理', '商城运营', '渠道分销']
  },
  ops: {
    role_name: '运维工程师',
    description: '设备运维与固件管理',
    features: ['固件升级', '健康诊断', '红外网关']
  },
  user: {
    role_name: '家庭用户',
    description: '智能家电控制',
    features: ['设备控制', '场景引擎', '能耗报告']
  }
};

const businessModules = [
  {
    id: 'devices',
    title: '设备管理',
    description: '管理所有智能设备，查看设备状态和详情',
    icon: 'cpu',
    color: '#3B82F6',
    route: '/devices',
    requires_role: null
  },
  {
    id: 'discover',
    title: '设备发现',
    description: '扫描并发现附近可接入的智能设备',
    icon: 'search',
    color: '#10B981',
    route: '/devices/discover',
    requires_role: null
  },
  {
    id: 'scenes',
    title: '场景引擎',
    description: '创建和管理智能场景，实现一键联动',
    icon: 'play-circle',
    color: '#8B5CF6',
    route: '/scenes',
    requires_role: null
  },
  {
    id: 'services',
    title: '服务工单',
    description: '处理设备售后服务工单和维修请求',
    icon: 'wrench',
    color: '#F59E0B',
    route: '/services',
    requires_role: ['admin', 'platform']
  },
  {
    id: 'products',
    title: '智家商城',
    description: '浏览和购买海尔智能家电产品',
    icon: 'shopping-cart',
    color: '#EF4444',
    route: '/products',
    requires_role: ['admin', 'platform']
  },
  {
    id: 'tradein',
    title: '以旧换新',
    description: '旧设备估值回收，兑换新产品优惠',
    icon: 'refresh-cw',
    color: '#06B6D4',
    route: '/tradein',
    requires_role: ['admin', 'platform']
  },
  {
    id: 'energy',
    title: '能耗监控',
    description: '实时监控设备能耗，提供节能建议',
    icon: 'bar-chart-2',
    color: '#22C55E',
    route: '/energy',
    requires_role: null
  },
  {
    id: 'points',
    title: '积分中心',
    description: '查看积分余额，兑换奖励和优惠券',
    icon: 'gift',
    color: '#EC4899',
    route: '/points',
    requires_role: null
  },
  {
    id: 'firmware',
    title: '固件管理',
    description: '管理设备固件版本，推送升级任务',
    icon: 'hard-drive',
    color: '#6366F1',
    route: '/firmware',
    requires_role: ['admin', 'ops']
  },
  {
    id: 'channels',
    title: '渠道管理',
    description: '管理销售渠道和设备绑定关系',
    icon: 'git-branch',
    color: '#F97316',
    route: '/channels',
    requires_role: ['admin', 'platform']
  },
  {
    id: 'ir-bridges',
    title: '红外网关',
    description: '管理红外网关设备，学习红外遥控码',
    icon: 'wifi',
    color: '#14B8A6',
    route: '/ir-bridges',
    requires_role: ['admin', 'ops']
  },
  {
    id: 'device-health',
    title: '设备健康',
    description: '监控设备健康状态，预测故障风险',
    icon: 'heart-pulse',
    color: '#DC2626',
    route: '/device-health',
    requires_role: ['admin', 'ops']
  }
];

const sceneColors = ['#8B5CF6', '#3B82F6', '#10B981'];
const sceneIcons = ['home', 'moon', 'log-out'];

router.get('/overview', (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const nowStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const totalDevices = (db.prepare('SELECT COUNT(*) as count FROM devices').get() as any).count;
    const connectedBrands = (db.prepare('SELECT COUNT(DISTINCT brand) as count FROM devices').get() as any).count;
    const totalUsers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'").get() as any).count;
    const serviceOrdersToday = (db.prepare("SELECT COUNT(*) as count FROM service_orders WHERE DATE(created_at) = DATE('now')").get() as any).count;
    const firmwareUpdatesAvailable = (db.prepare("SELECT COUNT(*) as count FROM firmware_releases WHERE status = 'published'").get() as any).count;

    const protocolCounts = db.prepare('SELECT protocol, COUNT(*) as count FROM devices GROUP BY protocol').all() as any[];
    const protocolMap: Record<string, number> = {
      uhome: 0,
      matter: 0,
      wifi: 0,
      zigbee: 0,
      ir_bridge: 0
    };
    protocolCounts.forEach((p: any) => {
      if (protocolMap[p.protocol] !== undefined) {
        protocolMap[p.protocol] = p.count;
      }
    });

    const protocolSupport: Record<string, any> = {};
    Object.keys(protocolInfo).forEach(key => {
      protocolSupport[key] = {
        count: protocolMap[key] || 0,
        label: protocolInfo[key].label,
        description: protocolInfo[key].description,
        icon: protocolInfo[key].icon
      };
    });

    const demoUsers = db.prepare("SELECT username, role FROM users WHERE username IN ('admin', 'platform', 'ops', 'user')").all() as any[];
    const demoAccounts = demoUsers.map((u: any) => ({
      username: u.username,
      role: u.role,
      role_name: demoAccountInfo[u.username]?.role_name || u.role,
      description: demoAccountInfo[u.username]?.description || '',
      features: demoAccountInfo[u.username]?.features || []
    }));

    const onlineDevices = (db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'online'").get() as any).count;
    const discoveredDevices = (db.prepare("SELECT metric_value FROM device_metrics WHERE metric_key = 'discovery_scan' ORDER BY timestamp DESC LIMIT 1").get() as any)?.metric_value || 0;
    const activeScenes = (db.prepare('SELECT COUNT(*) as count FROM scenes').get() as any).count;
    const totalSceneExecutions = (db.prepare('SELECT COALESCE(SUM(execution_count), 0) as count FROM scenes').get() as any).count;
    const pendingServices = (db.prepare("SELECT COUNT(*) as count FROM service_orders WHERE status = 'pending'").get() as any).count;
    const todayServices = serviceOrdersToday;
    const totalProducts = (db.prepare('SELECT COUNT(*) as count FROM products').get() as any).count;
    const lowStockCount = (db.prepare('SELECT COUNT(*) as count FROM products WHERE aftersales_parts < 10').get() as any).count;
    const tradeinValuations = (db.prepare("SELECT COUNT(*) as count FROM trade_in_estimations WHERE status = 'pending'").get() as any).count;
    const tradeinRedeemable = tradeinValuations;
    const energy7Days = (db.prepare('SELECT COALESCE(SUM(kwh), 0) as total FROM energy_consumption WHERE date >= ?').get(sevenDaysAgoStr) as any).total;
    const totalKwh7d = Number(energy7Days.toFixed(2));
    const baselineKwh = 100;
    const savingsRate = Math.max(0, Math.min(1, 1 - totalKwh7d / baselineKwh));
    const savedKwh7d = Number((totalKwh7d * 0.15).toFixed(2));
    const points7d = (db.prepare('SELECT COALESCE(SUM(CASE WHEN type = ? THEN points ELSE 0 END), 0) as total FROM point_transactions WHERE created_at >= ?').get('earn', sevenDaysAgo.toISOString()) as any).total;
    const carbonReduction = Number((savedKwh7d * 0.785).toFixed(2));
    const greenScore = Math.min(100, 60 + Math.round(savedKwh7d * 2));
    const greenLevel = getGreenLevel(greenScore);
    const latestGreenReport = db.prepare('SELECT created_at FROM green_reports ORDER BY created_at DESC LIMIT 2').all() as any[];
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (latestGreenReport.length >= 2) {
      const prev = new Date(latestGreenReport[1].created_at).getTime();
      const curr = new Date(latestGreenReport[0].created_at).getTime();
      trend = curr > prev ? 'up' : 'down';
    }
    const pendingFirmware = (db.prepare("SELECT COUNT(*) as count FROM firmware_updates WHERE status = 'pending'").get() as any).count;
    const grayFirmware = (db.prepare('SELECT COUNT(*) as count FROM firmware_releases WHERE is_gray = 1 AND status = ?').get('published') as any).count;
    const totalChannels = (db.prepare('SELECT COUNT(*) as count FROM channels').get() as any).count;
    const boundDevices = (db.prepare('SELECT COUNT(*) as count FROM channel_device_bindings').get() as any).count;
    const onlineBridges = (db.prepare("SELECT COUNT(*) as count FROM ir_bridges WHERE status = 'online'").get() as any).count;
    const learnedCodes = (db.prepare('SELECT COUNT(*) as count FROM ir_codes').get() as any).count;
    const avgHealthScore = (db.prepare('SELECT COALESCE(AVG(score), 85) as avg FROM device_health_scores').get() as any).avg;
    const highRiskDevices = (db.prepare("SELECT COUNT(*) as count FROM device_health_scores WHERE risk_level = 'high'").get() as any).count;

    const moduleStats: Record<string, Array<{ label: string; value: string | number }>> = {
      devices: [
        { label: '设备总数', value: totalDevices },
        { label: '在线设备', value: onlineDevices }
      ],
      discover: [
        { label: '已发现设备', value: discoveredDevices },
        { label: '可添加', value: Math.max(0, discoveredDevices - 3) }
      ],
      scenes: [
        { label: '活跃场景', value: activeScenes },
        { label: '累计执行', value: totalSceneExecutions }
      ],
      services: [
        { label: '待处理', value: pendingServices },
        { label: '今日新增', value: todayServices }
      ],
      products: [
        { label: '商品总数', value: totalProducts },
        { label: '库存预警', value: lowStockCount }
      ],
      tradein: [
        { label: '估值中', value: tradeinValuations },
        { label: '可兑换', value: tradeinRedeemable }
      ],
      energy: [
        { label: '7天kWh', value: totalKwh7d },
        { label: '节电率', value: `${Math.round(savingsRate * 100)}%` }
      ],
      points: [
        { label: '积分余额', value: 2580 },
        { label: '今日获得', value: 500 }
      ],
      firmware: [
        { label: '待更新', value: pendingFirmware },
        { label: '灰度中', value: grayFirmware }
      ],
      channels: [
        { label: '渠道总数', value: totalChannels },
        { label: '绑定设备', value: boundDevices }
      ],
      'ir-bridges': [
        { label: '在线网关', value: onlineBridges },
        { label: '已学习码', value: learnedCodes }
      ],
      'device-health': [
        { label: '健康评分', value: Math.round(avgHealthScore) },
        { label: '高风险设备', value: highRiskDevices }
      ]
    };

    const businessModulesWithStats = businessModules.map((mod, index) => ({
      ...mod,
      stats: moduleStats[mod.id] || []
    }));

    const featuredScenesRaw = db.prepare('SELECT * FROM scenes ORDER BY execution_count DESC LIMIT 3').all() as any[];
    const featuredScenes = featuredScenesRaw.map((s: any, index: number) => {
      const actions = JSON.parse(s.actions);
      return {
        id: s.id,
        name: s.name,
        description: s.description,
        action_count: actions.length,
        execution_count: s.execution_count || 0,
        icon: sceneIcons[index % sceneIcons.length],
        color: sceneColors[index % sceneColors.length]
      };
    });

    const energyPreview = {
      total_kwh_7d: totalKwh7d,
      carbon_reduction_kg: carbonReduction,
      points_earned_7d: points7d,
      green_level: greenLevel,
      trend: trend
    };

    const tradeinOpportunities = (db.prepare("SELECT COUNT(*) as count FROM trade_in_estimations WHERE status = 'pending'").get() as any).count;
    const productPreview = {
      total_products: totalProducts,
      low_stock_count: lowStockCount,
      tradein_opportunities: tradeinOpportunities
    };

    res.json({
      success: true,
      data: {
        platform_stats: {
          total_devices: totalDevices,
          connected_brands: connectedBrands,
          total_users: totalUsers,
          service_orders_today: serviceOrdersToday,
          firmware_updates_available: firmwareUpdatesAvailable
        },
        protocol_support: protocolSupport,
        demo_accounts: demoAccounts,
        business_modules: businessModulesWithStats,
        featured_scenes: featuredScenes,
        energy_preview: energyPreview,
        product_preview: productPreview
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
