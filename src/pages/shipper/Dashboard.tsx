import { useEffect, useState } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  MapPin,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { apiClient } from "@/api/client";
import type { Cargo, Waybill, RiskAlert } from "@shared/types";
import { useNavigate } from "react-router-dom";

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "bg-slate-100 text-slate-600" },
  published: { label: "已发布", color: "bg-blue-100 text-blue-600" },
  matched: { label: "已匹配", color: "bg-purple-100 text-purple-600" },
  shipping: { label: "运输中", color: "bg-primary-100 text-primary-600" },
  completed: { label: "已完成", color: "bg-green-100 text-green-600" },
  cancelled: { label: "已取消", color: "bg-red-100 text-red-600" },
};

export default function ShipperDashboard() {
  const navigate = useNavigate();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [waybills, setWaybills] = useState<Waybill[]>([]);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);

  useEffect(() => {
    apiClient.get<Cargo[]>("/cargo?shipperId=u_shipper_001").then(setCargos);
    apiClient.get<Waybill[]>("/waybill?shipperId=u_shipper_001").then(setWaybills);
    apiClient.get<RiskAlert[]>("/risk/alerts?isRead=false").then((d) => setAlerts(d.slice(0, 3)));
  }, []);

  const stats = [
    {
      label: "发布货源",
      value: cargos.length,
      trend: "+12%",
      icon: Package,
      gradient: "from-primary-500 to-orange-600",
    },
    {
      label: "在途运输",
      value: waybills.filter((w) => w.status === "shipping").length,
      trend: "+3",
      icon: Truck,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      label: "已完成",
      value: waybills.filter((w) => w.status === "completed").length,
      trend: "+28%",
      icon: CheckCircle2,
      gradient: "from-green-500 to-emerald-600",
    },
    {
      label: "本月运费",
      value: "¥12,850",
      trend: "+15%",
      icon: TrendingUp,
      gradient: "from-purple-500 to-violet-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">货主工作台</h1>
          <p className="text-slate-500 text-sm mt-1">
            管理您的货源订单，实时追踪运输状态
          </p>
        </div>
        <button
          onClick={() => navigate("/shipper/cargo/publish")}
          className="btn-primary"
        >
          <Package className="w-4 h-4" />
          发布新货源
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`stat-card bg-gradient-to-br ${stat.gradient}`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="flex items-center gap-0.5 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    <ArrowUpRight className="w-3 h-3" />
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">最近货源</h3>
            <button
              onClick={() => navigate("/shipper/cargo/list")}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {cargos.slice(0, 4).map((cargo) => {
              const status = statusMap[cargo.status];
              return (
                <div
                  key={cargo.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => {
                    if (cargo.status === "published") {
                      navigate(`/shipper/cargo/${cargo.id}/match`);
                    }
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{cargo.title}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {cargo.origin} → {cargo.destination}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600">
                      ¥{cargo.expectedPrice}
                    </p>
                    <span className={`badge ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">风控提醒</h3>
            <span className="badge bg-danger/10 text-danger">
              {alerts.length} 条未读
            </span>
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      alert.level === "high"
                        ? "bg-danger/10"
                        : alert.level === "medium"
                        ? "bg-warning/10"
                        : "bg-info/10"
                    }`}
                  >
                    <AlertTriangle
                      className={`w-4 h-4 ${
                        alert.level === "high"
                          ? "text-danger"
                          : alert.level === "medium"
                          ? "text-warning"
                          : "text-info"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 line-clamp-2">
                      {alert.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(alert.createdAt).toLocaleString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {waybills.some((w) => w.status === "shipping") && (
            <button
              onClick={() => navigate("/shipper/waybill/track")}
              className="w-full mt-4 btn-secondary"
            >
              <Clock className="w-4 h-4" />
              查看在途运单
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
