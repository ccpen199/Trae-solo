import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import {
  BadgeCheck,
  Heart,
  MessageCircle,
  Clock,
  ArrowRight,
  Search,
  Users,
  ChefHat,
  AlertTriangle,
  Sparkles,
  Bookmark,
  Share2,
  ShoppingCart,
  CheckCircle,
} from "lucide-react";
import type { PostCategory, CommunityPost, FeedingPlan, Pet } from "../../shared/types";
import { CATEGORY_TABS, CATEGORY_BADGE, CATEGORY_LABEL, VET_AVATAR } from "../data/communityConfig";

export default function Community() {
  const navigate = useNavigate();
  const { posts, feedingPlans, pets } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<PostCategory | "all">("all");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState("");
  const [submittedPlanIds, setSubmittedPlanIds] = useState<Set<string>>(new Set());
  const [consultSubmitted, setConsultSubmitted] = useState(false);

  const filteredPosts = useMemo(() => {
    let list = posts;
    if (activeCategory !== "all") list = list.filter((p) => p.category === activeCategory);
    if (searchText.trim()) {
      const s = searchText.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          p.content.toLowerCase().includes(s) ||
          p.tags.some((t) => t.toLowerCase().includes(s))
      );
    }
    return list;
  }, [posts, activeCategory, searchText]);

  const toggleLike = (id: string) =>
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const submitPurchasePlan = async (plan: FeedingPlan) => {
    try {
      await fetch("/api/orders/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          petName: plan.petName,
          items: [...plan.recommendedFoods.slice(0, 2), ...plan.supplements.slice(0, 1)],
        }),
      });
    } finally {
      setSubmittedPlanIds((prev) => {
        const next = new Set(prev);
        next.add(plan.id);
        return next;
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-warm-brown flex items-center gap-3">
            <Users className="w-7 h-7 text-brand-mint" />
            知识社区
            <Sparkles className="w-6 h-6 text-accent-sunny" />
          </h1>
          <p className="text-warm-gray mt-1">与兽医和铲屎官们一起，科学养宠</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-warm-gray" />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索科普、故事..."
            className="input-base pl-11 w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display text-lg text-warm-brown">发现分类</h2>
                <p className="text-xs text-warm-gray">按知识、故事、问答和兽医专栏筛选内容</p>
              </div>
              <span className="badge bg-cream-100 text-warm-gray">
                {filteredPosts.length} 篇
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeCategory === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveCategory(tab.key)}
                    className={`chip ${
                      active
                        ? "bg-gradient-to-r from-brand-orange to-brand-orange-light text-white shadow-soft"
                        : "chip-default"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "" : tab.color}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <div className="font-display text-xl text-warm-brown mb-2">暂无相关内容</div>
              <div className="text-warm-gray">换个关键词试试吧～</div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post, idx) => {
                const badge = CATEGORY_BADGE[post.category] ?? CATEGORY_BADGE.knowledge;
                const isLiked = liked.has(post.id);
                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    badge={badge}
                    isLiked={isLiked}
                    onToggleLike={toggleLike}
                    onOpen={() => navigate(`/community/${post.id}`)}
                    idx={idx}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <button
            type="button"
            onClick={() => navigate("/community/symptom-check")}
            className="card w-full text-left bg-gradient-to-br from-brand-orange via-brand-orange-light to-accent-sunny/60 border-0 text-white cursor-pointer hover:scale-[1.02] transition-transform duration-300 group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="font-display text-xl">症状自查</div>
                <div className="text-xs text-white/80">AI 辅助初筛，3分钟出结果</div>
              </div>
            </div>
            <p className="text-sm text-white/90 leading-relaxed mb-4">
              爱宠不舒服？通过交互式决策树，快速了解可能的原因和严重程度，帮你判断是否需要就医。
            </p>
            <div className="inline-flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all">
              立即开始自查 <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <ChefHat className="w-5 h-5 text-brand-mint-dark" />
              <h3 className="section-title !mb-0 !text-lg">喂养方案推荐</h3>
            </div>
            <div className="space-y-4">
              {feedingPlans.map((plan, idx) => {
                const pet = pets.find((p) => p.name === plan.petName);
                return (
                  <FeedingCard
                    key={plan.id}
                    plan={plan}
                    pet={pet}
                    idx={idx}
                    submitted={submittedPlanIds.has(plan.id)}
                    onSubmit={() => submitPurchasePlan(plan)}
                  />
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <BadgeCheck className="w-5 h-5 text-brand-mint-dark" />
              <h3 className="section-title !mb-0 !text-lg">认证兽医</h3>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-cream-50">
              <img src={VET_AVATAR} alt="" className="w-12 h-12 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-warm-brown flex items-center gap-1">
                  王医生
                  <BadgeCheck className="w-4 h-4 text-brand-mint fill-brand-mint/20" />
                </div>
                <div className="text-xs text-warm-gray">临床兽医学博士 · 10年经验</div>
              </div>
              <button
                onClick={() => setConsultSubmitted(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-brand-mint/15 text-brand-mint-dark font-medium hover:bg-brand-mint/25 transition inline-flex items-center gap-1"
              >
                {consultSubmitted ? <CheckCircle className="w-3 h-3" /> : null}
                {consultSubmitted ? "已提交咨询" : "提交咨询"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PostCard({
  post,
  badge,
  isLiked,
  onToggleLike,
  onOpen,
  idx,
}: {
  post: CommunityPost;
  badge: { bg: string; text: string };
  isLiked: boolean;
  onToggleLike: (id: string) => void;
  onOpen: () => void;
  idx: number;
}) {
  return (
    <article
      className="card animate-slide-up cursor-pointer"
      onClick={onOpen}
      style={{ animationDelay: `${idx * 60}ms` }}
    >
      <div className="flex gap-4">
        <img src={post.authorAvatar} alt="" className="w-12 h-12 rounded-2xl object-cover flex-shrink-0 shadow-sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <span className="font-semibold text-warm-brown">{post.authorName}</span>
            {post.isVetCertified && (
              <span className="badge bg-brand-mint/15 text-brand-mint-dark gap-1">
                <BadgeCheck className="w-3.5 h-3.5" />
                兽医认证
              </span>
            )}
            <span className={`badge ${badge.bg} ${badge.text}`}>
              {CATEGORY_LABEL[post.category] ?? "分享"}
            </span>
            <span className="text-xs text-warm-gray flex items-center gap-1 ml-auto">
              <Clock className="w-3 h-3" />
              {post.createdAt.slice(5, 16)}
            </span>
          </div>

          <h3 className="font-display text-lg text-warm-brown mb-2 hover:text-brand-orange transition cursor-pointer">
            {post.title}
          </h3>
          <p className="text-sm text-warm-gray/90 line-clamp-3 leading-relaxed mb-3">{post.content}</p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.map((t) => (
              <span key={t} className="badge bg-cream-100 text-warm-gray hover:bg-cream-200 cursor-pointer transition">
                # {t}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-cream-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(post.id);
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition ${
                isLiked ? "bg-brand-orange/10 text-brand-orange-dark" : "text-warm-gray hover:bg-cream-100"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-brand-orange text-brand-orange" : ""}`} />
              {post.likes + (isLiked ? 1 : 0)}
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-warm-gray hover:bg-cream-100 transition"
            >
              <MessageCircle className="w-4 h-4" />
              {post.comments}
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-warm-gray hover:bg-cream-100 transition ml-auto"
            >
              <Bookmark className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-warm-gray hover:bg-cream-100 transition"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm bg-brand-mint/10 text-brand-mint-dark hover:bg-brand-mint/20 transition"
            >
              查看详情
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function FeedingCard({
  plan,
  pet,
  idx,
  submitted,
  onSubmit,
}: {
  plan: FeedingPlan;
  pet?: Pet;
  idx: number;
  submitted: boolean;
  onSubmit: () => void;
}) {
  return (
    <div
      className="p-4 rounded-2xl bg-gradient-to-r from-brand-mint/5 via-cream-50 to-brand-orange/5 border border-cream-100 animate-slide-up"
      style={{ animationDelay: `${idx * 80}ms` }}
    >
      <div className="flex items-center gap-3 mb-3">
        {pet?.avatar ? (
          <img src={pet.avatar} alt="" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-cream-200" />
        )}
        <div>
          <div className="font-semibold text-warm-brown">{plan.petName}</div>
          <div className="text-xs text-warm-gray">
            {plan.dailyCalories} kcal/天 · {plan.mealsPerDay}餐
          </div>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <span className="text-brand-mint-dark font-medium">推荐：</span>
          <span className="text-warm-gray">{plan.recommendedFoods.slice(0, 3).join("、")}</span>
        </div>
        <div>
          <span className="text-brand-orange-dark font-medium">禁食：</span>
          <span className="text-warm-gray">{plan.avoidFoods.slice(0, 3).join("、")}</span>
        </div>
        <div>
          <span className="text-amber-700 font-medium">营养品：</span>
          <span className="text-warm-gray">{plan.supplements.slice(0, 2).join("、")}</span>
        </div>
      </div>

      <button
        onClick={onSubmit}
        className={`w-full mt-3 py-2 rounded-xl text-xs font-medium border transition inline-flex items-center justify-center gap-1 ${
          submitted
            ? "bg-brand-mint/10 text-brand-mint-dark border-brand-mint/20"
            : "bg-white text-brand-mint-dark border-brand-mint/20 hover:bg-brand-mint/5"
        }`}
      >
        {submitted ? (
          <>
            <CheckCircle className="w-3.5 h-3.5" />
            已提交购买清单
          </>
        ) : (
          <>
            <ShoppingCart className="w-3.5 h-3.5" />
            查看完整方案并提交购买
          </>
        )}
      </button>
    </div>
  );
}
