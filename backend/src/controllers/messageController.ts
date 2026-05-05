import { Request, Response } from 'express';
import { SendMessageRequest, ChatMessage, UserWithProfile } from '../types';
import { successResponse, errorResponse, unauthorizedResponse } from '../utils/response';
import { memoryStore } from '../models/memoryStore';

interface SafeUser extends Omit<UserWithProfile, 'password'> {}

const toSafeUser = (user: UserWithProfile): SafeUser => {
  const { password, ...safeUser } = user;
  return safeUser;
};

export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { friendId } = req.params;
    
    if (!userId) {
      return res.status(401).json(unauthorizedResponse());
    }
    
    if (!friendId) {
      return res.status(400).json(errorResponse('好友ID不能为空'));
    }
    
    if (!memoryStore.isFriends(userId, friendId)) {
      return res.status(400).json(errorResponse('你们不是好友关系'));
    }
    
    const messages = memoryStore.getChatHistory(userId, friendId);
    
    const messagesWithUserInfo = messages.map(msg => {
      const fromUser = memoryStore.findUserById(msg.fromUserId);
      const toUser = memoryStore.findUserById(msg.toUserId);
      return {
        ...msg,
        fromUser: fromUser ? toSafeUser(fromUser) : null,
        toUser: toUser ? toSafeUser(toUser) : null
      };
    });
    
    return res.status(200).json(successResponse(messagesWithUserInfo));
  } catch (error) {
    console.error('Get chat history error:', error);
    return res.status(500).json(errorResponse('获取聊天记录失败'));
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { toUserId, content, type = 'text' }: SendMessageRequest = req.body;
    
    if (!userId) {
      return res.status(401).json(unauthorizedResponse());
    }
    
    if (!toUserId || !content) {
      return res.status(400).json(errorResponse('接收者ID和消息内容不能为空'));
    }
    
    if (!memoryStore.isFriends(userId, toUserId)) {
      return res.status(400).json(errorResponse('你们不是好友关系'));
    }
    
    const message = memoryStore.createMessage(
      userId,
      toUserId,
      content.trim(),
      type
    );
    
    const fromUser = memoryStore.findUserById(userId);
    const toUser = memoryStore.findUserById(toUserId);
    
    return res.status(200).json(successResponse(
      {
        ...message,
        fromUser: fromUser ? toSafeUser(fromUser) : null,
        toUser: toUser ? toSafeUser(toUser) : null
      },
      '消息发送成功'
    ));
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json(errorResponse('发送消息失败'));
  }
};

export const getUnreadMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json(unauthorizedResponse());
    }
    
    const messages = memoryStore.getUnreadMessages(userId);
    
    const messagesWithUserInfo = messages.map(msg => {
      const fromUser = memoryStore.findUserById(msg.fromUserId);
      return {
        ...msg,
        fromUser: fromUser ? toSafeUser(fromUser) : null
      };
    });
    
    return res.status(200).json(successResponse(messagesWithUserInfo));
  } catch (error) {
    console.error('Get unread messages error:', error);
    return res.status(500).json(errorResponse('获取未读消息失败'));
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json(unauthorizedResponse());
    }
    
    const messages = memoryStore.getUnreadMessages(userId);
    
    const countByUser = new Map<string, number>();
    messages.forEach(msg => {
      countByUser.set(msg.fromUserId, (countByUser.get(msg.fromUserId) || 0) + 1);
    });
    
    const result = Array.from(countByUser.entries()).map(([userId, count]) => ({
      userId,
      unreadCount: count
    }));
    
    return res.status(200).json(successResponse({
      total: messages.length,
      byUser: result
    }));
  } catch (error) {
    console.error('Get unread count error:', error);
    return res.status(500).json(errorResponse('获取未读消息数量失败'));
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { fromUserId } = req.params;
    
    if (!userId) {
      return res.status(401).json(unauthorizedResponse());
    }
    
    if (!fromUserId) {
      return res.status(400).json(errorResponse('发送者ID不能为空'));
    }
    
    const count = memoryStore.markMessagesAsRead(fromUserId, userId);
    
    return res.status(200).json(successResponse(
      { markedCount: count },
      `已标记 ${count} 条消息为已读`
    ));
  } catch (error) {
    console.error('Mark as read error:', error);
    return res.status(500).json(errorResponse('标记已读失败'));
  }
};

export default {
  getChatHistory,
  sendMessage,
  getUnreadMessages,
  getUnreadCount,
  markAsRead
};
