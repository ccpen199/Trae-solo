import { useEffect, useState } from "react";
import {
  AlertTriangle,
  MapPin,
  Clock,
  Search,
  Filter,
  ChevronDown,
  RefreshCw,
  Bell,
  BellOff,
  Navigation,
  Route,
  Calendar,
  Truck,
  AlertOctagon,
  Car,
  CloudRain,
  Info,
  CheckCircle2,
  Users,
  BarChart3,
  Plus,
} from "lucide-react";
import { apiClient } from "@/api/client";

export default function TrafficControl() {
  const [controls, setControls] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get<any[]>("/traffic/controls").then(setControls);
    setSubscriptions([
      { id: "1", route: "上海 → 杭州", drivers: 128, enabled: true },
      { id: "2", route: "上海 → 苏州", drivers: 96, enabled: true },
      { id: "3", route: "上海 → 南京", drivers: 75, enabled: true },
      { id: "4", route: "上海 → 宁波", drivers: 58, enabled: false },
    ]);
  }, []);

  const typeConfig: Record<string, { icon: any; bg: string; text: string; label: string }> = {
    closure: { icon: Route, bg: "bg-red-100", text: "text-red-600", label: "道路封闭" },
    congestion: { icon: Car, bg: "bg-orange-100", text: "text-orange-600", label: "严重拥堵" },
    construction: { icon: AlertTriangle, bg: "bg-yellow-100", text: "text-yellow-600", label: "施工养护" },
    accident: { icon: AlertOctagon, bg: "bg-rose-100", text: "text-rose-600", label: "交通事故" },
    weather: { icon: CloudRain, bg: "bg-blue-100", text: "text-blue-600", label: "恶劣天气" },
    restriction: { icon: Info, bg: "bg-purple-100", text: "text-purple-600", label: "限行管制" },
  };

  const levelConfig: Record<string, string> = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-blue-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">交通管制信息</h1>
          <p className="text-slate-500 text-sm mt-1">对接高德/百度路况API，自动推送交通管制信息</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
            同步数据
          </button>
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            新建订阅
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "管制信息总数", value: controls.length || 86, icon: AlertTriangle, gradient: "from-red-500 to-rose-600", trend: "+12" },
          { label: "影响线路数", value: "34", icon: Route, gradient: "from-orange-500 to-amber-600", trend: "+5" },
          { label: "订阅路线", value: subscriptions.length || 4, icon: Bell, gradient: "from-blue-500 to-indigo-600", trend: "+1" },
          { label: "覆盖司机", value: "357", icon: Truck, gradient: "from-green-500 to-emerald-600", trend: "+28" },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`stat-card bg-gradient-to-br ${stat.gradient}`} style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{stat.trend}</span>
                </div>
                <p className="text-3xl font-bold font-display">{stat.value}</p>
                <p className="text-white/70 text-sm mt-1">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5 lg:col-span-2">
          <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-slate-800">实时交通管制信息</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="搜索城市、道路..." className="input-field pl-9 py-2 text-sm" />
              </div>
              <button className="btn-secondary py-2 text-sm">
                <Filter className="w-4 h-4" />
                筛选
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(typeConfig).map(([key, cfg]) => (
              <span key={key} className={`badge ${cfg.bg} ${cfg.text} flex items-center gap-1`}>
                <cfg.icon className="w-3 h-3" />
                {cfg.label}
              </span>
            ))}
          </div>

          <div className="space-y-3">
            {controls.map((ctrl, idx) => {
              const cfg = typeConfig[ctrl.type] || typeConfig.restriction;
              const TypeIcon = cfg.icon;
              return (
                <div
                  key={ctrl.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className={`w-11 h-11 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 relative`}>
                    <TypeIcon className={`w-5 h-5 ${cfg.text}`} />
                    <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${levelConfig[ctrl.level || "medium"]} ring-2 ring-white`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                      <span className="badge bg-slate-100 text-slate-600">{ctrl.province || "上海市"}</span>
                    </div>
                    <p className="font-medium text-slate-800">{ctrl.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{ctrl.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {ctrl.road || "G60沪昆高速"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        {ctrl.direction || "杭州方向"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {ctrl.startTime || "01-15 08:00"} ~ {ctrl.endTime || "01-15 18:00"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ctrl.createdAt || Date.now()).toLocaleString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-all">
                    <Bell className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">订阅线路</h3>
              <Bell className="w-5 h-5 text-primary-500" />
            </div>
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${sub.enabled ? "bg-primary-100" : "bg-slate-100"}`}>
                      <Route className={`w-4 h-4 ${sub.enabled ? "text-primary-600" : "text-slate-400"}`} />
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${sub.enabled ? "text-slate-800" : "text-slate-400"}`}>{sub.route}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {sub.drivers}位司机订阅
                      </p>
                    </div>
                  </div>
                  <button className={`p-2 rounded-lg transition-colors ${
                    sub.enabled
                      ? "bg-green-100 text-green-600 hover:bg-green-200"
                      : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                  }`}>
                    {sub.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-primary-300 hover:text-primary-600 transition-colors text-sm font-medium">
              <Plus className="w-4 h-4 inline mr-1" />
              添加订阅线路
            </button>
          </div>

          <div className="card p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5" />
              今日推送统计
            </h3>
            <div className="space-y-3">
              {[
                { label: "已推送通知", value: "1,286条", color: "text-blue-700" },
                { label: "司机查看率", value: "89.2%", color: "text-green-700" },
                { label: "成功绕行", value: "328次", color: "text-emerald-700" },
                { label: "避免延误", value: "约186小时", color: "text-amber-700" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-white/60">
                  <span className="text-sm text-blue-700/80">{item.label}</span>
                  <span className={`font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">数据源配置</h3>
            <div className="space-y-3">
              {[
                { name: "高德地图API", status: "connected", latency: "28ms" },
                { name: "百度地图API", status: "connected", latency: "35ms" },
                { name: "交通部路况数据", status: "connected", latency: "120ms" },
              ].map((source, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div>
                    <p className="font-medium text-sm text-slate-800">{source.name}</p>
                    <p className="text-xs text-slate-400">延迟: {source.latency}</p>
                  </div>
                  <span className="badge bg-green-100 text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    已连接
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
