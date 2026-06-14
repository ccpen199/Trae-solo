import { useState, useEffect } from "react";
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
import type { CommunityPost, OpinionDashboard } from "../../shared/types";
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

function PostCard({ post }: { post: CommunityPost }) {
  const [expanded, setExpanded] = useState(false);
  const sentimentConfig = getSentimentConfig(post.sentiment);
  const levelConfig = getOpinionLevelConfig(post.opinionLevel);
  const barWidth = getSentimentBarWidth(post.sentimentScore);

  return (
    <div
      className="bg-white rounded-2xl shadow-card overflow-hidden cursor-pointer hover:shadow-card-hover transition-all duration-300"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex">
        <div
          className="w-1.5 flex-shrink-0"
          style={{ backgroundColor: sentimentConfig.color }}
        />
        <div className="flex-1 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
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
                <span className="text-xs text-slate-400">
                  {formatDateTime(post.publishedAt)}
                </span>
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
              className="flex-shrink-0 flex flex-col items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: levelConfig.color }}
              >
                {post.opinionLevel}
              </div>
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

          {expanded && (
            <div className="mt-4 pt-4 border-t border-slate-100 animate-slide-down">
              <p className="text-sm text-slate-600 leading-relaxed">
                {post.content}
              </p>
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

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await communityApi.getPosts({ pageSize: 20 });
        setPosts(data);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

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

  if (posts.length === 0) {
    return <Empty />;
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
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
