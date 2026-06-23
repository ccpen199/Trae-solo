import { useState, useEffect, useMemo, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  AlertTriangle,
  TrainFront,
  Bus,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Star,
  StarOff,
  Search,
  Filter,
  User,
  Eye,
  CheckCircle,
  ShieldAlert,
  Users,
  Zap,
  AlertCircle,
  Info,
  RefreshCw,
  Map as MapIcon,
  Activity,
  Bell,
  BellOff,
  Check,
  Building2,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import TabBar from "@/components/ui/TabBar";
import { trafficApi } from "@/api";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/utils/format";
import type {
  TrafficEvent,
  BusPrediction,
  Severity,
  TrafficEventType,
  AccidentStatus,
  AccidentSource,
  MetroStatus,
  MetroDelayReason,
  MetroMeasure,
  BusStatus,
  BusCrowdLevel,
  MapLayer,
  TrafficOverview,
  TrafficDisposalStatus,
  AccidentEvent,
  MetroDelayEvent,
} from "../../shared/types";

const eventTypeConfig: Record<TrafficEventType, { label: string; color: string; bg: string; border: string; icon: typeof AlertTriangle }> = {
  accident: {
    label: "交通事故",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-l-red-500",
    icon: AlertTriangle,
  },
  metro_delay: {
    label: "地铁延误",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-l-orange-500",
    icon: TrainFront,
  },
  bus_abnormal: {
    label: "公交异常",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-l-yellow-500",
    icon: Bus,
  },
  road_condition: {
    label: "路况信息",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-l-blue-500",
    icon: MapIcon,
  },
};

const severityConfig: Record<Severity, { label: string; className: string }> = {
  info: {
    label: "一般",
    className: "bg-blue-100 text-blue-700",
  },
  warning: {
    label: "较重",
    className: "bg-yellow-100 text-yellow-700",
  },
  danger: {
    label: "严重",
    className: "bg-red-100 text-red-700",
  },
};

const accidentStatusConfig: Record<AccidentStatus, { label: string; className: string; icon: typeof Clock }> = {
  dispatched: {
    label: "已出警",
    className: "bg-blue-100 text-blue-700",
    icon: ShieldAlert,
  },
  on_site: {
    label: "已到场",
    className: "bg-orange-100 text-orange-700",
    icon: Eye,
  },
  processing: {
    label: "处理中",
    className: "bg-yellow-100 text-yellow-700",
    icon: RefreshCw,
  },
  cleared: {
    label: "已疏通",
    className: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
};

const accidentSourceConfig: Record<AccidentSource, { label: string; icon: typeof User }> = {
  police_patrol: {
    label: "民警巡检",
    icon: ShieldAlert,
  },
  citizen_report: {
    label: "市民上报",
    icon: User,
  },
  monitor_auto: {
    label: "监控自动识别",
    icon: Zap,
  },
};

const metroDelayReasonConfig: Record<MetroDelayReason, { label: string }> = {
  equipment_failure: { label: "设备故障" },
  passenger_control: { label: "客流管控" },
  emergency: { label: "突发事件" },
  maintenance: { label: "设备检修" },
};

const metroMeasureConfig: Record<MetroMeasure, { label: string; icon: typeof Bus }> = {
  bus_shuttle: { label: "公交接驳", icon: Bus },
  extra_trains: { label: "加开列车", icon: TrainFront },
  staff_guidance: { label: "人员引导", icon: Users },
};

const busStatusConfig: Record<BusStatus, { label: string; className: string }> = {
  normal: { label: "正常运行", className: "bg-green-100 text-green-700" },
  rerouted: { label: "临时改线", className: "bg-orange-100 text-orange-700" },
  delayed: { label: "晚点", className: "bg-yellow-100 text-yellow-700" },
  suspended: { label: "停运", className: "bg-red-100 text-red-700" },
};

const crowdLevelConfig: Record<BusCrowdLevel, { label: string; color: string; bg: string }> = {
  empty: { label: "空", color: "text-green-600", bg: "bg-green-100" },
  moderate: { label: "适中", color: "text-blue-600", bg: "bg-blue-100" },
  crowded: { label: "拥挤", color: "text-red-600", bg: "bg-red-100" },
};

const disposalStatusConfig: Record<TrafficDisposalStatus, { label: string; color: string; bg: string; progress: number }> = {
  arrived: { label: "已到场", color: "text-blue-700", bg: "bg-blue-100 border-blue-200", progress: 40 },
  processing: { label: "处理中", color: "text-amber-700", bg: "bg-amber-100 border-amber-200", progress: 65 },
  cleared: { label: "已疏通", color: "text-emerald-700", bg: "bg-emerald-100 border-emerald-200", progress: 90 },
  recovered: { label: "已恢复", color: "text-teal-700", bg: "bg-teal-100 border-teal-200", progress: 100 },
  delayed: { label: "延误中", color: "text-orange-700", bg: "bg-orange-100 border-orange-200", progress: 50 },
  pending: { label: "待处置", color: "text-slate-700", bg: "bg-slate-100 border-slate-200", progress: 10 },
};

const TABS = [
  { key: "accident", label: "事故快报", icon: AlertTriangle },
  { key: "metro", label: "地铁延误", icon: TrainFront },
  { key: "bus", label: "公交预测", icon: Bus },
  { key: "map", label: "路况地图", icon: MapPin },
];

const DISTRICTS = ["全部区域", "市南区", "市北区", "李沧区", "崂山区", "黄岛区"];
const SEVERITY_OPTIONS: { key: Severity | "all"; label: string }[] = [
  { key: "all", label: "全部严重程度" },
  { key: "info", label: "一般" },
  { key: "warning", label: "较重" },
  { key: "danger", label: "严重" },
];

const QINGDAO_CENTER: [number, number] = [36.0671, 120.3826];

function createMarkerIcon(color: string, size: number = 12) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="width: ${size}px; height: ${size}px; background: ${color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function TrafficOverviewCard({
  overview,
  onTabChange,
}: {
  overview: TrafficOverview | null;
  onTabChange: (tab: string) => void;
}) {
  if (!overview) {
    return (
      <div className="card p-4 mb-4">
        <div className="h-24 skeleton" />
      </div>
    );
  }

  const statItems = [
    {
      key: "accident",
      label: "今日交通事故",
      value: overview.todayAccidents,
      unit: "起",
      color: "text-red-600",
      bg: "bg-red-50",
      icon: AlertTriangle,
      trend: overview.accidentTrend,
      diff: Math.abs(overview.todayAccidents - overview.yesterdayAccidents),
      sub: `较昨日${overview.accidentTrend === "up" ? "↑" : overview.accidentTrend === "down" ? "↓" : "→"}`,
      status: "",
    },
    {
      key: "metro",
      label: "地铁延误线路",
      value: overview.delayedMetroLines,
      unit: "条",
      color: "text-orange-600",
      bg: "bg-orange-50",
      icon: TrainFront,
      trend: "same" as const,
      diff: 0,
      sub:
        overview.metroStatus === "normal"
          ? "正常运行"
          : overview.metroStatus === "partial_delay"
          ? "部分延误"
          : "大面积延误",
      status: overview.metroStatus,
    },
    {
      key: "bus",
      label: "公交异常线路",
      value: overview.abnormalBusRoutes,
      unit: "条",
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      icon: Bus,
      trend: "same" as const,
      diff: 0,
      sub: overview.busStatus === "normal" ? "正常运行" : "部分异常",
      status: overview.busStatus,
    },
  ];

  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-800 text-base flex items-center gap-2">
          交通态势总览
          {(overview.unreadCount ?? 0) > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">
              {overview.unreadCount}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {(overview.subscribedCount ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Bell size={10} />
              {overview.subscribedCount} 项订阅
            </span>
          )}
          <span>更新于 {formatDateTime(overview.lastUpdated, "HH:mm")}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {statItems.map((item) => {
          const Icon = item.icon;
          const isDelayed = item.status === "partial_delay" || item.status === "major_delay" || item.status === "partial_abnormal";
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={cn(
                "rounded-xl p-3 text-left transition-all duration-200 active:scale-95",
                item.bg,
                "hover:shadow-md"
              )}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon size={16} className={item.color} />
                <span className="text-xs text-slate-600">{item.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={cn("text-2xl font-bold tabular-nums", item.color)}>
                  {item.value}
                </span>
                <span className="text-xs text-slate-500">{item.unit}</span>
              </div>
              <div className="mt-1 flex items-center gap-1">
                {item.trend !== "same" && (
                  <>
                    {item.trend === "up" ? (
                      <TrendingUp size={12} className="text-red-500" />
                    ) : (
                      <TrendingDown size={12} className="text-green-500" />
                    )}
                  </>
                )}
                <span className={cn("text-xs", isDelayed ? "text-orange-600" : "text-slate-500")}>
                  {item.sub}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProgressSteps({ progress }: { progress: { received: boolean; dispatched: boolean; onSite: boolean; processing: boolean; cleared: boolean } }) {
  const steps = [
    { key: "received", label: "接警", done: progress.received },
    { key: "dispatched", label: "出警", done: progress.dispatched },
    { key: "onSite", label: "到场", done: progress.onSite },
    { key: "processing", label: "处置", done: progress.processing },
    { key: "cleared", label: "恢复", done: progress.cleared },
  ];

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, idx) => (
        <div key={step.key} className="flex flex-col items-center flex-1 relative">
          {idx < steps.length - 1 && (
            <div
              className={cn(
                "absolute top-2.5 left-1/2 w-full h-0.5",
                step.done && steps[idx + 1]?.done ? "bg-green-400" : "bg-slate-200"
              )}
            />
          )}
          <div
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center z-10",
              step.done ? "bg-green-500" : "bg-slate-200"
            )}
          >
            {step.done ? (
              <CheckCircle size={12} className="text-white" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-slate-400" />
            )}
          </div>
          <span
            className={cn(
              "text-[10px] mt-1",
              step.done ? "text-green-600 font-medium" : "text-slate-400"
            )}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function AccidentCard({
  accident,
  onTrack,
  onMarkRead,
  onSubscribe,
}: {
  accident: AccidentEvent & { tracked?: boolean };
  onTrack: (id: string) => void;
  onMarkRead: (id: string) => void;
  onSubscribe: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = accidentStatusConfig[accident.status as AccidentStatus];
  const sourceConfig = accidentSourceConfig[accident.sourceType as AccidentSource];
  const sevConfig = severityConfig[accident.severity as Severity];
  const dispConfig = disposalStatusConfig[accident.disposalStatus || "pending"];
  const SourceIcon = sourceConfig.icon;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="card overflow-hidden border-l-4 border-l-red-500 relative">
      {!accident.read && (
        <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm animate-pulse z-10" />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2 pr-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-slate-400">{accident.accidentNo}</span>
            <span className={cn("chip", statusConfig.className)}>
              <StatusIcon size={12} />
              {statusConfig.label}
            </span>
            <span className={cn(
              "chip inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full border font-medium",
              dispConfig.bg,
              dispConfig.color
            )}>
              <Activity size={10} />
              {dispConfig.label}
            </span>
          </div>
          <span className={cn("chip flex-shrink-0", sevConfig.className)}>
            {sevConfig.label}
          </span>
        </div>

        <h3 className="font-medium text-slate-800 leading-snug mb-2">
          {accident.title}
        </h3>

        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2 flex-wrap">
          <MapPin size={14} className="flex-shrink-0 text-red-500" />
          <span className="truncate">{accident.location.address}</span>
          {accident.affectedRange && (
            <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
              <MapPin size={10} />
              {accident.affectedRange}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDateTime(accident.timestamp, "HH:mm")}
            </span>
            <span className="flex items-center gap-1">
              <SourceIcon size={12} />
              {sourceConfig.label}
            </span>
          </div>
          <span>预计恢复 {formatDateTime(accident.expectedRecovery, "HH:mm")}</span>
        </div>

        <div className="mb-3">
          <ProgressSteps progress={accident.progress} />
        </div>

        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {!accident.read && (
            <button
              onClick={() => onMarkRead(accident.id)}
              className="flex-1 min-w-[80px] text-[11px] py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium border border-blue-100 flex items-center justify-center gap-1"
            >
              <Check size={12} />
              标记已读
            </button>
          )}
          <button
            onClick={() => onSubscribe(accident.id)}
            className={cn(
              "flex-1 min-w-[80px] text-[11px] py-1.5 rounded-lg font-medium border transition-colors flex items-center justify-center gap-1",
              accident.subscribed
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
            )}
          >
            {accident.subscribed ? <BellOff size={12} /> : <Bell size={12} />}
            {accident.subscribed ? "已订阅" : "订阅提醒"}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 min-w-[80px] text-[11px] py-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors font-medium border border-slate-200 flex items-center justify-center gap-1"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? "收起" : "详情"}
          </button>
          <button
            onClick={() => onTrack(accident.id)}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              accident.tracked
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {accident.tracked ? (
              <Star size={12} className="fill-amber-500 text-amber-500" />
            ) : (
              <StarOff size={12} />
            )}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 animate-slide-down space-y-3">
            <p className="text-sm text-slate-600 leading-relaxed">
              {accident.description}
            </p>

            <div className="bg-slate-50 rounded-xl p-3 space-y-2.5">
              <div className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Activity size={12} className="text-blue-500" />
                处置进度
              </div>
              <div className="relative h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${dispConfig.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>接警</span>
                <span>出警</span>
                <span>到场</span>
                <span>处置中</span>
                <span>已恢复</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
                <div className="text-slate-500 flex items-center gap-1 mb-1">
                  <Building2 size={10} />
                  处置单位
                </div>
                <p className="font-semibold text-slate-800">{accident.disposalUnit || "青岛市交警支队"}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-2.5 border border-emerald-100">
                <div className="text-slate-500 flex items-center gap-1 mb-1">
                  <User size={10} />
                  处置人员
                </div>
                <p className="font-semibold text-slate-800">{accident.disposalPersonnel || "李警官、王警官"}</p>
              </div>
            </div>

            {(accident.affectedRoads && accident.affectedRoads.length > 0) || (accident.affectedDistricts && accident.affectedDistricts.length > 0) ? (
              <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-100">
                <div className="text-xs text-slate-500 flex items-center gap-1 mb-1.5">
                  <AlertTriangle size={10} className="text-amber-500" />
                  影响范围
                </div>
                <div className="space-y-1.5">
                  {accident.affectedRoads && accident.affectedRoads.length > 0 && (
                    <div className="flex items-start gap-1.5">
                      <span className="text-[11px] text-slate-500 flex-shrink-0 mt-0.5">受影响道路：</span>
                      <div className="flex flex-wrap gap-1">
                        {accident.affectedRoads.map((r) => (
                          <span key={r} className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-700 border border-amber-200">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {accident.affectedDistricts && accident.affectedDistricts.length > 0 && (
                    <div className="flex items-start gap-1.5">
                      <span className="text-[11px] text-slate-500 flex-shrink-0 mt-0.5">影响区县：</span>
                      <div className="flex flex-wrap gap-1">
                        {accident.affectedDistricts.map((d) => (
                          <span key={d} className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-700 border border-amber-200">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-slate-50 rounded-lg p-2">
                <span className="text-slate-400">涉事车辆</span>
                <p className="font-medium text-slate-700 mt-0.5">
                  {accident.vehiclesInvolved || 0} 辆
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2">
                <span className="text-slate-400">人员伤亡</span>
                <p className="font-medium text-slate-700 mt-0.5">
                  {accident.casualties || 0} 人
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AccidentListView() {
  const { showToast } = useAppStore();
  const [accidents, setAccidents] = useState<(AccidentEvent & { tracked?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [district, setDistrict] = useState("全部区域");
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params: Record<string, string> = {};
        if (severity !== "all") params.severity = severity;
        if (district !== "全部区域") params.district = district;
        const data = await trafficApi.getAccidents(params);
        setAccidents(data.map((a) => ({ ...a, tracked: trackedIds.has(a.id) })));
      } catch (error) {
        console.error("Failed to fetch accidents:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [severity, district, trackedIds]);

  const handleTrack = (id: string) => {
    const newTracked = new Set(trackedIds);
    if (newTracked.has(id)) {
      newTracked.delete(id);
    } else {
      newTracked.add(id);
    }
    setTrackedIds(newTracked);
    setAccidents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, tracked: !a.tracked } : a))
    );
  };

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      await trafficApi.markAsRead(id);
      setAccidents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, read: true } : a))
      );
      showToast("已标记为已读", "success");
    } catch (e) {
      console.error(e);
    }
  }, [showToast]);

  const handleSubscribe = useCallback(async (id: string) => {
    try {
      const accident = accidents.find((a) => a.id === id);
      if (accident?.subscribed) {
        await trafficApi.unsubscribeEvent(id);
        setAccidents((prev) =>
          prev.map((a) => (a.id === id ? { ...a, subscribed: false } : a))
        );
        showToast("已取消订阅", "success");
      } else {
        const res = await trafficApi.subscribeEvent(id);
        setAccidents((prev) =>
          prev.map((a) => (a.id === id ? { ...a, subscribed: true } : a))
        );
        showToast(res.message || "订阅成功", "success");
      }
    } catch (e) {
      console.error(e);
    }
  }, [accidents, showToast]);

  const subscribedAccidents = accidents.filter((a) => a.subscribed);
  const trackedAccidents = accidents.filter((a) => a.tracked);
  const otherAccidents = accidents.filter((a) => !a.tracked);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-4 h-32 skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
            showFilters || severity !== "all" || district !== "全部区域"
              ? "bg-brand-100 text-brand-700"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          <Filter size={16} />
          筛选
        </button>
        <div className="flex-1 text-xs text-slate-400 text-right">
          来源：青岛市公安局交通警察支队
        </div>
      </div>

      {showFilters && (
        <div className="card p-4 space-y-3 animate-slide-down">
          <div>
            <div className="text-sm text-slate-600 mb-2">严重程度</div>
            <div className="flex flex-wrap gap-2">
              {SEVERITY_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSeverity(opt.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    severity === opt.key
                      ? "bg-brand-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600 mb-2">所属区域</div>
            <div className="flex flex-wrap gap-2">
              {DISTRICTS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDistrict(d)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    district === d
                      ? "bg-brand-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {subscribedAccidents.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} className="text-emerald-500 fill-emerald-100" />
            <span className="font-medium text-slate-700 text-sm">我的订阅</span>
            <span className="text-xs text-slate-400">({subscribedAccidents.length})</span>
          </div>
          <div className="space-y-3">
            {subscribedAccidents.map((accident) => (
              <AccidentCard
                key={accident.id}
                accident={accident}
                onTrack={handleTrack}
                onMarkRead={handleMarkRead}
                onSubscribe={handleSubscribe}
              />
            ))}
          </div>
        </div>
      )}

      {trackedAccidents.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-amber-500 fill-amber-500" />
            <span className="font-medium text-slate-700 text-sm">我的追踪</span>
            <span className="text-xs text-slate-400">({trackedAccidents.length})</span>
          </div>
          <div className="space-y-3">
            {trackedAccidents.map((accident) => (
              <AccidentCard
                key={accident.id}
                accident={accident}
                onTrack={handleTrack}
                onMarkRead={handleMarkRead}
                onSubscribe={handleSubscribe}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={16} className="text-slate-500" />
          <span className="font-medium text-slate-700 text-sm">全部事故</span>
          <span className="text-xs text-slate-400">({accidents.length})</span>
        </div>
        {otherAccidents.length === 0 && trackedAccidents.length === 0 && subscribedAccidents.length === 0 ? (
          <div className="card p-12 text-center text-slate-500">
            <AlertTriangle size={48} className="mx-auto mb-3 text-slate-300" />
            <p>暂无事故记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {otherAccidents.map((accident) => (
              <AccidentCard
                key={accident.id}
                accident={accident}
                onTrack={handleTrack}
                onMarkRead={handleMarkRead}
                onSubscribe={handleSubscribe}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetroDelayCard({
  delay,
  onMarkRead,
  onSubscribe,
}: {
  delay: MetroDelayEvent;
  onMarkRead: (id: string) => void;
  onSubscribe: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const reasonConfig = metroDelayReasonConfig[delay.reason as MetroDelayReason];
  const isRecovered = delay.status === "recovered";
  const disposalCfg = disposalStatusConfig[delay.disposalStatus] || disposalStatusConfig.processing;

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小时${mins > 0 ? mins + "分" : ""}`;
  };

  return (
    <div
      className={cn(
        "card overflow-hidden relative",
        isRecovered && "opacity-70"
      )}
    >
      {!delay.read && (
        <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse z-10 shadow-lg shadow-red-500/50" />
      )}
      <div className="flex">
        <div
          className="w-1.5 flex-shrink-0"
          style={{ backgroundColor: delay.lineColor }}
        />
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2 pr-6">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: delay.lineColor }}
              >
                {delay.lineName.replace("号线", "")}
              </div>
              <div>
                <h3 className="font-medium text-slate-800">{delay.lineName}</h3>
                <p className="text-xs text-slate-500">{delay.delayDirection}</p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <span className={`chip ${disposalCfg.bg} ${disposalCfg.color}`}>
                <Activity size={12} />
                {disposalCfg.label}
              </span>
              {isRecovered ? (
                <span className="chip bg-green-100 text-green-700">
                  <CheckCircle size={12} />
                  已恢复
                </span>
              ) : (
                <span className="chip bg-red-100 text-red-700">
                  <AlertTriangle size={12} />
                  延误中
                </span>
              )}
            </div>
          </div>

          {!isRecovered ? (
            <div className="bg-orange-50 rounded-xl p-3 mb-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-orange-600">已延误</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-orange-600 tabular-nums">
                      {delay.delayDuration}
                    </span>
                    <span className="text-sm text-orange-500">分钟</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-orange-600">预计恢复</span>
                  <div className="text-sm font-medium text-orange-700">
                    {formatDateTime(delay.expectedRecovery, "HH:mm")}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 rounded-xl p-3 mb-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-green-600">延误总时长</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-green-600 tabular-nums">
                      {formatDuration(delay.totalDelayMinutes || delay.delayDuration)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-green-600">恢复时间</span>
                  <div className="text-sm font-medium text-green-700">
                    {formatDateTime(delay.recoveredAt || delay.expectedRecovery, "HH:mm")}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 text-sm mb-3">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-slate-500">延误原因：</span>
                <span className="text-slate-700">{reasonConfig.label}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-slate-500">影响站点：</span>
                <span className="text-slate-700">
                  {delay.affectedStations?.slice(0, 3).join("、")}
                  {delay.affectedStations?.length > 3 && `等${delay.affectedStations.length}站`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">
                <Users size={11} />
                预计影响 {delay.affectedPassengers?.toLocaleString() || 0} 人
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs">
                <MapPin size={11} />
                {delay.affectedRange}
              </span>
            </div>
            {delay.measures && delay.measures.length > 0 && (
              <div className="flex items-start gap-2">
                <ShieldAlert size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex flex-wrap gap-1.5">
                  {delay.measures.map((m: MetroMeasure) => {
                    const mConfig = metroMeasureConfig[m];
                    const MIcon = mConfig.icon;
                    return (
                      <span
                        key={m}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs"
                      >
                        <MIcon size={10} />
                        {mConfig.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            {!delay.read && (
              <button
                onClick={() => onMarkRead(delay.id)}
                className="px-3 py-1.5 rounded-lg text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-1"
              >
                <Check size={12} />
                标记已读
              </button>
            )}
            <button
              onClick={() => onSubscribe(delay.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1",
                delay.subscribed
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {delay.subscribed ? <BellOff size={12} /> : <Bell size={12} />}
              {delay.subscribed ? "取消订阅" : "订阅提醒"}
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1"
            >
              <ChevronDown size={12} className={cn("transition-transform", expanded && "rotate-180")} />
              {expanded ? "收起详情" : "查看详情"}
            </button>
          </div>

          {expanded && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 space-y-4 animate-in fade-in">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={14} className="text-blue-600" />
                  <span className="font-medium text-sm text-slate-700">处置进度</span>
                </div>
                <div className="h-2.5 bg-white rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${disposalCfg.progress}%` }}
                  />
                </div>
                <div className="grid grid-cols-5 gap-1 text-[10px] text-center">
                  {["接警", "出警", "到场", "处置中", "已恢复"].map((label, i) => (
                    <div key={label} className={cn(
                      i * 25 <= disposalCfg.progress ? "text-blue-600 font-medium" : "text-slate-400"
                    )}>
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <Building2 size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[11px] text-slate-500">处置单位</div>
                    <div className="text-sm font-medium text-slate-700">{delay.disposalUnit || "青岛地铁运营中心"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[11px] text-slate-500">处置人员</div>
                    <div className="text-sm font-medium text-slate-700">{delay.disposalPersonnel || "张工程师、李值班长"}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-500 mb-1.5">受影响站点</div>
                <div className="flex flex-wrap gap-1">
                  {delay.affectedStations?.map((s: string) => (
                    <span key={s} className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 text-xs">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetroDelayView() {
  const { showToast } = useAppStore();
  const [delays, setDelays] = useState<MetroDelayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | MetroStatus>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = filter !== "all" ? { status: filter as string } : undefined;
        const data = await trafficApi.getMetroDelays(params);
        setDelays(data);
      } catch (error) {
        console.error("Failed to fetch metro delays:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filter]);

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      await trafficApi.markAsRead(id);
      setDelays((prev) =>
        prev.map((d) => (d.id === id ? { ...d, read: true } : d))
      );
      showToast("已标记为已读", "success");
    } catch (e) {
      console.error(e);
    }
  }, [showToast]);

  const handleSubscribe = useCallback(async (id: string) => {
    try {
      const d = delays.find((x) => x.id === id);
      if (d?.subscribed) {
        await trafficApi.unsubscribeEvent(id);
        setDelays((prev) =>
          prev.map((x) => (x.id === id ? { ...x, subscribed: false } : x))
        );
        showToast("已取消订阅", "success");
      } else {
        const res = await trafficApi.subscribeEvent(id);
        setDelays((prev) =>
          prev.map((x) => (x.id === id ? { ...x, subscribed: true } : x))
        );
        showToast(res.message || "订阅成功", "success");
      }
    } catch (e) {
      console.error(e);
    }
  }, [delays, showToast]);

  const subscribedDelays = delays.filter((d) => d.subscribed);
  const activeDelays = delays.filter((d) => d.status === "delayed");
  const recoveredDelays = delays.filter((d) => d.status === "recovered");
  const networkStatus = activeDelays.length === 0 ? "正常运行" : "部分延误";
  const networkStatusClass = activeDelays.length === 0 ? "text-green-600 bg-green-100" : "text-orange-600 bg-orange-100";

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-4 h-40 skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrainFront size={20} />
            <span className="font-medium">青岛地铁线网</span>
          </div>
          <span className={cn("chip", networkStatusClass)}>
            {networkStatus}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/10 rounded-xl py-2">
            <div className="text-2xl font-bold">{activeDelays.length}</div>
            <div className="text-xs text-slate-300">延误线路</div>
          </div>
          <div className="bg-white/10 rounded-xl py-2">
            <div className="text-2xl font-bold">{recoveredDelays.length}</div>
            <div className="text-xs text-slate-300">已恢复</div>
          </div>
          <div className="bg-white/10 rounded-xl py-2">
            <div className="text-2xl font-bold">7</div>
            <div className="text-xs text-slate-300">运营线路</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[
            { key: "all", label: "全部" },
            { key: "delayed", label: "延误中" },
            { key: "recovered", label: "已恢复" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key as any)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filter === opt.key
                  ? "bg-brand-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex-1 text-xs text-slate-400 text-right">
          来源：青岛地铁集团运营有限公司
        </div>
      </div>

      {delays.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          <CheckCircle size={48} className="mx-auto mb-3 text-green-400" />
          <p className="text-green-600 font-medium">所有线路运行正常</p>
          <p className="text-sm text-slate-400 mt-1">暂无延误信息</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subscribedDelays.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bell size={16} className="text-emerald-500 fill-emerald-100" />
                <span className="font-medium text-slate-700 text-sm">我的订阅</span>
                <span className="text-xs text-slate-400">({subscribedDelays.length})</span>
              </div>
              <div className="space-y-3">
                {subscribedDelays.map((delay) => (
                  <MetroDelayCard
                    key={delay.id}
                    delay={delay}
                    onMarkRead={handleMarkRead}
                    onSubscribe={handleSubscribe}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={16} className="text-slate-500" />
              <span className="font-medium text-slate-700 text-sm">全部延误</span>
              <span className="text-xs text-slate-400">({delays.length})</span>
            </div>
            <div className="space-y-3">
              {delays.map((delay) => (
                <MetroDelayCard
                  key={delay.id}
                  delay={delay}
                  onMarkRead={handleMarkRead}
                  onSubscribe={handleSubscribe}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CrowdIcon({ level, size = 16 }: { level: BusCrowdLevel; size?: number }) {
  const config = crowdLevelConfig[level];
  return (
    <div className={cn("inline-flex items-center justify-center rounded", config.bg, "p-0.5")}>
      <Users size={size} className={config.color} />
    </div>
  );
}

function BusPositionBar({ prediction }: { prediction: BusPrediction }) {
  const progress = (prediction.currentStationIndex / prediction.totalStations) * 100;

  return (
    <div className="relative">
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div
        className="absolute -top-1 transition-all duration-500"
        style={{ left: `calc(${progress}% - 6px)` }}
      >
        <div className="w-4 h-4 bg-white rounded-full shadow border-2 border-brand-500 flex items-center justify-center">
          <Bus size={10} className="text-brand-500" />
        </div>
      </div>
    </div>
  );
}

function BusPredictionCard({
  prediction,
  onToggleFavorite,
}: {
  prediction: BusPrediction;
  onToggleFavorite: (routeId: string) => void;
}) {
  const [tick, setTick] = useState(0);
  const statusConfig = busStatusConfig[prediction.status];

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const getAdjustedMinutes = (baseMinutes: number) => {
    return Math.max(0, baseMinutes - Math.floor((tick % 60) / 60));
  };

  const routeColors = [
    "from-blue-500 to-blue-600",
    "from-green-500 to-green-600",
    "from-purple-500 to-purple-600",
    "from-pink-500 to-pink-600",
  ];
  const colorIdx = parseInt(prediction.routeId) % routeColors.length;

  const nextBuses = prediction.predictions.slice(0, 3);

  return (
    <div className="card overflow-hidden">
      <div className="flex">
        <div
          className={cn(
            "w-20 flex flex-col items-center justify-center py-5 text-white bg-gradient-to-br",
            routeColors[colorIdx]
          )}
        >
          <span className="text-2xl font-bold">
            {prediction.routeName.replace("路", "")}
          </span>
          <span className="text-xs opacity-80 mt-0.5">路</span>
          <span className={cn("chip mt-2 text-[10px] px-1.5 py-0.5", statusConfig.className)}>
            {statusConfig.label}
          </span>
        </div>
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-slate-400" />
              <span className="font-medium text-slate-800 text-sm">
                {prediction.stopName}
              </span>
            </div>
            <button
              onClick={() => onToggleFavorite(prediction.routeId)}
              className="p-1 -mr-1 -mt-1"
            >
              {prediction.isFavorite ? (
                <Star size={18} className="text-amber-500 fill-amber-500" />
              ) : (
                <StarOff size={18} className="text-slate-300" />
              )}
            </button>
          </div>

          {nextBuses.length > 0 && (
            <div className="space-y-2 mb-3">
              {nextBuses.map((bus, idx) => {
                const minutes = getAdjustedMinutes(bus.minutes);
                const isNext = idx === 0;
                const crowdConfig = crowdLevelConfig[bus.crowdLevel];
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center justify-between py-1.5 px-2 rounded-lg",
                      isNext ? "bg-brand-50" : "bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          isNext ? "text-brand-600" : "text-slate-500"
                        )}
                      >
                        {isNext ? "下一班" : `第${idx + 1}班`}
                      </span>
                      <span className="text-xs text-slate-400">
                        {bus.currentStation}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CrowdIcon level={bus.crowdLevel} size={12} />
                      <div className="text-right">
                        <span
                          className={cn(
                            "font-bold tabular-nums",
                            isNext ? "text-brand-600 text-lg" : "text-slate-600 text-sm"
                          )}
                        >
                          {minutes}
                        </span>
                        <span
                          className={cn(
                            "ml-0.5",
                            isNext ? "text-brand-500 text-xs" : "text-slate-400 text-xs"
                          )}
                        >
                          分钟
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>实时位置</span>
              <span>{prediction.stations[prediction.currentStationIndex] || "--"}</span>
            </div>
            <BusPositionBar prediction={prediction} />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>{prediction.stations[0]}</span>
              <span>{prediction.stations[prediction.stations.length - 1]}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BusPredictionView() {
  const [predictions, setPredictions] = useState<BusPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await trafficApi.getBusPredictions();
        setPredictions(data);
      } catch (error) {
        console.error("Failed to fetch bus predictions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const results = await trafficApi.searchBusRoutes(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleToggleFavorite = (routeId: string) => {
    setPredictions((prev) =>
      prev.map((p) =>
        p.routeId === routeId ? { ...p, isFavorite: !p.isFavorite } : p
      )
    );
  };

  const handleAddRoute = (route: any) => {
    const newPrediction: BusPrediction = {
      routeId: route.routeId,
      routeName: route.routeName,
      stopName: "市政府站",
      status: "normal",
      crowdLevel: "moderate",
      currentStationIndex: 3,
      totalStations: 12,
      stations: [],
      predictions: [
        { plateNumber: "鲁B·T00000", minutes: 5, distance: "1.5公里", crowdLevel: "moderate", currentStation: "浮山所站" },
        { plateNumber: "鲁B·T11111", minutes: 12, distance: "3.5公里", crowdLevel: "empty", currentStation: "辛家庄站" },
      ],
      isFavorite: true,
    };
    setPredictions((prev) => [newPrediction, ...prev]);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const favoriteRoutes = predictions.filter((p) => p.isFavorite);
  const otherRoutes = predictions.filter((p) => !p.isFavorite);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-4 h-36 skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors flex-1",
            showSearch ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600"
          )}
        >
          <Search size={16} />
          搜索添加线路
        </button>
      </div>

      {showSearch && (
        <div className="card p-3 animate-slide-down">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="输入线路号或站点名称"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              autoFocus
            />
          </div>
          {searchLoading && (
            <div className="py-4 text-center text-sm text-slate-400">搜索中...</div>
          )}
          {!searchLoading && searchResults.length > 0 && (
            <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map((route) => (
                <div
                  key={route.routeId}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50"
                >
                  <div>
                    <div className="font-medium text-slate-800 text-sm">
                      {route.routeName}
                    </div>
                    <div className="text-xs text-slate-400">
                      {route.firstStop} → {route.lastStop}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddRoute(route)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-brand-500 text-white font-medium"
                  >
                    添加
                  </button>
                </div>
              ))}
            </div>
          )}
          {!searchLoading && searchQuery && searchResults.length === 0 && (
            <div className="py-4 text-center text-sm text-slate-400">未找到相关线路</div>
          )}
        </div>
      )}

      <div className="text-xs text-slate-400 text-right">
        来源：青岛市交通运输局·青岛公交集团
      </div>

      {favoriteRoutes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-amber-500 fill-amber-500" />
            <span className="font-medium text-slate-700 text-sm">我的收藏</span>
            <span className="text-xs text-slate-400">({favoriteRoutes.length})</span>
          </div>
          <div className="space-y-3">
            {favoriteRoutes.map((pred) => (
              <BusPredictionCard
                key={pred.routeId}
                prediction={pred}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        </div>
      )}

      {otherRoutes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bus size={16} className="text-slate-500" />
            <span className="font-medium text-slate-700 text-sm">其他线路</span>
            <span className="text-xs text-slate-400">({otherRoutes.length})</span>
          </div>
          <div className="space-y-3">
            {otherRoutes.map((pred) => (
              <BusPredictionCard
                key={pred.routeId}
                prediction={pred}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        </div>
      )}

      {predictions.length === 0 && (
        <div className="card p-12 text-center text-slate-500">
          <Bus size={48} className="mx-auto mb-3 text-slate-300" />
          <p>暂无收藏的公交线路</p>
          <p className="text-sm text-slate-400 mt-1">点击上方搜索添加线路</p>
        </div>
      )}
    </div>
  );
}

function MapView() {
  const [events, setEvents] = useState<TrafficEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState<MapLayer>("events");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await trafficApi.getEvents();
        setEvents(data);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const markerColors: Record<TrafficEventType, string> = {
    accident: "#ef4444",
    metro_delay: "#f97316",
    bus_abnormal: "#eab308",
    road_condition: "#3b82f6",
  };

  const congestionPoints = useMemo(
    () => [
      { lat: 36.0681, lng: 120.3883, radius: 300, color: "#ef4444" },
      { lat: 36.0705, lng: 120.3836, radius: 250, color: "#f97316" },
      { lat: 36.1744, lng: 120.4192, radius: 400, color: "#ef4444" },
      { lat: 36.1025, lng: 120.4048, radius: 200, color: "#fbbf24" },
      { lat: 36.0825, lng: 120.3856, radius: 280, color: "#f97316" },
      { lat: 36.0487, lng: 120.2747, radius: 500, color: "#ef4444" },
    ],
    []
  );

  const busPositions = useMemo(
    () => [
      { lat: 36.0665, lng: 120.3867, route: "316路" },
      { lat: 36.0712, lng: 120.3901, route: "501路" },
      { lat: 36.0623, lng: 120.3789, route: "26路" },
      { lat: 36.0956, lng: 120.3923, route: "232路" },
      { lat: 36.0587, lng: 120.3734, route: "316路" },
    ],
    []
  );

  const layers: { key: MapLayer; label: string; icon: typeof AlertTriangle }[] = [
    { key: "events", label: "事件点", icon: AlertTriangle },
    { key: "congestion", label: "拥堵热力", icon: MapIcon },
    { key: "bus_live", label: "公交位置", icon: Bus },
  ];

  if (loading) {
    return <div className="card h-96 skeleton" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
        {layers.map((layer) => {
          const Icon = layer.icon;
          const isActive = activeLayer === layer.key;
          return (
            <button
              key={layer.key}
              onClick={() => setActiveLayer(layer.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                isActive
                  ? "bg-white text-brand-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Icon size={14} />
              {layer.label}
            </button>
          );
        })}
      </div>

      <div className="card overflow-hidden p-0">
        <MapContainer
          center={QINGDAO_CENTER}
          zoom={12}
          style={{ height: "500px", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {(activeLayer === "events" || activeLayer === "congestion") &&
            events.map((event) => {
              const typeConfig = eventTypeConfig[event.type];
              const sevConfig = severityConfig[event.severity];
              const Icon = typeConfig.icon;
              const color = markerColors[event.type];
              return (
                <Marker
                  key={event.id}
                  position={[event.location.lat, event.location.lng]}
                  icon={createMarkerIcon(color, 14)}
                >
                  <Popup>
                    <div className="p-1 min-w-56">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            typeConfig.bg
                          )}
                        >
                          <Icon size={16} className={typeConfig.color} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-slate-800">
                            {event.title}
                          </div>
                        </div>
                        <span className={cn("chip", sevConfig.className)}>
                          {sevConfig.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mb-1">
                        📍 {event.location.address}
                      </div>
                      <div className="text-xs text-slate-400">
                        ⏰ {formatDateTime(event.timestamp, "MM-DD HH:mm")}
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                        {event.description}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {activeLayer === "congestion" &&
            congestionPoints.map((point, idx) => (
              <Circle
                key={idx}
                center={[point.lat, point.lng]}
                radius={point.radius}
                pathOptions={{
                  color: point.color,
                  fillColor: point.color,
                  fillOpacity: 0.25,
                  weight: 1,
                  opacity: 0.5,
                }}
              />
            ))}

          {activeLayer === "bus_live" &&
            busPositions.map((bus, idx) => (
              <Marker
                key={idx}
                position={[bus.lat, bus.lng]}
                icon={createMarkerIcon("#10b981", 12)}
              >
                <Popup>
                  <div className="text-sm font-medium text-slate-800">
                    {bus.route}
                  </div>
                  <div className="text-xs text-slate-500">实时位置</div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      <div className="card p-3">
        <div className="text-xs text-slate-500 mb-2">图例</div>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-slate-600">交通事故</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-slate-600">地铁延误</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-slate-600">公交异常</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-slate-600">路况信息</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-slate-600">公交位置</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrafficPage() {
  const [activeTab, setActiveTab] = useState("accident");
  const [overview, setOverview] = useState<TrafficOverview | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const data = await trafficApi.getOverview();
        setOverview(data);
      } catch (error) {
        console.error("Failed to fetch overview:", error);
      }
    };
    fetchOverview();
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <AppLayout>
      <div className="p-4 pb-6">
        <div className="mb-4">
          <h1 className="text-lg font-bold text-slate-800 mb-3">交通出行</h1>
          <TrafficOverviewCard overview={overview} onTabChange={handleTabChange} />
        </div>

        <div className="mb-4">
          <TabBar tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />
        </div>

        <div className="animate-fade-in">
          {activeTab === "accident" && <AccidentListView />}
          {activeTab === "metro" && <MetroDelayView />}
          {activeTab === "bus" && <BusPredictionView />}
          {activeTab === "map" && <MapView />}
        </div>
      </div>
    </AppLayout>
  );
}
