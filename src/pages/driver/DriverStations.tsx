import { useState } from "react";
import {
  Fuel,
  ArrowLeft,
  Navigation,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Clock,
  Star,
  Car,
  CreditCard,
  BadgeCheck,
  Sparkles,
  TrendingDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Toast, Badge } from "antd-mobile";
import { useNavigate } from "react-router-dom";

interface Station {
  id: string;
  name: string;
  brand: string;
  brandColor: string;
  brandBg: string;
  distance: string;
  distanceKm: number;
  address: string;
  prices: {
    type: string;
    marketPrice: string;
    memberPrice: string;
    savePerL: number;
  }[];
  services: string[];
  rating: number;
  openTime: string;
  saveMoney: number;
  isFavorite?: boolean;
  isHot?: boolean;
  location: { x: number; y: number };
}

const stations: Station[] = [
  {
    id: "S001",
    name: "中国石化(真北路加油站)",
    brand: "中石化",
    brandColor: "#004FA3",
    brandBg: "bg-blue-600",
    distance: "2.1km",
    distanceKm: 2.1,
    address: "普陀区真北路2188号(近金沙江路)",
    prices: [
      { type: "0#柴油", marketPrice: "7.35", memberPrice: "6.88", savePerL: 0.47 },
      { type: "92#汽油", marketPrice: "7.62", memberPrice: "7.15", savePerL: 0.47 },
      { type: "95#汽油", marketPrice: "8.12", memberPrice: "7.65", savePerL: 0.47 },
    ],
    services: ["24H营业", "洗车服务", "便利店", "ETC充值"],
    rating: 4.8,
    openTime: "24小时营业",
    saveMoney: 150.4,
    isFavorite: true,
    isHot: true,
    location: { x: 28, y: 62 },
  },
  {
    id: "S002",
    name: "中国石油(江桥加油站)",
    brand: "中石油",
    brandColor: "#E60012",
    brandBg: "bg-red-600",
    distance: "3.5km",
    distanceKm: 3.5,
    address: "嘉定区江桥镇曹安公路3888号",
    prices: [
      { type: "0#柴油", marketPrice: "7.38", memberPrice: "6.95", savePerL: 0.43 },
      { type: "92#汽油", marketPrice: "7.65", memberPrice: "7.22", savePerL: 0.43 },
      { type: "95#汽油", marketPrice: "8.15", memberPrice: "7.72", savePerL: 0.43 },
    ],
    services: ["24H营业", "洗车服务", "便利店", "快速充电", "司机之家"],
    rating: 4.6,
    openTime: "24小时营业",
    saveMoney: 137.6,
    location: { x: 58, y: 35 },
  },
  {
    id: "S003",
    name: "壳牌(曹安公路站)",
    brand: "壳牌",
    brandColor: "#FFD500",
    brandBg: "bg-yellow-400",
    distance: "4.8km",
    distanceKm: 4.8,
    address: "嘉定区曹安公路4688号(东方汽配城旁)",
    prices: [
      { type: "0#柴油", marketPrice: "7.32", memberPrice: "6.82", savePerL: 0.5 },
      { type: "92#汽油", marketPrice: "7.58", memberPrice: "7.08", savePerL: 0.5 },
      { type: "95#汽油", marketPrice: "8.08", memberPrice: "7.58", savePerL: 0.5 },
    ],
    services: ["24H营业", "自动洗车", "便利店", "咖啡店"],
    rating: 4.9,
    openTime: "24小时营业",
    saveMoney: 160,
    isHot: true,
    location: { x: 72, y: 68 },
  },
  {
    id: "S004",
    name: "中海油(外环站)",
    brand: "中海油",
    brandColor: "#0066B3",
    brandBg: "bg-sky-600",
    distance: "5.6km",
    distanceKm: 5.6,
    address: "宝山区外环高速薀川路出口东200米",
    prices: [
      { type: "0#柴油", marketPrice: "7.30", memberPrice: "6.90", savePerL: 0.4 },
      { type: "92#汽油", marketPrice: "7.56", memberPrice: "7.16", savePerL: 0.4 },
      { type: "95#汽油", marketPrice: "8.06", memberPrice: "7.66", savePerL: 0.4 },
    ],
    services: ["24H营业", "便利店", "快速维修"],
    rating: 4.5,
    openTime: "24小时营业",
    saveMoney: 128,
    location: { x: 15, y: 28 },
  },
  {
    id: "S005",
    name: "道达尔(沪太路加油站)",
    brand: "道达尔",
    brandColor: "#D52B1E",
    brandBg: "bg-rose-600",
    distance: "6.2km",
    distanceKm: 6.2,
    address: "静安区沪太路1288号(近大宁路)",
    prices: [
      { type: "0#柴油", marketPrice: "7.36", memberPrice: "6.92", savePerL: 0.44 },
      { type: "92#汽油", marketPrice: "7.63", memberPrice: "7.19", savePerL: 0.44 },
      { type: "95#汽油", marketPrice: "8.13", memberPrice: "7.69", savePerL: 0.44 },
    ],
    services: ["便利店", "自动洗车", "咖啡吧", "卫生间"],
    rating: 4.7,
    openTime: "06:00 - 23:00",
    saveMoney: 140.8,
    location: { x: 45, y: 82 },
  },
];

const fuelTypes = ["全部油品", "0#柴油", "92#汽油", "95#汽油"];
const brands = ["全部品牌", "中石化", "中石油", "壳牌", "中海油", "道达尔"];
const sortOptions = [
  { key: "distance", label: "距离最近" },
  { key: "save", label: "省钱最多" },
  { key: "price", label: "价格最低" },
  { key: "rating", label: "评分最高" },
];

export default function DriverStations() {
  const navigate = useNavigate();
  const [selectedFuel, setSelectedFuel] = useState("0#柴油");
  const [selectedBrand, setSelectedBrand] = useState("全部品牌");
  const [sortBy, setSortBy] = useState("distance");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  const filteredStations = stations
    .filter((s) => selectedBrand === "全部品牌" || s.brand === selectedBrand)
    .sort((a, b) => {
      if (sortBy === "distance") return a.distanceKm - b.distanceKm;
      if (sortBy === "save") return b.saveMoney - a.saveMoney;
      if (sortBy === "price") {
        const ap = a.prices.find((p) => p.type === selectedFuel);
        const bp = b.prices.find((p) => p.type === selectedFuel);
        return Number(ap?.memberPrice || 0) - Number(bp?.memberPrice || 0);
      }
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });

  return (
    <div className="min-h-screen pb-6">
      <div className="gradient-primary pt-12 pb-5 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
            >
              <ArrowLeft size={22} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">附近优惠油站</h1>
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <Search size={20} className="text-white" />
            </button>
          </div>

          <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={16} className="text-primary-500" />
                <span className="text-sm font-medium text-gray-800">当前位置</span>
              </div>
              <div className="text-xs text-gray-500">上海市 · 嘉定区江桥镇 · 距离您附近</div>
            </div>
            <button className="px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium shadow-md active:scale-95 transition-all">
              刷新定位
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-3">
          {fuelTypes.map((fuel) => (
            <button
              key={fuel}
              onClick={() => setSelectedFuel(fuel)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedFuel === fuel
                  ? "gradient-primary text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {fuel}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 appearance-none pr-10 focus:outline-none focus:border-primary-300"
            >
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 whitespace-nowrap"
            >
              <SlidersHorizontal size={16} />
              {sortOptions.find((o) => o.key === sortBy)?.label}
              <ChevronDown size={16} className={`transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-30 animate-scale-in">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setSortBy(opt.key);
                      setShowSortMenu(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                      sortBy === opt.key
                        ? "bg-primary-50 text-primary-500 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="relative rounded-2xl overflow-hidden shadow-card h-56 map-bg">
          <div className="absolute inset-0 chart-grid opacity-60" />
          <svg className="absolute inset-0 w-full h-full opacity-30">
            <path d="M 0 120 Q 100 80 200 140 T 400 100" stroke="#FF6B1A" strokeWidth="2" fill="none" strokeDasharray="8 4" />
            <path d="M 0 180 L 400 160" stroke="#666" strokeWidth="1" fill="none" strokeDasharray="4 4" />
          </svg>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="relative">
              <div className="w-6 h-6 rounded-full bg-primary-500 border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
                <Car size={14} className="text-white fill-current" />
              </div>
              <div className="absolute -inset-3 rounded-full bg-primary-500/20 animate-ping" />
            </div>
          </div>

          {stations.map((station) => (
            <button
              key={station.id}
              onClick={() => setSelectedStation(station)}
              className="absolute z-10 -translate-x-1/2 -translate-y-full transition-transform hover:scale-110"
              style={{ left: `${station.location.x}%`, top: `${station.location.y}%` }}
            >
              <div className="relative">
                <div className={`w-10 h-10 rounded-full ${station.brandBg} shadow-lg flex items-center justify-center border-2 border-white`}>
                  <Fuel size={18} className="text-white fill-current" />
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 bg-white rounded-md shadow-md text-[10px] font-bold text-primary-500">
                  ¥{station.prices[0].memberPrice}
                </div>
                {station.isHot && (
                  <Badge
                    content={<span className="text-[9px]">🔥</span>}
                    className="!bg-red-500"
                    style={{ position: "absolute", top: -6, right: -6 }}
                  />
                )}
              </div>
            </button>
          ))}

          <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur rounded-full text-[10px] text-white flex items-center gap-1">
            <Navigation size={12} />
            共 {filteredStations.length} 个油站
          </div>

          <button className="absolute bottom-3 right-3 px-3 py-1.5 bg-white rounded-full shadow-md text-xs font-medium text-gray-700 flex items-center gap-1">
            切换视图
            <ChevronUp size={14} />
          </button>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {filteredStations.map((station, idx) => {
          const targetPrice = station.prices.find((p) => p.type === selectedFuel) || station.prices[0];
          const selected = selectedStation?.id === station.id;
          return (
            <div
              key={station.id}
              className={`glass-card rounded-2xl p-4 shadow-card transition-all duration-300 animate-slide-up ${
                selected ? "ring-2 ring-primary-400 shadow-card-hover" : ""
              }`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex gap-3 mb-3">
                <div className={`w-14 h-14 rounded-2xl ${station.brandBg} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <Fuel size={26} className="text-white fill-current" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-bold text-gray-800 text-sm truncate">{station.name}</h3>
                      {station.isHot && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-medium flex items-center gap-0.5 flex-shrink-0">
                          <Sparkles size={10} />
                          优惠
                        </span>
                      )}
                      {station.isFavorite && (
                        <Star size={12} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                      <Navigation size={12} className="text-primary-500" />
                      {station.distance}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 truncate mb-1.5">{station.address}</div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-medium text-gray-700">{station.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} />
                      {station.openTime}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
                {station.prices.map((price) => (
                  <div
                    key={price.type}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl transition-all ${
                      selectedFuel === price.type
                        ? "bg-gradient-to-br from-primary-50 to-orange-50 border border-primary-200"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="text-[10px] text-gray-500 mb-0.5">{price.type}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold gradient-money">¥{price.memberPrice}</span>
                      <span className="text-[10px] text-gray-400 line-through">¥{price.marketPrice}</span>
                    </div>
                    <div className="text-[10px] text-green-600 font-medium flex items-center gap-0.5 mt-0.5">
                      <TrendingDown size={10} />
                      省 ¥{price.savePerL}/L
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {station.services.map((svc) => (
                  <span key={svc} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {svc}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <div className="flex-1 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-gray-500 mb-0.5">按320L加满预计</div>
                    <div className="text-sm font-bold text-green-600 flex items-center gap-1">
                      <BadgeCheck size={14} />
                      省 ¥{station.saveMoney}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 mb-0.5">实付</div>
                    <div className="text-sm font-bold gradient-money">¥{(Number(targetPrice.memberPrice) * 320).toFixed(0)}</div>
                  </div>
                </div>
                <button
                  onClick={() => Toast.show({ content: "正在打开导航..." })}
                  className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 active:bg-gray-50"
                >
                  <Phone size={20} />
                </button>
                <button
                  onClick={() => Toast.show({ icon: "success", content: `已为您导航至${station.name}` })}
                  className="flex-1 py-3.5 rounded-xl gradient-primary text-white font-bold text-sm shadow-float active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  <Navigation size={18} className="fill-current" />
                  导航前往
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
