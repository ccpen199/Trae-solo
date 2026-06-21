import { useState, useMemo } from "react";
import {
  Search,
  TrendingUp,
  FileDown,
  Mail,
  Clock,
  Eye,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  ChevronDown,
  X,
  Send,
  Check,
} from "lucide-react";
import { useAppStore } from "@/store";
import { mockNews } from "@/data/mock";
import BilingualText from "@/components/BilingualText";
import { cn } from "@/lib/utils";
import type { NewsItem } from "@/types";

const hotTopics = [
  { id: "t1", rank: 1, zh: "中意经贸合作备忘录", it: "Memorandum cooperazione economica", heat: 12580 },
  { id: "t2", rank: 2, zh: "米兰理工联合AI研究", it: "Ricerca IA Polimi-Tsinghua", heat: 8940 },
  { id: "t3", rank: 3, zh: "威尼斯狂欢节上海展", it: "Carnevale di Venezia a Shanghai", heat: 7890 },
  { id: "t4", rank: 4, zh: "远程医疗协作平台", it: "Piattaforma telemedicina", heat: 6780 },
  { id: "t5", rank: 5, zh: "博洛尼亚大学中文课程", it: "Corsi cinese Università di Bologna", heat: 5620 },
];

const categoryMap: Record<string, { zh: string; it: string; className: string }> = {
  economic: { zh: "经贸", it: "Economia", className: "tag-cn" },
  technology: { zh: "科技", it: "Tecnologia", className: "tag-it" },
  education: { zh: "教育", it: "Educazione", className: "tag-gold" },
  tourism: { zh: "文旅", it: "Turismo", className: "tag-it" },
  general: { zh: "综合", it: "Generale", className: "tag-cn" },
};

const topicTags = [
  { id: "all", zh: "全部", it: "Tutti" },
  { id: "economic", zh: "经贸合作", it: "Cooperazione" },
  { id: "technology", zh: "科技创新", it: "Tecnologia" },
  { id: "education", zh: "教育交流", it: "Educazione" },
  { id: "tourism", zh: "文化旅游", it: "Turismo" },
  { id: "general", zh: "综合资讯", it: "Generale" },
];

type SourceType = "diplomatic" | "media" | "cultural" | "other";

const sourceTypeConfig: Record<SourceType, { icon: string; labelZh: string; labelIt: string; colorClass: string }> = {
  diplomatic: { icon: "🏛️", labelZh: "外交", labelIt: "Diplomatico", colorClass: "bg-blue-50 text-blue-600 border-blue-200" },
  media: { icon: "📰", labelZh: "媒体", labelIt: "Media", colorClass: "bg-amber-50 text-amber-600 border-amber-200" },
  cultural: { icon: "🎭", labelZh: "文化", labelIt: "Culturale", colorClass: "bg-purple-50 text-purple-600 border-purple-200" },
  other: { icon: "📋", labelZh: "综合", labelIt: "Generale", colorClass: "bg-gray-50 text-gray-600 border-gray-200" },
};

function getSourceType(source: string): SourceType {
  if (/使馆|领馆|Ambasciata/i.test(source)) return "diplomatic";
  if (/新华社|人民日报|安莎|经济/i.test(source)) return "media";
  if (/文化|艺术|Accademia/i.test(source)) return "cultural";
  return "other";
}

const allTagOptions = [
  { id: "trade", zh: "经贸合作", it: "Cooperazione" },
  { id: "ev", zh: "新能源汽车", it: "Veicoli Elettrici" },
  { id: "bilateral", zh: "双边贸易", it: "Commercio Bilaterale" },
  { id: "heritage", zh: "文化遗产", it: "Patrimonio" },
  { id: "academic", zh: "学术交流", it: "Scambio Accademico" },
  { id: "ai", zh: "人工智能", it: "Intelligenza Artificiale" },
  { id: "medical", zh: "医疗合作", it: "Cooperazione Medica" },
  { id: "luxury", zh: "奢侈品", it: "Lusso" },
  { id: "digital", zh: "数字化转型", it: "Trasformazione Digitale" },
  { id: "legal", zh: "司法合作", it: "Cooperazione Giudiziaria" },
];

function generateTags(item: NewsItem): typeof allTagOptions {
  const tags: typeof allTagOptions = [];
  const text = `${item.titleZh} ${item.summaryZh} ${item.source}`.toLowerCase();

  if (/经贸|贸易|备忘录|合作/.test(text)) tags.push(allTagOptions[0]);
  if (/新能源|汽车|byd|nio|汽车品牌/.test(text)) tags.push(allTagOptions[1]);
  if (/双边|进出口|贸易额/.test(text)) tags.push(allTagOptions[2]);
  if (/文化|艺术|狂欢节|画展|遗产/.test(text)) tags.push(allTagOptions[3]);
  if (/学术|大学|课程|学院|教育/.test(text)) tags.push(allTagOptions[4]);
  if (/ai|人工智能|nlp|模型/.test(text)) tags.push(allTagOptions[5]);
  if (/医疗|会诊|医院/.test(text)) tags.push(allTagOptions[6]);
  if (/奢侈|lux|gucci|prada|时装/.test(text)) tags.push(allTagOptions[7]);
  if (/数字化|新零售|体验中心/.test(text)) tags.push(allTagOptions[8]);
  if (/司法|条约|引渡|法律/.test(text)) tags.push(allTagOptions[9]);

  if (tags.length === 0) tags.push(allTagOptions[0]);
  return tags.slice(0, 3);
}

function formatDate(dateStr: string, lang: "zh" | "it") {
  const date = new Date(dateStr);
  if (lang === "zh") {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

interface BriefPreview {
  titleZh: string;
  titleIt: string;
  itemCount: number;
  generatedAt: string;
  selectedTags: string[];
}

function NewsCard({
  item,
  index,
  isExpanded,
  onToggleExpand,
  activeTagFilter,
  onTagClick,
}: {
  item: NewsItem;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  activeTagFilter: string | null;
  onTagClick: (tagId: string) => void;
}) {
  const { lang } = useAppStore();
  const cat = categoryMap[item.category] || categoryMap.general;
  const sourceType = getSourceType(item.source);
  const srcConfig = sourceTypeConfig[sourceType];
  const tags = generateTags(item);

  return (
    <article className="group relative pl-8 pb-8 last:pb-0">
      {index !== undefined && (
        <div className="absolute left-0 top-2 flex flex-col items-center">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-warm-gold-400 to-warm-gold-600 shadow-gold" />
          <div className="w-px flex-1 bg-gradient-to-b from-warm-gold-500/40 to-transparent mt-2" />
        </div>
      )}

      <div className="card card-hover gold-border overflow-hidden">
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={cn(cat.className, "!text-[11px]")}>
              <BilingualText zh={cat.zh} it={cat.it} />
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full border font-medium",
                srcConfig.colorClass
              )}
            >
              <span>{srcConfig.icon}</span>
              <BilingualText zh={srcConfig.labelZh} it={srcConfig.labelIt} />
            </span>
            <span className="tag tag-gold !text-[11px]">{item.source}</span>
            <span className="flex items-center gap-1 text-[11px] text-charcoal-400">
              <Clock className="w-3 h-3" />
              {formatDate(item.publishedAt, lang)}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-charcoal-400 ml-auto">
              <Eye className="w-3 h-3" />
              {item.views.toLocaleString()}
            </span>
          </div>

          <div className="mb-3">
            <h3 className="font-display-zh font-semibold text-xl text-charcoal-500 group-hover:text-cn-red-500 transition-colors duration-300 leading-snug">
              {item.titleZh}
            </h3>
            <p className="font-display-it text-base text-charcoal-400 mt-1 italic leading-snug">
              {item.titleIt}
            </p>
          </div>

          <div className="space-y-2 mb-4">
            <p className="text-sm text-charcoal-500 leading-relaxed">
              {item.summaryZh}
            </p>
            <p className="text-sm text-charcoal-400 leading-relaxed italic">
              {item.summaryIt}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick(tag.id);
                }}
                className={cn(
                  "px-2.5 py-0.5 text-[11px] rounded-full transition-all border",
                  activeTagFilter === tag.id
                    ? "bg-cn-red-500 text-white border-cn-red-500"
                    : "bg-ivory-50 text-charcoal-500 border-charcoal-200 hover:bg-cn-red-50 hover:text-cn-red-500 hover:border-cn-red-200"
                )}
              >
                <BilingualText zh={tag.zh} it={tag.it} />
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-charcoal-500/5">
            <div className="flex gap-2">
              <span className="tag-cn !py-0.5 !px-2 !text-[10px]">ZH</span>
              <span className="tag-it !py-0.5 !px-2 !text-[10px]">IT</span>
              <span className="tag-gold !py-0.5 !px-2 !text-[10px]">
                <BilingualText zh="双语" it="Bilingue" />
              </span>
            </div>
            <button
              onClick={onToggleExpand}
              className="flex items-center gap-1 text-sm font-medium text-warm-gold-600 hover:text-cn-red-500 transition-colors group/btn"
            >
              <BilingualText zh={isExpanded ? "收起详情" : "阅读全文"} it={isExpanded ? "Chiudi" : "Leggi tutto"} />
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              )}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="px-6 pb-6 border-t border-charcoal-500/5 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="tag-cn !py-0.5 !px-2 !text-[10px]">中文</span>
                  <span className="text-sm font-medium text-charcoal-600">
                    <BilingualText zh="中文详情" it="Dettagli in Cinese" />
                  </span>
                </div>
                <p className="text-sm text-charcoal-500 leading-relaxed whitespace-pre-wrap">
                  {item.contentZh}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="tag-it !py-0.5 !px-2 !text-[10px]">IT</span>
                  <span className="text-sm font-medium text-charcoal-600">
                    <BilingualText zh="意大利语详情" it="Dettagli in Italiano" />
                  </span>
                </div>
                <p className="text-sm text-charcoal-400 leading-relaxed italic whitespace-pre-wrap">
                  {item.contentIt}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default function News() {
  const { lang } = useAppStore();
  const [activeTag, setActiveTag] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  const [briefType, setBriefType] = useState<"daily" | "weekly">("weekly");
  const [briefSelectedTags, setBriefSelectedTags] = useState<string[]>([]);
  const [briefPreview, setBriefPreview] = useState<BriefPreview | null>(null);
  const [briefGenerating, setBriefGenerating] = useState(false);

  const toggleBriefTag = (tagId: string) => {
    setBriefSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const generateBrief = () => {
    setBriefGenerating(true);
    setTimeout(() => {
      const now = new Date();
      const dateStr = lang === "zh"
        ? `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
        : `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

      setBriefPreview({
        titleZh: briefType === "daily"
          ? `中意合作每日简报 - ${dateStr}`
          : `中意合作每周简报 - ${dateStr}`,
        titleIt: briefType === "daily"
          ? `Riepilogo Giornaliero Cooperazione Cina-Italia - ${dateStr}`
          : `Riepilogo Settimanale Cooperazione Cina-Italia - ${dateStr}`,
        itemCount: filteredNews.length,
        generatedAt: now.toLocaleString(lang === "zh" ? "zh-CN" : "it-IT"),
        selectedTags: briefSelectedTags,
      });
      setBriefGenerating(false);
    }, 1500);
  };

  const handleTagClick = (tagId: string) => {
    setActiveTagFilter((prev) => (prev === tagId ? null : tagId));
  };

  const filteredNews = useMemo(() => {
    return mockNews.filter((item) => {
      const matchesTag = activeTag === "all" || item.category === activeTag;
      const matchesSearch =
        !searchQuery ||
        item.titleZh.includes(searchQuery) ||
        item.titleIt.includes(searchQuery);

      const matchesTagFilter =
        !activeTagFilter ||
        generateTags(item).some((t) => t.id === activeTagFilter);

      return matchesTag && matchesSearch && matchesTagFilter;
    });
  }, [activeTag, searchQuery, activeTagFilter]);

  return (
    <div className="min-h-screen bg-ivory-100">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(222,41,16,0.06)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,146,70,0.06)_0%,transparent_50%)]" />

        <div className="relative container mx-auto px-4 lg:px-8 pt-28 pb-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block w-1 h-8 bg-gradient-cnit rounded-full" />
                <span className="text-sm font-medium text-warm-gold-600">
                  <BilingualText zh="中意桥资讯" it="Notizie Ponte Cina-Italia" />
                </span>
              </div>
              <h1 className="section-title !mb-0">
                <BilingualText zh="资讯聚合" it="Raccolta Notizie" />
              </h1>
              <p className="text-charcoal-400 mt-2 text-lg">
                <BilingualText
                  zh="深度洞察中意合作最新动态"
                  it="Approfondimenti sulle ultime novità della cooperazione Cina-Italia"
                />
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === "zh" ? "搜索资讯..." : "Cerca notizie..."}
                className="input-field pl-12 py-3 !bg-white/80"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-16 z-30 bg-ivory-100/80 backdrop-blur-xl border-y border-warm-gold-500/10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center gap-3 py-4 overflow-x-auto scrollbar-hide">
            {topicTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setActiveTag(tag.id)}
                className={cn(
                  "flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                  activeTag === tag.id
                    ? "bg-gradient-cnit text-white shadow-hover"
                    : "bg-white/60 text-charcoal-500 hover:bg-white border border-charcoal-500/5"
                )}
              >
                <BilingualText zh={tag.zh} it={tag.it} />
              </button>
            ))}
          </div>
          {activeTagFilter && (
            <div className="pb-3 flex items-center gap-2">
              <span className="text-xs text-charcoal-400">
                <BilingualText zh="标签筛选：" it="Filtro tag: " />
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-cn-red-50 text-cn-red-500 border border-cn-red-200">
                {(() => {
                  const tag = allTagOptions.find((t) => t.id === activeTagFilter);
                  return tag ? <BilingualText zh={tag.zh} it={tag.it} /> : null;
                })()}
                <button onClick={() => setActiveTagFilter(null)} className="ml-1 hover:text-cn-red-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="font-display-zh text-2xl font-semibold text-charcoal-500">
                <BilingualText zh="最新资讯" it="Ultime Notizie" />
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-warm-gold-500/30 to-transparent ml-4" />
              <span className="text-sm text-charcoal-400">
                {filteredNews.length}
              </span>
            </div>

            <div className="relative">
              {filteredNews.length > 0 ? (
                filteredNews.map((item, idx) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    index={idx}
                    isExpanded={expandedId === item.id}
                    onToggleExpand={() =>
                      setExpandedId((prev) => (prev === item.id ? null : item.id))
                    }
                    activeTagFilter={activeTagFilter}
                    onTagClick={handleTagClick}
                  />
                ))
              ) : (
                <div className="text-center py-16">
                  <p className="text-charcoal-400">
                    <BilingualText zh="暂无相关资讯" it="Nessuna notizia trovata" />
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-charcoal-500/5">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-cn-red-500" />
                  <h3 className="font-display-zh text-lg font-semibold text-charcoal-500">
                    <BilingualText zh="热门话题榜" it="Argomenti Trend" />
                  </h3>
                  <Sparkles className="w-4 h-4 text-warm-gold-500 ml-auto" />
                </div>
                <p className="text-xs text-charcoal-400">
                  <BilingualText zh="本周热议话题 TOP 5" it="TOP 5 argomenti della settimana" />
                </p>
              </div>
              <div className="p-4 space-y-1">
                {hotTopics.map((topic, idx) => (
                  <div
                    key={topic.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-charcoal-500/5 transition-colors cursor-pointer group"
                  >
                    <span
                      className={cn(
                        "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold",
                        idx === 0
                          ? "bg-gradient-to-br from-cn-red-500 to-cn-red-600 text-white"
                          : idx === 1
                          ? "bg-gradient-to-br from-warm-gold-500 to-warm-gold-600 text-white"
                          : idx === 2
                          ? "bg-gradient-to-br from-it-green-500 to-it-green-600 text-white"
                          : "bg-charcoal-100 text-charcoal-500"
                      )}
                    >
                      {topic.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal-500 group-hover:text-cn-red-500 transition-colors truncate">
                        {lang === "zh" ? topic.zh : topic.it}
                      </p>
                      <p className="text-xs text-charcoal-400">
                        <Eye className="w-3 h-3 inline mr-1" />
                        {topic.heat.toLocaleString()}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal-300 group-hover:text-warm-gold-500 transition-colors" />
                  </div>
                ))}
              </div>
            </div>

            <div className="card overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-warm-gold-400/20 to-transparent rounded-bl-full" />
              <div className="relative p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileDown className="w-5 h-5 text-warm-gold-600" />
                  <h3 className="font-display-zh text-lg font-semibold text-charcoal-500">
                    <BilingualText zh="双语简报" it="Riepilogo Bilingue" />
                  </h3>
                </div>

                <div className="space-y-4 mb-5">
                  <div>
                    <label className="block text-xs font-medium text-charcoal-500 mb-2">
                      <BilingualText zh="简报类型" it="Tipo riepilogo" />
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setBriefType("daily")}
                        className={cn(
                          "flex-1 px-3 py-2 text-xs rounded-lg transition-all",
                          briefType === "daily"
                            ? "bg-gradient-cnit text-white"
                            : "bg-ivory-50 text-charcoal-500 border border-charcoal-100"
                        )}
                      >
                        <BilingualText zh="日报" it="Giornaliero" />
                      </button>
                      <button
                        onClick={() => setBriefType("weekly")}
                        className={cn(
                          "flex-1 px-3 py-2 text-xs rounded-lg transition-all",
                          briefType === "weekly"
                            ? "bg-gradient-cnit text-white"
                            : "bg-ivory-50 text-charcoal-500 border border-charcoal-100"
                        )}
                      >
                        <BilingualText zh="周报" it="Settimanale" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-charcoal-500 mb-2">
                      <BilingualText zh="主题范围" it="Ambito tematico" />
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {allTagOptions.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => toggleBriefTag(tag.id)}
                          className={cn(
                            "px-2 py-1 text-[11px] rounded-full transition-all border",
                            briefSelectedTags.includes(tag.id)
                              ? "bg-warm-gold-500 text-white border-warm-gold-500"
                              : "bg-ivory-50 text-charcoal-400 border-charcoal-200 hover:border-warm-gold-300"
                          )}
                        >
                          <BilingualText zh={tag.zh} it={tag.it} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={generateBrief}
                  disabled={briefGenerating}
                  className={cn(
                    "w-full btn-primary !py-3 group",
                    briefGenerating && "opacity-70 cursor-wait"
                  )}
                >
                  <FileDown className="w-4 h-4" />
                  <BilingualText
                    zh={briefGenerating ? "生成中..." : "生成简报"}
                    it={briefGenerating ? "Generazione..." : "Genera riepilogo"}
                  />
                </button>

                {briefPreview && (
                  <div className="mt-4 p-4 rounded-xl bg-ivory-50 border border-warm-gold-200">
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-charcoal-600 leading-snug">
                        {briefPreview.titleZh}
                      </h4>
                      <p className="text-xs text-charcoal-400 italic mt-0.5">
                        {briefPreview.titleIt}
                      </p>
                    </div>
                    <div className="space-y-1.5 text-xs text-charcoal-500 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-it-green-500" />
                        <span>
                          <BilingualText
                            zh={`包含 ${briefPreview.itemCount} 条资讯`}
                            it={`${briefPreview.itemCount} notizie incluse`}
                          />
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-charcoal-300" />
                        <span>
                          <BilingualText
                            zh={`生成时间：${briefPreview.generatedAt}`}
                            it={`Generato: ${briefPreview.generatedAt}`}
                          />
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-cn-red-50 text-cn-red-600 hover:bg-cn-red-100 transition-colors">
                        <FileDown className="w-3.5 h-3.5" />
                        <BilingualText zh="下载PDF" it="Scarica PDF" />
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-it-green-50 text-it-green-600 hover:bg-it-green-100 transition-colors">
                        <Send className="w-3.5 h-3.5" />
                        <BilingualText zh="发送至邮箱" it="Invia via email" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cn-red-500/5 via-transparent to-it-green-500/5" />
              <div className="relative p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-it-green-600" />
                  <h3 className="font-display-zh text-lg font-semibold text-charcoal-500">
                    <BilingualText zh="订阅资讯" it="Iscriviti" />
                  </h3>
                </div>
                <p className="text-sm text-charcoal-400 mb-4 leading-relaxed">
                  <BilingualText
                    zh="订阅我们的双语周报，第一时间获取中意合作最新动态直达您的邮箱。"
                    it="Iscriviti alla nostra newsletter settimanale bilingue per ricevere le ultime novità sulla cooperazione Cina-Italia direttamente nella tua email."
                  />
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder={lang === "zh" ? "输入邮箱地址" : "Inserisci email"}
                    className="input-field !py-2.5 text-sm"
                  />
                  <button className="w-full btn-secondary !py-2.5">
                    <BilingualText zh="立即订阅" it="Iscriviti ora" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
