import { useState } from "react";
import { MainLayout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { useAppStore } from "@/store/useAppStore";
import { mockWithdrawalLimit } from "@/data/mockData";
import {
  Wallet,
  Banknote,
  Clock,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  CreditCard,
  ShieldCheck,
  FileText,
  Plus,
  ChevronRight,
  Download,
  Filter,
  Calendar,
  Info,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Lock,
  Smartphone,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionType } from "@/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const earningsData = [
  { date: "06-09", income: 250, withdrawal: 100 },
  { date: "06-10", income: 180, withdrawal: 0 },
  { date: "06-11", income: 320, withdrawal: 200 },
  { date: "06-12", income: 150, withdrawal: 0 },
  { date: "06-13", income: 420, withdrawal: 300 },
  { date: "06-14", income: 280, withdrawal: 150 },
  { date: "06-15", income: 190, withdrawal: 500 },
];

type TabKey = "overview" | "withdraw" | "transactions" | "settings";

export default function WalletPage() {
  const { currentExecutor, transactions } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [txFilter, setTxFilter] = useState<"all" | TransactionType>("all");

  const filteredTransactions = transactions.filter(
    (t) => t.userId === currentExecutor.id || t.userType === "executor"
  );

  const displayedTransactions =
    txFilter === "all"
      ? filteredTransactions
      : filteredTransactions.filter((t) => t.type === txFilter);

  const tabs = [
    { key: "overview" as TabKey, label: "资产总览", icon: Wallet },
    { key: "withdraw" as TabKey, label: "提现", icon: Banknote },
    { key: "transactions" as TabKey, label: "交易流水", icon: FileText },
    { key: "settings" as TabKey, label: "账户设置", icon: Building2 },
  ];

  return (
    <MainLayout title="结算钱包" subtitle={`${currentExecutor.name} 的钱包`}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  isActive
                    ? "bg-cyber-cyan-500/15 text-cyber-cyan-400 border border-cyber-cyan-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-5">
              <StatCard
                title="账户总收益"
                value={`¥${currentExecutor.totalEarnings.toLocaleString()}`}
                icon={<TrendingUp className="w-6 h-6" />}
                trend={12.5}
                trendLabel="本月"
                accentColor="#00E676"
              />
              <StatCard
                title="可提现余额"
                value={`¥${currentExecutor.availableBalance.toFixed(2)}`}
                icon={<Wallet className="w-6 h-6" />}
                subtitle="实时到账"
                accentColor="#FFB800"
              />
              <StatCard
                title="审核冻结中"
                value={`¥${currentExecutor.frozenBalance.toFixed(2)}`}
                icon={<Clock className="w-6 h-6" />}
                subtitle="24小时内解冻"
                accentColor="#00F0FF"
              />
              <StatCard
                title="累计提现"
                value={`¥${(
                  currentExecutor.totalEarnings -
                  currentExecutor.availableBalance -
                  currentExecutor.frozenBalance
                ).toFixed(2)}`}
                icon={<ArrowDownCircle className="w-6 h-6" />}
                accentColor="#FF9100"
              />
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-white">收益走势</h3>
                  <p className="text-sm text-gray-500 mt-1">近7天收入与提现对比</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-success-500" />
                    <span className="text-gray-400">收入</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-warning-500" />
                    <span className="text-gray-400">提现</span>
                  </span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={earningsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0A1628",
                        border: "1px solid rgba(0,240,255,0.2)",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#00E676"
                      fill="url(#colorIncome)"
                      name="收入(元)"
                    />
                    <Area
                      type="monotone"
                      dataKey="withdrawal"
                      stroke="#FF9100"
                      fill="url(#colorWithdraw)"
                      name="提现(元)"
                    />
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00E676" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00E676" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorWithdraw" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF9100" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FF9100" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-medium text-white mb-4">快捷操作</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "立即提现", icon: ArrowDownCircle, color: "#FFB800", onClick: () => setActiveTab("withdraw") },
                    { label: "充值余额", icon: Plus, color: "#00E676", onClick: () => {} },
                    { label: "交易记录", icon: FileText, color: "#00F0FF", onClick: () => setActiveTab("transactions") },
                    { label: "银行卡管理", icon: CreditCard, color: "#FF9100", onClick: () => setActiveTab("settings") },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={item.onClick}
                        className="p-4 rounded-xl bg-deep-space-800/50 border border-white/5 hover:border-cyber-cyan-500/20 transition-all flex flex-col items-center gap-2"
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${item.color}15`, color: item.color }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm text-white">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-medium text-white mb-4">税务信息</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-deep-space-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-gold-500/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-amber-gold-400" />
                      </div>
                      <div>
                        <p className="text-sm text-white">劳务报酬个税</p>
                        <p className="text-xs text-gray-500">本月已代扣</p>
                      </div>
                    </div>
                    <p className="text-amber-gold-400 font-medium">¥40.00</p>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-deep-space-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyber-cyan-500/10 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-cyber-cyan-400" />
                      </div>
                      <div>
                        <p className="text-sm text-white">税务说明</p>
                        <p className="text-xs text-gray-500">税率 20% 起征</p>
                      </div>
                    </div>
                    <button className="text-cyber-cyan-400 text-sm flex items-center gap-1">
                      查看详情
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-cyber-cyan-500/5 border border-cyber-cyan-500/20">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-cyber-cyan-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-400 leading-relaxed">
                        根据《个人所得税法》，劳务报酬所得按次计征，
                        平台将依法代扣代缴个人所得税。
                        年度终了后可进行个税汇算清缴。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "withdraw" && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 glass-card p-6">
                <h3 className="text-lg font-medium text-white mb-6">申请提现</h3>

                <div className="mb-6">
                  <label className="text-sm text-gray-400 block mb-3">提现至银行卡</label>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-deep-space-700 to-deep-space-800 border border-white/10 flex items-center gap-4 cursor-pointer hover:border-cyber-cyan-500/30 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {currentExecutor.bankType || "请绑定银行卡"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {currentExecutor.bankAccount || "尚未绑定银行二类户"}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-sm text-gray-400 block mb-3">提现金额</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-medium text-amber-gold-400">
                      ¥
                    </span>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="input-field pl-10 pr-24 text-2xl font-mono font-medium text-white py-4"
                    />
                    <button
                      onClick={() => setWithdrawAmount(currentExecutor.availableBalance.toString())}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-cyber-cyan-400 hover:text-cyber-cyan-300"
                    >
                      全部提现
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    可提现余额：
                    <span className="text-amber-gold-400">
                      ¥{currentExecutor.availableBalance.toFixed(2)}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-6">
                  {[100, 500, 1000, 2000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setWithdrawAmount(amount.toString())}
                      className={cn(
                        "py-2.5 rounded-lg text-sm font-medium transition-all border",
                        withdrawAmount === amount.toString()
                          ? "bg-cyber-cyan-500/15 text-cyber-cyan-400 border-cyber-cyan-500/30"
                          : "text-gray-400 border-white/10 hover:border-cyber-cyan-500/20"
                      )}
                    >
                      ¥{amount}
                    </button>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-warning-500/5 border border-warning-500/20 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-white">今日提现额度</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        今日剩余额度：
                        <span className="text-warning-500">
                          ¥{mockWithdrawalLimit.remainingLimit.toFixed(2)}
                        </span>{" "}
                        / ¥{mockWithdrawalLimit.dailyLimit}
                      </p>
                      <div className="progress-bar mt-3">
                        <div
                          className="h-full bg-gradient-to-r from-warning-500 to-amber-gold-500"
                          style={{
                            width: `${(mockWithdrawalLimit.todayWithdrawn / mockWithdrawalLimit.dailyLimit) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  className="btn-gold w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认提现
                </button>

                <p className="text-xs text-gray-600 text-center mt-4">
                  预计 24 小时内到账 · 最低提现 ¥{mockWithdrawalLimit.minWithdrawal}
                </p>
              </div>

              <div className="space-y-6">
                <div className="glass-card p-5">
                  <h4 className="text-white font-medium mb-4">提现须知</h4>
                  <ul className="space-y-3 text-sm text-gray-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                      支持银行二类户绑定
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                      单笔最低提现 ¥10 起
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                      单日限额 ¥2,000
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                      劳务个税自动代扣
                    </li>
                  </ul>
                </div>

                <div className="glass-card p-5">
                  <h4 className="text-white font-medium mb-4">最近提现记录</h4>
                  <div className="space-y-3">
                    {transactions
                      .filter((t) => t.type === "withdrawal")
                      .slice(0, 3)
                      .map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-warning-500/10 flex items-center justify-center">
                              <ArrowUpCircle className="w-4 h-4 text-warning-500" />
                            </div>
                            <div>
                              <p className="text-sm text-white truncate max-w-[120px]">{tx.description}</p>
                              <p className="text-xs text-gray-600">
                                {new Date(tx.createdAt).toLocaleDateString("zh-CN")}
                              </p>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              tx.status === "completed" && "text-success-500",
                              tx.status === "processing" && "text-warning-500",
                              tx.status === "failed" && "text-danger-500"
                            )}
                          >
                            {tx.status === "completed" && "到账"}
                            {tx.status === "processing" && "处理中"}
                            {tx.status === "failed" && "失败"}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {[
                  { key: "all" as const, label: "全部" },
                  { key: "reward" as const, label: "任务奖励" },
                  { key: "withdrawal" as const, label: "提现" },
                  { key: "tax" as const, label: "个税" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setTxFilter(item.key)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      txFilter === item.key
                        ? "bg-cyber-cyan-500/15 text-cyber-cyan-400 border border-cyber-cyan-500/30"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button className="btn-secondary text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  选择日期
                </button>
                <button className="btn-secondary text-sm flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  导出
                </button>
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="table-header">交易类型</th>
                    <th className="table-header">描述</th>
                    <th className="table-header">金额</th>
                    <th className="table-header">状态</th>
                    <th className="table-header">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTransactions.map((tx) => {
                    const isPositive = tx.amount > 0;
                    const StatusIcon =
                      tx.status === "completed"
                        ? CheckCircle2
                        : tx.status === "processing"
                        ? Clock
                        : XCircle;
                    return (
                      <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center",
                                isPositive ? "bg-success-500/10" : "bg-warning-500/10"
                              )}
                            >
                              {isPositive ? (
                                <ArrowDownCircle className="w-4.5 h-4.5 text-success-500" />
                              ) : (
                                <ArrowUpCircle className="w-4.5 h-4.5 text-warning-500" />
                              )}
                            </div>
                            <span className="text-white text-sm">
                              {tx.type === "reward" && "任务奖励"}
                              {tx.type === "withdrawal" && "提现"}
                              {tx.type === "tax" && "个税代扣"}
                              {tx.type === "refund" && "退款"}
                              {tx.type === "deposit" && "充值"}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell text-gray-400 text-sm max-w-xs truncate">
                          {tx.description}
                        </td>
                        <td className="table-cell">
                          <span
                            className={cn(
                              "font-mono font-medium",
                              isPositive ? "text-success-500" : "text-warning-500"
                            )}
                          >
                            {isPositive ? "+" : ""}
                            ¥{Math.abs(tx.amount).toFixed(2)}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span
                            className={cn(
                              "tag text-xs inline-flex items-center gap-1",
                              tx.status === "completed" && "tag-green",
                              tx.status === "processing" && "tag-orange",
                              tx.status === "failed" && "tag-red",
                              tx.status === "pending" && "tag-orange"
                            )}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {tx.status === "completed" && "已完成"}
                            {tx.status === "processing" && "处理中"}
                            {tx.status === "failed" && "失败"}
                            {tx.status === "pending" && "待处理"}
                          </span>
                        </td>
                        <td className="table-cell text-gray-500 text-sm">
                          {new Date(tx.createdAt).toLocaleString("zh-CN", { hour12: false })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-medium text-white mb-6">银行卡管理</h3>

              {currentExecutor.bankAccount ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-gradient-to-br from-deep-space-700 to-deep-space-800 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{currentExecutor.bankType}</p>
                          <p className="text-sm text-gray-500">{currentExecutor.bankAccount}</p>
                        </div>
                      </div>
                      <span className="tag tag-green">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        已验证
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="btn-secondary flex-1 text-sm">更换银行卡</button>
                    <button className="btn-danger text-sm">解除绑定</button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center">
                  <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 mb-2">尚未绑定银行卡</p>
                  <p className="text-sm text-gray-600 mb-4">绑定银行二类户即可提现</p>
                  <button className="btn-primary text-sm">立即绑定</button>
                </div>
              )}
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-medium text-white mb-6">安全设置</h3>
              <div className="space-y-4">
                {[
                  { label: "实名认证", desc: "已完成实名认证", status: "success", icon: ShieldCheck },
                  { label: "支付密码", desc: "用于提现验证身份", status: "warning", icon: Lock },
                  { label: "手机验证", desc: "手机号 136****1234", status: "success", icon: Smartphone },
                  { label: "邮箱绑定", desc: "接收重要通知", status: "info", icon: Mail },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-4 rounded-xl bg-deep-space-800/30 hover:bg-deep-space-800/50 border border-white/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-cyber-cyan-500/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-cyber-cyan-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "tag text-xs",
                            item.status === "success" && "tag-green",
                            item.status === "warning" && "tag-orange",
                            item.status === "info" && "tag-cyan"
                          )}
                        >
                          {item.status === "success" && "已设置"}
                          {item.status === "warning" && "未设置"}
                          {item.status === "info" && "未绑定"}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
