import { useState, useEffect } from "react";
import {
  ArrowLeft,
  User,
  Users,
  AlertTriangle,
  CheckCircle,
  Phone,
  Unlink,
  Link2,
  Bell,
  Activity,
  Calendar,
  Clock,
  TrendingUp,
  ChefHat,
  Dumbbell,
  Pill,
  BookOpen,
  Heart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDataStore } from "@/store/dataStore";
import LargeButton from "@/components/LargeButton";
import { cn } from "@/lib/utils";
import type { FamilyBind, Alert, ActivityLog } from "@/types";

const mockFamilyBinds: FamilyBind[] = [
  {
    id: "fb001",
    elderId: "user-001",
    elderName: "王大爷",
    elderAge: 68,
    familyId: "family-001",
    relation: "儿子",
    receiveAlerts: true,
    createdAt: "2025-12-01T08:00:00Z",
  },
];

const mockAlerts: Alert[] = [
  {
    id: "a001",
    bindId: "fb001",
    type: "medicine",
    message: "降压药已超过2小时未服用，请提醒老人服药",
    triggeredAt: "2026-06-19T09:30:00Z",
    acknowledged: false,
    elderName: "王大爷",
  },
  {
    id: "a002",
    bindId: "fb001",
    type: "inactivity",
    message: "老人已连续2天未使用APP，建议电话联系确认情况",
    triggeredAt: "2026-06-18T20:00:00Z",
    acknowledged: false,
    elderName: "王大爷",
  },
  {
    id: "a003",
    bindId: "fb001",
    type: "health",
    message: "老人上周血压数据偏高，建议陪同就医检查",
    triggeredAt: "2026-06-15T14:20:00Z",
    acknowledged: true,
    elderName: "王大爷",
  },
];

const mockActivityLogs: ActivityLog[] = [
  { date: "2026-06-13", durationMinutes: 45, featuresUsed: ["食谱", "用药提醒"], hasActivity: true },
  { date: "2026-06-14", durationMinutes: 30, featuresUsed: ["八段锦"], hasActivity: true },
  { date: "2026-06-15", durationMinutes: 60, featuresUsed: ["食谱", "用药提醒", "八段锦"], hasActivity: true },
  { date: "2026-06-16", durationMinutes: 20, featuresUsed: ["用药提醒"], hasActivity: true },
  { date: "2026-06-17", durationMinutes: 0, featuresUsed: [], hasActivity: false },
  { date: "2026-06-18", durationMinutes: 0, featuresUsed: [], hasActivity: false },
  { date: "2026-06-19", durationMinutes: 15, featuresUsed: ["食谱"], hasActivity: true },
];

const mockRecentFeatures = [
  { name: "食谱推荐", icon: ChefHat, time: "今天 08:30", color: "#FF7A45" },
  { name: "用药提醒", icon: Pill, time: "昨天 19:00", color: "#3182CE" },
  { name: "八段锦教学", icon: Dumbbell, time: "6月16日 07:15", color: "#38A169" },
  { name: "养生文章", icon: BookOpen, time: "6月15日 20:30", color: "#805AD5" },
  { name: "健康中心", icon: Heart, time: "6月15日 10:00", color: "#E53E3E" },
];

const alertTypeLabels: Record<Alert["type"], { label: string; color: string }> = {
  inactivity: { label: "活跃度异常", color: "#E53E3E" },
  health: { label: "健康预警", color: "#D69E2E" },
  medicine: { label: "用药提醒", color: "#3182CE" },
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (hours < 1) return "刚刚";
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function getWeekDayLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return days[date.getDay()];
}

export default function Family() {
  const navigate = useNavigate();
  const { familyBinds, alerts, setFamilyBinds, setAlerts, acknowledgeAlert, toggleFamilyAlert } =
    useDataStore();

  const [activityLogs] = useState<ActivityLog[]>(mockActivityLogs);
  const [recentFeatures] = useState(mockRecentFeatures);

  useEffect(() => {
    if (familyBinds.length === 0) setFamilyBinds(mockFamilyBinds);
    if (alerts.length === 0) setAlerts(mockAlerts);
  }, [familyBinds.length, alerts.length, setFamilyBinds, setAlerts]);

  const unreadCount = alerts.filter((a) => !a.acknowledged).length;
  const consecutiveInactiveDays = (() => {
    let count = 0;
    for (let i = activityLogs.length - 1; i >= 0; i--) {
      if (!activityLogs[i].hasActivity) count++;
      else break;
    }
    return count;
  })();
  const maxDuration = Math.max(...activityLogs.map((l) => l.durationMinutes), 1);

  const handleEmergencyCall = () => {
    alert("正在拨打紧急联系电话：120");
  };

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: "var(--color-bg)" }}>
      <header className="sticky top-0 z-10 a11y-card rounded-none border-x-0 border-t-0">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="a11y-btn a11y-btn-ghost px-3 py-3"
            aria-label="返回"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <h1 className="text-a11y-xl font-bold a11y-text flex-1 text-center">
            家属中心
          </h1>
          <div className="w-14" />
        </div>
      </header>

      <main className="container pt-6 space-y-6">
        <section className="a11y-card animate-slide-up">
          <h2 className="text-a11y-lg font-bold a11y-text mb-4 flex items-center gap-2">
            <Users className="w-7 h-7" style={{ color: "var(--color-primary)" }} />
            家属绑定
          </h2>
          {familyBinds.length === 0 ? (
            <div className="text-center py-10 space-y-4">
              <User className="w-16 h-16 mx-auto a11y-text-secondary" />
              <p className="text-a11y-lg a11y-text-secondary">暂无绑定的老人</p>
              <LargeButton variant="primary" size="large" icon={<Link2 className="w-6 h-6" />}>
                立即绑定
              </LargeButton>
            </div>
          ) : (
            <div className="space-y-4">
              {familyBinds.map((bind) => (
                <div
                  key={bind.id}
                  className="p-5 rounded-a11y space-y-4"
                  style={{ backgroundColor: "rgba(255, 122, 69, 0.06)" }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="text-a11y-xl font-bold a11y-text">
                        {bind.elderName}
                      </h3>
                      <p className="text-a11y-base a11y-text-secondary">
                        {bind.elderAge}岁 · {bind.relation}
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer pt-1">
                        <Bell className="w-5 h-5 a11y-text-secondary" />
                        <span className="text-a11y-base a11y-text">接收预警通知</span>
                        <button
                          onClick={() => toggleFamilyAlert(bind.id)}
                          className={cn(
                            "relative w-14 h-8 rounded-full transition-colors",
                            bind.receiveAlerts ? "bg-green-500" : "bg-gray-300"
                          )}
                          role="switch"
                          aria-checked={bind.receiveAlerts}
                          aria-label="接收预警通知开关"
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 w-7 h-7 rounded-full bg-white shadow transition-transform",
                              bind.receiveAlerts ? "translate-x-6" : "translate-x-0.5"
                            )}
                          />
                        </button>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <LargeButton
                      variant="outline"
                      size="large"
                      fullWidth
                      icon={<Phone className="w-6 h-6" />}
                    >
                      拨打电话
                    </LargeButton>
                    <LargeButton
                      variant="ghost"
                      size="large"
                      fullWidth
                      icon={<Unlink className="w-6 h-6" />}
                    >
                      解绑
                    </LargeButton>
                  </div>
                </div>
              ))}
              <LargeButton
                variant="outline"
                size="large"
                fullWidth
                icon={<Link2 className="w-6 h-6" />}
              >
                添加绑定老人
              </LargeButton>
            </div>
          )}
        </section>

        <section className="a11y-card animate-slide-up border-2" style={{ borderColor: "var(--color-danger)" }}>
          <div className="flex items-center justify-between mb-5 pb-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <h2 className="text-a11y-xl font-bold flex items-center gap-2" style={{ color: "var(--color-danger)" }}>
              <AlertTriangle className="w-8 h-8" />
              异常预警
            </h2>
            {unreadCount > 0 && (
              <span
                className="a11y-tag px-4 py-2 text-a11y-base font-bold"
                style={{ backgroundColor: "var(--color-danger)", color: "white" }}
              >
                {unreadCount} 条未读
              </span>
            )}
          </div>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-14 h-14 mx-auto text-green-500 mb-3" />
              <p className="text-a11y-lg a11y-text-secondary">暂无预警信息</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const typeInfo = alertTypeLabels[alert.type];
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "p-4 rounded-a11y space-y-3 transition-all border-2",
                      !alert.acknowledged && "animate-pulse-soft"
                    )}
                    style={{
                      backgroundColor: alert.acknowledged
                        ? "rgba(0,0,0,0.02)"
                        : "rgba(229, 62, 62, 0.08)",
                      borderColor: alert.acknowledged
                        ? "var(--color-border)"
                        : "var(--color-danger)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span
                          className="a11y-tag py-1.5 px-3 text-a11y-sm font-bold flex-shrink-0"
                          style={{
                            backgroundColor: `${typeInfo.color}20`,
                            color: typeInfo.color,
                          }}
                        >
                          {typeInfo.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-a11y-base font-bold a11y-text">
                            {alert.elderName}
                          </p>
                          <p className="text-a11y-base a11y-text leading-relaxed mt-1">
                            {alert.message}
                          </p>
                          <p className="text-a11y-sm a11y-text-secondary mt-2 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(alert.triggeredAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <LargeButton
                        variant="primary"
                        size="large"
                        fullWidth
                        icon={<CheckCircle className="w-6 h-6" />}
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        一键确认
                      </LargeButton>
                    )}
                    {alert.acknowledged && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-a11y-base font-medium">已确认处理</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="a11y-card animate-slide-up">
          <h2 className="text-a11y-lg font-bold a11y-text mb-5 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-green-600" />
            活跃度统计
            <span className="text-a11y-sm font-normal a11y-text-secondary">
              最近7天
            </span>
          </h2>

          {consecutiveInactiveDays > 0 && (
            <div
              className="p-4 rounded-a11y mb-5 flex items-center gap-3"
              style={{ backgroundColor: "rgba(229, 62, 62, 0.08)" }}
            >
              <AlertTriangle className="w-7 h-7 flex-shrink-0" style={{ color: "var(--color-danger)" }} />
              <p className="text-a11y-base font-bold" style={{ color: "var(--color-danger)" }}>
                连续 {consecutiveInactiveDays} 天未使用，请多关注老人
              </p>
            </div>
          )}

          <div className="flex items-end justify-between gap-2 h-48 mb-4">
            {activityLogs.map((log, idx) => {
              const heightPercent = log.hasActivity
                ? Math.max((log.durationMinutes / maxDuration) * 100, 15)
                : 5;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-a11y-sm font-bold a11y-text">
                    {log.durationMinutes > 0 ? `${log.durationMinutes}分` : "-"}
                  </span>
                  <div
                    className="w-full rounded-t-lg transition-all min-h-[12px]"
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: log.hasActivity
                        ? "var(--color-secondary)"
                        : "var(--color-border)",
                      opacity: log.hasActivity ? 0.9 : 0.5,
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between gap-2">
            {activityLogs.map((log, idx) => (
              <div key={idx} className="flex-1 text-center">
                <p className="text-a11y-sm a11y-text-secondary">
                  {getWeekDayLabel(log.date)}
                </p>
                <p className="text-a11y-sm a11y-text font-medium">
                  {new Date(log.date).getDate()}日
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t" style={{ borderColor: "var(--color-border)" }}>
            <div className="text-center p-3 rounded-a11y" style={{ backgroundColor: "rgba(44, 122, 123, 0.08)" }}>
              <p className="text-a11y-2xl font-bold a11y-text">
                {activityLogs.filter((l) => l.hasActivity).length}
              </p>
              <p className="text-a11y-sm a11y-text-secondary">活跃天数</p>
            </div>
            <div className="text-center p-3 rounded-a11y" style={{ backgroundColor: "rgba(255, 122, 69, 0.08)" }}>
              <p className="text-a11y-2xl font-bold a11y-text">
                {activityLogs.reduce((sum, l) => sum + l.durationMinutes, 0)}
              </p>
              <p className="text-a11y-sm a11y-text-secondary">总使用(分钟)</p>
            </div>
            <div className="text-center p-3 rounded-a11y" style={{ backgroundColor: "rgba(49, 130, 206, 0.08)" }}>
              <p className="text-a11y-2xl font-bold a11y-text">
                {Math.round(activityLogs.reduce((sum, l) => sum + l.durationMinutes, 0) / Math.max(activityLogs.filter((l) => l.hasActivity).length, 1))}
              </p>
              <p className="text-a11y-sm a11y-text-secondary">日均(分钟)</p>
            </div>
          </div>
        </section>

        <section className="a11y-card animate-slide-up">
          <h2 className="text-a11y-lg font-bold a11y-text mb-4 flex items-center gap-2">
            <Activity className="w-7 h-7" style={{ color: "var(--color-secondary)" }} />
            使用功能记录
          </h2>
          <div className="space-y-2">
            {recentFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 rounded-a11y"
                  style={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-a11y-base font-bold a11y-text">{feature.name}</p>
                    <p className="text-a11y-sm a11y-text-secondary flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {feature.time}
                    </p>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: feature.color }}
                  />
                </div>
              );
            })}
          </div>
        </section>

        <section className="animate-slide-up">
          <button
            onClick={handleEmergencyCall}
            className="w-full a11y-btn py-8 text-a11y-xl font-bold text-white shadow-a11y-hover transition-transform active:scale-98 flex items-center justify-center gap-3"
            style={{ backgroundColor: "var(--color-danger)" }}
            aria-label="紧急联系"
          >
            <Phone className="w-10 h-10" />
            紧急联系（一键拨号）
          </button>
        </section>
      </main>
    </div>
  );
}
