import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coffee,
  ShoppingBag,
  Car,
  PlayCircle,
  ShoppingCart,
  Hamburger,
  Headphones,
  Airplane,
  Robot,
  ShieldCheck,
  Hamburger as Sandwich,
  Train,
  Star,
  Fire,
  MagnifyingGlass,
  X,
  Coins,
  Wallet,
  Check,
} from "@phosphor-icons/react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  Coffee, ShoppingBag, Car, PlayCircle, ShoppingCart, Hamburger, Headphones, Airplane, Vacuum: Robot, ShieldCheck, Sandwich, Train,
};

const categories = ["全部", "餐饮美食", "生活服务", "旅行出行", "数码家电", "金融服务"];

const categoryColors: Record<string, string> = {
  "餐饮美食": "bg-gold-400/15 text-gold-300 border-gold-400/30",
  "生活服务": "bg-insurance/15 text-insurance border-insurance/30",
  "旅行出行": "bg-airline/15 text-airline border-airline/30",
  "数码家电": "bg-telecom/15 text-telecom border-telecom/30",
  "金融服务": "bg-bank/15 text-bank border-bank/30",
};

type SortKey = "default" | "points" | "rating" | "stock";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "default", label: "默认" },
  { key: "points", label: "积分" },
  { key: "rating", label: "评分" },
  { key: "stock", label: "库存" },
];

interface SplitItem {
  source: string;
  amount: number;
  color: string;
}

function generateSplits(totalPoints: number): SplitItem[] {
  const sources = [
    { source: "太平洋保险积分", color: "text-insurance" },
    { source: "招商银行积分", color: "text-bank" },
    { source: "南方航空里程", color: "text-airline" },
    { source: "中国移动积分", color: "text-telecom" },
  ];
  const weights = [0.35, 0.3, 0.2, 0.15];
  return sources.map((s, i) => ({
    source: s.source,
    amount: Math.round(totalPoints * weights[i]),
    color: s.color,
  }));
}

export default function Market() {
  const market = useAppStore((s) => s.market);
  const [activeCategory, setActiveCategory] = useState("全部");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = market;
    if (activeCategory !== "全部") list = list.filter((b) => b.category === activeCategory);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b) => b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q));
    }
    if (sortKey === "points") list = [...list].sort((a, b) => a.points - b.points);
    else if (sortKey === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    else if (sortKey === "stock") list = [...list].sort((a, b) => b.stock - a.stock);
    return list;
  }, [market, activeCategory, search, sortKey]);

  const selectedBenefit = market.find((b) => b.id === selectedId);

  return (
    <div className="min-h-screen p-6 relative z-10">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-bold gold-gradient-text font-display">权益兑换市场</h1>
          <p className="text-gray-400 mt-2 text-sm">跨平台积分融合 · 权益自由兑换 · 实时核销</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4 mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs border transition-all",
                    activeCategory === cat
                      ? "bg-gold-400/20 text-gold-200 border-gold-400/40"
                      : "bg-space-800/40 text-gray-400 border-gold-400/10 hover:border-gold-400/25 hover:text-gray-200"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="relative">
              <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索权益..."
                className="input-field pl-8 py-1.5 text-xs w-48"
              />
            </div>
            <div className="flex items-center gap-1 bg-space-800/40 rounded-lg border border-gold-400/10 p-0.5">
              {sortOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSortKey(opt.key)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs transition-all",
                    sortKey === opt.key ? "bg-gold-400/20 text-gold-200" : "text-gray-400 hover:text-gray-200"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => {
              const Icon = iconMap[item.icon] || Coffee;
              const catColor = categoryColors[item.category] || "bg-gray-500/15 text-gray-300 border-gray-500/30";
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-card p-4 flex flex-col relative group hover:border-gold-400/30 transition-colors"
                >
                  {item.isHot && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-risk/15 border border-risk/30 text-risk text-[10px]">
                      <Fire size={10} weight="fill" />热门
                    </div>
                  )}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-gold-400/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={22} className="text-gold-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-gray-100 truncate">{item.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                    </div>
                  </div>
                  <span className={cn("inline-flex self-start items-center px-2 py-0.5 rounded text-[10px] border mb-3", catColor)}>
                    {item.category}
                  </span>
                  <div className="divider-line mb-3" />
                  <div className="flex items-center gap-4 text-xs mb-3">
                    <div className="flex items-center gap-1">
                      <Coins size={13} className="text-gold-400" />
                      <span className="font-mono text-gold-300">{item.points.toLocaleString()}</span>
                      <span className="text-gray-500">积分</span>
                    </div>
                    {item.cash > 0 && (
                      <div className="flex items-center gap-1">
                        <Wallet size={13} className="text-bank" />
                        <span className="font-mono text-bank">¥{item.cash}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs mb-4">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-warn" weight="fill" />
                      <span className="text-gray-300">{item.rating}</span>
                    </div>
                    <span className="text-gray-500">库存 {item.stock.toLocaleString()}</span>
                  </div>
                  <div className="mt-auto">
                    <button
                      onClick={() => setSelectedId(item.id)}
                      className="w-full btn-gold text-xs py-2 flex items-center justify-center gap-1.5"
                    >
                      立即兑换
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-12 text-center text-gray-500 text-sm">
            暂无匹配的权益商品
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {selectedBenefit && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-space-900 to-space-800 border-t border-gold-400/20 z-50 max-h-[70vh] overflow-y-auto"
            >
              <div className="max-w-2xl mx-auto p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold gold-gradient-text">兑换确认</h3>
                  <button onClick={() => setSelectedId(null)} className="p-1.5 rounded hover:bg-gold-400/10 text-gray-400 hover:text-gray-200 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="glass-card p-4 mb-4">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = iconMap[selectedBenefit.icon] || Coffee;
                      return (
                        <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center">
                          <Icon size={24} className="text-gold-300" />
                        </div>
                      );
                    })()}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-100">{selectedBenefit.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{selectedBenefit.description}</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Coins size={16} className="text-gold-400" />
                    <span className="text-sm font-medium text-gold-100">积分拆分方案</span>
                  </div>
                  <div className="space-y-2">
                    {generateSplits(selectedBenefit.points).map((s) => (
                      <div key={s.source} className="flex items-center justify-between p-2.5 rounded-lg bg-space-800/50 border border-gold-400/5">
                        <span className="text-xs text-gray-400">{s.source}</span>
                        <span className={cn("text-sm font-mono", s.color)}>{s.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-4 mb-5">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">积分合计</span>
                      <span className="text-sm font-mono text-gold-300">{selectedBenefit.points.toLocaleString()}</span>
                    </div>
                    {selectedBenefit.cash > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">现金抵扣</span>
                        <span className="text-sm font-mono text-bank">¥{selectedBenefit.cash}</span>
                      </div>
                    )}
                    <div className="divider-line" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-200">总计</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gold-300">{selectedBenefit.points.toLocaleString()} 积分</span>
                        {selectedBenefit.cash > 0 && <span className="text-sm font-mono text-bank">+ ¥{selectedBenefit.cash}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full btn-gold flex items-center justify-center gap-2 py-2.5"
                >
                  <Check size={16} />确认兑换
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
