import { useState, useMemo } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search, Plus, FileText, FileSpreadsheet, FileImage, File,
  Paperclip, Eye, Vote, Check, X, ChevronDown, ChevronUp,
  Copy, Download, Shield, Hash, Clock, Users,
  TrendingUp, Blocks, CircleDot
} from "lucide-react";
import { useAppStore } from "@/stores";
import {
  cn, formatDate, getMotionStatusLabel,
  formatFileSize, truncateText, copyToClipboard
} from "@/utils";
import type { MotionStatus, Motion, Attachment } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface BlockchainProof {
  txHash: string; blockHeight: number; timestamp: string; nodeCount: number; verified: boolean;
}
interface ReviewRecord {
  id: string; operator: string; action: string; timestamp: string; remark?: string; status: string;
}

const statusFilters: { value: MotionStatus | "all"; label: string }[] = [
  { value: "all", label: "全部" }, { value: "draft", label: "草拟" },
  { value: "publicity", label: "公示中" }, { value: "voting", label: "投票中" },
  { value: "passed", label: "已通过" }, { value: "rejected", label: "已否决" },
];
const voteTypeFilters = [
  { value: "all", label: "全部类型" }, { value: "realname", label: "实名投票" }, { value: "anonymous", label: "匿名投票" },
];
const chainFilters = [
  { value: "all", label: "全部存证" }, { value: "yes", label: "已存证" }, { value: "no", label: "未存证" },
];

const genMotionNo = (idx: number) => `Y2025-${String(idx + 1).padStart(3, "0")}`;

function getBlockchainProof(motion: Motion): BlockchainProof | null {
  if (!motion.blockchainHash) return null;
  return {
    txHash: motion.blockchainHash,
    blockHeight: 18456230 + Math.floor(Math.random() * 10000),
    timestamp: motion.voteEnd || new Date().toISOString(),
    nodeCount: 21, verified: true,
  };
}
function getReviewRecords(motion: Motion): ReviewRecord[] {
  const records: ReviewRecord[] = [
    { id: "r1", operator: motion.initiatorName, action: "议案发起", timestamp: motion.publicityStart || motion.voteStart || new Date().toISOString(), remark: motion.title, status: "completed" }
  ];
  if (motion.status !== "draft") records.push({ id: "r2", operator: "张明华", action: "公示发布", timestamp: motion.publicityStart, remark: "公示期7天", status: "completed" });
  if (["voting", "passed", "rejected"].includes(motion.status)) records.push({ id: "r3", operator: "系统", action: "投票开始", timestamp: motion.voteStart, remark: `共${motion.voteStats.totalVoters}名业主`, status: motion.status !== "voting" ? "completed" : "active" });
  if (["passed", "rejected"].includes(motion.status)) {
    records.push({ id: "r4", operator: "系统", action: "结果公示", timestamp: motion.voteEnd, remark: motion.status === "passed" ? "通过" : "否决", status: "completed" });
    records.push({ id: "r5", operator: "李建国", action: "复查确认", timestamp: motion.voteEnd, remark: "数据真实有效", status: "completed" });
  }
  return records.filter(r => r.timestamp);
}
function FileTypeIcon({ type }: { type: string }) {
  const cls = "w-5 h-5";
  if (type === "pdf") return <FileText className={cn(cls, "text-rose-500")} />;
  if (["xlsx", "xls", "csv"].includes(type)) return <FileSpreadsheet className={cn(cls, "text-emerald-500")} />;
  if (["jpg", "png", "gif", "webp"].includes(type)) return <FileImage className={cn(cls, "text-sky-500")} />;
  return <File className={cn(cls, "text-slate-500")} />;
}
function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="bg-white rounded-xl shadow-card p-5 border border-slate-100">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-3xl font-bold text-slate-800 mb-1">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </m.div>
  );
}

const COLS = ["议案编号", "议案标题", "投票类型", "发起人", "附件公示", "状态", "投票进度", "链上存证", "表决复查", "操作"];

export default function MotionList() {
  const navigate = useNavigate();
  const { motions } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<MotionStatus | "all">("all");
  const [voteTypeFilter, setVoteTypeFilter] = useState("all");
  const [chainFilter, setChainFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [attachmentModal, setAttachmentModal] = useState<{ open: boolean; data: Attachment[]; title: string }>({ open: false, data: [], title: "" });
  const [chainModal, setChainModal] = useState<{ open: boolean; data: BlockchainProof | null; motionTitle: string }>({ open: false, data: null, motionTitle: "" });
  const [reviewModal, setReviewModal] = useState<{ open: boolean; data: ReviewRecord[]; title: string }>({ open: false, data: [], title: "" });

  const filteredMotions = useMemo(() => motions.filter(item => {
    const ms = statusFilter === "all" || item.status === statusFilter;
    const mv = voteTypeFilter === "all" || item.voteType === voteTypeFilter;
    const mc = chainFilter === "all" || (chainFilter === "yes" ? !!item.blockchainHash : !item.blockchainHash);
    const mq = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return ms && mv && mc && mq;
  }), [motions, statusFilter, voteTypeFilter, chainFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = motions.length;
    return {
      total, voting: motions.filter(m => m.status === "voting").length,
      passed: motions.filter(m => m.status === "passed").length,
      rejected: motions.filter(m => m.status === "rejected").length,
      realnameRate: total ? Math.round(motions.filter(m => m.voteType === "realname").length / total * 100) : 0,
      chainRate: total ? Math.round(motions.filter(m => !!m.blockchainHash).length / total * 100) : 0,
      avgParticipation: total ? Math.round(motions.reduce((a, m) => a + (m.voteStats.totalVoters ? m.voteStats.votedCount / m.voteStats.totalVoters * 100 : 0), 0) / total) : 0,
    };
  }, [motions]);

  const handleCopy = async (text: string) => { await copyToClipboard(text); setCopied(true); setTimeout(() => setCopied(false), 1800); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-[1400px] mx-auto">
        <m.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">民主议事</h1>
          <p className="text-slate-500">参与小区公共事务决策，共建美好家园</p>
        </m.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={FileText} label="全部议案" value={stats.total} color="bg-primary-500" />
          <StatCard icon={Vote} label="投票中" value={stats.voting} color="bg-sky-500" />
          <StatCard icon={Check} label="已通过" value={stats.passed} color="bg-emerald-500" />
          <StatCard icon={X} label="已否决" value={stats.rejected} color="bg-rose-500" />
        </div>

        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-card p-5 mb-6 border border-slate-100">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map(f => (
                <m.button key={f.value} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    statusFilter === f.value ? "bg-primary-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
                  {f.label}
                </m.button>
              ))}
            </div>
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-1">
                <select value={voteTypeFilter} onChange={e => setVoteTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white">
                  {voteTypeFilters.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <select value={chainFilter} onChange={e => setChainFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white">
                  {chainFilters.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative flex-1 sm:flex-none sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="搜索议案标题或内容..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm" />
                </div>
                <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate("/council/new")}>发起议案</Button>
              </div>
            </div>
          </div>
        </m.div>

        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-card overflow-hidden border border-slate-100 mb-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{COLS.map(col => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">{col}</th>
                ))}</tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredMotions.length === 0 ? (
                    <tr><td colSpan={10} className="px-4 py-16 text-center">
                      <FileText className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">暂无符合条件的议案</p>
                    </td></tr>
                  ) : filteredMotions.map((motion, index) => {
                    const statusInfo = getMotionStatusLabel(motion.status);
                    const progress = motion.voteStats.totalVoters ? (motion.voteStats.votedCount / motion.voteStats.totalVoters) * 100 : 0;
                    const motionNo = genMotionNo(index);
                    const expanded = expandedId === motion.id;
                    const proof = getBlockchainProof(motion);
                    const progressVariant: any = motion.status === "passed" ? "success" : motion.status === "rejected" ? "danger" : "primary";
                    return (
                      <m.tr key={motion.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.04 }}
                        onClick={() => setExpandedId(expanded ? null : motion.id)}
                        className={cn("border-b border-slate-100 cursor-pointer transition-colors", "hover:bg-primary-50/40", expanded && "bg-primary-50/60")}>
                        <td className="px-4 py-3 text-sm font-mono text-slate-500 whitespace-nowrap">{motionNo}</td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <div className="flex items-center gap-2">
                            {expanded ? <ChevronUp className="w-4 h-4 text-primary-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                            <span className="text-sm font-medium text-slate-800 truncate" title={motion.title}>{truncateText(motion.title, 20)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={motion.voteType === "realname" ? "info" : "secondary"} size="sm" dot>
                            {motion.voteType === "realname" ? "实名投票" : "匿名投票"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-slate-800 font-medium">{motion.initiatorName}</span>
                            <span className="text-xs text-slate-400">业委会</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={e => { e.stopPropagation(); motion.attachments.length && setAttachmentModal({ open: true, data: motion.attachments, title: motion.title }); }}
                            className={cn("inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all",
                              motion.attachments.length ? "text-slate-700 hover:bg-slate-100" : "text-slate-400 cursor-default")}
                            disabled={!motion.attachments.length}>
                            <Paperclip className="w-3.5 h-3.5" /><span>{motion.attachments.length}个</span>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap", statusInfo.bgColor, statusInfo.color)}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 min-w-[160px]">
                          <div className="space-y-1.5">
                            <ProgressBar value={progress} size="sm" variant={progressVariant} />
                            <div className="text-xs text-slate-500">{motion.voteStats.votedCount}/{motion.voteStats.totalVoters} 人</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={e => { e.stopPropagation(); proof && setChainModal({ open: true, data: proof, motionTitle: motion.title }); }} className="inline-flex items-center gap-1.5">
                            {proof ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700">
                                <Shield className="w-4 h-4" /><span className="text-xs font-medium">已存证</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-400">
                                <X className="w-4 h-4" /><span className="text-xs">未存证</span>
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setReviewModal({ open: true, data: getReviewRecords(motion), title: motion.title }); }}>
                            查看记录
                          </Button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {motion.status === "voting" && (
                              <Button size="sm" leftIcon={<Vote className="w-3.5 h-3.5" />}
                                onClick={e => { e.stopPropagation(); navigate(`/council/${motion.id}`); }}>投票</Button>
                            )}
                            <Button size="sm" variant="ghost" leftIcon={<Eye className="w-3.5 h-3.5" />}
                              onClick={e => { e.stopPropagation(); navigate(`/council/${motion.id}`); }}>详情</Button>
                          </div>
                        </td>
                        {expanded && (
                          <m.tr initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }} className="bg-slate-50/70">
                            <td colSpan={10} className="px-6 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="space-y-1">
                                  <div className="text-xs text-slate-500 uppercase tracking-wide">议案内容</div>
                                  <div className="text-slate-700 leading-relaxed">{truncateText(motion.content, 100)}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs text-slate-500 uppercase tracking-wide">时间节点</div>
                                  <div className="space-y-0.5 text-slate-700">
                                    {motion.publicityStart && <div>公示：{formatDate(motion.publicityStart)}</div>}
                                    {motion.voteStart && <div>投票开始：{formatDate(motion.voteStart)}</div>}
                                    {motion.voteEnd && <div>投票结束：{formatDate(motion.voteEnd)}</div>}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs text-slate-500 uppercase tracking-wide">投票明细</div>
                                  <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-emerald-50 rounded-lg p-2"><div className="font-semibold text-emerald-600">{motion.voteStats.agreeCount}</div><div className="text-xs text-emerald-500">同意</div></div>
                                    <div className="bg-rose-50 rounded-lg p-2"><div className="font-semibold text-rose-600">{motion.voteStats.disagreeCount}</div><div className="text-xs text-rose-500">反对</div></div>
                                    <div className="bg-slate-100 rounded-lg p-2"><div className="font-semibold text-slate-600">{motion.voteStats.abstainCount}</div><div className="text-xs text-slate-500">弃权</div></div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </m.tr>
                        )}
                      </m.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </m.div>

        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-xl shadow-card p-5 border border-slate-100">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center"><FileText className="w-4.5 h-4.5 text-primary-600" /></div>
              <div><div className="text-slate-400 text-xs">议案总数</div><div className="text-slate-800 font-semibold text-lg">{filteredMotions.length} 条</div></div></div>
            <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center"><Users className="w-4.5 h-4.5 text-sky-600" /></div>
              <div><div className="text-slate-400 text-xs">实名投票占比</div><div className="text-slate-800 font-semibold text-lg">{stats.realnameRate}%</div></div></div>
            <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center"><Blocks className="w-4.5 h-4.5 text-emerald-600" /></div>
              <div><div className="text-slate-400 text-xs">链上存证率</div><div className="text-slate-800 font-semibold text-lg">{stats.chainRate}%</div></div></div>
            <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center"><TrendingUp className="w-4.5 h-4.5 text-amber-600" /></div>
              <div><div className="text-slate-400 text-xs">平均投票参与率</div><div className="text-slate-800 font-semibold text-lg">{stats.avgParticipation}%</div></div></div>
          </div>
        </m.div>

        <Modal isOpen={attachmentModal.open} onClose={() => setAttachmentModal({ open: false, data: [], title: "" })}
          title={`附件列表 - ${truncateText(attachmentModal.title, 25)}`} size="lg">
          {attachmentModal.data.length === 0 ? <p className="text-slate-500 text-center py-8">暂无附件</p> : (
            <div className="space-y-3">
              {attachmentModal.data.map((att, i) => (
                <m.div key={att.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0"><FileTypeIcon type={att.type} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{att.name}</div>
                    <div className="text-xs text-slate-500">{formatFileSize(att.size)} · {att.type.toUpperCase()}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" leftIcon={<Eye className="w-3.5 h-3.5" />}>预览</Button>
                    <Button size="sm" variant="ghost" leftIcon={<Download className="w-3.5 h-3.5" />}>下载</Button>
                  </div>
                </m.div>
              ))}
            </div>
          )}
        </Modal>

        <Modal isOpen={chainModal.open} onClose={() => setChainModal({ open: false, data: null, motionTitle: "" })}
          title={`区块链存证 - ${truncateText(chainModal.motionTitle, 25)}`} size="lg">
          {chainModal.data ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div>
                <div><div className="font-semibold text-emerald-700">已完成链上存证</div><div className="text-xs text-emerald-600">数据不可篡改，可随时溯源验证</div></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5"><Hash className="w-3.5 h-3.5" />交易哈希</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200 break-all">{chainModal.data.txHash}</code>
                    <Button size="icon" variant="outline" onClick={() => handleCopy(chainModal.data!.txHash)}>
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg"><div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5"><Blocks className="w-3.5 h-3.5" />区块高度</div>
                  <div className="text-sm font-mono text-slate-800 font-semibold">#{chainModal.data.blockHeight.toLocaleString()}</div></div>
                <div className="p-3 bg-slate-50 rounded-lg"><div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5"><Clock className="w-3.5 h-3.5" />时间戳</div>
                  <div className="text-sm text-slate-800 font-medium">{formatDate(chainModal.data.timestamp, "YYYY-MM-DD HH:mm")}</div></div>
                <div className="p-3 bg-slate-50 rounded-lg"><div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5"><CircleDot className="w-3.5 h-3.5" />存证节点</div>
                  <div className="text-sm text-slate-800 font-medium">{chainModal.data.nodeCount} 个共识节点
                    <Badge variant={chainModal.data.verified ? "success" : "warning"} size="sm" className="ml-2">
                      {chainModal.data.verified ? "验证通过" : "验证中"}
                    </Badge></div></div>
              </div>
              <div><div className="text-xs text-slate-500 mb-3">链上验证时间轴</div>
                <div className="relative pl-6 space-y-4">
                  {["提交交易", "节点广播", "共识验证", "区块打包", "存证完成"].map((step, i) => (
                    <div key={step} className="relative">
                      <div className={cn("absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow bg-emerald-500")} />
                      {i < 4 && <div className="absolute -left-[19px] top-4 w-0.5 h-8 bg-emerald-200" />}
                      <div><div className="text-sm font-medium text-slate-800">{step}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {i === 0 && formatDate(chainModal.data.timestamp, "HH:mm:ss")}
                          {i === 1 && "广播至 21 个节点"}
                          {i === 2 && `${chainModal.data.nodeCount}/21 节点确认`}
                          {i === 3 && `区块 #${chainModal.data.blockHeight.toLocaleString()}`}
                          {i === 4 && "数据不可篡改"}
                        </div></div>
                    </div>
                  ))}
                </div></div>
            </div>
          ) : <p className="text-slate-500 text-center py-8">未查询到存证信息</p>}
        </Modal>

        <Modal isOpen={reviewModal.open} onClose={() => setReviewModal({ open: false, data: [], title: "" })}
          title={`表决复查记录 - ${truncateText(reviewModal.title, 25)}`} size="lg">
          {reviewModal.data.length === 0 ? <p className="text-slate-500 text-center py-8">暂无复查记录</p> : (
            <div className="relative pl-6 space-y-5">
              {reviewModal.data.map((rec, idx) => (
                <m.div key={rec.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }} className="relative">
                  <div className={cn("absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white shadow flex items-center justify-center",
                    rec.status === "active" ? "bg-primary-500 ring-4 ring-primary-100 animate-pulse" : "bg-emerald-500")}>
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                  {idx < reviewModal.data.length - 1 && <div className="absolute -left-[21px] top-5 w-0.5 h-[calc(100%+8px)] bg-slate-200" />}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-primary-200 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div><div className="font-semibold text-slate-800 text-sm">{rec.action}</div>
                        {rec.remark && <div className="text-xs text-slate-500 mt-1">备注：{rec.remark}</div>}</div>
                      <Badge variant={rec.status === "active" ? "primary" : "success"} size="sm">
                        {rec.status === "active" ? "进行中" : "已完成"}
                      </Badge></div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{rec.operator}</div>
                      <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(rec.timestamp, "YYYY-MM-DD HH:mm")}</div>
                    </div>
                  </div>
                </m.div>
              ))}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
