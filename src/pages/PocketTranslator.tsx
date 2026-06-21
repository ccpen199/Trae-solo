import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  MicOff,
  Keyboard,
  Globe,
  Stethoscope,
  Scale,
  FileCheck,
  Wifi,
  WifiOff,
  ArrowRightLeft,
  Copy,
  Volume2,
  Trash2,
  Send,
  Download,
  X,
  Check,
  Package,
} from "lucide-react";
import { useAppStore } from "@/store";
import BilingualText from "@/components/BilingualText";
import { cn } from "@/lib/utils";

type SceneMode = "general" | "visa" | "medical" | "legal";

interface ChatMessage {
  id: string;
  zh: string;
  it: string;
  isUser: boolean;
  timestamp: string;
  sourceLang: "zh" | "it";
}

interface VocabItem {
  zh: string;
  it: string;
}

interface OfflinePack {
  id: string;
  zh: string;
  it: string;
  size: string;
  status: "downloaded" | "downloading" | "not-downloaded";
  progress: number;
}

const scenes = [
  { id: "general" as SceneMode, zh: "通用", it: "Generale", icon: Globe },
  { id: "visa" as SceneMode, zh: "签证办理", it: "Visto", icon: FileCheck },
  { id: "medical" as SceneMode, zh: "医疗问诊", it: "Medico", icon: Stethoscope },
  { id: "legal" as SceneMode, zh: "法律咨询", it: "Legale", icon: Scale },
];

const vocabData: Record<SceneMode, VocabItem[]> = {
  general: [
    { zh: "你好", it: "Ciao" },
    { zh: "谢谢", it: "Grazie" },
    { zh: "对不起", it: "Scusa" },
    { zh: "请", it: "Per favore" },
    { zh: "多少", it: "Quanto" },
    { zh: "哪里", it: "Dove" },
    { zh: "什么时候", it: "Quando" },
    { zh: "帮助", it: "Aiuto" },
  ],
  visa: [
    { zh: "护照", it: "Passaporto" },
    { zh: "签证", it: "Visto" },
    { zh: "入境", it: "Ingresso" },
    { zh: "居留许可", it: "Permesso di soggiorno" },
    { zh: "邀请信", it: "Lettera di invito" },
    { zh: "行程单", it: "Itinerario" },
    { zh: "银行流水", it: "Estratto conto" },
    { zh: "在职证明", it: "Certificato di impiego" },
    { zh: "申请表", it: "Modulo di richiesta" },
    { zh: "保险", it: "Assicurazione" },
  ],
  medical: [
    { zh: "挂号", it: "Registrazione" },
    { zh: "处方", it: "Ricetta" },
    { zh: "过敏", it: "Allergia" },
    { zh: "症状", it: "Sintomo" },
    { zh: "手术", it: "Intervento" },
    { zh: "检查", it: "Esame" },
    { zh: "用药", it: "Farmaco" },
    { zh: "急诊", it: "Pronto soccorso" },
    { zh: "住院", it: "Ricovero" },
    { zh: "诊断", it: "Diagnosi" },
  ],
  legal: [
    { zh: "合同", it: "Contratto" },
    { zh: "原告", it: "Attore" },
    { zh: "被告", it: "Convenuto" },
    { zh: "判决", it: "Sentenza" },
    { zh: "上诉", it: "Appello" },
    { zh: "律师", it: "Avvocato" },
    { zh: "证据", it: "Prova" },
    { zh: "赔偿", it: "Risarcimento" },
    { zh: "仲裁", it: "Arbitrato" },
    { zh: "公证", it: "Notarizzazione" },
  ],
};

const sceneMockDialogs: Record<SceneMode, { zh: string; it: string }[]> = {
  general: [
    { zh: "请问火车站怎么走？", it: "Mi scusi, come arrivo alla stazione?" },
    { zh: "往前走两个路口就到了。", it: "Vada dritto per due isolati e sarà lì." },
    { zh: "这附近有餐厅吗？", it: "C'è un ristorante qui vicino?" },
    { zh: "有的，转角那家很推荐。", it: "Sì, quello all'angolo è molto consigliato." },
  ],
  visa: [
    { zh: "请问办理旅游签证需要哪些材料？", it: "Quali documenti servono per il visto turistico?" },
    { zh: "需要护照、照片、行程单和银行流水。", it: "Servono passaporto, foto, itinerario ed estratto conto." },
    { zh: "办理大概需要多长时间？", it: "Quanto tempo ci vuole per l'elaborazione?" },
    { zh: "通常需要15个工作日。", it: "Di solito ci vogliono 15 giorni lavorativi." },
  ],
  medical: [
    { zh: "我最近一直头疼，还有些发烧。", it: "Ho mal di testa da un po' e anche un po' di febbre." },
    { zh: "让我量一下体温，请问有过敏药物吗？", it: "Le misuro la febbre. Ha allergie a qualche farmaco?" },
    { zh: "我对青霉素过敏。", it: "Sono allergico alla penicillina." },
    { zh: "好的，我给您开另一种药，每天服用两次。", it: "D'accordo, le prescrivo un altro farmaco, da prendere due volte al giorno." },
  ],
  legal: [
    { zh: "这份合同里的违约条款我看不太懂。", it: "Non capisco bene la clausola di risoluzione in questo contratto." },
    { zh: "违约方需要赔偿对方全部损失。", it: "La parte inadempiente deve risarcire tutte le perdite dell'altra parte." },
    { zh: "如果对判决不服，可以上诉吗？", it: "Se non si è d'accordo con la sentenza, si può fare appello?" },
    { zh: "可以，在判决生效后30天内可以提起上诉。", it: "Sì, si può presentare appello entro 30 giorni dalla sentenza." },
  ],
};

const initialPacks: OfflinePack[] = [
  { id: "general", zh: "通用词包", it: "Pacchetto generale", size: "12 MB", status: "downloaded", progress: 100 },
  { id: "visa", zh: "签证词包", it: "Pacchetto visto", size: "8 MB", status: "not-downloaded", progress: 0 },
  { id: "medical", zh: "医疗词包", it: "Pacchetto medico", size: "15 MB", status: "not-downloaded", progress: 0 },
  { id: "legal", zh: "法律词包", it: "Pacchetto legale", size: "10 MB", status: "not-downloaded", progress: 0 },
];

function getNowTimestamp() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function PocketTranslator() {
  const { lang } = useAppStore();
  const [activeScene, setActiveScene] = useState<SceneMode>("general");
  const [isRecording, setIsRecording] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [sourceLang, setSourceLang] = useState<"zh" | "it">("zh");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m1",
      zh: "您好，请问需要什么帮助？",
      it: "Buongiorno, in cosa posso aiutarla?",
      isUser: false,
      timestamp: "14:30",
      sourceLang: "it",
    },
    {
      id: "m2",
      zh: "我想申请旅游签证，需要准备哪些材料？",
      it: "Vorrei richiedere un visto turistico, quali documenti devo preparare?",
      isUser: true,
      timestamp: "14:31",
      sourceLang: "zh",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [showOfflinePanel, setShowOfflinePanel] = useState(false);
  const [packs, setPacks] = useState<OfflinePack[]>(initialPacks);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (showKeyboard && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showKeyboard]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    };
  }, []);

  const addMessage = useCallback(
    (zh: string, it: string, isUser: boolean, srcLang: "zh" | "it") => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          zh,
          it,
          isUser,
          timestamp: getNowTimestamp(),
          sourceLang: srcLang,
        },
      ]);
    },
    []
  );

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    const isZh = sourceLang === "zh";
    addMessage(isZh ? text : text, isZh ? text : text, true, sourceLang);
    setInputText("");
    setTimeout(() => {
      const dialogs = sceneMockDialogs[activeScene];
      const reply = dialogs[Math.floor(Math.random() * dialogs.length)];
      addMessage(reply.zh, reply.it, false, isZh ? "it" : "zh");
    }, 800);
  }, [inputText, sourceLang, activeScene, addMessage]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      return;
    }
    setIsRecording(true);
    recordingTimerRef.current = setTimeout(() => {
      const dialogs = sceneMockDialogs[activeScene];
      const dialog = dialogs[Math.floor(Math.random() * dialogs.length)];
      const isZh = sourceLang === "zh";
      addMessage(dialog.zh, dialog.it, true, isZh);
      setIsRecording(false);
      recordingTimerRef.current = null;
      setTimeout(() => {
        const reply = dialogs[Math.floor(Math.random() * dialogs.length)];
        addMessage(reply.zh, reply.it, false, isZh ? "it" : "zh");
      }, 600);
    }, 2000);
  }, [isRecording, activeScene, sourceLang, addMessage]);

  const swapLanguages = () => {
    setSourceLang(sourceLang === "zh" ? "it" : "zh");
  };

  const handleVocabClick = (item: VocabItem) => {
    const text = sourceLang === "zh" ? item.zh : item.it;
    setInputText((prev) => (prev ? prev + " " + text : text));
    if (!showKeyboard) setShowKeyboard(true);
  };

  const handleCopy = (msg: ChatMessage) => {
    const text = sourceLang === "zh" ? msg.zh : msg.it;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const handleTTS = (msg: ChatMessage) => {
    const text = lang === "zh" ? msg.zh : msg.it;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "zh" ? "zh-CN" : "it-IT";
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  };

  const clearHistory = () => {
    setMessages([]);
  };

  const handleDownloadPack = (packId: string) => {
    setPacks((prev) =>
      prev.map((p) =>
        p.id === packId ? { ...p, status: "downloading" as const, progress: 0 } : p
      )
    );
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setPacks((prev) =>
          prev.map((p) =>
            p.id === packId ? { ...p, status: "downloaded" as const, progress: 100 } : p
          )
        );
      } else {
        setPacks((prev) =>
          prev.map((p) =>
            p.id === packId ? { ...p, progress: Math.round(progress) } : p
          )
        );
      }
    }, 400);
  };

  const handleDeletePack = (packId: string) => {
    setPacks((prev) =>
      prev.map((p) =>
        p.id === packId ? { ...p, status: "not-downloaded" as const, progress: 0 } : p
      )
    );
  };

  const offlineCount = packs.filter((p) => p.status === "downloaded").length;

  return (
    <div className="min-h-screen bg-charcoal-900 text-white flex flex-col">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal-800 via-charcoal-900 to-charcoal-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08)_0%,transparent_60%)]" />

        <div className="relative z-10 flex items-center justify-between px-6 pt-4 pb-3">
          <div className="w-8" />
          <h1 className="text-lg font-display-zh font-semibold bg-clip-text text-transparent bg-gradient-to-r from-warm-gold-300 to-warm-gold-500">
            <BilingualText zh="随身翻译" it="Traduttore Tascabile" />
          </h1>
          <div className="relative">
            <button
              onClick={() => setShowOfflinePanel(!showOfflinePanel)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                offlineCount > 0
                  ? "bg-it-green-500/15 text-it-green-300 border border-it-green-500/20 hover:bg-it-green-500/25"
                  : "bg-charcoal-700/60 text-charcoal-300 border border-charcoal-600/50 hover:bg-charcoal-700/80"
              )}
            >
              {offlineCount > 0 ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>{offlineCount}/4</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <BilingualText zh="在线" it="Online" />
                </>
              )}
            </button>

            {showOfflinePanel && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-charcoal-800 border border-charcoal-700/60 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-charcoal-700/40">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-warm-gold-400" />
                    <span className="text-sm font-medium">
                      <BilingualText zh="离线词包管理" it="Gestione pacchetti offline" />
                    </span>
                  </div>
                  <button
                    onClick={() => setShowOfflinePanel(false)}
                    className="p-1 rounded-lg hover:bg-charcoal-700/60 transition-colors"
                  >
                    <X className="w-4 h-4 text-charcoal-400" />
                  </button>
                </div>
                <div className="p-3 space-y-2">
                  {packs.map((pack) => (
                    <div
                      key={pack.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-charcoal-900/60 border border-charcoal-700/30"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium truncate">
                            {lang === "zh" ? pack.zh : pack.it}
                          </span>
                          <span className="text-[10px] text-charcoal-400 ml-2 shrink-0">
                            {pack.size}
                          </span>
                        </div>
                        {pack.status === "downloading" && (
                          <div className="w-full h-1.5 bg-charcoal-700 rounded-full overflow-hidden mt-1.5">
                            <div
                              className="h-full bg-gradient-to-r from-warm-gold-400 to-warm-gold-600 rounded-full transition-all duration-300"
                              style={{ width: `${pack.progress}%` }}
                            />
                          </div>
                        )}
                        {pack.status === "downloaded" && (
                          <div className="flex items-center gap-1 mt-1">
                            <Check className="w-3 h-3 text-it-green-400" />
                            <span className="text-[10px] text-it-green-400">
                              <BilingualText zh="已下载" it="Scaricato" />
                            </span>
                          </div>
                        )}
                      </div>
                      {pack.status === "downloaded" ? (
                        <button
                          onClick={() => handleDeletePack(pack.id)}
                          className="shrink-0 p-1.5 rounded-lg hover:bg-cn-red-500/20 text-charcoal-400 hover:text-cn-red-400 transition-colors"
                          title={lang === "zh" ? "删除" : "Elimina"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : pack.status === "not-downloaded" ? (
                        <button
                          onClick={() => handleDownloadPack(pack.id)}
                          className="shrink-0 p-1.5 rounded-lg hover:bg-warm-gold-500/20 text-charcoal-400 hover:text-warm-gold-400 transition-colors"
                          title={lang === "zh" ? "下载" : "Scarica"}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-warm-gold-400/40 border-t-warm-gold-400 rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 px-4 pb-3">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-charcoal-800/80 backdrop-blur border border-charcoal-700/50 overflow-x-auto">
            {scenes.map((scene) => {
              const Icon = scene.icon;
              const isActive = activeScene === scene.id;
              return (
                <button
                  key={scene.id}
                  onClick={() => setActiveScene(scene.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 min-w-fit",
                    isActive
                      ? "bg-gradient-to-r from-warm-gold-500 to-warm-gold-600 text-charcoal-900 shadow-gold"
                      : "text-charcoal-300 hover:text-white hover:bg-charcoal-700/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <BilingualText zh={scene.zh} it={scene.it} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 px-4 pb-3">
          <div className="rounded-xl bg-charcoal-800/50 border border-charcoal-700/30 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Globe className="w-3.5 h-3.5 text-warm-gold-400" />
              <span className="text-[11px] font-medium text-warm-gold-400">
                <BilingualText zh="专业词库" it="Glossario professionale" />
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {vocabData[activeScene].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleVocabClick(item)}
                  className="group flex items-center gap-1 px-2.5 py-1 rounded-lg bg-charcoal-900/60 border border-charcoal-600/40 hover:border-warm-gold-500/40 hover:bg-warm-gold-500/10 transition-all duration-200 cursor-pointer"
                >
                  <span className="text-[11px] text-charcoal-200 group-hover:text-white">{item.zh}</span>
                  <span className="text-[10px] text-charcoal-500 group-hover:text-warm-gold-400">/</span>
                  <span className="text-[11px] text-it-green-400/80 group-hover:text-it-green-300 font-medium">{item.it}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.04)_0%,transparent_70%)]" />
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-charcoal-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-charcoal-900 to-transparent z-10 pointer-events-none" />

        <div className="flex items-center justify-between px-5 pt-3 relative z-20">
          <span className="text-[10px] text-charcoal-500">
            <BilingualText zh="对话记录" it="Cronologia" />
          </span>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 text-[10px] text-charcoal-500 hover:text-cn-red-400 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <BilingualText zh="清空" it="Cancella" />
            </button>
          )}
        </div>

        <div className="relative flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-charcoal-500">
                <BilingualText zh="暂无对话，点击录音或输入文本开始" it="Nessuna conversazione. Tocca il microfono o digita per iniziare" />
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className="space-y-1.5">
              <div
                className={cn(
                  "relative rounded-2xl px-4 py-3 max-w-[92%]",
                  msg.isUser
                    ? "ml-auto bg-gradient-to-br from-cn-red-500/20 to-cn-red-600/10 border border-cn-red-500/20 rounded-br-md"
                    : "mr-auto bg-charcoal-800/70 border border-charcoal-700/50 rounded-bl-md"
                )}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className={cn(
                      "!text-[10px] !px-1.5 !py-0.5 rounded",
                      msg.sourceLang === "zh"
                        ? "bg-cn-red-500/20 text-cn-red-300"
                        : "bg-it-green-500/20 text-it-green-300"
                    )}
                  >
                    {msg.sourceLang === "zh" ? "ZH" : "IT"}
                  </span>
                  <span className="text-[10px] text-charcoal-400">{msg.timestamp}</span>
                </div>
                <p className="text-sm text-white leading-relaxed">
                  {msg.sourceLang === "zh" ? msg.zh : msg.it}
                </p>
                <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-charcoal-700/30">
                  <button
                    onClick={() => handleCopy(msg)}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-charcoal-400 hover:text-white hover:bg-charcoal-700/60 transition-colors"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3 h-3 text-it-green-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    {copiedId === msg.id
                      ? (lang === "zh" ? "已复制" : "Copiato")
                      : (lang === "zh" ? "复制" : "Copia")
                    }
                  </button>
                  <button
                    onClick={() => handleTTS(msg)}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-charcoal-400 hover:text-white hover:bg-charcoal-700/60 transition-colors"
                  >
                    <Volume2 className="w-3 h-3" />
                    {lang === "zh" ? "朗读" : "Leggi"}
                  </button>
                </div>
              </div>

              {msg.sourceLang === "zh" ? (
                <div
                  className={cn(
                    "relative rounded-2xl px-4 py-3 max-w-[92%] border",
                    msg.isUser
                      ? "mr-auto bg-gradient-to-br from-it-green-500/15 to-it-green-600/8 border-it-green-500/15 rounded-bl-md"
                      : "ml-auto bg-charcoal-800/50 border-charcoal-600/40 rounded-br-md"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="!text-[10px] !px-1.5 !py-0.5 rounded bg-it-green-500/20 text-it-green-300">
                      IT
                    </span>
                  </div>
                  <p className="text-sm text-charcoal-200 leading-relaxed">{msg.it}</p>
                </div>
              ) : (
                <div
                  className={cn(
                    "relative rounded-2xl px-4 py-3 max-w-[92%] border",
                    msg.isUser
                      ? "mr-auto bg-gradient-to-br from-cn-red-500/15 to-cn-red-600/8 border-cn-red-500/15 rounded-bl-md"
                      : "ml-auto bg-charcoal-800/50 border-charcoal-600/40 rounded-br-md"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="!text-[10px] !px-1.5 !py-0.5 rounded bg-cn-red-500/20 text-cn-red-300">
                      ZH
                    </span>
                  </div>
                  <p className="text-sm text-charcoal-200 leading-relaxed">{msg.zh}</p>
                </div>
              )}
            </div>
          ))}

          {isRecording && (
            <div className="space-y-1.5">
              <div className="relative rounded-2xl px-4 py-4 max-w-[92%] ml-auto bg-gradient-to-br from-cn-red-500/25 to-cn-red-600/15 border border-cn-red-500/30 rounded-br-md">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="!text-[10px] !px-1.5 !py-0.5 rounded bg-cn-red-500/20 text-cn-red-300">
                    {sourceLang === "zh" ? "ZH" : "IT"}
                  </span>
                  <span className="text-[10px] text-cn-red-300 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-cn-red-400 animate-pulse" />
                    {lang === "zh" ? "录音中..." : "Registrazione..."}
                  </span>
                </div>
                <div className="flex items-end gap-1 h-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-cn-red-400 to-cn-red-300 rounded-full animate-wave origin-bottom"
                      style={{ animationDelay: `${i * 0.1}s`, height: "100%" }}
                    />
                  ))}
                </div>
              </div>
              <div className="relative rounded-2xl px-4 py-3 max-w-[92%] border border-dashed border-charcoal-600/50 rounded-br-md flex items-center justify-center bg-charcoal-800/30">
                <p className="text-sm text-charcoal-400">
                  {lang === "zh" ? "等待翻译..." : "Attesa traduzione..."}
                </p>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="relative bg-charcoal-900 border-t border-charcoal-700/50 px-4 py-4">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-warm-gold-500/30 to-transparent" />

        {showKeyboard && (
          <div className="mb-3 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-xl bg-charcoal-800/80 border border-charcoal-600/50 px-4 py-2.5 focus-within:border-warm-gold-500/50 transition-colors">
              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0",
                  sourceLang === "zh"
                    ? "bg-cn-red-500/20 text-cn-red-300"
                    : "bg-it-green-500/20 text-it-green-300"
                )}
              >
                {sourceLang === "zh" ? "ZH" : "IT"}
              </span>
              <input
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={lang === "zh" ? "输入文本..." : "Inserisci testo..."}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-charcoal-500 outline-none"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={cn(
                "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                inputText.trim()
                  ? "bg-gradient-to-r from-warm-gold-500 to-warm-gold-600 text-charcoal-900 hover:shadow-gold"
                  : "bg-charcoal-800 text-charcoal-500 cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={swapLanguages}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-charcoal-800/60 transition-all duration-200 group"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs font-bold px-2.5 py-1 rounded-lg",
                  sourceLang === "zh"
                    ? "bg-cn-red-500/20 text-cn-red-300 border border-cn-red-500/30"
                    : "bg-it-green-500/20 text-it-green-300 border border-it-green-500/30"
                )}
              >
                {sourceLang === "zh" ? "中文" : "Italiano"}
              </span>
              <ArrowRightLeft className="w-4 h-4 text-charcoal-400 group-hover:text-warm-gold-400 transition-colors" />
              <span
                className={cn(
                  "text-xs font-bold px-2.5 py-1 rounded-lg",
                  sourceLang === "it"
                    ? "bg-cn-red-500/20 text-cn-red-300 border border-cn-red-500/30"
                    : "bg-it-green-500/20 text-it-green-300 border border-it-green-500/30"
                )}
              >
                {sourceLang === "it" ? "中文" : "Italiano"}
              </span>
            </div>
            <span className="text-[10px] text-charcoal-400">
              <BilingualText zh="点击切换" it="Tocca per scambiare" />
            </span>
          </button>

          <div className="relative">
            {isRecording && (
              <>
                <div className="absolute inset-0 rounded-full bg-warm-gold-500/20 animate-ping" />
                <div className="absolute -inset-2 rounded-full bg-warm-gold-500/10 animate-pulse" />
              </>
            )}
            <button
              onClick={toggleRecording}
              className={cn(
                "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
                isRecording
                  ? "bg-gradient-to-br from-cn-red-500 via-warm-gold-500 to-it-green-500 shadow-[0_0_40px_rgba(212,175,55,0.5)] scale-105"
                  : "bg-gradient-to-br from-warm-gold-400 via-warm-gold-500 to-warm-gold-600 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:scale-105"
              )}
            >
              <div className="absolute inset-1 rounded-full bg-charcoal-900/30 backdrop-blur-sm" />
              {isRecording ? (
                <MicOff className="relative w-9 h-9 text-white" />
              ) : (
                <Mic className="relative w-9 h-9 text-charcoal-900" />
              )}
            </button>
            {isRecording && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-end gap-0.5 h-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-warm-gold-400 rounded-full animate-wave origin-bottom"
                    style={{ animationDelay: `${i * 0.08}s`, height: "100%" }}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowKeyboard(!showKeyboard)}
            className={cn(
              "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200",
              showKeyboard
                ? "bg-warm-gold-500/20 border border-warm-gold-500/30"
                : "hover:bg-charcoal-800/60"
            )}
          >
            <Keyboard
              className={cn(
                "w-6 h-6 transition-colors",
                showKeyboard ? "text-warm-gold-400" : "text-charcoal-300"
              )}
            />
            <span
              className={cn(
                "text-[10px]",
                showKeyboard ? "text-warm-gold-400" : "text-charcoal-400"
              )}
            >
              <BilingualText zh="键盘输入" it="Tastiera" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
