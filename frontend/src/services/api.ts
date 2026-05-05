import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  LoginParams, 
  LoginResult, 
  RegisterParams, 
  RegisterResult,
  User,
  SearchUsersParams,
  SearchUsersResult,
  Friend,
  FriendRequest,
  ChatMessage,
  AddFriendParams,
  RespondFriendRequestParams,
  SendMessageParams,
  UnreadCountResult
} from '@/types';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('qq_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('qq_token');
      localStorage.removeItem('qq_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (params: LoginParams): Promise<ApiResponse<LoginResult>> => {
    const response = await api.post('/auth/login', params);
    return response.data;
  },
  
  register: async (params: RegisterParams): Promise<ApiResponse<RegisterResult>> => {
    const response = await api.post('/auth/register', params);
    return response.data;
  },
  
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export const userApi = {
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/users/profile');
    return response.data;
  },
  
  updateProfile: async (params: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put('/users/profile', params);
    return response.data;
  },
  
  searchUsers: async (params: SearchUsersParams): Promise<ApiResponse<SearchUsersResult>> => {
    const response = await api.get('/users/search', { params });
    return response.data;
  },
  
  getUserByQQ: async (qqNumber: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/users/qq/${qqNumber}`);
    return response.data;
  },
  
  getOnlineStatus: async (userId: string): Promise<ApiResponse<{ userId: string; isOnline: boolean }>> => {
    const response = await api.get(`/users/online/${userId}`);
    return response.data;
  }
};

export const friendApi = {
  getFriends: async (): Promise<ApiResponse<Friend[]>> => {
    const response = await api.get('/friends');
    return response.data;
  },
  
  addFriend: async (params: AddFriendParams): Promise<ApiResponse<unknown>> => {
    const response = await api.post('/friends/add', params);
    return response.data;
  },
  
  deleteFriend: async (friendId: string): Promise<ApiResponse<unknown>> => {
    const response = await api.delete(`/friends/${friendId}`);
    return response.data;
  },
  
  getPendingRequests: async (): Promise<ApiResponse<FriendRequest[]>> => {
    const response = await api.get('/friends/requests/pending');
    return response.data;
  },
  
  getSentRequests: async (): Promise<ApiResponse<FriendRequest[]>> => {
    const response = await api.get('/friends/requests/sent');
    return response.data;
  },
  
  respondRequest: async (params: RespondFriendRequestParams): Promise<ApiResponse<unknown>> => {
    const response = await api.post('/friends/requests/respond', params);
    return response.data;
  }
};

export const messageApi = {
  getChatHistory: async (friendId: string): Promise<ApiResponse<ChatMessage[]>> => {
    const response = await api.get(`/messages/${friendId}`);
    return response.data;
  },
  
  sendMessage: async (params: SendMessageParams): Promise<ApiResponse<ChatMessage>> => {
    const response = await api.post('/messages/send', params);
    return response.data;
  },
  
  getUnreadMessages: async (): Promise<ApiResponse<ChatMessage[]>> => {
    const response = await api.get('/messages/unread');
    return response.data;
  },
  
  getUnreadCount: async (): Promise<ApiResponse<UnreadCountResult>> => {
    const response = await api.get('/messages/unread/count');
    return response.data;
  },
  
  markAsRead: async (fromUserId: string): Promise<ApiResponse<{ markedCount: number }>> => {
    const response = await api.post(`/messages/read/${fromUserId}`);
    return response.data;
  }
};

export default api;
