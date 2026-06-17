import { useState, useMemo } from "react";
import { motion as m } from "framer-motion";
import { Search, Check, FileText, Eye } from "lucide-react";
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
import type { Invoice } from "@/types";

const typeLabels: Record<string, string> = { all: "全部", income: "收入", expense: "支出" };
const statusLabels: Record<string, string> = { all: "全部", verified: "已审核", pending: "待审核" };
const typeOptions = ["all", "income", "expense"] as const;
const statusOptions = ["all", "verified", "pending"] as const;

export default function InvoiceList() {
  const { invoices, verifyInvoice } = useAppStore();
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "pending">("all");
  const [searchText, setSearchText] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredInvoices = useMemo(
    () =>
      invoices.filter((inv) => {
        if (typeFilter !== "all" && inv.type !== typeFilter) return false;
        if (statusFilter === "verified" && !inv.verified) return false;
        if (statusFilter === "pending" && inv.verified) return false;
        if (searchText) {
          const lower = searchText.toLowerCase();
          return (
            inv.vendor.toLowerCase().includes(lower) ||
            inv.invoiceNo.includes(lower) ||
            inv.accountName.toLowerCase().includes(lower)
          );
        }
        return true;
      }),
    [invoices, typeFilter, statusFilter, searchText]
  );

  const handleVerify = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const confirmVerify = () => {
    if (selectedInvoice) {
      verifyInvoice(selectedInvoice.id);
      setIsModalOpen(false);
      setSelectedInvoice(null);
    }
  };

  const FilterButton = ({
    value,
    current,
    onChange,
    labels,
  }: {
    value: string;
    current: string;
    onChange: (v: any) => void;
    labels: Record<string, string>;
  }) => (
    <Button
      variant={current === value ? "primary" : "secondary"}
      size="sm"
      onClick={() => onChange(value)}
    >
      {labels[value]}
    </Button>
  );

  const InputField = ({ label, value }: { label: string; value: string | number }) => (
    <div>
      <label className="text-sm text-slate-500">{label}</label>
      <input
        type={typeof value === "number" ? "number" : "text"}
        defaultValue={value}
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
              {typeOptions.map((t) => (
                <FilterButton key={t} value={t} current={typeFilter} onChange={setTypeFilter} labels={typeLabels} />
              ))}
            </div>
            <div className="flex gap-2">
              {statusOptions.map((s) => (
                <FilterButton key={s} value={s} current={statusFilter} onChange={setStatusFilter} labels={statusLabels} />
              ))}
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

      {filteredInvoices.length === 0 ? (
        <Empty title="暂无票据数据" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInvoices.map((invoice, idx) => (
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
                          {invoice.type === "income" ? "+" : "-"}
                          {formatCurrency(invoice.amount)}
                        </div>
                        <Badge variant={invoice.verified ? "success" : "warning"} size="sm">
                          {invoice.verified ? "已审核" : "待审核"}
                        </Badge>
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
                {!invoice.verified && (
                  <CardFooter className="p-4 pt-0">
                    <Button className="w-full" leftIcon={<Check className="w-4 h-4" />} onClick={() => handleVerify(invoice)}>审核</Button>
                  </CardFooter>
                )}
              </Card>
            </m.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="票据审核"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>取消</Button>
            <Button onClick={confirmVerify} leftIcon={<Check className="w-4 h-4" />}>确认审核</Button>
          </>
        }
      >
        {selectedInvoice?.ocrResult && (
          <div className="space-y-4">
            <div className="flex gap-6">
              <img src={selectedInvoice.imageUrl} alt="发票图片" className="w-64 h-48 object-cover rounded-lg border border-slate-200" />
              <div className="flex-1 space-y-3">
                <InputField label="发票号" value={selectedInvoice.ocrResult.invoiceNo} />
                <InputField label="金额" value={selectedInvoice.ocrResult.amount} />
                <InputField label="日期" value={selectedInvoice.ocrResult.date} />
                <InputField label="供应商" value={selectedInvoice.ocrResult.vendor} />
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><FileText className="w-4 h-4" />明细项目</h4>
              <div className="bg-slate-50 rounded-lg p-4">
                <table className="w-full text-sm">
                  <thead><tr className="text-slate-500"><th className="text-left pb-2">项目名称</th><th className="text-right pb-2">数量</th><th className="text-right pb-2">单价</th><th className="text-right pb-2">小计</th></tr></thead>
                  <tbody>
                    {selectedInvoice.ocrResult.items.map((item, i) => (
                      <tr key={i} className="border-t border-slate-200">
                        <td className="py-2">{item.name}</td>
                        <td className="text-right py-2">{item.quantity}</td>
                        <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
                        <td className="text-right py-2">{formatCurrency(item.quantity * item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </m.div>
  );
}
