import { useState, useMemo } from "react";
import { useAppStore } from "../store/useAppStore";
import {
  Camera,
  Upload,
  Gamepad2,
  UtensilsCrossed,
  Moon,
  Footprints,
  Bath,
  LayoutGrid,
  Sparkles,
  Heart,
  MessageCircle,
  Clock,
  Brain,
  Palette,
  MessageSquare,
  X,
  Check,
  Eye,
  Zap,
  MapPin,
  BarChart3,
  ScanEye,
} from "lucide-react";
import type { PhotoTag, Photo } from "../../shared/types";

const FILTER_TABS: { key: PhotoTag | "all"; label: string; icon: typeof Gamepad2 }[] = [
  { key: "all", label: "全部", icon: LayoutGrid },
  { key: "playing", label: "玩耍", icon: Gamepad2 },
  { key: "eating", label: "进食", icon: UtensilsCrossed },
  { key: "sleeping", label: "睡眠", icon: Moon },
  { key: "walking", label: "散步", icon: Footprints },
  { key: "bathing", label: "洗澡", icon: Bath },
];

const TAG_BG: Record<PhotoTag, string> = {
  playing: "bg-accent-sunny/20 text-amber-700",
  eating: "bg-brand-orange/15 text-brand-orange-dark",
  sleeping: "bg-accent-sky/20 text-sky-700",
  walking: "bg-brand-mint/15 text-brand-mint-dark",
  bathing: "bg-accent-pink/30 text-pink-600",
};

const TAG_LABEL: Record<PhotoTag, string> = {
  playing: "玩耍", eating: "进食", sleeping: "睡眠", walking: "散步", bathing: "洗澡",
};

const BUBBLE_TEMPLATES = [
  { id: "cloud", label: "云朵气泡", icon: "☁️", style: "rounded-[2rem] bg-white shadow-soft" },
  { id: "round", label: "圆形气泡", icon: "💬", style: "rounded-3xl bg-cream-50 shadow-soft" },
  { id: "shout", label: "呐喊气泡", icon: "📢", style: "rounded-2xl bg-accent-sunny/20 shadow-soft" },
  { id: "heart", label: "爱心气泡", icon: "❤️", style: "rounded-[2rem] bg-accent-pink/20 shadow-soft" },
];

const AI_FILTERS = [
  { id: "warm", label: "暖阳", preview: "from-amber-200/60 to-orange-100/60" },
  { id: "vivid", label: "鲜艳", preview: "from-blue-200/60 to-green-200/60" },
  { id: "soft", label: "柔焦", preview: "from-pink-100/60 to-purple-100/60" },
  { id: "natural", label: "自然", preview: "from-green-100/60 to-yellow-100/60" },
  { id: "retro", label: "复古", preview: "from-yellow-200/60 to-amber-200/60" },
  { id: "dreamy", label: "梦幻", preview: "from-indigo-100/60 to-pink-100/60" },
  { id: "fresh", label: "清新", preview: "from-teal-100/60 to-cyan-100/60" },
  { id: "pastel", label: "粉彩", preview: "from-pink-100/60 to-blue-100/60" },
];

const CARD_HEIGHTS = ["h-48", "h-64", "h-56", "h-72", "h-52", "h-60"];

export default function Album() {
  const { photos, pets, addPhoto, updatePhoto } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<PhotoTag | "all">("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [showTagEvidence, setShowTagEvidence] = useState<string | null>(null);

  const filteredPhotos = useMemo(() => {
    if (activeFilter === "all") return photos;
    return photos.filter((p) => p.autoTags.includes(activeFilter));
  }, [photos, activeFilter]);

  const getPetName = (petId: string) => pets.find((p) => p.id === petId)?.name ?? "宝贝";

  const leftCol = filteredPhotos.filter((_, i) => i % 2 === 0);
  const rightCol = filteredPhotos.filter((_, i) => i % 2 === 1);

  const handleUpload = () => {
    const id = "ph" + Date.now();
    addPhoto({
      id,
      petId: pets[0]?.id ?? "p1",
      imageUrl: "/api/ide/v1/text_to_image?prompt=cute%20pet%20adorable%20happy%20warm%20cozy%20sunny%20pastel%20fluffy&image_size=portrait_4_3",
      thumbnailUrl: "/api/ide/v1/text_to_image?prompt=cute%20pet%20adorable%20happy%20warm%20cozy%20sunny%20pastel%20fluffy&image_size=square",
      autoTags: ["playing"],
      userTags: [],
      filterApplied: null,
      bubbleTemplate: null,
      bubbleText: null,
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      tagEvidence: { playing: "AI 自动识别：检测到活跃姿态+兴奋表情，置信度85%" },
      availableFilters: ["warm", "vivid", "soft"],
    });
  };

  const handleApplyFilter = (photoId: string, filterId: string) => {
    const photo = photos.find((p) => p.id === photoId);
    if (!photo) return;
    updatePhoto({ ...photo, filterApplied: filterId });
    setEditingPhoto((prev) => prev ? { ...prev, filterApplied: filterId } : null);
  };

  const handleApplyBubble = (photoId: string, templateId: string, text: string) => {
    const photo = photos.find((p) => p.id === photoId);
    if (!photo) return;
    updatePhoto({ ...photo, bubbleTemplate: templateId, bubbleText: text });
    setEditingPhoto((prev) => prev ? { ...prev, bubbleTemplate: templateId, bubbleText: text } : null);
  };

  const renderCard = (photo: Photo, idx: number) => {
    const heightCls = CARD_HEIGHTS[idx % CARD_HEIGHTS.length];
    const isHovered = hoveredId === photo.id;
    return (
      <div
        key={photo.id}
        onClick={() => setEditingPhoto(photo)}
        className={`relative group rounded-3xl overflow-hidden mb-4 shadow-soft border border-cream-100 transition-all duration-500 cursor-pointer ${isHovered ? "scale-[1.03] shadow-hover z-10" : ""}`}
        onMouseEnter={() => setHoveredId(photo.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        <div className="relative">
          <img src={photo.imageUrl} alt="" className={`w-full ${heightCls} object-cover transition-transform duration-700 ${isHovered ? "scale-110" : ""}`} />
          {photo.filterApplied && (
            <div className={`absolute inset-0 bg-gradient-to-br ${AI_FILTERS.find(f => f.id === photo.filterApplied)?.preview ?? ""} mix-blend-overlay pointer-events-none`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-warm-brown/70 via-warm-brown/10 to-transparent opacity-80" />
        </div>

        {isHovered && (
          <div className="absolute inset-0 flex flex-col justify-end p-4 animate-fade-in">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {photo.autoTags.map((t) => (
                <button
                  key={t}
                  onClick={(e) => { e.stopPropagation(); setShowTagEvidence(showTagEvidence === `${photo.id}-${t}` ? null : `${photo.id}-${t}`); }}
                  className={`badge ${TAG_BG[t]} hover:opacity-80 transition-opacity`}
                >
                  <Brain className="w-3 h-3" />
                  {TAG_LABEL[t]}
                  <Eye className="w-2.5 h-2.5 ml-0.5" />
                </button>
              ))}
              {photo.userTags.map((t) => (
                <span key={t} className="badge bg-white/20 text-white backdrop-blur-sm"># {t}</span>
              ))}
            </div>
            {showTagEvidence && showTagEvidence.startsWith(photo.id) && photo.tagEvidence && (
              <div className="bg-white/95 backdrop-blur rounded-xl p-2.5 mb-2 text-xs text-warm-brown animate-fade-in">
                <div className="flex items-center gap-1 text-brand-mint-dark font-medium mb-1.5">
                  <Brain className="w-3 h-3" />AI 打标依据
                </div>
                {Object.entries(photo.tagEvidence).map(([tag, evidence]) => (
                  <p key={tag} className="text-warm-brown/80 mb-1">{TAG_LABEL[tag as PhotoTag]}：{evidence}</p>
                ))}
                {photo.aiReport && (
                  <div className="mt-2 pt-2 border-t border-cream-200 space-y-1">
                    <div className="flex items-center gap-2">
                      <Zap className="w-2.5 h-2.5 text-accent-sunny" />
                      <span className="text-warm-gray">置信度：</span>
                      <span className="font-semibold text-warm-brown">
                        {Math.round((photo.aiReport.tagConfidence?.[photo.autoTags[0]] ?? 0) * 100)}%
                      </span>
                      {photo.filterApplied === photo.aiReport.filterRecommendation && (
                        <>
                          <span className="w-px h-3 bg-cream-200 mx-0.5" />
                          <Palette className="w-2.5 h-2.5 text-brand-orange" />
                          <span className="text-[10px] text-brand-orange-dark">推荐滤镜已应用</span>
                        </>
                      )}
                      {photo.bubbleTemplate === photo.aiReport.bubbleTemplateSuggestion && (
                        <>
                          <span className="w-px h-3 bg-cream-200 mx-0.5" />
                          <MessageSquare className="w-2.5 h-2.5 text-brand-mint" />
                          <span className="text-[10px] text-brand-mint-dark">推荐模板已应用</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setEditingPhoto(photo); }}
                className="flex-1 py-2 rounded-xl bg-white/25 backdrop-blur text-white text-xs font-medium flex items-center justify-center gap-1 hover:bg-white/40 transition"
              >
                <Palette className="w-3.5 h-3.5" /> AI 编辑
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleApplyBubble(photo.id, photo.bubbleTemplate ?? "cloud", photo.bubbleText ?? "喵～"); }}
                className="flex-1 py-2 rounded-xl bg-white/25 backdrop-blur text-white text-xs font-medium flex items-center justify-center gap-1 hover:bg-white/40 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" /> 气泡
              </button>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between pointer-events-none">
          <div className="text-white">
            <div className="font-display text-lg drop-shadow">{getPetName(photo.petId)}</div>
            <div className="flex items-center gap-1 text-xs text-white/80">
              <Clock className="w-3 h-3" />{photo.createdAt.slice(5, 10)}
              {photo.filterApplied && <span className="ml-1">🎨 {AI_FILTERS.find(f => f.id === photo.filterApplied)?.label}</span>}
            </div>
          </div>
          <div className="flex gap-1.5 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingPhoto(photo);
              }}
              className="px-3 h-8 rounded-full bg-white/25 backdrop-blur-sm flex items-center gap-1 text-white hover:bg-white/40 transition text-xs font-medium"
            >
              <Eye className="w-3.5 h-3.5" />
              查看详情
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition"
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>

        {photo.bubbleText && !isHovered && (
          <div className="absolute top-3 left-3 right-3 bg-white/95 backdrop-blur rounded-2xl px-3 py-2 text-xs text-warm-brown shadow-sm animate-float">
            <span className="text-brand-orange">💭</span> {photo.bubbleText}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-warm-brown flex items-center gap-3">
            <span className="text-brand-orange">🐾</span> 萌宠相册
            <Sparkles className="w-6 h-6 text-accent-sunny" />
          </h1>
          <p className="text-warm-gray mt-1">记录每一个毛茸茸的温暖瞬间</p>
        </div>
        <button onClick={handleUpload} className="btn-primary">
          <Upload className="w-5 h-5" />
          <Camera className="w-5 h-5" />
          上传照片
        </button>
      </div>

      <div className="card mb-8">
        <div className="flex flex-wrap gap-2 items-center">
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeFilter === tab.key;
            const count = tab.key === "all" ? photos.length : photos.filter((p) => p.autoTags.includes(tab.key as PhotoTag)).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`chip ${active ? "chip-active" : "chip-default"}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className={`text-[10px] ml-0.5 ${active ? "text-white/70" : "text-warm-gray/60"}`}>({count})</span>
              </button>
            );
          })}
          <div className="ml-auto text-sm text-warm-gray">
            共 <span className="text-brand-orange font-semibold">{filteredPhotos.length}</span> 张
          </div>
        </div>
      </div>

      {filteredPhotos.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">📷</div>
          <div className="font-display text-xl text-warm-brown mb-2">这个分类还没有照片</div>
          <div className="text-warm-gray mb-6">快去上传第一张吧～</div>
          <button onClick={handleUpload} className="btn-secondary"><Camera className="w-5 h-5" />立即上传</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>{leftCol.map((p, i) => renderCard(p, i))}</div>
          <div>{rightCol.map((p, i) => renderCard(p, i + 1))}</div>
        </div>
      )}

      {editingPhoto && (
        <PhotoEditorModal
          photo={editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onApplyFilter={(filterId) => handleApplyFilter(editingPhoto.id, filterId)}
          onApplyBubble={(templateId, text) => handleApplyBubble(editingPhoto.id, templateId, text)}
        />
      )}
    </div>
  );
}

function PhotoEditorModal({
  photo,
  onClose,
  onApplyFilter,
  onApplyBubble,
}: {
  photo: Photo;
  onClose: () => void;
  onApplyFilter: (filterId: string) => void;
  onApplyBubble: (templateId: string, text: string) => void;
}) {
  const [editTab, setEditTab] = useState<"filter" | "bubble" | "report">("report");
  const [bubbleInput, setBubbleInput] = useState(photo.bubbleText ?? "");
  const [selectedBubble, setSelectedBubble] = useState(photo.bubbleTemplate ?? "cloud");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-brown/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-hover max-w-lg w-full mx-4 overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-cream-200">
          <h3 className="font-display text-lg text-warm-brown flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-orange" /> AI 照片编辑
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-cream-100 text-warm-gray"><X className="w-5 h-5" /></button>
        </div>

        <div className="relative">
          <img src={photo.imageUrl} alt="" className="w-full h-64 object-cover" />
          {photo.filterApplied && (
            <div className={`absolute inset-0 bg-gradient-to-br ${AI_FILTERS.find(f => f.id === photo.filterApplied)?.preview ?? ""} mix-blend-overlay`} />
          )}
          {bubbleInput && (
            <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur rounded-2xl px-3 py-2 text-sm text-warm-brown shadow-sm">
              💭 {bubbleInput}
            </div>
          )}
        </div>

        {photo.tagEvidence && (
          <div className="px-4 pt-3">
            <div className="bg-brand-mint/5 rounded-xl p-3 text-xs">
              <div className="flex items-center gap-1 text-brand-mint-dark font-medium mb-1"><Brain className="w-3 h-3" />AI 自动打标结果</div>
              {Object.entries(photo.tagEvidence).map(([tag, evidence]) => (
                <p key={tag} className="text-warm-brown/80">{TAG_LABEL[tag as PhotoTag]}：{evidence}</p>
              ))}
            </div>
          </div>
        )}

        <div className="flex border-b border-cream-200">
          <button
            onClick={() => setEditTab("report")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${editTab === "report" ? "text-brand-orange border-b-2 border-brand-orange" : "text-warm-gray"}`}
          >
            <BarChart3 className="w-4 h-4" /> AI 分析报告
          </button>
          <button
            onClick={() => setEditTab("filter")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${editTab === "filter" ? "text-brand-orange border-b-2 border-brand-orange" : "text-warm-gray"}`}
          >
            <Palette className="w-4 h-4" /> AI 滤镜
          </button>
          <button
            onClick={() => setEditTab("bubble")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${editTab === "bubble" ? "text-brand-mint-dark border-b-2 border-brand-mint" : "text-warm-gray"}`}
          >
            <MessageSquare className="w-4 h-4" /> 会话气泡
          </button>
        </div>

        <div className="p-4 max-h-[380px] overflow-y-auto">
          {editTab === "report" && photo.aiReport && (
            <div className="space-y-3 text-xs">
              <div className="bg-gradient-to-br from-brand-orange/10 to-brand-mint/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-brand-orange" />
                  <span className="font-display text-sm text-warm-brown">AI 图片分析报告</span>
                  <span className="ml-auto text-[10px] text-warm-gray">{photo.aiReport.modelVersion}</span>
                </div>
                <div className="text-[10px] text-warm-gray">处理时间：{photo.aiReport.processedAt}</div>
              </div>

              <div className="space-y-2">
                <div className="font-medium text-warm-brown flex items-center gap-1">
                  <Zap className="w-3 h-3 text-accent-sunny" /> 自动标签置信度
                </div>
                {photo.autoTags.map((tag) => {
                  const conf = photo.aiReport?.tagConfidence?.[tag] ?? 0;
                  return (
                    <div key={tag} className="flex items-center gap-2">
                      <span className="w-16 text-warm-gray">{TAG_LABEL[tag]}</span>
                      <div className="flex-1 h-2 bg-cream-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            conf > 0.85 ? "bg-gradient-to-r from-brand-mint to-brand-mint-light" :
                              conf > 0.7 ? "bg-gradient-to-r from-brand-orange to-brand-mint" :
                                "bg-gradient-to-r from-amber-400 to-brand-orange"
                          }`}
                          style={{ width: `${conf * 100}%` }}
                        />
                      </div>
                      <span className="font-mono font-semibold text-warm-brown w-10 text-right">{Math.round(conf * 100)}%</span>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-cream-50 rounded-xl p-2.5">
                  <div className="text-warm-gray mb-1 text-[10px] flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> 场景检测
                  </div>
                  <div className="text-warm-brown font-medium text-xs">{photo.aiReport.sceneDetection}</div>
                </div>
                <div className="bg-cream-50 rounded-xl p-2.5">
                  <div className="text-warm-gray mb-1 text-[10px] flex items-center gap-1">
                    <Heart className="w-2.5 h-2.5" /> 情绪检测
                  </div>
                  <div className="text-warm-brown font-medium text-xs">{photo.aiReport.emotionDetection}</div>
                </div>
              </div>

              <div className="bg-cream-50 rounded-xl p-2.5">
                <div className="text-warm-gray mb-1 text-[10px] flex items-center gap-1">
                  <ScanEye className="w-2.5 h-2.5" /> 物体检测
                </div>
                <div className="flex flex-wrap gap-1">
                  {photo.aiReport.detectionObjects.map((obj, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white border border-cream-200 text-warm-brown">
                      {obj}
                    </span>
                  ))}
                </div>
              </div>

              {photo.tagEvidence && (
                <div className="bg-brand-mint/5 rounded-xl p-2.5">
                  <div className="text-warm-gray mb-1 text-[10px] flex items-center gap-1">
                    <Brain className="w-2.5 h-2.5 text-brand-mint" /> 打标依据
                  </div>
                  {Object.entries(photo.tagEvidence).map(([tag, evidence]) => (
                    <p key={tag} className="text-warm-brown/80 text-xs">{TAG_LABEL[tag as PhotoTag]}：{evidence}</p>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <div className="bg-gradient-to-r from-brand-orange/5 to-accent-sunny/10 rounded-xl p-2.5">
                  <div className="font-medium text-warm-brown text-xs mb-1 flex items-center gap-1">
                    <Palette className="w-3 h-3 text-brand-orange" /> 滤镜推荐
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-brand-orange/15 text-brand-orange-dark px-2 py-0.5 rounded-full font-medium">
                      {AI_FILTERS.find(f => f.id === photo.aiReport?.filterRecommendation)?.label}
                    </span>
                    {photo.filterApplied === photo.aiReport?.filterRecommendation && (
                      <span className="text-[10px] text-brand-mint-dark flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> 已应用
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-warm-gray">{photo.aiReport.filterReason}</p>
                </div>

                <div className="bg-gradient-to-r from-brand-mint/5 to-accent-sky/10 rounded-xl p-2.5">
                  <div className="font-medium text-warm-brown text-xs mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-brand-mint" /> 气泡模板推荐
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-brand-mint/15 text-brand-mint-dark px-2 py-0.5 rounded-full font-medium">
                      {BUBBLE_TEMPLATES.find(t => t.id === photo.aiReport?.bubbleTemplateSuggestion)?.icon}
                      &nbsp;{BUBBLE_TEMPLATES.find(t => t.id === photo.aiReport?.bubbleTemplateSuggestion)?.label}
                    </span>
                    {photo.bubbleTemplate === photo.aiReport?.bubbleTemplateSuggestion && (
                      <span className="text-[10px] text-brand-mint-dark flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> 已应用
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-warm-gray mb-1.5">{photo.aiReport.bubbleTemplateReason}</p>
                  <div className="text-xs text-warm-brown mb-0.5">💬 文案推荐："{photo.aiReport.bubbleTextSuggestion}"</div>
                  <p className="text-[10px] text-warm-gray">{photo.aiReport.bubbleTextReason}</p>
                </div>
              </div>
            </div>
          )}

          {editTab === "filter" ? (
            <div className="space-y-3">
              <p className="text-xs text-warm-gray">选择 AI 滤镜风格，点击应用到照片</p>
              <div className="grid grid-cols-4 gap-2">
                {AI_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onApplyFilter(f.id)}
                    className={`rounded-xl p-2 text-center transition-all ${
                      photo.filterApplied === f.id ? "ring-2 ring-brand-orange bg-brand-orange/5" : "hover:bg-cream-50"
                    }`}
                  >
                    <div className={`w-full h-10 rounded-lg bg-gradient-to-br ${f.preview} mb-1.5`} />
                    <span className="text-xs text-warm-brown">{f.label}</span>
                    {photo.filterApplied === f.id && <Check className="w-3 h-3 text-brand-orange mx-auto mt-0.5" />}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-warm-gray">选择气泡模板，输入文字后应用</p>
              <div className="flex gap-2">
                {BUBBLE_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedBubble(t.id)}
                    className={`flex-1 py-2 rounded-xl text-center text-xs transition-all ${
                      selectedBubble === t.id ? "bg-brand-mint/10 border border-brand-mint/30 text-brand-mint-dark" : "bg-cream-50 text-warm-gray hover:bg-cream-100"
                    }`}
                  >
                    <span className="text-lg">{t.icon}</span>
                    <div className="mt-0.5">{t.label}</div>
                  </button>
                ))}
              </div>
              <input
                value={bubbleInput}
                onChange={(e) => setBubbleInput(e.target.value)}
                placeholder="输入气泡文字..."
                className="input-base text-sm"
              />
              <button
                onClick={() => onApplyBubble(selectedBubble, bubbleInput)}
                disabled={!bubbleInput.trim()}
                className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" /> 应用气泡
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
