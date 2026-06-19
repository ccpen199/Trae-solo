import { Search, Filter, RefreshCw } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: "待打款", className: "bg-amber-100 text-amber-700" },
  processing: { label: "打款中", className: "bg-blue-100 text-blue-700" },
  success: { label: "打款成功", className: "bg-eco-100 text-eco-700" },
  failed: { label: "打款失败", className: "bg-rose-100 text-rose-700" },
};

const methodMap: Record<string, string> = {
  wechat_wallet: "微信钱包",
  bank_card: "银行卡",
};

export default function Payout() {
  const payouts = useStore((s) => s.payouts);
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-neutral-500">今日打款笔数</p>
          <p className="mt-1 text-2xl font-bold text-neutral-800">
            {payouts.filter((p) => p.status === "success").length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-neutral-500">今日打款金额</p>
          <p className="mt-1 text-2xl font-bold text-eco-600">
            ¥{payouts.filter((p) => p.status === "success").reduce((s, p) => s + p.amount, 0).toFixed(2)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-neutral-500">待处理</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {payouts.filter((p) => p.status === "pending" || p.status === "processing").length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-neutral-500">异常</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">
            {payouts.filter((p) => p.status === "failed").length}
          </p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input type="text" placeholder="搜索订单号/用户..." className="input-base pl-10" />
          </div>
          <button className="btn-secondary !py-2.5 !px-4">
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </button>
          <button className="btn-secondary !py-2.5 !px-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-th">打款单号</th>
              <th className="table-th">关联订单</th>
              <th className="table-th">用户ID</th>
              <th className="table-th">金额</th>
              <th className="table-th">方式</th>
              <th className="table-th">账户信息</th>
              <th className="table-th">状态</th>
              <th className="table-th">时间</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout) => (
              <tr key={payout.id} className="hover:bg-neutral-50">
                <td className="table-td font-mono text-sm">{payout.id}</td>
                <td className="table-td font-mono text-sm">{payout.orderId}</td>
                <td className="table-td font-mono text-sm">{payout.userId}</td>
                <td className="table-td font-semibold text-eco-600">¥{payout.amount.toFixed(2)}</td>
                <td className="table-td">{methodMap[payout.method]}</td>
                <td className="table-td">
                  <p className="font-medium">{payout.accountInfo.accountName}</p>
                  <p className="text-xs text-neutral-500">{payout.accountInfo.accountNumber}</p>
                </td>
                <td className="table-td">
                  <span className={cn("badge", statusMap[payout.status].className)}>
                    {statusMap[payout.status].label}
                  </span>
                </td>
                <td className="table-td text-neutral-500 text-sm">
                  {payout.paidAt || payout.createdAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
