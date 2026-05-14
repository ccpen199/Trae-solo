import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../database';
import { generateId } from '../utils/crypto';
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from '../utils/response';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const createCommunitySchema = z.object({
  name: z.string().min(2, '名称至少2个字符').max(50, '名称最多50个字符'),
  description: z.string().max(500, '描述最多500个字符').optional(),
});

router.post('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json(errorResponse('未登录'));
    }
    
    const validation = createCommunitySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(badRequestResponse(validation.error.issues[0]?.message || '参数验证失败'));
    }
    
    const { name, description } = validation.data;
    const db = getDb();
    
    const existing = db.prepare('SELECT id FROM communities WHERE name = ?').get(name);
    if (existing) {
      return res.status(400).json(badRequestResponse('社团名称已存在'));
    }
    
    const communityId = generateId();
    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO communities (id, name, description, owner_id)
        VALUES (?, ?, ?, ?)
      `).run(communityId, name, description || null, req.userId);
      
      db.prepare(`
        INSERT INTO community_members (community_id, user_id, role)
        VALUES (?, ?, 'owner')
      `).run(communityId, req.userId);
    });
    transaction();
    
    return res.status(201).json(
      successResponse({
        community: {
          id: communityId,
          name,
          description,
          memberCount: 1,
          isJoined: true,
          role: 'owner',
        },
      }, '社团创建成功')
    );
  } catch (error) {
    console.error('Create community error:', error);
    return res.status(500).json(errorResponse('创建失败'));
  }
});

router.get('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json(errorResponse('未登录'));
    }
    
    const { limit = '20', offset = '0' } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 50);
    const offsetNum = parseInt(offset as string, 10) || 0;
    const db = getDb();
    
    const communities = db
      .prepare(`
        SELECT c.*, 
          cm.role as my_role,
          CASE WHEN cm.user_id IS NOT NULL THEN 1 ELSE 0 END as is_joined
        FROM communities c
        LEFT JOIN community_members cm ON c.id = cm.community_id AND cm.user_id = ?
        ORDER BY c.member_count DESC, c.created_at DESC
        LIMIT ? OFFSET ?
      `)
      .all(req.userId, limitNum, offsetNum) as Array<{
        id: string;
        name: string;
        description?: string;
        owner_id: string;
        member_count: number;
        created_at: string;
        my_role?: string;
        is_joined: number;
      }>;
    
    return res.json(
      successResponse({
        communities: communities.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          memberCount: c.member_count,
          isJoined: c.is_joined === 1,
          role: c.my_role,
          createdAt: c.created_at,
        })),
      })
    );
  } catch (error) {
    console.error('Get communities error:', error);
    return res.status(500).json(errorResponse('获取社团列表失败'));
  }
});

router.get('/:communityId', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json(errorResponse('未登录'));
    }
    
    const { communityId } = req.params;
    const db = getDb();
    
    const community = db
      .prepare(`
        SELECT c.*, 
          cm.role as my_role,
          CASE WHEN cm.user_id IS NOT NULL THEN 1 ELSE 0 END as is_joined
        FROM communities c
        LEFT JOIN community_members cm ON c.id = cm.community_id AND cm.user_id = ?
        WHERE c.id = ?
      `)
      .get(req.userId, communityId) as {
        id: string;
        name: string;
        description?: string;
        owner_id: string;
        member_count: number;
        created_at: string;
        my_role?: string;
        is_joined: number;
      } | undefined;
    
    if (!community) {
      return res.status(404).json(notFoundResponse('社团'));
    }
    
    const members = db
      .prepare(`
        SELECT u.id, u.nickname, u.avatar_config, cm.role
        FROM community_members cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.community_id = ?
        ORDER BY cm.joined_at ASC
        LIMIT 50
      `)
      .all(communityId) as Array<{
        id: string;
        nickname: string;
        avatar_config: string;
        role: string;
      }>;
    
    return res.json(
      successResponse({
        community: {
          id: community.id,
          name: community.name,
          description: community.description,
          memberCount: community.member_count,
          isJoined: community.is_joined === 1,
          role: community.my_role,
          createdAt: community.created_at,
        },
        members: members.map((m) => ({
          userId: m.id,
          nickname: m.nickname,
          avatarConfig: JSON.parse(m.avatar_config || '{}'),
          role: m.role,
        })),
      })
    );
  } catch (error) {
    console.error('Get community error:', error);
    return res.status(500).json(errorResponse('获取社团详情失败'));
  }
});

router.post('/:communityId/join', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json(errorResponse('未登录'));
    }
    
    const { communityId } = req.params;
    const db = getDb();
    
    const community = db.prepare('SELECT * FROM communities WHERE id = ?').get(communityId);
    if (!community) {
      return res.status(404).json(notFoundResponse('社团'));
    }
    
    const existingMember = db
      .prepare('SELECT * FROM community_members WHERE community_id = ? AND user_id = ?')
      .get(communityId, req.userId);
    
    if (existingMember) {
      return res.json(successResponse({ isJoined: true }, '已加入社团'));
    }
    
    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO community_members (community_id, user_id, role)
        VALUES (?, ?, 'member')
      `).run(communityId, req.userId);
      
      db.prepare('UPDATE communities SET member_count = member_count + 1 WHERE id = ?').run(communityId);
    });
    transaction();
    
    return res.json(successResponse({ isJoined: true }, '加入成功'));
  } catch (error) {
    console.error('Join community error:', error);
    return res.status(500).json(errorResponse('加入失败'));
  }
});

router.post('/:communityId/leave', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json(errorResponse('未登录'));
    }
    
    const { communityId } = req.params;
    const db = getDb();
    
    const member = db
      .prepare('SELECT * FROM community_members WHERE community_id = ? AND user_id = ?')
      .get(communityId, req.userId);
    
    if (!member) {
      return res.status(400).json(badRequestResponse('未加入该社团'));
    }
    
    if ((member as { role: string }).role === 'owner') {
      return res.status(400).json(badRequestResponse('社团所有者不能退出'));
    }
    
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM community_members WHERE community_id = ? AND user_id = ?').run(communityId, req.userId);
      db.prepare('UPDATE communities SET member_count = member_count - 1 WHERE id = ?').run(communityId);
    });
    transaction();
    
    return res.json(successResponse({ isJoined: false }, '已退出社团'));
  } catch (error) {
    console.error('Leave community error:', error);
    return res.status(500).json(errorResponse('退出失败'));
  }
});

export default router;
