import { useState, useEffect, useMemo } from "react";
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
  X,
  TrendingUp,
  Ban,
  Activity,
  UserCheck,
  ChevronRight,
  Plus,
  Trash2,
  RefreshCw,
  UserX,
  UserMinus,
  Download,
  Mail,
  Check,
  Edit3,
  Zap,
  FileCheck,
  ArrowRight,
} from "lucide-react";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";
import { sensitiveWords } from "@/data/mock";

type TabType = "reviews" | "trace" | "sensitive" | "users";
type ReviewStatus = "pending" | "approved" | "rejected";
type ContentType = "project" | "news" | "translation";
type ReviewStep = "detect" | "review" | "confirm";
type SensitiveWordCategory = "political" | "illegal" | "other" | "economic";
type UserRole = "user" | "organization" | "translator" | "admin";
type UserStatus = "active" | "disabled";

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
  result: "approved" | "rejected" | "detected";
}

interface DetectedWord {
  word: string;
  count: number;
  positions: number[];
  replacement?: string;
}

interface TraceNode {
  id: string;
  type: "submit" | "detect" | "review" | "publish";
  titleZh: string;
  titleIt: string;
  operator: string;
  time: string;
  contentSnapshot?: string;
  notes?: string;
  result: "pending" | "approved" | "rejected";
}

interface SensitiveWordItem {
  id: string;
  word: string;
  category: SensitiveWordCategory;
  addedAt: string;
}

interface SystemUser {
  id: string;
  nameZh: string;
  nameIt: string;
  email: string;
  role: UserRole;
  registeredAt: string;
  status: UserStatus;
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
  { id: "4", action: "敏感词拦截", user: "System", target: "外交照会翻译", time: "昨日 15:20", result: "detected" },
  { id: "5", action: "审核通过", user: "审核员·李", target: "地中海邮轮计划", time: "昨日 11:05", result: "approved" },
];

const mockTraceData: Record<string, TraceNode[]> = {
  rev_001: [
    {
      id: "t1",
      type: "submit",
      titleZh: "内容提交",
      titleIt: "Invio Contenuto",
      operator: "意大利经济发展部",
      time: "2026-06-20 14:30",
      contentSnapshot: "为促进两国在新能源汽车领域的深度合作，双方同意...",
      result: "pending",
    },
    {
      id: "t2",
      type: "detect",
      titleZh: "敏感词检测",
      titleIt: "Rilevamento Parole Sensibili",
      operator: "System",
      time: "2026-06-20 14:32",
      contentSnapshot: "检测到敏感词：技术转让 (出现2次)",
      result: "pending",
    },
    {
      id: "t3",
      type: "review",
      titleZh: "人工复核中",
      titleIt: "Revisione Umano",
      operator: "审核员·李",
      time: "2026-06-20 14:35",
      notes: "敏感词已确认，等待最终审核...",
      result: "pending",
    },
  ],
  rev_004: [
    {
      id: "t1",
      type: "submit",
      titleZh: "内容提交",
      titleIt: "Invio Contenuto",
      operator: "安莎社",
      time: "2026-06-19 11:00",
      contentSnapshot: "米兰时装周组委会与中国服装设计师协会宣布...",
      result: "approved",
    },
    {
      id: "t2",
      type: "detect",
      titleZh: "敏感词检测",
      titleIt: "Rilevamento Parole Sensibili",
      operator: "System",
      time: "2026-06-19 11:01",
      contentSnapshot: "未检测到敏感词",
      result: "approved",
    },
    {
      id: "t3",
      type: "review",
      titleZh: "人工复核通过",
      titleIt: "Approvato",
      operator: "管理员·王",
      time: "2026-06-19 11:20",
      notes: "内容规范，符合发布标准",
      result: "approved",
    },
    {
      id: "t4",
      type: "publish",
      titleZh: "已发布",
      titleIt: "Pubblicato",
      operator: "System",
      time: "2026-06-19 11:20",
      result: "approved",
    },
  ],
};

const mockUsers: SystemUser[] = [
  { id: "u1", nameZh: "张晓明", nameIt: "Zhang Xiaoming", email: "zhang@example.com", role: "user", registeredAt: "2026-03-15", status: "active" },
  { id: "u2", nameZh: "李译员", nameIt: "Li Traduttore", email: "li@cnit.org", role: "translator", registeredAt: "2026-02-20", status: "active" },
  { id: "u3", nameZh: "王管理员", nameIt: "Wang Amministratore", email: "wang@cnit.org", role: "admin", registeredAt: "2026-01-10", status: "active" },
  { id: "u4", nameZh: "意大利文化处", nameIt: "Ufficio Culturale Italia", email: "cultural@italy.org", role: "organization", registeredAt: "2026-03-01", status: "active" },
  { id: "u5", nameZh: "陈老师", nameIt: "Chen Professore", email: "chen@university.edu", role: "user", registeredAt: "2026-04-05", status: "disabled" },
  { id: "u6", nameZh: "Marco Rossi", nameIt: "Marco Rossi", email: "marco@company.it", role: "user", registeredAt: "2026-05-12", status: "active" },
];

const initialSensitiveWords: SensitiveWordItem[] = [
  { id: "w1", word: "技术转让", category: "political", addedAt: "2026-01-15" },
  { id: "w2", word: "主权", category: "political", addedAt: "2026-01-15" },
  { id: "w3", word: "外资限制", category: "economic", addedAt: "2026-02-20" },
  { id: "w4", word: sensitiveWords[0], category: "other", addedAt: "2026-01-10" },
  { id: "w5", word: sensitiveWords[1], category: "other", addedAt: "2026-01-10" },
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

const reviewSteps: { key: ReviewStep; zh: string; it: string }[] = [
  { key: "detect", zh: "自动检测", it: "Rilevamento" },
  { key: "review", zh: "人工复核", it: "Revisione" },
  { key: "confirm", zh: "确认发布", it: "Conferma" },
];

const sensitiveCategories: { key: SensitiveWordCategory; zh: string; it: string; color: string }[] = [
  { key: "political", zh: "政治类", it: "Politico", color: "bg-cn-red-50 text-cn-red-600" },
  { key: "illegal", zh: "违法类", it: "Illegale", color: "bg-amber-50 text-amber-600" },
  { key: "economic", zh: "经济类", it: "Economico", color: "bg-it-green-50 text-it-green-600" },
  { key: "other", zh: "其他", it: "Altro", color: "bg-charcoal-500/5 text-charcoal-500" },
];

const userRoles: { key: UserRole; zh: string; it: string; color: string }[] = [
  { key: "user", zh: "普通用户", it: "Utente", color: "bg-charcoal-500/5 text-charcoal-500" },
  { key: "organization", zh: "机构用户", it: "Organizzazione", color: "bg-it-green-50 text-it-green-600" },
  { key: "translator", zh: "翻译审核员", it: "Traduttore", color: "bg-warm-gold-50 text-warm-gold-600" },
  { key: "admin", zh: "管理员", it: "Amministratore", color: "bg-cn-red-50 text-cn-red-600" },
];

const traceNodeTypes: { key: TraceNode["type"]; zh: string; it: string; icon: typeof FileText; color: string }[] = [
  { key: "submit", zh: "内容提交", it: "Invio", icon: FileText, color: "bg-blue-500" },
  { key: "detect", zh: "敏感词检测", it: "Rilevamento", icon: Zap, color: "bg-amber-500" },
  { key: "review", zh: "人工复核", it: "Revisione", icon: FileCheck, color: "bg-warm-gold-500" },
  { key: "publish", zh: "已发布", it: "Pubblicato", icon: CheckCircle2, color: "bg-it-green-500" },
];

function detectSensitiveWords(text: string, words: string[]): DetectedWord[] {
  const detected: DetectedWord[] = [];
  for (const word of words) {
    const positions: number[] = [];
    let pos = text.indexOf(word);
    while (pos !== -1) {
      positions.push(pos);
      pos = text.indexOf(word, pos + 1);
    }
    if (positions.length > 0) {
      detected.push({ word, count: positions.length, positions });
    }
  }
  return detected;
}

function highlightSensitiveText(text: string, detected: DetectedWord[]): React.ReactNode {
  if (detected.length === 0) return text;
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  const allMatches: { start: number; end: number; word: string }[] = [];
  for (const d of detected) {
    for (const pos of d.positions) {
      allMatches.push({ start: pos, end: pos + d.word.length, word: d.word });
    }
  }
  allMatches.sort((a, b) => a.start - b.start);
  for (const match of allMatches) {
    if (match.start > lastIndex) {
      result.push(text.slice(lastIndex, match.start));
    }
    result.push(
      <span key={match.start} className="bg-cn-red-100 text-cn-red-600 px-1 rounded font-medium">
        {match.word}
      </span>
    );
    lastIndex = match.end;
  }
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }
  return result;
}

export default function Admin() {
  const { lang } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>("reviews");
  const [statusFilter, setStatusFilter] = useState<"all" | ReviewStatus>("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [reviews, setReviews] = useState<ReviewItem[]>(mockReviews);
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [reviewStep, setReviewStep] = useState<ReviewStep>("detect");
  const [reviewNote, setReviewNote] = useState("");
  const [detectedWords, setDetectedWords] = useState<DetectedWord[]>([]);
  const [contentAfterReplace, setContentAfterReplace] = useState("");

  const [sensitiveWordsList, setSensitiveWordsList] = useState<SensitiveWordItem[]>(initialSensitiveWords);
  const [newSensitiveWord, setNewSensitiveWord] = useState("");
  const [newWordCategory, setNewWordCategory] = useState<SensitiveWordCategory>("other");
  const [wordSearchKeyword, setWordSearchKeyword] = useState("");

  const [userSearchKeyword, setUserSearchKeyword] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showEditRole, setShowEditRole] = useState(false);

  const [traceContentId, setTraceContentId] = useState("");
  const [traceSearchKeyword, setTraceSearchKeyword] = useState("");

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        return r.titleZh.toLowerCase().includes(kw) || r.titleIt.toLowerCase().includes(kw);
      }
      return true;
    });
  }, [reviews, statusFilter, searchKeyword]);

  const filteredWords = useMemo(() => {
    if (!wordSearchKeyword) return sensitiveWordsList;
    const kw = wordSearchKeyword.toLowerCase();
    return sensitiveWordsList.filter((w) => w.word.toLowerCase().includes(kw));
  }, [sensitiveWordsList, wordSearchKeyword]);

  const filteredUsers = useMemo(() => {
    if (!userSearchKeyword) return mockUsers;
    const kw = userSearchKeyword.toLowerCase();
    return mockUsers.filter(
      (u) =>
        u.nameZh.toLowerCase().includes(kw) ||
        u.nameIt.toLowerCase().includes(kw) ||
        u.email.toLowerCase().includes(kw)
    );
  }, [userSearchKeyword]);

  const stats = [
    {
      zh: "待审核",
      it: "In Attesa",
      value: reviews.filter((r) => r.status === "pending").length,
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
      value: reviews.filter((r) => r.sensitiveWords.length > 0).length,
      icon: Ban,
      color: "from-cn-red-400 to-cn-red-500",
    },
    {
      zh: "通过率",
      it: "Approvazione",
      value: reviews.filter((r) => r.status === "approved").length > 0
        ? Math.round((reviews.filter((r) => r.status === "approved").length / reviews.length) * 100) + "%"
        : "0%",
      icon: TrendingUp,
      color: "from-warm-gold-400 to-warm-gold-500",
    },
  ];

  useEffect(() => {
    if (selectedReview) {
      const allWords = sensitiveWordsList.map((w) => w.word);
      const detected = detectSensitiveWords(selectedReview.contentZh, allWords);
      setDetectedWords(detected);
      setContentAfterReplace(selectedReview.contentZh);
      setReviewStep("detect");
      setReviewNote("");
    }
  }, [selectedReview, sensitiveWordsList]);

  const handleReplaceWord = (word: string, replacement: string) => {
    setDetectedWords((prev) =>
      prev.map((w) => (w.word === word ? { ...w, replacement } : w))
    );
    setContentAfterReplace((prev) => {
      const regex = new RegExp(word, "g");
      return prev.replace(regex, replacement);
    });
  };

  const handleAddSensitiveWord = () => {
    if (!newSensitiveWord.trim()) return;
    if (sensitiveWordsList.some((w) => w.word === newSensitiveWord.trim())) return;
    const newWord: SensitiveWordItem = {
      id: `w_${Date.now()}`,
      word: newSensitiveWord.trim(),
      category: newWordCategory,
      addedAt: new Date().toISOString().split("T")[0],
    };
    setSensitiveWordsList((prev) => [newWord, ...prev]);
    setNewSensitiveWord("");
  };

  const handleDeleteSensitiveWord = (id: string) => {
    setSensitiveWordsList((prev) => prev.filter((w) => w.id !== id));
  };

  const handleApprove = () => {
    if (!selectedReview) return;
    if (reviewStep === "detect") {
      setReviewStep("review");
      return;
    }
    if (reviewStep === "review") {
      if (!reviewNote.trim()) {
        alert(lang === "zh" ? "请填写审核意见" : "Inserisci note di revisione");
        return;
      }
      setReviewStep("confirm");
      return;
    }
    setReviews((prev) =>
      prev.map((r) => (r.id === selectedReview.id ? { ...r, status: "approved" } : r))
    );
    setSelectedReview(null);
  };

  const handleReject = () => {
    if (!selectedReview) return;
    if (!reviewNote.trim()) {
      alert(lang === "zh" ? "请填写驳回理由" : "Inserisci motivazione di rifiuto");
      return;
    }
    setReviews((prev) =>
      prev.map((r) => (r.id === selectedReview.id ? { ...r, status: "rejected" } : r))
    );
    setSelectedReview(null);
  };

  const handleToggleUserStatus = (id: string) => {
    alert(lang === "zh" ? "用户状态已更新" : "Stato utente aggiornato");
  };

  const handleChangeUserRole = (id: string, newRole: UserRole) => {
    alert(lang === "zh" ? `用户角色已更新为：${newRole}` : `Ruolo aggiornato: ${newRole}`);
    setShowEditRole(false);
    setSelectedUserId(null);
  };

  const statsData = stats;

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

          {/* Main area - content depends on active tab */}
          <main className="col-span-12 lg:col-span-10 space-y-6">
            {/* ===== TAB: REVIEWS ===== */}
            {activeTab === "reviews" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {statsData.map((stat) => {
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

                <div className="card p-2 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  <div className="flex items-center gap-1 bg-charcoal-500/5 rounded-lg p-1 overflow-x-auto">
                    {filterTabs.map((tab) => {
                      const count =
                        tab.key === "all"
                          ? reviews.length
                          : reviews.filter((r) => r.status === tab.key).length;
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
                                  <span className="tag bg-it-green-50 text-it-green-600">
                                    <Check className="w-3 h-3" />
                                    安全
                                  </span>
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
                                    title={lang === "zh" ? "查看/审核" : "Vedi/Revisione"}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  {review.status === "pending" && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setSelectedReview(review);
                                          setReviewStep("review");
                                        }}
                                        className="p-2 rounded-lg text-charcoal-400 hover:text-it-green-600 hover:bg-it-green-50 transition-colors"
                                        title={lang === "zh" ? "快速通过" : "Approva Veloce"}
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedReview(review);
                                          setReviewStep("review");
                                        }}
                                        className="p-2 rounded-lg text-charcoal-400 hover:text-cn-red-600 hover:bg-cn-red-50 transition-colors"
                                        title={lang === "zh" ? "快速驳回" : "Respingi Veloce"}
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
              </>
            )}

            {/* ===== TAB: TRACE ===== */}
            {activeTab === "trace" && (
              <>
                <div className="card p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-charcoal-500">
                      {lang === "zh" ? "发布溯源" : "Tracciabilità Contenuti"}
                    </h3>
                    <p className="text-xs text-charcoal-400">
                      {lang === "zh" ? "查询内容从提交到发布的完整流程" : "Traccia completa dall'invio alla pubblicazione"}
                    </p>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-300" />
                    <input
                      type="text"
                      value={traceSearchKeyword}
                      onChange={(e) => setTraceSearchKeyword(e.target.value)}
                      placeholder={lang === "zh" ? "按内容ID或标题搜索..." : "Cerca per ID o titolo..."}
                      className="input-field pl-10 pr-4 py-2 w-full md:w-80"
                    />
                  </div>
                </div>

                <div className="card p-5">
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-charcoal-500 mb-2">
                      {lang === "zh" ? "选择内容进行溯源" : "Seleziona contenuto per tracciabilità"}
                    </label>
                    <select
                      value={traceContentId}
                      onChange={(e) => setTraceContentId(e.target.value)}
                      className="input-field"
                    >
                      <option value="">{lang === "zh" ? "请选择内容..." : "Seleziona..."}</option>
                      {reviews.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.id} - {lang === "zh" ? r.titleZh : r.titleIt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {traceContentId && (
                    <div className="space-y-8 relative">
                      <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-amber-500 to-it-green-500 opacity-30" />
                      {(mockTraceData[traceContentId] || []).map((node) => {
                        const nodeType = traceNodeTypes.find((t) => t.key === node.type)!;
                        const NodeIcon = nodeType.icon;
                        return (
                          <div key={node.id} className="relative pl-12">
                            <div
                              className={cn(
                                "absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-elegant",
                                nodeType.color
                              )}
                            >
                              <NodeIcon className="w-4 h-4" />
                            </div>
                            <div className="card p-5">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold text-charcoal-500 flex items-center gap-2">
                                    {lang === "zh" ? node.titleZh : node.titleIt}
                                    <span className={cn("tag", node.result === "approved" ? "bg-it-green-50 text-it-green-600" : "bg-amber-50 text-amber-600")}>
                                      {node.result === "approved"
                                        ? lang === "zh"
                                          ? "已通过"
                                          : "Approvato"
                                        : node.result === "rejected"
                                        ? lang === "zh"
                                          ? "已驳回"
                                          : "Respinto"
                                        : lang === "zh"
                                        ? "处理中"
                                        : "In Corso"}
                                    </span>
                                  </h4>
                                  <p className="text-xs text-charcoal-400">
                                    {lang === "zh" ? `操作人：${node.operator}` : `Operatore: ${node.operator}`} · {node.time}
                                  </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-charcoal-300" />
                              </div>
                              {node.contentSnapshot && (
                                <div className="p-3 rounded-lg bg-ivory-50 border border-charcoal-500/5 text-sm text-charcoal-500 mb-3">
                                  <p className="text-xs text-charcoal-400 mb-1">
                                    {lang === "zh" ? "内容快照" : "Snapshot Contenuto"}
                                  </p>
                                  {node.contentSnapshot}
                                </div>
                              )}
                              {node.notes && (
                                <div className="p-3 rounded-lg bg-warm-gold-50 border border-warm-gold-500/20 text-sm text-charcoal-500">
                                  <p className="text-xs text-warm-gold-600 mb-1 flex items-center gap-1">
                                    <Edit3 className="w-3 h-3" />
                                    {lang === "zh" ? "审核意见" : "Note di Revisione"}
                                  </p>
                                  {node.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {!mockTraceData[traceContentId] && (
                        <div className="text-center py-12 text-charcoal-400">
                          <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>{lang === "zh" ? "暂无溯源数据" : "Nessun dato di tracciabilità"}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="card p-5">
                  <h4 className="font-semibold text-charcoal-500 mb-4 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-warm-gold-500" />
                    {lang === "zh" ? "操作日志筛选" : "Filtro Log Operazioni"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <select className="input-field">
                      <option>{lang === "zh" ? "全部操作类型" : "Tutte le Operazioni"}</option>
                      <option>{lang === "zh" ? "审核通过" : "Approvato"}</option>
                      <option>{lang === "zh" ? "审核驳回" : "Respinto"}</option>
                      <option>{lang === "zh" ? "敏感词拦截" : "Intercettato"}</option>
                    </select>
                    <select className="input-field">
                      <option>{lang === "zh" ? "全部操作人" : "Tutti gli Operatori"}</option>
                      <option>管理员·王</option>
                      <option>审核员·李</option>
                    </select>
                    <select className="input-field">
                      <option>{lang === "zh" ? "全部时间范围" : "Tutti i Periodi"}</option>
                      <option>{lang === "zh" ? "今天" : "Oggi"}</option>
                      <option>{lang === "zh" ? "本周" : "Questa Settimana"}</option>
                      <option>{lang === "zh" ? "本月" : "Questo Mese"}</option>
                    </select>
                  </div>

                  <div className="relative">
                    <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gradient-to-b from-cn-red-500/30 via-warm-gold-500/30 to-it-green-500/30" />
                    <div className="space-y-5">
                      {mockLogs.map((log) => (
                        <div key={log.id} className="relative pl-6">
                          <div
                            className={cn(
                              "absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-elegant",
                              log.result === "approved"
                                ? "bg-it-green-500"
                                : log.result === "rejected"
                                ? "bg-cn-red-500"
                                : "bg-amber-500"
                            )}
                          />
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-sm text-charcoal-500">
                                <span className="font-medium">{log.user}</span>
                                <span className="text-charcoal-400"> {log.action}</span>
                              </div>
                              <div className="text-xs text-charcoal-400 mt-0.5">{log.target}</div>
                            </div>
                            <div className="text-xs text-charcoal-300">{log.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ===== TAB: SENSITIVE WORDS ===== */}
            {activeTab === "sensitive" && (
              <>
                <div className="card p-5">
                  <h3 className="font-semibold text-charcoal-500 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-cn-red-500" />
                    {lang === "zh" ? "添加敏感词" : "Aggiungi Parola Sensibile"}
                  </h3>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      type="text"
                      value={newSensitiveWord}
                      onChange={(e) => setNewSensitiveWord(e.target.value)}
                      placeholder={lang === "zh" ? "输入敏感词..." : "Inserisci parola..."}
                      className="input-field flex-1"
                      onKeyDown={(e) => e.key === "Enter" && handleAddSensitiveWord()}
                    />
                    <select
                      value={newWordCategory}
                      onChange={(e) => setNewWordCategory(e.target.value as SensitiveWordCategory)}
                      className="input-field md:w-40"
                    >
                      {sensitiveCategories.map((c) => (
                        <option key={c.key} value={c.key}>
                          {lang === "zh" ? c.zh : c.it}
                        </option>
                      ))}
                    </select>
                    <button onClick={handleAddSensitiveWord} className="btn-primary whitespace-nowrap">
                      <Plus className="w-4 h-4" />
                      {lang === "zh" ? "添加" : "Aggiungi"}
                    </button>
                  </div>
                </div>

                <div className="card p-5">
                  <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between mb-5">
                    <h3 className="font-semibold text-charcoal-500">
                      {lang === "zh" ? "敏感词库" : "Elenco Parole Sensibili"}
                      <span className="ml-2 text-sm font-normal text-charcoal-400">
                        ({sensitiveWordsList.length})
                      </span>
                    </h3>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-300" />
                      <input
                        type="text"
                        value={wordSearchKeyword}
                        onChange={(e) => setWordSearchKeyword(e.target.value)}
                        placeholder={lang === "zh" ? "搜索敏感词..." : "Cerca..."}
                        className="input-field pl-10 pr-4 py-2 w-full md:w-64"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-charcoal-500/5">
                          <th className="text-left px-5 py-3 text-xs font-medium text-charcoal-400 uppercase">
                            {lang === "zh" ? "敏感词" : "Parola"}
                          </th>
                          <th className="text-left px-5 py-3 text-xs font-medium text-charcoal-400 uppercase">
                            {lang === "zh" ? "分类" : "Categoria"}
                          </th>
                          <th className="text-left px-5 py-3 text-xs font-medium text-charcoal-400 uppercase">
                            {lang === "zh" ? "添加时间" : "Data Aggiunta"}
                          </th>
                          <th className="text-right px-5 py-3 text-xs font-medium text-charcoal-400 uppercase">
                            {lang === "zh" ? "操作" : "Azioni"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-charcoal-500/5">
                        {filteredWords.map((word) => {
                          const cat = sensitiveCategories.find((c) => c.key === word.category)!;
                          return (
                            <tr key={word.id} className="transition-colors hover:bg-charcoal-500/[0.02]">
                              <td className="px-5 py-4 font-medium text-charcoal-500">
                                {word.word}
                              </td>
                              <td className="px-5 py-4">
                                <span className={cn("tag", cat.color)}>
                                  {lang === "zh" ? cat.zh : cat.it}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-sm text-charcoal-400">{word.addedAt}</td>
                              <td className="px-5 py-4">
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => handleDeleteSensitiveWord(word.id)}
                                    className="p-2 rounded-lg text-charcoal-400 hover:text-cn-red-600 hover:bg-cn-red-50 transition-colors"
                                    title={lang === "zh" ? "删除" : "Elimina"}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {filteredWords.length === 0 && (
                    <div className="text-center py-12 text-charcoal-400">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>{lang === "zh" ? "未找到匹配的敏感词" : "Nessuna parola sensibile trovata"}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ===== TAB: USERS ===== */}
            {activeTab === "users" && (
              <>
                <div className="card p-5 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  <h3 className="font-semibold text-charcoal-500">
                    {lang === "zh" ? "用户列表" : "Elenco Utenti"}
                    <span className="ml-2 text-sm font-normal text-charcoal-400">
                      ({mockUsers.length})
                    </span>
                  </h3>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-300" />
                    <input
                      type="text"
                      value={userSearchKeyword}
                      onChange={(e) => setUserSearchKeyword(e.target.value)}
                      placeholder={lang === "zh" ? "搜索用户..." : "Cerca utente..."}
                      className="input-field pl-10 pr-4 py-2 w-full md:w-64"
                    />
                  </div>
                </div>

                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-charcoal-500/5">
                          <th className="text-left px-5 py-3 text-xs font-medium text-charcoal-400 uppercase">
                            {lang === "zh" ? "姓名" : "Nome"}
                          </th>
                          <th className="text-left px-5 py-3 text-xs font-medium text-charcoal-400 uppercase">
                            {lang === "zh" ? "邮箱" : "Email"}
                          </th>
                          <th className="text-left px-5 py-3 text-xs font-medium text-charcoal-400 uppercase">
                            {lang === "zh" ? "角色" : "Ruolo"}
                          </th>
                          <th className="text-left px-5 py-3 text-xs font-medium text-charcoal-400 uppercase">
                            {lang === "zh" ? "注册时间" : "Registrazione"}
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
                        {filteredUsers.map((user) => {
                          const role = userRoles.find((r) => r.key === user.role)!;
                          return (
                            <tr key={user.id} className="transition-colors hover:bg-charcoal-500/[0.02]">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-gradient-cnit flex items-center justify-center text-white font-medium text-sm">
                                    {user.nameZh.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-medium text-charcoal-500 text-sm">
                                      {lang === "zh" ? user.nameZh : user.nameIt}
                                    </div>
                                    <div className="text-xs text-charcoal-400">{user.nameIt}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-sm text-charcoal-500">{user.email}</td>
                              <td className="px-5 py-4">
                                <span className={cn("tag", role.color)}>
                                  {lang === "zh" ? role.zh : role.it}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-sm text-charcoal-400">{user.registeredAt}</td>
                              <td className="px-5 py-4">
                                <span
                                  className={cn(
                                    "tag border",
                                    user.status === "active"
                                      ? "bg-it-green-50 text-it-green-600 border-it-green-200"
                                      : "bg-charcoal-500/5 text-charcoal-400 border-charcoal-500/10"
                                  )}
                                >
                                  {user.status === "active"
                                    ? lang === "zh"
                                      ? "正常"
                                      : "Attivo"
                                    : lang === "zh"
                                    ? "已禁用"
                                    : "Disabilitato"}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-1 justify-end">
                                  <button
                                    onClick={() => {
                                      setSelectedUserId(user.id);
                                      setShowEditRole(true);
                                    }}
                                    className="p-2 rounded-lg text-charcoal-400 hover:text-warm-gold-600 hover:bg-warm-gold-50 transition-colors"
                                    title={lang === "zh" ? "修改角色" : "Cambia Ruolo"}
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleUserStatus(user.id)}
                                    className="p-2 rounded-lg text-charcoal-400 hover:text-cn-red-600 hover:bg-cn-red-50 transition-colors"
                                    title={
                                      user.status === "active"
                                        ? lang === "zh"
                                          ? "禁用"
                                          : "Disabilita"
                                        : lang === "zh"
                                        ? "启用"
                                        : "Abilita"
                                    }
                                  >
                                    {user.status === "active" ? (
                                      <UserMinus className="w-4 h-4" />
                                    ) : (
                                      <UserCheck className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* ===== REVIEW DETAIL MODAL WITH 3-STEP WORKFLOW ===== */}
      {selectedReview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal-900/40 backdrop-blur-sm">
          <div className="card w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col gold-border">
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
                  setReviewStep("detect");
                  setReviewNote("");
                  setDetectedWords([]);
                }}
                className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-500 hover:bg-charcoal-500/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedReview.status === "pending" && (
              <div className="px-6 py-4 bg-ivory-50/50 border-b border-charcoal-500/5">
                <div className="flex items-center justify-center gap-2">
                  {reviewSteps.map((step, index) => {
                    const currentIndex = reviewSteps.findIndex((s) => s.key === reviewStep);
                    const stepIndex = index;
                    const isCompleted = stepIndex < currentIndex;
                    const isActive = step.key === reviewStep;
                    return (
                      <div key={step.key} className="flex items-center">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                            isActive
                              ? "bg-gradient-cnit text-white shadow-gold"
                              : isCompleted
                              ? "bg-it-green-500 text-white"
                              : "bg-charcoal-500/10 text-charcoal-400"
                          )}
                        >
                          {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                        </div>
                        <span
                          className={cn(
                            "ml-2 text-sm font-medium",
                            isActive ? "text-cn-red-600" : isCompleted ? "text-it-green-600" : "text-charcoal-400"
                          )}
                        >
                          {lang === "zh" ? step.zh : step.it}
                        </span>
                        {index < reviewSteps.length - 1 && (
                          <div
                            className={cn(
                              "w-12 h-0.5 mx-2",
                              isCompleted ? "bg-it-green-500" : "bg-charcoal-500/10"
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* STEP 1: AUTO DETECT */}
              {reviewStep === "detect" && (
                <>
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <h4 className="font-semibold text-amber-700 flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5" />
                      {lang === "zh" ? "敏感词自动检测结果" : "Risultato Rilevamento Automatico"}
                    </h4>
                    <p className="text-sm text-amber-700/80">
                      {detectedWords.length > 0
                        ? lang === "zh"
                          ? `检测到 ${detectedWords.length} 个敏感词，请查看并确认是否需要替换`
                          : `Rilevate ${detectedWords.length} parole sensibili, controlla e sostituisci se necessario`
                        : lang === "zh"
                        ? "未检测到敏感词，内容安全"
                        : "Nessuna parola sensibile rilevata, contenuto sicuro"}
                    </p>
                  </div>

                  {detectedWords.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-charcoal-500 text-sm">
                        {lang === "zh" ? "检测到的敏感词列表（点击替换）" : "Elenco Parole Rilevate (Clicca per sostituire)"}
                      </h4>
                      {detectedWords.map((dw) => (
                        <div
                          key={dw.word}
                          className="p-4 rounded-lg bg-cn-red-50/50 border border-cn-red-200 flex flex-col md:flex-row gap-4 items-start md:items-center"
                        >
                          <div className="flex items-center gap-3 md:flex-1">
                            <AlertTriangle className="w-5 h-5 text-cn-red-500 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-cn-red-600">{dw.word}</span>
                              <span className="text-xs text-charcoal-400 ml-3">
                                {lang === "zh" ? `出现 ${dw.count} 次` : `${dw.count} occorrenze`}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 flex items-center gap-2 w-full md:w-auto">
                            <input
                              type="text"
                              placeholder={lang === "zh" ? "替换词（可选）..." : "Sostituzione..."}
                              className="input-field flex-1"
                              value={dw.replacement || ""}
                              onChange={(e) => handleReplaceWord(dw.word, e.target.value)}
                            />
                            <button
                              onClick={() => handleReplaceWord(dw.word, dw.replacement || "")}
                              className="btn-secondary"
                            >
                              <RefreshCw className="w-4 h-4" />
                              {lang === "zh" ? "替换" : "Sostituisci"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bilingual-row">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="tag-cn">🇨🇳 中文原文</span>
                        {detectedWords.length > 0 && (
                          <span className="tag bg-cn-red-50 text-cn-red-600">
                            <AlertTriangle className="w-3 h-3" />
                            {lang === "zh"
                              ? `含 ${detectedWords.length} 个敏感词`
                              : `${detectedWords.length} parole sensibili`}
                          </span>
                        )}
                      </div>
                      <div className="p-4 rounded-lg bg-cn-red-50/30 border border-cn-red-200 text-sm leading-relaxed text-charcoal-500">
                        {highlightSensitiveText(selectedReview.contentZh, detectedWords)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="tag-it">🇮🇹 替换后预览</span>
                        {contentAfterReplace !== selectedReview.contentZh && (
                          <span className="tag bg-it-green-50 text-it-green-600">
                            <Check className="w-3 h-3" />
                            {lang === "zh" ? "已替换" : "Sostituito"}
                          </span>
                        )}
                      </div>
                      <div className="p-4 rounded-lg bg-it-green-50/30 border border-it-green-200 text-sm leading-relaxed text-charcoal-500">
                        {contentAfterReplace}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-ivory-50 border border-charcoal-500/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Languages className="w-4 h-4 text-warm-gold-500" />
                      <span className="text-sm font-medium text-charcoal-500">
                        {lang === "zh" ? "意大利语译文" : "Traduzione Italiana"}
                      </span>
                    </div>
                    <p className="text-sm text-charcoal-500 leading-relaxed">
                      {selectedReview.contentIt}
                    </p>
                  </div>
                </>
              )}

              {/* STEP 2: HUMAN REVIEW */}
              {reviewStep === "review" && (
                <>
                  <div className="p-4 rounded-lg bg-warm-gold-50 border border-warm-gold-200">
                    <h4 className="font-semibold text-warm-gold-700 flex items-center gap-2 mb-2">
                      <Edit3 className="w-5 h-5" />
                      {lang === "zh" ? "人工复核" : "Revisione Umana"}
                    </h4>
                    <p className="text-sm text-warm-gold-700/80">
                      {lang === "zh"
                        ? "请仔细阅读内容并填写审核意见，确认无误后可提交"
                        : "Leggi attentamente il contenuto e inserisci le note di revisione"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <span className="tag-cn">🇨🇳 中文原文</span>
                      <div className="p-4 rounded-lg bg-ivory-50 border border-charcoal-500/5 text-sm leading-relaxed text-charcoal-500 min-h-[120px]">
                        {contentAfterReplace}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="tag-it">🇮🇹 意大利语译文</span>
                      <div className="p-4 rounded-lg bg-ivory-50 border border-charcoal-500/5 text-sm leading-relaxed text-charcoal-500 min-h-[120px]">
                        {selectedReview.contentIt}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-charcoal-500 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-warm-gold-500" />
                      {lang === "zh" ? "审核意见（必填）" : "Note di Revisione (Richiesto)"}
                    </label>
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      rows={4}
                      placeholder={lang === "zh" ? "请输入详细的审核意见..." : "Inserisci note dettagliate..."}
                      className="input-field resize-none"
                    />
                    {!reviewNote.trim() && (
                      <p className="text-xs text-cn-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {lang === "zh" ? "请填写审核意见后再提交" : "Inserisci le note prima di procedere"}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* STEP 3: CONFIRM PUBLISH */}
              {reviewStep === "confirm" && (
                <>
                  <div className="p-4 rounded-lg bg-it-green-50 border border-it-green-200">
                    <h4 className="font-semibold text-it-green-700 flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      {lang === "zh" ? "确认发布" : "Conferma Pubblicazione"}
                    </h4>
                    <p className="text-sm text-it-green-700/80">
                      {lang === "zh"
                        ? "请确认以下信息无误，点击确认后内容将正式发布"
                        : "Conferma le informazioni seguenti, dopo la conferma il contenuto sarà pubblicato"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card p-4">
                      <p className="text-xs text-charcoal-400 mb-1">{lang === "zh" ? "内容标题" : "Titolo"}</p>
                      <p className="font-medium text-charcoal-500">
                        {lang === "zh" ? selectedReview.titleZh : selectedReview.titleIt}
                      </p>
                    </div>
                    <div className="card p-4">
                      <p className="text-xs text-charcoal-400 mb-1">{lang === "zh" ? "内容类型" : "Tipo"}</p>
                      <p className="font-medium text-charcoal-500">
                        {contentTypeMap[selectedReview.contentType].zh}
                      </p>
                    </div>
                    <div className="card p-4">
                      <p className="text-xs text-charcoal-400 mb-1">{lang === "zh" ? "审核人" : "Revisore"}</p>
                      <p className="font-medium text-charcoal-500">管理员·王</p>
                    </div>
                    <div className="card p-4">
                      <p className="text-xs text-charcoal-400 mb-1">{lang === "zh" ? "审核时间" : "Ora"}</p>
                      <p className="font-medium text-charcoal-500">
                        {new Date().toLocaleString("zh-CN")}
                      </p>
                    </div>
                  </div>

                  <div className="card p-4">
                    <p className="text-xs text-charcoal-400 mb-2">{lang === "zh" ? "审核意见" : "Note di Revisione"}</p>
                    <p className="text-charcoal-500 p-3 bg-ivory-50 rounded-lg border border-warm-gold-500/20">
                      {reviewNote}
                    </p>
                  </div>

                  <div className="card p-4">
                    <p className="text-xs text-charcoal-400 mb-2">{lang === "zh" ? "敏感词处理" : "Gestione Parole Sensibili"}</p>
                    {detectedWords.length > 0 ? (
                      <div className="space-y-2">
                        {detectedWords.map((dw) => (
                          <div key={dw.word} className="flex items-center gap-2 text-sm">
                            <span className="text-cn-red-600 line-through">{dw.word}</span>
                            <ArrowRight className="w-4 h-4 text-charcoal-400" />
                            <span className="text-it-green-600 font-medium">
                              {dw.replacement || lang === "zh" ? "保留原文" : "Mantenuto"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-it-green-600 text-sm flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        {lang === "zh" ? "未检测到敏感词，内容安全" : "Nessuna parola sensibile rilevata"}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {selectedReview.status === "pending" ? (
              <div className="flex items-center justify-between px-6 py-4 border-t border-charcoal-500/10 bg-ivory-50/50">
                <div>
                  {reviewStep !== "detect" && (
                    <button
                      onClick={() => setReviewStep(reviewStep === "review" ? "detect" : "review")}
                      className="btn-ghost"
                    >
                      ← {lang === "zh" ? "上一步" : "Indietro"}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedReview(null);
                      setReviewStep("detect");
                      setReviewNote("");
                      setDetectedWords([]);
                    }}
                    className="btn-ghost"
                  >
                    {lang === "zh" ? "取消" : "Annulla"}
                  </button>
                  <button
                    onClick={handleReject}
                    className="btn-secondary !text-cn-red-600 !border-cn-red-500/40 hover:!bg-cn-red-50"
                  >
                    <XCircle className="w-4 h-4" />
                    {lang === "zh" ? "驳回" : "Respingi"}
                  </button>
                  <button onClick={handleApprove} className="btn-primary">
                    {reviewStep === "confirm" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        {lang === "zh" ? "确认发布" : "Conferma"}
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        {lang === "zh" ? "下一步" : "Avanti"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-charcoal-500/10 bg-ivory-50/50">
                <button
                  onClick={() => {
                    setSelectedReview(null);
                    setReviewStep("detect");
                  }}
                  className="btn-primary"
                >
                  {lang === "zh" ? "关闭" : "Chiudi"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRole && selectedUserId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal-900/40 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 gold-border">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-charcoal-500">
                {lang === "zh" ? "修改用户角色" : "Modifica Ruolo Utente"}
              </h3>
              <button
                onClick={() => {
                  setShowEditRole(false);
                  setSelectedUserId(null);
                }}
                className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-500 hover:bg-charcoal-500/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {userRoles.map((role) => (
                <button
                  key={role.key}
                  onClick={() => handleChangeUserRole(selectedUserId, role.key)}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border border-charcoal-500/10 hover:border-warm-gold-500/40 hover:bg-warm-gold-50/30 transition-all text-left"
                >
                  <span className={cn("tag", role.color)}>
                    {lang === "zh" ? role.zh : role.it}
                  </span>
                  <ChevronRight className="w-4 h-4 ml-auto text-charcoal-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
