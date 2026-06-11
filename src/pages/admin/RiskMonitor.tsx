import { useEffect, useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  MapPin,
  User,
  Truck,
  Clock,
  Search,
  Filter,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Eye,
  Activity,
  AlertOctagon,
  BarChart3,
  PieChart,
} from "lucide-react";
import { apiClient } from "@/api/client";

export default function RiskMonitor() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    apiClient.get<any>("/admin/risk-overview").then(setOverview);
    apiClient.get<any[]>("/risk/alerts").then((d) => setAlerts(d));
  }, []);

  const levelConfig: Record<string, { bg: string; text: string; label: string }> = {
    high: { bg: "bg-red-100", text: "text-red-600", label: "高危" },
    medium: { bg: "bg-yellow-100", text: "text-yellow-600", label: "中危" },
    low: { bg: "bg-blue-100", text: "text-blue-600", label: "一般" },
  };

  const typeIcons: Record<string, any> = {
    track_anomaly: MapPin,
    credit_risk: User,
    driver_behavior: Truck,
    document_risk: Activity,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">风控监控中心</h1>
          <p className="text-slate-500 text-sm mt-1">实时监控平台风险事件，保障运输安全</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">
            <Filter className="w-4 h-4" />
            高级筛选
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "高危预警", value: overview?.highCount || 12, icon: AlertOctagon, gradient: "from-red-500 to-rose-600", trend: "+3" },
          { label: "中危预警", value: overview?.mediumCount || 38, icon: AlertTriangle, gradient: "from-amber-500 to-orange-600", trend: "-5" },
          { label: "一般预警", value: overview?.lowCount || 126, icon: ShieldAlert, gradient: "from-blue-500 to-indigo-600", trend: "+12" },
          { label: "已处置", value: overview?.resolvedCount || 145, icon: CheckCircle2, gradient: "from-green-500 to-emerald-600", trend: "+28" },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          const isUp = stat.trend.startsWith("+");
          return (
            <div key={idx} className={`stat-card bg-gradient-to-br ${stat.gradient}`} style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`flex items-center gap-0.5 text-xs bg-white/20 px-2 py-0.5 rounded-full ${isUp ? "" : ""}`}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stat.trend}
                  </span>
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
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-slate-800">风险事件预警列表</h3>
            <div className="flex gap-1.5">
              {["全部", "待处理", "处理中", "已解决"].map((tab, idx) => (
                <button
                  key={tab}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    idx === 0 ? "bg-primary-50 text-primary-600" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {alerts.map((alert, idx) => {
              const cfg = levelConfig[alert.level];
              const TypeIcon = typeIcons[alert.type] || AlertTriangle;
              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className={`w-11 h-11 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <TypeIcon className={`w-5 h-5 ${cfg.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                      <span className="badge bg-slate-100 text-slate-600">
                        {alert.type === "track_anomaly" ? "轨迹异常" :
                         alert.type === "credit_risk" ? "信用风险" :
                         alert.type === "driver_behavior" ? "司机行为" : "单证风险"}
                      </span>
                      {alert.isHandled ? (
                        <span className="badge bg-green-100 text-green-600">已处置</span>
                      ) : (
                        <span className="badge bg-orange-100 text-orange-600">待处理</span>
                      )}
                    </div>
                    <p className="font-medium text-slate-800">{alert.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{alert.message}</p>
                    <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {alert.location || "上海市浦东新区"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.createdAt).toLocaleString("zh-CN")}
                      </span>
                      {alert.waybillId && (
                        <span className="flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          运单: {alert.waybillId}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    {!alert.isHandled && (
                      <button className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">风险类型分布</h3>
              <PieChart className="w-5 h-5 text-primary-500" />
            </div>
            <div className="space-y-3">
              {[
                { label: "轨迹异常", value: 42, color: "bg-red-500", count: 78 },
                { label: "信用风险", value: 25, color: "bg-amber-500", count: 46 },
                { label: "司机行为", value: 20, color: "bg-blue-500", count: 37 },
                { label: "单证风险", value: 13, color: "bg-purple-500", count: 24 },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <span className="text-sm font-medium text-slate-800">{item.count}起</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">近7天风险趋势</h3>
              <BarChart3 className="w-5 h-5 text-primary-500" />
            </div>
            <div className="h-40 flex items-end gap-1.5">
              {[65, 72, 58, 85, 78, 62, 55].map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gradient-to-t from-primary-500 to-orange-400 rounded-t transition-all"
                    style={{ height: `${(val / 100) * 100}%` }}
                  />
                  <span className="text-[10px] text-slate-400">周{["一", "二", "三", "四", "五", "六", "日"][idx]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5 bg-gradient-to-br from-red-50 to-orange-50 border border-red-100">
            <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2 mb-3">
              <AlertOctagon className="w-5 h-5" />
              紧急处置
            </h3>
            <div className="space-y-2">
              {[
                "运单 WB20240115003 车辆偏离规划路线30分钟",
                "司机 driver_007 连续驾驶超4小时未休息",
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-white/80">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{item}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors">
              立即处理
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
