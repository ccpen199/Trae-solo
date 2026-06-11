import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  MapPin,
  ArrowUpRight,
  Search,
  Filter,
  ChevronDown,
  BarChart3,
  LineChart,
  Package,
  Calendar,
  RefreshCw,
  Download,
  Plus,
} from "lucide-react";
import { apiClient } from "@/api/client";

export default function PricingModel() {
  const [models, setModels] = useState<any[]>([]);
  const [trend, setTrend] = useState<any>(null);
  const [selectedCargo, setSelectedCargo] = useState("普货");

  useEffect(() => {
    apiClient.get<any[]>("/admin/pricing-models").then((data) => {
      setModels(data);
      setTrend({
        labels: ["1月", "2月", "3月", "4月", "5月", "6月", "7月"],
        baseline: [3.8, 3.9, 4.0, 4.2, 4.5, 4.3, 4.6],
        actual: [3.9, 3.8, 4.1, 4.3, 4.4, 4.5, 4.7],
      });
    });
  }, []);

  const cargoTypes = ["普货", "冷链", "危险品", "大件", "快递"];
  const maxValue = 5;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">专线价格指导模型</h1>
          <p className="text-slate-500 text-sm mt-1">基于线路、货类、季节动态生成基准运价</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">
            <Download className="w-4 h-4" />
            导出报表
          </button>
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            新建模型
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "监控线路数", value: "1,286", icon: MapPin, gradient: "from-primary-500 to-orange-600", trend: "+12" },
          { label: "本周均价", value: "¥4.6/km", icon: DollarSign, gradient: "from-blue-500 to-indigo-600", trend: "+5.2%" },
          { label: "价格波动指数", value: "2.3%", icon: TrendingUp, gradient: "from-green-500 to-emerald-600", trend: "-0.8%" },
          { label: "异常运价预警", value: "23", icon: BarChart3, gradient: "from-purple-500 to-violet-600", trend: "+5" },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`stat-card bg-gradient-to-br ${stat.gradient}`} style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{stat.trend}</span>
                </div>
                <p className="text-3xl font-bold font-display">{stat.value}</p>
                <p className="text-white/70 text-sm mt-1">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-5">
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between mb-5">
          <div className="flex flex-wrap gap-2">
            {cargoTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedCargo(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCargo === type
                    ? "bg-primary-500 text-white shadow-md shadow-primary-500/30"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Package className="w-4 h-4 inline mr-1.5" />
                {type}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="搜索线路..." className="input-field pl-9 py-2 text-sm" />
            </div>
            <button className="btn-secondary py-2 text-sm">
              <Filter className="w-4 h-4" />
              筛选
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">线路</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">货类</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">基准运价</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">上周均价</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">波动</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">季节系数</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model, idx) => (
                <tr key={model.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-slate-800">{model.origin}</span>
                      <ArrowUpRight className="w-4 h-4 text-slate-400" />
                      <MapPin className="w-4 h-4 text-primary-500" />
                      <span className="font-medium text-slate-800">{model.destination}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="badge bg-slate-100 text-slate-600">{model.cargoType}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-lg font-bold text-primary-600">¥{model.basePrice}/km</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-slate-700">¥{model.lastWeekAvg}/km</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-0.5 font-medium text-sm ${
                      model.trend > 0 ? "text-red-600" : "text-green-600"
                    }`}>
                      {model.trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {Math.abs(model.trend)}%
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-orange-500 rounded-full"
                          style={{ width: `${(model.seasonFactor / 1.5) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600">{model.seasonFactor.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      调整
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-slate-800">运价趋势 - 上海→杭州</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg text-sm bg-primary-50 text-primary-600 font-medium">
                <Calendar className="w-4 h-4 inline mr-1" />
                近7天
              </button>
              <RefreshCw className="w-5 h-5 text-slate-400 cursor-pointer hover:text-primary-500" />
            </div>
          </div>
          <div className="h-64 flex items-end gap-2 p-4">
            {trend?.labels.map((label: string, idx: number) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end gap-1 h-48">
                  <div
                    className="flex-1 bg-slate-200 rounded-t-lg transition-all"
                    style={{ height: `${(trend.baseline[idx] / maxValue) * 100}%` }}
                  />
                  <div
                    className="flex-1 bg-gradient-to-t from-primary-500 to-orange-400 rounded-t-lg transition-all"
                    style={{ height: `${(trend.actual[idx] / maxValue) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500">{label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-100 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-slate-200" />
              <span className="text-sm text-slate-600">基准价</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gradient-to-r from-primary-500 to-orange-400" />
              <span className="text-sm text-slate-600">实际成交价</span>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-slate-800">热门线路运价TOP5</h3>
            <LineChart className="w-5 h-5 text-primary-500" />
          </div>
          <div className="space-y-3">
            {[
              { rank: 1, route: "上海 → 杭州", price: 4.6, change: 5.2 },
              { rank: 2, route: "上海 → 苏州", price: 3.8, change: -1.3 },
              { rank: 3, route: "上海 → 南京", price: 4.2, change: 2.8 },
              { rank: 4, route: "上海 → 宁波", price: 5.1, change: 8.5 },
              { rank: 5, route: "上海 → 无锡", price: 3.5, change: 0.5 },
            ].map((item) => (
              <div key={item.rank} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  item.rank === 1 ? "bg-amber-100 text-amber-600" :
                  item.rank === 2 ? "bg-slate-200 text-slate-600" :
                  item.rank === 3 ? "bg-orange-100 text-orange-600" :
                  "bg-slate-100 text-slate-500"
                }`}>
                  {item.rank}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{item.route}</p>
                  <p className="text-xs text-slate-500">{selectedCargo}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">¥{item.price}/km</p>
                  <p className={`text-xs ${item.change > 0 ? "text-red-600" : "text-green-600"}`}>
                    {item.change > 0 ? "+" : ""}{item.change}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
