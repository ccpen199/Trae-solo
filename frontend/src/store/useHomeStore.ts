import { create } from 'zustand';

export interface Home {
  id: string;
  name: string;
  location?: string;
  wallpaper?: string;
  deviceCount?: number;
  roomCount?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Room {
  id: string;
  homeId: string;
  name: string;
  icon?: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface Device {
  id: string;
  homeId: string;
  roomId?: string;
  name: string;
  type: string;
  icon?: string;
  status: 'online' | 'offline';
  capabilities: Record<string, any>;
  state: { power?: boolean; [key: string]: any };
  createdAt: number;
  updatedAt: number;
}

interface HomeStore {
  homes: Home[];
  currentHomeId: string | null;
  rooms: Room[];
  devices: Device[];
  loading: boolean;
  error: string | null;
  
  setCurrentHome: (homeId: string) => void;
  loadHomes: () => Promise<void>;
  loadHomeDetail: (homeId: string) => Promise<void>;
  addHome: (name: string, location?: string) => Promise<void>;
  updateHome: (homeId: string, data: Partial<Home>) => Promise<void>;
  deleteHome: (homeId: string) => Promise<void>;
  
  addRoom: (homeId: string, name: string) => Promise<void>;
  updateRoom: (roomId: string, name: string) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
  
  addDevice: (data: Partial<Device>) => Promise<void>;
  controlDevice: (deviceId: string, action: string, params?: any) => Promise<void>;
  deleteDevice: (deviceId: string) => Promise<void>;
  refreshDevices: () => Promise<void>;
}

const useHomeStore = create<HomeStore>((set, get) => ({
  homes: [],
  currentHomeId: localStorage.getItem('currentHomeId') || null,
  rooms: [],
  devices: [],
  loading: false,
  error: null,

  setCurrentHome: (homeId: string) => {
    localStorage.setItem('currentHomeId', homeId);
    set({ currentHomeId: homeId });
    get().loadHomeDetail(homeId);
  },

  loadHomes: async () => {
    try {
      set({ loading: true, error: null });
      const response = await fetch('/api/homes');
      const result = await response.json();
      
      if (result.success) {
        set({ homes: result.data || [] });
        
        if (!get().currentHomeId && result.data?.length > 0) {
          get().setCurrentHome(result.data[0].id);
        } else if (get().currentHomeId) {
          get().loadHomeDetail(get().currentHomeId!);
        }
      }
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  loadHomeDetail: async (homeId: string) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`/api/homes/${homeId}/detail`);
      const result = await response.json();
      
      if (result.success) {
        set({
          rooms: result.data.rooms || [],
          devices: result.data.devices || [],
        });
      }
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  addHome: async (name: string, location?: string) => {
    const response = await fetch('/api/homes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, location }),
    });
    const result = await response.json();
    
    if (result.success) {
      await get().loadHomes();
    } else {
      throw new Error(result.message);
    }
  },

  updateHome: async (homeId: string, data: Partial<Home>) => {
    const response = await fetch(`/api/homes/${homeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    
    if (result.success) {
      await get().loadHomes();
    } else {
      throw new Error(result.message);
    }
  },

  deleteHome: async (homeId: string) => {
    const response = await fetch(`/api/homes/${homeId}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    
    if (result.success) {
      if (get().currentHomeId === homeId) {
        const remainingHomes = get().homes.filter(h => h.id !== homeId);
        if (remainingHomes.length > 0) {
          get().setCurrentHome(remainingHomes[0].id);
        } else {
          set({ currentHomeId: null, rooms: [], devices: [] });
          localStorage.removeItem('currentHomeId');
        }
      }
      await get().loadHomes();
    } else {
      throw new Error(result.message);
    }
  },

  addRoom: async (homeId: string, name: string) => {
    const response = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeId, name }),
    });
    const result = await response.json();
    
    if (result.success) {
      await get().loadHomeDetail(homeId);
    } else {
      throw new Error(result.message);
    }
  },

  updateRoom: async (roomId: string, name: string) => {
    const homeId = get().currentHomeId;
    if (!homeId) return;
    
    const response = await fetch(`/api/rooms/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const result = await response.json();
    
    if (result.success) {
      await get().loadHomeDetail(homeId);
    } else {
      throw new Error(result.message);
    }
  },

  deleteRoom: async (roomId: string) => {
    const homeId = get().currentHomeId;
    if (!homeId) return;
    
    const response = await fetch(`/api/rooms/${roomId}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    
    if (result.success) {
      await get().loadHomeDetail(homeId);
    } else {
      throw new Error(result.message);
    }
  },

  addDevice: async (data: Partial<Device>) => {
    const homeId = get().currentHomeId;
    if (!homeId) return;
    
    const response = await fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, homeId }),
    });
    const result = await response.json();
    
    if (result.success) {
      await get().loadHomeDetail(homeId);
    } else {
      throw new Error(result.message);
    }
  },

  controlDevice: async (deviceId: string, action: string, params?: any) => {
    const homeId = get().currentHomeId;
    if (!homeId) return;
    
    const response = await fetch(`/api/devices/${deviceId}/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, params }),
    });
    const result = await response.json();
    
    if (result.success) {
      set((state) => ({
        devices: state.devices.map((d) =>
          d.id === deviceId ? { ...d, state: result.data.state } : d
        ),
      }));
    } else {
      throw new Error(result.message);
    }
  },

  deleteDevice: async (deviceId: string) => {
    const homeId = get().currentHomeId;
    if (!homeId) return;
    
    const response = await fetch(`/api/devices/${deviceId}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    
    if (result.success) {
      await get().loadHomeDetail(homeId);
    } else {
      throw new Error(result.message);
    }
  },

  refreshDevices: async () => {
    const homeId = get().currentHomeId;
    if (!homeId) return;
    await get().loadHomeDetail(homeId);
  },
}));

export default useHomeStore;
