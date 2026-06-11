import { useState, useEffect, useCallback, useRef } from "react";
import {
  Ticket,
  ShoppingBag,
  Wallet,
  Search,
  Send,
  CheckCircle,
  XCircle,
  ChevronDown,
  X,
  Coins,
  Package,
  Link2,
  Receipt,
  ListOrdered,
  FileText,
  ExternalLink,
  CheckSquare,
} from "lucide-react";
import { useStore } from "@/store";
import StatusBadge from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import type { PointsProduct, OrgNode, BudgetDetail, RedeemedVoucher } from "@/types";

type TabKey = "vouchers" | "points" | "budgets";

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "vouchers", label: "电子券管理", icon: Ticket },
  { key: "points", label: "积分商城", icon: ShoppingBag },
  { key: "budgets", label: "福利预算管理", icon: Wallet },
];

const categories = ["全部", "生活用品", "运动户外", "文化教育", "健康医疗"];

function findOrgName(tree: OrgNode[], orgId: string): string {
  for (const node of tree) {
    if (node.id === orgId) return node.name;
    const found = findOrgName(node.children, orgId);
    if (found) return found;
  }
  return orgId;
}

export default function Benefits() {
  const [activeTab, setActiveTab] = useState<TabKey>("vouchers");

  const {
    voucherTemplates,
    myVouchers,
    pointsProducts,
    budgets,
    members,
    orgTree,
    budgetDetails,
    fetchVoucherTemplates,
    fetchMyVouchers,
    fetchPointsProducts,
    fetchBudgets,
    fetchMembers,
    fetchOrgTree,
    fetchBudgetDetail,
    redeemVoucher,
    batchRedeemVouchers,
    exchangePoints,
    approveBudget,
    rejectBudget,
  } = useStore();

  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [issueTemplateId, setIssueTemplateId] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  const [exchangeDialogOpen, setExchangeDialogOpen] = useState(false);
  const [exchangeProduct, setExchangeProduct] = useState<PointsProduct | null>(null);

  const [categoryFilter, setCategoryFilter] = useState("全部");

  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);
  const [budgetUsageDetailId, setBudgetUsageDetailId] = useState<string | null>(null);
  const [reconcileDialogBudgetId, setReconcileDialogBudgetId] = useState<string | null>(null);
  const [loadingBudgetDetail, setLoadingBudgetDetail] = useState<string | null>(null);

  const [budgetActionDialog, setBudgetActionDialog] = useState<{
    budgetId: string;
    action: "approve" | "reject";
  } | null>(null);
  const [actionComment, setActionComment] = useState("");

  const [selectedVoucherIds, setSelectedVoucherIds] = useState<string[]>([]);
  const [batchRedeemConfirm, setBatchRedeemConfirm] = useState(false);

  const budgetCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    fetchVoucherTemplates();
    fetchMyVouchers("mem-1");
    fetchPointsProducts();
    fetchBudgets();
    fetchMembers();
    fetchOrgTree();
  }, []);

  const getTemplateName = useCallback(
    (templateId: string) => {
      const t = voucherTemplates.find((v) => v.id === templateId);
      return t ? t.name : templateId;
    },
    [voucherTemplates]
  );

  const getTemplateAmount = useCallback(
    (templateId: string) => {
      const t = voucherTemplates.find((v) => v.id === templateId);
      return t ? t.amount : 0;
    },
    [voucherTemplates]
  );

  const getBudgetById = useCallback(
    (budgetId: string) => {
      return budgets.find((b) => b.id === budgetId);
    },
    [budgets]
  );

  const currentMember = members.find((m) => m.id === "mem-1");
  const pointsBalance = currentMember?.points ?? 2580;

  const filteredProducts =
    categoryFilter === "全部"
      ? pointsProducts
      : pointsProducts.filter((p) => p.category === categoryFilter);

  const filteredMembers = memberSearch
    ? members.filter(
        (m) =>
          m.name.includes(memberSearch) ||
          m.employeeNo.includes(memberSearch) ||
          m.orgName.includes(memberSearch)
      )
    : members;

  const handleIssueVoucher = () => {
    setIssueDialogOpen(false);
    setSelectedMemberIds([]);
    setMemberSearch("");
  };

  const handleExchange = async () => {
    if (!exchangeProduct) return;
    await exchangePoints("mem-1", exchangeProduct.id);
    setExchangeDialogOpen(false);
    setExchangeProduct(null);
  };

  const handleBudgetAction = async () => {
    if (!budgetActionDialog) return;
    if (budgetActionDialog.action === "approve") {
      await approveBudget(budgetActionDialog.budgetId, actionComment || undefined);
    } else {
      await rejectBudget(budgetActionDialog.budgetId, actionComment || undefined);
    }
    setBudgetActionDialog(null);
    setActionComment("");
    fetchBudgets();
  };

  const handleRedeem = async (voucherId: string) => {
    await redeemVoucher(voucherId, "mem-1");
    fetchBudgets();
  };

  const handleBatchRedeem = async () => {
    if (selectedVoucherIds.length === 0) return;
    await batchRedeemVouchers(selectedVoucherIds, "mem-1");
    setSelectedVoucherIds([]);
    setBatchRedeemConfirm(false);
    fetchBudgets();
  };

  const loadBudgetDetail = async (budgetId: string) => {
    if (budgetDetails[budgetId]) return budgetDetails[budgetId];
    setLoadingBudgetDetail(budgetId);
    const detail = await fetchBudgetDetail(budgetId);
    setLoadingBudgetDetail(null);
    return detail;
  };

  const toggleBudgetExpand = async (budgetId: string) => {
    const willExpand = budgetUsageDetailId !== budgetId;
    if (willExpand) {
      await loadBudgetDetail(budgetId);
      setBudgetUsageDetailId(budgetId);
    } else {
      setBudgetUsageDetailId(null);
    }
  };

  const openReconcileDialog = async (budgetId: string) => {
    await loadBudgetDetail(budgetId);
    setReconcileDialogBudgetId(budgetId);
  };

  const handleScrollToBudget = (budgetId: string) => {
    setActiveTab("budgets");
    setTimeout(async () => {
      await loadBudgetDetail(budgetId);
      setBudgetUsageDetailId(budgetId);
      const el = budgetCardRefs.current[budgetId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const unusedMyVouchers = myVouchers.filter((v) => v.status === "unused");
  const allUnusedSelected =
    unusedMyVouchers.length > 0 && unusedMyVouchers.every((v) => selectedVoucherIds.includes(v.id));

  const toggleSelectAllUnused = () => {
    if (allUnusedSelected) {
      setSelectedVoucherIds([]);
    } else {
      setSelectedVoucherIds(unusedMyVouchers.map((v) => v.id));
    }
  };

  const issueTemplate = voucherTemplates.find((t) => t.id === issueTemplateId);
  const reconcileBudgetDetail = reconcileDialogBudgetId ? budgetDetails[reconcileDialogBudgetId] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">福利中心</h1>
        <p className="text-sm text-gray-500 mt-1">管理电子券、积分兑换和福利预算</p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === tab.key
                  ? "bg-white text-union-red shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "vouchers" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">券模板</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {voucherTemplates.map((tpl) => {
                const linkedBudget = tpl.budgetId ? getBudgetById(tpl.budgetId) : null;
                return (
                  <div key={tpl.id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{tpl.name}</h3>
                      <StatusBadge status={tpl.status} />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">金额</span>
                        <span className="font-semibold text-union-red">¥{tpl.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">总量/剩余</span>
                        <span>
                          {tpl.totalQuantity} / {tpl.remainingQuantity}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">到期日</span>
                        <span>{tpl.expiryDate}</span>
                      </div>
                      {linkedBudget && (
                        <div
                          className="mt-2 p-2 bg-union-red/5 rounded-lg border border-union-red/10 cursor-pointer hover:bg-union-red/10 transition-colors"
                          onClick={() => handleScrollToBudget(tpl.budgetId!)}
                        >
                          <div className="flex items-center gap-1.5 text-xs text-union-red">
                            <Link2 size={12} />
                            <span className="font-medium">来自预算: {linkedBudget.title}</span>
                            <ExternalLink size={10} />
                          </div>
                          <div className="text-xs text-union-red/70 mt-0.5 pl-5.5">
                            ¥{linkedBudget.totalAmount.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setIssueTemplateId(tpl.id);
                        setIssueDialogOpen(true);
                        setSelectedMemberIds([]);
                        setMemberSearch("");
                      }}
                      disabled={tpl.status !== "active" || tpl.remainingQuantity <= 0}
                      className={cn(
                        "mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        tpl.status === "active" && tpl.remainingQuantity > 0
                          ? "btn-primary"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      )}
                    >
                      <Send size={14} />
                      发放
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">我的电子券</h2>
              <div className="flex items-center gap-2">
                {selectedVoucherIds.length > 0 && (
                  <span className="text-sm text-gray-500">
                    已选择 {selectedVoucherIds.length} 张
                  </span>
                )}
                <button
                  onClick={() => setBatchRedeemConfirm(true)}
                  disabled={selectedVoucherIds.length === 0}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                    selectedVoucherIds.length > 0
                      ? "btn-primary"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <CheckSquare size={14} />
                  批量核销
                </button>
              </div>
            </div>
            {myVouchers.length === 0 ? (
              <div className="card text-center text-gray-400 py-12">
                <Ticket size={48} className="mx-auto mb-3 opacity-30" />
                <p>暂无电子券</p>
              </div>
            ) : (
              <div className="card overflow-hidden p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-3 py-3 font-medium text-gray-500 w-10">
                        <input
                          type="checkbox"
                          checked={allUnusedSelected}
                          onChange={toggleSelectAllUnused}
                          className="w-4 h-4 rounded border-gray-300 text-union-red focus:ring-union-red/30"
                        />
                      </th>
                      <th className="text-left px-3 py-3 font-medium text-gray-500">券码</th>
                      <th className="text-left px-3 py-3 font-medium text-gray-500">模板名称</th>
                      <th className="text-left px-3 py-3 font-medium text-gray-500">金额</th>
                      <th className="text-left px-3 py-3 font-medium text-gray-500">状态</th>
                      <th className="text-left px-3 py-3 font-medium text-gray-500">发放日期</th>
                      <th className="text-left px-3 py-3 font-medium text-gray-500">核销流水号</th>
                      <th className="text-left px-3 py-3 font-medium text-gray-500">核销时间</th>
                      <th className="text-left px-3 py-3 font-medium text-gray-500">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myVouchers.map((v) => (
                      <tr
                        key={v.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-3 py-3">
                          {v.status === "unused" ? (
                            <input
                              type="checkbox"
                              checked={selectedVoucherIds.includes(v.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedVoucherIds([...selectedVoucherIds, v.id]);
                                } else {
                                  setSelectedVoucherIds(
                                    selectedVoucherIds.filter((id) => id !== v.id)
                                  );
                                }
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-union-red focus:ring-union-red/30"
                            />
                          ) : null}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs">{v.code}</td>
                        <td className="px-3 py-3">{v.templateName || getTemplateName(v.templateId)}</td>
                        <td className="px-3 py-3 text-union-red font-semibold">
                          ¥{v.amount ?? getTemplateAmount(v.templateId)}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={v.status} />
                        </td>
                        <td className="px-3 py-3 text-gray-500">{v.issuedAt}</td>
                        <td className="px-3 py-3">
                          {v.status === "used" && v.serialNo ? (
                            <span className="font-mono text-xs text-gray-600">{v.serialNo}</span>
                          ) : v.status === "used" ? (
                            <span className="font-mono text-xs text-gray-400">HX{v.id.toUpperCase()}</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-gray-500">
                          {v.usedAt || <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-3 py-3">
                          {v.status === "unused" && (
                            <button
                              onClick={() => handleRedeem(v.id)}
                              className="btn-primary text-xs px-3 py-1"
                            >
                              核销
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "points" && (
        <div className="space-y-6">
          <div className="card bg-gradient-to-r from-union-red to-union-red-dark text-white border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm mb-1">当前积分</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-serif">
                    {pointsBalance.toLocaleString()}
                  </span>
                  <span className="text-union-gold text-sm font-medium">积分</span>
                </div>
              </div>
              <Coins size={56} className="text-white/20" />
            </div>
          </div>

          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                  categoryFilter === cat
                    ? "bg-union-red text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="card">
                <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package size={40} className="text-gray-300" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-union-gold/10 text-union-gold text-xs font-medium rounded-full">
                    {product.category}
                  </span>
                  <span className="text-xs text-gray-400">库存 {product.stock}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-union-red font-serif">
                      {product.points}
                    </span>
                    <span className="text-xs text-gray-500">积分</span>
                  </div>
                  <button
                    onClick={() => {
                      setExchangeProduct(product);
                      setExchangeDialogOpen(true);
                    }}
                    disabled={product.stock <= 0 || pointsBalance < product.points}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                      product.stock > 0 && pointsBalance >= product.points
                        ? "btn-gold text-xs"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed text-xs"
                    )}
                  >
                    兑换
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "budgets" && (
        <div className="space-y-6">
          {budgets.map((budget) => {
            const percentage =
              budget.totalAmount > 0
                ? Math.round((budget.usedAmount / budget.totalAmount) * 100)
                : 0;
            const isApprovalExpanded = expandedBudgetId === budget.id;
            const isUsageExpanded = budgetUsageDetailId === budget.id;
            const orgName = findOrgName(orgTree, budget.orgId);
            const detail: BudgetDetail | undefined = budgetDetails[budget.id];
            const linkedTemplatesForBadge = voucherTemplates.filter((t) => t.budgetId === budget.id);

            return (
              <div
                key={budget.id}
                ref={(el) => (budgetCardRefs.current[budget.id] = el)}
                className={cn(
                  "card transition-all duration-300",
                  isUsageExpanded && "ring-2 ring-union-red/20 border-union-red/30"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{budget.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{orgName}</p>
                    {linkedTemplatesForBadge.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {linkedTemplatesForBadge.map((tpl) => (
                          <span
                            key={tpl.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-union-red/10 text-union-red text-xs font-medium rounded-full"
                          >
                            <Ticket size={10} />
                            {tpl.name}×{tpl.totalQuantity}份
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <StatusBadge status={budget.status} />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500">总预算</p>
                    <p className="text-lg font-bold text-gray-900 font-serif">
                      ¥{budget.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">已使用</p>
                    <p className="text-lg font-bold text-union-red font-serif">
                      ¥{budget.usedAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">使用率</p>
                    <p className="text-lg font-bold font-serif">{percentage}%</p>
                  </div>
                </div>

                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      percentage >= 90
                        ? "bg-red-500"
                        : percentage >= 60
                        ? "bg-union-gold"
                        : "bg-union-red"
                    )}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setExpandedBudgetId(isApprovalExpanded ? null : budget.id)}
                    className="flex items-center gap-1 text-sm text-union-red hover:underline"
                  >
                    {isApprovalExpanded ? "收起审批流程" : "查看审批流程"}
                    <ChevronDown
                      size={14}
                      className={cn("transition-transform duration-200", isApprovalExpanded && "rotate-180")}
                    />
                  </button>
                  <button
                    onClick={() => toggleBudgetExpand(budget.id)}
                    disabled={loadingBudgetDetail === budget.id}
                    className="flex items-center gap-1 text-sm text-union-gold hover:underline disabled:opacity-50"
                  >
                    <ListOrdered size={14} />
                    {isUsageExpanded ? "收起额度明细" : "额度占用明细"}
                    <ChevronDown
                      size={14}
                      className={cn("transition-transform duration-200", isUsageExpanded && "rotate-180")}
                    />
                  </button>
                  <button
                    onClick={() => openReconcileDialog(budget.id)}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 hover:underline ml-auto"
                  >
                    <Receipt size={14} />
                    核销对账记录
                  </button>
                </div>

                {isApprovalExpanded && (
                  <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-4">
                    {budget.approvalFlow.map((step, idx) => (
                      <div key={idx} className="relative pl-6">
                        <div
                          className={cn(
                            "absolute left-[-9px] top-1 w-4 h-4 rounded-full border-2",
                            step.status === "approved"
                              ? "bg-green-500 border-green-500"
                              : step.status === "rejected"
                              ? "bg-red-500 border-red-500"
                              : "bg-white border-gray-300"
                          )}
                        />
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {step.approverName}
                              </span>
                              <StatusBadge status={step.status} />
                            </div>
                            {step.comment && (
                              <p className="text-sm text-gray-500 mt-1">{step.comment}</p>
                            )}
                            {step.timestamp && (
                              <p className="text-xs text-gray-400 mt-1">{step.timestamp}</p>
                            )}
                          </div>
                          {step.status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  setBudgetActionDialog({
                                    budgetId: budget.id,
                                    action: "approve",
                                  })
                                }
                                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                              >
                                <CheckCircle size={12} />
                                通过
                              </button>
                              <button
                                onClick={() =>
                                  setBudgetActionDialog({
                                    budgetId: budget.id,
                                    action: "reject",
                                  })
                                }
                                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                              >
                                <XCircle size={12} />
                                驳回
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isUsageExpanded && detail && (
                  <div className="mt-4 p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-gray-500 text-xs mb-1">关联福利模板</p>
                        <p className="font-semibold text-gray-900">
                          {detail.linkedTemplates.length} 个
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {detail.linkedTemplates.map((t) => (
                            <span
                              key={t.id}
                              className="text-xs px-1.5 py-0.5 bg-union-red/10 text-union-red rounded"
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-gray-500 text-xs mb-1">累计发放</p>
                        <p className="font-semibold text-gray-900">
                          {detail.issuedCount} 张
                        </p>
                        <p className="text-union-red font-semibold text-sm">
                          ¥{detail.issuedAmount.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-gray-500 text-xs mb-1">累计核销</p>
                        <p className="font-semibold text-gray-900">{detail.usedCount} 张</p>
                        <p className="text-union-gold font-semibold text-sm">
                          ¥{detail.usedAmount.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-gray-500 text-xs mb-1">剩余预算</p>
                        <p className="font-bold text-green-600 text-lg font-serif">
                          ¥{detail.remainingBudget.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <FileText size={14} className="text-union-red" />
                        明细表格
                      </h4>
                      <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="text-left px-4 py-2.5 font-medium text-gray-500">
                                模板名称
                              </th>
                              <th className="text-right px-4 py-2.5 font-medium text-gray-500">
                                单张金额
                              </th>
                              <th className="text-right px-4 py-2.5 font-medium text-gray-500">
                                发放数
                              </th>
                              <th className="text-right px-4 py-2.5 font-medium text-gray-500">
                                核销数
                              </th>
                              <th className="text-right px-4 py-2.5 font-medium text-gray-500">
                                累计核销金额
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.voucherBreakdown.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="px-4 py-6 text-center text-gray-400"
                                >
                                  暂无发放记录
                                </td>
                              </tr>
                            ) : (
                              detail.voucherBreakdown.map((row) => (
                                <tr
                                  key={row.templateId}
                                  className="border-b border-gray-50 last:border-0"
                                >
                                  <td className="px-4 py-2.5 font-medium text-gray-900">
                                    {row.name}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    ¥{row.amountPerUnit.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">{row.issued}</td>
                                  <td className="px-4 py-2.5 text-right text-union-gold font-medium">
                                    {row.used}
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-semibold text-union-red">
                                    ¥{row.totalUsedAmount.toLocaleString()}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {issueDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                发放电子券{issueTemplate ? ` - ${issueTemplate.name}` : ""}
              </h3>
              <button
                onClick={() => setIssueDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 flex-1 overflow-y-auto">
              <div className="relative mb-4">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="搜索成员姓名、工号、组织..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="input-field pl-9"
                />
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredMembers.map((member) => (
                  <label
                    key={member.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                      selectedMemberIds.includes(member.id)
                        ? "bg-union-red/5 border border-union-red/20"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMemberIds([...selectedMemberIds, member.id]);
                        } else {
                          setSelectedMemberIds(
                            selectedMemberIds.filter((id) => id !== member.id)
                          );
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-union-red focus:ring-union-red/30"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">
                        {member.orgName} · {member.employeeNo}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                已选择 {selectedMemberIds.length} 人
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIssueDialogOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleIssueVoucher}
                  disabled={selectedMemberIds.length === 0}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    selectedMemberIds.length > 0
                      ? "btn-primary"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  确认发放
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {exchangeDialogOpen && exchangeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">确认兑换</h3>
              <button
                onClick={() => {
                  setExchangeDialogOpen(false);
                  setExchangeProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-6">
              <div className="text-center mb-4">
                <Package size={48} className="mx-auto mb-3 text-union-gold" />
                <h4 className="font-semibold text-gray-900">{exchangeProduct.name}</h4>
                <p className="text-2xl font-bold text-union-red font-serif mt-2">
                  {exchangeProduct.points}{" "}
                  <span className="text-sm text-gray-500 font-normal">积分</span>
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">当前积分</span>
                  <span className="font-medium">{pointsBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">兑换后余额</span>
                  <span
                    className={cn(
                      "font-medium",
                      pointsBalance >= exchangeProduct.points
                        ? "text-green-600"
                        : "text-red-600"
                    )}
                  >
                    {Math.max(0, pointsBalance - exchangeProduct.points).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setExchangeDialogOpen(false);
                  setExchangeProduct(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button onClick={handleExchange} className="flex-1 btn-gold">
                确认兑换
              </button>
            </div>
          </div>
        </div>
      )}

      {budgetActionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {budgetActionDialog.action === "approve" ? "审批通过" : "审批驳回"}
              </h3>
              <button
                onClick={() => {
                  setBudgetActionDialog(null);
                  setActionComment("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                审批意见
              </label>
              <textarea
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                placeholder="请输入审批意见（可选）"
                rows={3}
                className="input-field resize-none"
              />
            </div>
            <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setBudgetActionDialog(null);
                  setActionComment("");
                }}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleBudgetAction}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  budgetActionDialog.action === "approve"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-red-600 text-white hover:bg-red-700"
                )}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {batchRedeemConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CheckSquare size={18} className="text-union-red" />
                批量核销确认
              </h3>
              <button
                onClick={() => setBatchRedeemConfirm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-6">
              <div className="bg-union-red/5 rounded-xl p-4 border border-union-red/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600">待核销电子券数量</span>
                  <span className="text-2xl font-bold text-union-red font-serif">
                    {selectedVoucherIds.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">预计核销总金额</span>
                  <span className="font-semibold text-union-gold">
                    ¥
                    {selectedVoucherIds
                      .reduce(
                        (sum, id) =>
                          sum + (myVouchers.find((v) => v.id === id)?.amount ?? getTemplateAmount(myVouchers.find((v) => v.id === id)?.templateId || "")),
                        0
                      )
                      .toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                核销人：系统管理员 · 核销后将自动关联对应预算并扣减额度
              </p>
            </div>
            <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setBatchRedeemConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button onClick={handleBatchRedeem} className="flex-1 btn-primary">
                确认核销
              </button>
            </div>
          </div>
        </div>
      )}

      {reconcileDialogBudgetId && reconcileBudgetDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Receipt size={18} className="text-union-red" />
                  核销对账记录
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {reconcileBudgetDetail.title}
                </p>
              </div>
              <button
                onClick={() => setReconcileDialogBudgetId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 flex-1 overflow-y-auto">
              {reconcileBudgetDetail.redeemedVouchers.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Receipt size={48} className="mx-auto mb-3 opacity-30" />
                  <p>暂无核销记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reconcileBudgetDetail.redeemedVouchers.map((rv: RedeemedVoucher) => (
                    <div
                      key={rv.id}
                      className="p-4 bg-gray-50/80 rounded-xl border border-gray-100"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs px-2 py-0.5 bg-union-red/10 text-union-red rounded font-semibold">
                              {rv.serialNo}
                            </span>
                            <span className="text-xs text-gray-400">核销流水号</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mt-2">
                            {rv.templateName} · 券码 {rv.code}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-union-red font-serif">
                          ¥{rv.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <p className="text-gray-500 mb-0.5">会员姓名</p>
                          <p className="font-medium text-gray-900">{rv.memberName}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-0.5">所属组织</p>
                          <p className="font-medium text-gray-700 truncate">
                            {rv.memberOrgName}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-0.5">核销时间</p>
                          <p className="font-medium text-gray-700">{rv.usedAt}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-0.5">核销人</p>
                          <p className="font-medium text-gray-700">{rv.operatorName}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <div className="text-sm">
                <span className="text-gray-500">累计核销：</span>
                <span className="font-semibold text-union-red">
                  {reconcileBudgetDetail.usedCount} 张
                </span>
                <span className="text-gray-400 mx-2">/</span>
                <span className="text-gray-500">总金额：</span>
                <span className="font-bold text-union-gold font-serif">
                  ¥{reconcileBudgetDetail.usedAmount.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setReconcileDialogBudgetId(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
