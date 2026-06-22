import { Router } from 'express';
import { BubbleRoomService, RedPacketService } from '../services/bubbleRoomService';
import { db } from '../data/database';
import { asyncHandler, getAuthUserId } from '../middleware';
import type { BubbleRoomCreateInput } from '../types';

const router = Router();

router.post('/', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const input = req.body as BubbleRoomCreateInput;
  const room = BubbleRoomService.create(userId, input);
  if (!room) {
    res.status(400);
    res.locals.error = { code: 'CREATE_FAILED', message: '创建房间失败' };
    return res.json(null);
  }
  return res.json(room);
}));

router.get('/', asyncHandler((req, res) => {
  const result = BubbleRoomService.list({
    city: req.query.city as string,
    type: req.query.type as never,
    status: req.query.status as never,
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20
  });
  return res.json({
    items: result.items.map(r => ({
      id: r.id,
      title: r.title,
      roomType: r.roomType,
      city: r.city,
      maxMembers: r.maxMembers,
      currentMembers: r.members.length,
      status: r.status,
      tags: r.tags,
      theme: r.theme,
      host: {
        id: r.hostId,
        nickname: db.users.get(r.hostId)?.nickname || '',
        avatar: db.users.get(r.hostId)?.avatar || ''
      }
    })),
    total: result.total,
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20,
    totalPages: Math.ceil(result.total / (parseInt(req.query.pageSize as string) || 20)),
    hasMore: (parseInt(req.query.page as string) || 1) * (parseInt(req.query.pageSize as string) || 20) < result.total
  });
}));

router.get('/:id', asyncHandler((req, res) => {
  const room = db.bubbleRooms.get(req.params.id);
  if (!room) {
    res.status(404);
    res.locals.error = { code: 'NOT_FOUND', message: '房间不存在' };
    return res.json(null);
  }
  return res.json({
    ...room,
    members: room.members.map(m => ({
      ...m,
      user: {
        id: m.userId,
        nickname: db.users.get(m.userId)?.nickname || '',
        avatar: db.users.get(m.userId)?.avatar || '',
        creditScore: db.users.get(m.userId)?.creditScore || 0
      }
    }))
  });
}));

router.post('/:id/join', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const result = BubbleRoomService.join(req.params.id, userId);
  if (!result.success) {
    res.status(400);
    res.locals.error = { code: 'JOIN_FAILED', message: result.message };
    return res.json(null);
  }
  return res.json(result);
}));

router.post('/:id/leave', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const ok = BubbleRoomService.leave(req.params.id, userId);
  if (!ok) {
    res.status(400);
    res.locals.error = { code: 'LEAVE_FAILED', message: '离开失败' };
    return res.json(null);
  }
  return res.json({ success: true });
}));

router.post('/:id/messages', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const { type, content, redPacketId } = req.body as { type: never; content: string; redPacketId?: string };
  const msg = BubbleRoomService.sendMessage(req.params.id, userId, type, content, redPacketId);
  if (!msg) {
    res.status(400);
    res.locals.error = { code: 'SEND_FAILED', message: '发送失败或内容违规' };
    return res.json(null);
  }
  return res.json({
    ...msg,
    sender: {
      id: msg.senderId,
      nickname: db.users.get(msg.senderId)?.nickname || '',
      avatar: db.users.get(msg.senderId)?.avatar || ''
    }
  });
}));

router.get('/:id/messages', asyncHandler((req, res) => {
  const room = db.bubbleRooms.get(req.params.id);
  if (!room) {
    res.status(404);
    res.locals.error = { code: 'NOT_FOUND', message: '房间不存在' };
    return res.json(null);
  }
  const limit = parseInt(req.query.limit as string) || 100;
  const messages = room.messages
    .slice(-limit)
    .map(m => ({
      ...m,
      sender: {
        id: m.senderId,
        nickname: db.users.get(m.senderId)?.nickname || '',
        avatar: db.users.get(m.senderId)?.avatar || ''
      }
    }));
  return res.json(messages);
}));

router.post('/:id/heartbeat', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const ok = BubbleRoomService.heartbeat(req.params.id, userId);
  return res.json({ success: ok });
}));

router.post('/:id/red-packets', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const { totalAmount, packetCount, distributionType } = req.body;
  const rp = RedPacketService.create(req.params.id, userId, totalAmount, packetCount, distributionType);
  if (!rp) {
    res.status(400);
    res.locals.error = { code: 'CREATE_FAILED', message: '创建红包失败' };
    return res.json(null);
  }
  BubbleRoomService.sendMessage(req.params.id, userId, 'redpacket', `发了一个${distributionType === 'fate' ? '缘分' : ''}红包`, rp.id);
  return res.json({ id: rp.id, totalAmount, packetCount, distributionType });
}));

router.post('/red-packets/:id/claim', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const result = RedPacketService.claim(req.params.id, userId);
  if (!result.success) {
    res.status(400);
    res.locals.error = { code: 'CLAIM_FAILED', message: result.message };
    return res.json(null);
  }
  return res.json(result);
}));

router.get('/red-packets/:id/info', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const info = RedPacketService.getClaimablePacketInfo(req.params.id, userId);
  return res.json(info);
}));

export default router;
