import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PackageSearch,
  Eye,
  PenLine,
  RotateCcw,
  Package,
  Search,
  SlidersHorizontal,
} from "lucide-react";

type OrderStatus =
  | "pending_pickup"
  | "inspecting"
  | "pending_confirm"
  | "completed"
  | "returning"
  | "all";

interface Order {
  id: string;
  orderNo: string;
  productName: string;
  brand: string;
  model: string;
  thumbnail: string;
  status: Exclude<OrderStatus, "all">;
  estimatedPrice: number;
  createTime: string;
  actions: ("view" | "sign" | "return")[];
}

const statusTabs: { key: OrderStatus; label: string; count?: number }[] = [
  { key: "pending_pickup", label: "待上门", count: 2 },
  { key: "inspecting", label: "检测中", count: 3 },
  { key: "pending_confirm", label: "待确认", count: 1 },
  { key: "completed", label: "已完成", count: 8 },
  { key: "returning", label: "退货中", count: 1 },
  { key: "all", label: "全部", count: 15 },
];

const statusBadgeMap: Record<Exclude<OrderStatus, "all">, { label: string; color: string }> = {
  pending_pickup: { label: "待上门", color: "bg-amberLux-500/15 text-amberLux-500 ring-amberLux-500/30" },
  inspecting: { label: "检测中", color: "bg-forest-500/15 text-forest-400 ring-forest-500/30" },
  pending_confirm: { label: "待确认估价", color: "bg-gold-500/15 text-gold-500 ring-gold-500/30" },
  completed: { label: "已完成", color: "bg-jade-500/15 text-jade-400 ring-jade-500/30" },
  returning: { label: "退货中", color: "bg-coral-500/15 text-coral-400 ring-coral-500/30" },
};

const mockOrders: Order[] = [
  {
    id: "1",
    orderNo: "RS202606150001",
    productName: "经典款手提包",
    brand: "Hermès",
    model: "Birkin 30 Epsom",
    thumbnail:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20Hermes%20Birkin%20bag%20togo%20leather%20on%20dark%20background%20product%20photography&image_size=square",
    status: "pending_confirm",
    estimatedPrice: 128000,
    createTime: "2026-06-14 14:30",
    actions: ["view", "sign"],
  },
  {
    id: "2",
    orderNo: "RS202606130004",
    productName: "自动机械腕表",
    brand: "Rolex",
    model: "Submariner Date 126610LN",
    thumbnail:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Rolex%20Submariner%20watch%20luxury%20timepiece%20black%20dial%20product%20photography&image_size=square",
    status: "inspecting",
    estimatedPrice: 86500,
    createTime: "2026-06-13 10:15",
    actions: ["view"],
  },
  {
    id: "3",
    orderNo: "RS202606120012",
    productName: "经典邮差包",
    brand: "Louis Vuitton",
    model: "Pochette Métis Monogram",
    thumbnail:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Louis%20Vuitton%20Pochette%20Metis%20bag%20monogram%20canvas%20luxury%20product%20photo&image_size=square",
    status: "pending_pickup",
    estimatedPrice: 15800,
    createTime: "2026-06-12 16:45",
    actions: ["view"],
  },
  {
    id: "4",
    orderNo: "RS202605280023",
    productName: "羊皮链条包",
    brand: "Chanel",
    model: "Classic Flap Medium Lambskin",
    thumbnail:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chanel%20Classic%20Flap%20bag%20black%20lambskin%20quilted%20gold%20hardware%20product%20shot&image_size=square",
    status: "completed",
    estimatedPrice: 68000,
    createTime: "2026-05-28 09:20",
    actions: ["view", "return"],
  },
  {
    id: "5",
    orderNo: "RS202606100008",
    productName: "黄金戒指",
    brand: "Cartier",
    model: "LOVE Ring Yellow Gold",
    thumbnail:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cartier%20LOVE%20ring%20yellow%20gold%20jewelry%20luxury%20product%20photography%20black%20background&image_size=square",
    status: "returning",
    estimatedPrice: 12800,
    createTime: "2026-06-10 11:30",
    actions: ["view"],
  },
];

export default function UserOrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = mockOrders.filter((order) => {
    const matchTab = activeTab === "all" || order.status === activeTab;
    const matchSearch =
      !searchQuery ||
      order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.productName.includes(searchQuery) ||
      order.brand.includes(searchQuery);
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-100">我的订单</h1>
          <p className="mt-1 text-sm text-ink-400">管理您的所有回收订单，查看检测进度和估价结果</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-gold-500/15 bg-ink-900 px-3 py-2 w-full sm:w-64">
            <Search className="h-4 w-4 text-ink-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="订单号 / 商品..."
              className="flex-1 bg-transparent text-sm text-ink-100 placeholder-ink-500 outline-none"
            />
          </div>
          <button className="rounded-xl border border-gold-500/15 bg-ink-900 p-2 text-ink-300 hover:border-gold-500/30 hover:text-gold-500 transition-colors">
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-gold-500/10 bg-ink-900 p-2"
      >
        <div className="flex flex-wrap gap-1">
          {statusTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-gold-500/15 to-transparent text-gold-400 ring-1 ring-gold-500/30"
                    : "text-ink-300 hover:bg-ink-800 hover:text-ink-100"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      isActive ? "bg-gold-500/20 text-gold-400" : "bg-ink-700 text-ink-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="orders-tab-indicator"
                    className="absolute inset-x-3 -bottom-2 h-0.5 bg-gradient-to-r from-gold-400 to-forest-400 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {filteredOrders.length > 0 ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {filteredOrders.map((order, i) => {
              const badge = statusBadgeMap[order.status];
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="group relative overflow-hidden rounded-2xl border border-gold-500/15 bg-ink-900 p-5 transition-all hover:border-gold-500/30 hover:shadow-gold-sm"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />

                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    <div className="flex gap-4 min-w-0">
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-gold-500/15 bg-ink-800">
                        <img
                          src={order.thumbnail}
                          alt={order.productName}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 to-transparent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gold-500 tracking-wider">
                              {order.brand}
                            </p>
                            <h3 className="mt-0.5 truncate font-display text-lg font-bold text-ink-100">
                              {order.model}
                            </h3>
                            <p className="mt-1 text-sm text-ink-400">{order.productName}</p>
                          </div>
                          <span
                            className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink-400">
                          <span>订单号：{order.orderNo}</span>
                          <span>提交：{order.createTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between lg:ml-auto lg:min-w-[320px]">
                      <div className="rounded-xl bg-gold-500/5 px-4 py-3 border border-gold-500/10">
                        <p className="text-xs text-ink-400">当前估价</p>
                        <p className="mt-1 font-display text-xl font-bold gold-text">
                          ¥{order.estimatedPrice.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {order.actions.includes("view") && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-ink-800 px-4 py-2.5 text-sm font-medium text-ink-200 transition-colors hover:border-gold-500/30 hover:text-gold-500"
                          >
                            <Eye className="h-4 w-4" />
                            查看详情
                          </motion.button>
                        )}
                        {order.actions.includes("sign") && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-2.5 text-sm font-semibold text-ink-950 shadow-gold-sm hover:from-gold-400 hover:to-gold-500 transition-all"
                          >
                            <PenLine className="h-4 w-4" />
                            签署协议
                          </motion.button>
                        )}
                        {order.actions.includes("return") && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-1.5 rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-2.5 text-sm font-medium text-coral-400 transition-colors hover:bg-coral-500/20"
                          >
                            <RotateCcw className="h-4 w-4" />
                            申请退货
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-gold-500/15 bg-ink-900/40"
          >
            <div className="relative mb-4">
              <div className="h-20 w-20 rounded-full bg-gold-500/5 flex items-center justify-center">
                <PackageSearch className="h-10 w-10 text-gold-500/60" />
              </div>
              <div className="absolute inset-0 rounded-full bg-forest-500/10 animate-pulse-slow" />
            </div>
            <h3 className="text-lg font-semibold text-ink-200">暂无订单</h3>
            <p className="mt-1 text-sm text-ink-400">该状态下暂无订单记录，去首页挑选商品吧</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-forest-500 to-forest-600 px-5 py-2.5 text-sm font-semibold text-ink-100 shadow-gold-sm"
            >
              <Package className="h-4 w-4" />
              立即估价回收
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
