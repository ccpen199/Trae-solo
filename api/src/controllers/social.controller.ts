import { Request, Response } from 'express';
import db from '../database/connection.js';
import type { Post, Circle, Activity, PostComment } from '../../../shared/types.js';

export async function getCircles(req: Request, res: Response) {
  try {
    const circles = db.prepare('SELECT * FROM circles ORDER BY member_count DESC').all() as Circle[];
    res.json({ success: true, data: circles });
  } catch (error) {
    console.error('Get circles error:', error);
    res.status(500).json({ success: false, error: '获取圈子列表失败' });
  }
}

export async function getPosts(req: Request, res: Response) {
  try {
    const { circleId, type } = req.query;
    let query = `
      SELECT p.*, u.name as user_name, u.avatar as user_avatar, c.name as circle_name
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN circles c ON p.circle_id = c.id
    `;

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (circleId) {
      whereClauses.push('p.circle_id = ?');
      params.push(circleId);
    }

    if (type) {
      whereClauses.push('p.type = ?');
      params.push(type);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' ORDER BY p.created_at DESC';

    const posts = db.prepare(query).all(...params) as (Post & { user_name: string; user_avatar: string; circle_name: string; images: string })[];

    const formattedPosts = posts.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : []
    }));

    res.json({ success: true, data: formattedPosts });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, error: '获取帖子列表失败' });
  }
}

export async function createPost(req: Request & { user?: any }, res: Response) {
  try {
    const { circleId, title, content, type, images } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, error: '请填写完整的帖子信息' });
    }

    const result = db.prepare(`
      INSERT INTO posts (user_id, circle_id, title, content, type, images)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      circleId || null,
      title,
      content,
      type || 'normal',
      images ? JSON.stringify(images) : null
    );

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);

    res.json({ success: true, data: post, message: '发布成功' });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, error: '发布失败' });
  }
}

export async function likePost(req: Request, res: Response) {
  try {
    const { id } = req.params;

    db.prepare('UPDATE posts SET like_count = like_count + 1 WHERE id = ?').run(id);

    res.json({ success: true, message: '点赞成功' });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, error: '点赞失败' });
  }
}

export async function getActivities(req: Request, res: Response) {
  try {
    const { status } = req.query;
    let query = `
      SELECT a.*, u.name as organizer_name, u.avatar as organizer_avatar
      FROM activities a
      LEFT JOIN users u ON a.organizer_id = u.id
    `;

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (status) {
      whereClauses.push('a.status = ?');
      params.push(status);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' ORDER BY a.start_time ASC';

    const activities = db.prepare(query).all(...params) as (Activity & { organizer_name: string; organizer_avatar: string })[];

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ success: false, error: '获取活动列表失败' });
  }
}

export async function createActivity(req: Request & { user?: any }, res: Response) {
  try {
    const { title, description, startTime, endTime, location, maxParticipants } = req.body;

    if (!title || !description || !startTime || !endTime) {
      return res.status(400).json({ success: false, error: '请填写完整的活动信息' });
    }

    const result = db.prepare(`
      INSERT INTO activities (title, description, start_time, end_time, location, max_participants, organizer_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      description,
      startTime,
      endTime,
      location || null,
      maxParticipants || null,
      req.user.id
    );

    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(result.lastInsertRowid);

    res.json({ success: true, data: activity, message: '活动创建成功' });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ success: false, error: '创建活动失败' });
  }
}

export async function signupActivity(req: Request & { user?: any }, res: Response) {
  try {
    const { activityId } = req.params;

    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(activityId) as Activity | undefined;

    if (!activity) {
      return res.status(404).json({ success: false, error: '活动不存在' });
    }

    if (activity.status !== 'active') {
      return res.status(400).json({ success: false, error: '活动不可报名' });
    }

    if (activity.max_participants && activity.participant_count >= activity.max_participants) {
      return res.status(400).json({ success: false, error: '活动名额已满' });
    }

    const existingSignup = db.prepare('SELECT * FROM activity_signups WHERE activity_id = ? AND user_id = ?').get(activityId, req.user.id);

    if (existingSignup) {
      return res.status(400).json({ success: false, error: '已报名该活动' });
    }

    db.prepare('INSERT INTO activity_signups (activity_id, user_id) VALUES (?, ?)').run(activityId, req.user.id);
    db.prepare('UPDATE activities SET participant_count = participant_count + 1 WHERE id = ?').run(activityId);

    res.json({ success: true, message: '报名成功' });
  } catch (error) {
    console.error('Signup activity error:', error);
    res.status(500).json({ success: false, error: '报名失败' });
  }
}

export async function getPostComments(req: Request, res: Response) {
  try {
    const { postId } = req.params;

    const comments = db.prepare(`
      SELECT pc.*, u.name as user_name, u.avatar as user_avatar
      FROM post_comments pc
      LEFT JOIN users u ON pc.user_id = u.id
      WHERE pc.post_id = ?
      ORDER BY pc.created_at DESC
    `).all(postId);

    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('Get post comments error:', error);
    res.status(500).json({ success: false, error: '获取评论失败' });
  }
}

export async function addComment(req: Request & { user?: any }, res: Response) {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: '请输入评论内容' });
    }

    db.prepare('INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)').run(postId, req.user.id, content);
    db.prepare('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?').run(postId);

    res.json({ success: true, message: '评论成功' });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, error: '评论失败' });
  }
}

export default { getCircles, getPosts, createPost, likePost, getActivities, createActivity, signupActivity, getPostComments, addComment };
