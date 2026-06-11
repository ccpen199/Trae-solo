import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  Package,
  MapPin,
  Gift,
  TrendingUp,
  ArrowUpRight,
  Star,
  Clock,
  ChevronRight,
  Zap,
  Award,
} from "lucide-react";
import { apiClient } from "@/api/client";
import { useAuthStore } from "@/store";
import type { DriverProfile } from "@shared/types";

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { driverProfile } = useAuthStore();
  const [recommended, setRecommended] = useState<any[]>([]);
  const [growthConfig, setGrowthConfig] = useState<any>(null);

  useEffect(() => {
    apiClient.get<any[]>("/driver/recommend-cargos?driverId=driver_001").then((d) =>
      setRecommended(d.slice(0, 3))
    );
    apiClient.get<any>("/driver/growth-config").then(setGrowthConfig);
  }, []);

  const dp = driverProfile as DriverProfile;

  const stats = [
    { label: "空车状态", value: dp?.isEmpty ? "空闲中" : "运输中", icon: Truck, gradient: dp?.isEmpty ? "from-green-500 to-emerald-600" : "from-blue-500 to-indigo-600" },
    { label: "本月完成", value: "18单", icon: Package, gradient: "from-primary-500 to-orange-600" },
    { label: "本月收入", value: "¥28,600", icon: TrendingUp, gradient: "from-purple-500 to-violet-600" },
    { label: "安全积分", value: dp?.safeDrivingPoints || 0, icon: Star, gradient: "from-amber-500 to-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">司机工作台</h1>
        <p className="text-slate-500 text-sm mt-1">查看货源推荐，管理您的运输业务</p>
      </div>

      <div className="card p-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white border-0 overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full" />
        <div className="absolute right-20 -bottom-10 w-32 h-32 bg-white/10 rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-3xl font-bold">{dp?.id.charAt(dp.id.length - 1) || "司"}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold font-display">
                  {dp ? "" : ""}
                  张师傅
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium">
                  Lv.{dp?.level || 4} 金牌司机
                </span>
              </div>
              <p className="text-white/70 mt-1">{dp?.vehiclePlate || "沪A·88888"} · {dp?.vehicleType || "厢式货车"}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                  履约分 {dp?.performanceScore || 98}
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <Award className="w-4 h-4" />
                  累计 {dp?.totalOrders || 326} 单
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/driver/empty-report")}
              className="px-5 py-3 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all font-medium flex items-center gap-2"
            >
              <Zap className="w-5 h-5" />
              {dp?.isEmpty ? "更新位置" : "上报空车"}
            </button>
            <button
              onClick={() => navigate("/driver/points-mall")}
              className="px-5 py-3 rounded-xl bg-white text-indigo-600 hover:bg-white/90 transition-all font-medium flex items-center gap-2 shadow-lg"
            >
              <Gift className="w-5 h-5" />
              积分商城
            </button>
          </div>
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
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="flex items-center gap-0.5 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    <ArrowUpRight className="w-3 h-3" />
                    +12%
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
            <h3 className="text-lg font-semibold text-slate-800">常跑线路推荐货源</h3>
            <button
              onClick={() => navigate("/driver/cargo-hall")}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
            >
              货源大厅 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recommended.map((item, idx) => {
              const { cargo, isFrequentRoute } = item;
              return (
                <div
                  key={cargo.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-primary-50 hover:border hover:border-primary-200 transition-all cursor-pointer"
                  style={{ animationDelay: `${idx * 50}ms` }}
                  onClick={() => navigate(`/driver/negotiation/${cargo.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800">{cargo.title}</p>
                        {isFrequentRoute && (
                          <span className="badge bg-green-100 text-green-600">
                            <MapPin className="w-3 h-3" />
                            常跑线路
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {cargo.origin} → {cargo.destination}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600">¥{cargo.expectedPrice}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {Math.round(Math.random() * 30 + 5)}分钟前发布
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">常跑线路</h3>
            <Award className="w-5 h-5 text-primary-500" />
          </div>
          <div className="space-y-3">
            {(dp?.frequentRoutes || [
              { origin: "上海市", destination: "杭州市", count: 58 },
              { origin: "上海市", destination: "苏州市", count: 42 },
              { origin: "上海市", destination: "南京市", count: 31 },
            ]).map((route, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-primary-500" />
                    <span className="font-medium text-slate-700 text-sm">{route.origin}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-secondary-500" />
                    <span className="font-medium text-slate-700 text-sm">{route.destination}</span>
                  </div>
                </div>
                <span className="badge bg-primary-100 text-primary-600">
                  {route.count}次
                </span>
              </div>
            ))}
          </div>

          {growthConfig && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <p className="text-sm text-slate-500 mb-2">距离下一等级</p>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                  style={{ width: "70%" }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                还需 {(growthConfig.levels?.[dp?.level || 4]?.minPoints || 3000) - (dp?.safeDrivingPoints || 2850)} 积分升级钻石司机
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
