import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shirt,
  BookOpen,
  Smartphone,
  Leaf,
  Sparkles,
  ChevronRight,
  Package,
  Recycle,
  HeartHandshake,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  {
    key: "clothes",
    label: "衣服",
    icon: Shirt,
    gradient: "from-emerald-400 to-eco-500",
    desc: "旧衣焕新",
  },
  {
    key: "books",
    label: "图书",
    icon: BookOpen,
    gradient: "from-teal-400 to-emerald-500",
    desc: "知识循环",
  },
  {
    key: "phones",
    label: "手机",
    icon: Smartphone,
    gradient: "from-cyan-400 to-teal-500",
    desc: "数码回收",
  },
];

const recentOrders = [
  { id: "RC20260615001", status: "质检中", category: "衣服", price: 45, time: "2小时前" },
  { id: "RC20260614003", status: "已打款", category: "手机", price: 1280, time: "昨天" },
];

function AnimatedNumber({ value, suffix = "", duration = 1500 }: { value: number; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let startTime: number;
    let raf: number;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased * 100) / 100);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span>
      {Number.isInteger(value) ? Math.round(display) : display.toFixed(1)}
      {suffix}
    </span>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [category, setCategory] = useState("clothes");
  const [condition, setCondition] = useState(7);

  const estimatedPrice = (() => {
    const base: Record<string, number> = { clothes: 3, books: 2, phones: 800 };
    return (base[category] * condition).toFixed(category === "phones" ? 0 : 2);
  })();

  return (
    <div className="pb-6 animate-fade-in">
      <section className="relative px-4 pt-5 pb-8 bg-gradient-to-br from-eco-500 via-eco-600 to-eco-700 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-eco-300/20 rounded-full blur-2xl" />
        <div className="relative">
          <p className="text-eco-100 text-sm">欢迎回来 👋</p>
          <h2 className="text-white text-2xl font-bold mt-1">让闲置物品 循环再生</h2>
          <div className="mt-5 flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Leaf className="w-4 h-4 text-eco-100" />
              <span className="text-white text-sm font-medium">
                累计减碳 <AnimatedNumber value={128.6} suffix=" kg" />
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-white text-sm font-medium">环保达人 Lv.5</span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 -mt-5 relative z-10">
        <div className="grid grid-cols-3 gap-3">
          {categories.map(({ key, label, icon: Icon, gradient, desc }) => (
            <button
              key={key}
              onClick={() => navigate(`/user/estimate?category=${key}`)}
              className={cn(
                "relative overflow-hidden rounded-2xl p-4 text-left text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:translate-y-0",
                "bg-gradient-to-br",
                gradient
              )}
            >
              <Icon className="w-8 h-8 mb-2 drop-shadow" strokeWidth={2} />
              <p className="font-bold text-base">{label}</p>
              <p className="text-xs text-white/80 mt-0.5">{desc}</p>
              <div className="absolute -right-3 -bottom-3 w-14 h-14 bg-white/15 rounded-full" />
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 mt-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-eco-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-eco-600" />
              </div>
              <h3 className="font-bold text-neutral-800">智能估价</h3>
            </div>
            <button
              onClick={() => navigate("/user/estimate")}
              className="text-eco-600 text-sm font-medium flex items-center gap-0.5 hover:text-eco-700"
            >
              详细估价 <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {categories.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all duration-200",
                  category === key
                    ? "bg-eco-50 border-eco-400 text-eco-700"
                    : "bg-white border-neutral-200 text-neutral-500 hover:border-eco-300"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>

          <div className="mb-1">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-600">物品成色</span>
              <span className="text-eco-600 font-semibold">{condition}/10</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={condition}
              onChange={(e) => setCondition(Number(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-eco-500"
            />
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl bg-gradient-to-r from-eco-50 to-emerald-50 border border-eco-100 p-4">
            <div>
              <p className="text-xs text-neutral-500">预估回收价</p>
              <p className="mt-1">
                <span className="text-eco-600 text-3xl font-bold">¥{estimatedPrice}</span>
                <span className="text-neutral-400 text-xs ml-1">起</span>
              </p>
            </div>
            <button
              onClick={() => navigate(`/user/estimate?category=${category}`)}
              className="btn-primary !px-5 !py-2.5 text-sm"
            >
              去估价
            </button>
          </div>
        </div>
      </section>

      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-neutral-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-eco-600" />
            最近订单
          </h3>
          <button
            onClick={() => navigate("/user/orders")}
            className="text-eco-600 text-sm font-medium flex items-center gap-0.5"
          >
            全部 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => navigate(`/user/orders/${order.id}`)}
              className="card p-4 cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">#{order.id}</p>
                  <p className="mt-1 font-semibold text-neutral-800">{order.category}回收</p>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      "badge",
                      order.status === "已打款" ? "bg-eco-100 text-eco-700" : "bg-amber-100 text-amber-700"
                    )}
                  >
                    {order.status}
                  </span>
                  <p className="mt-1.5 text-eco-600 font-bold">¥{order.price}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-neutral-100 flex justify-between text-xs text-neutral-400">
                <span>{order.time}</span>
                <span className="flex items-center text-eco-600">查看详情 <ChevronRight className="w-3.5 h-3.5" /></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 mt-6">
        <h3 className="font-bold text-neutral-800 mb-3 flex items-center gap-2">
          <Recycle className="w-5 h-5 text-eco-600" />
          我的环保贡献
        </h3>
        <div className="card p-5 bg-gradient-to-br from-eco-50 to-white">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-eco-100 flex items-center justify-center mb-2">
                <Package className="w-6 h-6 text-eco-600" />
              </div>
              <p className="text-neutral-800 text-2xl font-bold">
                <AnimatedNumber value={86.5} suffix=" kg" />
              </p>
              <p className="text-xs text-neutral-500 mt-1">累计回收</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 flex items-center justify-center mb-2">
                <Leaf className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-neutral-800 text-2xl font-bold">
                <AnimatedNumber value={128.6} suffix=" kg" />
              </p>
              <p className="text-xs text-neutral-500 mt-1">累计减碳</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 flex items-center justify-center mb-2">
                <HeartHandshake className="w-6 h-6 text-rose-500" />
              </div>
              <p className="text-neutral-800 text-2xl font-bold">
                <AnimatedNumber value={12} />
              </p>
              <p className="text-xs text-neutral-500 mt-1">捐赠次数</p>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-eco-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">环保等级</p>
                <p className="mt-0.5 font-bold text-eco-600">🌱 环保达人 Lv.5</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-400">距离 Lv.6 还差</p>
                <p className="text-sm font-semibold text-neutral-700 mt-0.5">21.4 kg</p>
              </div>
            </div>
            <div className="mt-2 h-2 rounded-full bg-eco-100 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-eco-400 to-eco-600" style={{ width: "72%" }} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
