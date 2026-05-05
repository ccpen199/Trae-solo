import { v4 as uuidv4 } from 'uuid';
import { User, UserWithProfile, FriendRequest, Friendship, ChatMessage, OnlineUser } from '../types';

class MemoryStore {
  private users: Map<string, UserWithProfile> = new Map();
  private friendships: Map<string, Friendship> = new Map();
  private friendRequests: Map<string, FriendRequest> = new Map();
  private messages: Map<string, ChatMessage> = new Map();
  private onlineUsers: Map<string, OnlineUser> = new Map();
  private qqNumberCounter = 1000000;

  generateQQNumber(): string {
    return (++this.qqNumberCounter).toString();
  }

  findUserById(id: string): UserWithProfile | undefined {
    return this.users.get(id);
  }

  findUserByQQNumber(qqNumber: string): UserWithProfile | undefined {
    return Array.from(this.users.values()).find(u => u.qqNumber === qqNumber);
  }

  createUser(userData: Omit<User, 'id' | 'qqNumber' | 'createdAt' | 'updatedAt'> & { allowAddFriend: boolean; needVerification: boolean }): UserWithProfile {
    const id = uuidv4();
    const qqNumber = this.generateQQNumber();
    const now = new Date();
    const user: UserWithProfile = {
      id,
      qqNumber,
      password: userData.password,
      nickname: userData.nickname,
      avatar: userData.avatar,
      gender: userData.gender,
      age: userData.age,
      signature: userData.signature,
      allowAddFriend: userData.allowAddFriend,
      needVerification: userData.needVerification,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  updateUser(id: string, updates: Partial<UserWithProfile>): UserWithProfile | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: UserWithProfile = {
      ...user,
      ...updates,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  searchUsers(params: { qqNumber?: string; nickname?: string; age?: number; gender?: string; excludeUserId?: string }): UserWithProfile[] {
    let results = Array.from(this.users.values());
    
    if (params.excludeUserId) {
      results = results.filter(u => u.id !== params.excludeUserId);
    }
    
    if (params.qqNumber) {
      results = results.filter(u => u.qqNumber.includes(params.qqNumber!));
    }
    
    if (params.nickname) {
      results = results.filter(u => u.nickname.includes(params.nickname!));
    }
    
    if (params.age !== undefined) {
      results = results.filter(u => u.age === params.age);
    }
    
    if (params.gender && params.gender !== 'unknown') {
      results = results.filter(u => u.gender === params.gender);
    }
    
    return results;
  }

  getFriends(userId: string): UserWithProfile[] {
    const friendIds = Array.from(this.friendships.values())
      .filter(f => f.userId1 === userId || f.userId2 === userId)
      .map(f => f.userId1 === userId ? f.userId2 : f.userId1);
    
    return friendIds.map(id => this.users.get(id)).filter(Boolean) as UserWithProfile[];
  }

  createFriendship(userId1: string, userId2: string): Friendship {
    const existing = Array.from(this.friendships.values()).find(
      f => (f.userId1 === userId1 && f.userId2 === userId2) || (f.userId1 === userId2 && f.userId2 === userId1)
    );
    
    if (existing) return existing;
    
    const friendship: Friendship = {
      id: uuidv4(),
      userId1,
      userId2,
      createdAt: new Date()
    };
    this.friendships.set(friendship.id, friendship);
    return friendship;
  }

  deleteFriendship(userId1: string, userId2: string): boolean {
    const friendship = Array.from(this.friendships.values()).find(
      f => (f.userId1 === userId1 && f.userId2 === userId2) || (f.userId1 === userId2 && f.userId2 === userId1)
    );
    
    if (friendship) {
      this.friendships.delete(friendship.id);
      return true;
    }
    return false;
  }

  isFriends(userId1: string, userId2: string): boolean {
    return Array.from(this.friendships.values()).some(
      f => (f.userId1 === userId1 && f.userId2 === userId2) || (f.userId1 === userId2 && f.userId2 === userId1)
    );
  }

  createFriendRequest(fromUserId: string, toUserId: string, message: string): FriendRequest {
    const request: FriendRequest = {
      id: uuidv4(),
      fromUserId,
      toUserId,
      status: 'pending',
      message,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.friendRequests.set(request.id, request);
    return request;
  }

  getPendingFriendRequests(toUserId: string): FriendRequest[] {
    return Array.from(this.friendRequests.values())
      .filter(r => r.toUserId === toUserId && r.status === 'pending')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getSentFriendRequests(fromUserId: string): FriendRequest[] {
    return Array.from(this.friendRequests.values())
      .filter(r => r.fromUserId === fromUserId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  findFriendRequestById(id: string): FriendRequest | undefined {
    return this.friendRequests.get(id);
  }

  findPendingFriendRequest(fromUserId: string, toUserId: string): FriendRequest | undefined {
    return Array.from(this.friendRequests.values()).find(
      r => r.fromUserId === fromUserId && r.toUserId === toUserId && r.status === 'pending'
    );
  }

  updateFriendRequest(id: string, status: 'accepted' | 'rejected'): FriendRequest | undefined {
    const request = this.friendRequests.get(id);
    if (!request) return undefined;
    
    request.status = status;
    request.updatedAt = new Date();
    this.friendRequests.set(id, request);
    return request;
  }

  createMessage(fromUserId: string, toUserId: string, content: string, type: 'text' | 'image' | 'file' = 'text'): ChatMessage {
    const message: ChatMessage = {
      id: uuidv4(),
      fromUserId,
      toUserId,
      content,
      type,
      read: false,
      createdAt: new Date()
    };
    this.messages.set(message.id, message);
    return message;
  }

  getChatHistory(userId1: string, userId2: string): ChatMessage[] {
    return Array.from(this.messages.values())
      .filter(m => 
        (m.fromUserId === userId1 && m.toUserId === userId2) ||
        (m.fromUserId === userId2 && m.toUserId === userId1)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  getUnreadMessages(toUserId: string): ChatMessage[] {
    return Array.from(this.messages.values())
      .filter(m => m.toUserId === toUserId && !m.read)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  markMessageAsRead(messageId: string): boolean {
    const message = this.messages.get(messageId);
    if (message) {
      message.read = true;
      this.messages.set(messageId, message);
      return true;
    }
    return false;
  }

  markMessagesAsRead(fromUserId: string, toUserId: string): number {
    let count = 0;
    Array.from(this.messages.values())
      .filter(m => m.fromUserId === fromUserId && m.toUserId === toUserId && !m.read)
      .forEach(m => {
        m.read = true;
        this.messages.set(m.id, m);
        count++;
      });
    return count;
  }

  setOnlineUser(userId: string, socketId: string): OnlineUser {
    const onlineUser: OnlineUser = {
      userId,
      socketId,
      lastActive: new Date()
    };
    this.onlineUsers.set(userId, onlineUser);
    return onlineUser;
  }

  setOfflineUser(userId: string): boolean {
    return this.onlineUsers.delete(userId);
  }

  isOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  getOnlineUsers(): OnlineUser[] {
    return Array.from(this.onlineUsers.values());
  }
}

export const memoryStore = new MemoryStore();
export default memoryStore;
