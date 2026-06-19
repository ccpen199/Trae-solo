import {
  Package,
  Scale,
  Wallet,
  Users,
  Clock,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import { mockAnalytics } from "@/data/mockData";

const statCards = [
  {
    label: "总订单数",
    value: mockAnalytics.overview.totalOrders,
    suffix: "单",
    icon: Package,
    gradient: "from-eco-500 to-eco-600",
    trend: "+12.5%",
  },
  {
    label: "累计回收量",
    value: mockAnalytics.overview.totalRecycledKg,
    suffix: "kg",
    icon: Scale,
    gradient: "from-teal-500 to-emerald-600",
    trend: "+8.3%",
  },
  {
    label: "累计打款",
    value: mockAnalytics.overview.totalPayout,
    suffix: "元",
    icon: Wallet,
    gradient: "from-cyan-500 to-teal-600",
    trend: "+15.2%",
  },
  {
    label: "活跃用户",
    value: mockAnalytics.overview.activeUsers,
    suffix: "人",
    icon: Users,
    gradient: "from-emerald-500 to-green-600",
    trend: "+6.8%",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map(({ label, value, suffix, icon: Icon, gradient, trend }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-neutral-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-neutral-800">
                  {value.toLocaleString()}
                  <span className="text-base font-normal text-neutral-400 ml-1">{suffix}</span>
                </p>
              </div>
              <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center", gradient)}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-eco-600">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-sm font-medium">{trend}</span>
              <span className="text-xs text-neutral-400 ml-1">较上周</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-neutral-800">待处理任务</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-neutral-800">待质检订单</p>
                  <p className="text-xs text-neutral-500">需要尽快处理</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-amber-600">{mockAnalytics.overview.pendingQualityOrders}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-rose-50 border border-rose-100">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-rose-600" />
                <div>
                  <p className="font-medium text-neutral-800">待打款订单</p>
                  <p className="text-xs text-neutral-500">用户等待收款</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-rose-600">{mockAnalytics.overview.pendingPayouts}</span>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-neutral-800 mb-4">快捷入口</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "质检管理", to: "/admin/quality" },
              { label: "定价管理", to: "/admin/pricing" },
              { label: "打款管理", to: "/admin/payout" },
              { label: "物流管理", to: "/admin/logistics" },
              { label: "处理商", to: "/admin/processors" },
              { label: "数据统计", to: "/admin/analytics" },
            ].map(({ label, to }) => (
              <a
                key={to}
                href={to}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-neutral-50 hover:bg-eco-50 hover:text-eco-700 transition-all duration-200 text-neutral-600"
              >
                <span className="text-sm font-medium">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: unknown[]) {
  return inputs.filter(Boolean).join(" ");
}
