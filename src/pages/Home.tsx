import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Languages,
  Briefcase,
  Mic,
  Newspaper,
  ShieldCheck,
  User,
  ArrowRight,
  Mail,
  Sparkles,
  Building2,
  Users,
  Calendar,
  ChevronRight,
  Globe2,
  Palette,
  Send,
  Upload,
  CheckCircle2,
  FileText,
  Search,
  PlusCircle,
  GitBranch,
  Download,
  Eye,
  Bell,
  ListChecks,
  Filter,
  Fingerprint,
  Heart,
  History,
  Settings,
  Tag,
  Paperclip,
  Stethoscope,
  CreditCard,
} from "lucide-react";
import { useAppStore } from "@/store";
import { mockProjects, mockNews } from "@/data/mock";
import BilingualText from "@/components/BilingualText";
import { cn } from "@/lib/utils";
import type { ProjectCategory, ProjectStage } from "@/types";

const categoryLabels: Record<
  ProjectCategory,
  { zh: string; it: string; className: string }
> = {
  economic: { zh: "经贸合作", it: "Cooperazione Economica", className: "tag-cn" },
  education: { zh: "教育交流", it: "Scambio Educativo", className: "tag-it" },
  tourism: { zh: "文化旅游", it: "Turismo Culturale", className: "tag-gold" },
  technology: { zh: "科技创新", it: "Innovazione Tecnologica", className: "tag-cn" },
};

const generalCategoryLabels = {
  general: { zh: "综合资讯", it: "Notizie Generali", className: "tag-gold" },
};

const stageLabels: Record<ProjectStage, { zh: string; it: string; progress: number }> = {
  planning: { zh: "规划中", it: "In Pianificazione", progress: 25 },
  negotiation: { zh: "洽谈中", it: "In Negoziazione", progress: 50 },
  implementation: { zh: "实施中", it: "In Corso", progress: 75 },
  completed: { zh: "已完成", it: "Completato", progress: 100 },
};

const stageOrder: ProjectStage[] = ["planning", "negotiation", "implementation", "completed"];

const categoryColorMap: Record<ProjectCategory, string> = {
  economic: "bg-cn-red-100 text-cn-red-700 border-cn-red-200",
  education: "bg-it-green-100 text-it-green-700 border-it-green-200",
  tourism: "bg-warm-gold-100 text-warm-gold-700 border-warm-gold-200",
  technology: "bg-blue-100 text-blue-700 border-blue-200",
};

function formatDate(dateStr: string, lang: "zh" | "it") {
  const date = new Date(dateStr);
  if (lang === "zh") {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }
  return date.toLocaleDateString("it-IT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, ...options },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [options]);

  return { ref, inView };
}

type SourceType = "embassy" | "media" | "culture";

function getSourceType(source: string): SourceType {
  const cultureKeywords = ["文化", "艺术", "Cultura", "Arte"];
  const embassyKeywords = ["使领馆", "领事", "大使馆", "Ambasciata", "Consolato"];
  if (embassyKeywords.some((k) => source.includes(k))) return "embassy";
  if (cultureKeywords.some((k) => source.includes(k))) return "culture";
  return "media";
}

const sourceIconMap: Record<SourceType, { icon: string; label: { zh: string; it: string } }> = {
  embassy: { icon: "🇨🇳🇮🇹", label: { zh: "使领馆", it: "Ambasciata" } },
  media: { icon: "📰", label: { zh: "主流媒体", it: "Stampa" } },
  culture: { icon: "🎭", label: { zh: "文化机构", it: "Istituto Culturale" } },
};

const newsTagsMap: Record<string, { zh: string[]; it: string[] }> = {
  n001: { zh: ["经贸合作", "备忘录", "双边贸易"], it: ["Cooperazione", "Memorandum", "Commercio"] },
  n002: { zh: ["AI研究", "自然语言处理", "学术合作"], it: ["Ricerca IA", "NLP", "Cooperazione Accademica"] },
  n003: { zh: ["威尼斯", "狂欢节", "文化展览"], it: ["Venezia", "Carnevale", "Mostra Culturale"] },
  n004: { zh: ["远程会诊", "心血管", "医疗合作"], it: ["Telemedicina", "Cardiovascolare", "Cooperazione Medica"] },
  n005: { zh: ["商务中文", "博洛尼亚", "教育"], it: ["Cinese Commerciale", "Bologna", "Educazione"] },
  n006: { zh: ["新能源", "意大利市场", "汽车"], it: ["Nuove Energie", "Mercato Italiano", "Automobili"] },
  n007: { zh: ["当代艺术", "联合画展", "青年艺术家"], it: ["Arte Contemporanea", "Mostra Congiunta", "Giovani Artisti"] },
  n008: { zh: ["司法合作", "跨国案件", "引渡"], it: ["Cooperazione Giudiziaria", "Casi Transfrontalieri", "Estradizione"] },
  n009: { zh: ["奢侈品", "数字化", "新零售"], it: ["Lusso", "Digitale", "Nuovo Retail"] },
};

const featureActions = [
  {
    route: "/translate",
    actions: [
      { labelZh: "上传政策文件翻译", labelIt: "Carica Documento", to: "/translate?mode=document&from=home", icon: Upload },
      { labelZh: "术语校验", labelIt: "Verifica Termini", to: "/translate?mode=term-check&from=home", icon: CheckCircle2 },
      { labelZh: "申请人工润色", labelIt: "Revisione Umana", to: "/translate?mode=polish&from=home", icon: FileText },
    ],
  },
  {
    route: "/projects",
    actions: [
      { labelZh: "检索经贸项目", labelIt: "Cerca Progetti", to: "/projects?tab=search&from=home", icon: Search },
      { labelZh: "提交新项目", labelIt: "Nuovo Progetto", to: "/projects?action=new&from=home", icon: PlusCircle },
      { labelZh: "查看阶段流转", labelIt: "Fasi del Progetto", to: "/projects?tab=stages&from=home", icon: GitBranch },
    ],
  },
  {
    route: "/pocket-translator",
    actions: [
      { labelZh: "签证场景翻译", labelIt: "Traduzione Visto", to: "/pocket-translator?scene=visa&from=home", icon: CreditCard },
      { labelZh: "医疗问诊模式", labelIt: "Modalità Medica", to: "/pocket-translator?scene=medical&from=home", icon: Stethoscope },
      { labelZh: "下载离线词包", labelIt: "Scarica Offline", to: "/pocket-translator?action=download&from=home", icon: Download },
    ],
  },
  {
    route: "/news",
    actions: [
      { labelZh: "浏览多源资讯", labelIt: "Sfoglia Notizie", to: "/news?from=home", icon: Eye },
      { labelZh: "生成双语简报", labelIt: "Genera Riepilogo", to: "/news?action=briefing&from=home", icon: FileText },
      { labelZh: "订阅推送", labelIt: "Iscriviti", to: "/news?action=subscribe&from=home", icon: Bell },
    ],
  },
  {
    route: "/admin",
    actions: [
      { labelZh: "审核队列", labelIt: "Coda di Revisione", to: "/admin?tab=queue&from=home", icon: ListChecks },
      { labelZh: "敏感词过滤", labelIt: "Filtro Parole", to: "/admin?tab=filter&from=home", icon: Filter },
      { labelZh: "发布溯源", labelIt: "Tracciamento", to: "/admin?tab=trace&from=home", icon: Fingerprint },
    ],
  },
  {
    route: "/profile",
    actions: [
      { labelZh: "我的收藏", labelIt: "I Miei Preferiti", to: "/profile?tab=favorites&from=home", icon: Heart },
      { labelZh: "翻译历史", labelIt: "Cronologia", to: "/profile?tab=history&from=home", icon: History },
      { labelZh: "订阅设置", labelIt: "Impostazioni", to: "/profile?tab=subscribe&from=home", icon: Settings },
    ],
  },
];

const features = [
  {
    icon: Languages,
    zh: "智能互译",
    it: "Traduzione Intelligente",
    descZh: "专业中意双语互译，术语精准匹配",
    descIt: "Traduzione professionale bilingue italiano-cinese",
    route: "/translate",
    gradient: "from-cn-red-500 to-warm-gold-500",
    iconBg: "bg-cn-red-50",
    iconColor: "text-cn-red-500",
  },
  {
    icon: Briefcase,
    zh: "项目库",
    it: "Progetti",
    descZh: "中意合作项目资源一站式检索",
    descIt: "Ricerca completa di progetti di cooperazione",
    route: "/projects",
    gradient: "from-it-green-500 to-warm-gold-500",
    iconBg: "bg-it-green-50",
    iconColor: "text-it-green-500",
  },
  {
    icon: Mic,
    zh: "随身翻译",
    it: "Traduttore Tascabile",
    descZh: "语音实时翻译，出行沟通无忧",
    descIt: "Traduzione vocale in tempo reale in viaggio",
    route: "/pocket-translator",
    gradient: "from-warm-gold-500 to-cn-red-500",
    iconBg: "bg-warm-gold-50",
    iconColor: "text-warm-gold-600",
  },
  {
    icon: Newspaper,
    zh: "资讯聚合",
    it: "Notizie",
    descZh: "中意双语资讯，精准分类推送",
    descIt: "Notizie bilingui categorizzate con precisione",
    route: "/news",
    gradient: "from-cn-red-500 to-it-green-500",
    iconBg: "bg-cn-red-50",
    iconColor: "text-cn-red-500",
  },
  {
    icon: ShieldCheck,
    zh: "后台审核",
    it: "Revisione",
    descZh: "专业内容审核，保障信息质量",
    descIt: "Revisione professionale dei contenuti",
    route: "/admin",
    gradient: "from-it-green-500 to-cn-red-500",
    iconBg: "bg-it-green-50",
    iconColor: "text-it-green-500",
  },
  {
    icon: User,
    zh: "个人中心",
    it: "Profilo",
    descZh: "收藏、历史记录与个性化设置",
    descIt: "Preferiti, cronologia e impostazioni",
    route: "/profile",
    gradient: "from-warm-gold-500 to-it-green-500",
    iconBg: "bg-warm-gold-50",
    iconColor: "text-warm-gold-600",
  },
];

function HeroSection() {
  const lang = useAppStore((s) => s.lang);

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-pattern">
      <div className="absolute inset-0 bg-gradient-to-br from-cn-red-50/60 via-ivory-100/80 to-it-green-50/60" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-cn-red-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-it-green-200/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-warm-gold-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div
            className={cn(
              "space-y-6",
              lang === "it" && "lg:order-2",
            )}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-warm-gold-50 border border-warm-gold-500/20 animate-float">
              <Sparkles className="w-4 h-4 text-warm-gold-500" />
              <span className="text-sm text-warm-gold-700 font-medium">
                <BilingualText zh="中意文化交流平台" it="Piattaforma di Scambio Culturale" />
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-cnit">
                <BilingualText zh="架起中意之桥" it="Costruire Ponti" />
              </span>
              <br />
              <span className="font-display-zh text-charcoal-700">
                <BilingualText
                  zh="连接文明与机遇"
                  it="tra Cina e Italia"
                />
              </span>
            </h1>

            <p className="text-lg md:text-xl text-charcoal-400 leading-relaxed max-w-xl">
              <BilingualText
                zh="致力于促进中意两国在经贸、教育、文化、科技等领域的深度合作与交流，为两国企业、机构和个人搭建专业的双语服务平台。"
                it="Dedicato a promuovere la cooperazione e lo scambio profondo tra Cina e Italia nei settori economico, educativo, culturale e tecnologico."
              />
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/translate?from=home" className="btn-primary">
                <BilingualText zh="开始翻译" it="Inizia a Tradurre" />
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/projects?from=home" className="btn-secondary">
                <BilingualText zh="浏览项目库" it="Esplora Progetti" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-8 pt-8">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {["bg-cn-red-500", "bg-it-green-500", "bg-warm-gold-500"].map((c, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-10 h-10 rounded-full border-2 border-ivory-100 flex items-center justify-center text-white text-sm font-medium",
                        c,
                      )}
                    >
                      {["中", "意", "✦"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-2xl font-bold text-charcoal-600">10K+</div>
                  <div className="text-xs text-charcoal-400">
                    <BilingualText zh="活跃用户" it="Utenti Attivi" />
                  </div>
                </div>
              </div>
              <div className="h-10 w-px bg-charcoal-200" />
              <div>
                <div className="text-2xl font-bold text-charcoal-600">500+</div>
                <div className="text-xs text-charcoal-400">
                  <BilingualText zh="合作项目" it="Progetti" />
                </div>
              </div>
              <div className="h-10 w-px bg-charcoal-200" />
              <div>
                <div className="text-2xl font-bold text-charcoal-600">98%</div>
                <div className="text-xs text-charcoal-400">
                  <BilingualText zh="翻译准确率" it="Precisione" />
                </div>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "relative hidden lg:block",
              lang === "it" && "lg:order-1",
            )}
          >
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 bg-gradient-cnit rounded-[3rem] rotate-6 opacity-10 animate-float" style={{ animationDelay: "0.5s" }} />
              <div className="absolute inset-0 bg-gradient-cnit rounded-[3rem] -rotate-3 opacity-20" />
              <div className="absolute inset-4 bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-hover overflow-hidden">
                <div className="absolute inset-0 bg-pattern" />
                <div className="relative h-full flex flex-col items-center justify-center p-8">
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-cnit shadow-gold animate-float">
                      <Globe2 className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-display-it font-semibold text-charcoal-700">
                      Costruire Ponti
                    </h2>
                    <h3 className="text-2xl font-display-zh font-semibold text-charcoal-600">
                      tra Cina e Italia
                    </h3>
                    <div className="flex items-center justify-center gap-3 pt-4">
                      <div className="h-12 w-8 rounded border-2 border-cn-red-500 bg-cn-red-50">
                        <div className="h-full w-full bg-[repeating-linear-gradient(90deg,#DE2910_0px,#DE2910_2px,transparent_2px,transparent_4px)] opacity-30" />
                      </div>
                      <Palette className="w-6 h-6 text-warm-gold-500" />
                      <div className="h-12 w-8 rounded border-2 border-it-green-500 flex flex-col">
                        <div className="flex-1 bg-it-green-500" />
                        <div className="flex-1 bg-white" />
                        <div className="flex-1 bg-cn-red-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronRight className="w-6 h-6 text-warm-gold-500 rotate-90" />
      </div>
    </section>
  );
}

function FeaturesSection() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const lang = useAppStore((s) => s.lang);

  return (
    <section ref={ref} className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className={cn("text-center mb-16 transition-all duration-700", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-it-green-50 border border-it-green-500/20 mb-4">
            <Briefcase className="w-4 h-4 text-it-green-500" />
            <span className="text-sm text-it-green-700 font-medium">
              <BilingualText zh="核心功能" it="Funzionalità" />
            </span>
          </div>
          <h2 className="section-title">
            <BilingualText zh="一站式中意服务平台" it="Piattaforma Unica di Servizi" />
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            <BilingualText
              zh="为您提供专业、便捷、高效的中意双语交流服务"
              it="Servizi professionali, convenienti ed efficienti per la comunicazione bilingue"
            />
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const actions = featureActions.find((fa) => fa.route === feature.route)?.actions ?? [];
            return (
              <div
                key={feature.route}
                className={cn(
                  "group relative card p-8 overflow-hidden",
                  "transition-all duration-700",
                  inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
                )}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500",
                    feature.gradient,
                  )}
                />
                <div className={cn("relative w-14 h-14 rounded-xl flex items-center justify-center mb-5", feature.iconBg)}>
                  <Icon className={cn("w-7 h-7 transition-transform duration-300 group-hover:scale-110", feature.iconColor)} />
                </div>
                <h3 className="text-xl font-semibold text-charcoal-600 mb-2 group-hover:text-cn-red-500 transition-colors">
                  {feature.zh}
                </h3>
                <p className="text-sm text-it-green-600 font-medium mb-3">{feature.it}</p>
                <p className="text-charcoal-400 text-sm leading-relaxed mb-5">
                  <BilingualText zh={feature.descZh} it={feature.descIt} />
                </p>
                <div className="flex flex-col gap-2 mt-auto">
                  {actions.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <Link
                        key={action.to}
                        to={action.to}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium",
                          "bg-charcoal-50 hover:bg-charcoal-100 text-charcoal-600",
                          "transition-all duration-200 hover:translate-x-0.5",
                          "group/btn",
                        )}
                      >
                        <ActionIcon className="w-4 h-4 text-charcoal-400 group-hover/btn:text-cn-red-500 transition-colors" />
                        <BilingualText zh={action.labelZh} it={action.labelIt} />
                        <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover/btn:opacity-100 transition-opacity text-charcoal-300" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StageIndicator({ stage }: { stage: ProjectStage }) {
  const lang = useAppStore((s) => s.lang);
  const currentIndex = stageOrder.indexOf(stage);

  return (
    <div className="flex items-center gap-0.5">
      {stageOrder.map((s, i) => {
        const label = stageLabels[s];
        const isReached = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                "flex flex-col items-center",
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                  isReached
                    ? isCurrent
                      ? "bg-cn-red-500 text-white ring-2 ring-cn-red-200"
                      : "bg-it-green-500 text-white"
                    : "bg-charcoal-100 text-charcoal-400",
                )}
              >
                {isReached ? "✓" : i + 1}
              </div>
              <span
                className={cn(
                  "text-[10px] mt-0.5 whitespace-nowrap",
                  isCurrent ? "text-cn-red-600 font-semibold" : "text-charcoal-400",
                )}
              >
                {lang === "zh" ? label.zh : label.it}
              </span>
            </div>
            {i < stageOrder.length - 1 && (
              <div
                className={cn(
                  "w-4 h-0.5 mb-3",
                  i < currentIndex ? "bg-it-green-500" : "bg-charcoal-200",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProjectsSection() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const lang = useAppStore((s) => s.lang);
  const projects = mockProjects.slice(0, 3);

  return (
    <section ref={ref} className="py-24 relative bg-gradient-to-b from-ivory-100 via-white to-ivory-100">
      <div className="container mx-auto px-4">
        <div className={cn("flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-4 transition-all duration-700", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cn-red-50 border border-cn-red-500/20 mb-4">
              <Building2 className="w-4 h-4 text-cn-red-500" />
              <span className="text-sm text-cn-red-700 font-medium">
                <BilingualText zh="精选合作" it="Collaborazioni" />
              </span>
            </div>
            <h2 className="section-title">
              <BilingualText zh="精选合作项目" it="Progetti Selezionati" />
            </h2>
            <p className="section-subtitle mb-0">
              <BilingualText
                zh="发现中意两国最新合作动态与机会"
                it="Scopri le ultime opportunità di cooperazione"
              />
            </p>
          </div>
          <Link to="/projects?from=home" className="btn-ghost self-start">
            <BilingualText zh="查看全部项目" it="Vedi tutti i progetti" />
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => {
            const cat = categoryLabels[project.category];
            const catColor = categoryColorMap[project.category];
            const primaryContact = project.partners[0];

            return (
              <div
                key={project.id}
                className={cn(
                  "group card p-6 flex flex-col",
                  "transition-all duration-700",
                  inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
                )}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", catColor)}>
                      {lang === "zh" ? cat.zh : cat.it}
                    </span>
                    {project.attachments.length > 0 && (
                      <span className="relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-charcoal-50 text-xs text-charcoal-500">
                        <Paperclip className="w-3 h-3" />
                        {project.attachments.length}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-charcoal-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(project.createdAt, lang)}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-charcoal-600 mb-2 group-hover:text-cn-red-500 transition-colors line-clamp-2">
                  {lang === "zh" ? project.titleZh : project.titleIt}
                </h3>

                <p className="text-sm text-charcoal-400 mb-4 line-clamp-2 leading-relaxed">
                  {lang === "zh" ? project.descriptionZh : project.descriptionIt}
                </p>

                <div className="mb-4">
                  <StageIndicator stage={project.stage} />
                </div>

                {primaryContact && (
                  <div className="mb-4 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-cnit flex items-center justify-center text-white text-xs font-medium">
                      {(lang === "zh" ? primaryContact.nameZh : primaryContact.nameIt).charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-charcoal-600 truncate">
                        {lang === "zh" ? primaryContact.nameZh : primaryContact.nameIt}
                      </div>
                      <div className="text-[10px] text-charcoal-400 truncate">{primaryContact.email}</div>
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-charcoal-500/5">
                  <Link
                    to={`/projects/${project.id}?from=home`}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium bg-charcoal-50 hover:bg-cn-red-50 text-charcoal-500 hover:text-cn-red-600 transition-all duration-200"
                  >
                    <BilingualText zh="进入项目详情" it="Dettagli del Progetto" />
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className={cn("mt-10 transition-all duration-700 delay-500", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <p className="text-sm text-charcoal-400 text-center mb-4">
            <BilingualText zh="按分类浏览" it="Sfoglia per Categoria" />
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {Object.entries(categoryLabels).map(([key, label]) => {
              const colorClass = categoryColorMap[key as ProjectCategory];
              return (
                <Link
                  key={key}
                  to={`/projects?category=${key}&from=home`}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200",
                    "hover:shadow-md hover:-translate-y-0.5",
                    colorClass,
                  )}
                >
                  {lang === "zh" ? label.zh : label.it}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function NewsSection() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const lang = useAppStore((s) => s.lang);
  const news = mockNews.slice(0, 3);

  return (
    <section ref={ref} className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className={cn("flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-4 transition-all duration-700", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-warm-gold-50 border border-warm-gold-500/20 mb-4">
              <Newspaper className="w-4 h-4 text-warm-gold-600" />
              <span className="text-sm text-warm-gold-700 font-medium">
                <BilingualText zh="资讯速递" it="Notizie" />
              </span>
            </div>
            <h2 className="section-title">
              <BilingualText zh="最新资讯" it="Ultime Notizie" />
            </h2>
            <p className="section-subtitle mb-0">
              <BilingualText
                zh="紧跟中意两国交流合作的前沿动态"
                it="Resta aggiornato sulle ultime novità"
              />
            </p>
          </div>
          <Link to="/news?from=home" className="btn-ghost self-start">
            <BilingualText zh="查看更多资讯" it="Altre notizie" />
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {news.map((item, index) => {
            const catLabels = { ...categoryLabels, ...generalCategoryLabels };
            const cat =
              catLabels[item.category as keyof typeof catLabels] ||
              generalCategoryLabels.general;
            const sourceType = getSourceType(item.source);
            const sourceInfo = sourceIconMap[sourceType];
            const tags = newsTagsMap[item.id];

            return (
              <Link
                key={item.id}
                to={`/news/${item.id}?from=home`}
                className={cn(
                  "group card card-hover p-6 flex flex-col",
                  "transition-all duration-700",
                  inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
                )}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className={cat.className}>{lang === "zh" ? cat.zh : cat.it}</span>
                  <span className="text-xs text-charcoal-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.publishedAt, lang)}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-charcoal-600 mb-3 group-hover:text-cn-red-500 transition-colors line-clamp-2 leading-snug">
                  {lang === "zh" ? item.titleZh : item.titleIt}
                </h3>

                <p className="text-sm text-charcoal-400 mb-4 line-clamp-3 leading-relaxed flex-1">
                  {lang === "zh" ? item.summaryZh : item.summaryIt}
                </p>

                {tags && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(lang === "zh" ? tags.zh : tags.it).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-charcoal-50 text-[11px] text-charcoal-500"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-charcoal-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-base leading-none">{sourceInfo.icon}</span>
                    <span className="text-charcoal-400">{lang === "zh" ? sourceInfo.label.zh : sourceInfo.label.it}</span>
                    <span className="text-charcoal-300">·</span>
                    <span className="text-charcoal-400">{item.source}</span>
                  </div>
                  <div className="flex items-center gap-1 text-warm-gold-600 opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <span className="text-xs font-medium">
                      <BilingualText zh="阅读" it="Leggi" />
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className={cn("mt-10 transition-all duration-700 delay-500", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/news?action=briefing&from=home"
              className="btn-primary"
            >
              <Sparkles className="w-4 h-4" />
              <BilingualText zh="生成本周双语简报" it="Genera Riepilogo Settimanale" />
            </Link>
            <div className="card px-5 py-3 flex items-center gap-3 max-w-sm">
              <div className="w-9 h-9 rounded-lg bg-warm-gold-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-warm-gold-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-charcoal-600 truncate">
                  <BilingualText zh="中意经贸文化周报 · 第24期" it="Riepilogo Settimanale Cina-Italia · N.24" />
                </p>
                <p className="text-[11px] text-charcoal-400">
                  <BilingualText zh="2026年6月14日" it="14 Giugno 2026" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NewsletterSection() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setEmail("");
      }, 3000);
    }
  };

  return (
    <section ref={ref} className="py-24 relative">
      <div className="container mx-auto px-4">
        <div
          className={cn(
            "relative max-w-3xl mx-auto rounded-2xl p-8 md:p-12 transition-all duration-700",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
          )}
        >
          <div className="absolute inset-0 bg-gradient-cnit rounded-2xl p-[2px]">
            <div className="h-full w-full rounded-[14px] bg-ivory-100" />
          </div>
          <div className="absolute inset-0 bg-pattern rounded-2xl" />

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-gold shadow-gold mb-6">
              <Mail className="w-7 h-7 text-white" />
            </div>

            <h2 className="section-title mb-3">
              <BilingualText zh="订阅中意双语简报" it="Iscriviti alla Newsletter" />
            </h2>
            <p className="section-subtitle max-w-xl mx-auto">
              <BilingualText
                zh="每周获取中意两国经贸、文化、教育领域的精选资讯，直达您的邮箱。"
                it="Ricevi settimanalmente notizie selezionate su economia, cultura e istruzione Cina-Italia."
              />
            </p>

            <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-300" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      useAppStore.getState().lang === "zh"
                        ? "请输入您的邮箱地址"
                        : "Inserisci la tua email"
                    }
                    required
                    className="input-field pl-11"
                  />
                </div>
                <button type="submit" className="btn-primary whitespace-nowrap">
                  {submitted ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <BilingualText zh="订阅成功" it="Iscritto!" />
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <BilingualText zh="立即订阅" it="Iscriviti" />
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-charcoal-400 mt-4">
                <BilingualText
                  zh="我们尊重您的隐私，随时可以取消订阅。"
                  it="Rispettiamo la tua privacy, puoi annullare l'iscrizione in qualsiasi momento."
                />
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function CultureSection() {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section ref={ref} className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-cn-red-50/50 via-warm-gold-50/30 to-it-green-50/50" />

      <div className="container mx-auto px-4 relative">
        <div className={cn("text-center transition-all duration-700", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <div className="flex items-center justify-center gap-6 md:gap-12 mb-8">
            <div className="text-center">
              <div className="text-6xl md:text-7xl font-display-zh font-bold text-cn-red-500 animate-float">
                意
              </div>
              <div className="text-sm text-charcoal-400 mt-1">
                <BilingualText zh="东方神韵" it="Oriente" />
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative w-24 h-12 md:w-32 md:h-16">
                <div className="absolute inset-0 bg-gradient-cnit rounded-full opacity-20 animate-pulse-slow" />
                <div className="absolute inset-2 md:inset-3 bg-gradient-cnit rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
              <div className="h-16 w-px bg-gradient-to-b from-transparent via-warm-gold-500/40 to-transparent" />
            </div>

            <div className="text-center">
              <div className="text-6xl md:text-7xl font-display-it font-bold text-it-green-500 animate-float" style={{ animationDelay: "1s" }}>
                It
              </div>
              <div className="text-sm text-charcoal-400 mt-1">
                <BilingualText zh="西方风华" it="Occidente" />
              </div>
            </div>
          </div>

          <div className="divider-gold max-w-md mx-auto mb-6" />

          <blockquote className="max-w-2xl mx-auto">
            <p className="text-xl md:text-2xl font-display-zh font-display-it text-charcoal-600 leading-relaxed">
              <BilingualText
                zh="「文明因交流而多彩，文明因互鉴而丰富」"
                it="«Le civiltà sono colorate dallo scambio e arricchite dal reciproco apprendimento»"
              />
            </p>
          </blockquote>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <ProjectsSection />
      <NewsSection />
      <NewsletterSection />
      <CultureSection />
    </div>
  );
}
