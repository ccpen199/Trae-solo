import { create } from 'zustand';
import type { CargoOrder, Driver, VehicleSensorData, MatchCandidate } from '@/types';
import { generateDrivers, generateOrders, generateSensorHistory } from '@/utils/mockData';
import { getTopCandidates } from '@/utils/matching';

interface OrderState {
  orders: CargoOrder[];
  drivers: Driver[];
  sensorHistory: Record<string, VehicleSensorData[]>;
  loading: boolean;
  init: () => void;
  getOrder: (id: string) => CargoOrder | undefined;
  getDriver: (id: string) => Driver | undefined;
  publishOrder: (order: CargoOrder) => void;
  updateOrderStatus: (id: string, status: CargoOrder['status']) => void;
  assignDriver: (orderId: string, driverId: string) => void;
  pushSensorData: (orderId: string, data: VehicleSensorData) => void;
  getSensorHistory: (orderId: string) => VehicleSensorData[];
  getCandidates: (orderId: string) => MatchCandidate[];
  getDriversByRegion: (region?: string) => Driver[];
}

let initialized = false;

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  drivers: [],
  sensorHistory: {},
  loading: true,
  init: () => {
    if (initialized) {
      set({ loading: false });
      return;
    }
    const drivers = generateDrivers();
    const orders = generateOrders(drivers);
    const history: Record<string, VehicleSensorData[]> = {};
    orders.forEach((o) => {
      if (o.status === 'IN_TRANSIT' || o.status === 'PICKING_UP' || o.status === 'PARTIAL_DELIVERED') {
        history[o.id] = generateSensorHistory(o, 40);
      } else if (o.status === 'COMPLETED' || o.status === 'EXCEPTION') {
        history[o.id] = generateSensorHistory(o, 90);
      }
    });
    set({ orders, drivers, sensorHistory: history, loading: false });
    initialized = true;

    setInterval(() => {
      const s = get();
      const newHistory = { ...s.sensorHistory };
      s.orders.forEach((o) => {
        if (o.status === 'IN_TRANSIT' || o.status === 'PICKING_UP') {
          const existing = newHistory[o.id] || [];
          const prev = existing[existing.length - 1];
          if (prev) {
            const stops = o.stops;
            const progress = Math.min(1, existing.length / 90);
            const startLat = stops[0].lat;
            const startLng = stops[0].lng;
            const endLat = stops[stops.length - 1].lat;
            const endLng = stops[stops.length - 1].lng;
            const tempBase =
              o.tempControl === 'NORMAL'
                ? 22
                : o.tempControl === 'FRESH'
                  ? 5
                  : o.tempControl === 'REFRIGERATED'
                    ? -18
                    : -30;
            const newDoor = prev.doorOpenCount + (Math.random() < 0.08 ? 1 : 0);
            const tempJitter =
              o.tempControl === 'NORMAL' ? (Math.random() - 0.5) * 4 : (Math.random() - 0.5) * 3;
            const newData: VehicleSensorData = {
              driverId: o.driverId ?? 'mock',
              orderId: o.id,
              timestamp: new Date().toISOString(),
              loadWeight: +(o.weight * (o.status === 'PICKING_UP' ? Math.min(1, progress * 3) : 1) + (Math.random() - 0.5) * 50).toFixed(1),
              temperature: +(tempBase + tempJitter).toFixed(1),
              doorOpenCount: newDoor,
              doorEvents: prev.doorEvents,
              location: {
                lat: +(startLat + (endLat - startLat) * progress + (Math.random() - 0.5) * 0.002).toFixed(6),
                lng: +(startLng + (endLng - startLng) * progress + (Math.random() - 0.5) * 0.002).toFixed(6),
                speed: +(20 + Math.random() * 40).toFixed(1),
              },
            };
            newHistory[o.id] = [...existing, newData];
          }
        }
      });
      set({ sensorHistory: newHistory });
    }, 2500);
  },
  getOrder: (id) => get().orders.find((o) => o.id === id),
  getDriver: (id) => get().drivers.find((d) => d.id === id),
  publishOrder: (order) => {
    const candidates = getTopCandidates(order, get().drivers, 3);
    set({ orders: [{ ...order, matchCandidates: candidates }, ...get().orders] });
  },
  updateOrderStatus: (id, status) => {
    set({
      orders: get().orders.map((o) => (o.id === id ? { ...o, status } : o)),
    });
  },
  assignDriver: (orderId, driverId) => {
    const driver = get().drivers.find((d) => d.id === driverId);
    set({
      orders: get().orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              driverId,
              status: 'ACCEPTED',
              matchedAt: new Date().toISOString(),
              currentLat: driver?.currentLat,
              currentLng: driver?.currentLng,
            }
          : o
      ),
    });
  },
  pushSensorData: (orderId, data) => {
    const cur = get().sensorHistory[orderId] || [];
    set({ sensorHistory: { ...get().sensorHistory, [orderId]: [...cur, data] } });
  },
  getSensorHistory: (orderId) => get().sensorHistory[orderId] || [],
  getCandidates: (orderId) => {
    const o = get().orders.find((x) => x.id === orderId);
    if (!o) return [];
    return o.matchCandidates ?? getTopCandidates(o, get().drivers, 3);
  },
  getDriversByRegion: (region) => {
    const all = get().drivers;
    return region ? all.filter((d) => d.region === region) : all;
  },
}));
