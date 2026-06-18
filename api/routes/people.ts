import { Router } from 'express';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.js';
import { success, error, paginated } from '../utils/response.js';
import { db, queryMany, queryOne, execute } from '../db.js';
import crypto from 'crypto';
import type { 
  Customer, CustomerGraph, CustomerRelationNode, CustomerRelationLink,
  ShareMaterial, ShareLink, ShareStatistics, PersonalQRCode
} from '../../shared/types.js';

const router = Router();

router.get('/qrcode/personal', authMiddleware, roleMiddleware(['sales', 'store_owner']), (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const shortCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const url = `${process.env.APP_URL || 'http://localhost:5173'}/r/${shortCode}`;
    
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 30);

    execute(
      'INSERT OR REPLACE INTO share_links (user_id, original_url, short_code, material_type) VALUES (?, ?, ?, ?)',
      [userId, url, shortCode, 'personal']
    );

    res.json(success<PersonalQRCode>({
      code: shortCode,
      url,
      expireAt: expireAt.toISOString(),
      type: 'personal',
    }));
  } catch {
    res.status(500).json(error('生成二维码失败', 500));
  }
});

router.get('/customers', authMiddleware, roleMiddleware(['sales', 'store_owner', 'operator', 'admin']), (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const salesId = req.query.salesId as string;
    
    let whereClause = '';
    const params: unknown[] = [];
    
    if (req.user?.role === 'sales') {
      whereClause = 'WHERE sales_id = ?';
      params.push(req.user.userId);
    } else if (salesId) {
      whereClause = 'WHERE sales_id = ?';
      params.push(salesId);
    }

    const offset = (page - 1) * pageSize;
    
    const customers = queryMany<Customer>(
      `SELECT * FROM customers ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const countResult = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM customers ${whereClause}`,
      params
    );

    const transformed = customers.map(c => ({
      ...c,
      totalPurchases: (c as unknown as { total_purchases: number }).total_purchases,
      lastPurchaseAt: (c as unknown as { last_purchase_at: string }).last_purchase_at,
      createdAt: (c as unknown as { created_at: string }).created_at,
      salesId: (c as unknown as { sales_id: number }).sales_id,
      tags: (c as unknown as { tags: string }).tags ? JSON.parse((c as unknown as { tags: string }).tags) : [],
    }));

    res.json(paginated(transformed, countResult?.count || 0, page, pageSize));
  } catch {
    res.status(500).json(error('获取客户列表失败', 500));
  }
});

router.get('/customers/:id', authMiddleware, roleMiddleware(['sales', 'store_owner', 'operator', 'admin']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const customer = queryOne<Customer>(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );

    if (!customer) {
      res.status(404).json(error('客户不存在', 404));
      return;
    }

    const transformed: Customer = {
      ...customer,
      totalPurchases: (customer as unknown as { total_purchases: number }).total_purchases,
      lastPurchaseAt: (customer as unknown as { last_purchase_at: string }).last_purchase_at,
      createdAt: (customer as unknown as { created_at: string }).created_at,
      salesId: (customer as unknown as { sales_id: number }).sales_id,
      tags: (customer as unknown as { tags: string }).tags ? JSON.parse((customer as unknown as { tags: string }).tags) : [],
    };

    res.json(success(transformed));
  } catch {
    res.status(500).json(error('获取客户详情失败', 500));
  }
});

router.get('/customers/graph', authMiddleware, roleMiddleware(['sales', 'store_owner', 'operator', 'admin']), (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const nodes: CustomerRelationNode[] = [];
    const links: CustomerRelationLink[] = [];

    const user = queryOne<{ real_name: string }>('SELECT real_name FROM users WHERE id = ?', [userId]);
    
    nodes.push({
      id: 0,
      name: user?.real_name || '我',
      type: 'sales',
      level: 0,
      value: 100,
    });

    const customers = queryMany<{ id: number; name: string; level: string; total_purchases: number }>(
      'SELECT id, name, level, total_purchases FROM customers WHERE sales_id = ? ORDER BY total_purchases DESC LIMIT 20',
      [userId]
    );

    customers.forEach((c, idx) => {
      nodes.push({
        id: c.id,
        name: c.name,
        type: 'customer',
        level: c.level === 'vip' ? 1 : c.level === 'regular' ? 2 : 3,
        value: Math.min(100, Math.max(30, c.total_purchases / 100)),
      });

      links.push({
        source: 0,
        target: c.id,
        relation: c.total_purchases > 10000 ? 'purchase' : 'introduce',
      });

      if (idx % 3 === 0 && idx > 0) {
        nodes.push({
          id: 1000 + idx,
          name: `推荐人${Math.floor(idx / 3)}`,
          type: 'referrer',
          level: 2,
          value: 50,
        });
        links.push({
          source: c.id,
          target: 1000 + idx,
          relation: 'refer',
        });
      }
    });

    res.json(success<CustomerGraph>({ nodes, links }));
  } catch {
    res.status(500).json(error('获取客户关系图谱失败', 500));
  }
});

router.get('/share/materials', authMiddleware, roleMiddleware(['sales', 'store_owner']), (req, res) => {
  try {
    const materials: ShareMaterial[] = [
      { id: 1, title: '国珍松花粉产品介绍', type: 'poster', category: '产品', thumbnailUrl: '/images/poster1.jpg', fileUrl: '/files/poster1.pdf', description: '最新产品宣传海报', viewCount: 1256, shareCount: 456 },
      { id: 2, title: '健康养生知识分享', type: 'article', category: '知识', thumbnailUrl: '/images/article1.jpg', fileUrl: '/files/article1.pdf', description: '春季养生小知识', viewCount: 2341, shareCount: 892 },
      { id: 3, title: '产品使用视频教程', type: 'video', category: '培训', thumbnailUrl: '/images/video1.jpg', fileUrl: '/videos/tutorial1.mp4', description: '产品正确使用方法', viewCount: 892, shareCount: 234 },
      { id: 4, title: '事业机会介绍', type: 'image', category: '招商', thumbnailUrl: '/images/opportunity.jpg', fileUrl: '/files/opportunity.pdf', description: '加入我们共创未来', viewCount: 3567, shareCount: 1234 },
      { id: 5, title: '客户见证分享', type: 'poster', category: '案例', thumbnailUrl: '/images/testimonial.jpg', fileUrl: '/files/testimonial.pdf', description: '真实客户使用反馈', viewCount: 1678, shareCount: 567 },
      { id: 6, title: '新品上市宣传', type: 'poster', category: '产品', thumbnailUrl: '/images/newproduct.jpg', fileUrl: '/files/newproduct.pdf', description: '最新产品发布', viewCount: 4521, shareCount: 1892 },
    ];

    res.json(success(materials));
  } catch {
    res.status(500).json(error('获取素材库失败', 500));
  }
});

router.post('/share/generate', authMiddleware, roleMiddleware(['sales', 'store_owner']), (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { originalUrl, materialType } = req.body;
    const shortCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    execute(
      'INSERT INTO share_links (user_id, original_url, short_code, material_type) VALUES (?, ?, ?, ?)',
      [userId, originalUrl, shortCode, materialType]
    );

    const shareUrl = `${process.env.APP_URL || 'http://localhost:5173'}/r/${shortCode}`;

    res.json(success<ShareLink>({
      id: 1,
      userId: userId!,
      originalUrl,
      shortCode,
      materialType,
      viewCount: 0,
      conversionCount: 0,
      createdAt: new Date().toISOString(),
    } as ShareLink));
  } catch {
    res.status(500).json(error('生成分享链接失败', 500));
  }
});

router.get('/share/statistics', authMiddleware, roleMiddleware(['sales', 'store_owner']), (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    const stats = queryOne<{ totalShares: number; totalViews: number; totalConversions: number }>(
      `SELECT 
        COUNT(*) as totalShares,
        COALESCE(SUM(view_count), 0) as totalViews,
        COALESCE(SUM(conversion_count), 0) as totalConversions
       FROM share_links WHERE user_id = ?`,
      [userId]
    );

    const topMaterials = [
      { name: '国珍松花粉海报', views: 1256, conversions: 189 },
      { name: '健康养生文章', views: 892, conversions: 123 },
      { name: '新品上市宣传', views: 756, conversions: 98 },
      { name: '事业机会介绍', views: 634, conversions: 87 },
      { name: '客户见证分享', views: 521, conversions: 65 },
    ];

    const dailyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        shares: Math.floor(Math.random() * 20) + 5,
        views: Math.floor(Math.random() * 100) + 20,
      };
    });

    const result: ShareStatistics = {
      totalShares: stats?.totalShares || 0,
      totalViews: stats?.totalViews || 0,
      totalConversions: stats?.totalConversions || 0,
      conversionRate: stats?.totalViews ? Math.round((stats.totalConversions / stats.totalViews) * 10000) / 100 : 0,
      topMaterials,
      dailyData,
    };

    res.json(success(result));
  } catch {
    res.status(500).json(error('获取分享统计失败', 500));
  }
});

export default router;
