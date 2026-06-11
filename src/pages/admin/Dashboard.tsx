import { useEffect, useState } from "react";
import {
  Package,
  Truck,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from "lucide-react";
import { apiClient } from "@/api/client";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [riskData, setRiskData] = useState<any>(null);

  useEffect(() => {
    apiClient.get<any>("/admin/dashboard").then(setData);
    apiClient.get<any>("/admin/risk-overview").then(setRiskData);
  }, []);

  const stats = [
    {
      label: "货源总数",
      value: data?.totalCargos || 0,
      trend: "+12.5%",
      trendUp: true,
      icon: Package,
      gradient: "from-orange-500 to-amber-600",
    },
    {
      label: "运单总数",
      value: data?.totalWaybills || 0,
      trend: "+8.3%",
      trendUp: true,
      icon: Truck,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      label: "在途运输",
      value: data?.activeWaybills || 0,
      trend: "-2.1%",
      trendUp: false,
      icon: BarChart3,
      gradient: "from-purple-500 to-violet-600",
    },
    {
      label: "平台营收",
      value: `¥${(data?.totalRevenue || 0).toLocaleString()}`,
      trend: "+18.7%",
      trendUp: true,
      icon: DollarSign,
      gradient: "from-green-500 to-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">运营数据看板</h1>
          <p className="text-slate-500 text-sm mt-1">平台整体运营数据实时监控</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
          </span>
          <span className="text-sm text-slate-600">实时数据</span>
        </div>
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
                  <span
                    className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full ${
                      stat.trendUp ? "bg-white/20" : "bg-red-500/30"
                    }`}
                  >
                    {stat.trendUp ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
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
            <h3 className="text-lg font-semibold text-slate-800">营收与订单趋势</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-primary-500" />
                订单量
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-secondary-500" />
                营收
              </span>
            </div>
          </div>
          <div className="h-64 flex items-end gap-3">
            {(data?.orderTrend || [42, 58, 63, 71, 85, 92, 88]).map((val: number, idx: number) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end gap-1 h-48">
                  <div
                    className="flex-1 bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg transition-all hover:from-primary-600 hover:to-primary-500"
                    style={{ height: `${(val / 100) * 100}%` }}
                  />
                  <div
                    className="flex-1 bg-gradient-to-t from-secondary-500 to-secondary-400 rounded-t-lg transition-all hover:from-secondary-600 hover:to-secondary-500"
                    style={{ height: `${(val * 1.1 / 100) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">
                  {["周一", "周二", "周三", "周四", "周五", "周六", "周日"][idx]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-danger" />
              风控概览
            </h3>
            <span className="badge bg-danger/10 text-danger">
              {riskData?.unreadCount || 0} 条未读
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-danger/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-danger" />
                </div>
                <span className="text-sm font-medium text-slate-700">高危预警</span>
              </div>
              <span className="text-2xl font-bold text-danger font-display">
                {riskData?.criticalCount || 1}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                </div>
                <span className="text-sm font-medium text-slate-700">中危预警</span>
              </div>
              <span className="text-2xl font-bold text-warning font-display">
                {riskData?.highCount || 1}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-info" />
                </div>
                <span className="text-sm font-medium text-slate-700">一般提醒</span>
              </div>
              <span className="text-2xl font-bold text-info font-display">
                {(riskData?.mediumCount || 0) + (riskData?.lowCount || 0)}
              </span>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-700 mb-3">近7天告警趋势</p>
            <div className="h-20 flex items-end gap-1.5">
              {(riskData?.trend || [8, 12, 6, 15, 9, 11, 7]).map((v: number, i: number) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-danger/30 to-danger/60 rounded-t transition-all hover:from-danger/50 hover:to-danger/80"
                  style={{ height: `${(v / 20) * 100}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-500" />
          平台司机概况
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100">
            <p className="text-sm text-slate-500">注册司机</p>
            <p className="text-2xl font-bold font-display text-slate-800 mt-1">
              {data?.totalDrivers || 5}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100">
            <p className="text-sm text-green-600">当前空车</p>
            <p className="text-2xl font-bold font-display text-green-700 mt-1">
              {data?.emptyDrivers || 4}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100">
            <p className="text-sm text-primary-600">履约分&gt;95</p>
            <p className="text-2xl font-bold font-display text-primary-700 mt-1">4</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100">
            <p className="text-sm text-amber-600">钻石司机</p>
            <p className="text-2xl font-bold font-display text-amber-700 mt-1">1</p>
          </div>
        </div>
      </div>
    </div>
  );
}
