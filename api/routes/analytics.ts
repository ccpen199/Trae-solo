import { Router } from 'express';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.js';
import { success, error } from '../utils/response.js';
import { queryMany, queryOne } from '../db.js';
import type { TeamFissionNode, SalesTrendData, MarketSaturationItem } from '../../shared/types.js';

const router = Router();

function buildTeamTree(parentId: number | null, users: Array<{ id: number; real_name: string; role: string; level: number; parent_id: number | null }>): TeamFissionNode[] {
  return users
    .filter(u => u.parent_id === parentId)
    .map(u => ({
      id: u.id,
      name: u.real_name,
      role: u.role === 'sales' ? '直销员' : u.role === 'store_owner' ? '生活馆店主' : '运营',
      level: u.level,
      salesAmount: Math.floor(Math.random() * 500000) + 50000,
      teamSize: users.filter(c => c.parent_id === u.id).length + Math.floor(Math.random() * 10),
      children: buildTeamTree(u.id, users),
    }));
}

router.get('/team/fission', authMiddleware, roleMiddleware(['operator', 'admin']), (req, res) => {
  try {
    const users = queryMany<{ id: number; real_name: string; role: string; level: number; parent_id: number | null }>(
      'SELECT id, real_name, role, level, parent_id FROM users WHERE status = ? ORDER BY level',
      ['active']
    );

    const tree = buildTeamTree(null, users);

    res.json(success(tree));
  } catch {
    res.status(500).json(error('获取团队裂变数据失败', 500));
  }
});

router.get('/sales/trend', authMiddleware, roleMiddleware(['operator', 'admin']), (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    const data: SalesTrendData[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      data.push({
        date: dateStr,
        salesAmount: Math.floor(Math.random() * 100000) + 20000,
        orderCount: Math.floor(Math.random() * 200) + 30,
        customerCount: Math.floor(Math.random() * 100) + 10,
      });
    }

    res.json(success(data));
  } catch {
    res.status(500).json(error('获取销售趋势失败', 500));
  }
});

router.get('/market/saturation', authMiddleware, roleMiddleware(['operator', 'admin']), (req, res) => {
  try {
    const data: MarketSaturationItem[] = [
      { region: '北京市', population: 21890000, dealerCount: 1256, saturationRate: 72.5, potentialScore: 45 },
      { region: '上海市', population: 24870000, dealerCount: 1423, saturationRate: 68.3, potentialScore: 55 },
      { region: '广州市', population: 18810000, dealerCount: 876, saturationRate: 58.2, potentialScore: 72 },
      { region: '深圳市', population: 17560000, dealerCount: 798, saturationRate: 52.4, potentialScore: 78 },
      { region: '杭州市', population: 12200000, dealerCount: 654, saturationRate: 48.6, potentialScore: 82 },
      { region: '成都市', population: 21190000, dealerCount: 567, saturationRate: 38.9, potentialScore: 91 },
      { region: '武汉市', population: 13730000, dealerCount: 432, saturationRate: 34.5, potentialScore: 93 },
      { region: '西安市', population: 13160000, dealerCount: 378, saturationRate: 31.2, potentialScore: 95 },
      { region: '南京市', population: 9420000, dealerCount: 521, saturationRate: 47.8, potentialScore: 81 },
      { region: '重庆市', population: 32120000, dealerCount: 892, saturationRate: 45.6, potentialScore: 85 },
    ];

    res.json(success(data));
  } catch {
    res.status(500).json(error('获取市场饱和度数据失败', 500));
  }
});

export default router;
