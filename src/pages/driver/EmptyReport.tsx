import { useEffect, useState } from "react";
import {
  MapPin,
  Truck,
  Navigation,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Zap,
} from "lucide-react";
import { apiClient } from "@/api/client";
import { useAuthStore } from "@/store";
import type { DriverProfile } from "@shared/types";

export default function EmptyReport() {
  const { driverProfile, setRole } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [location, setLocation] = useState("上海市浦东新区张江高科技园区");
  const [destination, setDestination] = useState("");
  const [availableTime, setAvailableTime] = useState("now");
  const [nearbyCargos, setNearbyCargos] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);

  const dp = driverProfile as DriverProfile;

  useEffect(() => {
    setIsEmpty(dp?.isEmpty ?? true);
    apiClient.get<any[]>("/driver/nearby-cargos?driverId=driver_001&lat=31.2&lng=121.5").then((d) =>
      setNearbyCargos(d.slice(0, 4))
    );
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    apiClient.post("/driver/report-empty", {
      driverId: "driver_001",
      location,
      destination: destination || null,
      availableTime,
    });
    setSuccess(true);
    setLoading(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">空车上报</h1>
        <p className="text-slate-500 text-sm mt-1">上报空车状态，系统为您智能匹配货源</p>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-800">空车状态上报成功！</p>
            <p className="text-sm text-green-600">系统已为您开始匹配附近货源，预计3分钟内推送推荐</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6 lg:col-span-2 space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isEmpty ? "bg-green-100" : "bg-orange-100"}`}>
              <Truck className={`w-6 h-6 ${isEmpty ? "text-green-600" : "text-orange-600"}`} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800">当前状态：{isEmpty ? "空车中" : "运输中"}</p>
              <p className="text-sm text-slate-500 mt-0.5">
                {isEmpty ? "您当前处于空车状态，可随时接单" : "您正在执行运输任务，完成后可重新上报"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${isEmpty ? "bg-green-500" : "bg-orange-500"}`} />
              <span className="text-sm text-slate-500">实时</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1 text-primary-500" />
                当前位置
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field pr-12"
                  placeholder="请输入或自动获取当前位置"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors">
                  <Navigation className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                2分钟前自动定位 · 精度 15米
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Navigation className="w-4 h-4 inline mr-1 text-blue-500" />
                意向目的地（可选）
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="input-field"
                placeholder="如：杭州市，系统优先推送该方向货源"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {["杭州市", "苏州市", "南京市", "宁波市"].map((city) => (
                  <button
                    key={city}
                    onClick={() => setDestination(city)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      destination === city
                        ? "bg-primary-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1 text-green-500" />
                可接单时间
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: "now", label: "立即接单" },
                  { value: "30min", label: "30分钟后" },
                  { value: "1h", label: "1小时后" },
                  { value: "2h", label: "2小时后" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAvailableTime(opt.value)}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      availableTime === opt.value
                        ? "bg-primary-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full btn-primary justify-center py-3.5 text-base disabled:opacity-60"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Zap className="w-5 h-5" />
            )}
            {loading ? "上报中..." : "一键上报空车状态"}
          </button>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">附近货源</h3>
            <span className="badge bg-primary-100 text-primary-600">{nearbyCargos.length}条</span>
          </div>
          <div className="space-y-3">
            {nearbyCargos.map((item) => (
              <div
                key={item.cargo.id}
                className="p-3 rounded-xl bg-slate-50 hover:bg-primary-50 transition-colors cursor-pointer border border-transparent hover:border-primary-200"
              >
                <p className="font-medium text-slate-800 text-sm">{item.cargo.title}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {item.cargo.origin} → {item.cargo.destination}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-base font-bold text-primary-600">¥{item.cargo.expectedPrice}</p>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {item.distance}km
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
