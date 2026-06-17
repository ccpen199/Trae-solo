import { useNavigate } from "react-router-dom";
import {
  Mic,
  Image,
  Users,
  GraduationCap,
  Heart,
  MessageCircle,
  Clock,
  ChevronRight,
  PawPrint,
  Sparkles,
  Verified,
  ThumbsUp,
  Activity,
  BarChart3,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const emotionColorMap: Record<string, { bg: string; text: string; border: string }> = {
  happy: { bg: "bg-accent-sunny/20", text: "text-amber-600", border: "border-accent-sunny/40" },
  hungry: { bg: "bg-brand-orange/15", text: "text-brand-orange-dark", border: "border-brand-orange/30" },
  playful: { bg: "bg-accent-pink/20", text: "text-pink-600", border: "border-accent-pink/40" },
  angry: { bg: "bg-red-100", text: "text-red-600", border: "border-red-200" },
  anxious: { bg: "bg-accent-sky/20", text: "text-sky-600", border: "border-accent-sky/40" },
  curious: { bg: "bg-brand-mint/15", text: "text-brand-mint-dark", border: "border-brand-mint/30" },
  sleepy: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100" },
  lonely: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, pets, analyses, posts } = useAppStore();

  const quickActions = [
    {
      id: "translate",
      label: "语音翻译",
      desc: "听听它在说什么",
      icon: Mic,
      color: "from-brand-orange to-brand-orange-light",
      shadow: "shadow-soft",
      onClick: () => navigate("/translate"),
    },
    {
      id: "album",
      label: "宠物相册",
      desc: "记录美好瞬间",
      icon: Image,
      color: "from-brand-mint to-brand-mint-light",
      shadow: "shadow-mint-soft",
      onClick: () => navigate("/album"),
    },
    {
      id: "community",
      label: "萌宠社区",
      desc: "分享与交流",
      icon: Users,
      color: "from-accent-pink to-pink-300",
      shadow: "shadow-soft",
      onClick: () => navigate("/community"),
    },
    {
      id: "training",
      label: "训练中心",
      desc: "科学训练指南",
      icon: GraduationCap,
      color: "from-accent-sky to-sky-300",
      shadow: "shadow-soft",
      onClick: () => navigate("/training"),
    },
  ];

  const todayAnalyses = analyses.slice(0, 3);
  const recommendPosts = posts.slice(0, 3);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-stagger-1">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl text-warm-brown">
            <span className="inline-block animate-float">🐾</span> 欢迎回家，{currentUser.name}
          </h1>
          <p className="mt-2 text-warm-gray text-sm lg:text-base">
            今天也要和毛孩子们度过美好的一天哦～
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-brand-orange/30 shadow-soft">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <section className="animate-stagger-1">
        <h2 className="section-title flex items-center gap-2">
          <PawPrint className="w-6 h-6 text-brand-orange" />
          我的毛孩子
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pets.map((pet, idx) => (
            <div
              key={pet.id}
              className={`card cursor-pointer group animate-stagger-${idx + 1}`}
              onClick={() => navigate(`/pets/${pet.id}`)}
            >
              <div className="flex items-start gap-5">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-cream-200 shadow-soft group-hover:border-brand-orange/40 transition-all">
                    <img src={pet.avatar} alt={pet.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-soft flex items-center justify-center border border-cream-100">
                    <span className="text-lg">{pet.species === "dog" ? "🐕" : "🐱"}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-xl text-warm-brown">{pet.name}</h3>
                    <span className="badge bg-brand-mint/10 text-brand-mint-dark border border-brand-mint/20">
                      {pet.breed}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-warm-gray">
                    <span>{pet.age}岁</span>
                    <span>{pet.gender === "male" ? "♂ 男孩" : "♀ 女孩"}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pet.personalityTags.map((tag) => (
                      <span key={tag} className="badge bg-cream-100 text-warm-brown border border-cream-200">
                        <Sparkles className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-warm-gray/50 group-hover:text-brand-orange transition-colors shrink-0 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="animate-stagger-2">
        <h2 className="section-title flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-brand-mint" />
          快捷入口
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className={`card p-5 text-left group hover:-translate-y-1 ${action.shadow} animate-stagger-${idx + 1}`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="mt-4 font-display text-lg text-warm-brown">{action.label}</h3>
                <p className="mt-1 text-sm text-warm-gray">{action.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <section className="lg:col-span-3 animate-stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title !mb-0 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-brand-orange" />
              今日翻译记录
            </h2>
            <button
              onClick={() => navigate("/translate", { state: { showHistory: true } })}
              className="text-sm text-brand-orange hover:text-brand-orange-dark font-medium flex items-center gap-1"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {todayAnalyses.map((analysis, idx) => {
              const pet = pets.find((p) => p.id === analysis.petId);
              const emotionStyle = emotionColorMap[analysis.emotion] ?? emotionColorMap.happy;
              return (
                <div
                  key={analysis.id}
                  className={`card cursor-pointer animate-stagger-${idx + 1}`}
                  onClick={() =>
                    navigate("/translate", {
                      state: { showHistory: true, focusAnalysisId: analysis.id },
                    })
                  }
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-cream-200">
                      <img src={pet?.avatar} alt={pet?.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-warm-brown">{pet?.name}</span>
                        <span className={`badge ${emotionStyle.bg} ${emotionStyle.text} border ${emotionStyle.border}`}>
                          <Heart className="w-3 h-3" />
                          {analysis.emotionLabel}
                        </span>
                        <span className="text-xs text-warm-gray/70 flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />
                          {analysis.createdAt.split(" ")[1]}
                        </span>
                      </div>
                      <p className="mt-2 text-warm-brown/90 leading-relaxed">
                        &ldquo;{analysis.semanticText}&rdquo;
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-xs text-warm-gray">
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          置信度 {Math.round(analysis.confidence * 100)}%
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          声纹 {analysis.voiceprintReport.frequency}Hz
                        </span>
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {analysis.voiceprintReport.pattern}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-warm-gray/40 shrink-0 mt-3" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-2 animate-stagger-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title !mb-0 flex items-center gap-2">
              <Users className="w-6 h-6 text-brand-mint" />
              社区推荐
            </h2>
            <button
              onClick={() => navigate("/community")}
              className="text-sm text-brand-mint-dark hover:text-brand-mint font-medium flex items-center gap-1"
            >
              进入社区
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {recommendPosts.map((post, idx) => (
              <article
                key={post.id}
                className={`card cursor-pointer animate-stagger-${idx + 1}`}
                onClick={() => navigate("/community")}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-cream-200">
                    <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-warm-brown text-sm">{post.authorName}</span>
                      {post.isVetCertified && (
                        <span className="badge bg-brand-mint/10 text-brand-mint-dark border border-brand-mint/20 text-[10px]">
                          <Verified className="w-3 h-3" />
                          兽医认证
                        </span>
                      )}
                      <span className="text-xs text-warm-gray/70 ml-auto">{post.createdAt.split(" ")[0]}</span>
                    </div>
                    <h3 className="mt-2 font-medium text-warm-brown line-clamp-2 text-sm leading-snug">
                      {post.title}
                    </h3>
                    <div className="mt-3 flex items-center gap-4 text-xs text-warm-gray">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {post.comments}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
