import { useEffect, useState } from "react";
import {
  Heart,
  Activity,
  Droplets,
  Wind,
  Watch,
  Battery,
  AlertTriangle,
  AlertCircle,
  Info,
  Footprints,
  Flame,
  Clock,
  Moon,
  Wifi,
  WifiOff,
  Loader2,
  Check,
  X,
  Eye,
  User,
  FileText,
  Database,
  Signal,
  SignalZero,
} from "lucide-react";
import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import GaugeChart from "../components/ui/GaugeChart";
import WaveformDisplay from "../components/ui/WaveformDisplay";
import ProgressRing from "../components/ui/ProgressRing";
import { useHealthStore } from "../store/useHealthStore";
import { api } from "../utils/api";
import type { AlertSeverity, ConnectionStatus, Alert, AlertStatus, DataValidity, DispositionStatus } from "../../shared/types";

const severityConfig: Record<AlertSeverity, { bg: string; icon: JSX.Element; badge: string; label: string }> = {
  critical: { bg: "bg-alert-red-500/10 border-alert-red-500/50", icon: <AlertTriangle className="w-5 h-5 text-alert-red-500 pulse-dot" />, badge: "bg-alert-red-500", label: "紧急" },
  warning: { bg: "bg-warning-amber-500/10 border-warning-amber-500/50", icon: <AlertCircle className="w-5 h-5 text-warning-amber-500" />, badge: "bg-warning-amber-500", label: "警告" },
  info: { bg: "bg-vital-green-500/10 border-vital-green-500/50", icon: <Info className="w-5 h-5 text-vital-green-500" />, badge: "bg-vital-green-500", label: "提示" },
};

const statusConfig: Record<ConnectionStatus, { dot: string; text: string; label: string; icon: JSX.Element }> = {
  connected: { dot: "bg-vital-green-500 status-connected", text: "text-vital-green-400", label: "已连接", icon: <Wifi className="w-4 h-4" /> },
  disconnected: { dot: "bg-alert-red-500 status-disconnected", text: "text-alert-red-400", label: "已断开", icon: <WifiOff className="w-4 h-4" /> },
  pairing: { dot: "bg-warning-amber-500", text: "text-warning-amber-400", label: "配对中", icon: <Loader2 className="w-4 h-4 animate-spin" /> },
};

const alertStatusConfig: Record<AlertStatus, { bg: string; text: string; label: string; icon: JSX.Element }> = {
  active: { bg: "bg-alert-red-500/20 border-alert-red-500/50", text: "text-alert-red-400", label: "活跃", icon: <AlertTriangle className="w-3 h-3" /> },
  acknowledged: { bg: "bg-vital-green-500/20 border-vital-green-500/50", text: "text-vital-green-400", label: "已确认", icon: <Check className="w-3 h-3" /> },
  pending_review: { bg: "bg-warning-amber-500/20 border-warning-amber-500/50", text: "text-warning-amber-400", label: "待复核", icon: <Eye className="w-3 h-3" /> },
  dismissed: { bg: "bg-deep-sea-400/20 border-deep-sea-400/50", text: "text-deep-sea-300", label: "已忽略", icon: <X className="w-3 h-3" /> },
  needs_referral: { bg: "bg-purple-500/20 border-purple-500/50", text: "text-purple-400", label: "需转诊", icon: <User className="w-3 h-3" /> },
};

const dispositionConfig: Record<DispositionStatus, { label: string }> = {
  observed: { label: "观察中" },
  medication_adjusted: { label: "用药调整" },
  lifestyle_change: { label: "生活方式改变" },
  referral_suggested: { label: "建议转诊" },
  no_action: { label: "无需处置" },
};

const dataValidityConfig: Record<DataValidity, { dot: string; text: string; label: string; icon: JSX.Element; bg: string }> = {
  realtime: { dot: "bg-vital-green-500 status-connected", text: "text-vital-green-400", label: "实时数据", icon: <Signal className="w-4 h-4" />, bg: "bg-vital-green-500/10" },
  cached: { dot: "bg-warning-amber-500", text: "text-warning-amber-400", label: "缓存数据", icon: <Database className="w-4 h-4" />, bg: "bg-warning-amber-500/10" },
  offline: { dot: "bg-alert-red-500 status-disconnected", text: "text-alert-red-400", label: "离线数据", icon: <SignalZero className="w-4 h-4" />, bg: "bg-alert-red-500/10" },
};

const subScores = [
  { key: "sleep", label: "睡眠", icon: <Moon className="w-4 h-4" /> },
  { key: "activity", label: "活动", icon: <Activity className="w-4 h-4" /> },
  { key: "heart", label: "心脏", icon: <Heart className="w-4 h-4" /> },
  { key: "stress", label: "压力", icon: <Wind className="w-4 h-4" /> },
];

const todayStats = [
  { key: "steps", label: "步数", icon: <Footprints className="w-8 h-8 text-vital-green-400" />, textColor: "text-vital-green-400", bg: "bg-vital-green-500/10" },
  { key: "calories", label: "卡路里 (kcal)", icon: <Flame className="w-8 h-8 text-alert-red-400" />, textColor: "text-alert-red-400", bg: "bg-alert-red-500/10" },
  { key: "duration", label: "运动时长 (分钟)", icon: <Clock className="w-8 h-8 text-warning-amber-400" />, textColor: "text-warning-amber-400", bg: "bg-warning-amber-500/10" },
  { key: "sleep", label: "睡眠时长 (小时)", icon: <Moon className="w-8 h-8 text-purple-400" />, textColor: "text-purple-400", bg: "bg-sleep-rem/20" },
];

export function Home() {
  const { currentVitals, healthScore, devices, alerts, activeAlerts, exerciseRecords, sleepRecords, connected, dataValidity, updateAlert, setLoading } = useHealthStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAlertAction = async (alertId: string, action: "acknowledge" | "dismiss") => {
    setLoading("alert", true);
    try {
      const updated = (action === "acknowledge" ? await api.alerts.acknowledge(alertId) : await api.alerts.dismiss(alertId)) as Alert;
      updateAlert(updated);
    } catch (error) {
      console.error(`Failed to ${action} alert:`, error);
    } finally {
      setLoading("alert", false);
    }
  };

  const getStatusColor = (value: number, thresholds: { warn: number; crit: number }) =>
    value >= thresholds.crit ? "critical" : value >= thresholds.warn ? "warning" : "normal";

  const todayExercise = exerciseRecords.find((r) => new Date(r.startTime).toDateString() === new Date().toDateString());
  const todaySleep = sleepRecords.find((r) => r.date === new Date().toISOString().split("T")[0]);

  const getTodayValue = (key: string) => {
    switch (key) {
      case "steps": return todayExercise ? Math.round(todayExercise.distance * 1000) : 8432;
      case "calories": return todayExercise?.calories ?? 420;
      case "duration": return todayExercise?.duration ?? 45;
      case "sleep": return todaySleep ? Math.round(todaySleep.totalTime / 60) : 7.5;
      default: return 0;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-deep-sea-50 glow-text">数据总览</h1>
          <p className="text-deep-sea-200/60 mt-1">
            {currentTime.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })} · {currentTime.toLocaleTimeString("zh-CN")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${dataValidityConfig[dataValidity].bg} border border-vital-green-500/20`}>
            {dataValidityConfig[dataValidity].icon}
            <span className={`text-xs font-medium ${dataValidityConfig[dataValidity].text}`}>{dataValidityConfig[dataValidity].label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${connected ? "bg-vital-green-500 status-connected" : "bg-alert-red-500 status-disconnected"}`} />
            <span className={connected ? "text-vital-green-400" : "text-alert-red-400"}>{connected ? "实时连接" : "连接断开"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-deep-sea-100 mb-4">健康评分</h3>
          <GaugeChart value={healthScore?.overall ?? 0} label="综合健康" />
          <div className="grid grid-cols-4 gap-4 mt-6">
            {subScores.map((item) => (
              <div key={item.key} className="text-center">
                <ProgressRing value={healthScore?.[item.key as keyof typeof healthScore] ?? 0} size={50} thickness={4} showValue={false} />
                <div className="flex items-center justify-center gap-1 mt-1 text-deep-sea-200/70 text-xs">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <span className="text-vital-green-400 font-din text-sm">{healthScore?.[item.key as keyof typeof healthScore] ?? "--"}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="心率" 
              value={dataValidity === "offline" ? "--" : (currentVitals?.heartRate ?? "--")} 
              unit="BPM" 
              icon={<Heart className="w-5 h-5" />} 
              status={dataValidity === "offline" ? "normal" : getStatusColor(currentVitals?.heartRate ?? 0, { warn: 90, crit: 110 })}
            >
              <WaveformDisplay className="mt-3" color={dataValidity === "offline" ? "#64748b" : "#00E5A0"} />
              {dataValidity !== "realtime" && (
                <div className="flex items-center gap-1 mt-2 text-xs text-warning-amber-400">
                  <Database className="w-3 h-3" />
                  <span>缓存数据</span>
                </div>
              )}
            </StatCard>
            <StatCard 
              title="血氧饱和度" 
              value={dataValidity === "offline" ? "--" : (currentVitals?.bloodOxygen ?? "--")} 
              unit="%" 
              icon={<Droplets className="w-5 h-5" />} 
              status={dataValidity === "offline" ? "normal" : (currentVitals?.bloodOxygen && currentVitals.bloodOxygen < 95 ? "warning" : "normal")}
            >
              {dataValidity !== "realtime" && (
                <div className="flex items-center gap-1 mt-2 text-xs text-warning-amber-400">
                  <Database className="w-3 h-3" />
                  <span>缓存数据</span>
                </div>
              )}
            </StatCard>
            <StatCard 
              title="压力指数" 
              value={dataValidity === "offline" ? "--" : (currentVitals?.stressIndex ?? "--")} 
              icon={<Wind className="w-5 h-5" />} 
              status={dataValidity === "offline" ? "normal" : getStatusColor(currentVitals?.stressIndex ?? 0, { warn: 60, crit: 80 })}
            >
              {dataValidity !== "realtime" && (
                <div className="flex items-center gap-1 mt-2 text-xs text-warning-amber-400">
                  <Database className="w-3 h-3" />
                  <span>缓存数据</span>
                </div>
              )}
            </StatCard>
            <StatCard 
              title="HRV 变异性" 
              value={dataValidity === "offline" ? "--" : Math.round(currentVitals?.hrv ?? 0)} 
              unit="ms" 
              icon={<Activity className="w-5 h-5" />} 
              status={dataValidity === "offline" ? "normal" : (currentVitals?.hrv && currentVitals.hrv < 40 ? "warning" : "normal")}
            >
              {dataValidity !== "realtime" && (
                <div className="flex items-center gap-1 mt-2 text-xs text-warning-amber-400">
                  <Database className="w-3 h-3" />
                  <span>缓存数据</span>
                </div>
              )}
            </StatCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold text-deep-sea-100 mb-4">设备连接</h3>
              <div className="space-y-3">
                {devices.map((device) => {
                  const styles = statusConfig[device.connectionStatus];
                  return (
                    <div key={device.id} className="flex items-center justify-between p-3 rounded-xl bg-deep-sea-600/50 border border-vital-green-500/10 hover:border-vital-green-500/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-vital-green-500/10 flex items-center justify-center">
                          <Watch className="w-5 h-5 text-vital-green-400" />
                        </div>
                        <div>
                          <p className="text-deep-sea-100 font-medium text-sm">{device.brand} {device.model}</p>
                          <p className="text-deep-sea-200/50 text-xs">{device.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-deep-sea-200/60 text-xs">
                          <Battery className="w-3 h-3" />
                          <span>{device.batteryLevel}%</span>
                        </div>
                        <div className={`flex items-center gap-1 ${styles.text} text-xs`}>
                          <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
                          {styles.icon}
                          <span>{styles.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-deep-sea-100 mb-4">预警摘要</h3>
              <div className="space-y-3">
                {alerts.slice(0, 3).map((alert) => {
                  const styles = severityConfig[alert.severity];
                  const statusStyles = alertStatusConfig[alert.status];
                  return (
                    <div key={alert.id} className={`p-3 rounded-xl border backdrop-blur-sm ${styles.bg} transition-all duration-300`}>
                      <div className="flex items-start gap-3">
                        {styles.icon}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${styles.badge}`}>{styles.label}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border flex items-center gap-1 ${statusStyles.bg} ${statusStyles.text}`}>
                              {statusStyles.icon}
                              {statusStyles.label}
                            </span>
                            <span className="text-xs text-deep-sea-200/60">
                              {new Date(alert.startedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <h4 className="text-deep-sea-100 font-medium text-sm mb-1">{alert.title}</h4>
                          <p className="text-xs text-deep-sea-200/70 line-clamp-1">{alert.description}</p>
                          
                          {(alert.status === "acknowledged" || alert.status === "pending_review" || alert.status === "needs_referral") && (
                            <div className="mt-2 p-2 rounded-lg bg-deep-sea-700/50 border border-vital-green-500/10">
                              {alert.acknowledgedBy && (
                                <div className="flex items-center gap-1 text-xs text-deep-sea-200/70 mb-1">
                                  <User className="w-3 h-3 text-vital-green-400" />
                                  <span>确认人：<span className="text-vital-green-400">{alert.acknowledgedBy}</span></span>
                                </div>
                              )}
                              {alert.dispositionStatus && (
                                <div className="flex items-center gap-1 text-xs text-deep-sea-200/70">
                                  <FileText className="w-3 h-3 text-warning-amber-400" />
                                  <span>处置：<span className="text-warning-amber-400">{dispositionConfig[alert.dispositionStatus]?.label || alert.dispositionStatus}</span></span>
                                </div>
                              )}
                              {alert.dispositionNote && (
                                <p className="text-xs text-deep-sea-200/60 mt-1 line-clamp-2">{alert.dispositionNote}</p>
                              )}
                            </div>
                          )}
                          
                          {alert.status === "dismissed" && (
                            <div className="mt-2 p-2 rounded-lg bg-deep-sea-700/50 border border-deep-sea-400/20">
                              {alert.dismissedBy && (
                                <div className="flex items-center gap-1 text-xs text-deep-sea-200/70 mb-1">
                                  <User className="w-3 h-3 text-deep-sea-300" />
                                  <span>忽略人：<span className="text-deep-sea-300">{alert.dismissedBy}</span></span>
                                </div>
                              )}
                              {alert.dismissReason && (
                                <p className="text-xs text-deep-sea-200/60 line-clamp-2">{alert.dismissReason}</p>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            {alert.status === "active" && (
                              <>
                                <button onClick={() => handleAlertAction(alert.id, "acknowledge")} className="px-3 py-1 text-xs rounded-full bg-vital-green-500/20 text-vital-green-400 hover:bg-vital-green-500/30 transition-colors">确认</button>
                                <button onClick={() => handleAlertAction(alert.id, "dismiss")} className="px-3 py-1 text-xs rounded-full bg-deep-sea-200/10 text-deep-sea-200/70 hover:bg-deep-sea-200/20 transition-colors">忽略</button>
                              </>
                            )}
                            {alert.status === "acknowledged" && (
                              <button onClick={() => handleAlertAction(alert.id, "dismiss")} className="px-3 py-1 text-xs rounded-full bg-deep-sea-200/10 text-deep-sea-200/70 hover:bg-deep-sea-200/20 transition-colors">关闭</button>
                            )}
                            {alert.status === "pending_review" && (
                              <span className="px-3 py-1 text-xs rounded-full bg-warning-amber-500/20 text-warning-amber-400">待医生复核</span>
                            )}
                            {alert.status === "needs_referral" && (
                              <span className="px-3 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400">已建议转诊</span>
                            )}
                            {alert.status === "dismissed" && (
                              <span className="px-3 py-1 text-xs rounded-full bg-deep-sea-400/20 text-deep-sea-300">已关闭</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {alerts.length === 0 && (
                  <div className="text-center py-8 text-deep-sea-200/50">
                    <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>暂无预警记录</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-deep-sea-100">今日健康概览</h3>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-deep-sea-600/50 text-deep-sea-200/60 text-xs">
            <FileText className="w-3 h-3" />
            <span>统计数据</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {todayStats.map((stat) => (
            <div key={stat.key} className="text-center">
              <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                {stat.icon}
              </div>
              <p className={`text-3xl font-din font-bold ${stat.textColor}`}>{getTodayValue(stat.key)}</p>
              <p className="text-sm text-deep-sea-200/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
