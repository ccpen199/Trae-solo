import { useState, useMemo, useRef } from "react";
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
} from "lucide-react";
import { useAppStore } from "@/store";
import type { TermItem } from "@/types";
import { mockTerms } from "@/data/mock";
import { cn } from "@/lib/utils";

type Lang = "zh" | "it";
type Domain = "general" | "diplomatic" | "economic" | "education" | "medical" | "legal";

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
  const [showPolishPanel, setShowPolishPanel] = useState(false);
  const [polishSubmitted, setPolishSubmitted] = useState(false);
  const [versionTab, setVersionTab] = useState<"machine" | "polished">("machine");
  const [polishedText, setPolishedText] = useState("");

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

  const handleTranslate = async () => {
    if (!sourceText.trim() || isTranslating) return;
    setIsTranslating(true);
    setTargetText("");
    setConfidence(null);
    setTerminology([]);
    try {
      const res = await mockTranslate(sourceText, sourceLang, targetLang, domain);
      setTargetText(res.text);
      setConfidence(res.confidence);
      setTerminology(res.terms);
      if (res.confidence < 85) {
        setShowPolishPanel(true);
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
    setShowPolishPanel(false);
    setPolishSubmitted(false);
    setPolishedText("");
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

  const handlePolishSubmit = () => {
    setPolishSubmitted(true);
    setPolishedText(
      targetText +
        (appLang === "zh"
          ? "\n\n[已由专业译员人工润色，修正了术语一致性和句式流畅度]"
          : "\n\n[Revisionato da traduttore professionista: coerenza terminologica e fluidità migliorate]")
    );
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-ivory-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="section-title mb-3">
            {appLang === "zh" ? "智能互译" : "Traduzione Intelligente"}
          </h1>
          <p className="text-charcoal-500 max-w-xl mx-auto">
            {appLang === "zh"
              ? "中意双语专业翻译引擎，支持多领域术语识别、人工润色通道与版本对比"
              : "Motore di traduzione professionale bilingue cinese-italiano, con riconoscimento terminologico, canale di revisione umana e confronto versioni"}
          </p>
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
                  <button
                    onClick={() => setShowPolishPanel((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-charcoal-200 bg-white text-charcoal-600 hover:border-it-green-500/50 hover:text-it-green-700 transition-colors"
                    title={appLang === "zh" ? "人工润色" : "Revisione umana"}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {appLang === "zh" ? "人工润色" : "Revisione"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showPolishPanel && (
          <div className="bg-white rounded-2xl shadow-elegant border border-charcoal-100 overflow-hidden mb-6">
            <button
              onClick={() => setShowPolishPanel((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-warm-ivory-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-it-green-600" />
                <div className="text-left">
                  <h3 className="font-semibold text-charcoal-800">
                    {appLang === "zh" ? "人工润色通道" : "Canale di Revisione Umana"}
                  </h3>
                  {confidence !== null && confidence < 85 && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs text-amber-600">
                        {appLang === "zh"
                          ? "置信度低于 85%，建议申请人工润色以确保专业品质"
                          : "Confidenza inferiore all'85%, si consiglia la revisione umana per qualità professionale"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {showPolishPanel ? (
                <ChevronUp className="w-5 h-5 text-charcoal-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-charcoal-400" />
              )}
            </button>

            {showPolishPanel && (
              <div className="px-5 pb-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      step: 1,
                      zh: "提交申请",
                      it: "Invia richiesta",
                    },
                    {
                      step: 2,
                      zh: "专业译员审核",
                      it: "Revisione traduttore",
                    },
                    {
                      step: 3,
                      zh: "返回润色结果",
                      it: "Restituzione risultato",
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex items-center gap-3 p-3 rounded-lg bg-warm-ivory-50 border border-charcoal-100"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-warm-gold-500 to-warm-gold-600 text-white text-xs font-semibold flex items-center justify-center">
                        {item.step}
                      </div>
                      <span className="text-sm text-charcoal-700">
                        {appLang === "zh" ? item.zh : item.it}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2">
                  {polishSubmitted ? (
                    <div className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                      <Check className="w-4 h-4" />
                      {appLang === "zh"
                        ? "已提交，译员将在 30 分钟内响应"
                        : "Inviato, il traduttore risponderà entro 30 minuti"}
                    </div>
                  ) : (
                    <button
                      onClick={handlePolishSubmit}
                      disabled={!targetText}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all bg-gradient-to-r from-it-green-600 to-it-green-700 text-white shadow-elegant hover:from-it-green-700 hover:to-it-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="w-4 h-4" />
                      {appLang === "zh" ? "提交润色申请" : "Invia richiesta di revisione"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {targetText && (
          <div className="bg-white rounded-2xl shadow-elegant border border-charcoal-100 overflow-hidden">
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
      </div>
    </div>
  );
}
