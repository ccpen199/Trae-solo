import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { useVehicleStore } from './vehicleStore';
import { useAlertStore } from './alertStore';
import type { Alert } from './alertStore';

interface QueuedMessage {
  id: string;
  type: string;
  data: unknown;
  timestamp: string;
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
}

interface ProtocolStats {
  jtt808: number;
  gbt35658: number;
  totalMessages: number;
  lastMessageTime: string;
}

interface ArchiveStats {
  totalPoints: number;
  archivedMonths: number;
  lastArchiveTime: string;
}

interface WSMessage {
  type: 'vehicle_update' | 'alert' | 'heartbeat';
  data: Record<string, unknown>;
}

interface WSState {
  ws: WebSocket | null;
  connected: boolean;
  vehicleUpdates: Map<string, Record<string, unknown>>;
  latestAlerts: Alert[];
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  messageQueue: QueuedMessage[];
  protocolStats: ProtocolStats;
  reconnectAttempts: number;
  archiveStats: ArchiveStats;
  connectionStartTime: number;
  refCount: number;
  connect: () => void;
  disconnect: (force?: boolean) => void;
}

export const useWsStore = create<WSState>((set, get) => ({
  ws: null,
  connected: false,
  vehicleUpdates: new Map(),
  latestAlerts: [],
  reconnectTimer: null,
  messageQueue: [],
  protocolStats: { jtt808: 0, gbt35658: 0, totalMessages: 0, lastMessageTime: '' },
  reconnectAttempts: 0,
  archiveStats: { totalPoints: 14400, archivedMonths: 3, lastArchiveTime: new Date().toISOString() },
  refCount: 0,

  connect: () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    const state = get();
    set({ refCount: state.refCount + 1 });

    const existing = state.ws;
    if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = `ws://${window.location.hostname}:59133/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      set({ connected: true, reconnectAttempts: 0, connectionStartTime: Date.now() });
      const queue = get().messageQueue;
      if (queue.length > 0) {
        set({
          messageQueue: queue.map((m) => ({ ...m, status: 'sent' as const })),
        });
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        if (msg.type === 'vehicle_update') {
          const vData = msg.data;
          const vehicleId = String(vData.id);
          set((state) => {
            const newMap = new Map(state.vehicleUpdates);
            newMap.set(vehicleId, vData);
            return { vehicleUpdates: newMap };
          });
          useVehicleStore.getState().updateVehiclePosition(Number(vData.id), {
            lat: vData.lat as number,
            lng: vData.lng as number,
            speed: vData.speed as number,
            heading: vData.heading as number,
            status: vData.status as 'online' | 'offline' | 'alarm',
            last_location_time: (vData.last_location_time || vData.timestamp) as string,
          });
          const protocol = (vData.device_protocol as string) || 'JTT808';
          set((state) => ({
            protocolStats: {
              jtt808: state.protocolStats.jtt808 + (protocol === 'JTT808' ? 1 : 0),
              gbt35658: state.protocolStats.gbt35658 + (protocol === 'GBT35658' ? 1 : 0),
              totalMessages: state.protocolStats.totalMessages + 1,
              lastMessageTime: new Date().toISOString(),
            },
          }));
        } else if (msg.type === 'alert') {
          const alert = msg.data as unknown as Alert;
          set((state) => ({
            latestAlerts: [alert, ...state.latestAlerts].slice(0, 50),
          }));
          useAlertStore.getState().addAlert(alert);
        }
      } catch {
      }
    };

    ws.onclose = () => {
      const currentState = get();
      if (currentState.refCount <= 0) {
        set({ connected: false, ws: null, reconnectTimer: null });
        return;
      }
      const attempts = currentState.reconnectAttempts + 1;
      set({ connected: false, ws: null, reconnectAttempts: attempts });
      const delay = Math.min(5000 * Math.pow(1.5, attempts - 1), 30000);
      const timer = setTimeout(() => {
        if (get().refCount > 0) {
          get().connect();
        }
      }, delay);
      set({ reconnectTimer: timer });
    };

    ws.onerror = () => {
      ws.close();
    };

    set({ ws });
  },

  disconnect: (force?: boolean) => {
    const state = get();
    const newRefCount = Math.max(0, state.refCount - 1);
    set({ refCount: newRefCount });

    if (force || newRefCount <= 0) {
      const { ws, reconnectTimer } = state;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
      set({ ws: null, connected: false, reconnectTimer: null, reconnectAttempts: 0, refCount: 0 });
    }
  },
}));
