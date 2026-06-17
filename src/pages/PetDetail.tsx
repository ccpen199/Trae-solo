import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Syringe,
  Stethoscope,
  Heart,
  MessageCircle,
  Image,
  TrendingUp,
  Dog,
  Cat,
  Mic,
  GraduationCap,
  Sparkles,
  Clock,
  Volume2,
  Star,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const healthIconMap: Record<string, typeof Syringe> = {
  vaccination: Syringe,
  checkup: Stethoscope,
  illness: Heart,
  surgery: Heart,
};

const healthColorMap: Record<string, string> = {
  vaccination: "bg-brand-mint/15 text-brand-mint-dark",
  checkup: "bg-brand-orange/15 text-brand-orange-dark",
  illness: "bg-red-100 text-red-600",
  surgery: "bg-purple-100 text-purple-600",
};

const emotionColorMap: Record<string, string> = {
  happy: "bg-accent-sunny/20 text-yellow-700",
  hungry: "bg-brand-orange/15 text-brand-orange-dark",
  playful: "bg-brand-mint/15 text-brand-mint-dark",
  anxious: "bg-purple-100 text-purple-600",
  curious: "bg-accent-sky/30 text-sky-700",
  sleepy: "bg-accent-pink/30 text-pink-600",
  angry: "bg-red-100 text-red-600",
  lonely: "bg-blue-100 text-blue-600",
};

export default function PetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pets, analyses, photos, trainingRecords } = useAppStore();

  const pet = pets.find((p) => p.id === id);
  const petAnalyses = analyses.filter((a) => a.petId === id);
  const petPhotos = photos.filter((p) => p.petId === id);
  const petTraining = trainingRecords.filter((t) => t.petId === id);

  if (!pet) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-warm-gray">
        <Heart className="w-16 h-16 mb-4 text-brand-orange-light animate-pulse" />
        <p className="text-lg">未找到该宠物</p>
        <button
          onClick={() => navigate("/pets")}
          className="mt-4 px-5 py-2 rounded-xl bg-brand-orange text-white"
        >
          返回列表
        </button>
      </div>
    );
  }

  const trainingProgress = Math.min(
    100,
    petTraining.reduce((sum, t) => sum + t.improvement, 0)
  );

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/pets")}
        className="flex items-center gap-2 text-warm-gray hover:text-warm-brown transition-colors animate-fade-in"
      >
        <ArrowLeft className="w-4 h-4" />
        返回宠物列表
      </button>

      <div className="bg-white rounded-3xl shadow-soft overflow-hidden animate-slide-up">
        <div className="relative h-56 bg-gradient-to-br from-brand-orange/20 via-cream-100 to-brand-mint/20">
          <img
            src={pet.avatar}
            alt={pet.name}
            className="absolute bottom-0 left-8 w-40 h-40 rounded-3xl object-cover border-4 border-white shadow-hover translate-y-1/2"
          />
          <div className="absolute top-6 right-6 px-4 py-2 bg-white/90 backdrop-blur rounded-full flex items-center gap-2 shadow-soft">
            {pet.species === "dog" ? (
              <Dog className="w-4 h-4 text-brand-orange" />
            ) : (
              <Cat className="w-4 h-4 text-brand-mint" />
            )}
            <span className="text-sm font-medium text-warm-brown">
              {pet.breed}
            </span>
          </div>
        </div>

        <div className="pt-24 pb-6 px-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-display text-warm-brown flex items-center gap-3">
                {pet.name}
                <span className="text-lg">
                  {pet.gender === "male" ? "♂" : "♀"}
                </span>
              </h1>
              <p className="text-warm-gray mt-1 flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {pet.age} 岁
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-accent-sunny" />
                  加入于 {pet.createdAt}
                </span>
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {pet.personalityTags.map((tag, i) => (
                  <span
                    key={i}
                    className={`px-3 py-1 text-sm rounded-full font-medium ${
                      i % 2 === 0
                        ? "bg-brand-orange/10 text-brand-orange-dark"
                        : "bg-brand-mint/10 text-brand-mint-dark"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate("/translate", { state: { showHistory: true } })}
                className="btn-ghost !py-2"
              >
                <Mic className="w-4 h-4" />
                查看翻译详情
              </button>
              <button
                onClick={() => navigate("/album")}
                className="btn-ghost !py-2"
              >
                <Image className="w-4 h-4" />
                查看相册详情
              </button>
              <button
                onClick={() => navigate("/training")}
                className="btn-primary !py-2"
              >
                <GraduationCap className="w-4 h-4" />
                提交训练记录
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl shadow-soft p-6 animate-stagger-1">
          <h2 className="text-xl font-display text-warm-brown flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-2xl bg-brand-mint/15 flex items-center justify-center">
              <Heart className="w-5 h-5 text-brand-mint-dark" />
            </div>
            健康记录时间线
          </h2>
          <div className="space-y-0">
            {pet.healthRecords.length > 0 ? (
              pet.healthRecords.map((hr, idx) => {
                const Icon = healthIconMap[hr.type] || Stethoscope;
                return (
                  <div key={hr.id} className="flex gap-4 relative pb-5 last:pb-0">
                    {idx < pet.healthRecords.length - 1 && (
                      <div className="absolute left-[17px] top-[40px] bottom-0 w-0.5 bg-cream-200" />
                    )}
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 z-10 ${
                        healthColorMap[hr.type] || "bg-cream-100"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-warm-brown">
                          {hr.description}
                        </p>
                        <span className="text-xs text-warm-gray shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {hr.date}
                        </span>
                      </div>
                      <p className="text-xs text-warm-gray mt-1 capitalize">
                        {hr.type === "vaccination" && "疫苗接种"}
                        {hr.type === "checkup" && "常规体检"}
                        {hr.type === "illness" && "疾病记录"}
                        {hr.type === "surgery" && "手术记录"}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-warm-gray text-sm py-8 text-center">
                暂无健康记录
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-soft p-6 animate-stagger-2">
          <h2 className="text-xl font-display text-warm-brown flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-2xl bg-brand-orange/15 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-brand-orange-dark" />
            </div>
            翻译历史
          </h2>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {petAnalyses.length > 0 ? (
              petAnalyses.map((a, idx) => (
                <div
                  key={a.id}
                  className="p-4 rounded-2xl bg-gradient-to-r from-cream-50 to-cream-100/50 border border-cream-200/50 hover:shadow-soft transition-all"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          emotionColorMap[a.emotion] || "bg-cream-100"
                        }`}
                      >
                        {a.emotionLabel}
                      </span>
                      <span className="text-xs text-warm-gray flex items-center gap-1">
                        <Volume2 className="w-3 h-3" />
                        {(a.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <span className="text-xs text-warm-gray">{a.createdAt}</span>
                  </div>
                  <p className="text-sm text-warm-brown leading-relaxed">
                    "{a.semanticText}"
                  </p>
                </div>
              ))
            ) : (
              <p className="text-warm-gray text-sm py-8 text-center">
                暂无翻译记录
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-soft p-6 animate-stagger-3">
          <h2 className="text-xl font-display text-warm-brown flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-2xl bg-accent-sky/20 flex items-center justify-center">
              <Image className="w-5 h-5 text-sky-600" />
            </div>
            关联照片
            <span className="ml-auto text-sm font-normal text-warm-gray">
              {petPhotos.length} 张
            </span>
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {petPhotos.length > 0 ? (
              petPhotos.slice(0, 6).map((p, idx) => (
                <div
                  key={p.id}
                  className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer hover:ring-2 hover:ring-brand-orange/50 transition-all"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <img
                    src={p.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {p.bubbleText && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <p className="text-white text-xs line-clamp-2">
                        {p.bubbleText}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-3 py-8 text-center text-warm-gray text-sm">
                暂无照片
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-soft p-6 animate-stagger-4">
          <h2 className="text-xl font-display text-warm-brown flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-2xl bg-accent-sunny/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-yellow-700" />
            </div>
            训练进度
          </h2>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-warm-brown">
                  总体训练进度
                </span>
                <span className="text-sm text-brand-orange-dark font-semibold flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  {trainingProgress} 分
                </span>
              </div>
              <div className="h-3 bg-cream-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-orange to-brand-mint rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(trainingProgress, 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {petTraining.length > 0 ? (
                petTraining.slice(0, 4).map((t, idx) => {
                  const pct = Math.min(100, 30 + t.improvement * 2);
                  return (
                    <div key={t.id} style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-warm-brown">
                          {t.trainingType}
                        </span>
                        <span className="text-xs text-warm-gray">
                          +{t.improvement}
                        </span>
                      </div>
                      <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${pct}%`,
                            background:
                              idx % 2 === 0
                                ? "linear-gradient(to right, #FF8A5B, #FFB08A)"
                                : "linear-gradient(to right, #4ECDC4, #7EDDD6)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-warm-gray text-sm py-4 text-center">
                  暂无训练记录
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
