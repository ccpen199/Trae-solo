import { useEffect, useState } from "react";
import {
  Search,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Droplets,
  Zap,
  Flame,
  Thermometer,
  Phone,
  Landmark,
  FileText,
  TrendingUp,
  FileCheck,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  Undo2,
  Scale,
  CheckSquare,
  Smartphone,
  Wallet,
  Loader2,
  X,
  Plus,
  Trash2,
  Download,
  Banknote,
  Shield,
  ChevronRight,
  Wifi,
} from "lucide-react";
import { useApi, apiFetch } from "@/utils/api";
import { formatMoney, formatDate } from "@/utils/format";

interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface Bill {
  id: string;
  accountNo: string;
  category: string;
  categoryName: string;
  amount: number;
  period: string;
  dueDate: string;
  status: "unpaid" | "paid" | "overdue";
  daysLeft: number;
  canDeduct: boolean;
}

interface BillDetailItem {
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface FundFlowStep {
  step: number;
  title: string;
  amount: number;
  status: "pending" | "success" | "failed";
  time: string;
  description: string;
}

interface Invoice {
  invoiceNo: string;
  amount: number;
  issueDate: string;
  status: "issued" | "pending" | "void";
  downloadUrl: string;
}

interface ProcessTrail {
  time: string;
  action: string;
  operator: string;
  remark: string;
}

interface FailureInfo {
  rootCause: string;
  errorCode: string;
  suggestions: string[];
}

interface PaymentRecordDetail {
  id: string;
  category: string;
  categoryName: string;
  amount: number;
  status: "success" | "failed" | "processing";
  paidAt: string;
  method: string;
  accountNo: string;
  period: string;
  billDetails: BillDetailItem[];
  fundFlow: FundFlowStep[];
  invoice: Invoice | null;
  processTrail: ProcessTrail[];
  failureInfo?: FailureInfo;
}

interface PaymentRecord {
  id: string;
  category: string;
  amount: number;
  status: "success" | "failed" | "processing";
  paidAt: string;
  method: string;
}

interface PayMethod {
  id: string;
  name: string;
  icon: typeof CreditCard;
  description: string;
}

interface PayResult {
  orderNo: string;
  amount: number;
  payTime: string;
  payMethod: string;
  success: boolean;
}

const ICON_MAP: Record<string, typeof Droplets> = {
  water: Droplets,
  electricity: Zap,
  gas: Flame,
  heating: Thermometer,
  communication: Phone,
  social: Landmark,
  broadband: Wifi,
};

const PAY_METHODS: PayMethod[] = [
  { id: "wechat", name: "微信支付", icon: Smartphone, description: "微信快捷支付" },
  { id: "alipay", name: "支付宝", icon: Wallet, description: "支付宝安全支付" },
  { id: "bank", name: "银行卡", icon: CreditCard, description: "储蓄卡/信用卡支付" },
  { id: "ecard", name: "Ⅱ类户", icon: Banknote, description: "电子账户支付" },
  { id: "auto", name: "开通自动代扣", icon: RefreshCw, description: "每月自动扣款" },
];

const DEFAULT_ACCOUNT_NO = "10086888";

export default function PaymentCenter() {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [accountNo, setAccountNo] = useState(DEFAULT_ACCOUNT_NO);
  const [tab, setTab] = useState<"pay" | "records">("pay");
  const { data: categories } = useApi<Category[]>("/api/payment/categories");
  const [bills, setBills] = useState<Bill[]>([]);
  const { data: records } = useApi<PaymentRecord[]>("/api/payment/records");
  const [searching, setSearching] = useState(false);

  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set());
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPayMethod, setSelectedPayMethod] = useState("wechat");
  const [paying, setPaying] = useState(false);
  const [payResult, setPayResult] = useState<PayResult | null>(null);

  const [detailModal, setDetailModal] = useState<{
    show: boolean;
    record: PaymentRecordDetail | null;
    loading: boolean;
  }>({ show: false, record: null, loading: false });
  const [detailTab, setDetailTab] = useState<"bill" | "fund" | "invoice" | "trail">("bill");

  const [correctionForm, setCorrectionForm] = useState<{
    show: boolean;
    accountNo: string;
    amount: string;
    reason: string;
  }>({ show: false, accountNo: "", amount: "", reason: "" });

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" }>({
    show: false,
    message: "",
    type: "info",
  });

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [correctionTarget, setCorrectionTarget] = useState<PaymentRecord | PaymentRecordDetail | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  const loadBills = async (nextAccountNo: string) => {
    const normalizedAccountNo = nextAccountNo.trim();
    if (!normalizedAccountNo) return;
    setSearching(true);
    try {
      const data = await apiFetch<Bill[]>(`/api/payment/bills/${normalizedAccountNo}`);
      setBills(data);
      setSelectedBills(data.length > 0 ? new Set([data[0].id]) : new Set());
    } finally {
      setSearching(false);
    }
  };

  const searchBills = async () => {
    await loadBills(accountNo);
  };

  useEffect(() => {
    void loadBills(DEFAULT_ACCOUNT_NO);
  }, []);

  const toggleBillSelect = (billId: string) => {
    const newSelected = new Set(selectedBills);
    if (newSelected.has(billId)) {
      newSelected.delete(billId);
    } else {
      newSelected.add(billId);
    }
    setSelectedBills(newSelected);
  };

  const selectAllBills = () => {
    if (selectedBills.size === bills.length) {
      setSelectedBills(new Set());
    } else {
      setSelectedBills(new Set(bills.map((b) => b.id)));
    }
  };

  const removeBillFromSelection = (billId: string) => {
    const newSelected = new Set(selectedBills);
    newSelected.delete(billId);
    setSelectedBills(newSelected);
  };

  const getSelectedBillsData = () => {
    return bills.filter((b) => selectedBills.has(b.id));
  };

  const getTotalAmount = () => {
    return getSelectedBillsData().reduce((sum, b) => sum + b.amount, 0);
  };

  const openDetailModal = async (recordId: string) => {
    setDetailModal({ show: true, record: null, loading: true });
    try {
      const data = await apiFetch<PaymentRecordDetail>(`/api/payment/records/${recordId}`);
      setDetailModal({ show: true, record: data, loading: false });
    } catch {
      setDetailModal({ show: true, record: null, loading: false });
      showToast("获取详情失败", "error");
    }
  };

  const closeDetailModal = () => {
    setDetailModal({ show: false, record: null, loading: false });
    setDetailTab("bill");
    setCorrectionForm({ show: false, accountNo: "", amount: "", reason: "" });
  };

  const handleRetry = async (recordId?: string) => {
    const id = recordId || detailModal.record?.id;
    if (!id) return;
    setActionLoading("retry");
    try {
      await apiFetch(`/api/payment/records/${id}/retry`, { method: "POST" });
      showToast("重新发起成功，请等待处理结果");
    } catch {
      showToast("操作失败，请重试", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenCorrection = (record: PaymentRecord | PaymentRecordDetail) => {
    setCorrectionTarget(record);
    setCorrectionForm({
      show: true,
      accountNo: (record as PaymentRecordDetail).accountNo || "",
      amount: String(record.amount || ""),
      reason: "",
    });
    if (!detailModal.show) {
      openDetailModal(record.id);
    }
  };

  const handleCorrectionSubmit = async () => {
    const targetId = correctionTarget?.id || detailModal.record?.id;
    if (!targetId || !correctionForm.accountNo || !correctionForm.amount || !correctionForm.reason) {
      showToast("请填写完整信息", "error");
      return;
    }
    setActionLoading("correction");
    try {
      await apiFetch(`/api/payment/records/${targetId}/correction`, {
        method: "POST",
        body: JSON.stringify({
          accountNo: correctionForm.accountNo,
          amount: parseFloat(correctionForm.amount),
          reason: correctionForm.reason,
        }),
      });
      showToast("错缴冲正提交成功，预计1-3个工作日处理完成");
      setCorrectionForm({ show: false, accountNo: "", amount: "", reason: "" });
      setCorrectionTarget(null);
    } catch {
      showToast("操作失败，请重试", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleArbitrate = async () => {
    if (!detailModal.record) return;
    setActionLoading("arbitrate");
    try {
      await apiFetch(`/api/payment/records/${detailModal.record.id}/arbitrate`, { method: "POST" });
      showToast("差错仲裁提交成功，平台将在3个工作日内介入处理");
    } catch {
      showToast("操作失败，请重试", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmPay = async () => {
    if (getSelectedBillsData().length === 0) return;
    const selectedBillIds = Array.from(selectedBills);
    const totalAmount = getTotalAmount();
    setPaying(true);
    try {
      const result = await apiFetch<PayResult>("/api/payment/confirm", {
        method: "POST",
        body: JSON.stringify({
          billIds: selectedBillIds,
          payMethod: selectedPayMethod,
        }),
      });
      setPayResult({
        ...result,
        amount: result.amount || totalAmount,
        payMethod: result.payMethod || selectedPayMethod,
        success: result.success !== false,
      });
      setShowPayModal(false);
      setSelectedBills(new Set());
    } catch {
      setPayResult({
        orderNo: "",
        amount: totalAmount,
        payTime: new Date().toISOString(),
        payMethod: selectedPayMethod,
        success: false,
      });
      setShowPayModal(false);
    } finally {
      setPaying(false);
    }
  };

  const closePayResult = () => {
    setPayResult(null);
    if (payResult?.success) {
      setBills([]);
      setAccountNo("");
    }
  };

  const handleDownloadInvoice = async () => {
    if (!detailModal.record?.invoice) return;
    showToast("发票下载已开始", "info");
  };

  const statusTag = (s: string) => {
    if (s === "success" || s === "paid")
      return (
        <span className="tag-success">
          <CheckCircle2 className="w-3 h-3" />
          成功
        </span>
      );
    if (s === "failed" || s === "overdue")
      return (
        <span className="tag-danger">
          <XCircle className="w-3 h-3" />
          {s === "overdue" ? "逾期" : "失败"}
        </span>
      );
    if (s === "processing" || s === "unpaid")
      return (
        <span className="tag-warning">
          <Clock className="w-3 h-3" />
          {s === "unpaid" ? "待缴" : "处理中"}
        </span>
      );
    return s;
  };

  const fundFlowStatusIcon = (status: string) => {
    if (status === "success") return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (status === "failed") return <XCircle className="w-5 h-5 text-rose-500" />;
    return <Clock className="w-5 h-5 text-amber-500" />;
  };

  const getPayMethodName = (id: string) => {
    return PAY_METHODS.find((m) => m.id === id)?.name || id;
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab("pay")}
          className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition ${
            tab === "pay"
              ? "border-brand-500 text-brand-600"
              : "border-transparent text-slate-500 hover:text-brand-500"
          }`}
        >
          在线缴费
        </button>
        <button
          onClick={() => setTab("records")}
          className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition ${
            tab === "records"
              ? "border-brand-500 text-brand-600"
              : "border-transparent text-slate-500 hover:text-brand-500"
          }`}
        >
          缴费记录
        </button>
      </div>

      {tab === "pay" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="card lg:col-span-1">
            <h3 className="section-title">
              <CreditCard className="w-5 h-5" /> 缴费品类
            </h3>
            <div className="space-y-1">
              {categories?.map((c) => {
                const Icon = ICON_MAP[c.icon] || CreditCard;
                const active = activeCat === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveCat(c.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition ${
                      active
                        ? "bg-brand-500 text-white shadow-sm"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 text-sm font-medium">{c.name}</span>
                    <span className={`text-xs ${active ? "text-white/70" : "text-slate-400"}`}>
                      {c.count}项
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card lg:col-span-3">
            <h3 className="section-title">
              <Search className="w-5 h-5" /> 查询账单
            </h3>
            <div className="flex gap-3 mb-6">
              <input
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchBills()}
                placeholder="请输入户号/账号，例如 10086888"
                className="input flex-1 max-w-md"
              />
              <button
                onClick={searchBills}
                disabled={searching || !accountNo.trim()}
                className="btn-primary"
              >
                <Search className="w-4 h-4" /> {searching ? "查询中..." : "查询账单"}
              </button>
            </div>

            {bills.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" /> 待缴账单（{bills.length}）
                  </h4>
                  <button
                    onClick={selectAllBills}
                    className="text-sm text-brand-500 hover:text-brand-600 flex items-center gap-1"
                  >
                    {selectedBills.size === bills.length ? (
                      <>
                        <CheckSquare className="w-4 h-4" /> 取消全选
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" /> 全选
                      </>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bills.map((b) => {
                    const BillIcon = ICON_MAP[b.category] || CreditCard;
                    return (
                      <div
                        key={b.id}
                        className={`border rounded-xl p-4 transition cursor-pointer ${
                          selectedBills.has(b.id)
                            ? "border-brand-400 bg-brand-50/50 shadow-card"
                            : "border-slate-200 hover:border-brand-300 hover:shadow-card"
                        }`}
                        onClick={() => toggleBillSelect(b.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                                selectedBills.has(b.id)
                                  ? "bg-brand-500 border-brand-500"
                                  : "border-slate-300"
                              }`}
                            >
                              {selectedBills.has(b.id) && <CheckSquare className="w-4 h-4 text-white" />}
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                                <BillIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-sm text-slate-500">{b.categoryName}</div>
                                <div className="text-base font-semibold text-brand-700 mt-0.5">
                                  户号：{b.accountNo}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            {statusTag(b.status)}
                            {b.daysLeft > 0 && (
                              <span className="tag tag-info text-xs">
                                <Clock className="w-3 h-3" /> 剩{b.daysLeft}天
                              </span>
                            )}
                            {b.daysLeft < 0 && (
                              <span className="tag tag-danger text-xs">
                                <AlertCircle className="w-3 h-3" /> 已逾期
                              </span>
                            )}
                            {b.daysLeft === 0 && (
                              <span className="tag tag-warning text-xs">
                                <Clock className="w-3 h-3" /> 今日到期
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex items-end justify-between ml-8">
                          <div>
                            <div className="text-xs text-slate-500">账期 {b.period}</div>
                            <div className="text-xs text-slate-400">截止 {b.dueDate}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-500">应缴金额</div>
                            <div className="text-2xl font-bold text-rose-600">
                              {formatMoney(b.amount)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 ml-8 flex items-center gap-2 flex-wrap">
                          {b.canDeduct && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                showToast("已跳转至代扣签约页面", "info");
                              }}
                              className="text-xs px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> 开通代扣
                            </button>
                          )}
                          {b.status === "overdue" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBills(new Set([b.id]));
                                setShowPayModal(true);
                              }}
                              className="text-xs px-3 py-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition flex items-center gap-1 font-medium"
                            >
                              <ChevronRight className="w-3 h-3" /> 立即续费
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">输入户号后查询待缴账单</p>
                <p className="text-xs mt-1">例如：10086888、370101199001011234</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium">订单号</th>
                  <th className="text-left py-3 px-4 font-medium">缴费项目</th>
                  <th className="text-left py-3 px-4 font-medium">金额</th>
                  <th className="text-left py-3 px-4 font-medium">支付方式</th>
                  <th className="text-left py-3 px-4 font-medium">时间</th>
                  <th className="text-left py-3 px-4 font-medium">状态</th>
                  <th className="text-left py-3 px-4 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {(records || []).map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">{r.id}</td>
                    <td className="py-3 px-4 font-medium text-brand-700">{r.category}</td>
                    <td className="py-3 px-4 font-semibold">{formatMoney(r.amount)}</td>
                    <td className="py-3 px-4 text-slate-600">{r.method}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(r.paidAt)}</td>
                    <td className="py-3 px-4">{statusTag(r.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {r.status === "success" && (
                          <>
                            <button
                              onClick={() => openDetailModal(r.id)}
                              className="text-brand-500 text-xs hover:underline"
                            >
                              详情
                            </button>
                            <button
                              onClick={() => {
                                setDetailTab("invoice");
                                openDetailModal(r.id);
                              }}
                              className="text-brand-500 text-xs hover:underline"
                            >
                              发票
                            </button>
                          </>
                        )}
                        {r.status === "failed" && (
                          <>
                            <button
                              onClick={() => handleRetry(r.id)}
                              disabled={actionLoading === "retry"}
                              className="text-xs px-2 py-1 rounded bg-brand-50 text-brand-600 hover:bg-brand-100 transition flex items-center gap-1 font-medium"
                            >
                              <RotateCcw className="w-3 h-3" /> 重新发起
                            </button>
                            <button
                              onClick={() => handleOpenCorrection(r)}
                              className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-600 hover:bg-amber-100 transition flex items-center gap-1 font-medium"
                            >
                              <Undo2 className="w-3 h-3" /> 错缴冲正
                            </button>
                            <button
                              onClick={() => openDetailModal(r.id)}
                              className="text-brand-500 text-xs hover:underline"
                            >
                              详情
                            </button>
                            <button
                              onClick={() => {
                                setDetailTab("trail");
                                openDetailModal(r.id);
                              }}
                              className="text-rose-500 text-xs hover:underline flex items-center gap-1"
                            >
                              <Scale className="w-3 h-3" /> 诊断
                            </button>
                          </>
                        )}
                        {r.status === "processing" && (
                          <>
                            <button
                              onClick={() => {
                                setDetailTab("trail");
                                openDetailModal(r.id);
                              }}
                              className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-600 hover:bg-amber-100 transition flex items-center gap-1 font-medium"
                            >
                              <Clock className="w-3 h-3" /> 查看进度
                            </button>
                            <button
                              onClick={() => openDetailModal(r.id)}
                              className="text-brand-500 text-xs hover:underline"
                            >
                              详情
                            </button>
                            <button
                              onClick={() => {
                                setDetailTab("trail");
                                openDetailModal(r.id);
                              }}
                              className="text-rose-500 text-xs hover:underline flex items-center gap-1"
                            >
                              <Scale className="w-3 h-3" /> 诊断
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedBills.size > 0 && tab === "pay" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-600">
                已选 <span className="font-bold text-brand-600">{selectedBills.size}</span> 笔
              </div>
              <div className="text-sm text-slate-600">
                合计：<span className="text-2xl font-bold text-rose-600">{formatMoney(getTotalAmount())}</span>
              </div>
            </div>
            <button
              onClick={() => setShowPayModal(true)}
              className="btn-primary px-8 py-3 text-base"
            >
              提交缴费订单
            </button>
          </div>
        </div>
      )}

      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">确认支付订单</h3>
              <button
                onClick={() => setShowPayModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[50vh]">
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">已选账单</h4>
                <div className="space-y-2">
                  {getSelectedBillsData().map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-700">{b.categoryName}</div>
                        <div className="text-xs text-slate-500">户号：{b.accountNo} · {b.period}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-rose-600">{formatMoney(b.amount)}</span>
                        <button
                          onClick={() => removeBillFromSelection(b.id)}
                          className="p-1 hover:bg-slate-200 rounded transition"
                        >
                          <Trash2 className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {(() => {
                const selectedData = getSelectedBillsData();
                const hasOverdue = selectedData.some((b) => b.status === "overdue");
                const hasSocial = selectedData.some((b) => b.category === "social");
                const nonDeductible = selectedData.filter((b) => !b.canDeduct);
                const overdueAmount = selectedData
                  .filter((b) => b.status === "overdue")
                  .reduce((s, b) => s + b.amount, 0);
                const nonDeductCategories = [...new Set(nonDeductible.map((b) => b.categoryName))];

                if (!hasOverdue && !hasSocial && nonDeductible.length === 0) return null;

                return (
                  <div className="mb-6 space-y-3">
                    {hasOverdue && (
                      <div className="border border-rose-200 bg-rose-50 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="text-sm font-semibold text-rose-700 mb-1">
                              存在逾期账单，逾期将产生滞纳金{formatMoney(overdueAmount * 0.05)}，建议立即支付
                            </h5>
                            <button
                              onClick={() => showToast("已跳转至代扣签约页面", "info")}
                              className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition flex items-center gap-1 font-medium"
                            >
                              <RefreshCw className="w-3 h-3" /> 开通代扣防止再逾期
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {hasSocial && (
                      <div className="border border-brand-200 bg-brand-50 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="text-sm font-semibold text-brand-700 mb-1">
                              社保缴费支持自动代扣，开通后每月自动划扣，避免断缴
                            </h5>
                            <button
                              onClick={() => showToast("已跳转至代扣签约页面", "info")}
                              className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition flex items-center gap-1 font-medium"
                            >
                              <RefreshCw className="w-3 h-3" /> 开通社保代扣
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {nonDeductible.length > 0 && (
                      <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="text-sm font-semibold text-amber-700">
                              {nonDeductCategories.join("、")}暂不支持代扣，本次需手动支付
                            </h5>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">选择支付方式</h4>
                <div className="space-y-2">
                  {PAY_METHODS.map((m) => {
                    const Icon = m.icon;
                    const selected = selectedPayMethod === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedPayMethod(m.id)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                          selected
                            ? "border-brand-400 bg-brand-50/50"
                            : "border-slate-200 hover:border-brand-200"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            selected ? "bg-brand-500" : "bg-slate-100"
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${selected ? "text-white" : "text-slate-600"}`} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-700">{m.name}</div>
                          <div className="text-xs text-slate-500">{m.description}</div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selected ? "border-brand-500 bg-brand-500" : "border-slate-300"
                          }`}
                        >
                          {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-600">应付总额</span>
                <span className="text-2xl font-bold text-rose-600">{formatMoney(getTotalAmount())}</span>
              </div>
              <button
                onClick={handleConfirmPay}
                disabled={paying || getSelectedBillsData().length === 0}
                className="btn-primary w-full py-3 text-base"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> 订单提交中...
                  </>
                ) : (
                  "确认支付并提交"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {payResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="p-8 text-center">
              {payResult.success ? (
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
              ) : (
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center">
                  <XCircle className="w-12 h-12 text-rose-500" />
                </div>
              )}
              <h3 className="text-xl font-bold text-slate-800 mb-1">
                {payResult.success ? "订单提交成功" : "订单提交失败"}
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                {payResult.success ? "您的账单已成功支付，缴费订单已生成" : "支付过程出现问题，请稍后重试"}
              </p>

              {payResult.success && (
                <div className="space-y-4 mb-6">
                  <div className="bg-slate-50 rounded-xl p-4 text-left space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">订单号</span>
                      <span className="font-mono text-slate-700">{payResult.orderNo}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">支付金额</span>
                      <span className="font-semibold text-rose-600">{formatMoney(payResult.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">支付时间</span>
                      <span className="text-slate-700">{formatDate(payResult.payTime)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">支付方式</span>
                      <span className="text-slate-700">{getPayMethodName(payResult.payMethod)}</span>
                    </div>
                  </div>

                  <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <FileCheck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm font-semibold text-emerald-700 mb-1">电子发票</h5>
                        <span className="tag tag-success text-xs">
                          <CheckCircle2 className="w-3 h-3" /> 发票将在24小时内自动开具并归集至票据中心
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-brand-200 bg-brand-50/50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-brand-600" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm font-semibold text-brand-700 mb-1">资金监管</h5>
                        <span className="tag tag-info text-xs">
                          <Shield className="w-3 h-3" /> {formatMoney(payResult.amount)} 已进入光大银行存管账户，预计T+1完成结算
                        </span>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const selectedData = getSelectedBillsData();
                    const hasSocialOrUtility = selectedData.some(
                      (b) =>
                        b.category === "social" ||
                        b.category === "water" ||
                        b.category === "electricity" ||
                        b.category === "gas"
                    );
                    if (!hasSocialOrUtility) return null;
                    return (
                      <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <RefreshCw className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <h5 className="text-sm font-semibold text-amber-700 mb-2">代扣签约建议</h5>
                            <p className="text-xs text-amber-600 mb-3">开通代扣享受自动缴费特权</p>
                            <button
                              onClick={() => showToast("已跳转至代扣签约页面", "info")}
                              className="text-xs px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition flex items-center gap-1 font-medium"
                            >
                              <ChevronRight className="w-3 h-3" /> 去开通
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {payResult.success ? (
                <div className="space-y-2">
                  <button className="btn-secondary w-full py-3">
                    <FileCheck className="w-4 h-4" /> 开具发票
                  </button>
                  <button className="btn-secondary w-full py-3">
                    <RefreshCw className="w-4 h-4" /> 开通代扣
                  </button>
                  <button onClick={closePayResult} className="btn-primary w-full py-3">
                    完成
                  </button>
                </div>
              ) : (
                <button onClick={closePayResult} className="btn-primary w-full py-3">
                  我知道了
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {detailModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">缴费记录详情</h3>
              <button
                onClick={closeDetailModal}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {detailModal.loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500 mb-3" />
                <p className="text-sm text-slate-500">加载中...</p>
              </div>
            ) : detailModal.record ? (
              <>
                <div className="px-5 pt-5 pb-4 border-b border-slate-200">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">订单号</div>
                      <div className="font-mono text-slate-700 text-sm">{detailModal.record.id}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">缴费项目</div>
                      <div className="font-semibold text-slate-700 text-sm">{detailModal.record.categoryName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">金额</div>
                      <div className="font-bold text-rose-600">{formatMoney(detailModal.record.amount)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">时间</div>
                      <div className="text-slate-700 text-sm">{formatDate(detailModal.record.paidAt)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">状态</div>
                      {statusTag(detailModal.record.status)}
                    </div>
                  </div>

                  {(detailModal.record.status === "failed" || detailModal.record.status === "processing") && (
                    <div className="flex gap-2 flex-wrap pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleRetry()}
                        disabled={actionLoading === "retry"}
                        className="btn-primary text-sm py-2"
                      >
                        {actionLoading === "retry" ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> 处理中
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" /> 重新发起
                          </>
                        )}
                      </button>
                      <button
                        onClick={() =>
                          setCorrectionForm({
                            ...correctionForm,
                            show: true,
                            accountNo: detailModal.record?.accountNo || "",
                            amount: String(detailModal.record?.amount || ""),
                          })
                        }
                        className="btn-secondary text-sm py-2"
                      >
                        <Undo2 className="w-3.5 h-3.5" /> 冲正
                      </button>
                      <button
                        onClick={handleArbitrate}
                        disabled={actionLoading === "arbitrate"}
                        className="btn-secondary text-sm py-2"
                      >
                        {actionLoading === "arbitrate" ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> 处理中
                          </>
                        ) : (
                          <>
                            <Scale className="w-3.5 h-3.5" /> 仲裁
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {(detailModal.record.status === "failed" || detailModal.record.status === "processing") && (
                  <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                    <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-brand-500" /> 差错处理进度
                    </h5>
                    <div className="flex items-start justify-between">
                      {[
                        { key: 1, label: "系统诊断", icon: Search },
                        { key: 2, label: "自动对账", icon: RefreshCw },
                        { key: 3, label: "用户确认", icon: CheckSquare },
                        { key: 4, label: "冲正/仲裁", icon: Scale },
                        { key: 5, label: "处理完成", icon: CheckCircle2 },
                      ].map((step, i, arr) => {
                        const StepIcon = step.icon;
                        const currentStep = detailModal.record.status === "failed" ? 2 : 3;
                        const isActive = i + 1 <= currentStep;
                        const isCurrent = i + 1 === currentStep;
                        return (
                          <div key={step.key} className="flex-1 flex flex-col items-center relative">
                            {i < arr.length - 1 && (
                              <div
                                className={`absolute top-5 left-1/2 w-full h-0.5 ${
                                  isActive && i + 1 < currentStep ? "bg-emerald-400" : "bg-slate-200"
                                }`}
                              />
                            )}
                            <div
                              className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                                isCurrent
                                  ? "bg-brand-50 border-brand-500"
                                  : isActive
                                  ? "bg-emerald-50 border-emerald-400"
                                  : "bg-slate-50 border-slate-200"
                              }`}
                            >
                              <StepIcon
                                className={`w-4 h-4 ${
                                  isCurrent
                                    ? "text-brand-600"
                                    : isActive
                                    ? "text-emerald-600"
                                    : "text-slate-400"
                                }`}
                              />
                            </div>
                            <span
                              className={`text-xs mt-1.5 font-medium ${
                                isCurrent ? "text-brand-700" : isActive ? "text-emerald-700" : "text-slate-400"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {detailModal.record.status === "processing" && (
                  <div className="p-5 bg-brand-50 border-b border-brand-100">
                    <div className="bg-white rounded-xl p-4 border border-brand-200">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-brand-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-brand-700">处理中</h4>
                          <p className="text-sm text-brand-600 mt-1">
                            系统正在处理您的缴费请求，请耐心等待
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">预计完成时间</div>
                          <div className="font-semibold text-slate-700 text-sm flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-brand-500" /> 约5分钟
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">当前处理步骤</div>
                          <div className="font-semibold text-brand-700 text-sm">银行清算中</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">自动重试次数</div>
                          <div className="font-semibold text-slate-700 text-sm flex items-center gap-1">
                            <RefreshCw className="w-3.5 h-3.5 text-emerald-500" /> 0/3
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {detailModal.record.status === "failed" && detailModal.record.failureInfo && (
                  <div className="p-5 bg-rose-50 border-b border-rose-100">
                    <div className="bg-white rounded-xl p-4 border border-rose-200">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-rose-700">支付失败</h4>
                          <p className="text-sm text-rose-600 mt-1">
                            {detailModal.record.failureInfo.rootCause}
                          </p>
                          <p className="text-xs text-rose-500 mt-1 font-mono">
                            错误代码：{detailModal.record.failureInfo.errorCode}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-slate-700 mb-2">建议处理方案：</h5>
                        <ul className="space-y-1">
                          {detailModal.record.failureInfo.suggestions.map((s, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-brand-500">{i + 1}.</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {correctionForm.show ? (
                        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                          <h5 className="text-sm font-semibold text-slate-700">错缴冲正申请</h5>
                          <div>
                            <label className="input-label">户号</label>
                            <input
                              value={correctionForm.accountNo}
                              onChange={(e) =>
                                setCorrectionForm({ ...correctionForm, accountNo: e.target.value })
                              }
                              placeholder="请输入正确的户号"
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="input-label">冲正金额</label>
                            <input
                              value={correctionForm.amount}
                              onChange={(e) =>
                                setCorrectionForm({ ...correctionForm, amount: e.target.value })
                              }
                              placeholder="请输入冲正金额"
                              type="number"
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="input-label">冲正原因</label>
                            <textarea
                              value={correctionForm.reason}
                              onChange={(e) =>
                                setCorrectionForm({ ...correctionForm, reason: e.target.value })
                              }
                              placeholder="请详细说明冲正原因"
                              className="input min-h-[80px]"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={handleCorrectionSubmit}
                              disabled={actionLoading === "correction"}
                              className="btn-primary flex-1"
                            >
                              {actionLoading === "correction" ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" /> 提交中...
                                </>
                              ) : (
                                "提交申请"
                              )}
                            </button>
                            <button
                              onClick={() =>
                                setCorrectionForm({
                                  show: false,
                                  accountNo: "",
                                  amount: "",
                                  reason: "",
                                })
                              }
                              className="btn-secondary flex-1"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleRetry()}
                            disabled={actionLoading === "retry"}
                            className="btn-primary"
                          >
                            {actionLoading === "retry" ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> 处理中...
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-4 h-4" /> 重新发起
                              </>
                            )}
                          </button>
                          <button
                            onClick={() =>
                              setCorrectionForm({
                                ...correctionForm,
                                show: true,
                                accountNo: detailModal.record?.accountNo || "",
                                amount: String(detailModal.record?.amount || ""),
                              })
                            }
                            className="btn-secondary"
                          >
                            <Undo2 className="w-4 h-4" /> 错缴冲正
                          </button>
                          <button
                            onClick={handleArbitrate}
                            disabled={actionLoading === "arbitrate"}
                            className="btn-secondary"
                          >
                            {actionLoading === "arbitrate" ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> 处理中...
                              </>
                            ) : (
                              <>
                                <Scale className="w-4 h-4" /> 差错仲裁
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-1 px-5 pt-4 border-b border-slate-200">
                  {[
                    { key: "bill", label: "账单明细", icon: FileText },
                    { key: "fund", label: "资金去向", icon: TrendingUp },
                    { key: "invoice", label: "票据归集", icon: FileCheck },
                    { key: "trail", label: "处理轨迹", icon: Clock },
                  ].map((t) => {
                    const Icon = t.icon;
                    const active = detailTab === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setDetailTab(t.key as typeof detailTab)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
                          active
                            ? "border-brand-500 text-brand-600"
                            : "border-transparent text-slate-500 hover:text-brand-500"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>

                <div className="p-5 overflow-y-auto max-h-[55vh]">
                  {detailTab === "bill" && (
                    <div className="space-y-4">
                      <div className="flex gap-6">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">户号</div>
                          <div className="font-semibold text-slate-700">
                            {detailModal.record.accountNo}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">账期</div>
                          <div className="font-semibold text-slate-700">{detailModal.record.period}</div>
                        </div>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="text-left py-3 px-4 font-medium text-slate-600">费用项目</th>
                              <th className="text-right py-3 px-4 font-medium text-slate-600">数量</th>
                              <th className="text-right py-3 px-4 font-medium text-slate-600">单价</th>
                              <th className="text-right py-3 px-4 font-medium text-slate-600">金额</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detailModal.record.billDetails.map((d, i) => (
                              <tr key={i} className="border-t border-slate-100">
                                <td className="py-3 px-4 text-slate-700">{d.name}</td>
                                <td className="py-3 px-4 text-right text-slate-600">{d.quantity}</td>
                                <td className="py-3 px-4 text-right text-slate-600">
                                  {formatMoney(d.unitPrice)}
                                </td>
                                <td className="py-3 px-4 text-right font-semibold text-slate-700">
                                  {formatMoney(d.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-brand-50 border-t border-brand-100">
                            <tr>
                              <td colSpan={3} className="py-3 px-4 text-right font-semibold text-brand-700">
                                合计
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-rose-600">
                                {formatMoney(detailModal.record.amount)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {detailTab === "fund" && (
                    <div className="space-y-6">
                      <div className="relative">
                        {detailModal.record.fundFlow.map((step, i) => (
                          <div key={step.step} className="flex gap-4 relative pb-8 last:pb-0">
                            {i < detailModal.record.fundFlow.length - 1 && (
                              <div
                                className={`absolute left-5 top-10 w-0.5 h-full ${
                                  step.status === "success" ? "bg-emerald-200" : "bg-slate-200"
                                }`}
                              />
                            )}
                            <div className="relative z-10 w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center flex-shrink-0">
                              {fundFlowStatusIcon(step.status)}
                            </div>
                            <div className="flex-1 pt-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-slate-700">{step.title}</h4>
                                <span className="font-bold text-rose-600">{formatMoney(step.amount)}</span>
                              </div>
                              <p className="text-sm text-slate-600 mt-1 bg-slate-50 rounded-lg px-3 py-2">
                                {step.description}
                              </p>
                              <p className="text-xs text-slate-400 mt-2">{formatDate(step.time)}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border border-emerald-200 rounded-xl bg-emerald-50/50 overflow-hidden">
                        <div className="px-4 py-3 bg-emerald-100/70 border-b border-emerald-200 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-emerald-600" />
                          <h4 className="font-semibold text-emerald-700 text-sm">光大银行监管流水</h4>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs text-slate-500 mb-1">监管账户名</div>
                              <div className="font-medium text-slate-700 text-sm">智慧生活缴费平台资金监管专户</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 mb-1">监管机构</div>
                              <div className="font-medium text-slate-700 text-sm">中国光大银行</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 mb-1">监管流水号</div>
                              <div className="font-mono text-slate-700 text-sm">GD{detailModal.record.id}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 mb-1">监管金额</div>
                              <div className="font-semibold text-rose-600 text-sm">{formatMoney(detailModal.record.amount)}</div>
                            </div>
                          </div>
                          <div className="mt-2 pt-3 border-t border-emerald-200/60">
                            <p className="text-xs text-slate-600 flex items-start gap-2">
                              <Shield className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                              本平台所有缴费资金均由中国光大银行进行全程监管，资金流向透明可查，保障您的每一笔资金安全。T+1日自动清算至对应收费机构，全程接受银保监会监管。
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {detailTab === "invoice" && (
                    <div className="space-y-4">
                      <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 flex items-start gap-3">
                        <FileCheck className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h5 className="text-sm font-semibold text-brand-700 mb-1">自动归集说明</h5>
                          <p className="text-xs text-brand-600">
                            您的电子发票已自动归集至票据中心，支持批量下载、邮件推送、智能分类归档。所有票据均由税务机关监制，具备完整法律效力。
                          </p>
                        </div>
                      </div>

                      {detailModal.record.invoice ? (
                        <div className="space-y-4">
                          {detailModal.record.invoice.status === "issued" && (
                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 to-white">
                              <div className="px-5 py-4 border-b border-slate-200 bg-white">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-semibold text-slate-800">电子普通发票预览</h5>
                                  <span className="tag tag-success">
                                    <CheckCircle2 className="w-3 h-3" /> 已开具
                                  </span>
                                </div>
                              </div>
                              <div className="p-5 space-y-4">
                                <div className="text-center border-b border-dashed border-slate-200 pb-4">
                                  <h4 className="text-xl font-bold text-slate-800 mb-1">电子普通发票</h4>
                                  <p className="text-xs text-slate-500">发票代码：011002300311</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="text-xs text-slate-500 mb-1">发票标题</div>
                                    <div className="font-medium text-slate-700">{detailModal.record.categoryName}缴费发票</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500 mb-1">发票号码</div>
                                    <div className="font-mono text-slate-700">{detailModal.record.invoice.invoiceNo}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500 mb-1">开票方</div>
                                    <div className="font-medium text-slate-700">
                                      {detailModal.record.categoryName === "电费" ? "国家电网有限公司" :
                                       detailModal.record.categoryName === "水费" ? "市自来水集团有限公司" :
                                       detailModal.record.categoryName === "燃气" ? "市燃气集团有限公司" :
                                       detailModal.record.categoryName === "通讯" ? "中国移动通信集团" :
                                       detailModal.record.categoryName === "社保" ? "市社会保险事业管理中心" :
                                       detailModal.record.categoryName === "暖气" ? "市热力集团有限公司" :
                                       detailModal.record.categoryName === "宽带" ? "中国电信股份有限公司" :
                                       "相关收费机构"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500 mb-1">受票方</div>
                                    <div className="font-medium text-slate-700">个人用户</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500 mb-1">校验码</div>
                                    <div className="font-mono text-slate-700">{detailModal.record.invoice.invoiceNo.slice(-8)}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500 mb-1">开票日期</div>
                                    <div className="text-slate-700">{formatDate(detailModal.record.invoice.issueDate, "YYYY-MM-DD")}</div>
                                  </div>
                                </div>
                                <div className="pt-4 border-t border-dashed border-slate-200 flex items-end justify-between">
                                  <div>
                                    <div className="text-xs text-slate-500 mb-1">价税合计（大写）</div>
                                    <div className="text-sm font-medium text-slate-700">
                                      人民币{formatMoney(detailModal.record.invoice.amount)}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-slate-500 mb-1">小写金额</div>
                                    <div className="text-2xl font-bold text-rose-600">
                                      {formatMoney(detailModal.record.invoice.amount)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {detailModal.record.invoice.status === "pending" && (
                            <div className="border border-amber-200 rounded-xl bg-amber-50 p-5">
                              <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <h5 className="font-semibold text-amber-700 mb-2">发票开具中</h5>
                                  <div className="text-sm text-amber-600 mb-3">
                                    预计开票时间倒计时
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-center">
                                      <div className="w-14 h-14 rounded-lg bg-amber-100 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-amber-700">00</span>
                                      </div>
                                      <span className="text-xs text-amber-600 mt-1">时</span>
                                    </div>
                                    <span className="text-xl font-bold text-amber-400">:</span>
                                    <div className="text-center">
                                      <div className="w-14 h-14 rounded-lg bg-amber-100 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-amber-700">45</span>
                                      </div>
                                      <span className="text-xs text-amber-600 mt-1">分</span>
                                    </div>
                                    <span className="text-xl font-bold text-amber-400">:</span>
                                    <div className="text-center">
                                      <div className="w-14 h-14 rounded-lg bg-amber-100 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-amber-700">30</span>
                                      </div>
                                      <span className="text-xs text-amber-600 mt-1">秒</span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-amber-600 mt-4">
                                    发票正在开具中，预计45分钟内完成。开具完成后将自动发送至您的账户，您可在此处下载或查看。
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="border border-slate-200 rounded-xl p-5">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="font-semibold text-slate-700 mb-1">发票详情</h4>
                                <span
                                  className={`tag ${
                                    detailModal.record.invoice.status === "issued"
                                      ? "tag-success"
                                      : detailModal.record.invoice.status === "pending"
                                      ? "tag-warning"
                                      : "tag-danger"
                                  }`}
                                >
                                  {detailModal.record.invoice.status === "issued"
                                    ? "已开具"
                                    : detailModal.record.invoice.status === "pending"
                                    ? "开具中"
                                    : "已作废"}
                                </span>
                              </div>
                              <button
                                onClick={handleDownloadInvoice}
                                disabled={detailModal.record.invoice.status !== "issued"}
                                className="btn-secondary"
                              >
                                <Download className="w-4 h-4" /> 下载发票
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs text-slate-500 mb-1">发票号码</div>
                                <div className="font-mono text-slate-700">
                                  {detailModal.record.invoice.invoiceNo}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 mb-1">开票金额</div>
                                <div className="font-semibold text-rose-600">
                                  {formatMoney(detailModal.record.invoice.amount)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 mb-1">开票日期</div>
                                <div className="text-slate-700">
                                  {formatDate(detailModal.record.invoice.issueDate, "YYYY-MM-DD")}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-slate-400">
                          <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-40" />
                          <p className="text-sm">暂无可开具的发票</p>
                        </div>
                      )}
                    </div>
                  )}

                  {detailTab === "trail" && (
                    <div className="space-y-6">
                      {detailModal.record.failureInfo && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                            <h5 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-500" /> 差错处理进度
                            </h5>
                          </div>
                          <div className="p-5">
                            <div className="flex items-start justify-between">
                              {[
                                { key: 1, label: "系统诊断", icon: Search },
                                { key: 2, label: "自动对账", icon: RefreshCw },
                                { key: 3, label: "用户确认", icon: CheckSquare },
                                { key: 4, label: detailModal.record.status === "failed" ? "冲正/仲裁" : "处理中", icon: detailModal.record.status === "failed" ? Scale : Clock },
                                { key: 5, label: "处理完成", icon: CheckCircle2 },
                              ].map((step, i, arr) => {
                                const StepIcon = step.icon;
                                const currentStep = detailModal.record.status === "failed" ? 2 : 3;
                                const isActive = i + 1 <= currentStep;
                                const isCurrent = i + 1 === currentStep;
                                return (
                                  <div key={step.key} className="flex-1 flex flex-col items-center relative">
                                    {i < arr.length - 1 && (
                                      <div
                                        className={`absolute top-5 left-1/2 w-full h-0.5 ${
                                          isActive && i + 1 < currentStep ? "bg-emerald-400" : "bg-slate-200"
                                        }`}
                                      />
                                    )}
                                    <div
                                      className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                                        isCurrent
                                          ? "bg-brand-50 border-brand-500"
                                          : isActive
                                          ? "bg-emerald-50 border-emerald-400"
                                          : "bg-slate-50 border-slate-200"
                                      }`}
                                    >
                                      <StepIcon
                                        className={`w-5 h-5 ${
                                          isCurrent
                                            ? "text-brand-600"
                                            : isActive
                                            ? "text-emerald-600"
                                            : "text-slate-400"
                                        }`}
                                      />
                                    </div>
                                    <span
                                      className={`text-xs mt-2 font-medium ${
                                        isCurrent ? "text-brand-700" : isActive ? "text-emerald-700" : "text-slate-400"
                                      }`}
                                    >
                                      {step.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="relative">
                        {detailModal.record.processTrail.map((trail, i) => {
                          const isSuccess = trail.action.includes("成功") || trail.action.includes("完成");
                          const isFailed = trail.action.includes("失败") || trail.action.includes("拒绝");
                          return (
                            <div key={i} className="flex gap-4 relative pb-6 last:pb-0">
                              {i < detailModal.record.processTrail.length - 1 && (
                                <div className="absolute left-2.5 top-6 w-0.5 h-full bg-slate-200" />
                              )}
                              <div
                                className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-1.5 ${
                                  isSuccess ? "bg-emerald-500" : isFailed ? "bg-rose-500" : "bg-brand-500"
                                }`}
                              >
                                <div className="w-2 h-2 rounded-full bg-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-slate-700">{trail.action}</h4>
                                  <span className="text-xs text-slate-400">{trail.operator}</span>
                                  {isSuccess && (
                                    <span className="tag tag-success text-xs py-0 px-2">
                                      <CheckCircle2 className="w-3 h-3" /> 成功
                                    </span>
                                  )}
                                  {isFailed && (
                                    <span className="tag tag-danger text-xs py-0 px-2">
                                      <XCircle className="w-3 h-3" /> 失败
                                    </span>
                                  )}
                                  {!isSuccess && !isFailed && (
                                    <span className="tag tag-info text-xs py-0 px-2">
                                      <Clock className="w-3 h-3" /> 处理中
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-500 mt-1">{trail.remark}</p>
                                <p className="text-xs text-slate-400 mt-1">{formatDate(trail.time)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">加载详情失败</p>
              </div>
            )}
          </div>
        </div>
      )}

      {toast.show && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in-up ${
            toast.type === "success"
              ? "bg-emerald-500 text-white"
              : toast.type === "error"
              ? "bg-rose-500 text-white"
              : "bg-brand-500 text-white"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 className="w-5 h-5" />}
          {toast.type === "error" && <XCircle className="w-5 h-5" />}
          {toast.type === "info" && <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
