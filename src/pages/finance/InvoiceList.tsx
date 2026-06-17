import { useState, useMemo } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import {
  Search,
  Check,
  X,
  RefreshCw,
  FileText,
  Eye,
  Calendar,
  FileCheck,
  AlertCircle,
  Clock,
  Loader2,
  XCircle,
  Receipt,
  ChevronDown,
  ChevronUp,
  ZoomIn,
} from "lucide-react";
import { useAppStore } from "@/stores";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  ProgressBar,
} from "@/components/ui";
import { cn, formatCurrency, formatDate, formatPercent } from "@/utils";
import type { Invoice, OcrStatus, FinanceAccount } from "@/types";

const ocrStatusMap: Record<
  OcrStatus,
  { label: string; variant: "success" | "warning" | "danger" | "info" | "secondary" }
> = {
  pending: { label: "待识别", variant: "secondary" },
  recognizing: { label: "识别中", variant: "info" },
  reviewing: { label: "待复核", variant: "warning" },
  verified: { label: "已通过", variant: "success" },
  failed: { label: "已驳回", variant: "danger" },
};

const statIcons: Record<string, typeof Receipt> = {
  total: FileText,
  pending: Clock,
  recognizing: Loader2,
  reviewing: AlertCircle,
  verified: FileCheck,
  failed: XCircle,
};

const statColors: Record<string, { bg: string; text: string; gradient: string }> = {
  total: { bg: "bg-primary-50", text: "text-primary-600", gradient: "from-primary-500 to-primary-600" },
  pending: { bg: "bg-slate-50", text: "text-slate-600", gradient: "from-slate-400 to-slate-500" },
  recognizing: { bg: "bg-trust-50", text: "text-trust-600", gradient: "from-trust-500 to-trust-600" },
  reviewing: { bg: "bg-amber-50", text: "text-amber-600", gradient: "from-amber-500 to-amber-600" },
  verified: { bg: "bg-emerald-50", text: "text-emerald-600", gradient: "from-emerald-500 to-emerald-600" },
  failed: { bg: "bg-rose-50", text: "text-rose-600", gradient: "from-rose-500 to-rose-600" },
};

interface Toast {
  show: boolean;
  type: "success" | "error" | "info";
  message: string;
}

export default function InvoiceList() {
  const {
    invoices,
    financeAccounts,
    verifyInvoice,
    rejectInvoice,
    startOcrRecognition,
    showToast,
  } = useAppStore();

  const [statusTab, setStatusTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [confidenceFilter, setConfidenceFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [searchText, setSearchText] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [toast, setToast] = useState<Toast>({ show: false, type: "success", message: "" });
  const [editForm, setEditForm] = useState({
    invoiceNo: "",
    amount: 0,
    vendor: "",
    date: "",
    taxRate: 0,
    taxAmount: 0,
    buyer: "",
    accountId: "",
    accountName: "",
  });
  const [zoom, setZoom] = useState(false);

  const flatAccounts = useMemo(() => {
    const flatten = (accounts: FinanceAccount[]): FinanceAccount[] =>
      accounts.reduce<FinanceAccount[]>(
        (acc, a) => (
          acc.push(a), a.children ? acc.push(...flatten(a.children)) : acc, acc
        ),
        []
      );
    return flatten(financeAccounts);
  }, [financeAccounts]);

  const stats = useMemo(() => {
    return {
      total: invoices.length,
      pending: invoices.filter((i) => i.ocrStatus === "pending").length,
      recognizing: invoices.filter((i) => i.ocrStatus === "recognizing").length,
      reviewing: invoices.filter((i) => i.ocrStatus === "reviewing").length,
      verified: invoices.filter((i) => i.ocrStatus === "verified").length,
      failed: invoices.filter((i) => i.ocrStatus === "failed").length,
    };
  }, [invoices]);

  const filteredInvoices = useMemo(
    () =>
      invoices.filter((inv) => {
        if (statusTab !== "all" && inv.ocrStatus !== statusTab) return false;
        if (typeFilter !== "all" && inv.type !== typeFilter) return false;
        if (searchText) {
          const lower = searchText.toLowerCase();
          return (
            inv.vendor.toLowerCase().includes(lower) ||
            inv.invoiceNo.includes(lower) ||
            inv.accountName.toLowerCase().includes(lower)
          );
        }
        if (dateRange.start && inv.date < dateRange.start) return false;
        if (dateRange.end && inv.date > dateRange.end) return false;
        if (confidenceFilter !== "all" && inv.ocrResult) {
          const c = inv.ocrResult.confidence;
          if (confidenceFilter === "low" && c >= 0.8) return false;
          if (confidenceFilter === "medium" && (c < 0.8 || c >= 0.95)) return false;
          if (confidenceFilter === "high" && c < 0.95) return false;
        }
        return true;
      }),
    [invoices, statusTab, typeFilter, searchText, dateRange, confidenceFilter]
  );

  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setEditForm({
      invoiceNo: inv.ocrResult?.invoiceNo ?? inv.invoiceNo,
      amount: inv.ocrResult?.amount ?? inv.amount,
      vendor: inv.ocrResult?.vendor ?? inv.vendor,
      date: inv.ocrResult?.date ?? inv.date,
      taxRate: 13,
      taxAmount: Math.round((inv.ocrResult?.amount ?? inv.amount) * 0.13),
      buyer: "阳光花园小区业主委员会",
      accountId: inv.accountId,
      accountName: inv.accountName,
    });
  };

  const showMessage = (type: Toast["type"], message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: "success", message: "" }), 3000);
    showToast(type, message);
  };

  const handleConfirm = () => {
    if (selectedInvoice) {
      const account = flatAccounts.find((a) => a.id === editForm.accountId);
      verifyInvoice(selectedInvoice.id, {
        invoiceNo: editForm.invoiceNo,
        amount: editForm.amount,
        vendor: editForm.vendor,
        date: editForm.date,
        accountId: editForm.accountId,
        accountName: account?.name || editForm.accountName,
      });
      showMessage("success", "票据复核通过！");
      setSelectedInvoice(null);
    }
  };

  const handleReject = () => {
    if (selectedInvoice) {
      rejectInvoice(selectedInvoice.id, "OCR识别信息有误，需重新识别");
      showMessage("error", "票据已驳回，已退回重新识别");
      setSelectedInvoice(null);
    }
  };

  const handleStartRecognition = (inv: Invoice) => {
    startOcrRecognition(inv.id);
    showMessage("info", "已启动OCR识别，请稍候...");
    setTimeout(() => {
      setSelectedInvoice((prev) =>
        prev?.id === inv.id
          ? { ...prev, ocrStatus: "reviewing" }
          : prev
      );
    }, 1500);
  };

  const confidence = selectedInvoice?.ocrResult?.confidence ?? 0;
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference * (1 - confidence);

  const renderStatCard = (key: keyof typeof stats, label: string) => {
    const Icon = statIcons[key];
    const color = statColors[key];
    return (
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className={cn(
          "relative overflow-hidden rounded-xl p-4 border border-slate-200",
          color.bg
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={cn("text-2xl font-bold", color.text)}>
              {stats[key]}
            </p>
          </div>
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
              color.gradient
            )}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        <div
          className={cn(
            "absolute -right-2 -bottom-2 w-16 h-16 rounded-full opacity-10 bg-gradient-to-br",
            color.gradient
          )}
        />
      </m.div>
    );
  };

  const statusTabs = [
    { key: "all", label: "全部" },
    { key: "pending", label: "待识别" },
    { key: "recognizing", label: "识别中" },
    { key: "reviewing", label: "待复核" },
    { key: "verified", label: "已通过" },
    { key: "failed", label: "已驳回" },
  ];

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-5 relative"
    >
      <AnimatePresence>
        {toast.show && (
          <m.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={cn(
              "fixed top-6 left-1/2 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-3",
              toast.type === "success" && "bg-emerald-500 text-white",
              toast.type === "error" && "bg-rose-500 text-white",
              toast.type === "info" && "bg-primary-500 text-white"
            )}
          >
            {toast.type === "success" && <Check className="w-5 h-5" />}
            {toast.type === "error" && <X className="w-5 h-5" />}
            {toast.type === "info" && <Eye className="w-5 h-5" />}
            <span className="font-medium">{toast.message}</span>
          </m.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {renderStatCard("total", "总票据")}
        {renderStatCard("pending", "待识别")}
        {renderStatCard("recognizing", "识别中")}
        {renderStatCard("reviewing", "待复核")}
        {renderStatCard("verified", "已通过")}
        {renderStatCard("failed", "已驳回")}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
              {statusTabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setStatusTab(t.key)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap",
                    statusTab === t.key
                      ? "bg-white text-primary-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {(["all", "income", "expense"] as const).map((t) => (
                <Button
                  key={t}
                  variant={typeFilter === t ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setTypeFilter(t)}
                >
                  {t === "all" ? "全部类型" : t === "income" ? "收入" : "支出"}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-slate-400">至</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value as typeof confidenceFilter)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">全部置信度</option>
              <option value="high">高置信度 (≥95%)</option>
              <option value="medium">中置信度 (80%-95%)</option>
              <option value="low">低置信度 ({"<"}80%)</option>
            </select>
            <div className="flex-1 min-w-[200px] max-w-xs ml-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索发票号、供应商..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Card
          className={cn(
            "overflow-hidden",
            selectedInvoice ? "lg:col-span-5" : "lg:col-span-12"
          )}
        >
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary-600" />
              票据列表
              <Badge variant="secondary" size="sm">
                {filteredInvoices.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
            {filteredInvoices.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无匹配的票据数据</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {filteredInvoices.map((inv, idx) => {
                  const statusInfo = ocrStatusMap[inv.ocrStatus];
                  const isSelected = selectedInvoice?.id === inv.id;
                  const conf = inv.ocrResult?.confidence ?? 0;
                  return (
                    <m.div
                      key={inv.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                      onClick={() => handleSelectInvoice(inv)}
                      className={cn(
                        "p-4 border-b border-slate-100 cursor-pointer transition-all",
                        isSelected
                          ? "bg-primary-50/60 border-l-4 border-l-primary-500"
                          : "hover:bg-slate-50"
                      )}
                    >
                      <div className="flex gap-3">
                        <div className="relative">
                          <img
                            src={inv.imageUrl}
                            alt={inv.invoiceNo}
                            className="w-20 h-16 object-cover rounded-lg border border-slate-200"
                          />
                          <div
                            className={cn(
                              "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold",
                              inv.type === "income" ? "bg-emerald-500" : "bg-rose-500"
                            )}
                          >
                            {inv.type === "income" ? "收" : "支"}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {inv.vendor}
                            </p>
                            <span
                              className={cn(
                                "text-sm font-bold shrink-0",
                                inv.type === "income" ? "text-emerald-600" : "text-rose-600"
                              )}
                            >
                              {formatCurrency(inv.amount)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate mb-1">
                            #{inv.invoiceNo.slice(-10)}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant={statusInfo.variant}
                              size="sm"
                              dot
                              className={cn(
                                inv.ocrStatus === "recognizing" && "animate-pulse"
                              )}
                            >
                              {inv.ocrStatus === "recognizing" && (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              )}
                              {statusInfo.label}
                            </Badge>
                            {inv.ocrResult && (
                              <span className="text-xs text-slate-400">
                                {formatPercent(conf * 100)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </m.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </Card>

        <AnimatePresence mode="wait">
          {selectedInvoice && (
            <m.div
              key="panel"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.3 }}
              className="lg:col-span-7"
            >
              <Card className="h-full">
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary-600" />
                    OCR复核面板
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedInvoice(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </CardHeader>
                <div className="max-h-[calc(100vh-440px)] overflow-y-auto px-4 pb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="relative group">
                        <img
                          src={selectedInvoice.imageUrl}
                          alt="票据"
                          className={cn(
                            "w-full rounded-xl border-2 border-slate-200 object-cover transition-transform duration-300",
                            zoom && "scale-110"
                          )}
                        />
                        <button
                          onClick={() => setZoom(!zoom)}
                          className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {zoom ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ZoomIn className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <div className="mt-4">
                        <div className="relative w-28 h-28 mx-auto">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke="#e2e8f0"
                              strokeWidth="8"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke={confidence >= 0.95 ? "#10b981" : confidence >= 0.8 ? "#f59e0b" : "#ef4444"}
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              strokeDashoffset={dashOffset}
                              style={{ transition: "stroke-dashoffset 0.6s ease" }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-slate-800">
                              {Math.round(confidence * 100)}%
                            </span>
                            <span className="text-xs text-slate-500">置信度</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs font-semibold text-slate-500 mb-2 grid grid-cols-3 gap-2">
                          <span>字段</span>
                          <span>OCR识别</span>
                          <span>人工确认</span>
                        </div>
                        {[
                          { label: "发票号", key: "invoiceNo", type: "text" },
                          { label: "开票日期", key: "date", type: "date" },
                          { label: "金额(元)", key: "amount", type: "number" },
                          { label: "税率(%)", key: "taxRate", type: "number" },
                          { label: "税额(元)", key: "taxAmount", type: "number" },
                          { label: "供应商", key: "vendor", type: "text" },
                          { label: "买方", key: "buyer", type: "text" },
                        ].map((f) => (
                          <div
                            key={f.key}
                            className="grid grid-cols-3 gap-2 items-center py-1.5 border-b border-slate-100 last:border-0"
                          >
                            <span className="text-xs text-slate-600">{f.label}</span>
                            <span className="text-xs text-slate-500 truncate">
                              {f.key === "amount" || f.key === "taxAmount"
                                ? formatCurrency(
                                    (selectedInvoice.ocrResult as Record<string, any>)?.[f.key] ?? 0
                                  )
                                : (selectedInvoice.ocrResult as Record<string, any>)?.[f.key] ?? "-"}
                            </span>
                            <input
                              type={f.type}
                              value={(editForm as Record<string, any>)[f.key]}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  [f.key]:
                                    f.type === "number"
                                      ? Number(e.target.value)
                                      : e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 text-xs border border-primary-200 bg-white rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 block mb-1.5">
                          项目明细
                        </label>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-2 py-1.5 text-left text-slate-600">名称</th>
                                <th className="px-2 py-1.5 text-right text-slate-600 w-14">数量</th>
                                <th className="px-2 py-1.5 text-right text-slate-600 w-20">单价</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedInvoice.ocrResult?.items.map((it, i) => (
                                <tr key={i} className="border-t border-slate-100">
                                  <td className="px-2 py-1.5 text-slate-700">{it.name}</td>
                                  <td className="px-2 py-1.5 text-right text-slate-700">
                                    {it.quantity}
                                  </td>
                                  <td className="px-2 py-1.5 text-right text-slate-700">
                                    {formatCurrency(it.unitPrice)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 block mb-1.5">
                          归属科目
                        </label>
                        <select
                          value={editForm.accountId}
                          onChange={(e) => {
                            const account = flatAccounts.find((a) => a.id === e.target.value);
                            setEditForm({
                              ...editForm,
                              accountId: e.target.value,
                              accountName: account?.name || "",
                            });
                          }}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">请选择科目</option>
                          {flatAccounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.code} - {acc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                  {(selectedInvoice.ocrStatus === "pending" ||
                    selectedInvoice.ocrStatus === "failed") && (
                    <Button
                      variant="outline"
                      leftIcon={<RefreshCw className="w-4 h-4" />}
                      onClick={() => handleStartRecognition(selectedInvoice)}
                    >
                      启动识别
                    </Button>
                  )}
                  {selectedInvoice.ocrStatus === "reviewing" && (
                    <>
                      <Button
                        variant="secondary"
                        leftIcon={<RefreshCw className="w-4 h-4" />}
                        onClick={handleReject}
                      >
                        退回重新识别
                      </Button>
                      <Button
                        leftIcon={<Check className="w-4 h-4" />}
                        onClick={handleConfirm}
                      >
                        复核通过
                      </Button>
                    </>
                  )}
                  {selectedInvoice.ocrStatus === "verified" && (
                    <Badge variant="success" size="lg" dot>
                      <Check className="w-3 h-3" /> 已通过复核
                    </Badge>
                  )}
                </div>
              </Card>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </m.div>
  );
}
