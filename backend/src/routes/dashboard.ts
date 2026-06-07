import { Router, Request, Response } from 'express';
import { db } from '../models/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

function getGreenLevel(score: number): string {
  if (score >= 90) return '节能明星';
  if (score >= 70) return '环保先锋';
  if (score >= 50) return '绿色达人';
  return '节能新手';
}

router.get('/summary', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    const nowStr = now.toISOString().split('T')[0];

    const user = db.prepare('SELECT points, membership_level FROM users WHERE id = ?').get(userId) as any;

    const totalDevices = (db.prepare('SELECT COUNT(*) as count FROM devices WHERE user_id = ?').get(userId) as any).count;
    const onlineDevices = (db.prepare('SELECT COUNT(*) as count FROM devices WHERE user_id = ? AND status = ?').get(userId, 'online') as any).count;
    const offlineDevices = totalDevices - onlineDevices;

    const activeScenes = (db.prepare('SELECT COUNT(*) as count FROM scenes WHERE user_id = ?').get(userId) as any).count;
    const pendingServices = (db.prepare('SELECT COUNT(*) as count FROM service_orders WHERE user_id = ? AND status = ?').get(userId, 'pending') as any).count;

    const protocolSupport = db.prepare(`
      SELECT protocol, COUNT(*) as count FROM devices 
      WHERE user_id = ? GROUP BY protocol
    `).all(userId) as any[];

    const protocolMap: Record<string, number> = {
      uhome: 0,
      matter: 0,
      wifi: 0,
      zigbee: 0,
      ir_bridge: 0
    };
    protocolSupport.forEach((p: any) => {
      const key = p.protocol === 'uhome' ? 'uhome' :
                  p.protocol === 'matter' ? 'matter' :
                  p.protocol === 'wifi' ? 'wifi' :
                  p.protocol === 'zigbee' ? 'zigbee' :
                  p.protocol === 'ir_bridge' ? 'ir_bridge' : null;
      if (key) protocolMap[key] = p.count;
    });

    const irBridgesTotal = (db.prepare('SELECT COUNT(*) as count FROM ir_bridges WHERE user_id = ?').get(userId) as any).count;
    const irBridgesOnline = (db.prepare('SELECT COUNT(*) as count FROM ir_bridges WHERE user_id = ? AND status = ?').get(userId, 'online') as any).count;
    const irCodesLearned = (db.prepare('SELECT COUNT(*) as count FROM ir_codes c JOIN ir_bridges b ON c.bridge_id = b.id WHERE b.user_id = ?').get(userId) as any).count;

    const lastDiscovery = db.prepare(`
      SELECT * FROM device_metrics 
      WHERE metric_key = 'discovery_scan' 
      ORDER BY timestamp DESC LIMIT 1
    `).get() as any;

    const discovery = {
      scanning: false,
      devices_found: lastDiscovery ? Number(lastDiscovery.metric_value) : 0,
      last_scan_at: lastDiscovery ? lastDiscovery.timestamp : null
    };

    let channelBinding = null;
    if (userRole === 'platform' || userRole === 'admin') {
      const totalChannels = (db.prepare('SELECT COUNT(*) as count FROM channels').get() as any).count;
      const boundDevices = (db.prepare('SELECT COUNT(*) as count FROM channel_device_bindings').get() as any).count;
      const pendingApprovals = 0;
      channelBinding = {
        total_channels: totalChannels,
        bound_devices: boundDevices,
        pending_approvals: pendingApprovals
      };
    }

    const energy7Days = db.prepare(`
      SELECT date, SUM(kwh) as kwh, SUM(cost) as cost 
      FROM energy_consumption 
      WHERE user_id = ? AND date >= ? 
      GROUP BY date ORDER BY date ASC
    `).all(userId, sevenDaysAgoStr) as any[];

    const last7days = energy7Days.map((e: any) => ({
      date: e.date,
      kwh: Number(e.kwh.toFixed(2)),
      cost: Number(e.cost.toFixed(2)),
      points_earned: Math.round(e.kwh * 2)
    }));

    const energyTotal = db.prepare(`
      SELECT SUM(kwh) as total_kwh, SUM(cost) as total_cost 
      FROM energy_consumption 
      WHERE user_id = ? AND date >= ?
    `).get(userId, sevenDaysAgoStr) as any;

    const totalKwh = Number((energyTotal?.total_kwh || 0).toFixed(2));
    const totalCost = Number((energyTotal?.total_cost || 0).toFixed(2));
    const avgDaily = Number((Number(totalKwh) / 7).toFixed(2));

    const baselineKwh = 100;
    const rankPercentage = Math.min(99, Math.max(1, Math.round((1 - Number(totalKwh) / baselineKwh) * 100)));

    const greenReportData = db.prepare(`
      SELECT * FROM green_reports 
      WHERE user_id = ? 
      ORDER BY created_at DESC LIMIT 1
    `).get(userId) as any;

    const savedKwh = greenReportData?.saved_kwh || Number(totalKwh) * 0.1;
    const carbonReduction = Number((savedKwh * 0.785).toFixed(2));
    const equivalentTrees = Number((carbonReduction / 18.3).toFixed(2));
    const greenScore = Math.min(100, 60 + Math.round(savedKwh * 2));

    const deviceBreakdownRaw = db.prepare(`
      SELECT d.name, d.type, SUM(e.kwh) as total_kwh 
      FROM energy_consumption e 
      JOIN devices d ON e.device_id = d.id 
      WHERE e.user_id = ? AND e.date >= ? 
      GROUP BY e.device_id 
      ORDER BY total_kwh DESC LIMIT 5
    `).all(userId, sevenDaysAgoStr) as any[];

    const deviceBreakdown = deviceBreakdownRaw.map((d: any, index: number) => {
      const percentage = Number(totalKwh) > 0 ? Math.round((d.total_kwh / Number(totalKwh)) * 100) : 0;
      const trends: Array<'up' | 'down' | 'stable'> = ['up', 'down', 'stable'];
      return {
        name: d.name,
        type: d.type,
        kwh: Number(d.total_kwh.toFixed(2)),
        percentage,
        trend: trends[index % 3]
      };
    });

    const quickScenesRaw = db.prepare(`
      SELECT * FROM scenes 
      WHERE user_id = ? 
      ORDER BY COALESCE(execution_count, 0) DESC 
      LIMIT 5
    `).all(userId) as any[];

    const quickScenes = quickScenesRaw.map((s: any) => {
      const actions = JSON.parse(s.actions);
      return {
        id: s.id,
        name: s.name,
        description: s.description,
        trigger_type: s.trigger_type,
        is_geek_mode: s.is_geek_mode,
        action_count: actions.length,
        last_executed_at: s.last_executed_at,
        execution_count: s.execution_count || 0
      };
    });

    const recentExecutionsRaw = db.prepare(`
      SELECT sl.*, s.name as scene_name 
      FROM scene_logs sl 
      JOIN scenes s ON sl.scene_id = s.id 
      WHERE s.user_id = ? 
      ORDER BY sl.created_at DESC LIMIT 5
    `).all(userId) as any[];

    const recentExecutions = recentExecutionsRaw.map((log: any) => ({
      id: log.id,
      scene_name: log.scene_name,
      executed_at: log.created_at,
      success: log.success,
      device_results: null
    }));

    const recentDevicesRaw = db.prepare(`
      SELECT d.*, 
             COALESCE(dhs.score, 85) as health_score,
             COALESCE(dhs.risk_level, 'low') as risk_level,
             COALESCE(dhs.analysis, '') as analysis
      FROM devices d 
      LEFT JOIN device_health_scores dhs ON d.id = dhs.device_id
      WHERE d.user_id = ? 
      ORDER BY d.created_at DESC 
      LIMIT 5
    `).all(userId) as any[];

    const recentDevices = recentDevicesRaw.map((d: any) => {
      const latestFirmware = db.prepare(`
        SELECT fr.version, fr.is_gray 
        FROM firmware_releases fr 
        WHERE fr.device_model = ? AND fr.status = 'published'
        ORDER BY fr.created_at DESC LIMIT 1
      `).get(d.model) as any;

      const pendingUpdate = db.prepare(`
        SELECT fu.status 
        FROM firmware_updates fu 
        JOIN firmware_releases fr ON fu.firmware_id = fr.id
        WHERE fu.device_id = ? AND fr.device_model = ?
        ORDER BY fu.started_at DESC LIMIT 1
      `).get(d.id, d.model) as any;

      const hasPendingService = (db.prepare(`
        SELECT COUNT(*) as count FROM service_orders 
        WHERE device_id = ? AND status != 'completed' AND status != 'cancelled'
      `).get(d.id) as any).count > 0 ? 1 : 0;

      const latestService = db.prepare(`
        SELECT status, created_at 
        FROM service_orders 
        WHERE device_id = ? 
        ORDER BY created_at DESC LIMIT 1
      `).get(d.id) as any;

      const accessoriesCount = (db.prepare(`
        SELECT COUNT(*) as count FROM products 
        WHERE category = ? AND aftersales_parts > 0
      `).get(d.type) as any).count;

      const tradeinValue = db.prepare(`
        SELECT estimated_value FROM trade_in_estimations 
        WHERE user_id = ? AND old_device_model = ? AND status = 'pending'
        ORDER BY created_at DESC LIMIT 1
      `).get(userId, d.model) as any;

      const warrantyDays = d.type === 'air_conditioner' ? 365 : d.type === 'washer' ? 730 : 365;
      const warrantyExpired = 0;

      let grayStatus: 'none' | 'pending' | 'in_progress' | 'completed' | null = 'none';
      if (pendingUpdate) {
        grayStatus = pendingUpdate.status === 'pending' ? 'pending' :
                     pendingUpdate.status === 'in_progress' ? 'in_progress' :
                     pendingUpdate.status === 'completed' ? 'completed' : 'none';
      } else if (latestFirmware?.is_gray) {
        grayStatus = 'pending';
      }

      return {
        id: d.id,
        name: d.name,
        brand: d.brand,
        type: d.type,
        status: d.status as 'online' | 'offline',
        health_score: d.health_score,
        risk_level: d.risk_level as 'low' | 'medium' | 'high',
        firmware: {
          current_version: d.firmware_version || '1.0.0',
          update_available: latestFirmware && latestFirmware.version !== d.firmware_version ? 1 : 0,
          latest_version: latestFirmware?.version || null,
          gray_status: grayStatus
        },
        service: {
          has_pending: hasPendingService,
          latest_status: latestService?.status || null,
          warranty_days: warrantyDays,
          warranty_expired: warrantyExpired
        },
        related_products: {
          accessories_count: accessoriesCount,
          tradein_value: tradeinValue?.estimated_value || null
        }
      };
    });

    const pendingFirmwareUpdates = (db.prepare(`
      SELECT COUNT(*) as count 
      FROM firmware_updates fu
      JOIN devices d ON fu.device_id = d.id
      WHERE d.user_id = ? AND fu.status = 'pending'
    `).get(userId) as any).count;

    const highRiskDevices = (db.prepare(`
      SELECT COUNT(*) as count 
      FROM device_health_scores dhs
      JOIN devices d ON dhs.device_id = d.id
      WHERE d.user_id = ? AND dhs.risk_level = 'high'
    `).get(userId) as any).count;

    const pendingServiceOrders = (db.prepare(`
      SELECT COUNT(*) as count FROM service_orders 
      WHERE user_id = ? AND status = 'pending'
    `).get(userId) as any).count;

    const expiringWarranties = 0;

    const lowStockAccessories = (db.prepare(`
      SELECT COUNT(*) as count FROM products 
      WHERE aftersales_parts > 0 AND aftersales_parts < 10
    `).get() as any).count;

    const tradeinOpportunities = (db.prepare(`
      SELECT COUNT(*) as count FROM trade_in_estimations 
      WHERE user_id = ? AND status = 'pending'
    `).get(userId) as any).count;

    let roleSpecific: Record<string, any> | null = null;
    if (userRole === 'ops') {
      roleSpecific = {
        firmware_queue_size: pendingFirmwareUpdates,
        high_risk_alerts: highRiskDevices,
        maintenance_tasks: pendingServiceOrders
      };
    } else if (userRole === 'platform' || userRole === 'admin') {
      roleSpecific = {
        channel_binding: channelBinding,
        total_users: (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count,
        total_devices_platform: (db.prepare('SELECT COUNT(*) as count FROM devices').get() as any).count
      };
    }

    const normalizedChannelBinding = channelBinding
      ? {
          ...channelBinding,
          pending_approval: channelBinding.pending_approvals
        }
      : null;

    const deviceTypeBreakdown = {
      wifi: protocolMap.wifi,
      matter: protocolMap.matter,
      zigbee: protocolMap.zigbee
    };

    const protocolAccess = {
      uhome: { count: protocolMap.uhome, total: totalDevices },
      matter: { count: protocolMap.matter, total: totalDevices },
      wifi: { count: protocolMap.wifi, total: totalDevices },
      zigbee: { count: protocolMap.zigbee, total: totalDevices },
      ir_bridge: { count: protocolMap.ir_bridge, total: Math.max(irBridgesTotal, protocolMap.ir_bridge) }
    };

    const normalizedRecentDevices = recentDevices.map((device: any) => ({
      ...device,
      firmware_status: device.firmware.update_available
        ? 'pending'
        : device.firmware.gray_status === 'in_progress'
          ? 'gray'
          : 'latest',
      service_status: device.service.warranty_expired
        ? 'expired'
        : device.service.has_pending
          ? 'pending'
          : 'normal',
      accessories_count: device.related_products.accessories_count,
      tradein_value: device.related_products.tradein_value || 0
    }));

    const businessEntries = {
      firmware_pending: pendingFirmwareUpdates,
      high_risk_devices: highRiskDevices,
      pending_services: pendingServiceOrders,
      warranty_expiring: expiringWarranties,
      low_stock_accessories: lowStockAccessories,
      tradein_opportunities: tradeinOpportunities
    };

    res.json({
      success: true,
      data: {
        overview: {
          total_devices: totalDevices,
          online_devices: onlineDevices,
          offline_devices: offlineDevices,
          active_scenes: activeScenes,
          pending_services: pendingServices,
          protocol_support: protocolMap,
          ir_bridge_online: irBridgesOnline,
          ir_codes_learned: irCodesLearned,
          device_type_breakdown: deviceTypeBreakdown,
          ir_bridges: {
            total: irBridgesTotal,
            online: irBridgesOnline,
            learned_codes: irCodesLearned
          },
          discovery,
          channel_binding: normalizedChannelBinding,
          points_balance: user?.points || 0,
          membership_level: user?.membership_level || 'standard'
        },
        protocol_access: protocolAccess,
        discovery: {
          is_scanning: discovery.scanning,
          last_scan_time: discovery.last_scan_at || '暂无扫描记录',
          devices_found: discovery.devices_found
        },
        energy_trend: last7days,
        energy_summary: {
          total_kwh: Number(totalKwh),
          total_cost: Number(totalCost),
          avg_daily_kwh: avgDaily,
          percentile_rank: rankPercentage
        },
        green_report: {
          green_score: greenScore,
          level: getGreenLevel(greenScore),
          carbon_reduction_kg: carbonReduction,
          trees_equivalent: Number(equivalentTrees)
        },
        top5_consumption: deviceBreakdown,
        quick_scenes: quickScenes,
        recent_executions: recentExecutions,
        recent_devices: normalizedRecentDevices,
        business_entries: businessEntries,
        channel_binding: normalizedChannelBinding,
        energy: {
          last7days,
          total_kwh: Number(totalKwh),
          total_cost: Number(totalCost),
          avg_daily: avgDaily,
          rank_percentage: rankPercentage,
          green_report: {
            carbon_reduction_kg: carbonReduction,
            equivalent_trees: Number(equivalentTrees),
            green_score: greenScore,
            level: getGreenLevel(greenScore)
          },
          device_breakdown: deviceBreakdown
        },
        scenes: {
          quick_scenes: quickScenes,
          recent_executions: recentExecutions
        },
        devices: {
          recent: recentDevices,
          business_links: {
            pending_firmware_updates: pendingFirmwareUpdates,
            high_risk_devices: highRiskDevices,
            pending_service_orders: pendingServiceOrders,
            expiring_warranties: expiringWarranties,
            low_stock_accessories: lowStockAccessories,
            tradein_opportunities: tradeinOpportunities
          }
        },
        role_specific: roleSpecific
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
