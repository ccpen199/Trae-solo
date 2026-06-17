import { useState, useMemo } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  Receipt,
  BookOpen,
  BarChart3,
  PieChart,
  Check,
  X,
  FileSpreadsheet,
  User,
  Clock,
  Link2,
  ArrowRight,
  Wallet,
  Building2,
  Layers,
  Eye,
  CheckCircle2,
  CircleDot,
} from "lucide-react";
import { useAppStore } from "@/stores";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Tabs,
  TabPanel,
} from "@/components/ui";
import { cn, formatCurrency, formatDate } from "@/utils";
import type { FinanceAccount, Voucher } from "@/types";

interface AccountNode {
  id: string;
  name: string;
  code: string;
  type: "income" | "expense";
  children?: AccountNode[];
}

interface TraceNode {
  key: string;
  title: string;
  icon: typeof FileText;
  status: "done" | "current" | "pending";
  time: string;
  operator: string;
  description: string;
  link?: { label: string; onClick: () => void };
  amount?: string;
}

interface Toast {
  show: boolean;
  type: "success" | "error" | "info";
  message: string;
}

const categoryLabels: Record<"internal" | "external", Record<string, string>> = {
  internal: {
    asset: "资产类",
    liability: "负债类",
    equity: "权益类",
    income: "收入类",
    expense: "费用类",
  },
  external: {
    asset: "资产类",
    liability: "负债类",
    equity: "损益类",
    income: "收入类",
    expense: "成本费用类",
  },
};

export default function VoucherTrace() {
  const { vouchers, invoices, financeAccounts, currentUser, showToast } = useAppStore();

  const [bookType, setBookType] = useState<"internal" | "external">("internal");
  const [year, setYear] = useState("2025");
  const [period, setPeriod] = useState("6");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["income", "expense"]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [toast, setToast] = useState<Toast>({ show: false, type: "success", message: "" });

  const showMessage = (type: Toast["type"], message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: "success", message: "" }), 3000);
    showToast(type, message);
  };

  const accountTree = useMemo(() => {
    const buildCategoryNode = (
      categoryKey: string,
      categoryName: string,
      accounts: typeof financeAccounts
    ): AccountNode => ({
      id: `cat-${categoryKey}`,
      name: categoryName,
      code: categoryKey.toUpperCase(),
      type: accounts[0]?.type || "income",
      children: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        code: a.code,
        type: a.type,
        children: a.children?.map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          type: c.type,
          children: c.children?.map((gc) => ({
            id: gc.id,
            name: gc.name,
            code: gc.code,
            type: gc.type,
          })),
        })),
      })),
    });

    const incomeAccounts = financeAccounts.filter((a) => a.type === "income");
    const expenseAccounts = financeAccounts.filter((a) => a.type === "expense");

    return [
      buildCategoryNode("asset", categoryLabels[bookType].asset, [
        {
          id: "asset-1",
          name: "银行存款",
          code: "1001",
          parentId: null,
          type: "income",
          budget: 0,
          actual: 0,
        },
      ]),
      buildCategoryNode("liability", categoryLabels[bookType].liability, []),
      buildCategoryNode("equity", categoryLabels[bookType].equity, []),
      buildCategoryNode("income", categoryLabels[bookType].income, incomeAccounts),
      buildCategoryNode("expense", categoryLabels[bookType].expense, expenseAccounts),
    ];
  }, [financeAccounts, bookType]);

  const filteredVouchers = useMemo(() => {
    let result = vouchers.filter((v) => v.bookType === bookType);
    if (year) {
      result = result.filter((v) => v.date.startsWith(year));
    }
    if (period) {
      const periodStr = `-${String(period).padStart(2, "0")}-`;
      result = result.filter((v) => v.date.includes(periodStr));
    }
    if (selectedAccountId && !selectedAccountId.startsWith("cat-")) {
      result = result.filter((v) =>
        v.entries.some((e) => e.accountId === selectedAccountId)
      );
    }
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [vouchers, bookType, year, period, selectedAccountId]);

  const traceNodes = useMemo<TraceNode[] | null>(() => {
    if (!selectedVoucher) return null;
    const relatedInvoice = invoices.find((i) =>
      selectedVoucher.relatedInvoiceIds.includes(i.id)
    );
    const lastAudit = selectedVoucher.auditRecords[selectedVoucher.auditRecords.length - 1];
    const postedAudit = selectedVoucher.auditRecords.find((r) =>
      r.action.includes("审核") || r.action.includes("制单")
    );

    return [
      {
        key: "invoice",
        title: "原始票据",
        icon: Receipt,
        status: relatedInvoice ? "done" : "pending",
        time: relatedInvoice?.date || selectedVoucher.date,
        operator: relatedInvoice?.vendor || "原始凭证",
        description: relatedInvoice
          ? `${relatedInvoice.vendor} · ${formatCurrency(relatedInvoice.amount)}`
          : "关联原始凭证",
        amount: relatedInvoice ? formatCurrency(relatedInvoice.amount) : undefined,
        link: relatedInvoice
          ? {
              label: "查看票据",
              onClick: () => showMessage("info", `跳转票据详情: ${relatedInvoice.invoiceNo}`),
            }
          : undefined,
      },
      {
        key: "voucher",
        title: "记账凭证",
        icon: FileSpreadsheet,
        status: "current",
        time: selectedVoucher.date,
        operator: postedAudit?.operatorName || currentUser.name,
        description: `${selectedVoucher.summary} · 凭证号 ${selectedVoucher.voucherNo}`,
        amount: formatCurrency(selectedVoucher.totalDebit),
      },
      {
        key: "ledger",
        title: "明细账登记",
        icon: BookOpen,
        status: selectedVoucher.status === "posted" ? "done" : "pending",
        time: selectedVoucher.date,
        operator: selectedVoucher.auditRecords[0]?.operatorName || "-",
        description:
          selectedVoucher.status === "posted"
            ? `已登记 ${selectedVoucher.entries.length} 个会计科目`
            : "待记账",
      },
      {
        key: "general",
        title: "总账汇总",
        icon: Layers,
        status: selectedVoucher.status === "posted" ? "done" : "pending",
        time: selectedVoucher.date,
        operator: "系统自动",
        description:
          selectedVoucher.status === "posted"
            ? "已汇总至总账科目余额表"
            : "等待汇总",
      },
      {
        key: "report",
        title: "财务报表",
        icon: BarChart3,
        status: selectedVoucher.status === "posted" ? "done" : "pending",
        time: `${year}-${String(period).padStart(2, "0")}-30`,
        operator: "系统生成",
        description: "资产负债表 / 利润表 / 现金流量表",
        link: {
          label: "查看报表",
          onClick: () => showMessage("info", `查看 ${year}年${period}月 财务报表`),
        },
      },
    ];
  }, [selectedVoucher, invoices, currentUser, year, period, showMessage]);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const renderNode = (node: AccountNode, level: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded =
      node.id.startsWith("cat-") &&
      expandedCategories.includes(node.id.replace("cat-", ""));
    const isSelected = selectedAccountId === node.id;
    const isCategory = node.id.startsWith("cat-");

    return (
      <div key={node.id}>
        <m.div
          whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
          onClick={() => {
            if (isCategory) {
              toggleCategory(node.id.replace("cat-", ""));
            } else {
              setSelectedAccountId(node.id);
            }
          }}
          className={cn(
            "flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-all text-sm",
            isSelected && !isCategory && "bg-primary-50 text-primary-700 font-medium",
            !isSelected && !isCategory && "text-slate-600 hover:text-slate-800",
            isCategory && "text-slate-700 font-semibold"
          )}
          style={{ paddingLeft: `${8 + level * 16}px` }}
        >
          {hasChildren || isCategory ? (
            <span className="w-4 h-4 flex items-center justify-center text-slate-400">
              {isExpanded || (!isCategory && hasChildren) ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </span>
          ) : (
            <span className="w-4" />
          )}
          {isCategory ? (
            <Folder
              className={cn(
                "w-4 h-4 shrink-0",
                isExpanded ? "text-amber-500" : "text-amber-400"
              )}
            />
          ) : (
            <FileText className="w-4 h-4 shrink-0 text-primary-400" />
          )}
          <span className="truncate flex-1">{node.name}</span>
          {!isCategory && (
            <span className="text-xs text-slate-400 shrink-0 font-mono">
              {node.code}
            </span>
          )}
        </m.div>
        {(isExpanded || (!isCategory && hasChildren)) && node.children && (
          <AnimatePresence initial={false}>
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {node.children.map((child) => renderNode(child, level + 1))}
            </m.div>
          </AnimatePresence>
        )}
      </div>
    );
  };

  const renderStatusIcon = (status: TraceNode["status"]) => {
    if (status === "done") {
      return (
        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
          <Check className="w-5 h-5" />
        </div>
      );
    }
    if (status === "current") {
      return (
        <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-200 ring-4 ring-primary-100 animate-pulse">
          <CircleDot className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">
        <Clock className="w-5 h-5" />
      </div>
    );
  };

  const years = ["2025", "2024", "2023"];
  const periods = Array.from({ length: 12 }, (_, i) => String(i + 1));

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

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Tabs
              tabs={[
                {
                  key: "internal",
                  label: "内账",
                  icon: <Wallet className="w-4 h-4" />,
                },
                {
                  key: "external",
                  label: "外账",
                  icon: <Building2 className="w-4 h-4" />,
                },
              ]}
              activeTab={bookType}
              onChange={(k) => {
                setBookType(k as typeof bookType);
                setSelectedVoucher(null);
                setSelectedAccountId(null);
              }}
              variant="pills"
              className="max-w-xs"
            >
              <TabPanel tabKey="internal" activeKey={bookType}>
                <div />
              </TabPanel>
              <TabPanel tabKey="external" activeKey={bookType}>
                <div />
              </TabPanel>
            </Tabs>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-slate-400" />
              <select
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  setSelectedVoucher(null);
                }}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}年度
                  </option>
                ))}
              </select>
              <select
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value);
                  setSelectedVoucher(null);
                }}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {periods.map((p) => (
                  <option key={p} value={p}>
                    {p}月
                  </option>
                ))}
              </select>
            </div>
            <div className="ml-auto flex items-center gap-3 text-sm">
              <span className="text-slate-500">
                共 <span className="font-semibold text-slate-700">{filteredVouchers.length}</span> 张凭证
              </span>
              <Badge variant="secondary" size="sm">
                {bookType === "internal" ? "内部管理账" : "对外报送账"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Card className="lg:col-span-3 overflow-hidden">
          <CardHeader className="py-3 px-4 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Folder className="w-4 h-4 text-primary-600" />
              科目树
            </CardTitle>
          </CardHeader>
          <div className="px-2 pb-4 max-h-[calc(100vh-360px)] overflow-y-auto">
            <div
              onClick={() => setSelectedAccountId(null)}
              className={cn(
                "flex items-center gap-2 py-2 px-3 mb-2 rounded-lg cursor-pointer transition-all text-sm font-medium",
                !selectedAccountId
                  ? "bg-primary-50 text-primary-700"
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Layers className="w-4 h-4" />
              全部科目
              <span className="ml-auto text-xs text-slate-400">
                {vouchers.filter((v) => v.bookType === bookType).length}
              </span>
            </div>
            {accountTree.map((node) => renderNode(node))}
          </div>
        </Card>

        <Card
          className={cn(
            "lg:col-span-4 overflow-hidden",
            !selectedVoucher ? "lg:col-span-9" : ""
          )}
        >
          <CardHeader className="py-3 px-4 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary-600" />
              凭证列表
              <Badge variant="secondary" size="sm">
                {filteredVouchers.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <div className="max-h-[calc(100vh-360px)] overflow-y-auto">
            {filteredVouchers.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>该条件下暂无凭证</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredVouchers.map((v, idx) => {
                  const isSelected = selectedVoucher?.id === v.id;
                  const creatorName =
                    v.auditRecords.find((r) => r.action === "制单")
                      ?.operatorName || currentUser.name;
                  const reviewerName = v.reviewedBy
                    ? v.auditRecords.find((r) => r.action.includes("审核"))
                        ?.operatorName || "已审核"
                    : null;
                  return (
                    <m.div
                      key={v.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      onClick={() => setSelectedVoucher(v)}
                      className={cn(
                        "p-3 cursor-pointer transition-all",
                        isSelected
                          ? "bg-primary-50/70 border-l-4 border-l-primary-500"
                          : "hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                              {v.voucherNo}
                            </span>
                            <Badge
                              variant={
                                v.status === "posted" ? "success" : "warning"
                              }
                              size="sm"
                              dot
                            >
                              {v.status === "posted" ? "已记账" : "待审核"}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700 font-medium truncate">
                            {v.summary}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div
                            className={cn(
                              "text-sm font-bold",
                              v.type === "income"
                                ? "text-emerald-600"
                                : v.type === "expense"
                                ? "text-rose-600"
                                : "text-slate-700"
                            )}
                          >
                            {v.type === "income"
                              ? "+"
                              : v.type === "expense"
                              ? "-"
                              : "="}
                            {formatCurrency(v.totalDebit)}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {formatDate(v.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          制单: {creatorName}
                        </span>
                        {reviewerName && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            审核: {reviewerName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          附件: {v.relatedInvoiceIds.length + v.attachments.length}
                        </span>
                        <Button
                          size="sm"
                          variant={isSelected ? "primary" : "outline"}
                          className="ml-auto !py-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVoucher(v);
                          }}
                        >
                          <ArrowRight className="w-3 h-3" />
                          追溯链路
                        </Button>
                      </div>
                    </m.div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <AnimatePresence mode="wait">
          {selectedVoucher && traceNodes && (
            <m.div
              key="trace"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.3 }}
              className="lg:col-span-5"
            >
              <Card className="h-full overflow-hidden">
                <CardHeader className="py-3 px-4 pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-primary-600" />
                    追溯链路视图
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedVoucher(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </CardHeader>
                <div className="px-4 pb-4 max-h-[calc(100vh-400px)] overflow-y-auto">
                  <div className="mb-4 p-3 bg-gradient-to-r from-primary-50 to-transparent rounded-lg border border-primary-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="primary" size="sm">
                        {selectedVoucher.voucherNo}
                      </Badge>
                      <Badge
                        variant={
                          selectedVoucher.type === "income"
                            ? "success"
                            : selectedVoucher.type === "expense"
                            ? "danger"
                            : "secondary"
                        }
                        size="sm"
                      >
                        {selectedVoucher.type === "income"
                          ? "收入凭证"
                          : selectedVoucher.type === "expense"
                          ? "支出凭证"
                          : "转账凭证"}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-slate-700">
                      {selectedVoucher.summary}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <span>借方合计: {formatCurrency(selectedVoucher.totalDebit)}</span>
                      <span>贷方合计: {formatCurrency(selectedVoucher.totalCredit)}</span>
                    </div>
                  </div>

                  <div className="relative">
                    {traceNodes.map((node, i) => {
                      const Icon = node.icon;
                      const isLast = i === traceNodes.length - 1;
                      return (
                        <m.div
                          key={node.key}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="relative flex gap-4 pb-5"
                        >
                          {!isLast && (
                            <div
                              className={cn(
                                "absolute left-5 top-12 bottom-0 w-0.5",
                                node.status === "done"
                                  ? "bg-emerald-300"
                                  : node.status === "current"
                                  ? "bg-gradient-to-b from-primary-300 to-slate-200"
                                  : "bg-slate-200"
                              )}
                            />
                          )}
                          {renderStatusIcon(node.status)}
                          <div className="flex-1 min-w-0">
                            <div
                              className={cn(
                                "rounded-xl p-3.5 border transition-all",
                                node.status === "current"
                                  ? "bg-primary-50/50 border-primary-200 shadow-sm"
                                  : node.status === "done"
                                  ? "bg-emerald-50/40 border-emerald-100"
                                  : "bg-slate-50/60 border-slate-100"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4
                                  className={cn(
                                    "font-semibold flex items-center gap-2",
                                    node.status === "current"
                                      ? "text-primary-700"
                                      : node.status === "done"
                                      ? "text-emerald-700"
                                      : "text-slate-500"
                                  )}
                                >
                                  <Icon className="w-4 h-4" />
                                  {node.title}
                                </h4>
                                {node.amount && (
                                  <span
                                    className={cn(
                                      "text-sm font-bold shrink-0",
                                      node.status === "current"
                                        ? "text-primary-700"
                                        : "text-slate-700"
                                    )}
                                  >
                                    {node.amount}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 mb-2">
                                {node.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(node.time)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {node.operator}
                                </span>
                                {node.link && (
                                  <button
                                    onClick={node.link.onClick}
                                    className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 underline underline-offset-2 decoration-primary-300"
                                  >
                                    <Eye className="w-3 h-3" />
                                    {node.link.label}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </m.div>
                      );
                    })}
                  </div>

                  <div className="mt-2 pt-3 border-t border-slate-100">
                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      会计分录
                    </h5>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">
                              科目
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-slate-600 w-20">
                              借方
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-slate-600 w-20">
                              贷方
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedVoucher.entries.map((e) => (
                            <tr key={e.id} className="hover:bg-slate-50/50">
                              <td className="px-3 py-2">
                                <div className="font-medium text-slate-700">
                                  {e.accountName}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {e.accountCode}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-slate-700">
                                {e.debit > 0 ? formatCurrency(e.debit) : "-"}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-slate-700">
                                {e.credit > 0 ? formatCurrency(e.credit) : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-semibold text-slate-700">
                          <tr>
                            <td className="px-3 py-2">合计</td>
                            <td className="px-3 py-2 text-right font-mono">
                              {formatCurrency(selectedVoucher.totalDebit)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono">
                              {formatCurrency(selectedVoucher.totalCredit)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </Card>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </m.div>
  );
}
