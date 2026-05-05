import { Request, Response } from 'express';
import { AddFriendRequest, RespondFriendRequest, UserWithProfile, FriendRequest as FriendRequestType } from '../types';
import { successResponse, errorResponse, notFoundResponse, unauthorizedResponse } from '../utils/response';
import { memoryStore } from '../models/memoryStore';

interface SafeUser extends Omit<UserWithProfile, 'password'> {}

const toSafeUser = (user: UserWithProfile): SafeUser => {
  const { password, ...safeUser } = user;
  return safeUser;
};

export const getFriends = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json(unauthorizedResponse());
    }
    
    const friends = memoryStore.getFriends(userId);
    
    const friendsWithStatus = friends.map(friend => ({
      ...toSafeUser(friend),
      isOnline: memoryStore.isOnline(friend.id)
    }));
    
    return res.status(200).json(successResponse(friendsWithStatus));
  } catch (error) {
    console.error('Get friends error:', error);
    return res.status(500).json(errorResponse('获取好友列表失败'));
  }
};

export const addFriend = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json(unauthorizedResponse());
    }
    
    const { targetQQNumber, message = '' }: AddFriendRequest = req.body;
    
    if (!targetQQNumber || !/^\d{5,10}$/.test(targetQQNumber)) {
      return res.status(400).json(errorResponse('请输入有效的QQ号'));
    }
    
    const targetUser = memoryStore.findUserByQQNumber(targetQQNumber);
    
    if (!targetUser) {
      return res.status(404).json(notFoundResponse('该QQ号不存在'));
    }
    
    if (targetUser.id === userId) {
      return res.status(400).json(errorResponse('不能添加自己为好友'));
    }
    
    if (memoryStore.isFriends(userId, targetUser.id)) {
      return res.status(400).json(errorResponse('你们已经是好友了'));
    }
    
    const pendingRequest = memoryStore.findPendingFriendRequest(userId, targetUser.id);
    if (pendingRequest) {
      return res.status(400).json(errorResponse('好友请求已发送，请等待对方处理'));
    }
    
    if (!targetUser.allowAddFriend) {
      return res.status(403).json(errorResponse('该用户不允许被添加为好友'));
    }
    
    if (targetUser.needVerification) {
      const friendRequest = memoryStore.createFriendRequest(
        userId,
        targetUser.id,
        message
      );
      
      return res.status(200).json(successResponse(
        {
          request: friendRequest,
          status: 'pending',
          message: '好友请求已发送，等待对方验证'
        },
        '好友请求已发送'
      ));
    } else {
      const friendship = memoryStore.createFriendship(userId, targetUser.id);
      
      return res.status(200).json(successResponse(
        {
          friendship,
          status: 'accepted',
          friend: toSafeUser(targetUser),
          message: '已成功添加为好友'
        },
        '添加好友成功'
      ));
    }
  } catch (error) {
    console.error('Add friend error:', error);
    return res.status(500).json(errorResponse('添加好友失败'));
  }
};

export const deleteFriend = async (req: Request, res: Response) => {
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
    
    const success = memoryStore.deleteFriendship(userId, friendId);
    
    if (!success) {
      return res.status(500).json(errorResponse('删除好友失败'));
    }
    
    return res.status(200).json(successResponse(null, '删除好友成功'));
  } catch (error) {
    console.error('Delete friend error:', error);
    return res.status(500).json(errorResponse('删除好友失败'));
  }
};

export const getPendingRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json(unauthorizedResponse());
    }
    
    const requests = memoryStore.getPendingFriendRequests(userId);
    
    const requestsWithUserInfo = requests.map(request => {
      const fromUser = memoryStore.findUserById(request.fromUserId);
      return {
        ...request,
        fromUser: fromUser ? toSafeUser(fromUser) : null
      };
    });
    
    return res.status(200).json(successResponse(requestsWithUserInfo));
  } catch (error) {
    console.error('Get pending requests error:', error);
    return res.status(500).json(errorResponse('获取好友请求失败'));
  }
};

export const getSentRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json(unauthorizedResponse());
    }
    
    const requests = memoryStore.getSentFriendRequests(userId);
    
    const requestsWithUserInfo = requests.map(request => {
      const toUser = memoryStore.findUserById(request.toUserId);
      return {
        ...request,
        toUser: toUser ? toSafeUser(toUser) : null
      };
    });
    
    return res.status(200).json(successResponse(requestsWithUserInfo));
  } catch (error) {
    console.error('Get sent requests error:', error);
    return res.status(500).json(errorResponse('获取已发送的好友请求失败'));
  }
};

export const respondFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json(unauthorizedResponse());
    }
    
    const { requestId, accept }: RespondFriendRequest = req.body;
    
    if (!requestId) {
      return res.status(400).json(errorResponse('请求ID不能为空'));
    }
    
    const request = memoryStore.findFriendRequestById(requestId);
    
    if (!request) {
      return res.status(404).json(notFoundResponse('好友请求不存在'));
    }
    
    if (request.toUserId !== userId) {
      return res.status(403).json(errorResponse('无权处理此请求'));
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json(errorResponse('该请求已被处理'));
    }
    
    if (accept) {
      const friendship = memoryStore.createFriendship(request.fromUserId, request.toUserId);
      const updatedRequest = memoryStore.updateFriendRequest(requestId, 'accepted');
      
      const friend = memoryStore.findUserById(request.fromUserId);
      
      return res.status(200).json(successResponse(
        {
          request: updatedRequest,
          friendship,
          friend: friend ? toSafeUser(friend) : null
        },
        '已接受好友请求'
      ));
    } else {
      const updatedRequest = memoryStore.updateFriendRequest(requestId, 'rejected');
      
      return res.status(200).json(successResponse(
        { request: updatedRequest },
        '已拒绝好友请求'
      ));
    }
  } catch (error) {
    console.error('Respond friend request error:', error);
    return res.status(500).json(errorResponse('处理好友请求失败'));
  }
};

export default {
  getFriends,
  addFriend,
  deleteFriend,
  getPendingRequests,
  getSentRequests,
  respondFriendRequest
};
