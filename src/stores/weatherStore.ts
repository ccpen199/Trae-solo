import { create } from 'zustand';
import type { City, CurrentWeather, LifeIndex, WeatherAlert, HourlyForecast, DailyForecast, MinutelyPrecipitation } from '../../shared/types';
import { weatherApi, indicesApi, alertsApi, citiesApi } from '../api';

interface WeatherState {
  currentCity: City | null;
  currentWeather: CurrentWeather | null;
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
  minutelyPrecipitation: MinutelyPrecipitation | null;
  lifeIndices: LifeIndex[];
  alerts: WeatherAlert[];
  favoriteCities: City[];
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  favoriteLoading: string | null;
  loading: {
    current: boolean;
    hourly: boolean;
    daily: boolean;
    minutely: boolean;
    indices: boolean;
    alerts: boolean;
    favorites: boolean;
  };
  error: string | null;

  setCurrentCity: (city: City) => void;
  fetchCurrentWeather: (cityId: string) => Promise<void>;
  fetchHourlyForecast: (cityId: string) => Promise<void>;
  fetchDailyForecast: (cityId: string) => Promise<void>;
  fetchMinutelyPrecipitation: (cityId: string) => Promise<void>;
  fetchLifeIndices: (cityId: string) => Promise<void>;
  fetchAlerts: (cityId: string) => Promise<void>;
  fetchFavoriteCities: () => Promise<void>;
  addFavoriteCity: (cityId: string) => Promise<boolean>;
  removeFavoriteCity: (cityId: string) => Promise<boolean>;
  toggleFavoriteCity: (cityId: string, cityName: string) => Promise<void>;
  setToast: (toast: { message: string; type: 'success' | 'error' | 'info' } | null) => void;
  clearToast: () => void;
  fetchAllWeatherData: (cityId: string) => Promise<void>;
}

const defaultCity: City = {
  id: '110000',
  name: '北京',
  province: '北京市',
  country: '中国',
  latitude: 39.9042,
  longitude: 116.4074,
  adcode: '110000',
};

export const useWeatherStore = create<WeatherState>((set, get) => ({
  currentCity: defaultCity,
  currentWeather: null,
  hourlyForecast: [],
  dailyForecast: [],
  minutelyPrecipitation: null,
  lifeIndices: [],
  alerts: [],
  favoriteCities: [],
  toast: null,
  favoriteLoading: null,
  loading: {
    current: false,
    hourly: false,
    daily: false,
    minutely: false,
    indices: false,
    alerts: false,
    favorites: false,
  },
  error: null,

  setCurrentCity: (city) => set({ currentCity: city }),

  fetchCurrentWeather: async (cityId) => {
    set({ loading: { ...get().loading, current: true }, error: null });
    try {
      const data = await weatherApi.getCurrent(cityId);
      set({ currentWeather: data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取天气失败' });
    } finally {
      set({ loading: { ...get().loading, current: false } });
    }
  },

  fetchHourlyForecast: async (cityId) => {
    set({ loading: { ...get().loading, hourly: true } });
    try {
      const data = await weatherApi.getHourly(cityId);
      set({ hourlyForecast: data });
    } catch (err) {
      console.error('获取逐时预报失败:', err);
    } finally {
      set({ loading: { ...get().loading, hourly: false } });
    }
  },

  fetchDailyForecast: async (cityId) => {
    set({ loading: { ...get().loading, daily: true } });
    try {
      const data = await weatherApi.getDaily(cityId);
      set({ dailyForecast: data });
    } catch (err) {
      console.error('获取逐日预报失败:', err);
    } finally {
      set({ loading: { ...get().loading, daily: false } });
    }
  },

  fetchMinutelyPrecipitation: async (cityId) => {
    set({ loading: { ...get().loading, minutely: true } });
    try {
      const data = await weatherApi.getMinutely(cityId);
      set({ minutelyPrecipitation: data });
    } catch (err) {
      console.error('获取分钟降水失败:', err);
    } finally {
      set({ loading: { ...get().loading, minutely: false } });
    }
  },

  fetchLifeIndices: async (cityId) => {
    set({ loading: { ...get().loading, indices: true } });
    try {
      const data = await indicesApi.getAll(cityId);
      set({ lifeIndices: data });
    } catch (err) {
      console.error('获取生活指数失败:', err);
    } finally {
      set({ loading: { ...get().loading, indices: false } });
    }
  },

  fetchAlerts: async (cityId) => {
    set({ loading: { ...get().loading, alerts: true } });
    try {
      const data = await alertsApi.getList(cityId);
      set({ alerts: data });
    } catch (err) {
      console.error('获取预警信息失败:', err);
    } finally {
      set({ loading: { ...get().loading, alerts: false } });
    }
  },

  fetchFavoriteCities: async () => {
    set({ loading: { ...get().loading, favorites: true } });
    try {
      const data = await citiesApi.getFavorites();
      set({ favoriteCities: data });
    } catch (err) {
      console.error('获取关注城市失败:', err);
    } finally {
      set({ loading: { ...get().loading, favorites: false } });
    }
  },

  addFavoriteCity: async (cityId) => {
    set({ favoriteLoading: cityId });
    try {
      const city = await citiesApi.addFavorite(cityId);
      await get().fetchFavoriteCities();
      set({ favoriteLoading: null });
      return true;
    } catch (err) {
      console.error('添加关注城市失败:', err);
      set({ favoriteLoading: null });
      return false;
    }
  },

  removeFavoriteCity: async (cityId) => {
    set({ favoriteLoading: cityId });
    try {
      await citiesApi.removeFavorite(cityId);
      await get().fetchFavoriteCities();
      set({ favoriteLoading: null });
      return true;
    } catch (err) {
      console.error('取消关注城市失败:', err);
      set({ favoriteLoading: null });
      return false;
    }
  },

  toggleFavoriteCity: async (cityId, cityName) => {
    const isCurrentlyFavorite = get().favoriteCities.some(c => c.id === cityId);
    const maxFavorites = 10;
    
    if (!isCurrentlyFavorite && get().favoriteCities.length >= maxFavorites) {
      set({ toast: { message: `最多关注${maxFavorites}个城市，请先取消部分关注`, type: 'error' } });
      return;
    }
    
    if (!isCurrentlyFavorite) {
      if (get().favoriteCities.some(c => c.id === cityId)) {
        set({ toast: { message: `${cityName} 已在关注列表中`, type: 'info' } });
        return;
      }
      const success = await get().addFavoriteCity(cityId);
      if (success) {
        set({ toast: { message: `已成功添加关注 ${cityName}`, type: 'success' } });
      } else {
        set({ toast: { message: `添加关注 ${cityName} 失败，请重试`, type: 'error' } });
      }
    } else {
      const success = await get().removeFavoriteCity(cityId);
      if (success) {
        set({ toast: { message: `已取消关注 ${cityName}`, type: 'info' } });
      } else {
        set({ toast: { message: `取消关注 ${cityName} 失败，请重试`, type: 'error' } });
      }
    }
  },

  setToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),

  fetchAllWeatherData: async (cityId) => {
    await Promise.all([
      get().fetchCurrentWeather(cityId),
      get().fetchHourlyForecast(cityId),
      get().fetchDailyForecast(cityId),
      get().fetchMinutelyPrecipitation(cityId),
      get().fetchLifeIndices(cityId),
      get().fetchAlerts(cityId),
    ]);
  },
}));
