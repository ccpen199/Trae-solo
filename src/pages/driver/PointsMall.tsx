import { useEffect, useState } from "react";
import {
  Gift,
  Star,
  CreditCard,
  Fuel,
  Shield,
  ShieldCheck,
  Wrench,
  Ticket,
  TrendingUp,
  Award,
  Check,
} from "lucide-react";
import { apiClient } from "@/api/client";
import { useAuthStore } from "@/store";
import type { DriverProfile, DriverGrowthConfig } from "@shared/types";

const iconMap: Record<string, any> = {
  CreditCard,
  Fuel,
  Shield,
  ShieldCheck,
  Wrench,
  Ticket,
};

export default function PointsMall() {
  const { driverProfile } = useAuthStore();
  const [config, setConfig] = useState<DriverGrowthConfig | null>(null);
  const [exchangeId, setExchangeId] = useState<string | null>(null);

  const dp = driverProfile as DriverProfile;
  const points = dp?.safeDrivingPoints || 2850;
  const level = dp?.level || 4;

  useEffect(() => {
    apiClient.get<DriverGrowthConfig>("/driver/growth-config").then(setConfig);
  }, []);

  const handleExchange = async (itemId: string, itemPoints: number) => {
    if (points < itemPoints) return;
    try {
      setExchangeId(itemId);
      await apiClient.post("/driver/exchange-points", {
        driverId: dp?.id || "driver_001",
        itemId,
      });
      alert("兑换成功！");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setExchangeId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">积分商城</h1>
        <p className="text-slate-500 text-sm mt-1">安全驾驶积分兑换ETC、油卡等好礼</p>
      </div>

      <div className="card p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-primary-600 text-white border-0 overflow-hidden relative">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute right-20 -bottom-10 w-32 h-32 bg-white/10 rounded-full" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Star className="w-10 h-10 fill-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-white text-primary-600 text-xs font-bold">
                  Lv.{level}
                </div>
              </div>
              <div>
                <p className="text-white/70 text-sm">当前安全驾驶积分</p>
                <p className="text-5xl font-bold font-display">{points.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Award className="w-4 h-4 text-amber-200" />
                  <span className="text-white/90 text-sm">
                    {config?.levels?.find((l) => l.level === level)?.name || "金牌司机"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-white/70 text-sm">本月获得</p>
                <p className="text-2xl font-bold flex items-center gap-1 justify-center font-display">
                  <TrendingUp className="w-4 h-4" />
                  +420
                </p>
              </div>
              <div className="text-center">
                <p className="text-white/70 text-sm">累计完成</p>
                <p className="text-2xl font font font-display">326单</p>
              </div>
              <div className="text-center">
                <p className="text-white/70 text-sm">安全驾驶</p>
                <p className="text-2xl font font font-display">128天</p>
              </div>
            </div>
          </div>

          {config && (
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-white/80">
                  距离下一等级：
                  {config.levels.find((l) => l.level === level + 1)?.name || "最高等级"}
                </span>
                <span className="font-semibold">
                  {config.levels.find((l) => l.level === level + 1)
                    ? `${points} / ${config.levels.find((l) => l.level === level + 1)?.minPoints}`
                    : "已达最高等级"}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-200 to-white rounded-full transition-all"
                  style={{
                    width: config.levels.find((l) => l.level === level + 1)
                      ? `${(points / (config.levels.find((l) => l.level === level + 1)?.minPoints || 1)) * 100}%`
                      : "100%",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {config && (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-500" />
            等级权益
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {config.levels.map((lv) => {
              const isCurrent = lv.level === level;
              const isUnlocked = lv.level <= level;
              return (
                <div
                  key={lv.level}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isCurrent
                      ? "border-primary-500 bg-primary-50"
                      : isUnlocked
                      ? "border-slate-200 bg-slate-50"
                      : "border-slate-100 bg-slate-50/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-medium ${
                        isCurrent ? "text-primary-600" : "text-slate-500"
                      }`}
                    >
                      Lv.{lv.level}
                    </span>
                    {isCurrent && (
                      <span className="badge bg-primary-500 text-white">当前</span>
                    )}
                    {isUnlocked && !isCurrent && (
                      <Check className="w-4 h-4 text-success" />
                    )}
                  </div>
                  <p
                    className={`font-semibold ${
                      isUnlocked ? "text-slate-800" : "text-slate-400"
                    }`}
                  >
                    {lv.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {lv.minPoints.toLocaleString()} 积分
                  </p>
                  <div className="mt-3 space-y-1">
                    {lv.benefits.map((b) => (
                      <p key={b} className="text-xs text-slate-600 flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {b}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-slate-800 text-lg mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary-500" />
          兑换商品
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {config?.exchangeItems.map((item) => {
            const Icon = iconMap[item.icon] || Gift;
            const canAfford = points >= item.points;
            const isExchanging = exchangeId === item.id;
            return (
              <div key={item.id} className="card p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      canAfford
                        ? "bg-gradient-to-br from-primary-100 to-primary-200"
                        : "bg-slate-100"
                    }`}
                  >
                    <Icon
                      className={`w-7 h-7 ${
                        canAfford ? "text-primary-600" : "text-slate-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">{item.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">库存 {item.stock}</p>
                    <div className="mt-2 flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span
                        className={`text-xl font-bold font-display ${
                          canAfford ? "text-primary-600" : "text-slate-400"
                        }`}
                      >
                        {item.points.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400">积分</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleExchange(item.id, item.points)}
                  disabled={!canAfford || isExchanging}
                  className={`w-full mt-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    canAfford
                      ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-md hover:-translate-y-0.5"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isExchanging ? "兑换中..." : canAfford ? "立即兑换" : "积分不足"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
