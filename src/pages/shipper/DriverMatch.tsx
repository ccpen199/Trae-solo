import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  MapPin,
  Truck,
  Shield,
  Clock,
  Award,
  Phone,
  MessageSquare,
  Check,
  ArrowLeft,
  TrendingUp,
  User,
} from "lucide-react";
import { apiClient } from "@/api/client";
import type { MatchedDriver, Cargo } from "@shared/types";

export default function DriverMatch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<MatchedDriver[]>([]);
  const [cargo, setCargo] = useState<Cargo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get<Cargo>(`/cargo/${id}`),
      apiClient.get<MatchedDriver[]>(`/cargo/${id}/match-drivers`),
    ]).then(([c, d]) => {
      setCargo(c);
      setDrivers(d);
      setLoading(false);
    });
  }, [id]);

  const handleConfirm = async () => {
    if (!selectedDriver) return;
    try {
      const driver = drivers.find((d) => d.id === selectedDriver);
      const expectedPrice = cargo?.expectedPrice || 0;
      await apiClient.post("/waybill", {
        cargoId: id,
        driverId: selectedDriver,
        agreedPrice: driver && driver.matchScore > 90 ? expectedPrice : expectedPrice * 0.95,
      });
      navigate("/shipper/cargo/list");
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400">正在为您匹配优质司机...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">智能匹配司机</h1>
          <p className="text-slate-500 text-sm mt-1">
            为您筛选车型符合、资质齐全、履约分＞95%的优质司机
          </p>
        </div>
      </div>

      {cargo && (
        <div className="card p-5 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white border-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">{cargo.title}</h3>
              <p className="text-white/70 text-sm">
                <MapPin className="w-4 h-4 inline mr-1" />
                {cargo.origin} → {cargo.destination}
                <span className="mx-2">|</span>
                {cargo.volume}m³ / {cargo.weight}吨
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-xs">期望运费</p>
              <p className="text-2xl font-bold font-display">¥{cargo.expectedPrice}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          共找到 <span className="font-semibold text-primary-600">{drivers.length}</span> 位匹配司机，按匹配度排序
        </p>
        {selectedDriver && (
          <button onClick={handleConfirm} className="btn-primary">
            <Check className="w-4 h-4" />
            确认选择此司机
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {drivers.map((driver, idx) => {
          const isSelected = selectedDriver === driver.id;
          return (
            <div
              key={driver.id}
              onClick={() => setSelectedDriver(driver.id)}
              className={`card p-5 cursor-pointer transition-all ${
                isSelected ? "ring-2 ring-primary-500 shadow-glow" : ""
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold">
                    {driver.id.charAt(driver.id.length - 1)}
                  </div>
                  {idx < 3 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800">
                      {mockUserNames(driver.userId)}
                    </h3>
                    <span className="badge bg-primary-100 text-primary-600">
                      Lv.{driver.level}
                    </span>
                    <span className="badge bg-warning/10 text-warning flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-warning" />
                      {driver.performanceScore}分
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {driver.vehiclePlate} · {driver.vehicleType}（{driver.vehicleCapacity}吨/{driver.vehicleVolume}m³）
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">匹配度</p>
                  <div className="flex items-center gap-1">
                    <p className="text-2xl font-bold font-display text-primary-600">{driver.matchScore}</p>
                    <TrendingUp className="w-4 h-4 text-success" />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-blue-50 flex items-center justify-center mb-1">
                    <MapPin className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-xs text-slate-400">距离货源</p>
                  <p className="text-sm font-semibold text-slate-700">{driver.distanceToCargo}km</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-green-50 flex items-center justify-center mb-1">
                    <Clock className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-xs text-slate-400">预计到达</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {new Date(driver.estimatedArrivalTime).toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-purple-50 flex items-center justify-center mb-1">
                    <Award className="w-4 h-4 text-purple-500" />
                  </div>
                  <p className="text-xs text-slate-400">累计完成</p>
                  <p className="text-sm font-semibold text-slate-700">{driver.totalOrders}单</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <Shield className="w-4 h-4 text-secondary-500" />
                <span className="text-xs text-slate-500">承运资质：</span>
                {driver.qualifications.length > 0 ? (
                  driver.qualifications.map((q) => (
                    <span key={q} className="badge bg-secondary-50 text-secondary-600">
                      {q}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">普通货运</span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button className="btn-secondary flex-1 py-2" onClick={(e) => e.stopPropagation()}>
                  <Phone className="w-4 h-4" />
                  联系司机
                </button>
                <button className="btn-secondary flex-1 py-2" onClick={(e) => e.stopPropagation()}>
                  <MessageSquare className="w-4 h-4" />
                  发起议价
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function mockUserNames(userId: string): string {
  const map: Record<string, string> = {
    u_driver_001: "张师傅",
    u_driver_002: "李师傅",
    u_driver_003: "王师傅",
    u_driver_004: "陈师傅",
    u_driver_005: "刘师傅",
  };
  return map[userId] || "司机师傅";
}
