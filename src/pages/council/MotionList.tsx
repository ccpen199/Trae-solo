import { useState, useMemo } from "react";
import { motion as m } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  FileText,
  User,
  Calendar,
  Paperclip,
  Eye,
} from "lucide-react";
import { useAppStore } from "@/stores";
import { cn, formatDate, getMotionStatusLabel, formatPercent } from "@/utils";
import type { MotionStatus } from "@/types";

const statusFilters: { value: MotionStatus | "all"; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "draft", label: "草拟" },
  { value: "publicity", label: "公示中" },
  { value: "voting", label: "投票中" },
  { value: "passed", label: "已通过" },
  { value: "rejected", label: "已否决" },
];

export default function MotionList() {
  const navigate = useNavigate();
  const { motions } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<MotionStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMotions = useMemo(() => {
    return motions.filter((item) => {
      const matchStatus =
        statusFilter === "all" || item.status === statusFilter;
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [motions, statusFilter, searchQuery]);

  const getVoteProgress = (voteStats: typeof motions[0]["voteStats"]) => {
    if (voteStats.totalVoters === 0) return 0;
    return (voteStats.votedCount / voteStats.totalVoters) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800 mb-2">民主议事</h1>
          <p className="text-slate-500">参与小区公共事务决策，共建美好家园</p>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-card p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <m.button
                  key={filter.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStatusFilter(filter.value)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    statusFilter === filter.value
                      ? "bg-primary-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {filter.label}
                </m.button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索议案标题或内容..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/council/new")}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg font-medium shadow-md hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                发起议案
              </m.button>
            </div>
          </div>
        </m.div>

        {filteredMotions.length === 0 ? (
          <m.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-card p-16 text-center"
          >
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">暂无议案</h3>
            <p className="text-slate-400">
              {searchQuery ? "没有找到匹配的议案，请尝试其他关键词" : "还没有任何议案，点击右上角发起第一个议案"}
            </p>
          </m.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMotions.map((motion, index) => {
              const statusInfo = getMotionStatusLabel(motion.status);
              const progress = getVoteProgress(motion.voteStats);

              return (
                <m.div
                  key={motion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  onClick={() => navigate(`/council/${motion.id}`)}
                  className="bg-white rounded-2xl shadow-card hover:shadow-card-hover cursor-pointer overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium",
                          statusInfo.bgColor,
                          statusInfo.color
                        )}
                      >
                        {statusInfo.label}
                      </span>
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium",
                          motion.voteType === "anonymous"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        )}
                      >
                        {motion.voteType === "anonymous" ? "匿名投票" : "实名投票"}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-800 mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors">
                      {motion.title}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{motion.initiatorName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(motion.publicityStart || motion.voteStart, "YYYY-MM-DD")}</span>
                      </div>
                    </div>

                    {motion.status !== "draft" && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-500">投票进度</span>
                          <span className="font-medium text-slate-700">
                            {motion.voteStats.votedCount}/{motion.voteStats.totalVoters}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <m.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                          />
                        </div>
                      </div>
                    )}

                    {motion.voteStats.votedCount > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
                        <div className="bg-emerald-50 rounded-lg p-2">
                          <div className="font-semibold text-emerald-600">
                            {motion.voteStats.agreeCount}
                          </div>
                          <div className="text-xs text-emerald-500">
                            {formatPercent(
                              (motion.voteStats.agreeCount / motion.voteStats.votedCount) * 100
                            )}
                            同意
                          </div>
                        </div>
                        <div className="bg-rose-50 rounded-lg p-2">
                          <div className="font-semibold text-rose-600">
                            {motion.voteStats.disagreeCount}
                          </div>
                          <div className="text-xs text-rose-500">
                            {formatPercent(
                              (motion.voteStats.disagreeCount / motion.voteStats.votedCount) * 100
                            )}
                            反对
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2">
                          <div className="font-semibold text-slate-600">
                            {motion.voteStats.abstainCount}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatPercent(
                              (motion.voteStats.abstainCount / motion.voteStats.votedCount) * 100
                            )}
                            弃权
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-sm text-slate-400">
                        <Paperclip className="w-4 h-4" />
                        <span>{motion.attachments.length} 个附件</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-primary-600 font-medium">
                        <Eye className="w-4 h-4" />
                        <span>查看详情</span>
                      </div>
                    </div>
                  </div>
                </m.div>
              );
            })}
          </div>
        )}

        {filteredMotions.length > 0 && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8 text-slate-400 text-sm"
          >
            共 {filteredMotions.length} 条议案 · 下拉加载更多
          </m.div>
        )}
      </div>
    </div>
  );
}
