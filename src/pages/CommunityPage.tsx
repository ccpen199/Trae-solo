import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  MessageSquare,
  ThumbsUp,
  AlertTriangle,
  TrendingUp,
  List,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Brain,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  Send,
  XCircle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import AppLayout from "@/components/AppLayout";
import TabBar from "@/components/TabBar";
import Empty from "@/components/Empty";
import { communityApi } from "@/api";
import type { CommunityPost, OpinionDashboard, DisposalStatus } from "../../shared/types";
import {
  getSentimentConfig,
  getOpinionLevelConfig,
  getSentimentBarWidth,
  formatSentimentScore,
} from "@/utils/sentiment";
import { formatDateTime } from "@/utils/format";
import { cn } from "@/lib/utils";

const COMMUNITY_TABS = [
  { key: "posts", label: "热帖列表", icon: <List className="w-4 h-4" /> },
  { key: "dashboard", label: "舆情看板", icon: <BarChart3 className="w-4 h-4" /> },
];

const disposalStatusConfig: Record<DisposalStatus, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: "待核实", className: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  processing: { label: "处理中", className: "bg-blue-100 text-blue-700 border-blue-200", icon: Loader2 },
  replied: { label: "已回复", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: Send },
  closed: { label: "已闭环", className: "bg-slate-100 text-slate-600 border-slate-200", icon: CheckCircle2 },
};

function PostCard({ post, onReview }: { post: CommunityPost; onReview?: (post: CommunityPost) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showNlp, setShowNlp] = useState(true);
  const sentimentConfig = getSentimentConfig(post.sentiment);
  const levelConfig = getOpinionLevelConfig(post.opinionLevel);
  const barWidth = getSentimentBarWidth(post.sentimentScore);
  const disposalStatus = post.disposalStatus || "pending";
  const disposalConfig = disposalStatusConfig[disposalStatus];
  const DisposalIcon = disposalConfig.icon;
  const isHighRisk = post.opinionLevel >= 4;
  const postAny = post as any;
  const reviewStatus = (postAny.reviewStatus as string) || "auto_analyzed";
  const opinionLevelSource = (postAny.opinionLevelSource as string) || "";

  const getReviewStatusConfig = (status: string) => {
    switch (status) {
      case "auto_analyzed":
        return { label: "自动分析", className: "bg-slate-100 text-slate-600 border-slate-200" };
      case "pending_review":
        return { label: "待复核", className: "bg-amber-100 text-amber-700 border-amber-200" };
      case "reviewed":
        return { label: "已复核", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
      case "escalated":
        return { label: "已升级", className: "bg-red-100 text-red-700 border-red-200" };
      default:
        return { label: "自动分析", className: "bg-slate-100 text-slate-600 border-slate-200" };
    }
  };

  const reviewConfig = getReviewStatusConfig(reviewStatus);

  return (
    <div
      className="bg-white rounded-2xl shadow-card overflow-hidden cursor-pointer hover:shadow-card-hover transition-all duration-300 relative"
      onClick={() => setExpanded(!expanded)}
    >
      {isHighRisk && post.transferredTo && (
        <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] px-2 py-1 rounded-full font-medium flex items-center gap-1 z-10">
          <ShieldAlert size={10} />
          {post.transferredTo}
        </div>
      )}
      <div className="flex">
        <div
          className="w-1.5 flex-shrink-0"
          style={{ backgroundColor: sentimentConfig.color }}
        />
        <div className="flex-1 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0 pr-12">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span
                  className="text-xs px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: sentimentConfig.bgColor,
                    color: sentimentConfig.color,
                    borderColor: sentimentConfig.borderColor,
                  }}
                >
                  {post.board}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${disposalConfig.className}`}>
                  <DisposalIcon size={10} />
                  {disposalConfig.label}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${reviewConfig.className}`}>
                  {reviewConfig.label}
                </span>
                {opinionLevelSource && opinionLevelSource.includes("NLP") && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 font-medium">
                    AI
                  </span>
                )}
                {opinionLevelSource && opinionLevelSource.includes("人工") && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-medium">
                    人工
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNlp(!showNlp);
                  }}
                  className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 hover:bg-purple-100 transition-colors"
                >
                  <Brain size={10} />
                  NLP分析
                  {showNlp ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
              </div>
              <h3 className="text-base font-semibold text-slate-800 line-clamp-2 mb-2">
                {post.title}
              </h3>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  {post.author}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {post.viewCount.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {post.replyCount}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {post.likeCount}
                </span>
              </div>
            </div>
            <div
              className="flex-shrink-0 flex flex-col items-center gap-2 absolute right-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: levelConfig.color }}
              >
                {post.opinionLevel}
              </div>
              {reviewStatus === "pending_review" && onReview && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReview(post);
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white hover:bg-amber-600 transition-colors font-medium"
                >
                  复核
                </button>
              )}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">情感指数</span>
              <span
                className="text-xs font-medium"
                style={{ color: sentimentConfig.color }}
              >
                {formatSentimentScore(post.sentimentScore)}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: sentimentConfig.color,
                }}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.keywords.map((keyword) => (
              <span
                key={keyword}
                className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
              >
                #{keyword}
              </span>
            ))}
          </div>

          {showNlp && post.nlpAnalysis && (
            <div className="mt-4 pt-4 border-t border-dashed border-purple-200 animate-slide-down bg-purple-50/50 -mx-4 -mb-4 px-4 pb-4" onClick={(e) => e.stopPropagation()}>
              <div className="text-xs font-medium text-purple-800 mb-3 flex items-center gap-1.5">
                <Brain size={14} />
                NLP智能分析结果
              </div>

              <div className="space-y-3">
                <div className="bg-white rounded-xl p-3 border border-purple-100">
                  <div className="text-xs text-slate-500 mb-1.5">情感分析置信度</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-purple-600">
                      {post.nlpAnalysis.sentimentConfidence}%
                    </span>
                    <span className="text-sm text-slate-600">
                      {post.nlpAnalysis.sentimentLabel}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-purple-100">
                  <div className="text-xs text-slate-500 mb-2">关键词提取（权重）</div>
                  <div className="flex flex-wrap gap-1.5">
                    {post.nlpAnalysis.keywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border border-purple-100 flex items-center gap-1"
                      >
                        <span className="font-medium">{kw.word}</span>
                        <span className="text-[10px] text-purple-500 font-mono">{(kw.weight * 100).toFixed(0)}%</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-purple-100">
                  <div className="text-xs text-slate-500 mb-1.5">舆情等级判定依据</div>
                  <div className="text-xs text-slate-700 leading-relaxed">
                    {post.nlpAnalysis.opinionBasis}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Brain size={12} />
                    分析引擎：{post.nlpAnalysis.engine}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    标注时间：{formatDateTime(post.nlpAnalysis.annotatedAt)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {expanded && (
            <div className={`mt-4 pt-4 border-t border-slate-100 animate-slide-down ${showNlp ? 'mt-0' : ''}`}>
              <p className="text-sm text-slate-600 leading-relaxed">
                {post.content}
              </p>
            </div>
          )}

          {reviewStatus === "reviewed" && postAny.reviewedBy && (
            <div className="mt-4 p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <div className="text-xs font-medium text-emerald-700 mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={12} />
                人工复核信息
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">复核人</span>
                  <span className="text-slate-700 font-medium">{postAny.reviewedBy}</span>
                </div>
                {postAny.reviewedAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">复核时间</span>
                    <span className="text-slate-700">{formatDateTime(postAny.reviewedAt)}</span>
                  </div>
                )}
                {postAny.reviewComment && (
                  <div className="flex items-start gap-2">
                    <span className="text-slate-500 flex-shrink-0">复核意见</span>
                    <span className="text-slate-700">{postAny.reviewComment}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PostsView() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "pending_review">("all");
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    post: CommunityPost | null;
    opinionLevel: 1 | 2 | 3 | 4 | 5;
    comment: string;
  }>({
    open: false,
    post: null,
    opinionLevel: 3,
    comment: "",
  });

  const fetchPosts = useCallback(async (reviewStatus?: string) => {
    setLoading(true);
    try {
      const data = await communityApi.getPosts({ pageSize: 20, reviewStatus });
      setPosts(data);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(activeFilter === "pending_review" ? "pending_review" : undefined);
  }, [activeFilter, fetchPosts]);

  const handleOpenReview = (post: CommunityPost) => {
    setReviewModal({
      open: true,
      post,
      opinionLevel: post.opinionLevel as 1 | 2 | 3 | 4 | 5,
      comment: "",
    });
  };

  const handleSubmitReview = async () => {
    if (!reviewModal.post) return;
    try {
      const updated = await communityApi.reviewPost(reviewModal.post.id, {
        opinionLevel: reviewModal.opinionLevel,
        reviewComment: reviewModal.comment,
        reviewedBy: "管理员",
      });
      setPosts((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      setReviewModal({ open: false, post: null, opinionLevel: 3, comment: "" });
    } catch (error) {
      console.error("Failed to review post:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 bg-white rounded-2xl animate-pulse shadow-card"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setActiveFilter("all")}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-all",
            activeFilter === "all"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300"
          )}
        >
          全部帖子
        </button>
        <button
          onClick={() => setActiveFilter("pending_review")}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5",
            activeFilter === "pending_review"
              ? "bg-amber-500 text-white shadow-md"
              : "bg-white text-slate-600 border border-slate-200 hover:border-amber-300"
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          待复核
        </button>
      </div>

      {posts.length === 0 ? (
        <Empty
          title={activeFilter === "pending_review" ? "暂无待复核帖子" : "暂无帖子"}
          description={activeFilter === "pending_review" ? "所有帖子都已完成复核" : ""}
        />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onReview={handleOpenReview} />
          ))}
        </div>
      )}

      {reviewModal.open && reviewModal.post && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setReviewModal({ ...reviewModal, open: false })}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">人工复核</h3>
              <button onClick={() => setReviewModal({ ...reviewModal, open: false })} className="text-slate-400 hover:text-slate-600">
                <XCircle size={20} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-slate-50 rounded-xl">
              <p className="text-sm font-medium text-slate-800 line-clamp-2">{reviewModal.post.title}</p>
              <p className="text-xs text-slate-500 mt-1">当前舆情等级：L{reviewModal.post.opinionLevel}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-600 mb-2 block">舆情等级判定</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setReviewModal({ ...reviewModal, opinionLevel: level as 1 | 2 | 3 | 4 | 5 })}
                      className={cn(
                        "flex-1 h-10 rounded-lg text-sm font-bold transition-all",
                        reviewModal.opinionLevel === level
                          ? getOpinionLevelConfig(level).color
                            ? "text-white"
                            : "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                      style={
                        reviewModal.opinionLevel === level
                          ? { backgroundColor: getOpinionLevelConfig(level).color || "#2563eb" }
                          : {}
                      }
                    >
                      L{level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-600 mb-2 block">复核意见</label>
                <textarea
                  value={reviewModal.comment}
                  onChange={(e) => setReviewModal({ ...reviewModal, comment: e.target.value })}
                  placeholder="请输入复核意见..."
                  className="w-full h-24 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setReviewModal({ ...reviewModal, open: false })}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitReview}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                确认复核
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardView() {
  const [dashboard, setDashboard] = useState<OpinionDashboard | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardData, postsData] = await Promise.all([
          communityApi.getDashboard(),
          communityApi.getPosts({ pageSize: 50 }),
        ]);
        setDashboard(dashboardData);
        setPosts(postsData);
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !dashboard) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-48 bg-white rounded-2xl animate-pulse shadow-card"
          />
        ))}
      </div>
    );
  }

  const pieData = [
    { name: "正面", value: dashboard.positiveCount, color: "#10b981" },
    { name: "中性", value: dashboard.neutralCount, color: "#6b7280" },
    { name: "负面", value: dashboard.negativeCount, color: "#ef4444" },
  ];

  const positivePercent = Math.round(
    (dashboard.positiveCount / dashboard.totalPosts) * 100
  );
  const neutralPercent = Math.round(
    (dashboard.neutralCount / dashboard.totalPosts) * 100
  );
  const negativePercent = Math.round(
    (dashboard.negativeCount / dashboard.totalPosts) * 100
  );

  const maxKeywordCount = Math.max(
    ...dashboard.topKeywords.map((k) => k.count)
  );

  const highRiskPosts = posts.filter((p) => p.opinionLevel >= 4);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-brand-600" />
          <h3 className="text-lg font-semibold text-slate-800">情感分布</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-36 h-36 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {pieData.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-slate-600">{item.name}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-slate-800">
                      {item.value}
                    </span>
                    <span className="text-slate-400 ml-2">
                      {item.name === "正面"
                        ? `${positivePercent}%`
                        : item.name === "中性"
                        ? `${neutralPercent}%`
                        : `${negativePercent}%`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">总数</span>
                <span className="text-lg font-bold text-brand-600">
                  {dashboard.totalPosts}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-brand-600" />
          <h3 className="text-lg font-semibold text-slate-800">舆情趋势</h3>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dashboard.trend}>
              <defs>
                <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="positive"
                name="正面"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorPositive)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="neutral"
                name="中性"
                stroke="#6b7280"
                fillOpacity={1}
                fill="url(#colorNeutral)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="negative"
                name="负面"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorNegative)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-5 h-5 text-brand-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-800">关键词云</h3>
        </div>
        <div className="flex flex-wrap gap-3 justify-center items-center py-2">
          {dashboard.topKeywords.map((item, index) => {
            const ratio = item.count / maxKeywordCount;
            const fontSize = 14 + ratio * 18;
            const opacity = 0.5 + ratio * 0.5;
            const colors = [
              "text-brand-600",
              "text-accent-500",
              "text-emerald-600",
              "text-purple-600",
              "text-rose-500",
            ];
            return (
              <span
                key={item.word}
                className={cn(
                  "font-semibold transition-all hover:scale-110 cursor-pointer",
                  colors[index % colors.length]
                )}
                style={{ fontSize: `${fontSize}px`, opacity }}
              >
                {item.word}
              </span>
            );
          })}
        </div>
      </div>

      <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-red-700">高风险预警</h3>
          <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium">
            {highRiskPosts.length} 条
          </span>
        </div>
        <div className="space-y-2">
          {highRiskPosts.length > 0 ? (
            highRiskPosts.map((post) => {
              const levelConfig = getOpinionLevelConfig(post.opinionLevel);
              return (
                <div
                  key={post.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: levelConfig.color }}
                  >
                    {post.opinionLevel}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 font-medium line-clamp-1">
                      {post.title}
                    </p>
                    <span className="text-xs text-slate-400">
                      {post.board} · {post.author}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-red-400 text-center py-4">
              暂无高风险舆情
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("posts");

  return (
    <AppLayout>
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800 ml-1">
            社区舆情
          </h1>
        </div>
        <div className="px-4 pb-3">
          <TabBar
            tabs={COMMUNITY_TABS}
            activeKey={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </div>

      <div className="p-4 pb-20">
        {activeTab === "posts" ? <PostsView /> : <DashboardView />}
      </div>
    </AppLayout>
  );
}
