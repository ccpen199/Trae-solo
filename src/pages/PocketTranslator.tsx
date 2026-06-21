import { useState } from "react";
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
}

const scenes = [
  {
    id: "general" as SceneMode,
    zh: "通用",
    it: "Generale",
    icon: Globe,
  },
  {
    id: "visa" as SceneMode,
    zh: "签证办理",
    it: "Visto",
    icon: FileCheck,
  },
  {
    id: "medical" as SceneMode,
    zh: "医疗问诊",
    it: "Medico",
    icon: Stethoscope,
  },
  {
    id: "legal" as SceneMode,
    zh: "法律咨询",
    it: "Legale",
    icon: Scale,
  },
];

const mockMessages: ChatMessage[] = [
  {
    id: "m1",
    zh: "您好，请问需要什么帮助？",
    it: "Buongiorno, in cosa posso aiutarla?",
    isUser: false,
    timestamp: "14:30",
  },
  {
    id: "m2",
    zh: "我想申请旅游签证，需要准备哪些材料？",
    it: "Vorrei richiedere un visto turistico, quali documenti devo preparare?",
    isUser: true,
    timestamp: "14:31",
  },
  {
    id: "m3",
    zh: "需要护照、照片、行程单、银行流水和在职证明。",
    it: "Sono necessari passaporto, foto, itinerario, estratto conto e certificato di impiego.",
    isUser: false,
    timestamp: "14:32",
  },
  {
    id: "m4",
    zh: "好的，谢谢。办理需要多长时间？",
    it: "Va bene, grazie. Quanto tempo occorre per l'elaborazione?",
    isUser: true,
    timestamp: "14:33",
  },
];

export default function PocketTranslator() {
  const { lang } = useAppStore();
  const [activeScene, setActiveScene] = useState<SceneMode>("general");
  const [isRecording, setIsRecording] = useState(false);
  const [isOffline] = useState(true);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [sourceLang, setSourceLang] = useState<"zh" | "it">("zh");

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const swapLanguages = () => {
    setSourceLang(sourceLang === "zh" ? "it" : "zh");
  };

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
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
              isOffline
                ? "bg-it-green-500/15 text-it-green-300 border border-it-green-500/20"
                : "bg-charcoal-700/60 text-charcoal-300 border border-charcoal-600/50"
            )}
          >
            {isOffline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <BilingualText zh="离线词库已下载" it="Dizionario offline" />
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <BilingualText zh="在线" it="Online" />
              </>
            )}
          </div>
        </div>

        <div className="relative z-10 px-4 pb-4">
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
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.04)_0%,transparent_70%)]" />
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-charcoal-900 to-transparent z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-charcoal-900 to-transparent z-10" />

        <div className="relative h-full overflow-y-auto px-4 py-6 space-y-5">
          {mockMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "grid grid-cols-2 gap-3",
                msg.isUser ? "" : ""
              )}
            >
              <div
                className={cn(
                  "relative rounded-2xl px-4 py-3 max-w-full",
                  msg.isUser
                    ? "bg-gradient-to-br from-cn-red-500/20 to-cn-red-600/10 border border-cn-red-500/20 rounded-br-md"
                    : "bg-charcoal-800/70 border border-charcoal-700/50 rounded-bl-md"
                )}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="tag-cn !text-[10px] !px-2 !py-0.5">ZH</span>
                  <span className="text-[10px] text-charcoal-400">
                    {msg.timestamp}
                  </span>
                </div>
                <p className="text-sm text-white leading-relaxed">{msg.zh}</p>
              </div>

              <div
                className={cn(
                  "relative rounded-2xl px-4 py-3 max-w-full",
                  msg.isUser
                    ? "bg-gradient-to-br from-it-green-500/20 to-it-green-600/10 border border-it-green-500/20 rounded-bl-md"
                    : "bg-charcoal-800/70 border border-charcoal-700/50 rounded-br-md"
                )}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="tag-it !text-[10px] !px-2 !py-0.5">IT</span>
                  <span className="text-[10px] text-charcoal-400">
                    {msg.timestamp}
                  </span>
                </div>
                <p className="text-sm text-white leading-relaxed">{msg.it}</p>
              </div>
            </div>
          ))}

          {isRecording && (
            <div className="grid grid-cols-2 gap-3">
              <div className="relative rounded-2xl px-4 py-4 bg-gradient-to-br from-cn-red-500/25 to-cn-red-600/15 border border-cn-red-500/30 rounded-br-md">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="tag-cn !text-[10px] !px-2 !py-0.5">ZH</span>
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
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        height: "100%",
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="relative rounded-2xl px-4 py-4 bg-charcoal-800/50 border border-dashed border-charcoal-600/50 rounded-bl-md flex items-center justify-center">
                <p className="text-sm text-charcoal-400">
                  {lang === "zh" ? "等待翻译..." : "Attesa traduzione..."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative bg-charcoal-900 border-t border-charcoal-700/50 px-6 py-5">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-warm-gold-500/30 to-transparent" />

        {showKeyboard && (
          <div className="mb-4">
            <div className="input-field !bg-charcoal-800/80 !border-charcoal-600/50 !text-white !placeholder:text-charcoal-400 min-h-[60px] flex items-center">
              <span className="text-charcoal-400 text-sm">
                {lang === "zh" ? "输入文本..." : "Inserisci testo..."}
              </span>
            </div>
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
                    style={{
                      animationDelay: `${i * 0.08}s`,
                      height: "100%",
                    }}
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
