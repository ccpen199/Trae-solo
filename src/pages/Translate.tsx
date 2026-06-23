import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  FileUp,
  Trash2,
  Languages,
  Copy,
  Star,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  Upload,
  AlertCircle,
  UserCheck,
  Download,
  Clock,
  FileText,
  Newspaper,
  CalendarDays,
  RotateCcw,
  ShieldCheck,
  Zap,
  MessageSquare,
  Search,
  Briefcase,
  Stethoscope,
  Scale,
  Globe2,
  GraduationCap,
  LogIn,
  LayoutDashboard,
  History,
  ChevronRight,
  X,
  Info,
} from "lucide-react";
import { useAppStore } from "@/store";
import type { TermItem, TranslationHistoryItem, PolishWorkflowRecord } from "@/types";
import { mockTerms } from "@/data/mock";
import { cn } from "@/lib/utils";

type Lang = "zh" | "it";
type Domain = "general" | "diplomatic" | "economic" | "education" | "medical" | "legal";
type DocTemplate = "policy" | "press" | "event";
type PolishStep = 1 | 2 | 3;
type Urgency = "normal" | "urgent";
type SceneLabel = "visa" | "medical" | "legal" | "general" | "education";

const sceneLabels: Record<SceneLabel, { zh: string; it: string; icon: typeof Globe2; color: string }> = {
  visa: { zh: "签证", it: "Visti", icon: Briefcase, color: "bg-blue-100 text-blue-700 border-blue-200" },
  medical: { zh: "医疗", it: "Medico", icon: Stethoscope, color: "bg-rose-100 text-rose-700 border-rose-200" },
  legal: { zh: "法律", it: "Legale", icon: Scale, color: "bg-amber-100 text-amber-700 border-amber-200" },
  general: { zh: "通用", it: "Generale", icon: Globe2, color: "bg-slate-100 text-slate-700 border-slate-200" },
  education: { zh: "教育", it: "Educazione", icon: GraduationCap, color: "bg-purple-100 text-purple-700 border-purple-200" },
};

const domainLabels: Record<Domain, { zh: string; it: string }> = {
  general: { zh: "通用", it: "Generale" },
  diplomatic: { zh: "外交", it: "Diplomatico" },
  economic: { zh: "经贸", it: "Economico" },
  education: { zh: "教育", it: "Educazione" },
  medical: { zh: "医疗", it: "Medico" },
  legal: { zh: "法律", it: "Legale" },
};

const langLabels: Record<Lang, { zh: string; it: string }> = {
  zh: { zh: "中文", it: "Cinese" },
  it: { zh: "意大利文", it: "Italiano" },
};

const categoryColors: Record<string, string> = {
  economic: "bg-emerald-100 text-emerald-700 border-emerald-200",
  education: "bg-blue-100 text-blue-700 border-blue-200",
  medical: "bg-rose-100 text-rose-700 border-rose-200",
  legal: "bg-amber-100 text-amber-700 border-amber-200",
  general: "bg-slate-100 text-slate-700 border-slate-200",
  diplomatic: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const docTemplates: Record<DocTemplate, { zh: string; it: string; label: { zh: string; it: string }; icon: typeof FileText }> = {
  policy: {
    label: { zh: "政策文件", it: "Documento politico" },
    icon: FileText,
    zh: "中华人民共和国与意大利共和国关于深化全面战略伙伴关系的联合声明。双方一致认为，在当前国际形势深刻变化的背景下，进一步加强中意全面战略伙伴关系，符合两国人民的根本利益。双方同意在经贸、科技、文化、教育等领域深化务实合作，推动共建\"一带一路\"取得更多成果。双方强调，应维护多边主义和自由贸易体系，反对一切形式的保护主义。",
    it: "Dichiarazione congiunta della Repubblica Popolare Cinese e della Repubblica Italiana sull'approfondimento della partnership strategica globale. Le due parti concordano all'unanimità che, nel contesto dei profondi cambiamenti della situazione internazionale, il rafforzamento della partnership strategica globale Cina-Italia risponde agli interessi fondamentali dei due popoli. Le parti convengono di approfondire la cooperazione pragmatica nei settori economico, scientifico, culturale e educativo, promuovendo la costruzione congiunta dell'Iniziativa Belt and Road per ottenere ulteriori risultati.",
  },
  press: {
    label: { zh: "新闻稿", it: "Comunicato stampa" },
    icon: Newspaper,
    zh: "中意两国文化部今日在罗马签署文化交流合作协议，旨在进一步推动两国在文化遗产保护、当代艺术展览和创意产业等领域的深度合作。根据协议，双方将在未来五年内互办文化年活动，并建立常态化的文化交流机制。意大利文化部长表示，此次协议的签署标志着中意文化关系进入新阶段。",
    it: "I Ministeri della Cultura di Cina e Italia hanno firmato oggi a Roma un accordo di cooperazione negli scambi culturali, volto a promuovere ulteriormente la cooperazione profonda tra i due paesi nella protezione del patrimonio culturale, nelle mostre d'arte contemporanea e nelle industrie creative. Secondo l'accordo, le due parti organizzeranno reciprocamente eventi dell'Anno della Cultura nei prossimi cinque anni e stabiliranno un meccanismo regolare di scambio culturale. Il Ministro della Cultura italiano ha dichiarato che la firma di questo accordo segna una nuova fase nelle relazioni culturali Cina-Italia.",
  },
  event: {
    label: { zh: "活动通告", it: "Avviso di evento" },
    icon: CalendarDays,
    zh: "2026年中意文化交流年开幕式将于9月15日在北京国家大剧院隆重举行。届时，中意两国领导人将出席并致辞，来自两国的艺术家将联袂呈现一场融合东西方文化精髓的文艺演出。活动期间还将举办中意文化遗产摄影展和双边文化论坛。欢迎各界人士踊跃报名参加。",
    it: "La cerimonia di apertura dell'Anno degli Scambi Culturali Cina-Italia 2026 si terrà solennemente il 15 settembre al Grande Teatro Nazionale di Pechino. In occasione dell'evento, i leader dei due paesi interverranno con discorsi e artisti cinesi e italiani presenteranno congiuntamente uno spettacolo che fonde l'essenza culturale d'Oriente e d'Occidente. Durante l'evento si terranno anche una mostra fotografica sul patrimonio culturale Cina-Italia e un forum culturale bilaterale. Si invitano tutte le persone interessate a iscriversi per partecipare.",
  },
};

function detectTerms(text: string, lang: Lang): TermItem[] {
  const detected: TermItem[] = [];
  const lowerText = text.toLowerCase();
  for (const term of mockTerms) {
    const keyword = lang === "zh" ? term.zh : term.it;
    if (lowerText.includes(keyword.toLowerCase())) {
      detected.push(term);
    }
  }
  return detected;
}

function highlightTerms(text: string, lang: Lang, terms: TermItem[]): React.ReactNode {
  if (terms.length === 0) return text;

  const keywords = terms.map((t) => (lang === "zh" ? t.zh : t.it));
  const regex = new RegExp(`(${keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");

  const parts = text.split(regex);
  return parts.map((part, i) => {
    const match = terms.find((t) => {
      const kw = lang === "zh" ? t.zh : t.it;
      return kw.toLowerCase() === part.toLowerCase();
    });
    if (match) {
      return (
        <span
          key={i}
          className={cn(
            "inline-block px-1.5 py-0.5 rounded border font-medium",
            categoryColors[match.category] || categoryColors.general
          )}
          title={`${match.zh} ↔ ${match.it}`}
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function mockTranslate(
  text: string,
  source: Lang,
  target: Lang,
  _domain: Domain
): Promise<{ text: string; confidence: number; terms: TermItem[] }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const detected = detectTerms(text, source);
      let translated = text;
      for (const term of detected) {
        const from = source === "zh" ? term.zh : term.it;
        const to = target === "zh" ? term.zh : term.it;
        translated = translated.replace(new RegExp(from, "g"), to);
      }
      if (source === "zh" && target === "it") {
        translated =
          translated +
          " [Traduzione automatica - questa è una dimostrazione]";
      } else if (source === "it" && target === "zh") {
        translated = translated + " [机器翻译 - 此为演示结果]";
      }
      const confidence = 75 + Math.floor(Math.random() * 20);
      resolve({ text: translated, confidence, terms: detected });
    }, 1000);
  });
}

function generateTicketId(): string {
  return `PL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function formatTime(date: Date): string {
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function domainToScene(domain: Domain): SceneLabel {
  switch (domain) {
    case "medical": return "medical";
    case "legal": return "legal";
    case "education": return "education";
    case "economic":
    case "diplomatic": return "general";
    default: return "general";
  }
}

function applyTermSuggestions(text: string, terms: TermItem[], inconsistent: TermItem[], source: Lang, target: Lang): string {
  let result = text;
  for (const term of inconsistent) {
    const from = target === "zh" ? term.zh : term.it;
    const to = source === "zh" ? term.zh : term.it;
    result = result.replace(new RegExp(from, "g"), to);
  }
  return result;
}

function computeDiff(a: string, b: string): { original: React.ReactNode; modified: React.ReactNode } {
  const aChars = a.split("");
  const bChars = b.split("");
  return {
    original: aChars.map((ch, i) => (
      <span
        key={i}
        className={bChars[i] !== ch ? "bg-rose-200 line-through decoration-rose-400" : ""}
      >
        {ch}
      </span>
    )),
    modified: bChars.map((ch, i) => (
      <span
        key={i}
        className={aChars[i] !== ch ? "bg-emerald-200 font-medium text-emerald-900" : ""}
      >
        {ch}
      </span>
    )),
  };
}

export default function Translate() {
  const navigate = useNavigate();
  const appLang = useAppStore((s) => s.lang);
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const translateHistory = useAppStore((s) => s.translateHistory);
  const addTranslateHistory = useAppStore((s) => s.addTranslateHistory);
  const polishRecords = useAppStore((s) => s.polishRecords);
  const addPolishRecord = useAppStore((s) => s.addPolishRecord);
  const updatePolishRecord = useAppStore((s) => s.updatePolishRecord);
  const user = useAppStore((s) => s.user);
  const setLoginModalOpen = useAppStore((s) => s.setLoginModalOpen);

  const [sourceLang, setSourceLang] = useState<Lang>("zh");
  const [targetLang, setTargetLang] = useState<Lang>("it");
  const [domain, setDomain] = useState<Domain>("general");

  const [sourceText, setSourceText] = useState("");
  const [targetText, setTargetText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [terminology, setTerminology] = useState<TermItem[]>([]);
  const [confidence, setConfidence] = useState<number | null>(null);

  const [copied, setCopied] = useState(false);
  const [versionTab, setVersionTab] = useState<"machine" | "polished">("machine");
  const [polishedText, setPolishedText] = useState("");
  const [showHistory, setShowHistory] = useState(true);

  const [termScore, setTermScore] = useState<number | null>(null);
  const [inconsistentTerms, setInconsistentTerms] = useState<TermItem[]>([]);

  const [polishStep, setPolishStep] = useState<PolishStep>(1);
  const [polishDocType, setPolishDocType] = useState<DocTemplate | "">("");
  const [polishRequirement, setPolishRequirement] = useState("");
  const [polishUrgency, setPolishUrgency] = useState<Urgency>("normal");
  const [polishTicketId, setPolishTicketId] = useState("");
  const [polishSubmitTime, setPolishSubmitTime] = useState("");
  const [polishReviewComment, setPolishReviewComment] = useState("");
  const [polishAdopted, setPolishAdopted] = useState(false);
  const [activePolishRecordId, setActivePolishRecordId] = useState<string | null>(null);

  const [copiedTermId, setCopiedTermId] = useState<string | null>(null);
  const [expandedPolishId, setExpandedPolishId] = useState<string | null>(null);
  const [showPolishRecords, setShowPolishRecords] = useState(true);
  const [showLoginHint, setShowLoginHint] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxChars = 5000;
  const charCount = sourceText.length;

  const swapLanguages = () => {
    const tmpLang = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tmpLang);
    const tmpText = sourceText;
    setSourceText(targetText);
    setTargetText(tmpText);
    setTerminology(detectTerms(targetText, targetLang));
  };

  const runTermConsistencyCheck = useCallback(
    (terms: TermItem[]) => {
      const score = 85 + Math.floor(Math.random() * 14);
      setTermScore(score);
      const inconsistent = terms.filter(() => Math.random() < 0.2);
      setInconsistentTerms(inconsistent);
    },
    []
  );

  const handleTranslate = async () => {
    if (!sourceText.trim() || isTranslating) return;
    setIsTranslating(true);
    setTargetText("");
    setConfidence(null);
    setTerminology([]);
    setTermScore(null);
    setInconsistentTerms([]);
    setPolishStep(1);
    setPolishAdopted(false);
    setPolishedText("");
    setActivePolishRecordId(null);
    try {
      const res = await mockTranslate(sourceText, sourceLang, targetLang, domain);
      setTargetText(res.text);
      setConfidence(res.confidence);
      setTerminology(res.terms);
      runTermConsistencyCheck(res.terms);

      if (user) {
        addTranslateHistory({
          sourceText,
          targetText: res.text,
          source: sourceLang,
          target: targetLang,
          scene: domainToScene(domain),
          userId: user.id,
        });
      } else {
        setShowLoginHint(true);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const handleClear = () => {
    setSourceText("");
    setTargetText("");
    setConfidence(null);
    setTerminology([]);
    setTermScore(null);
    setInconsistentTerms([]);
    setPolishStep(1);
    setPolishAdopted(false);
    setPolishedText("");
    setPolishDocType("");
    setPolishRequirement("");
    setPolishUrgency("normal");
    setPolishReviewComment("");
    setActivePolishRecordId(null);
    setShowLoginHint(false);
  };

  const handleCopy = async () => {
    if (!targetText) return;
    await navigator.clipboard.writeText(targetText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyTerm = async (term: TermItem) => {
    const text = `${term.zh} ↔ ${term.it}`;
    await navigator.clipboard.writeText(text);
    setCopiedTermId(term.id);
    setTimeout(() => setCopiedTermId(null), 1500);
  };

  const handleApplyTermSuggestions = () => {
    if (inconsistentTerms.length === 0) return;
    const applied = applyTermSuggestions(targetText, terminology, inconsistentTerms, sourceLang, targetLang);
    setTargetText(applied);
    setInconsistentTerms([]);
    setTermScore((prev) => (prev !== null ? Math.min(prev + 5, 99) : null));
  };

  const handleFavorite = () => {
    const id = `trans-${Date.now()}`;
    toggleFavorite(id);
  };

  const isFavorited = useMemo(() => {
    return favorites.some((id) => id.startsWith("trans-"));
  }, [favorites]);

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setSourceText(content.slice(0, maxChars));
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const applyTemplate = (tpl: DocTemplate) => {
    const template = docTemplates[tpl];
    if (sourceLang === "zh") {
      setSourceText(template.zh);
    } else {
      setSourceText(template.it);
    }
  };

  const handlePolishSubmit = () => {
    if (!targetText || !polishDocType) return;
    const ticketId = generateTicketId();
    const now = new Date();
    setPolishTicketId(ticketId);
    setPolishSubmitTime(formatTime(now));
    setPolishStep(2);

    const recordId = `pw-local-${Date.now()}`;
    setActivePolishRecordId(recordId);

    if (user) {
      addPolishRecord({
        ticketId,
        sourceText,
        translatedText: targetText,
        docType: polishDocType,
        urgency: polishUrgency,
        requirement: polishRequirement,
        submitter: user.nameZh || user.email,
        termScore: termScore ?? undefined,
        inconsistentTerms: inconsistentTerms.map((t) => t.zh),
      });
    }
  };

  useEffect(() => {
    if (polishStep !== 2) return;
    const timer = setTimeout(() => {
      const improved =
        targetText +
        (appLang === "zh"
          ? "\n\n[专业译员已润色：修正术语一致性，优化句式流畅度，确保译文专业规范]"
          : "\n\n[Revisionato da traduttore professionista: coerenza terminologica corretta, fluidità delle frasi migliorata, traduzione professionale garantita]");
      setPolishedText(improved);
      setPolishReviewComment(
        appLang === "zh"
          ? "译文整体准确，但部分术语需要统一，已修正3处术语不一致，优化了2处句式表达。建议后续翻译统一使用标准术语库。"
          : "La traduzione è generalmente accurata, ma alcuni termini devono essere unificati. Ho corretto 3 incongruenze terminologiche e migliorato 2 espressioni. Si consiglia di utilizzare la terminologia standardizzata per traduzioni future."
      );
      setPolishStep(3);

      if (user && activePolishRecordId) {
        const matchingRecord = polishRecords.find(
          (r) => r.ticketId === polishTicketId
        );
        if (matchingRecord) {
          updatePolishRecord(matchingRecord.id, {
            status: "completed",
            polishedText: improved,
            reviewer: "李雯（高级译员）",
            reviewTime: formatTime(new Date()),
            reviewComment: appLang === "zh"
              ? "译文整体准确，但部分术语需要统一，已修正3处术语不一致，优化了2处句式表达。建议后续翻译统一使用标准术语库。"
              : "La traduzione è generalmente accurata, ma alcuni termini devono essere unificati.",
          });
        }
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [polishStep, targetText, appLang, user, activePolishRecordId, polishTicketId, polishRecords, updatePolishRecord]);

  const handleAdoptPolish = () => {
    setPolishAdopted(true);
    if (user && activePolishRecordId) {
      const matchingRecord = polishRecords.find(
        (r) => r.ticketId === polishTicketId
      );
      if (matchingRecord) {
        updatePolishRecord(matchingRecord.id, {
          status: "completed",
        });
      }
    }
  };

  const handleDownloadReport = () => {
    const lines: string[] = [];
    lines.push(appLang === "zh" ? "术语一致性校验报告" : "Rapporto di Verifica Coerenza Terminologica");
    lines.push("=".repeat(40));
    lines.push("");
    lines.push(
      appLang === "zh" ? `术语一致性评分：${termScore}%` : `Punteggio coerenza terminologica: ${termScore}%`
    );
    lines.push("");
    lines.push(appLang === "zh" ? "检测到的术语：" : "Termini rilevati:");
    for (const t of terminology) {
      lines.push(`  - ${t.zh} ↔ ${t.it}  [${t.category}]`);
      if (t.exampleZh) lines.push(`    例句(ZH): ${t.exampleZh}`);
      if (t.exampleIt) lines.push(`    例句(IT): ${t.exampleIt}`);
    }
    if (inconsistentTerms.length > 0) {
      lines.push("");
      lines.push(appLang === "zh" ? "⚠ 不一致警告：" : "⚠ Avvisi di incongruenza:");
      for (const t of inconsistentTerms) {
        lines.push(`  - ${t.zh} ↔ ${t.it}`);
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `term-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReTranslate = (record: TranslationHistoryItem) => {
    setSourceLang(record.source);
    setTargetLang(record.target);
    setSourceText(record.sourceText);
    setTargetText("");
    setConfidence(null);
    setTerminology([]);
    setTermScore(null);
    setInconsistentTerms([]);
    setPolishStep(1);
    setPolishAdopted(false);
    setPolishedText("");
    setShowLoginHint(false);
  };

  const renderTripleDiff = () => {
    if (!polishedText) return null;
    const { original: diffOrig, modified: diffPolished } = computeDiff(targetText, polishedText);
    return (
      <div className="space-y-3">
        <div>
          <div className="text-xs font-medium text-charcoal-500 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            {appLang === "zh" ? "原文" : "Testo originale"}
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-sm text-charcoal-700 leading-relaxed whitespace-pre-wrap">{sourceText}</p>
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-charcoal-500 mb-1.5 flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5" />
            {appLang === "zh" ? "机器翻译" : "Traduzione automatica"}
          </div>
          <div className="p-3 bg-rose-50/50 border border-rose-200/50 rounded-lg">
            <p className="text-sm text-charcoal-700 leading-relaxed whitespace-pre-wrap">{diffOrig}</p>
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-charcoal-500 mb-1.5 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" />
            {appLang === "zh" ? "润色后版本" : "Versione revisionata"}
          </div>
          <div className="p-3 bg-emerald-50/50 border border-emerald-200/50 rounded-lg">
            <p className="text-sm text-charcoal-700 leading-relaxed whitespace-pre-wrap">{diffPolished}</p>
          </div>
        </div>
      </div>
    );
  };

  const stepLabels = [
    { step: 1 as PolishStep, zh: "提交申请", it: "Invia richiesta" },
    { step: 2 as PolishStep, zh: "审核中", it: "In revisione" },
    { step: 3 as PolishStep, zh: "结果返回", it: "Risultato" },
  ];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-0 mb-6">
      {stepLabels.map((item, idx) => (
        <div key={item.step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-9 h-9 rounded-full text-sm font-semibold flex items-center justify-center transition-all",
                polishStep >= item.step
                  ? "bg-gradient-to-br from-warm-gold-500 to-warm-gold-600 text-white shadow-elegant"
                  : "bg-charcoal-100 text-charcoal-400"
              )}
            >
              {polishStep > item.step ? <Check className="w-4 h-4" /> : item.step}
            </div>
            <span
              className={cn(
                "text-xs mt-1.5 whitespace-nowrap",
                polishStep >= item.step ? "text-warm-gold-700 font-medium" : "text-charcoal-400"
              )}
            >
              {appLang === "zh" ? item.zh : item.it}
            </span>
          </div>
          {idx < stepLabels.length - 1 && (
            <div
              className={cn(
                "w-12 h-0.5 mx-2 mb-5 transition-all",
                polishStep > item.step ? "bg-warm-gold-500" : "bg-charcoal-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderPolishPanel = () => (
    <div className="bg-white rounded-2xl shadow-elegant border border-charcoal-100 overflow-hidden mb-6">
      <div className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-it-green-50/60 to-white">
        <div className="flex items-center gap-3">
          <UserCheck className="w-5 h-5 text-it-green-600" />
          <div className="text-left">
            <h3 className="font-semibold text-charcoal-800">
              {appLang === "zh" ? "人工润色工作流" : "Flusso di Revisione Umana"}
            </h3>
            {confidence !== null && confidence < 85 && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs text-amber-600">
                  {appLang === "zh"
                    ? "置信度低于 85%，建议申请人工润色以确保专业品质"
                    : "Confidenza inferiore all'85%, si consiglia la revisione umana"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 pt-3">
        {renderStepIndicator()}

        {polishStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                {appLang === "zh" ? "文档类型" : "Tipo di documento"}
              </label>
              <div className="flex gap-2 flex-wrap">
                {(["policy", "press", "event"] as DocTemplate[]).map((tpl) => {
                  const t = docTemplates[tpl];
                  const Icon = t.icon;
                  return (
                    <button
                      key={tpl}
                      onClick={() => setPolishDocType(tpl)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border transition-all",
                        polishDocType === tpl
                          ? "border-warm-gold-400 bg-warm-gold-50 text-warm-gold-800 shadow-sm"
                          : "border-charcoal-200 bg-white text-charcoal-600 hover:border-warm-gold-300"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {appLang === "zh" ? t.label.zh : t.label.it}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                {appLang === "zh" ? "润色要求" : "Requisiti di revisione"}
              </label>
              <textarea
                value={polishRequirement}
                onChange={(e) => setPolishRequirement(e.target.value)}
                placeholder={
                  appLang === "zh"
                    ? "请描述润色要求，例如：确保术语一致性、优化句式流畅度..."
                    : "Descrivi i requisiti di revisione, ad es.: garantire coerenza terminologica, migliorare la fluidità..."
                }
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-charcoal-200 bg-white focus:outline-none focus:ring-2 focus:ring-warm-gold-500/30 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                {appLang === "zh" ? "紧急程度" : "Urgenza"}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPolishUrgency("normal")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border transition-all",
                    polishUrgency === "normal"
                      ? "border-it-green-400 bg-it-green-50 text-it-green-800 shadow-sm"
                      : "border-charcoal-200 bg-white text-charcoal-600 hover:border-it-green-300"
                  )}
                >
                  <Clock className="w-4 h-4" />
                  {appLang === "zh" ? "普通" : "Normale"}
                </button>
                <button
                  onClick={() => setPolishUrgency("urgent")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border transition-all",
                    polishUrgency === "urgent"
                      ? "border-cn-red-400 bg-cn-red-50 text-cn-red-800 shadow-sm"
                      : "border-charcoal-200 bg-white text-charcoal-600 hover:border-cn-red-300"
                  )}
                >
                  <Zap className="w-4 h-4" />
                  {appLang === "zh" ? "加急" : "Urgente"}
                </button>
              </div>
            </div>

            {!user && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="text-blue-800 font-medium mb-1">
                    {appLang === "zh" ? "需要登录后才能提交润色申请" : "È necessario effettuare l'accesso per inviare una richiesta"}
                  </p>
                  <button
                    onClick={() => setLoginModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    {appLang === "zh" ? "立即登录" : "Accedi ora"}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={handlePolishSubmit}
                disabled={!targetText || !polishDocType || !user}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-lg transition-all bg-gradient-to-r from-it-green-600 to-it-green-700 text-white shadow-elegant hover:from-it-green-700 hover:to-it-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                {appLang === "zh" ? "提交润色申请" : "Invia richiesta di revisione"}
              </button>
            </div>
          </div>
        )}

        {polishStep === 2 && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-warm-ivory-50 border border-charcoal-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-charcoal-400">
                    {appLang === "zh" ? "工单号" : "Numero ticket"}
                  </span>
                  <p className="text-sm font-mono font-medium text-charcoal-800 mt-0.5">{polishTicketId}</p>
                </div>
                <div>
                  <span className="text-xs text-charcoal-400">
                    {appLang === "zh" ? "提交时间" : "Ora di invio"}
                  </span>
                  <p className="text-sm text-charcoal-800 mt-0.5">{polishSubmitTime}</p>
                </div>
                <div>
                  <span className="text-xs text-charcoal-400">
                    {appLang === "zh" ? "当前状态" : "Stato attuale"}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-sm text-amber-700 font-medium">
                      {appLang === "zh" ? "译员审核中" : "Revisione in corso"}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-charcoal-400">
                    {appLang === "zh" ? "预计完成时间" : "Tempo stimato"}
                  </span>
                  <p className="text-sm text-charcoal-800 mt-0.5">
                    {polishUrgency === "urgent"
                      ? appLang === "zh"
                        ? "约 15 分钟"
                        : "Circa 15 minuti"
                      : appLang === "zh"
                      ? "约 30 分钟"
                      : "Circa 30 minuti"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-charcoal-500">{appLang === "zh" ? "处理进度" : "Progresso"}</span>
                <span className="font-medium text-warm-gold-700">60%</span>
              </div>
              <div className="w-full h-2 bg-charcoal-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-warm-gold-400 to-warm-gold-600 rounded-full transition-all" style={{ width: "60%" }} />
              </div>
              <div className="flex items-center justify-between text-xs text-charcoal-400">
                <span>{appLang === "zh" ? "已接收" : "Ricevuto"}</span>
                <span className="text-warm-gold-600 font-medium">{appLang === "zh" ? "译员处理中" : "In lavorazione"}</span>
                <span>{appLang === "zh" ? "待完成" : "Da completare"}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-4 h-4 text-charcoal-500" />
                <span className="text-xs font-medium text-charcoal-600">
                  {appLang === "zh" ? "查询工单状态" : "Verifica stato ticket"}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  defaultValue={polishTicketId}
                  readOnly
                  className="flex-1 px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white font-mono text-charcoal-600"
                />
                <button className="px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white text-charcoal-600 hover:border-warm-gold-400 hover:text-warm-gold-700 transition-colors">
                  {appLang === "zh" ? "查询" : "Cerca"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center py-3">
              <div className="flex items-center gap-2 text-charcoal-400">
                <div className="w-4 h-4 border-2 border-warm-gold-500/30 border-t-warm-gold-500 rounded-full animate-spin" />
                <span className="text-sm">
                  {appLang === "zh" ? "译员审核中，请稍候..." : "Revisione in corso, attendere..."}
                </span>
              </div>
            </div>
          </div>
        )}

        {polishStep === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-warm-ivory-50 border border-charcoal-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-charcoal-400">
                    {appLang === "zh" ? "工单号" : "Numero ticket"}
                  </span>
                  <p className="text-sm font-mono font-medium text-charcoal-800 mt-0.5">{polishTicketId}</p>
                </div>
                <div>
                  <span className="text-xs text-charcoal-400">
                    {appLang === "zh" ? "当前状态" : "Stato attuale"}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm text-emerald-700 font-medium">
                      {appLang === "zh" ? "润色完成" : "Revisione completata"}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-charcoal-400">
                    {appLang === "zh" ? "完成时间" : "Completato il"}
                  </span>
                  <p className="text-sm text-charcoal-800 mt-0.5">{formatTime(new Date())}</p>
                </div>
              </div>
            </div>

            {renderTripleDiff()}

            {polishReviewComment && (
              <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {appLang === "zh" ? "译员审核意见" : "Parere del revisore"}
                  </span>
                </div>
                <p className="text-sm text-blue-700 leading-relaxed">{polishReviewComment}</p>
              </div>
            )}

            <div className="flex justify-end pt-2 gap-2">
              {polishAdopted ? (
                <div className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <Check className="w-4 h-4" />
                  {appLang === "zh" ? "已采纳润色结果" : "Risultato della revisione adottato"}
                </div>
              ) : (
                <button
                  onClick={handleAdoptPolish}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-lg transition-all bg-gradient-to-r from-warm-gold-500 to-warm-gold-600 text-white shadow-elegant hover:from-warm-gold-600 hover:to-warm-gold-700"
                >
                  <Check className="w-4 h-4" />
                  {appLang === "zh" ? "确认采纳润色结果" : "Conferma adozione"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderTermReport = () => {
    if (!targetText || termScore === null) return null;
    return (
      <div className="bg-white rounded-2xl shadow-elegant border border-charcoal-100 overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal-100 bg-gradient-to-r from-blue-50/50 to-white">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-charcoal-800">
              {appLang === "zh" ? "术语一致性校验报告" : "Rapporto di Verifica Coerenza Terminologica"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyTermSuggestions}
              disabled={inconsistentTerms.length === 0}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors",
                inconsistentTerms.length > 0
                  ? "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 shadow-sm"
                  : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {appLang === "zh" ? "一键应用术语建议" : "Applica suggerimenti"}
              </span>
            </button>
            <button
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-charcoal-200 bg-white text-charcoal-600 hover:border-blue-400 hover:text-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">
                {appLang === "zh" ? "下载报告" : "Scarica"}
              </span>
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-charcoal-600 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                {appLang === "zh" ? "术语一致性评分" : "Punteggio coerenza terminologica"}
              </span>
              <span
                className={cn(
                  "font-bold text-lg",
                  termScore >= 93
                    ? "text-emerald-600"
                    : termScore >= 88
                    ? "text-amber-600"
                    : "text-cn-red-600"
                )}
              >
                {termScore}%
              </span>
            </div>
            <div className="w-full h-3 bg-charcoal-100 rounded-full overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 w-[85%] border-r border-dashed border-slate-300" />
              <div className="absolute inset-y-0 left-0 w-[93%] border-r border-dashed border-slate-300" />
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700 relative z-10",
                  termScore >= 93
                    ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                    : termScore >= 88
                    ? "bg-gradient-to-r from-amber-400 to-amber-600"
                    : "bg-gradient-to-r from-cn-red-400 to-cn-red-600"
                )}
                style={{ width: `${termScore}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-charcoal-400">
              <span>0%</span>
              <span className="text-cn-red-500">{appLang === "zh" ? "需改进 85%" : "Migliora 85%"}</span>
              <span className="text-amber-500">{appLang === "zh" ? "良好 93%" : "Buono 93%"}</span>
              <span className="text-emerald-500">{appLang === "zh" ? "优秀 100%" : "Eccellente 100%"}</span>
            </div>
          </div>

          {inconsistentTerms.length > 0 && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <span className="text-sm font-medium text-amber-800">
                    {appLang === "zh"
                      ? `检测到 ${inconsistentTerms.length} 处术语不一致，建议修正`
                      : `Rilevate ${inconsistentTerms.length} incongruenze terminologiche`}
                  </span>
                  <p className="text-xs text-amber-600">
                    {appLang === "zh"
                      ? "点击上方「一键应用术语建议」可自动修正"
                      : "Fai clic su \"Applica suggerimenti\" per correggere automaticamente"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {inconsistentTerms.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-start gap-3 p-2.5 rounded-md bg-white border border-amber-100"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">{t.zh}</span>
                        <span className="text-amber-400">↔</span>
                        <span className="font-medium text-sm text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">{t.it}</span>
                        <span
                          className={cn(
                            "inline-flex items-center px-1.5 py-0.5 text-[10px] rounded border",
                            categoryColors[t.category] || categoryColors.general
                          )}
                        >
                          {domainLabels[t.category as Domain]?.[appLang] || t.category}
                        </span>
                      </div>
                      <p className="text-xs text-amber-700 mt-1.5">
                        {appLang === "zh"
                          ? "💡 建议：译文中该术语的翻译与标准术语库存在差异，请统一使用标准译法"
                          : "💡 Suggerimento: la traduzione differisce dalla terminologia standard"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {terminology.length > 0 && (
            <div>
              <div className="text-sm font-medium text-charcoal-700 mb-2 flex items-center gap-1.5">
                <Search className="w-4 h-4" />
                {appLang === "zh" ? `检测到的术语对（${terminology.length} 个）· 点击可复制` : `Termini rilevati (${terminology.length}) · Clicca per copiare`}
              </div>
              <div className="space-y-2">
                {terminology.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleCopyTerm(t)}
                    className={cn(
                      "w-full flex flex-col sm:flex-row sm:items-start gap-2 p-3 rounded-lg text-left transition-all group",
                      copiedTermId === t.id
                        ? "bg-emerald-50 border-2 border-emerald-300"
                        : "bg-warm-ivory-50/50 border border-charcoal-100 hover:border-warm-gold-300 hover:bg-warm-gold-50/50"
                    )}
                  >
                    <div className="flex items-center gap-2 shrink-0 flex-1">
                      <span className="font-medium text-charcoal-800 text-sm">{t.zh}</span>
                      <span className="opacity-40">↔</span>
                      <span className="text-charcoal-700 text-sm">{t.it}</span>
                      <span
                        className={cn(
                          "inline-flex items-center px-1.5 py-0.5 text-xs rounded border",
                          categoryColors[t.category] || categoryColors.general
                        )}
                      >
                        {domainLabels[t.category as Domain]?.[appLang] || t.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 sm:pl-4 sm:border-l sm:border-charcoal-100">
                      {copiedTermId === t.id ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <Check className="w-3.5 h-3.5" />
                          {appLang === "zh" ? "已复制" : "Copiato"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-charcoal-400 group-hover:text-warm-gold-600">
                          <Copy className="w-3.5 h-3.5" />
                          {appLang === "zh" ? "复制" : "Copia"}
                        </span>
                      )}
                    </div>
                    {(t.exampleZh || t.exampleIt) && (
                      <div className="text-xs text-charcoal-500 w-full pt-2 border-t border-charcoal-100 sm:border-t-0 sm:pt-0 sm:border-l sm:pl-3 sm:mt-0 col-span-full">
                        {t.exampleZh && (
                          <p className="mb-0.5">
                            <span className="text-charcoal-400">ZH:</span> {t.exampleZh}
                          </p>
                        )}
                        {t.exampleIt && (
                          <p>
                            <span className="text-charcoal-400">IT:</span> {t.exampleIt}
                          </p>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {terminology.length === 0 && (
            <div className="text-center py-6 text-charcoal-400 text-sm">
              {appLang === "zh" ? "未检测到专业术语" : "Nessun termine specializzato rilevato"}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHistoryPanel = () => (
    <div className="bg-white rounded-2xl shadow-elegant border border-charcoal-100 overflow-hidden mb-6">
      <button
        onClick={() => setShowHistory((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-warm-ivory-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-charcoal-500" />
          <h3 className="font-semibold text-charcoal-800">
            {appLang === "zh" ? "翻译历史" : "Cronologia traduzioni"}
          </h3>
          {translateHistory.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-charcoal-100 text-charcoal-500">
              {translateHistory.length}
            </span>
          )}
        </div>
        {showHistory ? (
          <ChevronUp className="w-5 h-5 text-charcoal-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-charcoal-400" />
        )}
      </button>

      {showHistory && (
        <div className="px-5 pb-5">
          {!user ? (
            <div className="text-center py-8 px-4">
              <History className="w-10 h-10 mx-auto mb-3 text-charcoal-300" />
              <p className="text-sm text-charcoal-500 mb-3">
                {appLang === "zh" ? "登录后可查看和保存翻译历史记录" : "Accedi per visualizzare e salvare la cronologia"}
              </p>
              <button
                onClick={() => setLoginModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-warm-gold-500 to-warm-gold-600 text-white shadow-elegant hover:from-warm-gold-600 hover:to-warm-gold-700 transition-all"
              >
                <LogIn className="w-4 h-4" />
                {appLang === "zh" ? "登录查看历史" : "Accedi per vedere"}
              </button>
            </div>
          ) : translateHistory.length === 0 ? (
            <div className="text-center py-6 text-charcoal-400 text-sm">
              {appLang === "zh" ? "暂无翻译记录" : "Nessuna traduzione registrata"}
            </div>
          ) : (
            <div className="space-y-3">
              {translateHistory.map((record) => {
                const scene = (record.scene as SceneLabel) || "general";
                const sceneInfo = sceneLabels[scene] || sceneLabels.general;
                const SceneIcon = sceneInfo.icon;
                return (
                  <div
                    key={record.id}
                    className="rounded-xl border border-charcoal-100 bg-warm-ivory-50/30 overflow-hidden hover:border-warm-gold-200 transition-colors"
                  >
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-charcoal-100/50 bg-white/50">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                          <Languages className="w-3 h-3 text-slate-500" />
                          <span className="text-[11px] font-medium text-slate-700">
                            {langLabels[record.source][appLang]} → {langLabels[record.target][appLang]}
                          </span>
                        </div>
                        <div className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-md border",
                          sceneInfo.color
                        )}>
                          <SceneIcon className="w-3 h-3" />
                          <span className="text-[11px] font-medium">
                            {sceneInfo[appLang]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-charcoal-400">
                          <Clock className="w-3 h-3" />
                          <span>{record.timestamp}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleReTranslate(record)}
                        className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-charcoal-200 bg-white text-charcoal-600 hover:border-warm-gold-400 hover:text-warm-gold-700 hover:bg-warm-gold-50 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {appLang === "zh" ? "再次翻译" : "Ripeti"}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x divide-charcoal-100">
                      <div className="p-4">
                        <div className="text-[10px] font-medium text-charcoal-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            record.source === "zh" ? "bg-cn-red-500" : "bg-it-green-500"
                          )} />
                          {appLang === "zh" ? "原文" : "Originale"} · {langLabels[record.source][appLang]}
                        </div>
                        <p className="text-sm text-charcoal-700 leading-relaxed line-clamp-3">
                          {record.sourceText}
                        </p>
                      </div>
                      <div className="p-4 bg-warm-ivory-50/30">
                        <div className="text-[10px] font-medium text-charcoal-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            record.target === "zh" ? "bg-cn-red-500" : "bg-it-green-500"
                          )} />
                          {appLang === "zh" ? "译文" : "Traduzione"} · {langLabels[record.target][appLang]}
                        </div>
                        <p className="text-sm text-charcoal-700 leading-relaxed line-clamp-3">
                          {record.targetText}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderPolishRecordsPanel = () => {
    const visibleRecords = user ? polishRecords : [];
    return (
      <div className="bg-white rounded-2xl shadow-elegant border border-charcoal-100 overflow-hidden mb-6">
        <button
          onClick={() => setShowPolishRecords((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-warm-ivory-50/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-charcoal-500" />
            <h3 className="font-semibold text-charcoal-800">
              {appLang === "zh" ? "历史留痕复查 · 润色工单记录" : "Cronologia Richieste di Revisione"}
            </h3>
            {visibleRecords.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-charcoal-100 text-charcoal-500">
                {visibleRecords.length}
              </span>
            )}
          </div>
          {showPolishRecords ? (
            <ChevronUp className="w-5 h-5 text-charcoal-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-charcoal-400" />
          )}
        </button>

        {showPolishRecords && (
          <div className="px-5 pb-5">
            {!user ? (
              <div className="text-center py-8 px-4">
                <History className="w-10 h-10 mx-auto mb-3 text-charcoal-300" />
                <p className="text-sm text-charcoal-500 mb-3">
                  {appLang === "zh" ? "登录后可查看历史润色工单记录" : "Accedi per visualizzare le richieste di revisione"}
                </p>
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-warm-gold-500 to-warm-gold-600 text-white shadow-elegant hover:from-warm-gold-600 hover:to-warm-gold-700 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  {appLang === "zh" ? "登录查看工单" : "Accedi per vedere"}
                </button>
              </div>
            ) : visibleRecords.length === 0 ? (
              <div className="text-center py-6 text-charcoal-400 text-sm">
                {appLang === "zh" ? "暂无润色工单记录" : "Nessuna richiesta di revisione"}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleRecords.map((record) => {
                  const isExpanded = expandedPolishId === record.id;
                  const statusConfig = {
                    submitted: { zh: "已提交", it: "Inviato", color: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-500" },
                    reviewing: { zh: "审核中", it: "In revisione", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500 animate-pulse" },
                    completed: { zh: "已完成", it: "Completato", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
                    rejected: { zh: "已拒绝", it: "Rifiutato", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
                  }[record.status] || { zh: record.status, it: record.status, color: "bg-slate-100", dot: "bg-slate-500" };

                  const docTypeLabels: Record<string, { zh: string; it: string }> = {
                    policy: { zh: "政策文件", it: "Documento politico" },
                    press: { zh: "新闻稿", it: "Comunicato stampa" },
                    event: { zh: "活动通告", it: "Avviso di evento" },
                  };
                  const docTypeLabel = docTypeLabels[record.docType]?.[appLang] || record.docType;

                  return (
                    <div
                      key={record.id}
                      className="rounded-xl border border-charcoal-100 overflow-hidden bg-white"
                    >
                      <button
                        onClick={() => setExpandedPolishId(isExpanded ? null : record.id)}
                        className="w-full flex items-start gap-3 p-4 hover:bg-warm-ivory-50/50 transition-colors text-left"
                      >
                        <div className="shrink-0 mt-0.5">
                          <div className={cn(
                            "flex items-center gap-1.5 px-2 py-0.5 rounded-md border",
                            statusConfig.color
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig.dot)} />
                            <span className="text-[11px] font-medium">{statusConfig[appLang]}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-mono text-charcoal-500 bg-charcoal-100 px-1.5 py-0.5 rounded">
                              {record.ticketId}
                            </span>
                            <span className="text-xs text-charcoal-400">·</span>
                            <span className="text-xs text-charcoal-600">{docTypeLabel}</span>
                            {record.urgency === "urgent" && (
                              <>
                                <span className="text-xs text-charcoal-400">·</span>
                                <span className="text-xs text-cn-red-600 font-medium flex items-center gap-0.5">
                                  <Zap className="w-3 h-3" />
                                  {appLang === "zh" ? "加急" : "Urgente"}
                                </span>
                              </>
                            )}
                            {record.termScore !== undefined && (
                              <>
                                <span className="text-xs text-charcoal-400">·</span>
                                <span className={cn(
                                  "text-xs font-medium",
                                  record.termScore >= 93 ? "text-emerald-600" :
                                  record.termScore >= 88 ? "text-amber-600" : "text-cn-red-600"
                                )}>
                                  {appLang === "zh" ? `术语 ${record.termScore}%` : `Termini ${record.termScore}%`}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-sm text-charcoal-700 line-clamp-2 mb-1">
                            {record.sourceText}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-charcoal-400">
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              {record.submitter}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {record.submitTime}
                            </span>
                            {record.reviewer && (
                              <span className="flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                {record.reviewer}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={cn(
                          "w-5 h-5 text-charcoal-400 shrink-0 mt-1 transition-transform",
                          isExpanded && "rotate-90"
                        )} />
                      </button>

                      {isExpanded && (
                        <div className="border-t border-charcoal-100 p-4 bg-warm-ivory-50/30 space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-2.5 rounded-lg bg-white border border-charcoal-100">
                              <span className="text-[10px] text-charcoal-400 uppercase tracking-wider block mb-1">
                                {appLang === "zh" ? "提交人" : "Richiedente"}
                              </span>
                              <p className="text-xs font-medium text-charcoal-700 truncate">{record.submitter}</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-white border border-charcoal-100">
                              <span className="text-[10px] text-charcoal-400 uppercase tracking-wider block mb-1">
                                {appLang === "zh" ? "提交时间" : "Inviato il"}
                              </span>
                              <p className="text-xs font-medium text-charcoal-700">{record.submitTime}</p>
                            </div>
                            {record.reviewer && (
                              <div className="p-2.5 rounded-lg bg-white border border-charcoal-100">
                                <span className="text-[10px] text-charcoal-400 uppercase tracking-wider block mb-1">
                                  {appLang === "zh" ? "审核译员" : "Revisore"}
                                </span>
                                <p className="text-xs font-medium text-charcoal-700 truncate">{record.reviewer}</p>
                              </div>
                            )}
                            {record.reviewTime && (
                              <div className="p-2.5 rounded-lg bg-white border border-charcoal-100">
                                <span className="text-[10px] text-charcoal-400 uppercase tracking-wider block mb-1">
                                  {appLang === "zh" ? "完成时间" : "Completato il"}
                                </span>
                                <p className="text-xs font-medium text-charcoal-700">{record.reviewTime}</p>
                              </div>
                            )}
                          </div>

                          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <FileText className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-xs font-medium text-slate-700">
                                {appLang === "zh" ? "润色要求" : "Requisiti"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {record.requirement || "-"}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div className="p-3 rounded-lg border border-charcoal-100 bg-white">
                              <span className="text-[10px] font-medium text-charcoal-400 uppercase tracking-wider block mb-1">
                                {appLang === "zh" ? "原文" : "Originale"}
                              </span>
                              <p className="text-xs text-charcoal-700 leading-relaxed whitespace-pre-wrap">
                                {record.sourceText}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg border border-charcoal-100 bg-white">
                              <span className="text-[10px] font-medium text-charcoal-400 uppercase tracking-wider block mb-1">
                                {appLang === "zh" ? "机器翻译" : "Traduzione automatica"}
                              </span>
                              <p className="text-xs text-charcoal-700 leading-relaxed whitespace-pre-wrap">
                                {record.translatedText}
                              </p>
                            </div>
                            {record.polishedText && (
                              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/30">
                                <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider block mb-1">
                                  {appLang === "zh" ? "润色后版本" : "Versione revisionata"}
                                </span>
                                <p className="text-xs text-charcoal-700 leading-relaxed whitespace-pre-wrap">
                                  {record.polishedText}
                                </p>
                              </div>
                            )}
                          </div>

                          {record.reviewComment && (
                            <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-200/50">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-xs font-medium text-blue-800">
                                  {appLang === "zh" ? "译员审核意见" : "Parere del revisore"}
                                </span>
                              </div>
                              <p className="text-xs text-blue-700 leading-relaxed">{record.reviewComment}</p>
                            </div>
                          )}

                          {record.inconsistentTerms && record.inconsistentTerms.length > 0 && (
                            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                <span className="text-xs font-medium text-amber-800">
                                  {appLang === "zh" ? "不一致术语（修正前）" : "Termini incoerenti (prima)"}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {record.inconsistentTerms.map((t, i) => (
                                  <span key={i} className="text-[11px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="pt-2 border-t border-charcoal-100">
                            <div className="flex items-center gap-2 text-[11px] text-charcoal-500">
                              <div className="flex-1 h-px bg-charcoal-100" />
                              <span>{appLang === "zh" ? "工单流转记录" : "Tracciamento ticket"}</span>
                              <div className="flex-1 h-px bg-charcoal-100" />
                            </div>
                            <div className="mt-3 space-y-2 pl-2 border-l-2 border-charcoal-100">
                              <div className="relative pl-4">
                                <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                                <p className="text-xs text-charcoal-700 font-medium">
                                  {appLang === "zh" ? "工单创建" : "Ticket creato"}
                                </p>
                                <p className="text-[11px] text-charcoal-400 mt-0.5">
                                  {record.submitter} · {record.submitTime}
                                </p>
                              </div>
                              {record.status !== "submitted" && (
                                <div className="relative pl-4">
                                  <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-white" />
                                  <p className="text-xs text-charcoal-700 font-medium">
                                    {appLang === "zh" ? "译员接单审核" : "Revisore assegnato"}
                                  </p>
                                  <p className="text-[11px] text-charcoal-400 mt-0.5">
                                    {record.reviewer || (appLang === "zh" ? "系统自动分配" : "Assegnazione automatica")}
                                    {record.reviewTime ? ` · ${record.reviewTime}` : ""}
                                  </p>
                                </div>
                              )}
                              {record.status === "completed" && (
                                <div className="relative pl-4">
                                  <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white" />
                                  <p className="text-xs text-charcoal-700 font-medium">
                                    {appLang === "zh" ? "润色完成" : "Revisione completata"}
                                  </p>
                                  <p className="text-[11px] text-charcoal-400 mt-0.5">
                                    {record.reviewer || "-"} · {record.reviewTime || "-"}
                                  </p>
                                </div>
                              )}
                              {record.status === "rejected" && (
                                <div className="relative pl-4">
                                  <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                                  <p className="text-xs text-red-700 font-medium">
                                    {appLang === "zh" ? "工单已拒绝" : "Richiesta rifiutata"}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-ivory-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="section-title mb-3">
            {appLang === "zh" ? "智能互译" : "Traduzione Intelligente"}
          </h1>
          <p className="text-charcoal-500 max-w-xl mx-auto">
            {appLang === "zh"
              ? "中意双语专业翻译引擎，支持术语校验、人工润色工作流与翻译留痕"
              : "Motore di traduzione professionale bilingue cinese-italiano, con verifica terminologica, flusso di revisione umana e tracciabilità"}
          </p>
        </div>

        {user?.role === "translator" && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-semibold text-emerald-800 text-sm">
                  {appLang === "zh" ? "欢迎回来，专业译员" : "Bentornato, traduttore professionista"}
                </h4>
                <p className="text-xs text-emerald-600">
                  {appLang === "zh"
                    ? `登录账号：${user.nameZh || user.email}`
                    : `Account: ${user.nameIt || user.email}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/profile?tab=dashboard-translator")}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-elegant hover:from-emerald-700 hover:to-teal-700"
            >
              <LayoutDashboard className="w-4 h-4" />
              {appLang === "zh" ? "前往译员工作台" : "Vai alla dashboard"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {showLoginHint && !user && targetText && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                <LogIn className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-800 text-sm mb-0.5">
                  {appLang === "zh" ? "登录后可保存翻译历史和申请人工润色" : "Accedi per salvare la cronologia e richiedere la revisione umana"}
                </h4>
                <p className="text-xs text-blue-600">
                  {appLang === "zh"
                    ? "登录账号即可享受云端历史同步、专业译员润色、工单追踪等完整服务"
                    : "Sincronizzazione cloud, revisione di traduttori professionisti, tracciamento richieste"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowLoginHint(false)}
                className="p-2 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-100/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLoginModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-lg transition-all bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-elegant hover:from-blue-700 hover:to-indigo-700"
              >
                <LogIn className="w-4 h-4" />
                {appLang === "zh" ? "立即登录" : "Accedi ora"}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {(["policy", "press", "event"] as DocTemplate[]).map((tpl) => {
            const t = docTemplates[tpl];
            const Icon = t.icon;
            return (
              <button
                key={tpl}
                onClick={() => applyTemplate(tpl)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-charcoal-200 bg-white text-charcoal-600 hover:border-warm-gold-400 hover:text-warm-gold-700 hover:bg-warm-gold-50 transition-all"
              >
                <Icon className="w-3.5 h-3.5" />
                {appLang === "zh" ? t.label.zh : t.label.it}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-elegant border border-charcoal-100 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal-100 bg-gradient-to-r from-warm-ivory-50/80 to-white">
              <div className="flex items-center gap-3">
                <Languages className="w-4 h-4 text-cn-red-600" />
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value as Lang)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-charcoal-200 bg-white focus:outline-none focus:ring-2 focus:ring-warm-gold-500/30"
                >
                  <option value="zh">{langLabels.zh[appLang]}</option>
                  <option value="it">{langLabels.it[appLang]}</option>
                </select>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value as Domain)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-charcoal-200 bg-white focus:outline-none focus:ring-2 focus:ring-warm-gold-500/30"
                >
                  {Object.entries(domainLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label[appLang]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value.slice(0, maxChars))}
              placeholder={
                appLang === "zh"
                  ? "请输入需要翻译的文本，或将文档拖入此处..."
                  : "Inserisci il testo da tradurre, o trascina un documento qui..."
              }
              className="flex-1 min-h-[280px] p-5 resize-none text-base leading-relaxed focus:outline-none placeholder:text-charcoal-300"
            />

            <div className="flex items-center justify-between px-5 py-3 border-t border-charcoal-100 bg-warm-ivory-50/50">
              <span
                className={cn(
                  "text-xs",
                  charCount > maxChars * 0.9 ? "text-cn-red-600" : "text-charcoal-400"
                )}
              >
                {charCount} / {maxChars}
              </span>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md"
                  onChange={onFileChange}
                  className="hidden"
                />
                <button
                  onClick={handleFileUpload}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-charcoal-200 bg-white text-charcoal-600 hover:border-warm-gold-500/50 hover:text-warm-gold-700 transition-colors"
                >
                  <FileUp className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {appLang === "zh" ? "上传" : "Carica"}
                  </span>
                </button>
                <button
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-charcoal-200 bg-white text-charcoal-600 hover:border-cn-red-500/50 hover:text-cn-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {appLang === "zh" ? "清空" : "Svuota"}
                  </span>
                </button>
                <button
                  onClick={handleTranslate}
                  disabled={!sourceText.trim() || isTranslating}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                    "bg-gradient-to-r from-warm-gold-500 to-warm-gold-600 text-white shadow-elegant",
                    "hover:from-warm-gold-600 hover:to-warm-gold-700",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-warm-gold-500 disabled:hover:to-warm-gold-600"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  {isTranslating
                    ? appLang === "zh" ? "翻译中..." : "Traduzione..."
                    : appLang === "zh" ? "翻译" : "Traduci"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-elegant border border-charcoal-100 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal-100 bg-gradient-to-r from-white to-warm-ivory-50/80">
              <div className="flex items-center gap-3">
                <Languages className="w-4 h-4 text-it-green-600" />
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value as Lang)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-charcoal-200 bg-white focus:outline-none focus:ring-2 focus:ring-warm-gold-500/30"
                >
                  <option value="zh">{langLabels.zh[appLang]}</option>
                  <option value="it">{langLabels.it[appLang]}</option>
                </select>
              </div>
              <button
                onClick={swapLanguages}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-charcoal-200 bg-white text-charcoal-600 hover:border-warm-gold-500/50 hover:text-warm-gold-700 hover:bg-warm-gold-50 transition-all"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-h-[280px] p-5 overflow-auto">
              {isTranslating ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex items-center gap-2 text-charcoal-400">
                    <div className="w-5 h-5 border-2 border-warm-gold-500/30 border-t-warm-gold-500 rounded-full animate-spin" />
                    <span className="text-sm">
                      {appLang === "zh" ? "正在翻译..." : "Traduzione in corso..."}
                    </span>
                  </div>
                </div>
              ) : targetText ? (
                <p className="text-base leading-relaxed text-charcoal-700 whitespace-pre-wrap">
                  {highlightTerms(targetText, targetLang, terminology)}
                </p>
              ) : (
                <div className="flex items-center justify-center h-full text-charcoal-300 text-sm">
                  {appLang === "zh"
                    ? "翻译结果将显示在这里"
                    : "Il risultato della traduzione apparirà qui"}
                </div>
              )}
            </div>

            {targetText && (
              <div className="space-y-3 px-5 py-3 border-t border-charcoal-100 bg-warm-ivory-50/50">
                {confidence !== null && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-charcoal-500">
                        {appLang === "zh" ? "翻译置信度" : "Confidenza"}
                      </span>
                      <span
                        className={cn(
                          "font-medium",
                          confidence >= 85
                            ? "text-emerald-600"
                            : confidence >= 70
                            ? "text-amber-600"
                            : "text-cn-red-600"
                        )}
                      >
                        {confidence}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-charcoal-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          confidence >= 85
                            ? "bg-emerald-500"
                            : confidence >= 70
                            ? "bg-amber-500"
                            : "bg-cn-red-500"
                        )}
                        style={{ width: `${confidence}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={handleCopy}
                    disabled={!targetText}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-charcoal-200 bg-white text-charcoal-600 hover:border-warm-gold-500/50 hover:text-warm-gold-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                      {copied
                        ? appLang === "zh" ? "已复制" : "Copiato"
                        : appLang === "zh" ? "复制" : "Copia"}
                    </span>
                  </button>
                  <button
                    onClick={handleFavorite}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors",
                      isFavorited
                        ? "border-warm-gold-300 bg-warm-gold-50 text-warm-gold-700"
                        : "border-charcoal-200 bg-white text-charcoal-600 hover:border-warm-gold-500/50 hover:text-warm-gold-700"
                    )}
                  >
                    <Star
                      className={cn(
                        "w-4 h-4",
                        isFavorited ? "fill-warm-gold-500 text-warm-gold-500" : ""
                      )}
                    />
                    <span className="hidden sm:inline">
                      {appLang === "zh" ? "收藏" : "Preferiti"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {renderTermReport()}

        {targetText && renderPolishPanel()}

        {targetText && (
          <div className="bg-white rounded-2xl shadow-elegant border border-charcoal-100 overflow-hidden mb-6">
            <div className="flex items-center border-b border-charcoal-100">
              <button
                onClick={() => setVersionTab("machine")}
                className={cn(
                  "px-5 py-3 text-sm font-medium transition-colors border-b-2",
                  versionTab === "machine"
                    ? "border-warm-gold-500 text-warm-gold-700 bg-warm-gold-50/50"
                    : "border-transparent text-charcoal-500 hover:text-charcoal-700"
                )}
              >
                {appLang === "zh" ? "机器翻译" : "Traduzione automatica"}
              </button>
              <button
                onClick={() => setVersionTab("polished")}
                className={cn(
                  "px-5 py-3 text-sm font-medium transition-colors border-b-2",
                  versionTab === "polished"
                    ? "border-warm-gold-500 text-warm-gold-700 bg-warm-gold-50/50"
                    : "border-transparent text-charcoal-500 hover:text-charcoal-700"
                )}
              >
                {appLang === "zh" ? "人工润色" : "Revisione umana"}
              </button>
            </div>

            <div className="p-5">
              {versionTab === "machine" ? (
                <div>
                  <div className="text-xs text-charcoal-500 mb-2">
                    {appLang === "zh" ? "机器翻译版本（带术语高亮）" : "Versione automatica (con evidenziazione terminologica)"}
                  </div>
                  <p className="text-sm leading-relaxed text-charcoal-700 whitespace-pre-wrap">
                    {highlightTerms(targetText, targetLang, terminology)}
                  </p>
                  {terminology.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-charcoal-100">
                      <div className="text-xs text-charcoal-500 mb-2">
                        {appLang === "zh" ? "识别到的术语" : "Termini rilevati"}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {terminology.map((t) => (
                          <span
                            key={t.id}
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border",
                              categoryColors[t.category] || categoryColors.general
                            )}
                          >
                            <span>{t.zh}</span>
                            <span className="opacity-60">↔</span>
                            <span>{t.it}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {polishedText ? (
                    renderTripleDiff()
                  ) : (
                    <div className="text-center py-12 text-charcoal-400">
                      <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">
                        {appLang === "zh"
                          ? "暂无人工润色版本，请先提交润色申请"
                          : "Nessuna versione revisionata, invia prima una richiesta di revisione"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {renderPolishRecordsPanel()}

        {renderHistoryPanel()}
      </div>
    </div>
  );
}
