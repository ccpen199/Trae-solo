import { useState } from "react";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Eye,
  Flag,
  User,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  BarChart3,
  Zap,
} from "lucide-react";

type ReviewStatus = "pending" | "approved" | "rejected";
type ContentType = "text" | "image" | "post";

interface ContentReviewItem {
  id: string;
  contentType: ContentType;
  content: string;
  status: ReviewStatus;
  flaggedReason: string[];
  submitterName: string;
  submittedAt: string;
  avatar?: string;
}

const contentTypeConfig: Record<
  ContentType,
  { label: string; icon: typeof FileText; bg: string; text: string }
> = {
  text: {
    label: "文本",
    icon: MessageSquare,
    bg: "bg-sky-500/15",
    text: "text-sky-400",
  },
  image: {
    label: "图片",
    icon: ImageIcon,
    bg: "bg-pink-500/15",
    text: "text-pink-400",
  },
  post: {
    label: "帖子",
    icon: FileText,
    bg: "bg-violet-500/15",
    text: "text-violet-400",
  },
};

const statusConfig: Record<
  ReviewStatus,
  { label: string; bg: string; text: string }
> = {
  pending: {
    label: "待审核",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
  },
  approved: {
    label: "已通过",
    bg: "bg-brand-mint/15",
    text: "text-brand-mint",
  },
  rejected: {
    label: "已拒绝",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
  },
};

const adminAvatar = (seed: string) =>
  `/api/ide/v1/text_to_image?prompt=pet%20community%20moderator%20avatar%20${seed}&image_size=square`;

const mockReviews: ContentReviewItem[] = [
  {
    id: "r1",
    contentType: "post",
    content:
      "出售自家繁殖的纯种金毛幼犬，价格面议，微信联系xxxxxx，保证健康纯种，已打两针疫苗，驱虫已做，包健康一个月...",
    status: "pending",
    flaggedReason: ["广告推广", "违规交易", "联系方式外露"],
    submitterName: "匿名用户A",
    submittedAt: "2026-06-15 15:20",
    avatar: adminAvatar("userA"),
  },
  {
    id: "r2",
    contentType: "text",
    content:
      "这只猫好丑啊，不如扔掉算了，看着就烦，长这么丑还好意思发出来，我家狗都比这好看一万倍...",
    status: "pending",
    flaggedReason: ["恶意言论", "人身攻击", "不友善内容"],
    submitterName: "用户B",
    submittedAt: "2026-06-15 13:45",
    avatar: adminAvatar("userB"),
  },
  {
    id: "r3",
    contentType: "image",
    content: "[图片内容：疑似含有血腥/暴力元素的宠物照片]",
    status: "pending",
    flaggedReason: ["敏感图片", "血腥暴力"],
    submitterName: "用户C",
    submittedAt: "2026-06-15 11:30",
    avatar: adminAvatar("userC"),
  },
  {
    id: "r4",
    contentType: "post",
    content:
      "听说最近有一种毒猫粮，大家千万别买XX牌子的！我家猫吃了之后上吐下泻差点没命！已经有一百多只猫出事了！这个牌子的猫粮全是垃圾...",
    status: "pending",
    flaggedReason: ["未经证实的谣言", "恶意抹黑商家"],
    submitterName: "用户D",
    submittedAt: "2026-06-15 10:00",
    avatar: adminAvatar("userD"),
  },
  {
    id: "r5",
    contentType: "text",
    content:
      "私聊我给你发资源哦~免费的！保证你喜欢，点我头像进主页有惊喜，加我扣扣xxxxxx，大量高清资源免费送...",
    status: "pending",
    flaggedReason: ["诱导私聊", "可疑链接", "垃圾信息"],
    submitterName: "匿名用户E",
    submittedAt: "2026-06-15 08:20",
    avatar: adminAvatar("userE"),
  },
  {
    id: "r6",
    contentType: "text",
    content:
      "我觉得这个医生的诊断很有道理，我家狗狗之前也是类似的症状，按照医生说的做确实好转了，感谢分享！",
    status: "approved",
    flaggedReason: ["可能存在争议"],
    submitterName: "用户F",
    submittedAt: "2026-06-14 20:15",
    avatar: adminAvatar("userF"),
  },
  {
    id: "r7",
    contentType: "image",
    content: "[图片内容：正常的宠物照片，添加了可爱滤镜]",
    status: "approved",
    flaggedReason: ["算法误判"],
    submitterName: "用户G",
    submittedAt: "2026-06-14 18:30",
    avatar: adminAvatar("userG"),
  },
  {
    id: "r8",
    contentType: "post",
    content: "【骗子预警】这个人是骗子！骗了我500块钱！微信号是xxxxxx，大家千万别上当！",
    status: "pending",
    flaggedReason: ["公开他人隐私", "需核实真实性"],
    submitterName: "用户H",
    submittedAt: "2026-06-14 16:00",
    avatar: adminAvatar("userH"),
  },
];

export default function AdminContentSafety() {
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">(
    "pending",
  );
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const filteredReviews = mockReviews.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (typeFilter !== "all" && r.contentType !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !r.content.toLowerCase().includes(q) &&
        !r.submitterName.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const pending = mockReviews.filter((r) => r.status === "pending").length;
  const approved = mockReviews.filter((r) => r.status === "approved").length;
  const rejected = mockReviews.filter((r) => r.status === "rejected").length;

  const allReasons = mockReviews.flatMap((r) => r.flaggedReason);
  const reasonCounts: Record<string, number> = {};
  allReasons.forEach((r) => {
    reasonCounts[r] = (reasonCounts[r] || 0) + 1;
  });
  const topReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxReasonCount = Math.max(...topReasons.map(([, c]) => c), 1);

  const handleReview = (id: string, action: "approve" | "reject") => {
    setReviewedIds((prev) => new Set(prev).add(id));
    setTimeout(() => setReviewedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    }), 500);
  };

  return (
    <div className="min-h-screen text-gray-100">
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-mint/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-brand-mint" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">内容安全审核</h1>
            <p className="text-sm text-gray-400">
              审核用户发布内容，维护社区健康环境
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8 animate-slide-up">
        <StatCard
          label="今日待审核"
          value={pending}
          icon={Clock}
          trend={12}
          trendUp={false}
          color="amber"
        />
        <StatCard
          label="本周已通过"
          value={approved + 286}
          icon={CheckCircle}
          trend={8.5}
          trendUp
          color="mint"
        />
        <StatCard
          label="本周已拒绝"
          value={rejected + 58}
          icon={XCircle}
          trend={3.2}
          trendUp={false}
          color="rose"
        />
        <StatCard
          label="违规内容占比"
          value={`${Math.round(((rejected + 58) / (approved + 286 + rejected + 58)) * 100)}%`}
          icon={AlertTriangle}
          trend={2.1}
          trendUp={false}
          color="violet"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 animate-slide-up stagger-1">
          <div className="p-5 border-b border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">待审队列</h2>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-xl hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-500">
                  {filteredReviews.length} 条
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索内容或提交者..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-brand-mint/50 transition-all"
                />
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-900/50 border border-gray-700">
                <Filter className="w-4 h-4 text-gray-500 mx-2" />
                <FilterChip
                  active={statusFilter === "all"}
                  onClick={() => setStatusFilter("all")}
                >
                  全部
                </FilterChip>
                <FilterChip
                  active={statusFilter === "pending"}
                  onClick={() => setStatusFilter("pending")}
                  color="amber"
                >
                  待审 {pending}
                </FilterChip>
                <FilterChip
                  active={statusFilter === "approved"}
                  onClick={() => setStatusFilter("approved")}
                  color="mint"
                >
                  通过
                </FilterChip>
                <FilterChip
                  active={statusFilter === "rejected"}
                  onClick={() => setStatusFilter("rejected")}
                  color="rose"
                >
                  拒绝
                </FilterChip>
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-900/50 border border-gray-700">
                {(["all", "text", "image", "post"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      typeFilter === t
                        ? "bg-brand-mint/20 text-brand-mint"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                    }`}
                  >
                    {t === "all" ? "全部类型" : contentTypeConfig[t].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-700/30 max-h-[640px] overflow-y-auto scrollbar-thin">
            {filteredReviews.map((item, idx) => {
              const typeCfg = contentTypeConfig[item.contentType];
              const TypeIcon = typeCfg.icon;
              const statusCfg = statusConfig[item.status];
              const isReviewed = reviewedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`p-5 hover:bg-gray-700/20 transition-all animate-slide-up ${
                    isReviewed ? "opacity-50 scale-[0.98]" : ""
                  }`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl ${typeCfg.bg} flex items-center justify-center shrink-0`}
                    >
                      <TypeIcon className={`w-5 h-5 ${typeCfg.text}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <img
                            src={item.avatar}
                            alt=""
                            className="w-5 h-5 rounded-full bg-gray-700"
                          />
                          <span className="text-sm text-gray-300 font-medium">
                            {item.submitterName}
                          </span>
                        </div>
                        <span className="text-gray-600">·</span>
                        <span className="text-xs text-gray-500">
                          {item.submittedAt}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeCfg.bg} ${typeCfg.text}`}
                        >
                          {typeCfg.label}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}
                        >
                          {item.status === "pending" && (
                            <Clock className="w-3 h-3" />
                          )}
                          {item.status === "approved" && (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          {item.status === "rejected" && (
                            <XCircle className="w-3 h-3" />
                          )}
                          {statusCfg.label}
                        </span>
                      </div>

                      <p className="text-sm text-gray-200 mb-3 leading-relaxed line-clamp-3">
                        {item.content}
                      </p>

                      <div className="flex items-center gap-2 flex-wrap mb-4">
                        <Flag className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        {item.flaggedReason.map((reason) => (
                          <span
                            key={reason}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 text-xs font-medium border border-rose-500/20"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                          查看详情
                        </button>

                        {item.status === "pending" && (
                          <>
                            <div className="flex-1" />
                            <button
                              onClick={() => handleReview(item.id, "reject")}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              拒绝
                            </button>
                            <button
                              onClick={() => handleReview(item.id, "approve")}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-brand-mint/20 text-brand-mint hover:bg-brand-mint/30 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              通过
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredReviews.length === 0 && (
              <div className="p-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-700/50 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-400 mb-1">没有找到匹配的内容</p>
                <p className="text-sm text-gray-600">尝试修改筛选条件</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 animate-slide-up stagger-2">
          <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">命中原因分布</h3>
              <BarChart3 className="w-5 h-5 text-brand-mint" />
            </div>
            <div className="space-y-4">
              {topReasons.map(([reason, count], idx) => (
                <div key={reason} className="animate-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-300">{reason}</span>
                    <span className="text-sm font-medium text-brand-mint">
                      {count} 次
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-700/50 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-mint to-brand-mint-light rounded-full transition-all duration-700"
                      style={{
                        width: `${(count / maxReasonCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">内容类型分布</h3>
              <FileText className="w-5 h-5 text-brand-mint" />
            </div>
            <div className="space-y-3">
              {(
                [
                  {
                    type: "post",
                    label: "帖子内容",
                    count:
                      mockReviews.filter((r) => r.contentType === "post").length +
                      156,
                  },
                  {
                    type: "text",
                    label: "评论文本",
                    count:
                      mockReviews.filter((r) => r.contentType === "text").length +
                      289,
                  },
                  {
                    type: "image",
                    label: "图片内容",
                    count:
                      mockReviews.filter((r) => r.contentType === "image")
                        .length + 78,
                  },
                ] as const
              ).map((item, idx) => {
                const cfg = contentTypeConfig[item.type];
                const Icon = cfg.icon;
                const total = 156 + 289 + 78 + mockReviews.length;
                return (
                  <div
                    key={item.type}
                    className="p-3 rounded-xl bg-gray-900/50 border border-gray-700/50 flex items-center gap-3 animate-slide-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}
                    >
                      <Icon className={`w-5 h-5 ${cfg.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200">
                        {item.label}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {item.count} 条
                        </span>
                        <span className="text-xs font-medium text-brand-mint">
                          {Math.round((item.count / total) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand-mint/10 to-brand-orange/10 backdrop-blur rounded-2xl border border-brand-mint/20 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-mint/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-brand-mint" />
              </div>
              <div>
                <h3 className="font-semibold text-white">快速操作</h3>
                <p className="text-xs text-gray-400">提高审核效率</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { icon: CheckCircle, label: "批量通过待审内容", color: "mint" },
                { icon: XCircle, label: "批量处理高风险内容", color: "rose" },
                { icon: User, label: "查看违规用户记录", color: "sky" },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left group"
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        item.color === "mint"
                          ? "text-brand-mint"
                          : item.color === "rose"
                            ? "text-rose-400"
                            : "text-sky-400"
                      }`}
                    />
                    <span className="text-sm text-gray-200 flex-1">
                      {item.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  color,
}: {
  label: string;
  value: number | string;
  icon: typeof Clock;
  trend: number;
  trendUp: boolean;
  color: "amber" | "mint" | "rose" | "violet";
}) {
  const colorClasses = {
    amber: {
      iconBg: "bg-amber-500/15",
      iconText: "text-amber-400",
      value: "text-amber-400",
    },
    mint: {
      iconBg: "bg-brand-mint/15",
      iconText: "text-brand-mint",
      value: "text-brand-mint",
    },
    rose: {
      iconBg: "bg-rose-500/15",
      iconText: "text-rose-400",
      value: "text-rose-400",
    },
    violet: {
      iconBg: "bg-violet-500/15",
      iconText: "text-violet-400",
      value: "text-violet-400",
    },
  }[color];

  return (
    <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-5 border border-gray-700/50 hover:border-gray-600 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl ${colorClasses.iconBg} flex items-center justify-center`}
        >
          <Icon className={`w-5 h-5 ${colorClasses.iconText}`} />
        </div>
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium ${
            trendUp ? "text-brand-mint" : "text-rose-400"
          }`}
        >
          {trendUp ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {trend}%
        </span>
      </div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colorClasses.value}`}>{value}</p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: "amber" | "mint" | "rose";
}) {
  const activeClass = color
    ? color === "amber"
      ? "bg-amber-500/20 text-amber-400"
      : color === "mint"
        ? "bg-brand-mint/20 text-brand-mint"
        : "bg-rose-500/20 text-rose-400"
    : "bg-brand-mint/20 text-brand-mint";

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        active ? activeClass : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );
}
