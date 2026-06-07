import { Router, Request, Response } from 'express';
import { db } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const CATEGORIES = ['news', 'job', 'rental', 'secondhand', 'dating', 'show'];

function calculateCredibility(userId: number, cityId: number, ipAddress: string): number {
  let score = 50;
  const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (user) {
    if (user.is_verified) score += 20;
    if (user.city_id === cityId) score += 15;
    if (user.ip_address === ipAddress) score += 5;
    const postCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ? AND is_deleted = 0').get(userId) as { count: number };
    if (postCount.count > 10) score += 10;
  }
  return Math.min(score, 100);
}

function checkSensitiveWords(content: string): boolean {
  const words = db.prepare('SELECT word FROM sensitive_words').all() as { word: string }[];
  return words.some(w => content.includes(w.word));
}

router.get('/', (req: Request, res: Response) => {
  try {
    const { city_id, district, street, category, page = '1', pageSize = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    const offset = (pageNum - 1) * pageSizeNum;

    let whereClause = 'WHERE p.is_deleted = 0';
    const params: any[] = [];

    if (city_id) {
      whereClause += ' AND p.city_id = ?';
      params.push(city_id);
    }
    if (district) {
      whereClause += ' AND p.district = ?';
      params.push(district);
    }
    if (street) {
      whereClause += ' AND p.street = ?';
      params.push(street);
    }
    if (category) {
      whereClause += ' AND p.category = ?';
      params.push(category);
    }

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM posts p ${whereClause}`).get(...params) as { total: number };
    
    const posts = db.prepare(`
      SELECT p.*, u.nickname as author_name, u.avatar as author_avatar, u.is_verified as author_verified,
             c.name as city_name
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN cities c ON p.city_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSizeNum, offset);

    const enrichedPosts = posts.map((post: any) => {
      let extra = {};
      if (post.category === 'rental') {
        const rental: any = db.prepare('SELECT * FROM post_rental WHERE post_id = ?').get(post.id);
        if (rental) extra = { rental };
      } else if (post.category === 'job') {
        const job: any = db.prepare('SELECT * FROM post_job WHERE post_id = ?').get(post.id);
        if (job) extra = { job };
      } else if (post.category === 'dating') {
        const dating: any = db.prepare('SELECT * FROM post_dating WHERE post_id = ?').get(post.id);
        if (dating) extra = { dating };
      } else if (post.category === 'secondhand') {
        const secondhand: any = db.prepare('SELECT * FROM post_secondhand WHERE post_id = ?').get(post.id);
        if (secondhand) extra = { secondhand };
      }
      return { ...post, extra };
    });

    res.json({
      posts: enrichedPosts,
      total: countResult.total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(countResult.total / pageSizeNum),
    });
  } catch (error) {
    console.error('获取帖子列表错误:', error);
    res.status(500).json({ error: '获取帖子列表失败' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const post: any = db.prepare(`
      SELECT p.*, u.nickname as author_name, u.avatar as author_avatar, u.is_verified as author_verified,
             c.name as city_name
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN cities c ON p.city_id = c.id
      WHERE p.id = ? AND p.is_deleted = 0
    `).get(req.params.id);

    if (!post) {
      res.status(404).json({ error: '帖子不存在' });
      return;
    }

    db.prepare('UPDATE posts SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);

    let extra = {};
    if (post.category === 'rental') {
      const rental: any = db.prepare('SELECT * FROM post_rental WHERE post_id = ?').get(post.id);
      if (rental) extra = { rental };
    } else if (post.category === 'job') {
      const job: any = db.prepare('SELECT * FROM post_job WHERE post_id = ?').get(post.id);
      if (job) extra = { job };
    } else if (post.category === 'dating') {
      const dating: any = db.prepare('SELECT * FROM post_dating WHERE post_id = ?').get(post.id);
      if (dating) extra = { dating };
    } else if (post.category === 'secondhand') {
      const secondhand: any = db.prepare('SELECT * FROM post_secondhand WHERE post_id = ?').get(post.id);
      if (secondhand) extra = { secondhand };
    }

    const comments = db.prepare(`
      SELECT c.*, u.nickname as author_name, u.avatar as author_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ? AND c.is_deleted = 0
      ORDER BY c.created_at DESC
    `).all(req.params.id);

    res.json({ post: { ...post, extra }, comments });
  } catch (error) {
    res.status(500).json({ error: '获取帖子详情失败' });
  }
});

router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { city_id, district, street, category, title, content, images, rental, job, dating, secondhand } = req.body;

    if (!CATEGORIES.includes(category)) {
      res.status(400).json({ error: '无效的内容分类' });
      return;
    }
    if (!title || !content) {
      res.status(400).json({ error: '标题和内容不能为空' });
      return;
    }

    const hasSensitive = checkSensitiveWords(title + content);
    const ipAddress = req.ip || '';
    const credibility = calculateCredibility(req.user!.id, city_id, ipAddress);

    const isApproved = hasSensitive ? 0 : 1;

    const result = db.prepare(`
      INSERT INTO posts (user_id, city_id, district, street, category, title, content, images, is_approved, credibility_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user!.id, city_id, district, street, category, title, content, images ? JSON.stringify(images) : null, isApproved, credibility);

    const postId = result.lastInsertRowid;

    if (category === 'rental' && rental) {
      db.prepare(`
        INSERT INTO post_rental (post_id, orientation, floor, subway_station, price, area, rooms)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(postId, rental.orientation, rental.floor, rental.subway_station, rental.price, rental.area, rental.rooms);
    } else if (category === 'job' && job) {
      db.prepare(`
        INSERT INTO post_job (post_id, job_type, salary_min, salary_max, experience_required, education_required, company_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(postId, job.job_type, job.salary_min, job.salary_max, job.experience_required, job.education_required, job.company_name);
    } else if (category === 'dating' && dating) {
      db.prepare(`
        INSERT INTO post_dating (post_id, gender, age, height, education, occupation)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(postId, dating.gender, dating.age, dating.height, dating.education, dating.occupation);
    } else if (category === 'secondhand' && secondhand) {
      db.prepare(`
        INSERT INTO post_secondhand (post_id, price, condition, category)
        VALUES (?, ?, ?, ?)
      `).run(postId, secondhand.price, secondhand.condition, secondhand.category);
    }

    if (hasSensitive) {
      db.prepare('INSERT INTO audit_logs (post_id, user_id, action, reason) VALUES (?, ?, ?, ?)').run(postId, req.user!.id, 'pending_review', '包含敏感词');
    }

    res.json({ id: postId, isApproved, credibility });
  } catch (error) {
    console.error('创建帖子错误:', error);
    res.status(500).json({ error: '创建帖子失败' });
  }
});

router.post('/:id/like', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const existing = db.prepare('SELECT id FROM likes WHERE post_id = ? AND user_id = ?').get(req.params.id, req.user!.id);
    if (existing) {
      db.prepare('DELETE FROM likes WHERE post_id = ? AND user_id = ?').run(req.params.id, req.user!.id);
      db.prepare('UPDATE posts SET like_count = like_count - 1 WHERE id = ?').run(req.params.id);
      res.json({ liked: false });
    } else {
      db.prepare('INSERT INTO likes (post_id, user_id) VALUES (?, ?)').run(req.params.id, req.user!.id);
      db.prepare('UPDATE posts SET like_count = like_count + 1 WHERE id = ?').run(req.params.id);
      res.json({ liked: true });
    }
  } catch (error) {
    res.status(500).json({ error: '操作失败' });
  }
});

router.post('/:id/comment', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { content, parent_id } = req.body;
    if (!content) {
      res.status(400).json({ error: '评论内容不能为空' });
      return;
    }

    const hasSensitive = checkSensitiveWords(content);

    db.prepare('INSERT INTO comments (post_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)').run(req.params.id, req.user!.id, content, parent_id || 0);
    db.prepare('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?').run(req.params.id);

    if (hasSensitive) {
      db.prepare('INSERT INTO audit_logs (post_id, user_id, action, reason) VALUES (?, ?, ?, ?)').run(req.params.id, req.user!.id, 'comment_sensitive', '评论包含敏感词');
    }

    res.json({ message: '评论成功' });
  } catch (error) {
    res.status(500).json({ error: '评论失败' });
  }
});

router.post('/:id/share', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { share_chain } = req.body;
    db.prepare('INSERT INTO shares (post_id, user_id, share_chain) VALUES (?, ?, ?)').run(req.params.id, req.user!.id, share_chain || '');
    db.prepare('UPDATE posts SET share_count = share_count + 1 WHERE id = ?').run(req.params.id);
    res.json({ message: '分享成功' });
  } catch (error) {
    res.status(500).json({ error: '分享失败' });
  }
});

router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const post: any = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) {
      res.status(404).json({ error: '帖子不存在' });
      return;
    }
    if (post.user_id !== req.user!.id && !req.user!.isAdmin) {
      res.status(403).json({ error: '无权删除此帖子' });
      return;
    }
    db.prepare('UPDATE posts SET is_deleted = 1 WHERE id = ?').run(req.params.id);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除失败' });
  }
});

export default router;
