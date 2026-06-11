import { useEffect } from "react";
import { useHealthStore } from "../store/useHealthStore";
import type { VitalRecord, Alert } from "../../shared/types";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://127.0.0.1:59163/ws/realtime";

export function useWebSocket() {
  const {
    connected,
    connect,
    disconnect,
    setCurrentVitals,
    addAlerts,
    baselineHeartRate,
  } = useHealthStore();

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connectWS() {
      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          console.log("WebSocket connected");
          connect();
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === "vitals") {
              const vitals = message.data as VitalRecord & {
                baselineHeartRate: number;
                heartRateChangePercent: number;
              };
              setCurrentVitals(vitals);
              useHealthStore.setState({
                baselineHeartRate: vitals.baselineHeartRate || baselineHeartRate,
                heartRateChangePercent: vitals.heartRateChangePercent || 0,
              });
            } else if (message.type === "alerts") {
              const alerts = message.data as Alert[];
              addAlerts(alerts);
            } else if (message.type === "ping") {
              ws?.send(JSON.stringify({ type: "pong" }));
            }
          } catch (error) {
            console.error("WebSocket message parse error:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        ws.onclose = () => {
          console.log("WebSocket disconnected");
          disconnect();
          reconnectTimer = setTimeout(connectWS, 3000);
        };
      } catch (error) {
        console.error("WebSocket connection error:", error);
        reconnectTimer = setTimeout(connectWS, 5000);
      }
    }

    connectWS();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      disconnect();
    };
  }, [connect, disconnect, setCurrentVitals, addAlerts, baselineHeartRate]);

  return { connected };
}
