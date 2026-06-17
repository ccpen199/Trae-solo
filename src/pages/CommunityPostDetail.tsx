import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  CheckCircle,
  Heart,
  MessageCircle,
  Send,
  Share2,
  ShoppingCart,
  Sparkles,
  Tag,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { CATEGORY_BADGE, CATEGORY_LABEL } from "@/data/communityConfig";
import type { PostCategory } from "../../shared/types";

export default function CommunityPostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { posts, feedingPlans } = useAppStore();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [replySubmitted, setReplySubmitted] = useState(false);
  const [purchaseSubmitted, setPurchaseSubmitted] = useState(false);

  const post = posts.find((p) => p.id === id);
  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return posts
      .filter((p) => p.id !== post.id && p.category === post.category)
      .slice(0, 3);
  }, [post, posts]);

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <div className="card">
          <MessageCircle className="w-12 h-12 text-brand-orange mx-auto mb-4" />
          <h1 className="font-display text-2xl text-warm-brown mb-2">未找到内容详情</h1>
          <p className="text-warm-gray mb-6">该社区内容可能已被删除或移动。</p>
          <button onClick={() => navigate("/community")} className="btn-primary">
            返回发现分类
          </button>
        </div>
      </div>
    );
  }

  const badge = CATEGORY_BADGE[post.category] ?? CATEGORY_BADGE.knowledge;
  const purchasePlan = feedingPlans[post.category === "question" ? 1 : 0];
  const submitPurchase = async () => {
    try {
      await fetch("/api/orders/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: purchasePlan.id,
          petName: purchasePlan.petName,
          items: [...purchasePlan.recommendedFoods.slice(0, 2), ...purchasePlan.supplements.slice(0, 1)],
        }),
      });
    } finally {
      setPurchaseSubmitted(true);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <button
        onClick={() => navigate("/community")}
        className="inline-flex items-center gap-2 text-warm-gray hover:text-warm-brown transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        返回发现分类
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <article className="lg:col-span-2 card">
          <div className="flex items-center gap-3 mb-5">
            <img src={post.authorAvatar} alt="" className="w-12 h-12 rounded-2xl object-cover border border-cream-200" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-warm-brown">{post.authorName}</span>
                {post.isVetCertified && (
                  <span className="badge bg-brand-mint/15 text-brand-mint-dark">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    兽医认证
                  </span>
                )}
                <span className={`badge ${badge.bg} ${badge.text}`}>
                  {CATEGORY_LABEL[post.category as PostCategory]}
                </span>
              </div>
              <p className="text-xs text-warm-gray mt-1">{post.createdAt}</p>
            </div>
          </div>

          <div className="mb-4">
            <span className="badge bg-cream-100 text-warm-gray mb-3">内容详情</span>
            <h1 className="font-display text-3xl text-warm-brown leading-tight">{post.title}</h1>
          </div>

          <p className="text-warm-brown/90 leading-8 whitespace-pre-line">{post.content}</p>

          <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-cream-100">
            {post.tags.map((tag) => (
              <span key={tag} className="badge bg-cream-100 text-warm-gray">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-6">
            <button
              onClick={() => setLiked((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition ${
                liked ? "bg-brand-orange/10 text-brand-orange-dark" : "text-warm-gray hover:bg-cream-100"
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-brand-orange text-brand-orange" : ""}`} />
              {post.likes + (liked ? 1 : 0)}
            </button>
            <button
              onClick={() => setBookmarked((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition ${
                bookmarked ? "bg-brand-mint/10 text-brand-mint-dark" : "text-warm-gray hover:bg-cream-100"
              }`}
            >
              <Bookmark className="w-4 h-4" />
              {bookmarked ? "已收藏" : "收藏"}
            </button>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-warm-gray hover:bg-cream-100 transition">
              <Share2 className="w-4 h-4" />
              分享
            </button>
          </div>

          <div className="mt-6 rounded-3xl bg-cream-50 border border-cream-100 p-4">
            <label className="text-sm font-medium text-warm-brown mb-2 block">提交评论</label>
            <textarea
              className="input-base min-h-[96px] resize-y"
              placeholder="写下你的经验、追问或护理记录..."
            />
            <button
              onClick={() => setReplySubmitted(true)}
              className="btn-secondary mt-3 !py-2.5"
            >
              {replySubmitted ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {replySubmitted ? "评论已提交" : "提交评论"}
            </button>
          </div>
        </article>

        <aside className="space-y-6">
          <div className="card">
            <h2 className="font-display text-lg text-warm-brown flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-brand-orange" />
              相关购买清单
            </h2>
            <p className="text-sm text-warm-gray leading-relaxed mb-4">
              基于这篇内容推荐给 {purchasePlan.petName} 的喂养补充品和避坑清单。
            </p>
            <div className="space-y-2 text-xs mb-4">
              <div>
                <span className="text-brand-mint-dark font-medium">推荐：</span>
                <span className="text-warm-gray">{purchasePlan.recommendedFoods.slice(0, 3).join("、")}</span>
              </div>
              <div>
                <span className="text-brand-orange-dark font-medium">禁食：</span>
                <span className="text-warm-gray">{purchasePlan.avoidFoods.slice(0, 3).join("、")}</span>
              </div>
            </div>
            <button
              onClick={submitPurchase}
              className="btn-primary w-full !py-2.5"
            >
              {purchaseSubmitted ? <CheckCircle className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              {purchaseSubmitted ? "购买清单已提交" : "提交购买清单"}
            </button>
          </div>

          <div className="card">
            <h2 className="font-display text-lg text-warm-brown mb-3">同类内容</h2>
            <div className="space-y-3">
              {relatedPosts.length > 0 ? relatedPosts.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/community/${item.id}`)}
                  className="w-full text-left p-3 rounded-2xl bg-cream-50 hover:bg-cream-100 transition"
                >
                  <div className="text-sm font-medium text-warm-brown line-clamp-2">{item.title}</div>
                  <div className="text-xs text-warm-gray mt-1">
                    {item.likes} 点赞 · {item.comments} 评论
                  </div>
                </button>
              )) : (
                <p className="text-sm text-warm-gray">暂无同类内容</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
