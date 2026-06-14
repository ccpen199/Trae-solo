import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  AlertTriangle,
  TrainFront,
  Bus,
  Route,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import TabBar from "@/components/TabBar";
import { trafficApi } from "@/api";
import type { TrafficEvent, BusPrediction, Severity, TrafficEventType } from "../../shared/types";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/utils/format";

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
    icon: Route,
  },
};

const severityConfig: Record<Severity, { label: string; className: string }> = {
  info: {
    label: "提示",
    className: "bg-blue-100 text-blue-700",
  },
  warning: {
    label: "警告",
    className: "bg-yellow-100 text-yellow-700",
  },
  danger: {
    label: "危险",
    className: "bg-red-100 text-red-700",
  },
};

const TABS = [
  { key: "timeline", label: "事件时间线", icon: <Clock size={16} /> },
  { key: "bus", label: "公交预测", icon: <Bus size={16} /> },
  { key: "map", label: "路况地图", icon: <MapPin size={16} /> },
];

const QINGDAO_CENTER: [number, number] = [36.0671, 120.3826];

function createMarkerIcon(color: string) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="width: 12px; height: 12px; background: ${color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

function TimelineView() {
  const [events, setEvents] = useState<TrafficEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
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

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-4 h-24 skeleton" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="card p-12 text-center text-slate-500">
        暂无交通事件
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200 ml-3" />
      <div className="space-y-4">
        {events.map((event) => {
          const typeConfig = eventTypeConfig[event.type];
          const sevConfig = severityConfig[event.severity];
          const Icon = typeConfig.icon;
          const isExpanded = expandedId === event.id;
          const markerColors: Record<TrafficEventType, string> = {
            accident: "#ef4444",
            metro_delay: "#f97316",
            bus_abnormal: "#eab308",
            road_condition: "#3b82f6",
          };

          return (
            <div
              key={event.id}
              className={cn(
                "card pl-0 overflow-hidden border-l-4",
                typeConfig.border,
                "cursor-pointer transition-all duration-300"
              )}
              onClick={() => setExpandedId(isExpanded ? null : event.id)}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      typeConfig.bg
                    )}
                  >
                    <Icon size={20} className={typeConfig.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-slate-800 leading-snug">
                        {event.title}
                      </h3>
                      <span className={cn("chip flex-shrink-0", sevConfig.className)}>
                        {sevConfig.label}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                      <MapPin size={14} className="flex-shrink-0" />
                      <span className="truncate">{event.location.address}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className={cn("text-xs font-medium", typeConfig.color)}>
                        {typeConfig.label}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={12} />
                        <span>{formatDateTime(event.timestamp, "MM-DD HH:mm")}</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-600 leading-relaxed animate-slide-down">
                        {event.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BusView() {
  const [predictions, setPredictions] = useState<BusPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
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
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getAdjustedMinutes = (baseMinutes: number) => {
    return Math.max(0, baseMinutes - (tick % 60));
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-4 h-32 skeleton" />
        ))}
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="card p-12 text-center text-slate-500">
        暂无收藏的公交线路
      </div>
    );
  }

  const routeColors = [
    "from-blue-500 to-blue-600",
    "from-green-500 to-green-600",
    "from-purple-500 to-purple-600",
    "from-pink-500 to-pink-600",
  ];

  return (
    <div className="space-y-4">
      {predictions.map((pred, idx) => {
        const nextBus = pred.predictions[0];
        const nextMinutes = nextBus ? getAdjustedMinutes(nextBus.minutes) : 0;

        return (
          <div key={pred.routeId} className="card overflow-hidden">
            <div className="flex">
              <div
                className={cn(
                  "w-20 flex flex-col items-center justify-center py-5 text-white bg-gradient-to-br",
                  routeColors[idx % routeColors.length]
                )}
              >
                <span className="text-2xl font-bold">{pred.routeName.replace("路", "")}</span>
                <span className="text-xs opacity-80 mt-0.5">路</span>
              </div>
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Bus size={16} className="text-slate-400" />
                      <span className="font-medium text-slate-800">{pred.stopName}</span>
                    </div>
                    {nextBus && (
                      <div className="mt-1 text-xs text-slate-500">
                        车牌 {nextBus.plateNumber} · 距离 {nextBus.distance}
                      </div>
                    )}
                  </div>
                  {nextBus && (
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-brand-600 tabular-nums">
                          {nextMinutes}
                        </span>
                        <span className="text-sm text-slate-500">分钟</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">下一班</div>
                    </div>
                  )}
                </div>
                {pred.predictions.length > 1 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-400 mb-2">后续班次</div>
                    <div className="flex gap-2 flex-wrap">
                      {pred.predictions.slice(1).map((p, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 text-xs"
                        >
                          <span className="font-medium text-slate-700 tabular-nums">
                            {getAdjustedMinutes(p.minutes)}
                          </span>
                          <span className="text-slate-400">分钟</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MapView() {
  const [events, setEvents] = useState<TrafficEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
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

  if (loading) {
    return <div className="card h-96 skeleton" />;
  }

  return (
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
        {events.map((event) => {
          const typeConfig = eventTypeConfig[event.type];
          const sevConfig = severityConfig[event.severity];
          const Icon = typeConfig.icon;
          return (
            <Marker
              key={event.id}
              position={[event.location.lat, event.location.lng]}
              icon={createMarkerIcon(markerColors[event.type])}
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
      </MapContainer>
    </div>
  );
}

export default function TrafficPage() {
  const [activeTab, setActiveTab] = useState("timeline");

  return (
    <AppLayout title="交通出行">
      <div className="mb-4">
        <TabBar tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />
      </div>
      <div className="animate-fade-in">
        {activeTab === "timeline" && <TimelineView />}
        {activeTab === "bus" && <BusView />}
        {activeTab === "map" && <MapView />}
      </div>
    </AppLayout>
  );
}
