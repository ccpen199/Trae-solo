import { useState, useMemo } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import { Search, Check, Eye, RefreshCw, FileText } from "lucide-react";
import { useAppStore } from "@/stores";
import {
  Card,
  CardContent,
  CardFooter,
  Button,
  Badge,
  Modal,
  ProgressBar,
  Empty,
} from "@/components/ui";
import { cn, formatCurrency, formatDate, formatPercent } from "@/utils";
import type { Invoice, OcrStatus, FinanceAccount } from "@/types";

const ocrStatusMap: Record<OcrStatus, { label: string; variant: "success" | "warning" | "danger" | "info" }> = {
  pending: { label: "待识别", variant: "warning" },
  recognizing: { label: "识别中", variant: "info" },
  reviewing: { label: "待复核", variant: "warning" },
  verified: { label: "已复核通过", variant: "success" },
  failed: { label: "复核失败", variant: "danger" },
};

const typeLabels: Record<string, string> = { all: "全部", income: "收入", expense: "支出" };
const statusLabels: Record<string, string> = { all: "全部", pending: "待识别", recognizing: "识别中", reviewing: "待复核", verified: "已通过", failed: "已失败" };
const typeOptions = ["all", "income", "expense"] as const;
const statusOptions = ["all", "pending", "recognizing", "reviewing", "verified", "failed"] as const;

export default function InvoiceList() {
  const { invoices, financeAccounts, verifyInvoice, rejectInvoice } = useAppStore();
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ invoiceNo: "", amount: 0, vendor: "", date: "", accountId: "", accountName: "" });

  const flatAccounts = useMemo(() => {
    const flatten = (accounts: FinanceAccount[]): FinanceAccount[] =>
      accounts.reduce<FinanceAccount[]>((acc, a) => (acc.push(a), a.children ? acc.push(...flatten(a.children)) : acc, acc), []);
    return flatten(financeAccounts);
  }, [financeAccounts]);

  const filteredInvoices = useMemo(
    () => invoices.filter((inv) => {
      if (typeFilter !== "all" && inv.type !== typeFilter) return false;
      if (statusFilter !== "all" && inv.ocrStatus !== statusFilter) return false;
      if (searchText) {
        const lower = searchText.toLowerCase();
        return inv.vendor.toLowerCase().includes(lower) || inv.invoiceNo.includes(lower) || inv.accountName.toLowerCase().includes(lower);
      }
      return true;
    }),
    [invoices, typeFilter, statusFilter, searchText]
  );

  const handleReview = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    if (invoice.ocrResult) {
      setEditForm({
        invoiceNo: invoice.ocrResult.invoiceNo,
        amount: invoice.ocrResult.amount,
        vendor: invoice.ocrResult.vendor,
        date: invoice.ocrResult.date,
        accountId: invoice.accountId,
        accountName: invoice.accountName,
      });
    }
    setIsModalOpen(true);
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
      setIsModalOpen(false);
      setSelectedInvoice(null);
    }
  };

  const handleReject = () => {
    if (selectedInvoice) {
      rejectInvoice(selectedInvoice.id, "OCR识别信息有误，需重新识别");
      setIsModalOpen(false);
      setSelectedInvoice(null);
    }
  };

  const FilterBtn = ({ value, current, onChange, labels }: any) => (
    <Button variant={current === value ? "primary" : "secondary"} size="sm" onClick={() => onChange(value)}>
      {labels[value]}
    </Button>
  );

  const InputField = ({ label, value, onChange, type = "text" }: any) => (
    <div>
      <label className="text-sm text-slate-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  );

  return (
    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-2">
              {typeOptions.map((t) => <FilterBtn key={t} value={t} current={typeFilter} onChange={setTypeFilter} labels={typeLabels} />)}
            </div>
            <div className="flex gap-2">
              {statusOptions.map((s) => <FilterBtn key={s} value={s} current={statusFilter} onChange={setStatusFilter} labels={statusLabels} />)}
            </div>
            <div className="flex-1 min-w-[200px]">
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

      {filteredInvoices.length === 0 ? <Empty title="暂无票据数据" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInvoices.map((invoice, idx) => {
            const statusInfo = ocrStatusMap[invoice.ocrStatus];
            return (
              <m.div
                key={invoice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Card hoverable className="h-full flex flex-col">
                  <CardContent className="flex-1 p-4">
                    <div className="flex gap-4">
                      <img src={invoice.imageUrl} alt={invoice.invoiceNo} className="w-32 h-24 object-cover rounded-lg border border-slate-200" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className={cn("text-2xl font-bold", invoice.type === "income" ? "text-emerald-600" : "text-rose-600")}>
                            {invoice.type === "income" ? "+" : "-"}{formatCurrency(invoice.amount)}
                          </div>
                          <Badge variant={statusInfo.variant} size="sm">{statusInfo.label}</Badge>
                        </div>
                        <div className="text-sm text-slate-600 space-y-1">
                          <p className="truncate"><span className="text-slate-400">发票号：</span>{invoice.invoiceNo}</p>
                          <p><span className="text-slate-400">日期：</span>{formatDate(invoice.date)}</p>
                          <p className="truncate"><span className="text-slate-400">供应商：</span>{invoice.vendor}</p>
                        </div>
                      </div>
                    </div>
                    {invoice.ocrResult && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-500 flex items-center gap-1"><Eye className="w-4 h-4" />OCR识别置信度</span>
                          <span className="text-sm font-medium text-slate-700">{formatPercent(invoice.ocrResult.confidence * 100)}</span>
                        </div>
                        <ProgressBar
                          value={invoice.ocrResult.confidence * 100}
                          variant={invoice.ocrResult.confidence >= 0.95 ? "success" : invoice.ocrResult.confidence >= 0.8 ? "warning" : "danger"}
                          size="sm"
                          showAnimation={false}
                        />
                      </div>
                    )}
                  </CardContent>
                  {(invoice.ocrStatus === "reviewing" || invoice.ocrStatus === "pending") && (
                    <CardFooter className="p-4 pt-0">
                      <Button className="w-full" leftIcon={<Check className="w-4 h-4" />} onClick={() => handleReview(invoice)}>OCR复核</Button>
                    </CardFooter>
                  )}
                </Card>
              </m.div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="OCR复核"
        size="xl"
        footer={
          <>
            <Button variant="secondary" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={handleReject}>退回重识别</Button>
            <Button onClick={handleConfirm} leftIcon={<Check className="w-4 h-4" />}>确认通过</Button>
          </>
        }
      >
        <AnimatePresence mode="wait">
          {selectedInvoice && (
            <m.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex gap-6">
                <div className="w-1/2">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><FileText className="w-4 h-4" />票据原图</h4>
                  <img src={selectedInvoice.imageUrl} alt="发票图片" className="w-full rounded-lg border border-slate-200 object-cover" />
                </div>
                <div className="w-1/2 space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Eye className="w-4 h-4" />OCR识别结果（可编辑）</h4>
                  <InputField label="发票号" value={editForm.invoiceNo} onChange={(v: string) => setEditForm({ ...editForm, invoiceNo: v })} />
                  <InputField label="金额（元）" value={editForm.amount} type="number" onChange={(v: string) => setEditForm({ ...editForm, amount: Number(v) })} />
                  <InputField label="供应商" value={editForm.vendor} onChange={(v: string) => setEditForm({ ...editForm, vendor: v })} />
                  <InputField label="日期" value={editForm.date} type="date" onChange={(v: string) => setEditForm({ ...editForm, date: v })} />
                  <div>
                    <label className="text-sm text-slate-500">归属科目</label>
                    <select
                      value={editForm.accountId}
                      onChange={(e) => {
                        const account = flatAccounts.find((a) => a.id === e.target.value);
                        setEditForm({ ...editForm, accountId: e.target.value, accountName: account?.name || "" });
                      }}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">请选择科目</option>
                      {flatAccounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              {selectedInvoice.ocrResult && (
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Eye className="w-4 h-4" />识别置信度</span>
                    <span className="text-sm font-bold text-primary-600">{formatPercent(selectedInvoice.ocrResult.confidence * 100)}</span>
                  </div>
                  <ProgressBar
                    value={selectedInvoice.ocrResult.confidence * 100}
                    variant={selectedInvoice.ocrResult.confidence >= 0.95 ? "success" : selectedInvoice.ocrResult.confidence >= 0.8 ? "warning" : "danger"}
                    size="md"
                    showAnimation
                  />
                </div>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </Modal>
    </m.div>
  );
}
