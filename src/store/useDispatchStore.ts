import { create } from 'zustand';
import type { DispatchMapData, DispatchOrder, HeatmapPoint } from '@/types';

interface DispatchState {
  mapData: DispatchMapData;
  selectedOrderId: number | null;
  selectedWorkerId: number | null;
  isDispatching: boolean;
  filterServiceType: string;
  setMapData: (data: DispatchMapData) => void;
  setSelectedOrderId: (id: number | null) => void;
  setSelectedWorkerId: (id: number | null) => void;
  setIsDispatching: (dispatching: boolean) => void;
  setFilterServiceType: (type: string) => void;
  assignOrderToWorker: (orderId: number, workerId: number) => void;
  removeOrderFromDispatch: (orderId: number) => void;
  updateWorkerStatus: (workerId: number, status: 'idle' | 'busy') => void;
  getFilteredOrders: () => DispatchOrder[];
  getNearbyWorkers: (lng: number, lat: number, radiusKm?: number) => DispatchMapData['workers'];
  refreshHeatmap: () => void;
}

export const useDispatchStore = create<DispatchState>((set, get) => ({
  mapData: {
    orders: [
      {
        id: 1003,
        address: '北京市海淀区中关村大街1号海龙大厦15层',
        lng: 116.32,
        lat: 39.98,
        service_type: 'cooking',
        start_time: '2024-06-17T11:00:00Z',
        amount: 150,
        distance_km: 2.3,
        priority_score: 85,
      },
      {
        id: 1006,
        address: '北京市朝阳区望京SOHO T3座',
        lng: 116.48,
        lat: 40.00,
        service_type: 'cleaning',
        start_time: '2024-06-15T14:00:00Z',
        amount: 220,
        distance_km: 1.8,
        priority_score: 92,
      },
      {
        id: 1007,
        address: '北京市东城区王府井大街138号新东安市场',
        lng: 116.41,
        lat: 39.91,
        service_type: 'babysitting',
        start_time: '2024-06-15T16:00:00Z',
        amount: 280,
        distance_km: 3.1,
        priority_score: 78,
      },
      {
        id: 1008,
        address: '北京市丰台区方庄芳城园',
        lng: 116.43,
        lat: 39.87,
        service_type: 'cleaning',
        start_time: '2024-06-16T09:00:00Z',
        amount: 180,
        distance_km: 4.5,
        priority_score: 70,
      },
      {
        id: 1009,
        address: '北京市西城区西单大悦城',
        lng: 116.37,
        lat: 39.91,
        service_type: 'cooking',
        start_time: '2024-06-16T17:30:00Z',
        amount: 200,
        distance_km: 2.0,
        priority_score: 88,
      },
    ],
    workers: [
      {
        id: 101,
        name: '王秀兰',
        lng: 116.45,
        lat: 39.92,
        status: 'busy',
        score: 4.8,
      },
      {
        id: 102,
        name: '李桂芳',
        lng: 116.47,
        lat: 39.99,
        status: 'idle',
        score: 4.7,
      },
      {
        id: 103,
        name: '张淑珍',
        lng: 116.35,
        lat: 39.90,
        status: 'idle',
        score: 4.9,
      },
      {
        id: 105,
        name: '刘春梅',
        lng: 116.33,
        lat: 39.97,
        status: 'idle',
        score: 4.6,
      },
      {
        id: 107,
        name: '周翠花',
        lng: 116.42,
        lat: 39.88,
        status: 'busy',
        score: 4.5,
      },
      {
        id: 108,
        name: '吴玉英',
        lng: 116.38,
        lat: 39.93,
        status: 'idle',
        score: 4.75,
      },
    ],
    heatmap: [
      { x: 116.46, y: 39.91, weight: 85, type: 'order' },
      { x: 116.48, y: 40.00, weight: 72, type: 'order' },
      { x: 116.32, y: 39.98, weight: 68, type: 'order' },
      { x: 116.41, y: 39.91, weight: 55, type: 'order' },
      { x: 116.43, y: 39.87, weight: 45, type: 'order' },
      { x: 116.37, y: 39.91, weight: 60, type: 'order' },
      { x: 116.45, y: 39.92, weight: 90, type: 'worker' },
      { x: 116.47, y: 39.99, weight: 78, type: 'worker' },
      { x: 116.35, y: 39.90, weight: 82, type: 'worker' },
      { x: 116.33, y: 39.97, weight: 65, type: 'worker' },
      { x: 116.42, y: 39.88, weight: 70, type: 'worker' },
      { x: 116.38, y: 39.93, weight: 75, type: 'worker' },
    ],
  },
  selectedOrderId: null,
  selectedWorkerId: null,
  isDispatching: false,
  filterServiceType: 'all',
  setMapData: (mapData) => set({ mapData }),
  setSelectedOrderId: (selectedOrderId) => set({ selectedOrderId }),
  setSelectedWorkerId: (selectedWorkerId) => set({ selectedWorkerId }),
  setIsDispatching: (isDispatching) => set({ isDispatching }),
  setFilterServiceType: (filterServiceType) => set({ filterServiceType }),
  assignOrderToWorker: (orderId, workerId) =>
    set((state) => ({
      mapData: {
        ...state.mapData,
        orders: state.mapData.orders.filter((o) => o.id !== orderId),
        workers: state.mapData.workers.map((w) =>
          w.id === workerId ? { ...w, status: 'busy' as const } : w
        ),
      },
      selectedOrderId: null,
      selectedWorkerId: null,
      isDispatching: false,
    })),
  removeOrderFromDispatch: (orderId) =>
    set((state) => ({
      mapData: {
        ...state.mapData,
        orders: state.mapData.orders.filter((o) => o.id !== orderId),
      },
      selectedOrderId: state.selectedOrderId === orderId ? null : state.selectedOrderId,
    })),
  updateWorkerStatus: (workerId, status) =>
    set((state) => ({
      mapData: {
        ...state.mapData,
        workers: state.mapData.workers.map((w) =>
          w.id === workerId ? { ...w, status } : w
        ),
      },
    })),
  getFilteredOrders: () => {
    const { mapData, filterServiceType } = get();
    if (filterServiceType === 'all') return mapData.orders;
    return mapData.orders.filter((o) => o.service_type === filterServiceType);
  },
  getNearbyWorkers: (lng, lat, radiusKm = 5) => {
    const { mapData } = get();
    return mapData.workers.filter((w) => {
      const dx = (w.lng - lng) * 111;
      const dy = (w.lat - lat) * 111;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= radiusKm && w.status === 'idle';
    });
  },
  refreshHeatmap: () => {
    const { mapData } = get();
    const newHeatmap: HeatmapPoint[] = [];
    mapData.orders.forEach((o) => {
      newHeatmap.push({
        x: o.lng + (Math.random() - 0.5) * 0.01,
        y: o.lat + (Math.random() - 0.5) * 0.01,
        weight: o.priority_score,
        type: 'order',
      });
    });
    mapData.workers.forEach((w) => {
      newHeatmap.push({
        x: w.lng + (Math.random() - 0.5) * 0.01,
        y: w.lat + (Math.random() - 0.5) * 0.01,
        weight: Math.round(w.score * 20),
        type: 'worker',
      });
    });
    set((state) => ({
      mapData: { ...state.mapData, heatmap: newHeatmap },
    }));
  },
}));
