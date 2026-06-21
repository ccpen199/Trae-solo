import { useState } from "react";
import {
  ShieldCheck,
  History,
  AlertTriangle,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  FileText,
  Newspaper,
  Languages,
  Search,
  Filter,
  ChevronDown,
  X,
  Send,
  TrendingUp,
  Ban,
  Activity,
  UserCheck,
} from "lucide-react";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

type TabType = "reviews" | "trace" | "sensitive" | "users";
type ReviewStatus = "pending" | "approved" | "rejected";
type ContentType = "project" | "news" | "translation";

interface ReviewItem {
  id: string;
  contentType: ContentType;
  titleZh: string;
  titleIt: string;
  submittedBy: string;
  submittedAt: string;
  sensitiveWords: string[];
  status: ReviewStatus;
  contentZh: string;
  contentIt: string;
}

interface LogEntry {
  id: string;
  action: string;
  user: string;
  target: string;
  time: string;
  result: "approved" | "rejected";
}

const mockReviews: ReviewItem[] = [
  {
    id: "rev_001",
    contentType: "project",
    titleZh: "中意新能源汽车产业合作框架",
    titleIt: "Quadro di Cooperazione Industriale Auto NEV Cina-Italia",
    submittedBy: "意大利经济发展部",
    submittedAt: "2026-06-20 14:32",
    sensitiveWords: ["技术转让"],
    status: "pending",
    contentZh:
      "为促进两国在新能源汽车领域的深度合作，双方同意建立联合研发中心，并探讨技术转让相关机制。敏感内容需审核...",
    contentIt:
      "Per promuovere la cooperazione approfondita nel settore delle autovetture a nuova energia, le parti accettano di stabilire un centro di ricerca congiunto ed esplorare i meccanismi correlati al trasferimento tecnologico...",
  },
  {
    id: "rev_002",
    contentType: "news",
    titleZh: "两国签署文化遗产保护合作备忘录",
    titleIt: "Firmato Memo di Cooperazione sulla Tutela del Patrimonio Culturale",
    submittedBy: "新华社",
    submittedAt: "2026-06-20 10:15",
    sensitiveWords: [],
    status: "pending",
    contentZh: "中国与意大利两国政府在罗马正式签署文化遗产保护合作备忘录，未来五年将在修复技术、人才培养等领域开展合作。",
    contentIt:
      "I governi di Cina e Italia hanno ufficialmente firmato un memorandum di cooperazione sulla tutela del patrimonio culturale a Roma.",
  },
  {
    id: "rev_003",
    contentType: "translation",
    titleZh: "外交照会翻译（编号：2026-DIP-087）",
    titleIt: "Traduzione Nota Diplomatica (N.: 2026-DIP-087)",
    submittedBy: "翻译员 - 李雯",
    submittedAt: "2026-06-19 18:45",
    sensitiveWords: ["主权"],
    status: "pending",
    contentZh:
      "关于双方在相互尊重主权和领土完整原则基础上，进一步深化双边关系的照会内容。敏感表述需核验...",
    contentIt:
      "Nota sul rafforzamento delle relazioni bilaterali basata sul principio del rispetto reciproco della sovranità e dell'integrità territoriale...",
  },
  {
    id: "rev_004",
    contentType: "news",
    titleZh: "米兰时装周与中国设计师协会达成合作",
    titleIt: "Milano Moda Collabora con Associazione Stilisti Cinesi",
    submittedBy: "安莎社",
    submittedAt: "2026-06-19 11:20",
    sensitiveWords: [],
    status: "approved",
    contentZh: "米兰时装周组委会与中国服装设计师协会宣布将在人才交流、品牌推广等方面展开长期合作。",
    contentIt:
      "La Commissione di Settimana della Moda di Milano e l'Associazione degli Stilisti Cinesi hanno annunciato una cooperazione a lungo termine.",
  },
  {
    id: "rev_005",
    contentType: "project",
    titleZh: "地中海邮轮旅游联合推广计划",
    titleIt: "Piano Promozionale Congiunto Crociere nel Mediterraneo",
    submittedBy: "携程集团",
    submittedAt: "2026-06-18 16:00",
    sensitiveWords: [],
    status: "approved",
    contentZh: "联合推广地中海沿线邮轮旅游产品，针对中国市场定制特色航线。",
    contentIt: "Promozione congiunta di prodotti crocieristici lungo il Mediterraneo con itinerari personalizzati per il mercato cinese.",
  },
  {
    id: "rev_006",
    contentType: "translation",
    titleZh: "投资促进局年度报告翻译",
    titleIt: "Traduzione Rapporto Annuale Agenzia Promozione Investimenti",
    submittedBy: "翻译员 - Marco",
    submittedAt: "2026-06-18 09:30",
    sensitiveWords: ["外资限制"],
    status: "rejected",
    contentZh: "翻译稿中关于外资限制条款的表述不符合官方术语规范，需重新润色后提交审核。",
    contentIt: "La formulazione delle clausole sulle restrizioni agli investimenti stranieri non è conforme alla terminologia ufficiale.",
  },
  {
    id: "rev_007",
    contentType: "project",
    titleZh: "博洛尼亚大学与北京大学学生交换协议",
    titleIt: "Accordo Scambio Studenti Università di Bologna - Università di Pechino",
    submittedBy: "博洛尼亚大学国际处",
    submittedAt: "2026-06-17 13:10",
    sensitiveWords: [],
    status: "approved",
    contentZh: "两校签署学生交换协议，每年互派 50 名学生，涵盖人文、工程、医学等多个学科。",
    contentIt:
      "I due atenei hanno firmato un accordo di scambio studentesco, scambiando 50 studenti all'anno in varie discipline.",
  },
];

const mockLogs: LogEntry[] = [
  { id: "1", action: "审核通过", user: "管理员·王", target: "米兰时装周合作资讯", time: "10:32", result: "approved" },
  { id: "2", action: "审核驳回", user: "审核员·李", target: "投资促进局翻译稿", time: "09:15", result: "rejected" },
  { id: "3", action: "审核通过", user: "管理员·王", target: "学生交换协议", time: "昨日 17:40", result: "approved" },
  { id: "4", action: "敏感词拦截", user: "System", target: "外交照会翻译", time: "昨日 15:20", result: "rejected" },
  { id: "5", action: "审核通过", user: "审核员·李", target: "地中海邮轮计划", time: "昨日 11:05", result: "approved" },
];

const sidebarItems = [
  { key: "reviews" as TabType, zh: "内容审核", it: "Revisioni Contenuti", icon: ShieldCheck },
  { key: "trace" as TabType, zh: "发布溯源", it: "Tracciabilità", icon: History },
  { key: "sensitive" as TabType, zh: "敏感词管理", it: "Parole Sensibili", icon: AlertTriangle },
  { key: "users" as TabType, zh: "用户管理", it: "Gestione Utenti", icon: Users },
];

const contentTypeMap: Record<ContentType, { zh: string; it: string; icon: typeof FileText; color: string }> = {
  project: { zh: "项目", it: "Progetto", icon: FileText, color: "bg-it-green-50 text-it-green-600" },
  news: { zh: "资讯", it: "Notizia", icon: Newspaper, color: "bg-cn-red-50 text-cn-red-600" },
  translation: { zh: "翻译", it: "Traduzione", icon: Languages, color: "bg-warm-gold-50 text-warm-gold-600" },
};

const statusMap: Record<ReviewStatus, { zh: string; it: string; color: string }> = {
  pending: { zh: "待审核", it: "In Attesa", color: "bg-amber-50 text-amber-600 border-amber-200" },
  approved: { zh: "已通过", it: "Approvato", color: "bg-it-green-50 text-it-green-600 border-it-green-200" },
  rejected: { zh: "已驳回", it: "Respinto", color: "bg-cn-red-50 text-cn-red-600 border-cn-red-200" },
};

const filterTabs: { key: "all" | ReviewStatus; zh: string; it: string }[] = [
  { key: "all", zh: "全部", it: "Tutti" },
  { key: "pending", zh: "待审核", it: "In Attesa" },
  { key: "approved", zh: "已通过", it: "Approvati" },
  { key: "rejected", zh: "已驳回", it: "Respinti" },
];

export default function Admin() {
  const { lang } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>("reviews");
  const [statusFilter, setStatusFilter] = useState<"all" | ReviewStatus>("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const filteredReviews = mockReviews.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      return r.titleZh.toLowerCase().includes(kw) || r.titleIt.toLowerCase().includes(kw);
    }
    return true;
  });

  const stats = [
    {
      zh: "待审核",
      it: "In Attesa",
      value: mockReviews.filter((r) => r.status === "pending").length,
      icon: Clock,
      color: "from-amber-400 to-amber-500",
    },
    {
      zh: "今日已审",
      it: "Oggi",
      value: 12,
      icon: CheckCircle2,
      color: "from-it-green-400 to-it-green-500",
    },
    {
      zh: "敏感词拦截",
      it: "Intercettati",
      value: 3,
      icon: Ban,
      color: "from-cn-red-400 to-cn-red-500",
    },
    {
      zh: "通过率",
      it: "Approvazione",
      value: "87.5%",
      icon: TrendingUp,
      color: "from-warm-gold-400 to-warm-gold-500",
    },
  ];

  const highlightSensitive = (text: string, words: string[]) => {
    if (!words.length) return text;
    const regex = new RegExp(`(${words.join("|")})`, "g");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      words.includes(part) ? (
        <span key={i} className="bg-cn-red-100 text-cn-red-600 px-1 rounded font-medium">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const SidebarItem = sidebarItems[0];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="section-title">
            {lang === "zh" ? "后台管理系统" : "Pannello Amministrativo"}
          </h1>
          <p className="section-subtitle mb-0">
            {lang === "zh" ? "内容审核、发布溯源、敏感词管理" : "Revisioni contenuti, tracciabilità, gestione parole sensibili"}
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left sidebar */}
          <aside className="col-span-12 lg:col-span-2">
            <div className="card p-3 sticky top-24">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all duration-200 text-left",
                      isActive
                        ? "bg-gradient-cnit/10 text-cn-red-600 font-medium shadow-elegant"
                        : "text-charcoal-500 hover:bg-charcoal-500/5 hover:text-cn-red-500"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">
                      {lang === "zh" ? item.zh : item.it}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main area */}
          <main className="col-span-12 lg:col-span-7 space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.zh} className="card p-4 gold-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-charcoal-400 mb-1">
                          {lang === "zh" ? stat.zh : stat.it}
                        </p>
                        <p className="text-2xl font-bold text-charcoal-500">
                          {stat.value}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shadow-gold",
                          stat.color
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filter tabs */}
            <div className="card p-2 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="flex items-center gap-1 bg-charcoal-500/5 rounded-lg p-1 overflow-x-auto">
                {filterTabs.map((tab) => {
                  const count =
                    tab.key === "all"
                      ? mockReviews.length
                      : mockReviews.filter((r) => r.status === tab.key).length;
                  const isActive = statusFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setStatusFilter(tab.key)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200",
                        isActive
                          ? "bg-white text-charcoal-500 shadow-elegant"
                          : "text-charcoal-400 hover:text-charcoal-500"
                      )}
                    >
                      {lang === "zh" ? tab.zh : tab.it}
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          isActive ? "bg-warm-gold-100 text-warm-gold-600" : "bg-charcoal-500/10 text-charcoal-400"
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-300" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder={lang === "zh" ? "搜索内容..." : "Cerca contenuti..."}
                  className="input-field pl-10 pr-4 py-2 w-full md:w-64"
                />
              </div>
            </div>

            {/* Review table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-charcoal-500/5">
                      <th className="text-left px-5 py-3 text-xs font-medium text-charcoal-400 uppercase">
                        {lang === "zh" ? "类型" : "Tipo"}
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-charcoal-400 uppercase">
                        {lang === "zh" ? "标题" : "Titolo"}
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-charcoal-400 uppercase">
                        {lang === "zh" ? "提交者" : "Autore"}
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-charcoal-400 uppercase">
                        {lang === "zh" ? "敏感词" : "Sensibili"}
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-charcoal-400 uppercase">
                        {lang === "zh" ? "状态" : "Stato"}
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-charcoal-400 uppercase">
                        {lang === "zh" ? "操作" : "Azioni"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-charcoal-500/5">
                    {filteredReviews.map((review) => {
                      const ct = contentTypeMap[review.contentType];
                      const CtIcon = ct.icon;
                      const st = statusMap[review.status];
                      return (
                        <tr
                          key={review.id}
                          className="transition-colors hover:bg-charcoal-500/[0.02]"
                        >
                          <td className="px-5 py-4">
                            <span className={cn("tag", ct.color)}>
                              <CtIcon className="w-3 h-3" />
                              {lang === "zh" ? ct.zh : ct.it}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-medium text-charcoal-500 text-sm">
                              {lang === "zh" ? review.titleZh : review.titleIt}
                            </div>
                            <div className="text-xs text-charcoal-300 mt-0.5">
                              {review.submittedAt}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-charcoal-400">
                            {review.submittedBy}
                          </td>
                          <td className="px-5 py-4">
                            {review.sensitiveWords.length > 0 ? (
                              <span className="tag bg-cn-red-50 text-cn-red-600">
                                <AlertTriangle className="w-3 h-3" />
                                {review.sensitiveWords.length}
                              </span>
                            ) : (
                              <span className="text-charcoal-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn("tag border", st.color)}>
                              {st.zh}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => setSelectedReview(review)}
                                className="p-2 rounded-lg text-charcoal-400 hover:text-it-green-600 hover:bg-it-green-50 transition-colors"
                                title={lang === "zh" ? "查看" : "Vedi"}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {review.status === "pending" && (
                                <>
                                  <button
                                    className="p-2 rounded-lg text-charcoal-400 hover:text-it-green-600 hover:bg-it-green-50 transition-colors"
                                    title={lang === "zh" ? "通过" : "Approva"}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    className="p-2 rounded-lg text-charcoal-400 hover:text-cn-red-600 hover:bg-cn-red-50 transition-colors"
                                    title={lang === "zh" ? "驳回" : "Respingi"}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </main>

          {/* Right logs panel */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="card p-5 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-charcoal-500 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-warm-gold-500" />
                  {lang === "zh" ? "操作日志" : "Log Operazioni"}
                </h3>
                <button className="text-xs text-charcoal-400 hover:text-cn-red-500 transition-colors">
                  {lang === "zh" ? "查看全部" : "Vedi Tutti"}
                </button>
              </div>

              <div className="relative">
                <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gradient-to-b from-cn-red-500/30 via-warm-gold-500/30 to-it-green-500/30" />
                <div className="space-y-5">
                  {mockLogs.map((log) => (
                    <div key={log.id} className="relative pl-6">
                      <div
                        className={cn(
                          "absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-elegant",
                          log.result === "approved" ? "bg-it-green-500" : "bg-cn-red-500"
                        )}
                      />
                      <div className="text-sm text-charcoal-500">
                        <span className="font-medium">{log.user}</span>
                        <span className="text-charcoal-400"> {log.action}</span>
                      </div>
                      <div className="text-xs text-charcoal-400 mt-0.5">{log.target}</div>
                      <div className="text-xs text-charcoal-300 mt-0.5">{log.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal-900/40 backdrop-blur-sm">
          <div className="card w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col gold-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal-500/10">
              <div>
                <h3 className="font-semibold text-charcoal-500">
                  {lang === "zh" ? selectedReview.titleZh : selectedReview.titleIt}
                </h3>
                <p className="text-xs text-charcoal-400 mt-0.5">
                  {selectedReview.submittedBy} · {selectedReview.submittedAt}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedReview(null);
                  setReviewNote("");
                }}
                className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-500 hover:bg-charcoal-500/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bilingual-row">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="tag-cn">🇨🇳 中文</span>
                    {selectedReview.sensitiveWords.length > 0 && (
                      <span className="tag bg-cn-red-50 text-cn-red-600">
                        <AlertTriangle className="w-3 h-3" />
                        {lang === "zh"
                          ? `含 ${selectedReview.sensitiveWords.length} 个敏感词`
                          : `${selectedReview.sensitiveWords.length} parole sensibili`}
                      </span>
                    )}
                  </div>
                  <div className="p-4 rounded-lg bg-ivory-50 border border-cn-red-500/10 text-sm leading-relaxed text-charcoal-500">
                    {highlightSensitive(selectedReview.contentZh, selectedReview.sensitiveWords)}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="tag-it">🇮🇹 Italiano</span>
                  </div>
                  <div className="p-4 rounded-lg bg-ivory-50 border border-it-green-500/10 text-sm leading-relaxed text-charcoal-500">
                    {selectedReview.contentIt}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal-500 mb-2">
                  {lang === "zh" ? "审核意见" : "Note di Revisione"}
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={3}
                  placeholder={lang === "zh" ? "输入审核意见（可选）..." : "Inserisci note (opzionale)..."}
                  className="input-field resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-charcoal-500/10 bg-ivory-50/50">
              <button
                onClick={() => {
                  setSelectedReview(null);
                  setReviewNote("");
                }}
                className="btn-ghost"
              >
                {lang === "zh" ? "取消" : "Annulla"}
              </button>
              <button className="btn-secondary !text-cn-red-600 !border-cn-red-500/40 hover:!bg-cn-red-50">
                <XCircle className="w-4 h-4" />
                {lang === "zh" ? "驳回" : "Respingi"}
              </button>
              <button className="btn-primary">
                <CheckCircle2 className="w-4 h-4" />
                {lang === "zh" ? "审核通过" : "Approva"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
