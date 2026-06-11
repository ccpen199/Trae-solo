import { useState, useEffect } from "react";
import { Zap, Timer, Truck, Info, Tag, BarChart3 } from "lucide-react";

type DiscountLevel = "mild" | "moderate" | "urgent";
type DeliveryStatus = "可配送" | "筋斗云已接单" | "配送中" | "已送达";

interface ExpiringProduct {
  id: number;
  name: string;
  originalPrice: number;
  discountPrice: number;
  level: DiscountLevel;
  remainingTime: number;
  stock: number;
  totalStock: number;
  image: string;
  deliveryStatus: DeliveryStatus;
  triggerRule: string;
}

const products: ExpiringProduct[] = [
  { id: 1, name: "元气森林白桃味", originalPrice: 5.5, discountPrice: 4.4, level: "mild", remainingTime: 86400 * 3 + 7200, stock: 45, totalStock: 60, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Genki+forest+peach+sparkling+water+bottle&image_size=square", deliveryStatus: "配送中", triggerRule: "剩余3天2小时 → 触发8折规则" },
  { id: 2, name: "良品铺子坚果混合装", originalPrice: 29.9, discountPrice: 14.9, level: "moderate", remainingTime: 86400 + 14400, stock: 12, totalStock: 40, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Mixed+nuts+snack+bag+premium&image_size=square", deliveryStatus: "可配送", triggerRule: "剩余1天4小时 → 触发5折规则" },
  { id: 3, name: "云南白药牙膏", originalPrice: 15.8, discountPrice: 4.7, level: "urgent", remainingTime: 3600 * 5, stock: 3, totalStock: 30, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Toothpaste+tube+oral+care+product&image_size=square", deliveryStatus: "可配送", triggerRule: "剩余5小时 → 触发3折规则" },
  { id: 4, name: "乐事薯片大包装", originalPrice: 12.9, discountPrice: 10.3, level: "mild", remainingTime: 86400 * 2 + 36000, stock: 38, totalStock: 50, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Lays+potato+chips+large+bag&image_size=square", deliveryStatus: "筋斗云已接单", triggerRule: "剩余2天10小时 → 触发8折规则" },
  { id: 5, name: "蒙牛纯甄酸奶6连杯", originalPrice: 18, discountPrice: 9, level: "moderate", remainingTime: 86400 * 1 + 28800, stock: 8, totalStock: 25, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Yogurt+6+cup+pack+dairy&image_size=square", deliveryStatus: "可配送", triggerRule: "剩余1天8小时 → 触发5折规则" },
  { id: 6, name: "百草味牛肉干", originalPrice: 25.9, discountPrice: 7.8, level: "urgent", remainingTime: 3600 * 2, stock: 2, totalStock: 20, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Beef+jerky+snack+pack+Chinese&image_size=square", deliveryStatus: "已送达", triggerRule: "剩余2小时 → 触发3折规则" },
  { id: 7, name: "雀巢速溶咖啡条装", originalPrice: 16, discountPrice: 8, level: "moderate", remainingTime: 86400 * 1 + 43200, stock: 15, totalStock: 35, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Instant+coffee+stick+pack+sachet&image_size=square", deliveryStatus: "配送中", triggerRule: "剩余1天12小时 → 触发5折规则" },
  { id: 8, name: "士力架巧克力", originalPrice: 8.5, discountPrice: 6.8, level: "mild", remainingTime: 86400 * 3 + 18000, stock: 28, totalStock: 45, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Snickers+chocolate+bar+candy&image_size=square", deliveryStatus: "可配送", triggerRule: "剩余3天5小时 → 触发8折规则" },
];

const levelConfig: Record<DiscountLevel, { label: string; color: string; bg: string; badge: string }> = {
  mild: { label: "8折", color: "text-[#FFC857]", bg: "bg-[#FFC857]/10", badge: "bg-[#FFC857]" },
  moderate: { label: "5折", color: "text-[#FF6B35]", bg: "bg-[#FF6B35]/10", badge: "bg-[#FF6B35]" },
  urgent: { label: "3折", color: "text-[#E63946]", bg: "bg-[#E63946]/10", badge: "bg-[#E63946]" },
};

const deliveryColor: Record<DeliveryStatus, string> = {
  "可配送": "text-green-600 bg-green-50",
  "筋斗云已接单": "text-blue-600 bg-blue-50",
  "配送中": "text-orange-600 bg-orange-50",
  "已送达": "text-teal-600 bg-teal-50",
};

function formatTime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}天${h}时${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  if (h > 0) return `${h}时${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function StoreExpiring() {
  const [timers, setTimers] = useState<Record<number, number>>(
    Object.fromEntries(products.map((p) => [p.id, p.remainingTime]))
  );
  const [filter, setFilter] = useState<"all" | DiscountLevel>("all");
  const [bannerTime, setBannerTime] = useState(7938);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const next = { ...prev };
        for (const key in next) { if (next[key] > 0) next[key] -= 1; }
        return next;
      });
      setBannerTime((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const filtered = products
    .filter((p) => filter === "all" || p.level === filter)
    .sort((a, b) => (timers[a.id] ?? 0) - (timers[b.id] ?? 0));

  const totalExpiring = products.length;
  const totalDiscounted = products.filter((p) => p.discountPrice < p.originalPrice).length;
  const avgDiscount = Math.round(
    products.reduce((sum, p) => sum + (p.discountPrice / p.originalPrice) * 100, 0) / products.length
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#E63946] to-[#FF6B35] px-4 py-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-[#FFC857] fill-[#FFC857]" />
          <h1 className="text-white text-lg font-bold">临期特价专区</h1>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-[#FFC857]" />
              <span className="text-white text-sm font-medium">闪购倒计时</span>
            </div>
            <p className="text-white/70 text-[10px] mt-1">智能定价引擎自动降价，越临期越便宜</p>
          </div>
          <div className="flex gap-1">
            {String(Math.floor(bannerTime / 3600)).padStart(2, "0").split("").map((c, i) => (
              <span key={i} className="bg-white/30 text-white font-mono font-bold text-lg px-1.5 py-0.5 rounded">{c}</span>
            ))}
            <span className="text-white/60 self-center text-sm mx-0.5">:</span>
            {String(Math.floor((bannerTime % 3600) / 60)).padStart(2, "0").split("").map((c, i) => (
              <span key={i + 2} className="bg-white/30 text-white font-mono font-bold text-lg px-1.5 py-0.5 rounded">{c}</span>
            ))}
            <span className="text-white/60 self-center text-sm mx-0.5">:</span>
            {String(bannerTime % 60).padStart(2, "0").split("").map((c, i) => (
              <span key={i + 4} className="bg-white/30 text-white font-mono font-bold text-lg px-1.5 py-0.5 rounded">{c}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-2.5 flex items-center gap-2 bg-[#1B3A5C]/5 rounded-b-xl">
        <BarChart3 className="w-3.5 h-3.5 text-[#1B3A5C]" />
        <span className="text-[11px] text-[#1B3A5C]">
          今日临期商品 <b>{totalExpiring}</b> 件 | 已自动降价 <b>{totalDiscounted}</b> 件 | 平均折扣 <b>{avgDiscount}%</b>
        </span>
      </div>

      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-1.5 mb-2">
          <Info className="w-3.5 h-3.5 text-[#FF6B35]" />
          <span className="text-xs font-medium text-[#FF6B35]">触发规则说明</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="text-[10px] px-2 py-1 rounded-full bg-[#FFC857]/10 text-[#B8860B] font-medium">距到期≤3天→8折</span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] font-medium">≤1天→5折</span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-[#E63946]/10 text-[#E63946] font-medium">≤6小时→3折</span>
        </div>
      </div>

      <div className="px-4 py-3 flex gap-2 overflow-x-auto">
        {(["all", "mild", "moderate", "urgent"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filter === f
                ? "bg-[#1B3A5C] text-white"
                : f === "all" ? "bg-gray-100 text-gray-500"
                : `${levelConfig[f].bg} ${levelConfig[f].color}`
            }`}
          >
            {f === "all" ? "全部" : levelConfig[f].label + "区"}
          </button>
        ))}
      </div>

      <div className="px-4 pb-6 space-y-3">
        {filtered.map((product) => {
          const remaining = timers[product.id] ?? 0;
          const cfg = levelConfig[product.level];
          const stockPct = (product.stock / product.totalStock) * 100;
          return (
            <div key={product.id} className="bg-white rounded-2xl p-3 shadow-sm flex gap-3 hover:shadow-md transition-shadow">
              <div className="relative shrink-0">
                <img src={product.image} alt={product.name} className="w-24 h-24 rounded-xl object-cover" />
                <span className={`absolute top-1 left-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </div>
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h3 className="text-sm font-semibold text-[#1B3A5C] truncate">{product.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[10px] font-mono bg-[#E63946]/10 text-[#E63946] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Timer className="w-2.5 h-2.5" /> {formatTime(remaining)}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${deliveryColor[product.deliveryStatus]}`}>
                      <Truck className="w-2.5 h-2.5 inline mr-0.5" />{product.deliveryStatus}
                    </span>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#FF6B35] shrink-0" />
                  <span className="text-[10px] text-[#FF6B35] truncate">{product.triggerRule}</span>
                </div>
                <div className="flex items-end justify-between mt-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-gray-400 line-through">¥{product.originalPrice}</span>
                    <span className="text-lg font-bold text-[#E63946]">¥{product.discountPrice}</span>
                  </div>
                  <button className="px-3 py-1.5 bg-[#FF6B35] text-white text-xs rounded-full font-bold hover:bg-[#e55e2e] transition shadow-sm shadow-[#FF6B35]/30">
                    立即抢购
                  </button>
                </div>
                <div className="mt-1.5">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mb-0.5">
                    <span>剩余库存</span>
                    <span>{product.stock}/{product.totalStock}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        stockPct < 20 ? "bg-[#E63946]" : stockPct < 50 ? "bg-[#FF6B35]" : "bg-[#2EC4B6]"
                      }`}
                      style={{ width: `${stockPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
