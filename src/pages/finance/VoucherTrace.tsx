import { useState, useMemo } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import {
  FileText,
  ChevronRight,
  ChevronDown,
  Eye,
  ArrowRight,
  Receipt,
  BookOpen,
  BarChart3,
  FileCheck,
  Clock,
  User,
  Paperclip,
} from "lucide-react";
import { useAppStore } from "@/stores";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Modal,
  DataTable,
  type Column,
} from "@/components/ui";
import { cn, formatCurrency, formatDate } from "@/utils";
import type { Voucher, FinanceAccount, VoucherStatus } from "@/types";

const statusMap: Record<VoucherStatus, { label: string; variant: "success" | "warning" }> = {
  posted: { label: "已记账", variant: "success" },
  pending_review: { label: "待审核", variant: "warning" },
};

const traceSteps = [
  { key: "invoice", label: "原始票据", icon: Receipt },
  { key: "voucher", label: "记账凭证", icon: FileText },
  { key: "book", label: "会计账簿", icon: BookOpen },
  { key: "report", label: "财务报表", icon: BarChart3 },
];

export default function VoucherTrace() {
  const { vouchers, financeAccounts, invoices } = useAppStore();
  const [bookType, setBookType] = useState<"internal" | "external">("internal");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set(["acc001", "acc006"]));

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      if (v.bookType !== bookType) return false;
      if (selectedAccountId) return v.entries.some((e) => e.accountId === selectedAccountId);
      return true;
    });
  }, [vouchers, bookType, selectedAccountId]);

  const toggleAccount = (id: string) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleViewDetail = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setIsDetailOpen(true);
  };

  const relatedInvoices = useMemo(() => {
    if (!selectedVoucher) return [];
    return invoices.filter((inv) => selectedVoucher.relatedInvoiceIds.includes(inv.id));
  }, [selectedVoucher, invoices]);

  const columns: Column<Voucher>[] = [
    { key: "voucherNo", title: "凭证号", dataIndex: "voucherNo", width: 140,
      render: (_, r) => (
        <button onClick={(e) => { e.stopPropagation(); handleViewDetail(r); }} className="text-primary-600 hover:text-primary-700 font-medium text-sm hover:underline">
          {r.voucherNo}
        </button>
      ),
    },
    { key: "date", title: "日期", dataIndex: "date", width: 110 },
    { key: "summary", title: "摘要", dataIndex: "summary", ellipsis: true },
    { key: "debit", title: "借方金额", dataIndex: "totalDebit", align: "right", width: 120,
      render: (v) => <span className="text-emerald-600 font-medium">{formatCurrency(v as number)}</span>,
    },
    { key: "credit", title: "贷方金额", dataIndex: "totalCredit", align: "right", width: 120,
      render: (v) => <span className="text-rose-600 font-medium">{formatCurrency(v as number)}</span>,
    },
    { key: "status", title: "状态", dataIndex: "status", width: 90, align: "center",
      render: (v) => { const info = statusMap[v as VoucherStatus]; return <Badge variant={info.variant} size="sm">{info.label}</Badge>; },
    },
    { key: "action", title: "操作", dataIndex: "id", width: 80, align: "center",
      render: (_, r) => (
        <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />} onClick={(e) => { e.stopPropagation(); handleViewDetail(r); }}>查看</Button>
      ),
    },
  ];

  const renderAccountTree = (accounts: FinanceAccount[], level = 0) => {
    return accounts.map((acc) => {
      const hasChildren = acc.children && acc.children.length > 0;
      const isExpanded = expandedAccounts.has(acc.id);
      const isSelected = selectedAccountId === acc.id;
      return (
        <div key={acc.id}>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm",
              "hover:bg-primary-50 transition-colors",
              isSelected && "bg-primary-100 text-primary-700 font-medium"
            )}
            style={{ paddingLeft: level * 16 + 8 }}
            onClick={() => {
              if (hasChildren) toggleAccount(acc.id);
              setSelectedAccountId(isSelected ? null : acc.id);
            }}
          >
            {hasChildren ? (isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />) : <span className="w-4" />}
            <span className="truncate">{acc.name}</span>
          </div>
          {hasChildren && isExpanded && (
            <AnimatePresence>
              <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                {renderAccountTree(acc.children!, level + 1)}
              </m.div>
            </AnimatePresence>
          )}
        </div>
      );
    });
  };

  return (
    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              凭证追溯
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant={bookType === "internal" ? "primary" : "secondary"} onClick={() => setBookType("internal")}>内账</Button>
              <Button size="sm" variant={bookType === "external" ? "primary" : "secondary"} onClick={() => setBookType("external")}>外账</Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-3">
          <CardHeader className="pb-3"><CardTitle className="text-sm">科目导航</CardTitle></CardHeader>
          <CardContent className="pt-0"><div className="space-y-0.5">{renderAccountTree(financeAccounts)}</div></CardContent>
        </Card>

        <Card className="col-span-9">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              凭证列表
              <span className="text-slate-400 font-normal ml-2">共 {filteredVouchers.length} 条</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DataTable columns={columns} data={filteredVouchers} rowKey="id" onRowClick={handleViewDetail} showSearch searchPlaceholder="搜索凭证号、摘要..." emptyText="暂无凭证数据" />
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="凭证详情" size="xl">
        <AnimatePresence mode="wait">
          {selectedVoucher && (
            <m.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-slate-500">凭证号</span><p className="font-medium text-slate-800">{selectedVoucher.voucherNo}</p></div>
                <div><span className="text-sm text-slate-500">日期</span><p className="font-medium text-slate-800">{formatDate(selectedVoucher.date)}</p></div>
                <div><span className="text-sm text-slate-500">摘要</span><p className="font-medium text-slate-800">{selectedVoucher.summary}</p></div>
                <div>
                  <span className="text-sm text-slate-500">状态</span>
                  <p><Badge variant={statusMap[selectedVoucher.status].variant} size="sm">{statusMap[selectedVoucher.status].label}</Badge></p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">会计分录</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-600">
                        <th className="text-left px-4 py-2">科目编码</th>
                        <th className="text-left px-4 py-2">科目名称</th>
                        <th className="text-right px-4 py-2">借方金额</th>
                        <th className="text-right px-4 py-2">贷方金额</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedVoucher.entries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="px-4 py-2 text-slate-500">{entry.accountCode}</td>
                          <td className="px-4 py-2">{entry.accountName}</td>
                          <td className="px-4 py-2 text-right text-emerald-600">{entry.debit > 0 ? formatCurrency(entry.debit) : "-"}</td>
                          <td className="px-4 py-2 text-right text-rose-600">{entry.credit > 0 ? formatCurrency(entry.credit) : "-"}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-medium">
                        <td className="px-4 py-2" colSpan={2}>合计</td>
                        <td className="px-4 py-2 text-right text-emerald-600">{formatCurrency(selectedVoucher.totalDebit)}</td>
                        <td className="px-4 py-2 text-right text-rose-600">{formatCurrency(selectedVoucher.totalCredit)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {relatedInvoices.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Paperclip className="w-4 h-4" />关联票据</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {relatedInvoices.map((inv) => (
                      <m.div key={inv.id} whileHover={{ scale: 1.02 }} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                        <img src={inv.imageUrl} alt={inv.invoiceNo} className="w-12 h-12 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{inv.vendor}</p>
                          <p className="text-xs text-slate-500">{formatCurrency(inv.amount)}</p>
                        </div>
                      </m.div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" />审核记录</h4>
                <div className="space-y-2">
                  {selectedVoucher.auditRecords.map((record, idx) => (
                    <m.div key={record.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: idx * 0.05 }} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="p-1.5 rounded-full bg-primary-100 text-primary-600"><User className="w-4 h-4" /></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700">{record.operatorName}</span>
                          <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{record.action}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{record.time}{record.remark && ` · ${record.remark}`}</p>
                      </div>
                    </m.div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><FileCheck className="w-4 h-4" />追溯链路</h4>
                <div className="flex items-center justify-between px-4">
                  {traceSteps.map((step, idx) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center"><Icon className="w-6 h-6" /></div>
                          <span className="text-xs text-slate-600 mt-2">{step.label}</span>
                        </div>
                        {idx < traceSteps.length - 1 && (
                          <div className="flex-1 flex items-center px-2">
                            <div className="flex-1 h-0.5 bg-gradient-to-r from-primary-300 to-primary-500 rounded" />
                            <ArrowRight className="w-4 h-4 text-primary-500 -ml-1" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </Modal>
    </m.div>
  );
}
