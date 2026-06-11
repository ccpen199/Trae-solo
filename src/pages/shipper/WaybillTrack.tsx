import { useEffect, useState } from "react";
import {
  MapPin,
  Truck,
  Clock,
  AlertTriangle,
  Shield,
  CheckCircle2,
  Navigation,
  Package,
  Phone,
  User,
} from "lucide-react";
import { apiClient } from "@/api/client";

export default function WaybillTrack() {
  const [waybill, setWaybill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<any>("/waybill/waybill_001").then((d) => {
      setWaybill(d);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400">加载运单信息...</div>
      </div>
    );
  }

  const { cargo, driver, trackingPoints, trackAnomaly } = waybill || {};

  const steps = [
    { label: "已发布", status: "done" },
    { label: "已匹配", status: "done" },
    { label: "装货中", status: "done" },
    { label: "运输中", status: "active" },
    { label: "已送达", status: "pending" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">在途追踪</h1>
        <p className="text-slate-500 text-sm mt-1">实时监控货物运输状态和位置</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-0 overflow-hidden">
            <div className="relative h-80 bg-gradient-to-br from-secondary-700 via-secondary-800 to-secondary-900 overflow-hidden">
              <div className="absolute inset-0 opacity-30">
                <svg className="w-full h-full">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              <svg className="absolute inset-0 w-full h-full">
                <path
                  d="M 80 200 Q 200 100, 350 160 T 650 120"
                  fill="none"
                  stroke="#FF6B1A"
                  strokeWidth="3"
                  strokeDasharray="8,4"
                  className="animate-pulse"
                />
              </svg>

              <div
                className="absolute transition-all duration-1000"
                style={{ left: "65%", top: "35%" }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping-slow opacity-30 w-12 h-12 -left-3 -top-3" />
                  <div className="w-6 h-6 rounded-full bg-primary-500 border-4 border-white shadow-xl flex items-center justify-center">
                    <Truck className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>

              <div className="absolute left-[12%] top-[55%]">
                <div className="w-5 h-5 rounded-full bg-green-500 border-3 border-white shadow-lg flex items-center justify-center">
                  <Package className="w-2.5 h-2.5 text-white" />
                </div>
                <p className="text-white text-xs mt-1 ml-[-20px] whitespace-nowrap">
                  {cargo?.origin?.substring(0, 6)}
                </p>
              </div>

              <div className="absolute right-[8%] top-[28%]">
                <div className="w-5 h-5 rounded-full bg-red-500 border-3 border-white shadow-lg flex items-center justify-center">
                  <MapPin className="w-2.5 h-2.5 text-white" />
                </div>
                <p className="text-white text-xs mt-1 ml-[-20px] whitespace-nowrap">
                  {cargo?.destination?.substring(0, 6)}
                </p>
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-white">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-primary-400" />
                    <span className="text-sm">当前位置</span>
                  </div>
                  <p className="font-semibold mt-0.5">
                    {trackingPoints && trackingPoints.length > 0
                      ? "廊坊市境内 · G2京沪高速"
                      : "未知位置"}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-white text-right">
                  <p className="text-sm text-white/70">预计到达</p>
                  <p className="text-xl font-bold font-display">
                    {waybill?.estimatedArrival
                      ? new Date(waybill.estimatedArrival).toLocaleTimeString("zh-CN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--:--"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                          step.status === "done"
                            ? "bg-success text-white"
                            : step.status === "active"
                            ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md shadow-primary-300"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {step.status === "done" ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span
                        className={`text-xs mt-1.5 ${
                          step.status === "pending" ? "text-slate-400" : "text-slate-700 font-medium"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 ${
                          step.status === "done" ? "bg-success" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {trackAnomaly?.hasAnomaly && (
            <div className="card p-4 border-danger/30 bg-danger/5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-danger" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-danger">轨迹异常预警</p>
                  <p className="text-sm text-slate-600 mt-0.5">
                    车辆偏离规划路线约 {trackAnomaly.details?.deviationDistance} 公里，已持续 15 分钟
                  </p>
                </div>
                <button className="btn-secondary text-sm">联系司机</button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-4">货物信息</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{cargo?.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {cargo?.volume}m³ / {cargo?.weight}吨
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-secondary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">区块链存证</p>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono break-all">
                    {waybill?.blockchainHash?.substring(0, 20)}...
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">运费</span>
                  <span className="text-xl font-bold text-primary-600 font-display">
                    ¥{waybill?.agreedPrice}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-4">承运司机</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-lg font-bold">
                {driver?.userId?.charAt(driver.userId.length - 1) || "司"}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800">
                  {driver?.userId === "u_driver_004" ? "陈师傅" : "司机师傅"}
                </p>
                <p className="text-sm text-slate-500">
                  {driver?.vehiclePlate} · 履约分 {driver?.performanceScore}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-secondary py-2 text-sm">
                <Phone className="w-4 h-4" />
                拨打电话
              </button>
              <button className="btn-secondary py-2 text-sm">
                <User className="w-4 h-4" />
                司机主页
              </button>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              轨迹记录
            </h3>
            <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-thin">
              {trackingPoints?.slice().reverse().map((p: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-400">
                      {new Date(p.time).toLocaleString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-sm text-slate-600">
                      经度 {p.lng?.toFixed(4)} · 纬度 {p.lat?.toFixed(4)}
                      {p.speed && <span className="text-slate-400 ml-2">{p.speed}km/h</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
