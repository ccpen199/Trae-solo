import { useEffect, useState } from "react";
import {
  Package,
  MapPin,
  Search,
  Filter,
  ChevronDown,
  Clock,
  ArrowUpRight,
  Zap,
  Star,
  Truck,
  Weight,
  Maximize2,
} from "lucide-react";
import { apiClient } from "@/api/client";
import { useNavigate } from "react-router-dom";

export default function CargoHall() {
  const navigate = useNavigate();
  const [cargos, setCargos] = useState<any[]>([]);
  const [searchKey, setSearchKey] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    apiClient.get<any[]>("/cargo?status=published").then((data) => {
      setCargos(
        data.map((c) => ({
          ...c,
          distance: (Math.random() * 50 + 2).toFixed(1),
          isFrequent: Math.random() > 0.6,
          isUrgent: Math.random() > 0.7,
        }))
      );
    });
  }, []);

  const filters = [
    { key: "all", label: "全部" },
    { key: "frequent", label: "常跑线路" },
    { key: "urgent", label: "紧急货源" },
    { key: "nearby", label: "附近50km" },
    { key: "highPrice", label: "高价优先" },
  ];

  const filtered = cargos.filter((c) => {
    const matchSearch =
      c.title.includes(searchKey) ||
      c.origin.includes(searchKey) ||
      c.destination.includes(searchKey);
    if (activeFilter === "frequent") return c.isFrequent && matchSearch;
    if (activeFilter === "urgent") return c.isUrgent && matchSearch;
    if (activeFilter === "nearby") return parseFloat(c.distance) <= 50 && matchSearch;
    if (activeFilter === "highPrice") return c.expectedPrice > 800 && matchSearch;
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">货源大厅</h1>
        <p className="text-slate-500 text-sm mt-1">浏览最新货源，选择合适订单</p>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              placeholder="搜索货源、出发地、目的地..."
              className="input-field pl-11"
            />
          </div>
          <button className="btn-secondary">
            <Filter className="w-4 h-4" />
            高级筛选
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeFilter === f.key
                  ? "bg-primary-500 text-white shadow-md shadow-primary-500/30"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((cargo, idx) => (
          <div
            key={cargo.id}
            className="card p-5 hover:shadow-lg transition-all cursor-pointer group"
            style={{ animationDelay: `${idx * 30}ms` }}
            onClick={() => navigate(`/driver/negotiation/${cargo.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800 group-hover:text-primary-600 transition-colors">
                    {cargo.title}
                  </h3>
                  {cargo.isUrgent && (
                    <span className="badge bg-red-100 text-red-600">
                      <Zap className="w-3 h-3" />
                      紧急
                    </span>
                  )}
                  {cargo.isFrequent && (
                    <span className="badge bg-green-100 text-green-600">
                      <Star className="w-3 h-3" />
                      常跑
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs">
                    <MapPin className="w-3 h-3" />
                    {cargo.origin}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-50 text-primary-600 text-xs">
                    <MapPin className="w-3 h-3" />
                    {cargo.destination}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-600 font-display">
                  ¥{cargo.expectedPrice}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  约 ¥{(cargo.expectedPrice / 300).toFixed(2)}/km
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-4">
              <div className="p-2 rounded-lg bg-slate-50 text-center">
                <Weight className="w-4 h-4 mx-auto text-slate-500 mb-1" />
                <p className="text-xs text-slate-600">{cargo.weight || "5"}吨</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 text-center">
                <Maximize2 className="w-4 h-4 mx-auto text-slate-500 mb-1" />
                <p className="text-xs text-slate-600">{cargo.volume || "15"}方</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 text-center">
                <Truck className="w-4 h-4 mx-auto text-slate-500 mb-1" />
                <p className="text-xs text-slate-600">{cargo.vehicleType || "厢式"}</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 text-center">
                <Clock className="w-4 h-4 mx-auto text-slate-500 mb-1" />
                <p className="text-xs text-slate-600">{cargo.distance}km</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                  {cargo.shipperName?.charAt(0) || "货"}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{cargo.shipperName || "上海顺达物流"}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    信用分 {cargo.shipperCredit || 820}
                  </p>
                </div>
              </div>
              <button className="btn-primary text-sm py-2">
                立即议价
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-16 text-center">
          <Package className="w-16 h-16 mx-auto text-slate-300" />
          <p className="mt-4 text-slate-500">暂无符合条件的货源</p>
        </div>
      )}
    </div>
  );
}
