import { Router, Request, Response } from 'express';
import { db } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const pendingCargo = (db.prepare("SELECT COUNT(*) as count FROM cargo WHERE status = 'pending'").get() as any).count;
    const availableVehicles = (db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status = 'available'").get() as any).count;
    const completedToday = (db.prepare("SELECT COUNT(*) as count FROM transport_tasks WHERE status = 'completed' AND date(updated_at) = date('now')").get() as any).count;
    const inTransitTasks = (db.prepare("SELECT COUNT(*) as count FROM transport_tasks WHERE status IN ('loading','in_transit')").get() as any).count;

    const todos: any[] = [];

    const pendingCargoItems = db.prepare("SELECT id, cargo_name, cargo_type, origin_city, dest_city, created_at FROM cargo WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5").all() as any[];
    for (const c of pendingCargoItems) {
      todos.push({
        id: c.id,
        title: `货源待匹配: ${c.cargo_name} (${c.origin_city}→${c.dest_city})`,
        type: '货源匹配',
        created_at: c.created_at,
      });
    }

    const pendingContractItems = db.prepare("SELECT id, contract_number, status, created_at FROM contracts WHERE status IN ('draft','pending_signature') ORDER BY created_at DESC LIMIT 3").all() as any[];
    for (const c of pendingContractItems) {
      todos.push({
        id: c.id,
        title: `合同待签署: ${c.contract_number}`,
        type: '合同签署',
        created_at: c.created_at,
      });
    }

    const pendingRouteItems = db.prepare("SELECT id, route_name, status, created_at FROM dedicated_routes WHERE status = 'pending_review' ORDER BY created_at DESC LIMIT 3").all() as any[];
    for (const r of pendingRouteItems) {
      todos.push({
        id: r.id,
        title: `专线待审核: ${r.route_name}`,
        type: '专线审核',
        created_at: r.created_at,
      });
    }

    const matches: any[] = [];
    const recentCargo = db.prepare("SELECT id, cargo_name, origin_city, dest_city FROM cargo WHERE status = 'pending' ORDER BY created_at DESC LIMIT 3").all() as any[];
    const recentVehicles = db.prepare("SELECT id, plate_number, current_city FROM vehicles WHERE status = 'available' ORDER BY created_at DESC LIMIT 3").all() as any[];

    for (let i = 0; i < Math.min(recentCargo.length, recentVehicles.length); i++) {
      const c = recentCargo[i];
      const v = recentVehicles[i];
      matches.push({
        id: i + 1,
        cargo: c.cargo_name,
        vehicle: v.plate_number,
        score: Math.floor(60 + Math.random() * 30),
        route: `${c.origin_city} → ${c.dest_city}`,
      });
    }

    const totals = {
      cargo: (db.prepare('SELECT COUNT(*) as count FROM cargo').get() as any).count,
      vehicles: (db.prepare('SELECT COUNT(*) as count FROM vehicles').get() as any).count,
      tasks: (db.prepare('SELECT COUNT(*) as count FROM transport_tasks').get() as any).count,
      users: (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count,
    };

    const cargoByType = db.prepare('SELECT cargo_type, COUNT(*) as count FROM cargo GROUP BY cargo_type').all();
    const vehiclesByType = db.prepare('SELECT vehicle_type, COUNT(*) as count FROM vehicles GROUP BY vehicle_type').all();
    const usersByRole = db.prepare('SELECT role, COUNT(*) as count FROM users GROUP BY role').all();

    res.json({
      pending_cargo: pendingCargo,
      idle_vehicle: availableVehicles,
      today_deals: completedToday,
      active_tasks: inTransitTasks,
      todos,
      matches,
      totals,
      breakdown: { cargoByType, vehiclesByType, usersByRole },
    });
  } catch (err) {
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

router.get('/cost-index', async (_req: Request, res: Response) => {
  try {
    const data = db.prepare('SELECT * FROM cost_indices ORDER BY period ASC').all() as any[];

    if (data.length === 0) {
      const provinces = ['山东', '江苏', '浙江', '广东', '河南', '河北', '四川', '湖北'];
      const now = new Date();
      for (let m = 11; m >= 0; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        for (const province of provinces) {
          const index = Math.round((85 + Math.random() * 40) * 100) / 100;
          db.prepare('INSERT INTO cost_indices (period, province, city, cost_index) VALUES (?, ?, ?, ?)')
            .run(period, province, '', index);
        }
      }
    }

    const allData = db.prepare('SELECT period, province, cost_index FROM cost_indices ORDER BY period ASC').all() as any[];

    const flatData: { date: string; index: number; province: string }[] = [];
    for (const item of allData) {
      flatData.push({
        date: item.period,
        index: item.cost_index,
        province: item.province,
      });
    }

    res.json(flatData);
  } catch (err) {
    res.status(500).json({ error: '获取成本指数失败' });
  }
});

router.get('/supply-demand', async (_req: Request, res: Response) => {
  try {
    const data = db.prepare('SELECT * FROM supply_demand_stats ORDER BY period ASC').all() as any[];

    if (data.length === 0) {
      const provinces = ['山东', '江苏', '浙江', '广东', '河南', '河北', '四川', '湖北'];
      const now = new Date();
      for (let m = 11; m >= 0; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        for (const province of provinces) {
          const demand = Math.round(1000 + Math.random() * 5000);
          const supply = Math.round(800 + Math.random() * 4500);
          const matchRate = Math.round(Math.random() * 100) / 100;
          db.prepare('INSERT INTO supply_demand_stats (period, province, city, cargo_count, vehicle_count, match_rate) VALUES (?, ?, ?, ?, ?, ?)')
            .run(period, province, '', demand, supply, matchRate);
        }
      }
    }

    const allData = db.prepare('SELECT period, province, cargo_count, vehicle_count, match_rate FROM supply_demand_stats ORDER BY period ASC').all() as any[];

    const flatData = allData.map((item: any) => ({
      period: item.period,
      province: item.province,
      cargo_demand: item.cargo_count,
      vehicle_supply: item.vehicle_count,
      avg_price: Math.round((200 + item.match_rate * 300) * 100) / 100,
      avg_transit_days: Math.round(1 + item.match_rate * 5),
    }));

    res.json(flatData);
  } catch (err) {
    res.status(500).json({ error: '获取供需数据失败' });
  }
});

export default router;
