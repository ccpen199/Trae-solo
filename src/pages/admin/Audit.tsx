import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  RotateCcw,
  Eye,
  Check,
  X,
  RefreshCw,
  Inbox,
  Clock,
  User,
  MapPin,
  FileText,
  ChevronDown,
  X as CloseIcon,
  ArrowRight,
} from "lucide-react";
import { auditRecords as initialAuditRecords } from "@/data";
import type { AuditRecord } from "@/types";
import { cn } from "@/lib/utils";

const AUDIT_TYPES: AuditRecord["type"][] = [
  "UGC图文",
  "UGC短视频",
  "商户资质",
  "招聘信息",
  "房产信息",
  "美食推荐",
  "交友信息",
  "资讯投稿",
];

const AUDIT_STATUSES: AuditRecord["status"][] = [
  "待审核",
  "审核通过",
  "审核拒绝",
  "待复查",
  "已复查通过",
  "已复查拒绝",
];

const TIME_RANGES = ["全部时间", "近一天", "近一周", "近一月"] as const;

const TABS = ["待审核", "审核通过", "审核拒绝", "待复查", "已复查"] as const;

const typeColorMap: Record<AuditRecord["type"], string> = {
  UGC图文: "bg-sky-50 text-sky-600 border-sky-100",
  UGC短视频: "bg-violet-50 text-violet-600 border-violet-100",
  商户资质: "bg-jade-50 text-jade-600 border-jade-100",
  招聘信息: "bg-blue-50 text-blue-600 border-blue-100",
  房产信息: "bg-amber-50 text-amber-600 border-amber-100",
  美食推荐: "bg-ember-50 text-ember-600 border-ember-100",
  交友信息: "bg-pink-50 text-pink-600 border-pink-100",
  资讯投稿: "bg-purple-50 text-purple-600 border-purple-100",
};

const statusColorMap: Record<AuditRecord["status"], string> = {
  待审核: "bg-amber-50 text-amber-600 border-amber-100",
  审核通过: "bg-jade-50 text-jade-600 border-jade-100",
  审核拒绝: "bg-ember-50 text-ember-600 border-ember-100",
  待复查: "bg-purple-50 text-purple-600 border-purple-100",
  已复查通过: "bg-jade-50 text-jade-700 border-jade-200",
  已复查拒绝: "bg-ember-50 text-ember-700 border-ember-200",
};

const submitterRoleColorMap: Record<AuditRecord["submitterRole"], string> = {
  普通用户: "bg-rock-50 text-rock-600 border-rock-100",
  认证商户: "bg-jade-50 text-jade-600 border-jade-100",
  管理员: "bg-blue-50 text-blue-600 border-blue-100",
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}

function isWithinTimeRange(iso: string, range: (typeof TIME_RANGES)[number]): boolean {
  if (range === "全部时间") return true;
  const now = Date.now();
  const target = new Date(iso).getTime();
  const diffMs = now - target;
  const dayMs = 24 * 60 * 60 * 1000;
  if (range === "近一天") return diffMs <= dayMs;
  if (range === "近一周") return diffMs <= 7 * dayMs;
  if (range === "近一月") return diffMs <= 30 * dayMs;
  return true;
}

function matchTab(record: AuditRecord, tab: (typeof TABS)[number] | "全部"): boolean {
  if (tab === "全部") return true;
  if (tab === "已复查") {
    return record.status === "已复查通过" || record.status === "已复查拒绝";
  }
  return record.status === tab;
}

export default function AdminAudit() {
  const [records, setRecords] = useState<AuditRecord[]>(initialAuditRecords);

  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState<string>("全部类型");
  const [filterStatus, setFilterStatus] = useState<string>("全部状态");
  const [filterTownship, setFilterTownship] = useState<string>("全部乡镇");
  const [filterTimeRange, setFilterTimeRange] = useState<(typeof TIME_RANGES)[number]>("全部时间");
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number] | "全部">("全部");

  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedType, setAppliedType] = useState<string>("全部类型");
  const [appliedStatus, setAppliedStatus] = useState<string>("全部状态");
  const [appliedTownship, setAppliedTownship] = useState<string>("全部乡镇");
  const [appliedTimeRange, setAppliedTimeRange] = useState<(typeof TIME_RANGES)[number]>("全部时间");

  const [detailRecord, setDetailRecord] = useState<AuditRecord | null>(null);
  const [approveRecord, setApproveRecord] = useState<AuditRecord | null>(null);
  const [rejectRecord, setRejectRecord] = useState<AuditRecord | null>(null);
  const [approveRemark, setApproveRemark] = useState("");
  const [rejectRemark, setRejectRemark] = useState("");

  const uniqueTownships = useMemo(() => {
    const set = new Set(records.map((r) => r.township));
    return Array.from(set);
  }, [records]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const pendingToday = records.filter(
      (r) => r.status === "待审核" && r.submittedAt.slice(0, 10) === today,
    ).length;
    const passed = records.filter((r) => r.status === "审核通过" || r.status === "已复查通过").length;
    const rejected = records.filter((r) => r.status === "审核拒绝" || r.status === "已复查拒绝").length;
    const pendingReview = records.filter((r) => r.status === "待复查").length;
    return { pendingToday, passed, rejected, pendingReview };
  }, [records]);

  const tabCounts = useMemo(() => {
    return {
      待审核: records.filter((r) => r.status === "待审核").length,
      审核通过: records.filter((r) => r.status === "审核通过").length,
      审核拒绝: records.filter((r) => r.status === "审核拒绝").length,
      待复查: records.filter((r) => r.status === "待复查").length,
      已复查: records.filter((r) => r.status === "已复查通过" || r.status === "已复查拒绝").length,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (appliedSearch) {
        const q = appliedSearch.toLowerCase();
        const match =
          r.auditNo.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.submitter.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (appliedType !== "全部类型" && r.type !== appliedType) return false;
      if (appliedStatus !== "全部状态" && r.status !== appliedStatus) return false;
      if (appliedTownship !== "全部乡镇" && r.township !== appliedTownship) return false;
      if (!isWithinTimeRange(r.submittedAt, appliedTimeRange)) return false;
      if (!matchTab(r, activeTab)) return false;
      return true;
    });
  }, [records, appliedSearch, appliedType, appliedStatus, appliedTownship, appliedTimeRange, activeTab]);

  const handleSearch = () => {
    setAppliedSearch(searchText.trim());
    setAppliedType(filterType);
    setAppliedStatus(filterStatus);
    setAppliedTownship(filterTownship);
    setAppliedTimeRange(filterTimeRange);
  };

  const handleReset = () => {
    setSearchText("");
    setFilterType("全部类型");
    setFilterStatus("全部状态");
    setFilterTownship("全部乡镇");
    setFilterTimeRange("全部时间");
    setAppliedSearch("");
    setAppliedType("全部类型");
    setAppliedStatus("全部状态");
    setAppliedTownship("全部乡镇");
    setAppliedTimeRange("全部时间");
    setActiveTab("全部");
    setRecords(initialAuditRecords);
  };

  const handleApproveConfirm = () => {
    if (!approveRecord) return;
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== approveRecord.id) return r;
        const newTrace = {
          step: r.reviewTraces.length + 1,
          operator: "当前管理员",
          action: "审核通过",
          time: new Date().toISOString(),
          remark: approveRemark || "审核通过，符合平台规范",
        };
        return {
          ...r,
          status: "审核通过",
          operator: "当前管理员",
          reviewTraces: [...r.reviewTraces, newTrace],
        };
      }),
    );
    setApproveRecord(null);
    setApproveRemark("");
  };

  const handleRejectConfirm = () => {
    if (!rejectRecord) return;
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== rejectRecord.id) return r;
        const newTrace = {
          step: r.reviewTraces.length + 1,
          operator: "当前管理员",
          action: "审核拒绝",
          time: new Date().toISOString(),
          remark: rejectRemark || "不符合平台规范，予以驳回",
        };
        return {
          ...r,
          status: "审核拒绝",
          operator: "当前管理员",
          reviewTraces: [...r.reviewTraces, newTrace],
        };
      }),
    );
    setRejectRecord(null);
    setRejectRemark("");
  };

  const handleReview = (record: AuditRecord) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== record.id) return r;
        const newTrace = {
          step: r.reviewTraces.length + 1,
          operator: "当前管理员",
          action: "进入复查",
          time: new Date().toISOString(),
          remark: "管理员发起复查流程，等待复核员处理",
        };
        return {
          ...r,
          status: "待复查",
          operator: "当前管理员",
          reviewTraces: [...r.reviewTraces, newTrace],
        };
      }),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-rock-900">审核管理</h1>
        <p className="mt-1 text-sm text-rock-500">全量审核记录与复查追踪</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl p-5 border border-rock-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rock-500">今日待审</p>
              <p className="text-2xl font-bold mt-1 text-amber-500">{stats.pendingToday}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock size={20} className="text-amber-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-rock-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rock-500">已通过</p>
              <p className="text-2xl font-bold mt-1 text-jade-500">{stats.passed}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-jade-50 flex items-center justify-center">
              <Check size={20} className="text-jade-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-rock-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rock-500">已拒绝</p>
              <p className="text-2xl font-bold mt-1 text-ember-500">{stats.rejected}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-ember-50 flex items-center justify-center">
              <X size={20} className="text-ember-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-rock-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rock-500">待复查</p>
              <p className="text-2xl font-bold mt-1 text-purple-500">{stats.pendingReview}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <RefreshCw size={20} className="text-purple-500" />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-white rounded-xl border border-rock-100 p-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-rock-400" />
            <input
              type="text"
              placeholder="搜索审核编号、标题、提交者..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-rock-200 text-sm focus:outline-none focus:border-jade-400 focus:ring-1 focus:ring-jade-400"
            />
          </div>
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none pl-3 pr-9 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 focus:outline-none focus:border-jade-400 bg-white"
            >
              <option>全部类型</option>
              {AUDIT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-rock-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none pl-3 pr-9 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 focus:outline-none focus:border-jade-400 bg-white"
            >
              <option>全部状态</option>
              {AUDIT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-rock-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterTownship}
              onChange={(e) => setFilterTownship(e.target.value)}
              className="appearance-none pl-3 pr-9 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 focus:outline-none focus:border-jade-400 bg-white"
            >
              <option>全部乡镇</option>
              {uniqueTownships.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-rock-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterTimeRange}
              onChange={(e) => setFilterTimeRange(e.target.value as (typeof TIME_RANGES)[number])}
              className="appearance-none pl-3 pr-9 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 focus:outline-none focus:border-jade-400 bg-white"
            >
              {TIME_RANGES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-rock-400 pointer-events-none" />
          </div>
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-jade-500 hover:bg-jade-600 text-white text-sm font-medium transition-colors"
          >
            <Search size={16} />
            搜索
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rock-100 hover:bg-rock-200 text-rock-700 text-sm font-medium transition-colors"
          >
            <RotateCcw size={16} />
            重置
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white rounded-xl border border-rock-100"
      >
        <div className="p-4 border-b border-rock-100 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("全部")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === "全部" ? "bg-jade-500 text-white" : "text-rock-600 hover:bg-rock-50",
            )}
          >
            全部
          </button>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                activeTab === tab ? "bg-jade-500 text-white" : "text-rock-600 hover:bg-rock-50",
              )}
            >
              {tab}
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs",
                  activeTab === tab ? "bg-white/20 text-white" : "bg-rock-100 text-rock-500",
                )}
              >
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </div>

        {filteredRecords.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-rock-400">
            <Inbox size={48} className="mb-3" />
            <p className="text-sm">暂无数据</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-rock-50 text-rock-500">
                <tr>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">审核编号</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">审核类型</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">内容标题</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">提交者</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">所属乡镇</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">当前状态</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">提交时间</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">审核员</th>
                  <th className="text-right px-4 py-3 font-medium whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredRecords.map((record, idx) => (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.02 }}
                      className="border-t border-rock-50 hover:bg-rock-50/50"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-rock-600 whitespace-nowrap">{record.auditNo}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn("px-2 py-0.5 rounded text-xs border", typeColorMap[record.type])}>
                          {record.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-rock-900 max-w-[220px] truncate" title={record.title}>
                        {record.title}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-jade-400 to-jade-600 flex items-center justify-center text-white text-xs">
                            {record.submitter.slice(0, 1)}
                          </div>
                          <div>
                            <p className="text-rock-800 text-sm">{record.submitter}</p>
                            <span className={cn("text-[10px] px-1.5 py-px rounded border", submitterRoleColorMap[record.submitterRole])}>
                              {record.submitterRole}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-rock-600 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-rock-400" />
                          {record.township}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn("px-2 py-0.5 rounded text-xs border", statusColorMap[record.status])}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-rock-500 whitespace-nowrap text-xs">{formatDateTime(record.submittedAt)}</td>
                      <td className="px-4 py-3 text-rock-600 whitespace-nowrap text-xs">{record.operator}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailRecord(record)}
                            className="p-1.5 rounded-lg hover:bg-rock-100 text-rock-500 hover:text-rock-700 transition-colors"
                            title="查看"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setApproveRecord(record);
                              setApproveRemark("");
                            }}
                            className="p-1.5 rounded-lg hover:bg-jade-50 text-rock-500 hover:text-jade-600 transition-colors"
                            title="通过"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setRejectRecord(record);
                              setRejectRemark("");
                            }}
                            className="p-1.5 rounded-lg hover:bg-ember-50 text-rock-500 hover:text-ember-600 transition-colors"
                            title="驳回"
                          >
                            <X size={16} />
                          </button>
                          <button
                            onClick={() => handleReview(record)}
                            className="p-1.5 rounded-lg hover:bg-purple-50 text-rock-500 hover:text-purple-600 transition-colors"
                            title="复查"
                          >
                            <RefreshCw size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-rock-100 flex items-center justify-between text-sm text-rock-500">
          <span>共 {filteredRecords.length} 条记录</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {detailRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setDetailRecord(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-rock-100 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-lg font-bold text-rock-900">审核详情</h2>
                  <p className="text-xs text-rock-400 font-mono mt-0.5">{detailRecord.auditNo}</p>
                </div>
                <button
                  onClick={() => setDetailRecord(null)}
                  className="w-8 h-8 rounded-lg hover:bg-rock-100 flex items-center justify-center text-rock-500"
                >
                  <CloseIcon size={18} />
                </button>
              </div>
              <div className="overflow-y-auto px-6 py-5 space-y-5 max-h-[calc(85vh-72px)]">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-rock-400 mb-1">内容标题</p>
                    <p className="text-rock-800 font-medium">{detailRecord.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-rock-400 mb-1">审核类型</p>
                    <span className={cn("px-2 py-0.5 rounded text-xs border", typeColorMap[detailRecord.type])}>
                      {detailRecord.type}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-rock-400 mb-1">提交者</p>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-rock-400" />
                      <span className="text-rock-800">{detailRecord.submitter}</span>
                      <span className={cn("text-[10px] px-1.5 py-px rounded border", submitterRoleColorMap[detailRecord.submitterRole])}>
                        {detailRecord.submitterRole}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-rock-400 mb-1">所属乡镇</p>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-rock-400" />
                      <span className="text-rock-800">{detailRecord.township}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-rock-400 mb-1">提交时间</p>
                    <p className="text-rock-800 text-xs">{formatDateTime(detailRecord.submittedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-rock-400 mb-1">当前状态</p>
                    <span className={cn("px-2 py-0.5 rounded text-xs border", statusColorMap[detailRecord.status])}>
                      {detailRecord.status}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-rock-400 mb-1.5">内容摘要</p>
                  <div className="bg-rock-50 rounded-lg p-3 text-sm text-rock-700">
                    <FileText size={14} className="text-rock-400 inline mr-1.5 -mt-0.5" />
                    {detailRecord.remark}
                  </div>
                </div>

                {detailRecord.evidence.length > 0 && (
                  <div>
                    <p className="text-xs text-rock-400 mb-2">佐证材料</p>
                    <div className="flex flex-wrap gap-2">
                      {detailRecord.evidence.slice(0, 4).map((img, i) => (
                        <div key={i} className="w-20 h-20 rounded-lg overflow-hidden border border-rock-100 bg-rock-50">
                          <img src={img} alt={`evidence-${i}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-rock-400 mb-3">审核与复查痕迹</p>
                  <div className="relative pl-6 space-y-5">
                    <div className="absolute left-[7px] top-1 bottom-1 w-px bg-rock-200" />
                    {detailRecord.reviewTraces.map((trace, idx) => (
                      <motion.div
                        key={trace.step}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className="relative"
                      >
                        <div className="absolute -left-6 top-0.5 w-[15px] h-[15px] rounded-full bg-jade-500 border-2 border-white shadow flex items-center justify-center">
                          <span className="text-white text-[9px] font-bold">{trace.step}</span>
                        </div>
                        <div className="bg-rock-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-rock-800">{trace.action}</span>
                              <ArrowRight size={12} className="text-rock-300" />
                              <span className="text-xs text-rock-600">{trace.operator}</span>
                            </div>
                            <span className="text-xs text-rock-400">{formatDateTime(trace.time)}</span>
                          </div>
                          {trace.remark && <p className="text-xs text-rock-500 mt-1 leading-relaxed">{trace.remark}</p>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-rock-100 flex justify-end gap-2">
                <button
                  onClick={() => setDetailRecord(null)}
                  className="px-4 py-2 rounded-lg bg-rock-100 hover:bg-rock-200 text-rock-700 text-sm font-medium transition-colors"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {approveRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => {
              setApproveRecord(null);
              setApproveRemark("");
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-rock-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-jade-50 flex items-center justify-center">
                  <Check size={18} className="text-jade-500" />
                </div>
                <div>
                  <h2 className="font-serif text-base font-bold text-rock-900">审核通过</h2>
                  <p className="text-xs text-rock-400 mt-0.5">{approveRecord.auditNo}</p>
                </div>
              </div>
              <div className="px-6 py-5 space-y-3">
                <p className="text-sm text-rock-700">确定要通过「{approveRecord.title}」吗？</p>
                <div>
                  <label className="text-xs text-rock-500 mb-1.5 block">审核意见</label>
                  <textarea
                    value={approveRemark}
                    onChange={(e) => setApproveRemark(e.target.value)}
                    placeholder="请输入审核意见（可选）..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-rock-200 text-sm focus:outline-none focus:border-jade-400 focus:ring-1 focus:ring-jade-400 resize-none"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-rock-100 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setApproveRecord(null);
                    setApproveRemark("");
                  }}
                  className="px-4 py-2 rounded-lg bg-rock-100 hover:bg-rock-200 text-rock-700 text-sm font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleApproveConfirm}
                  className="px-4 py-2 rounded-lg bg-jade-500 hover:bg-jade-600 text-white text-sm font-medium transition-colors"
                >
                  确认通过
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rejectRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => {
              setRejectRecord(null);
              setRejectRemark("");
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-rock-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-ember-50 flex items-center justify-center">
                  <X size={18} className="text-ember-500" />
                </div>
                <div>
                  <h2 className="font-serif text-base font-bold text-rock-900">审核驳回</h2>
                  <p className="text-xs text-rock-400 mt-0.5">{rejectRecord.auditNo}</p>
                </div>
              </div>
              <div className="px-6 py-5 space-y-3">
                <p className="text-sm text-rock-700">确定要驳回「{rejectRecord.title}」吗？</p>
                <div>
                  <label className="text-xs text-rock-500 mb-1.5 block">驳回理由</label>
                  <textarea
                    value={rejectRemark}
                    onChange={(e) => setRejectRemark(e.target.value)}
                    placeholder="请输入驳回理由..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-rock-200 text-sm focus:outline-none focus:border-ember-400 focus:ring-1 focus:ring-ember-400 resize-none"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-rock-100 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setRejectRecord(null);
                    setRejectRemark("");
                  }}
                  className="px-4 py-2 rounded-lg bg-rock-100 hover:bg-rock-200 text-rock-700 text-sm font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleRejectConfirm}
                  className="px-4 py-2 rounded-lg bg-ember-500 hover:bg-ember-600 text-white text-sm font-medium transition-colors"
                >
                  确认驳回
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
