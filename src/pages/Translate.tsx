import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { useAppStore } from "@/store";
import type { TermItem } from "@/types";
import { mockTerms } from "@/data/mock";
import { cn } from "@/lib/utils";

type Lang = "zh" | "it";
type Domain = "general" | "diplomatic" | "economic" | "education" | "medical" | "legal";
type DocTemplate = "policy" | "press" | "event";
type PolishStep = 1 | 2 | 3;
type Urgency = "normal" | "urgent";

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

interface HistoryRecord {
  id: string;
  sourceText: string;
  targetText: string;
  source: Lang;
  target: Lang;
  timestamp: string;
}

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

export default function Translate() {
  const appLang = useAppStore((s) => s.lang);
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);

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
  const [showHistory, setShowHistory] = useState(false);

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

  const [history, setHistory] = useState<HistoryRecord[]>([]);

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
    try {
      const res = await mockTranslate(sourceText, sourceLang, targetLang, domain);
      setTargetText(res.text);
      setConfidence(res.confidence);
      setTerminology(res.terms);
      runTermConsistencyCheck(res.terms);
      const record: HistoryRecord = {
        id: `h-${Date.now()}`,
        sourceText: sourceText.slice(0, 80),
        targetText: res.text.slice(0, 80),
        source: sourceLang,
        target: targetLang,
        timestamp: new Date().toISOString(),
      };
      setHistory((prev) => [record, ...prev].slice(0, 5));
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
  };

  const handleCopy = async () => {
    if (!targetText) return;
    await navigator.clipboard.writeText(targetText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    const ticketId = generateTicketId();
    const now = new Date();
    setPolishTicketId(ticketId);
    setPolishSubmitTime(formatTime(now));
    setPolishStep(2);
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
    }, 30000);
    return () => clearTimeout(timer);
  }, [polishStep, targetText, appLang]);

  const handleAdoptPolish = () => {
    setPolishAdopted(true);
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

  const handleReTranslate = (record: HistoryRecord) => {
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
  };

  const renderDiff = () => {
    if (!polishedText) return null;
    const original = targetText.split("");
    const polished = polishedText.split("");
    return (
      <div className="space-y-4">
        <div>
          <div className="text-xs font-medium text-charcoal-500 mb-1.5">
            {appLang === "zh" ? "机器翻译" : "Traduzione automatica"}
          </div>
          <div className="p-3 bg-rose-50/50 border border-rose-200/50 rounded-lg">
            <p className="text-sm text-charcoal-700 leading-relaxed">
              {original.map((ch, i) => (
                <span
                  key={i}
                  className={polished[i] !== ch ? "bg-rose-200 line-through" : ""}
                >
                  {ch}
                </span>
              ))}
            </p>
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-charcoal-500 mb-1.5">
            {appLang === "zh" ? "人工润色" : "Revisione umana"}
          </div>
          <div className="p-3 bg-emerald-50/50 border border-emerald-200/50 rounded-lg">
            <p className="text-sm text-charcoal-700 leading-relaxed">
              {polished.map((ch, i) => (
                <span
                  key={i}
                  className={original[i] !== ch ? "bg-emerald-200 font-medium" : ""}
                >
                  {ch}
                </span>
              ))}
            </p>
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
      <button
        onClick={() => {}}
        className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-it-green-50/60 to-white"
      >
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
      </button>

      <div className="px-5 pb-5 pt-3">
        {renderStepIndicator()}

        {polishStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                {appLang === "zh" ? "文档类型" : "Tipo di documento"}
              </label>
              <div className="flex gap-2">
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

            <div className="flex justify-end pt-2">
              <button
                onClick={handlePolishSubmit}
                disabled={!targetText || !polishDocType}
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
                      {appLang === "zh" ? "等待译员接单" : "In attesa di traduttore"}
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

            {renderDiff()}

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

            <div className="flex justify-end pt-2">
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
                  {appLang === "zh" ? "确认采纳" : "Conferma adozione"}
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
          <button
            onClick={handleDownloadReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-charcoal-200 bg-white text-charcoal-600 hover:border-blue-400 hover:text-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">
              {appLang === "zh" ? "下载术语校验报告" : "Scarica rapporto"}
            </span>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-charcoal-600 font-medium">
                {appLang === "zh" ? "术语一致性评分" : "Punteggio coerenza terminologica"}
              </span>
              <span
                className={cn(
                  "font-bold text-lg",
                  termScore >= 90
                    ? "text-emerald-600"
                    : termScore >= 85
                    ? "text-amber-600"
                    : "text-cn-red-600"
                )}
              >
                {termScore}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-charcoal-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  termScore >= 90
                    ? "bg-emerald-500"
                    : termScore >= 85
                    ? "bg-amber-500"
                    : "bg-cn-red-500"
                )}
                style={{ width: `${termScore}%` }}
              />
            </div>
          </div>

          {inconsistentTerms.length > 0 && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  {appLang === "zh"
                    ? `不一致警告（${inconsistentTerms.length} 处）`
                    : `Avvisi di incongruenza (${inconsistentTerms.length})`}
                </span>
              </div>
              <div className="space-y-1.5">
                {inconsistentTerms.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 text-sm text-red-700"
                  >
                    <span className="font-medium">{t.zh}</span>
                    <span className="opacity-50">↔</span>
                    <span>{t.it}</span>
                    <span className="text-xs text-red-500 ml-auto">
                      {appLang === "zh" ? "存在不一致翻译" : "Traduzione incoerente"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {terminology.length > 0 && (
            <div>
              <div className="text-sm font-medium text-charcoal-700 mb-2">
                {appLang === "zh" ? `检测到的术语（${terminology.length} 个）` : `Termini rilevati (${terminology.length})`}
              </div>
              <div className="space-y-2">
                {terminology.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col sm:flex-row sm:items-start gap-2 p-3 rounded-lg bg-warm-ivory-50/50 border border-charcoal-100"
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-medium text-charcoal-800 text-sm">{t.zh}</span>
                      <span className="opacity-40">↔</span>
                      <span className="text-charcoal-700 text-sm">{t.it}</span>
                      <span
                        className={cn(
                          "inline-flex items-center px-1.5 py-0.5 text-xs rounded border",
                          categoryColors[t.category] || categoryColors.general
                        )}
                      >
                        {domainLabels[t.category]?.[appLang] || t.category}
                      </span>
                    </div>
                    {(t.exampleZh || t.exampleIt) && (
                      <div className="text-xs text-charcoal-500 pl-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-charcoal-100 pt-2 sm:pt-0 sm:pl-3 sm:mt-0">
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
                  </div>
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
          {history.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-charcoal-100 text-charcoal-500">
              {history.length}
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
          {history.length === 0 ? (
            <div className="text-center py-6 text-charcoal-400 text-sm">
              {appLang === "zh" ? "暂无翻译记录" : "Nessuna traduzione registrata"}
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-warm-ivory-50/50 border border-charcoal-100 hover:border-warm-gold-200 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-charcoal-700 truncate">
                      {record.sourceText}
                      {record.sourceText.length >= 80 && "..."}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-charcoal-400">
                        {langLabels[record.source][appLang]} → {langLabels[record.target][appLang]}
                      </span>
                      <span className="text-xs text-charcoal-300">|</span>
                      <span className="text-xs text-charcoal-400">
                        {new Date(record.timestamp).toLocaleTimeString("zh-CN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleReTranslate(record)}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-charcoal-200 bg-white text-charcoal-600 hover:border-warm-gold-400 hover:text-warm-gold-700 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {appLang === "zh" ? "再次翻译" : "Ripeti"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

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
                  title={appLang === "zh" ? "上传文档" : "Carica documento"}
                >
                  <FileUp className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {appLang === "zh" ? "上传" : "Carica"}
                  </span>
                </button>
                <button
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-charcoal-200 bg-white text-charcoal-600 hover:border-cn-red-500/50 hover:text-cn-red-600 transition-colors"
                  title={appLang === "zh" ? "清空" : "Svuota"}
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
                    ? appLang === "zh"
                      ? "翻译中..."
                      : "Traduzione..."
                    : appLang === "zh"
                    ? "翻译"
                    : "Traduci"}
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
                title={appLang === "zh" ? "交换语言" : "Scambia lingue"}
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
                    title={appLang === "zh" ? "复制结果" : "Copia risultato"}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                      {copied
                        ? appLang === "zh"
                          ? "已复制"
                          : "Copiato"
                        : appLang === "zh"
                        ? "复制"
                        : "Copia"}
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
                    title={appLang === "zh" ? "收藏" : "Preferiti"}
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
                    renderDiff()
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

        {renderHistoryPanel()}
      </div>
    </div>
  );
}
