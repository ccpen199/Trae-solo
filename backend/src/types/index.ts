export interface User {
  id: string;
  qqNumber: string;
  password: string;
  nickname: string;
  avatar: string;
  gender: 'male' | 'female' | 'unknown';
  age: number;
  signature: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  allowAddFriend: boolean;
  needVerification: boolean;
}

export interface UserWithProfile extends User, UserProfile {}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Friendship {
  id: string;
  userId1: string;
  userId2: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  read: boolean;
  createdAt: Date;
}

export interface OnlineUser {
  userId: string;
  socketId: string;
  lastActive: Date;
}

export interface JWTPayload {
  userId: string;
  qqNumber: string;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
  code: number;
}

export interface RegisterRequest {
  nickname: string;
  password: string;
  confirmPassword: string;
  gender?: 'male' | 'female' | 'unknown';
  age?: number;
}

export interface LoginRequest {
  qqNumber: string;
  password: string;
}

export interface UpdateProfileRequest {
  nickname?: string;
  avatar?: string;
  gender?: 'male' | 'female' | 'unknown';
  age?: number;
  signature?: string;
  allowAddFriend?: boolean;
  needVerification?: boolean;
}

export interface SearchUsersRequest {
  qqNumber?: string;
  nickname?: string;
  age?: number;
  gender?: 'male' | 'female' | 'unknown';
  page?: number;
  pageSize?: number;
}

export interface AddFriendRequest {
  targetQQNumber: string;
  message?: string;
}

export interface RespondFriendRequest {
  requestId: string;
  accept: boolean;
}

export interface SendMessageRequest {
  toUserId: string;
  content: string;
  type?: 'text' | 'image' | 'file';
}
