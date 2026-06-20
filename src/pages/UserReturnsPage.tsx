import { motion } from "framer-motion";
import { ArrowLeftRight, Truck, PackageCheck, Wallet, CheckCircle2, FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatusTimeline, { type TimelineStep } from "@/components/StatusTimeline";

interface ReturnOrder {
  id: string;
  orderNo: string;
  returnNo: string;
  productName: string;
  brand: string;
  model: string;
  thumbnail: string;
  refundAmount: number;
  expectedDate: string;
  status: "pending" | "picked_up" | "inspecting" | "refunding" | "completed";
  currentStep: number;
}

const statusBadgeMap: Record<ReturnOrder["status"], { label: string; color: string }> = {
  pending: { label: "申请中", color: "bg-amberLux-500/15 text-amberLux-500 ring-amberLux-500/30" },
  picked_up: { label: "快递已取件", color: "bg-forest-500/15 text-forest-400 ring-forest-500/30" },
  inspecting: { label: "质检中", color: "bg-gold-500/15 text-gold-500 ring-gold-500/30" },
  refunding: { label: "退款中", color: "bg-jade-500/15 text-jade-400 ring-jade-500/30" },
  completed: { label: "退款完成", color: "bg-jade-500/15 text-jade-400 ring-jade-500/30" },
};

const returnSteps: TimelineStep[] = [
  { label: "提交退货申请", icon: FileText },
  { label: "快递上门取件", icon: Truck },
  { label: "仓库质检复核", icon: PackageCheck },
  { label: "退款处理中", icon: Wallet },
  { label: "退款到账完成", icon: CheckCircle2 },
];

const mockReturns: ReturnOrder[] = [
  {
    id: "1",
    orderNo: "RS202606100008",
    returnNo: "RT202606150003",
    productName: "黄金戒指",
    brand: "Cartier",
    model: "LOVE Ring Yellow Gold",
    thumbnail:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cartier%20LOVE%20ring%20yellow%20gold%20jewelry%20luxury%20product%20black%20background&image_size=square",
    refundAmount: 12800,
    expectedDate: "2026-06-22",
    status: "inspecting",
    currentStep: 2,
  },
  {
    id: "2",
    orderNo: "RS202605180045",
    returnNo: "RT202606120001",
    productName: "经典邮差包",
    brand: "Dior",
    model: "Saddle Bag Medium",
    thumbnail:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Dior%20Saddle%20bag%20medium%20blue%20oblique%20jacquard%20luxury%20product%20photography&image_size=square",
    refundAmount: 28500,
    expectedDate: "2026-06-20",
    status: "refunding",
    currentStep: 3,
  },
  {
    id: "3",
    orderNo: "RS202604200078",
    returnNo: "RT202605100005",
    productName: "羊毛围巾",
    brand: "Burberry",
    model: "Classic Check Cashmere",
    thumbnail:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Burberry%20classic%20check%20cashmere%20scarf%20beige%20luxury%20fashion%20product&image_size=square",
    refundAmount: 3800,
    expectedDate: "2026-05-18",
    status: "completed",
    currentStep: 5,
  },
];

export default function UserReturnsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-100">退货履约中心</h1>
          <p className="mt-1 text-sm text-ink-400">跟踪退货进度，实时查看退款状态</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/user/return/apply")}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-gold-sm hover:from-gold-400 hover:to-gold-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          发起新退货
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid gap-4 sm:grid-cols-4"
      >
        {[
          { label: "进行中", value: 1, icon: Truck, color: "text-gold-500" },
          { label: "待取件", value: 1, icon: ArrowLeftRight, color: "text-amberLux-500" },
          { label: "本月退款", value: 3, valueSuffix: "笔", icon: Wallet, color: "text-jade-400" },
          { label: "累计退款", value: 45100, prefix: "¥", icon: CheckCircle2, color: "text-forest-400" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.05 }}
              className="rounded-2xl border border-gold-500/10 bg-ink-900 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-ink-400">{stat.label}</p>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="mt-2 font-display text-2xl font-bold text-ink-100">
                {stat.prefix ?? ""}
                {stat.value.toLocaleString()}
                {stat.valueSuffix ?? ""}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="space-y-5">
        {mockReturns.map((ret, i) => {
          const badge = statusBadgeMap[ret.status];
          return (
            <motion.div
              key={ret.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="relative overflow-hidden rounded-2xl border border-gold-500/15 bg-ink-900"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
              <div className="p-6">
                <div className="flex flex-col gap-5 lg:flex-row">
                  <div className="flex gap-4 min-w-0 lg:min-w-[340px]">
                    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-gold-500/15 bg-ink-800">
                      <img src={ret.thumbnail} alt={ret.productName} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 to-transparent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gold-500 tracking-wider">{ret.brand}</p>
                          <h3 className="mt-0.5 truncate font-display text-lg font-bold text-ink-100">
                            {ret.model}
                          </h3>
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-xs text-ink-400">
                        <p>原订单：{ret.orderNo}</p>
                        <p>退货单号：{ret.returnNo}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4">
                        <div>
                          <p className="text-[11px] text-ink-500">退款金额</p>
                          <p className="font-display text-lg font-bold gold-text">
                            ¥{ret.refundAmount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-500">预计到账</p>
                          <p className="text-sm font-semibold text-ink-200">{ret.expectedDate}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 rounded-xl border border-white/[0.06] bg-ink-850 p-4">
                    <StatusTimeline steps={returnSteps} currentIndex={ret.currentStep} variant="horizontal" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
