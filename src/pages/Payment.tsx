import { useState, useEffect } from "react";
import {
  CreditCard,
  Clock,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Banknote,
  X,
  Phone,
  Loader2,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

interface CardPermissions {
  balanceQuery: boolean;
  onlinePayment: boolean;
  subsidyReceive: boolean;
  refund: boolean;
  transactionHistory: boolean;
}

interface UnionCard {
  cardNo: string;
  memberName: string;
  balance: number;
  status: "pending_approval" | "active" | "rejected" | "unbound";
  statusLabel: string;
  bindDate: string;
  cardType: string;
  bankName: string;
  appliedAt: string;
  approver?: string;
  approvedAt?: string;
  rejectReason?: string;
  permissions: CardPermissions;
  applicant?: string;
}

interface UnionPayStatus {
  integrationStatus: string;
  lastHeartbeat: string;
  apiVersion: string;
  supportedFeatures: string[];
  dailyLimit: number;
  todayUsage: number;
  connectionQuality: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  merchant: string;
  date: string;
  balance: number;
  status: "success" | "failed" | "pending";
}

interface ToastData {
  id: number;
  message: string;
  type: "success" | "info" | "warning";
}

const featureLabels: Record<string, string> = {
  query_balance: "余额查询",
  payment: "在线支付",
  refund: "退款处理",
  transaction_history: "交易记录",
};

const typeLabels: Record<string, string> = {
  voucher_redeem: "福利核销",
  points_exchange: "积分兑换",
  subsidy: "工会补贴",
  payment: "服务支付",
  refund: "退款",
};

const typeIcons: Record<string, React.ElementType> = {
  voucher_redeem: ArrowUpRight,
  points_exchange: ArrowDownRight,
  subsidy: ArrowDownRight,
  payment: ArrowUpRight,
  refund: ArrowDownRight,
};

const txnStatusLabels: Record<string, string> = {
  success: "成功",
  failed: "失败",
  pending: "处理中",
};

const permissionLabels: Record<keyof CardPermissions, string> = {
  balanceQuery: "余额查询",
  onlinePayment: "在线支付",
  subsidyReceive: "补贴接收",
  refund: "退款操作",
  transactionHistory: "交易记录",
};

const bankOptions = [
  "中国工商银行",
  "中国建设银行",
  "中国农业银行",
  "中国银行",
  "交通银行",
  "招商银行",
  "中国邮政储蓄银行",
];

const applySteps = [
  { step: 1, label: "提交申请" },
  { step: 2, label: "银行核验" },
  { step: 3, label: "工会复核" },
];

const apiBaseUrl = import.meta.env.VITE_API_URL || "";

const fallbackCard: UnionCard = {
  cardNo: "6212********1234",
  memberName: "李明远",
  balance: 1280.5,
  status: "active",
  statusLabel: "已激活",
  bindDate: "2024-03-15",
  cardType: "工会服务卡",
  bankName: "中国工商银行",
  appliedAt: "2024-03-12 09:30:00",
  approver: "服务运营中心",
  approvedAt: "2024-03-14 15:20:00",
  permissions: {
    balanceQuery: true,
    onlinePayment: true,
    subsidyReceive: true,
    refund: true,
    transactionHistory: true,
  },
};

const fallbackUnionPayStatus: UnionPayStatus = {
  integrationStatus: "connected",
  lastHeartbeat: "2026-06-10 22:50:00",
  apiVersion: "v2.1",
  supportedFeatures: ["query_balance", "payment", "refund", "transaction_history"],
  dailyLimit: 50000,
  todayUsage: 3589,
  connectionQuality: "excellent",
};

const fallbackTransactions: Transaction[] = [
  { id: "txn-1", type: "voucher_redeem", amount: -500, description: "春节慰问金核销", merchant: "XX超市", date: "2025-02-05 14:30:00", balance: 1280.5, status: "success" },
  { id: "txn-2", type: "points_exchange", amount: 0, description: "积分兑换-品牌保温杯", merchant: "积分商城", date: "2025-01-28 10:15:00", balance: 1780.5, status: "success" },
  { id: "txn-3", type: "subsidy", amount: 1000, description: "困难职工帮扶金到账", merchant: "工会补贴", date: "2025-03-05 09:00:00", balance: 2080.5, status: "success" },
  { id: "txn-4", type: "payment", amount: -89, description: "体检套餐支付", merchant: "XX健康体检中心", date: "2025-04-10 16:45:00", balance: 1991.5, status: "success" },
];

export default function Payment() {
  const [card, setCard] = useState<UnionCard | null>(null);
  const [unionPayStatus, setUnionPayStatus] = useState<UnionPayStatus | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const [applyForm, setApplyForm] = useState({
    cardNo: "",
    bankName: bankOptions[0],
    memberName: "",
    idLast6: "",
  });
  const [applySubmitting, setApplySubmitting] = useState(false);

  const addToast = (message: string, type: "success" | "info" | "warning" = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const fetchCard = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/payment/card?memberId=M001`);
      const json = await res.json();
      setCard(json.success ? json.data : fallbackCard);
    } catch {
      setCard(fallbackCard);
    }
  };

  const fetchUnionPayStatus = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/payment/unionpay/status`);
      const json = await res.json();
      setUnionPayStatus(json.success ? json.data : fallbackUnionPayStatus);
    } catch {
      setUnionPayStatus(fallbackUnionPayStatus);
    }
  };

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`${apiBaseUrl}/api/payment/transactions${query}`);
      const json = await res.json();
      setTransactions(json.success ? json.data : fallbackTransactions);
    } catch {
      setTransactions(fallbackTransactions);
    }
  };

  const refreshAll = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    else setLoading(true);
    try {
      await Promise.all([fetchCard(), fetchUnionPayStatus(), fetchTransactions()]);
      if (showToast && card) {
        addToast(`数据已刷新，最新卡审核状态：${card.statusLabel}`, "success");
      } else if (showToast) {
        addToast("数据已刷新", "success");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const submitApply = async () => {
    if (!applyForm.cardNo || !applyForm.bankName || !applyForm.memberName || !applyForm.idLast6) {
      addToast("请填写完整的申请信息", "warning");
      return;
    }
    if (applyForm.cardNo.length < 16) {
      addToast("请输入正确的银行卡号", "warning");
      return;
    }
    if (applyForm.idLast6.length !== 6) {
      addToast("请输入身份证号后6位", "warning");
      return;
    }
    setApplySubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/payment/card/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applyForm),
      });
      const json = await res.json();
      if (json.success) {
        addToast(json.message, "success");
        await fetchCard();
        setApplyForm({ cardNo: "", bankName: bankOptions[0], memberName: "", idLast6: "" });
      } else {
        addToast(json.message || "提交失败", "warning");
      }
    } catch {
      addToast("网络错误，请稍后重试", "warning");
    } finally {
      setApplySubmitting(false);
    }
  };

  const cancelApply = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/payment/card/apply-cancel`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        addToast(json.message, "info");
        await fetchCard();
      }
    } catch {}
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, statusFilter, startDate, endDate]);

  const statusIndicator = (status: string) => {
    if (status === "connected") return <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />;
    if (status === "degraded") return <span className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />;
    return <span className="w-3 h-3 rounded-full bg-red-500" />;
  };

  const txnStatusColor = (status: string) => {
    if (status === "success") return "text-green-600 bg-green-50";
    if (status === "failed") return "text-red-600 bg-red-50";
    return "text-yellow-600 bg-yellow-50";
  };

  const cardActive = card?.status === "active";
  const showConflictBanner = card && unionPayStatus && unionPayStatus.integrationStatus === "connected" && !cardActive;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="animate-spin text-union-red" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {card?.status === "pending_approval" && (
            <div className="rounded-xl border border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 p-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Clock size={20} className="text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-yellow-800">工会卡审核中，预计1-3个工作日完成</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    申请人：{card.applicant}，提交时间：{card.appliedAt}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs font-medium text-gray-600 mb-2">审核进度</p>
                <div className="flex items-center gap-1">
                  {applySteps.map((s, idx) => {
                    const isDone = s.step <= 2;
                    const isCurrent = s.step === 3;
                    return (
                      <div key={s.step} className="flex items-center flex-1">
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                            isDone && "bg-green-500 text-white",
                            isCurrent && "bg-union-red text-white animate-pulse",
                            !isDone && !isCurrent && "bg-gray-200 text-gray-500"
                          )}
                        >
                          {isDone ? <CheckCircle2 size={14} /> : s.step}
                        </div>
                        <span
                          className={cn(
                            "text-xs ml-1.5",
                            isDone || isCurrent ? "text-gray-700" : "text-gray-400"
                          )}
                        >
                          {s.label}
                        </span>
                        {idx < applySteps.length - 1 && (
                          <div
                            className={cn(
                              "flex-1 h-0.5 mx-1",
                              isDone ? "bg-green-400" : "bg-gray-200"
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white/60 p-3">
                  <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-green-500" />
                    当前可用权限
                  </p>
                  <ul className="space-y-1">
                    {Object.entries(card.permissions)
                      .filter(([, v]) => v)
                      .map(([k]) => (
                        <li key={k} className="text-xs text-gray-700 flex items-center gap-1.5">
                          <CheckCircle2 size={10} className="text-green-500 flex-shrink-0" />
                          {permissionLabels[k as keyof CardPermissions]}
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="rounded-lg bg-white/60 p-3">
                  <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <XCircle size={12} className="text-red-500" />
                    暂不可用权限
                  </p>
                  <ul className="space-y-1">
                    {Object.entries(card.permissions)
                      .filter(([, v]) => !v)
                      .map(([k]) => (
                        <li key={k} className="text-xs text-gray-700 flex items-center gap-1.5">
                          <XCircle size={10} className="text-red-500 flex-shrink-0" />
                          {permissionLabels[k as keyof CardPermissions]}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {card?.status === "rejected" && (
            <div className="rounded-xl border border-red-300 bg-gradient-to-r from-red-50 to-rose-50 p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <XCircle size={20} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-red-800">申请已驳回</h4>
                  <p className="text-sm text-red-700 mt-1">驳回原因：{card.rejectReason}</p>
                  {card.approver && (
                    <p className="text-xs text-red-600 mt-1">审核人：{card.approver}，{card.approvedAt}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="card bg-gradient-to-br from-union-red to-union-red-dark text-white">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard size={24} />
              <h3 className="text-lg font-bold">工会服务卡</h3>
              {card && card.status !== "unbound" && (
                <StatusBadge
                  status={
                    card.status === "active"
                      ? "active"
                      : card.status === "pending_approval"
                      ? "pending"
                      : "rejected"
                  }
                />
              )}
            </div>
            {card ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xl tracking-widest">{card.cardNo}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-white/70">卡类型</p>
                    <p className="font-medium">{card.cardType}</p>
                  </div>
                  <div>
                    <p className="text-white/70">开户银行</p>
                    <p className="font-medium">{card.bankName}</p>
                  </div>
                  <div>
                    <p className="text-white/70">持卡人</p>
                    <p className="font-medium">{card.memberName}</p>
                  </div>
                  <div>
                    <p className="text-white/70">账户余额</p>
                    <p className="font-bold text-xl font-serif">¥{card.balance.toFixed(2)}</p>
                  </div>
                  {card.status !== "unbound" && (
                    <>
                      <div>
                        <p className="text-white/70">绑定日期</p>
                        <p className="font-medium">{card.bindDate}</p>
                      </div>
                      <div>
                        <p className="text-white/70">卡状态</p>
                        <p className="font-medium">{card.statusLabel}</p>
                      </div>
                    </>
                  )}
                </div>

                {card.status === "pending_approval" && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={cancelApply}
                      className="flex-1 py-2 px-4 rounded-lg bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition-colors"
                    >
                      撤回申请
                    </button>
                    <button className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition-colors">
                      <Phone size={14} />
                      联系客服
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-white/80 text-sm">暂无卡信息</p>
            )}
          </div>

          {card?.status === "unbound" && (
            <div className="card border border-dashed border-gray-300 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-4">
                <Banknote size={20} className="text-union-red" />
                <h3 className="text-lg font-bold">绑定工会服务卡</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">银行卡号</label>
                  <input
                    type="text"
                    value={applyForm.cardNo}
                    onChange={(e) => setApplyForm({ ...applyForm, cardNo: e.target.value.replace(/\D/g, "") })}
                    className="input-field"
                    placeholder="请输入银行卡号"
                    maxLength={19}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开户银行</label>
                  <select
                    value={applyForm.bankName}
                    onChange={(e) => setApplyForm({ ...applyForm, bankName: e.target.value })}
                    className="input-field"
                  >
                    {bankOptions.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">持卡人姓名</label>
                  <input
                    type="text"
                    value={applyForm.memberName}
                    onChange={(e) => setApplyForm({ ...applyForm, memberName: e.target.value })}
                    className="input-field"
                    placeholder="请输入真实姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">身份证号后6位</label>
                  <input
                    type="text"
                    value={applyForm.idLast6}
                    onChange={(e) => setApplyForm({ ...applyForm, idLast6: e.target.value.replace(/\D/g, "") })}
                    className="input-field"
                    placeholder="请输入身份证号后6位"
                    maxLength={6}
                  />
                </div>
                <button
                  onClick={submitApply}
                  disabled={applySubmitting}
                  className="w-full py-2.5 rounded-lg bg-union-red hover:bg-union-red-dark text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {applySubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  {applySubmitting ? "提交中..." : "提交绑定申请"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {showConflictBanner && (
            <div className="rounded-xl border border-orange-300 bg-gradient-to-r from-orange-50 to-red-50 p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-orange-100 flex-shrink-0">
                  <AlertTriangle size={20} className="text-orange-600" />
                </div>
                <div>
                  <h4 className="font-bold text-orange-800">
                    ⚠️ 银联通道已连接，但您的工会卡尚未激活
                  </h4>
                  <p className="text-sm text-orange-700 mt-1">
                    在线支付、退款等功能暂不可用。请等待工会审核完成。
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-white/60 p-3 space-y-2">
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    您可以执行以下操作
                  </p>
                  <ul className="text-xs text-gray-600 space-y-0.5 ml-5 list-disc">
                    <li>查看银联集成状态及连接健康度</li>
                    <li>查询历史交易记录</li>
                    <li>查看账户余额</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-red-700 mb-1 flex items-center gap-1">
                    <XCircle size={12} />
                    以下操作暂时受限
                  </p>
                  <ul className="text-xs text-gray-600 space-y-0.5 ml-5 list-disc">
                    <li>发起新的在线支付</li>
                    <li>申请退款操作</li>
                    <li>接收工会补贴到账</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Shield size={24} className="text-union-red" />
              <h3 className="text-lg font-bold">银联对接状态</h3>
            </div>
            {unionPayStatus && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {statusIndicator(unionPayStatus.integrationStatus)}
                    <span className="text-sm font-medium">
                      {unionPayStatus.integrationStatus === "connected" ? "已连接" : "未连接"}
                    </span>
                    {showConflictBanner && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                        通道受限
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">API {unionPayStatus.apiVersion}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">支持功能</p>
                  <div className="flex flex-wrap gap-2">
                    {unionPayStatus.supportedFeatures.map((f) => (
                      <span
                        key={f}
                        className={cn(
                          "px-2 py-1 text-xs rounded-full font-medium",
                          showConflictBanner && (f === "payment" || f === "refund")
                            ? "bg-gray-100 text-gray-400 line-through"
                            : "bg-union-red/10 text-union-red"
                        )}
                      >
                        {featureLabels[f] || f}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">每日限额</p>
                    <p className="font-medium font-serif">¥{unionPayStatus.dailyLimit.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">今日已用</p>
                    <p className="font-medium font-serif">¥{unionPayStatus.todayUsage.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock size={12} />
                  <span>最近心跳: {unionPayStatus.lastHeartbeat}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold">交易记录</h3>
            <button
              onClick={() => refreshAll(true)}
              disabled={refreshing}
              className={cn(
                "p-1.5 rounded-lg text-gray-500 hover:text-union-red hover:bg-union-red/10 transition-colors",
                refreshing && "opacity-50 cursor-not-allowed"
              )}
              title="刷新数据"
            >
              <RefreshCw size={16} className={cn(refreshing && "animate-spin")} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input-field w-auto text-sm"
              >
                <option value="">全部类型</option>
                {Object.entries(typeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field w-auto text-sm"
              >
                <option value="">全部状态</option>
                {Object.entries(txnStatusLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field w-auto text-sm"
                placeholder="开始日期"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field w-auto text-sm"
                placeholder="结束日期"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">日期</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">类型</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">描述</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">金额</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">余额</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">商户</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">状态</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => {
                const TypeIcon = typeIcons[txn.type] || ArrowUpRight;
                const isDebit = txn.amount < 0;
                return (
                  <tr key={txn.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-600">{txn.date.slice(0, 10)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <TypeIcon size={14} className={isDebit ? "text-red-500" : "text-green-500"} />
                        <span>{typeLabels[txn.type] || txn.type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{txn.description}</td>
                    <td className={cn("py-3 px-4 text-right font-medium font-serif", isDebit ? "text-red-600" : "text-green-600")}>
                      {isDebit ? "-" : "+"}¥{Math.abs(txn.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-serif text-gray-700">¥{txn.balance.toFixed(2)}</td>
                    <td className="py-3 px-4 text-gray-600">{txn.merchant}</td>
                    <td className="py-3 px-4">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", txnStatusColor(txn.status))}>
                        {txnStatusLabels[txn.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Search size={32} className="mx-auto mb-2 opacity-50" />
                    <p>暂无交易记录</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium animate-[fadeIn_0.2s_ease-out]",
              toast.type === "success" && "bg-green-600 text-white",
              toast.type === "warning" && "bg-orange-600 text-white",
              toast.type === "info" && "bg-gray-800 text-white"
            )}
          >
            {toast.type === "success" && <CheckCircle2 size={16} />}
            {toast.type === "warning" && <AlertTriangle size={16} />}
            {toast.type === "info" && <X size={16} />}
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
