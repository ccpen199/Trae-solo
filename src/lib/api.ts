import { useAuthStore } from '@/store/useAuthStore';
import type {
  User,
  Pet,
  Doctor,
  Consultation,
  ConsultationMessage,
  Hospital,
  Product,
  CommunityPost,
  LostPetTask,
  HealthCalendarEvent,
  Order,
} from '@shared/types';

const API_BASE = '/api';

export interface ApiErrorResponse {
  error: string;
  errorCode?: string;
  success: boolean;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = useAuthStore.getState().token;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({ error: `请求失败: ${response.status}` }))) as ApiErrorResponse;
        if (response.status === 401 && endpoint !== '/auth/login') {
          useAuthStore.getState().logout();
          const err = new Error('登录已过期，请重新登录');
          (err as any).errorCode = 'SESSION_EXPIRED';
          throw err;
        }
        const err = new Error(errorData.error || `请求失败: ${response.status}`);
        (err as any).errorCode = errorData.errorCode || 'UNKNOWN';
        throw err;
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const json = await response.json() as { success: boolean; data?: T; error?: string; errorCode?: string };
      if (json.success === false) {
        const err = new Error(json.error || '请求失败');
        (err as any).errorCode = json.errorCode || 'UNKNOWN';
        throw err;
      }
      return json.data !== undefined ? json.data : (json as unknown as T);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络连接失败，请检查网络');
    }
  }

  private get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  private post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  private put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  private delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  auth = {
    login: (phone: string, password: string) =>
      this.post<{ user: User; token: string }>('/auth/login', {
        phone,
        password,
      }),
    register: (data: {
      phone: string;
      password: string;
      nickname: string;
      role: User['role'];
    }) =>
      this.post<{ user: User; token: string }>('/auth/register', data),
    logout: () => this.post<void>('/auth/logout'),
    me: () => this.get<User>('/auth/me'),
  };

  pets = {
    list: () => this.get<Pet[]>('/pets'),
    detail: (id: string) => this.get<Pet>(`/pets/${id}`),
    create: (data: Omit<Pet, 'id' | 'ownerId' | 'createdAt'>) =>
      this.post<Pet>('/pets', data),
    update: (id: string, data: Partial<Pet>) =>
      this.put<Pet>(`/pets/${id}`, data),
    delete: (id: string) => this.delete<void>(`/pets/${id}`),
  };

  doctors = {
    list: (params?: { hospitalId?: string; department?: string }) => {
      const query = params
        ? '?' + new URLSearchParams(params as Record<string, string>).toString()
        : '';
      return this.get<Doctor[]>(`/doctors${query}`);
    },
    detail: (id: string) => this.get<Doctor>(`/doctors/${id}`),
  };

  consultations = {
    list: () => this.get<Consultation[]>('/consultations'),
    detail: (id: string) => this.get<Consultation>(`/consultations/${id}`),
    create: (data: {
      doctorId: string;
      petId: string;
      type: Consultation['type'];
      symptoms: string;
    }) => this.post<Consultation>('/consultations', data),
    update: (id: string, data: Partial<Consultation>) =>
      this.put<Consultation>(`/consultations/${id}`, data),
    messages: (id: string) =>
      this.get<ConsultationMessage[]>(`/consultations/${id}/messages`),
    sendMessage: (id: string, content: string, messageType: string) =>
      this.post<ConsultationMessage>(`/consultations/${id}/messages`, {
        content,
        messageType,
      }),
  };

  hospitals = {
    list: (params?: { lat?: number; lng?: number }) => {
      const query = params
        ? '?' + new URLSearchParams(params as Record<string, string>).toString()
        : '';
      return this.get<Hospital[]>(`/hospitals${query}`);
    },
    detail: (id: string) => this.get<Hospital>(`/hospitals/${id}`),
  };

  products = {
    list: (params?: { category?: string; species?: string }) => {
      const query = params
        ? '?' + new URLSearchParams(params as Record<string, string>).toString()
        : '';
      return this.get<Product[]>(`/products${query}`);
    },
    detail: (id: string) => this.get<Product>(`/products/${id}`),
  };

  orders = {
    list: () => this.get<Order[]>('/orders'),
    create: (data: {
      items: { productId: string; quantity: number }[];
      prescriptionId?: string;
      ownerSignature?: string;
    }) => this.post<Order>('/orders', data),
  };

  community = {
    list: (params?: { tag?: string }) => {
      const query = params
        ? '?' + new URLSearchParams(params as Record<string, string>).toString()
        : '';
      return this.get<CommunityPost[]>(`/community/posts${query}`);
    },
    create: (data: {
      content: string;
      images?: string[];
      tags?: string[];
      petId?: string;
    }) => this.post<CommunityPost>('/community/posts', data),
    like: (id: string) =>
      this.post<CommunityPost>(`/community/posts/${id}/like`),
  };

  lostPet = {
    list: () => this.get<LostPetTask[]>('/lost-pet'),
    detail: (id: string) => this.get<LostPetTask>(`/lost-pet/${id}`),
    create: (
      data: Omit<LostPetTask, 'id' | 'ownerId' | 'status' | 'clues' | 'adoptionIntents' | 'createdAt'>
    ) => this.post<LostPetTask>('/lost-pet', data),
    addClue: (taskId: string, data: { content: string; lat?: number; lng?: number }) =>
      this.post<LostPetTask>(`/lost-pet/${taskId}/clues`, data),
  };

  calendar = {
    list: () => this.get<HealthCalendarEvent[]>('/calendar/events'),
    create: (
      data: Omit<HealthCalendarEvent, 'id' | 'ownerId'>
    ) => this.post<HealthCalendarEvent>('/calendar/events', data),
    update: (id: string, data: Partial<HealthCalendarEvent>) =>
      this.put<HealthCalendarEvent>(`/calendar/events/${id}`, data),
    delete: (id: string) => this.delete<void>(`/calendar/events/${id}`),
  };
}

export const api = new ApiClient();
