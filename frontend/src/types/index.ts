export interface User {
  id: string;
  qqNumber: string;
  nickname: string;
  avatar: string;
  gender: 'male' | 'female' | 'unknown';
  age: number;
  signature: string;
  allowAddFriend: boolean;
  needVerification: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Friend extends User {
  isOnline: boolean;
  unreadCount?: number;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  createdAt: string;
  updatedAt: string;
  fromUser?: User;
  toUser?: User;
}

export interface ChatMessage {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  read: boolean;
  createdAt: string;
  fromUser?: User;
  toUser?: User;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
  code: number;
}

export interface LoginParams {
  qqNumber: string;
  password: string;
}

export interface RegisterParams {
  nickname: string;
  password: string;
  confirmPassword: string;
  gender?: 'male' | 'female' | 'unknown';
  age?: number;
}

export interface LoginResult {
  user: User;
  token: string;
}

export interface RegisterResult {
  user: User;
  token: string;
}

export interface SearchUsersParams {
  qqNumber?: string;
  nickname?: string;
  age?: number;
  gender?: 'male' | 'female' | 'unknown';
  page?: number;
  pageSize?: number;
}

export interface SearchUsersResult {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AddFriendParams {
  targetQQNumber: string;
  message?: string;
}

export interface RespondFriendRequestParams {
  requestId: string;
  accept: boolean;
}

export interface SendMessageParams {
  toUserId: string;
  content: string;
  type?: 'text' | 'image' | 'file';
}

export interface UnreadCountResult {
  total: number;
  byUser: { userId: string; unreadCount: number }[];
}
