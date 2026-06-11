import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useHealthStore } from "../store/useHealthStore";
import { X, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { api } from "../utils/api";
import type { Alert } from "../../shared/types";

export function Layout() {
  const { activeAlerts, updateAlert, setLoading } = useHealthStore();

  const handleAcknowledge = async (alertId: string) => {
    setLoading("alert", true);
    try {
      const updated = (await api.alerts.acknowledge(alertId)) as Alert;
      updateAlert(updated);
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    } finally {
      setLoading("alert", false);
    }
  };

  const handleDismiss = async (alertId: string) => {
    setLoading("alert", true);
    try {
      const updated = (await api.alerts.dismiss(alertId)) as Alert;
      updateAlert(updated);
    } catch (error) {
      console.error("Failed to dismiss alert:", error);
    } finally {
      setLoading("alert", false);
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          bg: "bg-alert-red-500/10 border-alert-red-500/50",
          icon: <AlertTriangle className="w-5 h-5 text-alert-red-500 pulse-dot" />,
          badge: "bg-alert-red-500",
        };
      case "warning":
        return {
          bg: "bg-warning-amber-500/10 border-warning-amber-500/50",
          icon: <AlertCircle className="w-5 h-5 text-warning-amber-500" />,
          badge: "bg-warning-amber-500",
        };
      default:
        return {
          bg: "bg-vital-green-500/10 border-vital-green-500/50",
          icon: <Info className="w-5 h-5 text-vital-green-500" />,
          badge: "bg-vital-green-500",
        };
    }
  };

  return (
    <div className="min-h-screen bg-deep-sea-500">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <div className="p-8">
          <Outlet />
        </div>
      </main>

      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
        {activeAlerts.slice(0, 3).map((alert, index) => {
          const styles = getSeverityStyles(alert.severity);
          return (
            <div
              key={alert.id}
              className={`animate-slide-in p-4 rounded-xl border backdrop-blur-md ${styles.bg}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-3">
                {styles.icon}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${styles.badge}`}>
                      {alert.severity === "critical" ? "紧急" : alert.severity === "warning" ? "警告" : "提示"}
                    </span>
                    <span className="text-xs text-deep-sea-200/60">
                      {new Date(alert.startedAt).toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <h4 className="font-medium text-deep-sea-50 text-sm mb-1">{alert.title}</h4>
                  <p className="text-xs text-deep-sea-200/70 line-clamp-2">
                    {alert.description}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-3 py-1 text-xs rounded-full bg-vital-green-500/20 text-vital-green-400 hover:bg-vital-green-500/30 transition-colors"
                    >
                      确认
                    </button>
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="px-3 py-1 text-xs rounded-full bg-deep-sea-200/10 text-deep-sea-200/70 hover:bg-deep-sea-200/20 transition-colors"
                    >
                      忽略
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="text-deep-sea-200/50 hover:text-deep-sea-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
