import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search, ShieldCheck, ShieldAlert, Store, User, FileText,
  AlertTriangle, CheckCircle, XCircle, Clock, Eye, ChevronRight,
  MapPin, Star, RefreshCw, TrendingUp, Filter, X, ThumbsUp, ThumbsDown
} from "lucide-react";
import { adminMerchants, auditRecords, adminOrders } from "@/data/admin";
import { jobPosts, housingPosts, foodPosts, datingPosts } from "@/data/posts";
import type { AdminMerchant, AuditRecord } from "@/types";

const allPosts = [
  ...jobPosts.map(p => ({ ...p, typeLabel: "招聘" })),
  ...housingPosts.map(p => ({ ...p, typeLabel: "房产" })),
  ...foodPosts.map(p => ({ ...p, typeLabel: "美食" })),
  ...datingPosts.map(p => ({ ...p, typeLabel: "交友" })),
];

interface ReviewTarget {
  id: string;
  type: "merchant" | "publisher" | "content";
  subType: string;
  title: string;
  submitter: string;
  submitterRole: "商户" | "用户" | "管理员";
  township: string;
  riskLevel: "高风险" | "中风险" | "低风险";
  status: "待复核" | "复核通过" | "复核驳回";
  submittedAt: string;
  lastReviewAt?: string;
  reviewer?: string;
  reviewRemarks: string[];
  evidenceCount: number;
  trustScore: number;
}

const merchantReviews: ReviewTarget[] = adminMerchants
  .filter(m => m.qualificationStatus === "待审核" || m.qualificationStatus === "已拒绝")
  .map((m, i) => ({
    id: `mr_${m.id}`,
    type: "merchant" as const,
    subType: "商户资质",
    title: m.name,
    submitter: m.contactName,
    submitterRole: "商户" as const,
    township: m.township,
    riskLevel: (["高风险", "中风险", "低风险"] as const)[i % 3],
    status: m.qualificationStatus === "已拒绝" ? "复核驳回" : "待复核",
    submittedAt: m.registerTime,
    reviewRemarks: m.qualificationStatus === "已拒绝" ? ["首次审核：营业执照模糊不清，请重新上传高清扫描件"] : [],
    evidenceCount: 3,
    trustScore: m.qualificationStatus === "已拒绝" ? 45 : 60 + (i * 5) % 30,
  }));

const publisherReviews: ReviewTarget[] = [
  {
    id: "pr_001", type: "publisher", subType: "发布主体信用", title: "奶茶小李（用户ID: u1001）",
    submitter: "奶茶小李", submitterRole: "用户", township: "乌峰街道",
    riskLevel: "低风险", status: "待复核", submittedAt: "2025-06-18T10:00:00Z",
    reviewRemarks: [], evidenceCount: 1, trustScore: 82,
  },
  {
    id: "pr_002", type: "publisher", subType: "发布主体信用", title: "泼机羊肉粉馆（商户ID: m2001）",
    submitter: "泼机羊肉粉馆", submitterRole: "商户", township: "泼机镇",
    riskLevel: "低风险", status: "复核通过", submittedAt: "2025-06-15T09:00:00Z",
    lastReviewAt: "2025-06-16T14:20:00Z", reviewer: "审核主管老李",
    reviewRemarks: ["证件齐全，经营场所真实，近30天无投诉，予以通过"],
    evidenceCount: 5, trustScore: 95,
  },
  {
    id: "pr_003", type: "publisher", subType: "发布主体信用", title: "王某某（用户ID: u1023）",
    submitter: "王某某", submitterRole: "用户", township: "母享镇",
    riskLevel: "高风险", status: "复核驳回", submittedAt: "2025-06-10T11:00:00Z",
    lastReviewAt: "2025-06-12T09:30:00Z", reviewer: "审核员小王",
    reviewRemarks: ["发布虚假租房信息3次，诱导线下交易", "冻结账号30天，已通知镇雄县公安局网安大队备案"],
    evidenceCount: 8, trustScore: 15,
  },
];

const contentReviews: ReviewTarget[] = auditRecords
  .filter(r => r.status === "待复查" || r.status === "已复查拒绝")
  .slice(0, 6)
  .map((r) => ({
    id: `cr_${r.id}`,
    type: "content" as const,
    subType: r.type,
    title: r.title,
    submitter: r.submitter,
    submitterRole: (r.submitterRole === "认证商户" ? "商户" : r.submitterRole === "管理员" ? "管理员" : "用户") as "商户" | "用户" | "管理员",
    township: r.township,
    riskLevel: r.status === "已复查拒绝" ? "高风险" as const : "中风险" as const,
    status: r.status === "已复查拒绝" ? "复核驳回" as const : "待复核" as const,
    submittedAt: r.submittedAt,
    lastReviewAt: r.reviewTraces[r.reviewTraces.length - 1]?.time,
    reviewer: r.operator !== "系统" ? r.operator : undefined,
    reviewRemarks: r.reviewTraces.filter(t => t.remark).map(t => `${t.action}：${t.remark}`),
    evidenceCount: r.evidence?.length || 0,
    trustScore: r.status === "已复查拒绝" ? 30 : 55,
  }));

const allReviews = [...merchantReviews, ...publisherReviews, ...contentReviews];

const riskColors: Record<ReviewTarget["riskLevel"], string> = {
  "高风险": "bg-ember-50 text-ember-600 border-ember-200",
  "中风险": "bg-amber-50 text-amber-600 border-amber-200",
  "低风险": "bg-jade-50 text-jade-600 border-jade-200",
};

const statusColors: Record<ReviewTarget["status"], string> = {
  "待复核": "bg-purple-50 text-purple-600 border-purple-200",
  "复核通过": "bg-jade-50 text-jade-600 border-jade-200",
  "复核驳回": "bg-ember-50 text-ember-600 border-ember-200",
};

const typeIcons: Record<ReviewTarget["type"], typeof Store> = {
  merchant: Store,
  publisher: User,
  content: FileText,
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function AdminRiders() {
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<"全部" | "merchant" | "publisher" | "content">("全部");
  const [statusFilter, setStatusFilter] = useState<"全部" | ReviewTarget["status"]>("全部");
  const [riskFilter, setRiskFilter] = useState<"全部" | ReviewTarget["riskLevel"]>("全部");
  const [selectedReview, setSelectedReview] = useState<ReviewTarget | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [actionRemark, setActionRemark] = useState("");

  const stats = useMemo(() => ({
    total: allReviews.length,
    pending: allReviews.filter(r => r.status === "待复核").length,
    passed: allReviews.filter(r => r.status === "复核通过").length,
    rejected: allReviews.filter(r => r.status === "复核驳回").length,
    highRisk: allReviews.filter(r => r.riskLevel === "高风险").length,
    avgTrust: Math.round(allReviews.reduce((s, r) => s + r.trustScore, 0) / allReviews.length),
  }), []);

  const filteredReviews = useMemo(() => {
    return allReviews.filter((r) => {
      const matchSearch = !searchText ||
        r.title.includes(searchText) ||
        r.submitter.includes(searchText) ||
        r.township.includes(searchText);
      const matchType = typeFilter === "全部" || r.type === typeFilter;
      const matchStatus = statusFilter === "全部" || r.status === statusFilter;
      const matchRisk = riskFilter === "全部" || r.riskLevel === riskFilter;
      return matchSearch && matchType && matchStatus && matchRisk;
    });
  }, [searchText, typeFilter, statusFilter, riskFilter]);

  const resetFilters = () => {
    setSearchText("");
    setTypeFilter("全部");
    setStatusFilter("全部");
    setRiskFilter("全部");
  };

  const handleAction = (type: "approve" | "reject") => {
    setActionType(type);
    setActionRemark("");
    setShowActionModal(true);
  };

  const submitAction = () => {
    setShowActionModal(false);
    setActionType(null);
    setActionRemark("");
    setSelectedReview(null);
  };

  const trustScoreColor = (score: number) => {
    if (score >= 80) return "text-jade-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-amber-600";
    return "text-ember-600";
  };

  const trustScoreBg = (score: number) => {
    if (score >= 80) return "from-jade-400 to-jade-600";
    if (score >= 60) return "from-blue-400 to-blue-600";
    if (score >= 40) return "from-amber-400 to-amber-600";
    return "from-ember-400 to-ember-600";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={24} className="text-jade-500" />
            <h1 className="font-serif text-2xl font-bold text-rock-900">可信度复核中心</h1>
          </div>
          <p className="text-sm text-rock-500">商户资质核验 · 发布主体信用评估 · 内容可信度复查 —— 镇雄县信息可信度闭环管理</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 hover:bg-rock-50">
            <RefreshCw size={14} /> 刷新数据
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {[
          { label: "复核任务总数", value: stats.total, icon: FileText, color: "text-rock-700", bg: "bg-rock-100" },
          { label: "待复核", value: stats.pending, icon: Clock, color: "text-purple-600", bg: "bg-purple-100" },
          { label: "复核通过", value: stats.passed, icon: CheckCircle, color: "text-jade-600", bg: "bg-jade-100" },
          { label: "复核驳回", value: stats.rejected, icon: XCircle, color: "text-ember-600", bg: "bg-ember-100" },
          { label: "高风险主体", value: stats.highRisk, icon: AlertTriangle, color: "text-ember-600", bg: "bg-ember-100" },
          { label: "平均信任分", value: `${stats.avgTrust}`, icon: Star, color: "text-amber-600", bg: "bg-amber-100", suffix: "/100" },
        ].map(({ label, value, icon: Icon, color, bg, suffix }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl p-4 border border-rock-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-rock-500">{label}</p>
                <p className="flex items-baseline gap-0.5 mt-1">
                  <span className={`text-xl font-bold ${color}`}>{value}</span>
                  {suffix && <span className="text-xs text-rock-400">{suffix}</span>}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon size={16} className={color} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-rock-100">
        <div className="p-4 border-b border-rock-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-rock-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索标题、提交者、所属乡镇..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-rock-200 text-sm focus:outline-none focus:border-jade-400 focus:ring-1 focus:ring-jade-400"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="px-3 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 focus:outline-none focus:border-jade-400"
          >
            <option value="全部">全部复核类型</option>
            <option value="merchant">商户资质</option>
            <option value="publisher">发布主体信用</option>
            <option value="content">内容可信度</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 focus:outline-none focus:border-jade-400"
          >
            <option value="全部">全部状态</option>
            <option value="待复核">待复核</option>
            <option value="复核通过">复核通过</option>
            <option value="复核驳回">复核驳回</option>
          </select>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)}
            className="px-3 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 focus:outline-none focus:border-jade-400"
          >
            <option value="全部">全部风险等级</option>
            <option value="高风险">高风险</option>
            <option value="中风险">中风险</option>
            <option value="低风险">低风险</option>
          </select>
          <button
            onClick={resetFilters}
            className="px-3 py-2 rounded-lg border border-rock-200 text-sm text-rock-500 hover:bg-rock-50"
          >
            重置
          </button>
        </div>

        <div className="flex border-b border-rock-100 overflow-x-auto">
          {([
            { key: "全部", value: allReviews.length, type: "全部" as const },
            { key: "商户资质", value: merchantReviews.length, type: "merchant" as const },
            { key: "发布主体", value: publisherReviews.length, type: "publisher" as const },
            { key: "内容可信度", value: contentReviews.length, type: "content" as const },
          ] as const).map((tab) => {
            const isActive = typeFilter === tab.type;
            return (
              <button
                key={tab.key}
                onClick={() => setTypeFilter(tab.type as typeof typeFilter)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-jade-500 text-jade-600 bg-jade-50/30"
                    : "border-transparent text-rock-500 hover:text-rock-700"
                }`}
              >
                {tab.key}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
                  isActive ? "bg-jade-100 text-jade-700" : "bg-rock-100 text-rock-500"
                }`}>
                  {tab.value}
                </span>
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-rock-50 text-rock-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium whitespace-nowrap">复核对象</th>
                <th className="text-left px-4 py-3 font-medium whitespace-nowrap">类型</th>
                <th className="text-left px-4 py-3 font-medium whitespace-nowrap">提交者</th>
                <th className="text-left px-4 py-3 font-medium whitespace-nowrap">所属乡镇</th>
                <th className="text-left px-4 py-3 font-medium whitespace-nowrap">信任分</th>
                <th className="text-left px-4 py-3 font-medium whitespace-nowrap">风险等级</th>
                <th className="text-left px-4 py-3 font-medium whitespace-nowrap">复核状态</th>
                <th className="text-left px-4 py-3 font-medium whitespace-nowrap">提交时间</th>
                <th className="text-right px-4 py-3 font-medium whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <Filter size={40} className="mx-auto text-rock-300 mb-3" />
                    <p className="text-rock-400 text-sm">暂无符合条件的复核任务</p>
                  </td>
                </tr>
              ) : (
                filteredReviews.map((r) => {
                  const TypeIcon = typeIcons[r.type];
                  return (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-t border-rock-50 hover:bg-rock-50/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${riskColors[r.riskLevel]}`}>
                            <TypeIcon size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-rock-900 truncate max-w-[240px]">{r.title}</p>
                            <p className="text-xs text-rock-400">{r.subType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-rock-600">{r.subType}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {r.submitterRole === "商户" ? (
                            <Store size={12} className="text-jade-500" />
                          ) : r.submitterRole === "管理员" ? (
                            <ShieldCheck size={12} className="text-blue-500" />
                          ) : (
                            <User size={12} className="text-rock-400" />
                          )}
                          <span className="text-rock-700">{r.submitter}</span>
                          <span className="text-xs text-rock-400">({r.submitterRole})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-rock-600">
                          <MapPin size={12} className="text-rock-400" />
                          {r.township}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-rock-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${trustScoreBg(r.trustScore)}`}
                              style={{ width: `${r.trustScore}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold font-number ${trustScoreColor(r.trustScore)}`}>
                            {r.trustScore}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${riskColors[r.riskLevel]}`}>
                          {r.riskLevel === "高风险" && <AlertTriangle size={10} />}
                          {r.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${statusColors[r.status]}`}>
                          {r.status === "待复核" && <Clock size={10} />}
                          {r.status === "复核通过" && <CheckCircle size={10} />}
                          {r.status === "复核驳回" && <XCircle size={10} />}
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-rock-500 font-number text-xs">
                        {formatDateTime(r.submittedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedReview(r)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-jade-600 hover:bg-jade-50 font-medium"
                          >
                            <Eye size={13} /> 查看复核
                          </button>
                          {r.status === "待复核" && (
                            <>
                              <button
                                onClick={() => { setSelectedReview(r); handleAction("approve"); }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-jade-600 hover:bg-jade-50"
                                title="复核通过"
                              >
                                <ThumbsUp size={13} />
                              </button>
                              <button
                                onClick={() => { setSelectedReview(r); handleAction("reject"); }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-ember-600 hover:bg-ember-50"
                                title="复核驳回"
                              >
                                <ThumbsDown size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-rock-100 flex items-center justify-between text-sm text-rock-500">
          <span>共 {filteredReviews.length} 条复核任务</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 rounded border border-rock-200 hover:bg-rock-50">上一页</button>
            <button className="px-3 py-1 rounded bg-jade-500 text-white">1</button>
            <button className="px-3 py-1 rounded border border-rock-200 hover:bg-rock-50">下一页</button>
          </div>
        </div>
      </div>

      {selectedReview && (
        <div className="fixed inset-0 bg-rock-900/50 flex items-center justify-center z-50 p-4" onClick={() => !showActionModal && setSelectedReview(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-rock-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert size={20} className="text-amber-500" />
                <h3 className="font-serif text-lg font-bold text-rock-900">可信度复核详情</h3>
              </div>
              <button onClick={() => setSelectedReview(null)} className="text-rock-400 hover:text-rock-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${riskColors[selectedReview.riskLevel]}`}>
                    {(() => {
                      const I = typeIcons[selectedReview.type];
                      return <I size={24} />;
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-bold text-rock-900">{selectedReview.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColors[selectedReview.status]}`}>
                        {selectedReview.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${riskColors[selectedReview.riskLevel]}`}>
                        {selectedReview.riskLevel}
                      </span>
                    </div>
                    <p className="text-sm text-rock-500">{selectedReview.subType} · {selectedReview.submitter}（{selectedReview.submitterRole}）· {selectedReview.township}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-rock-400 mb-1">信任评分</p>
                  <p className={`text-3xl font-bold font-number ${trustScoreColor(selectedReview.trustScore)}`}>
                    {selectedReview.trustScore}
                    <span className="text-sm text-rock-300">/100</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-rock-50 rounded-lg p-3">
                  <p className="text-rock-500 text-xs mb-1">提交时间</p>
                  <p className="text-sm font-medium text-rock-900">{formatDateTime(selectedReview.submittedAt)}</p>
                </div>
                <div className="bg-rock-50 rounded-lg p-3">
                  <p className="text-rock-500 text-xs mb-1">最近审核</p>
                  <p className="text-sm font-medium text-rock-900">{selectedReview.lastReviewAt ? formatDateTime(selectedReview.lastReviewAt) : "—"}</p>
                </div>
                <div className="bg-rock-50 rounded-lg p-3">
                  <p className="text-rock-500 text-xs mb-1">佐证材料</p>
                  <p className="text-sm font-medium text-rock-900">{selectedReview.evidenceCount} 份</p>
                </div>
              </div>

              {selectedReview.reviewRemarks.length > 0 && (
                <div>
                  <p className="text-rock-500 text-xs mb-2">审核痕迹（按时间倒序）</p>
                  <div className="space-y-2">
                    {selectedReview.reviewRemarks.map((remark, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                        <ChevronRight size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-rock-700">{remark}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReview.type === "merchant" && (
                <div className="bg-jade-50/50 rounded-xl p-4 border border-jade-100">
                  <p className="text-jade-700 text-sm font-medium mb-2 flex items-center gap-1">
                    <Store size={14} /> 商户资质核验要点
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-rock-600"><CheckCircle size={13} className="text-jade-500" /> 营业执照真实性</div>
                    <div className="flex items-center gap-1.5 text-rock-600"><CheckCircle size={13} className="text-jade-500" /> 经营场所核验</div>
                    <div className="flex items-center gap-1.5 text-rock-600"><CheckCircle size={13} className="text-jade-500" /> 法人身份核验</div>
                    <div className="flex items-center gap-1.5 text-rock-600"><CheckCircle size={13} className="text-jade-500" /> 食品经营许可证（如适用）</div>
                    <div className="flex items-center gap-1.5 text-rock-600"><CheckCircle size={13} className="text-jade-500" /> 近30天投诉记录</div>
                    <div className="flex items-center gap-1.5 text-rock-600"><CheckCircle size={13} className="text-jade-500" /> 乡镇实地走访确认</div>
                  </div>
                </div>
              )}

              {selectedReview.type === "publisher" && (
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                  <p className="text-blue-700 text-sm font-medium mb-2 flex items-center gap-1">
                    <User size={14} /> 发布主体信用评估维度
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-rock-600"><TrendingUp size={13} className="text-blue-500" /> 历史发布信息质量</div>
                    <div className="flex items-center gap-1.5 text-rock-600"><AlertTriangle size={13} className="text-blue-500" /> 违规次数与严重程度</div>
                    <div className="flex items-center gap-1.5 text-rock-600"><CheckCircle size={13} className="text-blue-500" /> 实名认证状态</div>
                    <div className="flex items-center gap-1.5 text-rock-600"><Star size={13} className="text-blue-500" /> 其他用户举报与评价</div>
                  </div>
                </div>
              )}

              {selectedReview.type === "content" && (
                <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100">
                  <p className="text-purple-700 text-sm font-medium mb-2 flex items-center gap-1">
                    <FileText size={14} /> 内容可信度核查要点
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-rock-600"><CheckCircle size={13} className="text-purple-500" /> 图片/视频真实性核验</div>
                    <div className="flex items-center gap-1.5 text-rock-600"><CheckCircle size={13} className="text-purple-500" /> 文字内容是否含虚假信息</div>
                    <div className="flex items-center gap-1.5 text-rock-600"><CheckCircle size={13} className="text-purple-500" /> 联系方式真实性</div>
                    <div className="flex items-center gap-1.5 text-rock-600"><CheckCircle size={13} className="text-purple-500" /> 地理位置与实际匹配度</div>
                    <div className="flex items-center gap-1.5 text-rock-600"><CheckCircle size={13} className="text-purple-500" /> 是否涉及诱导线下交易</div>
                    <div className="flex items-center gap-1.5 text-rock-600"><CheckCircle size={13} className="text-purple-500" /> 用户申诉材料佐证</div>
                  </div>
                </div>
              )}

              {selectedReview.status === "待复核" && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleAction("approve")}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-jade-500 hover:bg-jade-600 text-white text-sm font-medium transition-colors"
                  >
                    <ThumbsUp size={16} /> 复核通过
                  </button>
                  <button
                    onClick={() => handleAction("reject")}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-ember-500 hover:bg-ember-600 text-white text-sm font-medium transition-colors"
                  >
                    <ThumbsDown size={16} /> 复核驳回
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showActionModal && (
        <div className="fixed inset-0 bg-rock-900/60 flex items-center justify-center z-[60] p-4" onClick={() => setShowActionModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-rock-100 flex items-center justify-between">
              <h3 className="font-bold text-rock-900">
                {actionType === "approve" ? "复核通过确认" : "复核驳回确认"}
              </h3>
              <button onClick={() => setShowActionModal(false)} className="text-rock-400 hover:text-rock-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className={`p-3 rounded-lg ${actionType === "approve" ? "bg-jade-50 border border-jade-100" : "bg-ember-50 border border-ember-100"}`}>
                <p className={`text-sm ${actionType === "approve" ? "text-jade-700" : "text-ember-700"}`}>
                  {actionType === "approve"
                    ? "复核通过后，该对象信任分将提升，相关内容将正常展示。"
                    : "复核驳回后，该对象信任分将降低，高风险主体将被标记并可能限制发布权限。"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-rock-700 mb-2">审核意见（必填）</label>
                <textarea
                  value={actionRemark}
                  onChange={(e) => setActionRemark(e.target.value)}
                  placeholder={actionType === "approve" ? "请填写复核通过的理由，如：证件齐全、信息真实可信..." : "请填写驳回理由，如：图片涉嫌盗用、联系电话为空号..."}
                  className="w-full h-28 px-3 py-2 rounded-lg border border-rock-200 text-sm focus:outline-none focus:border-jade-400 focus:ring-1 focus:ring-jade-400 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 py-2 rounded-lg border border-rock-200 text-rock-600 hover:bg-rock-50 text-sm font-medium"
                >
                  取消
                </button>
                <button
                  onClick={submitAction}
                  disabled={!actionRemark.trim()}
                  className={`flex-1 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
                    actionRemark.trim()
                      ? (actionType === "approve" ? "bg-jade-500 hover:bg-jade-600" : "bg-ember-500 hover:bg-ember-600")
                      : "bg-rock-300 cursor-not-allowed"
                  }`}
                >
                  确认提交
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
