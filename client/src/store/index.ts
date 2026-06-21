import { makeAutoObservable, runInAction } from 'mobx';
import { userApi, deviceApi, streamApi } from '@/services/api';
import { User, Device, Statistics, Alert } from '@/types';

class AppStore {
  token: string = localStorage.getItem('token') || '';
  user: User | null = null;
  devices: Device[] = [];
  statistics: Statistics | null = null;
  unreadAlertCount: number = 0;
  currentAlertList: Alert[] = [];
  loading: boolean = false;

  constructor() {
    makeAutoObservable(this);
    this.initUser();
  }

  initUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
      } catch (e) {}
    }
  }

  async login(username: string, password: string, imei?: string) {
    this.loading = true;
    try {
      const res = await userApi.login({ username, password, imei });
      runInAction(() => {
        this.token = res.token;
        this.user = res.user;
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
      });
      return res;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async register(data: any) {
    this.loading = true;
    try {
      const res = await userApi.register(data);
      runInAction(() => {
        this.token = res.token;
        this.user = res.user;
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
      });
      return res;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  logout() {
    this.token = '';
    this.user = null;
    this.devices = [];
    this.statistics = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  async loadCurrentUser() {
    try {
      const user = await userApi.getCurrentUser();
      runInAction(() => {
        this.user = user;
        localStorage.setItem('user', JSON.stringify(user));
      });
    } catch (e) {}
  }

  async loadStatistics() {
    try {
      const stats = await streamApi.getStatistics();
      runInAction(() => {
        this.statistics = stats;
      });
      return stats;
    } catch (e) {
      return null;
    }
  }

  async loadUnreadAlerts() {
    try {
      const res = await streamApi.listAlerts({ readStatus: 0, pageSize: 50 });
      runInAction(() => {
        this.unreadAlertCount = res.unreadCount || 0;
        this.currentAlertList = res.list || [];
      });
    } catch (e) {}
  }

  async refreshAll() {
    await Promise.all([
      this.loadStatistics(),
      this.loadUnreadAlerts(),
    ]);
  }

  get isLoggedIn() {
    return !!this.token && !!this.user;
  }

  get isOwner() {
    return this.user?.role === 'owner';
  }
}

export default new AppStore();
