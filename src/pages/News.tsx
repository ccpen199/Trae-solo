import { useState } from "react";
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

function formatDate(dateStr: string, lang: "zh" | "it") {
  const date = new Date(dateStr);
  if (lang === "zh") {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

function NewsCard({ item, index }: { item: NewsItem; index: number }) {
  const { lang } = useAppStore();
  const cat = categoryMap[item.category] || categoryMap.general;

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

          <div className="flex items-center justify-between pt-3 border-t border-charcoal-500/5">
            <div className="flex gap-2">
              <span className="tag-cn !py-0.5 !px-2 !text-[10px]">ZH</span>
              <span className="tag-it !py-0.5 !px-2 !text-[10px]">IT</span>
              <span className="tag-gold !py-0.5 !px-2 !text-[10px]">
                <BilingualText zh="双语" it="Bilingue" />
              </span>
            </div>
            <button className="flex items-center gap-1 text-sm font-medium text-warm-gold-600 hover:text-cn-red-500 transition-colors group/btn">
              <BilingualText zh="阅读全文" it="Leggi tutto" />
              <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function News() {
  const { lang } = useAppStore();
  const [activeTag, setActiveTag] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNews = mockNews.filter((item) => {
    const matchesTag = activeTag === "all" || item.category === activeTag;
    const matchesSearch =
      !searchQuery ||
      item.titleZh.includes(searchQuery) ||
      item.titleIt.includes(searchQuery);
    return matchesTag && matchesSearch;
  });

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
                  <NewsCard key={item.id} item={item} index={idx} />
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
                <p className="text-sm text-charcoal-400 mb-5 leading-relaxed">
                  <BilingualText
                    zh="自动汇总本周中意双边要闻，一键生成中意双语简报，PDF格式精美排版。"
                    it="Riepilogo automatico delle notizie principali bilaterali della settimana, genera riepilogo bilingue Cina-Italia in PDF con layout elegante."
                  />
                </p>
                <button className="w-full btn-primary !py-3 group">
                  <FileDown className="w-4 h-4" />
                  <BilingualText zh="生成本周双语简报" it="Genera riepilogo settimanale" />
                </button>
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
