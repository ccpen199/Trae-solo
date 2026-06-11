import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, MapPin, Search, Filter, ChevronRight, User } from "lucide-react";
import { apiClient } from "@/api/client";
import type { Cargo } from "@shared/types";

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "bg-slate-100 text-slate-600" },
  published: { label: "已发布", color: "bg-blue-100 text-blue-600" },
  matched: { label: "已匹配", color: "bg-purple-100 text-purple-600" },
  shipping: { label: "运输中", color: "bg-primary-100 text-primary-600" },
  completed: { label: "已完成", color: "bg-green-100 text-green-600" },
  cancelled: { label: "已取消", color: "bg-red-100 text-red-600" },
};

export default function CargoList() {
  const navigate = useNavigate();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiClient.get<Cargo[]>("/cargo?shipperId=u_shipper_001").then(setCargos);
  }, []);

  const filtered = cargos.filter((c) => {
    if (filter !== "all" && c.status !== filter) return false;
    if (search && !c.title.includes(search) && !c.origin.includes(search) && !c.destination.includes(search))
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">货源管理</h1>
          <p className="text-slate-500 text-sm mt-1">查看和管理您的所有货源订单</p>
        </div>
        <button onClick={() => navigate("/shipper/cargo/publish")} className="btn-primary">
          <Package className="w-4 h-4" />
          发布新货源
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input-field pl-10"
              placeholder="搜索货源标题、发货地、收货地..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />
            {["all", "published", "matched", "shipping", "completed"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === s
                    ? "bg-primary-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s === "all" ? "全部" : statusMap[s]?.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((cargo) => {
          const status = statusMap[cargo.status];
          return (
            <div
              key={cargo.id}
              className="card p-5 hover:shadow-card-hover transition-all cursor-pointer"
              onClick={() => {
                if (cargo.status === "published") {
                  navigate(`/shipper/cargo/${cargo.id}/match`);
                } else if (cargo.status === "shipping") {
                  navigate("/shipper/waybill/track");
                }
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800">{cargo.title}</h3>
                      <span className={`badge ${status.color}`}>{status.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="w-3.5 h-3.5" />
                      {cargo.origin}
                      <ChevronRight className="w-3 h-3" />
                      {cargo.destination}
                      <span className="text-slate-300">|</span>
                      <span>{cargo.volume}m³ / {cargo.weight}吨</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>车型：{cargo.requiredVehicleTypes.join("、") || "不限"}</span>
                      {cargo.insuranceRequired && (
                        <span className="text-secondary-600">已购保险 ¥{cargo.insuranceAmount?.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">期望运费</p>
                    <p className="text-2xl font-bold text-primary-600 font-display">¥{cargo.expectedPrice}</p>
                    <p className="text-xs text-slate-400">参考价 ¥{cargo.referencePrice}</p>
                  </div>
                  <button className="btn-secondary">
                    <User className="w-4 h-4" />
                    {cargo.status === "published" ? "匹配司机" : "查看详情"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
