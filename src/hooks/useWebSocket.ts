import { useEffect, useRef, useState, useCallback } from 'react';
import { websocketService, ConnectionStatus } from '@/services/websocket';
import type {
  ServerEventMap,
  ClientEventMap,
  Order,
  OrderStatus,
  RiderLocation,
  OrderAlert,
  DashboardMetrics,
} from '@/types';

export type { ConnectionStatus };

interface UseWebSocketOptions {
  autoConnect?: boolean;
  channels?: string[];
}

interface UseWebSocketReturn {
  status: ConnectionStatus;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  subscribe: (channels: string[]) => void;
  unsubscribe: (channels: string[]) => void;
  on: <K extends keyof ServerEventMap>(
    event: K,
    callback: (data: ServerEventMap[K]) => void
  ) => () => void;
  emit: <K extends keyof ClientEventMap>(event: K, ...args: Parameters<ClientEventMap[K]>) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { autoConnect = true, channels = [] } = options;
  const [status, setStatus] = useState<ConnectionStatus>(websocketService.getConnectionStatus());
  const initializedRef = useRef(false);

  const connect = useCallback(() => {
    websocketService.connect();
  }, []);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  const subscribe = useCallback((channelList: string[]) => {
    websocketService.subscribe(channelList);
  }, []);

  const unsubscribe = useCallback((channelList: string[]) => {
    websocketService.unsubscribe(channelList);
  }, []);

  const on = useCallback(
    <K extends keyof ServerEventMap>(
      event: K,
      callback: (data: ServerEventMap[K]) => void
    ) => {
      return websocketService.on(event, callback as unknown as never);
    },
    []
  );

  const emit = useCallback(
    <K extends keyof ClientEventMap>(event: K, ...args: Parameters<ClientEventMap[K]>) => {
      (websocketService.emit as (event: string, ...args: unknown[]) => void)(event as string, ...args);
    },
    []
  );

  useEffect(() => {
    const unsubStatus = websocketService.onConnectionChange((newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'connected' && channels.length > 0) {
        subscribe(channels);
      }
    });

    if (initializedRef.current) return unsubStatus;
    initializedRef.current = true;

    if (autoConnect) {
      connect();
    }

    return unsubStatus;
  }, [autoConnect, channels, connect, subscribe]);

  return {
    status,
    isConnected: status === 'connected',
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    on,
    emit,
  };
}

export function useConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>(websocketService.getConnectionStatus());

  useEffect(() => {
    return websocketService.onConnectionChange(setStatus);
  }, []);

  return status;
}

export function useOrderStatusUpdates(
  callback: (data: { orderId: string; status: OrderStatus; timestamp: string }) => void,
  deps: React.DependencyList = []
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = websocketService.onOrderStatusChange((data) => {
      callbackRef.current(data);
    });
    return unsubscribe;
  }, deps);
}

export function useNewOrders(
  callback: (order: Order) => void,
  deps: React.DependencyList = []
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = websocketService.onNewOrder((order) => {
      callbackRef.current(order);
    });
    return unsubscribe;
  }, deps);
}

export function useRiderLocationUpdates(
  callback: (location: RiderLocation) => void,
  deps: React.DependencyList = []
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = websocketService.onRiderLocation((location) => {
      callbackRef.current(location);
    });
    return unsubscribe;
  }, deps);
}

export function useOrderAlerts(
  callback: (alert: OrderAlert) => void,
  deps: React.DependencyList = []
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = websocketService.onOrderAlert((alert) => {
      callbackRef.current(alert);
    });
    return unsubscribe;
  }, deps);
}

export function useDashboardMetrics(
  callback: (metrics: DashboardMetrics) => void,
  deps: React.DependencyList = []
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = websocketService.onDashboardMetrics((metrics) => {
      callbackRef.current(metrics);
    });
    return unsubscribe;
  }, deps);
}

export default useWebSocket;
