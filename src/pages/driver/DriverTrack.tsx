import { useState } from "react";
import ReactECharts from "echarts-for-react";
import {
  MapPin,
  ArrowLeft,
  Navigation,
  ChevronRight,
  Gauge,
  Fuel,
  AlertTriangle,
  Clock,
  Car,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  Search,
  FileText,
  Activity,
  Route,
  ThermometerSun,
  TrendingUp,
  Truck,
  Info,
} from "lucide-react";
import { Tabs, Toast, Badge } from "antd-mobile";
import { useNavigate } from "react-router-dom";

interface Trip {
  id: string;
  date: string;
  dateLabel: string;
  route: string;
  fromCity: string;
  toCity: string;
  fromAddress: string;
  toAddress: string;
  distance: number;
  fuelConsumption: number;
  fuelCost: number;
  duration: string;
  avgSpeed: number;
  maxSpeed: number;
  status: "normal" | "warning" | "error";
  orderNo: string;
  startTime: string;
  endTime: string;
  alerts: AlertItem[];
}

interface AlertItem {
  id: string;
  type: "stop" | "deviation" | "speed" | "other";
  title: string;
  desc: string;
  time: string;
  duration?: string;
  status: "pending" | "processing" | "resolved";
  level: "normal" | "warning" | "danger";
}

const trips: Trip[] = [
  {
    id: "TR001",
    date: "2024-06-20",
    dateLabel: "今天",
    route: "上海 → 杭州",
    fromCity: "上海",
    toCity: "杭州",
    fromAddress: "上海市浦东新区张江高科技园区",
    toAddress: "杭州市余杭区未来科技城",
    distance: 186,
    fuelConsumption: 28.5,
    fuelCost: 196.65,
    duration: "2小时35分",
    avgSpeed: 72,
    maxSpeed: 98,
    status: "warning",
    orderNo: "OD20240620001",
    startTime: "09:25",
    endTime: "进行中",
    alerts: [
      {
        id: "A001",
        type: "deviation",
        title: "线路偏离",
        desc: "偏离规划线路2.5公里，已自动回归",
        time: "11:42",
        status: "resolved",
        level: "warning",
      },
    ],
  },
  {
    id: "TR002",
    date: "2024-06-19",
    dateLabel: "昨天",
    route: "无锡 → 合肥",
    fromCity: "无锡",
    toCity: "合肥",
    fromAddress: "无锡市滨湖区高浪东路999号",
    toAddress: "合肥市蜀山区井岗镇长江西路2221号",
    distance: 342,
    fuelConsumption: 54.8,
    fuelCost: 380.86,
    duration: "4小时18分",
    avgSpeed: 80,
    maxSpeed: 105,
    status: "error",
    orderNo: "OD20240619015",
    startTime: "07:15",
    endTime: "11:33",
    alerts: [
      {
        id: "A002",
        type: "stop",
        title: "停留超时",
        desc: "在G50沪渝高速广德服务区停留48分钟",
        time: "09:20",
        duration: "48分钟",
        status: "pending",
        level: "danger",
      },
      {
        id: "A003",
        type: "speed",
        title: "超速行驶",
        desc: "在宣广段超速行驶，最高105km/h",
        time: "10:35",
        status: "processing",
        level: "warning",
      },
    ],
  },
  {
    id: "TR003",
    date: "2024-06-19",
    dateLabel: "昨天",
    route: "南京 → 徐州",
    fromCity: "南京",
    toCity: "徐州",
    fromAddress: "南京市江北新区浦珠中路208号",
    toAddress: "徐州市云龙区和平大道118号",
    distance: 345,
    fuelConsumption: 51.2,
    fuelCost: 351.68,
    duration: "4小时02分",
    avgSpeed: 85,
    maxSpeed: 102,
    status: "normal",
    orderNo: "OD20240619008",
    startTime: "06:45",
    endTime: "10:47",
    alerts: [],
  },
  {
    id: "TR004",
    date: "2024-06-18",
    dateLabel: "前天",
    route: "常州 → 上海",
    fromCity: "常州",
    toCity: "上海",
    fromAddress: "常州市新北区通江中路508号",
    toAddress: "上海市松江区九亭镇沪松公路1288号",
    distance: 178,
    fuelConsumption: 26.8,
    fuelCost: 183.56,
    duration: "2小时22分",
    avgSpeed: 75,
    maxSpeed: 96,
    status: "warning",
    orderNo: "OD20240618022",
    startTime: "14:20",
    endTime: "16:42",
    alerts: [
      {
        id: "A004",
        type: "deviation",
        title: "线路偏离",
        desc: "在苏州段偏离路线，已纠正",
        time: "15:10",
        status: "resolved",
        level: "normal",
      },
    ],
  },
  {
    id: "TR005",
    date: "2024-06-18",
    dateLabel: "前天",
    route: "苏州 → 无锡",
    fromCity: "苏州",
    toCity: "无锡",
    fromAddress: "苏州市工业园区星湖街328号",
    toAddress: "无锡市新吴区长江南路188号",
    distance: 52,
    fuelConsumption: 7.8,
    fuelCost: 53.82,
    duration: "58分钟",
    avgSpeed: 54,
    maxSpeed: 82,
    status: "normal",
    orderNo: "OD20240618011",
    startTime: "09:00",
    endTime: "09:58",
    alerts: [],
  },
];

const alertTypeConfig = {
  stop: { label: "停留超时", color: "text-red-600", bg: "bg-red-50", icon: Clock },
  deviation: { label: "线路偏离", color: "text-orange-600", bg: "bg-orange-50", icon: Navigation },
  speed: { label: "超速行驶", color: "text-yellow-600", bg: "bg-yellow-50", icon: Gauge },
  other: { label: "其他", color: "text-gray-600", bg: "bg-gray-50", icon: AlertCircle },
};

const statusConfig = {
  normal: { label: "正常", color: "text-green-600", bg: "bg-green-50", dot: "bg-green-500" },
  warning: { label: "预警", color: "text-yellow-600", bg: "bg-yellow-50", dot: "bg-yellow-500" },
  error: { label: "异常", color: "text-red-600", bg: "bg-red-50", dot: "bg-red-500" },
};

export default function DriverTrack() {
  const navigate = useNavigate();
  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0].id);
  const [activeTab, setActiveTab] = useState("all");

  const selectedTrip = trips.find((t) => t.id === selectedTripId) || trips[0];

  const totalTrips = trips.length;
  const totalDistance = trips.reduce((sum, t) => sum + t.distance, 0);
  const totalAlerts = trips.reduce((sum, t) => sum + t.alerts.length, 0);
  const pendingAlerts = trips.reduce(
    (sum, t) => sum + t.alerts.filter((a) => a.status === "pending" || a.status === "processing").length,
    0
  );
  const resolvedAlerts = totalAlerts - pendingAlerts;

  const speedChartOption = {
    grid: { top: 40, right: 20, bottom: 30, left: 40 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(0,0,0,0.8)",
      borderWidth: 0,
      textStyle: { color: "#fff", fontSize: 12 },
      formatter: (params: any) => {
        const data = params[0];
        return `${data.axisValue}<br/>速度: <b>${data.value}</b> km/h`;
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: ["09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00"],
      axisLine: { lineStyle: { color: "#eee" } },
      axisLabel: { color: "#999", fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      max: 120,
      name: "km/h",
      nameTextStyle: { color: "#999", fontSize: 10 },
      axisLine: { show: false },
      axisLabel: { color: "#999", fontSize: 10 },
      splitLine: { lineStyle: { color: "#f5f5f5", type: "dashed" } },
    },
    series: [
      {
        data: [
          0, 65, 85, 78,
          { value: 40, itemStyle: { color: "#F59E0B" } },
          72, 92, 88,
        ],
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: {
            type: "linear",
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: "#FF6B1A" },
              { offset: 1, color: "#FFB347" },
            ],
          },
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(255,107,26,0.25)" },
              { offset: 1, color: "rgba(255,107,26,0)" },
            ],
          },
        },
        markLine: {
          silent: true,
          lineStyle: { color: "#EF4444", type: "dashed" },
          data: [{ yAxis: 100, label: { formatter: "限速 100", color: "#EF4444", fontSize: 10 } }],
        },
      },
    ],
  };

  return (
    <div className="min-h-screen pb-6">
      <div className="gradient-primary pt-12 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
            >
              <ArrowLeft size={22} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">行程轨迹</h1>
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <Search size={20} className="text-white" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card rounded-2xl p-3 text-center">
              <div className="w-9 h-9 mx-auto mb-2 rounded-full bg-blue-50 flex items-center justify-center">
                <Car size={18} className="text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800">{totalTrips}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">本月行程</div>
            </div>
            <div className="glass-card rounded-2xl p-3 text-center">
              <div className="w-9 h-9 mx-auto mb-2 rounded-full bg-green-50 flex items-center justify-center">
                <Route size={18} className="text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800">{totalDistance}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">累计里程km</div>
            </div>
            <div className="glass-card rounded-2xl p-3 text-center">
              <div className="w-9 h-9 mx-auto mb-2 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div className="text-2xl font-bold text-gray-800">{pendingAlerts}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">待处理告警</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-14 relative z-20 space-y-4">
        <div className="glass-card rounded-2xl p-4 shadow-card">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-primary-500" />
            异常告警统计
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-gradient-to-b from-gray-50 to-white border border-gray-100">
              <div className="flex items-center justify-center gap-1 mb-1">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <span className="text-[11px] text-gray-500">总数</span>
              </div>
              <div className="text-xl font-bold text-gray-800">{totalAlerts}</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-gradient-to-b from-yellow-50 to-white border border-yellow-100">
              <div className="flex items-center justify-center gap-1 mb-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-[11px] text-yellow-600">处理中</span>
              </div>
              <div className="text-xl font-bold text-yellow-600">{pendingAlerts}</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-gradient-to-b from-green-50 to-white border border-green-100">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle2 size={12} className="text-green-500" />
                <span className="text-[11px] text-green-600">已处理</span>
              </div>
              <div className="text-xl font-bold text-green-600">{resolvedAlerts}</div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Route size={18} className="text-primary-500" />
              行程详情
            </h3>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar size={12} />
              {selectedTrip.date}
            </div>
          </div>

          <div className="mb-5">
            <div className="text-center mb-3">
              <div className="text-xs text-gray-500 mb-1">{selectedTrip.orderNo}</div>
              <div className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
                <span>{selectedTrip.fromCity}</span>
                <div className="flex items-center">
                  <div className="w-8 h-0.5 bg-gray-200" />
                  <ArrowLeft size={14} className="text-primary-500 rotate-180 -ml-1" />
                  <div className="w-8 h-0.5 bg-gray-200" />
                </div>
                <span>{selectedTrip.toCity}</span>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden h-40 map-bg">
              <div className="absolute inset-0 chart-grid opacity-60" />
              <div className="absolute left-[10%] top-[70%]">
                <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                <div className="mt-1 text-[10px] text-gray-600 -translate-x-1/4">起点</div>
              </div>
              <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                <path
                  d="M 12% 70% C 30% 30%, 50% 80%, 70% 45% S 88% 30%, 88% 25%"
                  stroke="#FF6B1A"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="6 4"
                />
              </svg>
              {selectedTrip.alerts.map((alert, idx) => {
                const posX = 30 + idx * 25;
                const posY = alert.type === "stop" ? 55 : alert.type === "speed" ? 35 : 45;
                return (
                  <div
                    key={alert.id}
                    className="absolute z-20"
                    style={{ left: `${posX}%`, top: `${posY}%` }}
                  >
                    <div className="relative">
                      <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow-lg flex items-center justify-center animate-pulse">
                        <AlertTriangle size={12} className="text-white fill-current" />
                      </div>
                      <div className="absolute -inset-2 rounded-full bg-red-500/30 animate-ping" />
                    </div>
                  </div>
                );
              })}
              <div className="absolute right-[10%] top-[22%]">
                <div className="w-3 h-3 rounded-full bg-primary-500 border-2 border-white shadow-sm" />
                <div className="mt-1 text-[10px] text-gray-600 -translate-x-1/2">终点</div>
              </div>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] text-white flex items-center gap-1">
                <Navigation size={12} />
                总里程 {selectedTrip.distance}km · {selectedTrip.duration}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-5">
            <div className="text-center p-2 rounded-lg bg-gray-50">
              <Navigation size={16} className="mx-auto text-primary-500 mb-1" />
              <div className="text-sm font-bold text-gray-800">{selectedTrip.distance}</div>
              <div className="text-[10px] text-gray-500">里程km</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-gray-50">
              <Fuel size={16} className="mx-auto text-blue-500 mb-1" />
              <div className="text-sm font-bold text-gray-800">{selectedTrip.fuelConsumption}L</div>
              <div className="text-[10px] text-gray-500">油耗</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-gray-50">
              <Gauge size={16} className="mx-auto text-green-500 mb-1" />
              <div className="text-sm font-bold text-gray-800">{selectedTrip.avgSpeed}</div>
              <div className="text-[10px] text-gray-500">平均km/h</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-gray-50">
              <Clock size={16} className="mx-auto text-purple-500 mb-1" />
              <div className="text-sm font-bold text-gray-800">{selectedTrip.duration.split("小")[0]}</div>
              <div className="text-[10px] text-gray-500">用时小时</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                <Activity size={16} className="text-primary-500" />
                速度曲线
              </h4>
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  异常点
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-red-400 border-dashed" />
                  限速
                </span>
              </div>
            </div>
            <div className="h-52 -mx-2">
              <ReactECharts option={speedChartOption} style={{ height: "100%", width: "100%" }} />
            </div>
          </div>

          {selectedTrip.alerts.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5 mb-3">
                <AlertTriangle size={16} className="text-red-500" />
                异常告警 ({selectedTrip.alerts.length})
              </h4>
              <div className="space-y-3">
                {selectedTrip.alerts.map((alert) => {
                  const config = alertTypeConfig[alert.type];
                  const AlertIcon = config.icon;
                  return (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-xl border ${config.bg} border-transparent`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg bg-white/80 flex items-center justify-center flex-shrink-0 ${config.color}`}>
                          <AlertIcon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-semibold text-sm ${config.color}`}>
                              {alert.title}
                            </span>
                            <span className="text-[10px] text-gray-500">{alert.time}</span>
                          </div>
                          <div className="text-xs text-gray-600 mb-1.5">{alert.desc}</div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {alert.duration && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-gray-600">
                                  持续 {alert.duration}
                                </span>
                              )}
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                alert.status === "resolved"
                                  ? "bg-green-100 text-green-700"
                                  : alert.status === "processing"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}>
                                {alert.status === "resolved" ? "已处理" : alert.status === "processing" ? "处理中" : "待处理"}
                              </span>
                            </div>
                            <button className="text-[10px] text-primary-500 font-medium flex items-center gap-0.5">
                              详情
                              <ChevronRight size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl shadow-card overflow-hidden">
          <div className="p-4 pb-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Car size={18} className="text-primary-500" />
                历史行程
              </h3>
              <button className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar size={12} />
                近7天
                <ChevronRight size={12} />
              </button>
            </div>
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key)}
              className="!px-0"
            >
              <Tabs.Tab key="all" title={`全部(${totalTrips})`} />
              <Tabs.Tab key="normal" title="正常" />
              <Tabs.Tab key="warning" title="预警" />
              <Tabs.Tab key="error" title="异常" />
            </Tabs>
          </div>

          <div className="p-4 pt-2 space-y-3">
            {(() => {
              let filtered = trips;
              if (activeTab !== "all") filtered = trips.filter((t) => t.status === activeTab);
              return filtered.map((trip, idx) => {
                const status = statusConfig[trip.status];
                const isSelected = trip.id === selectedTripId;
                return (
                  <button
                    key={trip.id}
                    onClick={() => setSelectedTripId(trip.id)}
                    className={`w-full text-left glass-card rounded-xl p-4 transition-all duration-300 ${
                      isSelected
                        ? "ring-2 ring-primary-400 shadow-card-hover"
                        : "shadow-sm hover:shadow-md"
                    } animate-slide-up`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700">{trip.dateLabel}</span>
                        <span className="text-[10px] text-gray-400">{trip.date.slice(5)}</span>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${status.bg}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${status.dot} ${trip.status === "warning" ? "animate-pulse" : ""}`} />
                        <span className={`text-[10px] font-medium ${status.color}`}>{status.label}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-800 text-sm">{trip.route}</div>
                      <div className="text-sm font-bold gradient-money">{trip.distance}km</div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-0.5">
                          <Fuel size={11} className="text-blue-400" />
                          {trip.fuelConsumption}L
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock size={11} className="text-purple-400" />
                          {trip.duration}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {trip.alerts.length > 0 && (
                          <Badge content={trip.alerts.length} className="!bg-red-500" />
                        )}
                        <ChevronRight size={14} className="text-gray-300" />
                      </div>
                    </div>
                  </button>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
