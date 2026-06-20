import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requireAuth = false, headers, ...rest } = options;
  
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers as Record<string, string>,
  };

  if (requireAuth) {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      requestHeaders['Authorization'] = `Bearer ${accessToken}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: requestHeaders,
    ...rest,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          await useAuthStore.getState().refreshAuth();
          const newAccessToken = useAuthStore.getState().accessToken;
          if (newAccessToken) {
            requestHeaders['Authorization'] = `Bearer ${newAccessToken}`;
            const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
              headers: requestHeaders,
              ...rest,
            });
            const retryData = await retryResponse.json();
            if (retryResponse.ok) {
              return retryData.data as T;
            }
          }
        } catch (refreshError) {
          useAuthStore.getState().logout();
        }
      } else {
        useAuthStore.getState().logout();
      }
    }
    throw new Error(data.message || '请求失败');
  }

  return data.data as T;
}

export const authApi = {
  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  register: (data: any) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logout: () =>
    request('/auth/logout', {
      method: 'POST',
      requireAuth: true,
    }),
  refreshToken: (refreshToken: string) =>
    request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
  me: () =>
    request('/auth/me', {
      requireAuth: true,
    }),
};

export const hotelApi = {
  search: (params: any) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/hotels/search?${queryString}`);
  },
  getById: (hotelId: string) =>
    request(`/hotels/${hotelId}`),
  getRooms: (hotelId: string) =>
    request(`/hotels/${hotelId}/rooms`),
  getRoom: (hotelId: string, roomId: string) =>
    request(`/hotels/${hotelId}/rooms/${roomId}`),
  calculatePrice: (data: any) =>
    request('/hotels/calculate-price', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getTaxRules: (countryCode: string) =>
    request(`/hotels/tax-rules/${countryCode}`),
};

export const comparisonApi = {
  compare: (params: any) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/comparison/compare?${queryString}`);
  },
  compareHotel: (hotelId: string) =>
    request(`/comparison/hotel/${hotelId}/compare`),
  getChannels: () =>
    request('/comparison/channels'),
};

export const bookingApi = {
  create: (data: any) =>
    request('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),
  getMyBookings: (params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return request(`/bookings${queryString ? `?${queryString}` : ''}`, {
      requireAuth: true,
    });
  },
  getById: (bookingId: string) =>
    request(`/bookings/${bookingId}`, {
      requireAuth: true,
    }),
  cancel: (bookingId: string, reason?: string) =>
    request(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      requireAuth: true,
    }),
  pay: (bookingId: string) =>
    request(`/bookings/${bookingId}/pay`, {
      method: 'POST',
      requireAuth: true,
    }),
  getHotelBookings: (hotelId: string, params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return request(`/bookings/hotel/${hotelId}${queryString ? `?${queryString}` : ''}`, {
      requireAuth: true,
    });
  },
};

export const memberApi = {
  getMember: () =>
    request('/members/me', {
      requireAuth: true,
    }),
  getTransactions: (params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return request(`/members/me/transactions${queryString ? `?${queryString}` : ''}`, {
      requireAuth: true,
    });
  },
  redeemPoints: (data: any) =>
    request('/members/me/redeem', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),
  upgradeTier: (data: any) =>
    request('/members/me/upgrade', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),
  getBenefits: () =>
    request('/members/benefits'),
};

export const itineraryApi = {
  getMyItineraries: () =>
    request('/itineraries', {
      requireAuth: true,
    }),
  create: (data: any) =>
    request('/itineraries', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),
  getById: (itineraryId: string) =>
    request(`/itineraries/${itineraryId}`, {
      requireAuth: true,
    }),
  update: (itineraryId: string, data: any) =>
    request(`/itineraries/${itineraryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    }),
  delete: (itineraryId: string) =>
    request(`/itineraries/${itineraryId}`, {
      method: 'DELETE',
      requireAuth: true,
    }),
  addBooking: (itineraryId: string, bookingId: string, notes?: string) =>
    request(`/itineraries/${itineraryId}/bookings`, {
      method: 'POST',
      body: JSON.stringify({ bookingId, notes }),
      requireAuth: true,
    }),
  removeBooking: (itineraryId: string, bookingId: string) =>
    request(`/itineraries/${itineraryId}/bookings/${bookingId}`, {
      method: 'DELETE',
      requireAuth: true,
    }),
  share: (itineraryId: string) =>
    request(`/itineraries/${itineraryId}/share`, {
      method: 'POST',
      requireAuth: true,
    }),
  getShared: (shareToken: string) =>
    request(`/itineraries/shared/${shareToken}`),
  download: (itineraryId: string) =>
    request(`/itineraries/${itineraryId}/download`, {
      requireAuth: true,
    }),
};

export const gdprApi = {
  getMyRequests: (params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return request(`/gdpr/me${queryString ? `?${queryString}` : ''}`, {
      requireAuth: true,
    });
  },
  createRequest: (data: any) =>
    request('/gdpr/me', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),
  getRequest: (requestId: string) =>
    request(`/gdpr/me/${requestId}`, {
      requireAuth: true,
    }),
  cancelRequest: (requestId: string) =>
    request(`/gdpr/me/${requestId}/cancel`, {
      method: 'POST',
      requireAuth: true,
    }),
  exportData: (format?: string) =>
    request(`/gdpr/me/data/export${format ? `?format=${format}` : ''}`, {
      requireAuth: true,
    }),
  getRights: () =>
    request('/gdpr/rights'),
  getAllRequests: (params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return request(`/gdpr/requests${queryString ? `?${queryString}` : ''}`, {
      requireAuth: true,
    });
  },
  updateRequest: (requestId: string, data: any) =>
    request(`/gdpr/requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    }),
};

export const adminApi = {
  hotels: {
    getAll: () =>
      request('/admin/hotels', {
        requireAuth: true,
      }),
    getPending: () =>
      request('/admin/hotels/pending', {
        requireAuth: true,
      }),
    getById: (hotelId: string) =>
      request(`/admin/hotels/${hotelId}`, {
        requireAuth: true,
      }),
    review: (hotelId: string, data: any) =>
      request(`/admin/hotels/${hotelId}/review`, {
        method: 'POST',
        body: JSON.stringify(data),
        requireAuth: true,
      }),
    update: (hotelId: string, data: any) =>
      request(`/admin/hotels/${hotelId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        requireAuth: true,
      }),
    suspend: (hotelId: string, reason?: string) =>
      request(`/admin/hotels/${hotelId}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
        requireAuth: true,
      }),
    reactivate: (hotelId: string) =>
      request(`/admin/hotels/${hotelId}/reactivate`, {
        method: 'POST',
        requireAuth: true,
      }),
  },
  commissions: {
    getRules: () =>
      request('/admin/commissions/rules', {
        requireAuth: true,
      }),
    createRule: (data: any) =>
      request('/admin/commissions/rules', {
        method: 'POST',
        body: JSON.stringify(data),
        requireAuth: true,
      }),
    getSettlements: (params?: any) => {
      const queryString = params ? new URLSearchParams(params).toString() : '';
      return request(`/admin/commissions/settlements${queryString ? `?${queryString}` : ''}`, {
        requireAuth: true,
      });
    },
    generateSettlement: (data: any) =>
      request('/admin/commissions/settlements/generate', {
        method: 'POST',
        body: JSON.stringify(data),
        requireAuth: true,
      }),
    updateSettlement: (settlementId: string, data: any) =>
      request(`/admin/commissions/settlements/${settlementId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        requireAuth: true,
      }),
    getDashboard: () =>
      request('/admin/commissions/dashboard', {
        requireAuth: true,
      }),
  },
  taxes: {
    getAll: () =>
      request('/admin/taxes', {
        requireAuth: true,
      }),
    getByCountry: (countryCode: string) =>
      request(`/admin/taxes/country/${countryCode}`, {
        requireAuth: true,
      }),
    create: (data: any) =>
      request('/admin/taxes', {
        method: 'POST',
        body: JSON.stringify(data),
        requireAuth: true,
      }),
    update: (ruleId: string, data: any) =>
      request(`/admin/taxes/${ruleId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        requireAuth: true,
      }),
    delete: (ruleId: string) =>
      request(`/admin/taxes/${ruleId}`, {
        method: 'DELETE',
        requireAuth: true,
      }),
    calculate: (data: any) =>
      request('/admin/taxes/calculate', {
        method: 'POST',
        body: JSON.stringify(data),
        requireAuth: true,
      }),
    getCompliance: () =>
      request('/admin/taxes/compliance', {
        requireAuth: true,
      }),
  },
};

export const hotelAdminApi = {
  bookings: {
    getAll: (hotelId: string, params?: any) => {
      const queryString = params ? new URLSearchParams({ hotelId, ...params }).toString() : '';
      return request(`/hotel-admin/bookings${queryString ? `?${queryString}` : ''}`, {
        requireAuth: true,
      });
    },
    getById: (bookingId: string) =>
      request(`/hotel-admin/bookings/${bookingId}`, {
        requireAuth: true,
      }),
    updateStatus: (bookingId: string, data: any) =>
      request(`/hotel-admin/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify(data),
        requireAuth: true,
      }),
    checkIn: (bookingId: string, data?: any) =>
      request(`/hotel-admin/bookings/${bookingId}/check-in`, {
        method: 'POST',
        body: JSON.stringify(data),
        requireAuth: true,
      }),
    checkOut: (bookingId: string, data?: any) =>
      request(`/hotel-admin/bookings/${bookingId}/check-out`, {
        method: 'POST',
        body: JSON.stringify(data),
        requireAuth: true,
      }),
    getCalendar: (hotelId: string, params?: any) => {
      const queryString = params ? new URLSearchParams(params).toString() : '';
      return request(`/hotel-admin/bookings/calendar/${hotelId}${queryString ? `?${queryString}` : ''}`, {
        requireAuth: true,
      });
    },
  },
  inventory: {
    getRooms: (hotelId: string) =>
      request(`/hotel-admin/inventory/rooms/${hotelId}`, {
        requireAuth: true,
      }),
    getRoom: (hotelId: string, roomTypeId: string) =>
      request(`/hotel-admin/inventory/rooms/${hotelId}/${roomTypeId}`, {
        requireAuth: true,
      }),
    updateRoom: (hotelId: string, roomTypeId: string, data: any) =>
      request(`/hotel-admin/inventory/rooms/${hotelId}/${roomTypeId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        requireAuth: true,
      }),
    getRatePlans: (hotelId: string) =>
      request(`/hotel-admin/inventory/rate-plans/${hotelId}`, {
        requireAuth: true,
      }),
    updateRatePlan: (ratePlanId: string, data: any) =>
      request(`/hotel-admin/inventory/rate-plans/${ratePlanId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        requireAuth: true,
      }),
    getCalendar: (hotelId: string, params?: any) => {
      const queryString = params ? new URLSearchParams(params).toString() : '';
      return request(`/hotel-admin/inventory/calendar/${hotelId}${queryString ? `?${queryString}` : ''}`, {
        requireAuth: true,
      });
    },
    updateInventory: (hotelId: string, roomTypeId: string, data: any) =>
      request(`/hotel-admin/inventory/inventory/${hotelId}/${roomTypeId}`, {
        method: 'POST',
        body: JSON.stringify(data),
        requireAuth: true,
      }),
    bulkUpdate: (data: any) =>
      request('/hotel-admin/inventory/inventory/bulk', {
        method: 'POST',
        body: JSON.stringify(data),
        requireAuth: true,
      }),
    getDashboard: (hotelId: string) =>
      request(`/hotel-admin/inventory/dashboard/${hotelId}`, {
        requireAuth: true,
      }),
  },
};
