import api from './client';
import {
  User,
  City,
  Property,
  Booking,
  Banner,
  ActivityTopic,
  SearchHistory,
  Pagination,
  SearchParams,
  PriceDetails,
} from '@/types';

export const authApi = {
  login: async (phone: string, password: string) => {
    const response = await api.post('/auth/login', { phone, password });
    return response.data;
  },

  register: async (phone: string, password: string, nickname?: string) => {
    const response = await api.post('/auth/register', { phone, password, nickname });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

export const cityApi = {
  getHotCities: async (): Promise<City[]> => {
    const response = await api.get('/cities/hot');
    return response.data.data;
  },

  searchCities: async (keyword: string): Promise<City[]> => {
    const response = await api.get(`/cities/search?keyword=${encodeURIComponent(keyword)}`);
    return response.data.data;
  },
};

export const homeApi = {
  getBanners: async (): Promise<Banner[]> => {
    const response = await api.get('/home/banners');
    return response.data.data;
  },

  getTopics: async (): Promise<ActivityTopic[]> => {
    const response = await api.get('/home/topics');
    return response.data.data;
  },

  getHotCities: async (): Promise<City[]> => {
    const response = await api.get('/home/hot-cities');
    return response.data.data;
  },

  getRecommendedProperties: async (): Promise<Property[]> => {
    const response = await api.get('/home/recommended-properties');
    return response.data.data;
  },

  getSearchHistory: async (): Promise<SearchHistory[]> => {
    const response = await api.get('/home/search-history');
    return response.data.data;
  },

  clearSearchHistory: async () => {
    const response = await api.delete('/home/search-history');
    return response.data;
  },
};

export const propertyApi = {
  search: async (params: SearchParams): Promise<Pagination<Property>> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });
    const response = await api.get(`/properties/search?${query.toString()}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<Property> => {
    const response = await api.get(`/properties/${id}`);
    return response.data.data;
  },

  getAvailability: async (id: string, startDate?: string, endDate?: string) => {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    const response = await api.get(
      `/properties/${id}/availability?${query.toString()}`
    );
    return response.data.data;
  },

  toggleFavorite: async (id: string) => {
    const response = await api.post(`/properties/${id}/favorite`);
    return response.data.data;
  },
};

export const bookingApi = {
  calculate: async (
    propertyId: string,
    checkIn: string,
    checkOut: string,
    guests: number = 2
  ): Promise<{
    property: { id: string; title: string; mainImage: string; address: string };
    checkIn: string;
    checkOut: string;
    nights: number;
    guests: number;
    priceDetails: PriceDetails;
  }> => {
    const response = await api.post('/bookings/calculate', {
      propertyId,
      checkIn,
      checkOut,
      guests,
    });
    return response.data.data;
  },

  create: async (params: {
    propertyId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    guestName: string;
    guestPhone: string;
    specialRequest?: string;
  }): Promise<Booking> => {
    const response = await api.post('/bookings', params);
    return response.data.data;
  },

  getList: async (status?: string, page = 1, pageSize = 10): Promise<Pagination<Booking>> => {
    const query = new URLSearchParams();
    if (status) query.append('status', status);
    query.append('page', String(page));
    query.append('pageSize', String(pageSize));
    const response = await api.get(`/bookings?${query.toString()}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<Booking> => {
    const response = await api.get(`/bookings/${id}`);
    return response.data.data;
  },

  pay: async (id: string, method: string = 'ALIPAY'): Promise<Booking> => {
    const response = await api.post(`/bookings/${id}/pay`, { method });
    return response.data.data;
  },

  cancel: async (id: string) => {
    const response = await api.post(`/bookings/${id}/cancel`);
    return response.data;
  },
};
