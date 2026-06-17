import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  Mic,
  StopCircle,
  Dog,
  Cat,
  Heart,
  Zap,
  ArrowLeftRight,
  Send,
  MessageSquare,
  Volume2,
  Activity,
  Clock,
  BarChart3,
  Sparkles,
  History,
  Filter,
  ChevronDown,
  ChevronUp,
  Play,
  Eye,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Emotion, VoiceprintAnalysis, Species, Pet } from "../../shared/types";

type FlowStep = "idle" | "recording" | "processing" | "result";

const emotionConfig: Record<Emotion, { label: string; bg: string; text: string; dot: string; emoji: string }> = {
  happy: { label: "开心", bg: "bg-gradient-to-r from-accent-sunny/30 to-amber-200/40", text: "text-amber-700", dot: "bg-amber-500", emoji: "😊" },
  angry: { label: "生气", bg: "bg-gradient-to-r from-red-100 to-red-200/50", text: "text-red-700", dot: "bg-red-500", emoji: "😠" },
  hungry: { label: "饥饿", bg: "bg-gradient-to-r from-brand-orange/20 to-orange-200/50", text: "text-brand-orange-dark", dot: "bg-brand-orange", emoji: "🍖" },
  anxious: { label: "焦虑", bg: "bg-gradient-to-r from-accent-sky/30 to-sky-200/40", text: "text-sky-700", dot: "bg-sky-500", emoji: "😟" },
  curious: { label: "好奇", bg: "bg-gradient-to-r from-brand-mint/20 to-teal-200/40", text: "text-brand-mint-dark", dot: "bg-brand-mint", emoji: "🤔" },
  sleepy: { label: "困倦", bg: "bg-gradient-to-r from-indigo-100 to-violet-200/40", text: "text-indigo-700", dot: "bg-indigo-500", emoji: "😴" },
  playful: { label: "想玩耍", bg: "bg-gradient-to-r from-accent-pink/30 to-pink-200/40", text: "text-pink-700", dot: "bg-pink-500", emoji: "🎾" },
  lonely: { label: "孤独", bg: "bg-gradient-to-r from-purple-100 to-fuchsia-200/40", text: "text-purple-700", dot: "bg-purple-500", emoji: "🥺" },
};

const DOG_EMOTIONS: Omit<VoiceprintAnalysis, "id" | "createdAt">[] = [
  { petId: "p1", audioUrl: "/audio/new_d1.wav", emotion: "happy", emotionLabel: "开心", confidence: 0.93, semanticText: "主人回来啦！我超级开心，快摸摸我！", voiceprintReport: { frequency: 450, duration: 1.8, intensity: 0.78, pattern: "高频短促连续吠叫" } },
  { petId: "p1", audioUrl: "/audio/new_d2.wav", emotion: "playful", emotionLabel: "想玩耍", confidence: 0.88, semanticText: "球球呢？我们来玩捡球游戏好不好！", voiceprintReport: { frequency: 520, duration: 1.2, intensity: 0.82, pattern: "跳跃式激动吠叫" } },
  { petId: "p1", audioUrl: "/audio/new_d3.wav", emotion: "hungry", emotionLabel: "饥饿", confidence: 0.85, semanticText: "饭碗空了！快点给我加狗粮！", voiceprintReport: { frequency: 490, duration: 2.0, intensity: 0.75, pattern: "中高频急促反复吠叫" } },
  { petId: "p1", audioUrl: "/audio/new_d4.wav", emotion: "anxious", emotionLabel: "焦虑", confidence: 0.79, semanticText: "怎么还不回家...我好担心你在外面...", voiceprintReport: { frequency: 380, duration: 3.2, intensity: 0.62, pattern: "低频持续呜咽声" } },
  { petId: "p1", audioUrl: "/audio/new_d5.wav", emotion: "curious", emotionLabel: "好奇", confidence: 0.81, semanticText: "门外是什么声音？让我去看看！", voiceprintReport: { frequency: 460, duration: 1.0, intensity: 0.7, pattern: "断续单声吠叫+头部偏转" } },
];

const CAT_EMOTIONS: Omit<VoiceprintAnalysis, "id" | "createdAt">[] = [
  { petId: "p2", audioUrl: "/audio/new_c1.wav", emotion: "hungry", emotionLabel: "饥饿", confidence: 0.87, semanticText: "肚子好饿呀，小鱼干什么时候才来呢？", voiceprintReport: { frequency: 320, duration: 2.4, intensity: 0.55, pattern: "拖长音的轻柔喵叫" } },
  { petId: "p2", audioUrl: "/audio/new_c2.wav", emotion: "curious", emotionLabel: "好奇", confidence: 0.83, semanticText: "那个奇怪的盒子里面有什么？让我看看！", voiceprintReport: { frequency: 480, duration: 0.9, intensity: 0.45, pattern: "短促升调颤音喵叫" } },
  { petId: "p2", audioUrl: "/audio/new_c3.wav", emotion: "sleepy", emotionLabel: "困倦", confidence: 0.91, semanticText: "好困呀...让我再睡五分钟嘛...", voiceprintReport: { frequency: 220, duration: 1.5, intensity: 0.3, pattern: "低沉拖长的呼噜喵叫" } },
  { petId: "p2", audioUrl: "/audio/new_c4.wav", emotion: "playful", emotionLabel: "想玩耍", confidence: 0.84, semanticText: "逗猫棒在哪里？我要追着它跑！", voiceprintReport: { frequency: 560, duration: 0.7, intensity: 0.68, pattern: "快速升调啁啾式喵叫" } },
  { petId: "p2", audioUrl: "/audio/new_c5.wav", emotion: "happy", emotionLabel: "满足", confidence: 0.9, semanticText: "咕噜咕噜...被摸摸头好舒服呀～", voiceprintReport: { frequency: 180, duration: 3.5, intensity: 0.4, pattern: "持续低频呼噜声+轻揉动作" } },
];

const DOG_SOUNDS: Record<string, string> = {
  "吃饭时间到啦": "汪汪！汪汪汪！（兴奋地转圈摇尾巴）",
  "乖，别叫了": "呜...呜呜...（委屈地趴下低声哼唧）",
  "出去玩好不好": "汪汪汪！！！（疯狂摇尾巴冲向门口）",
  "过来": "汪！汪！（小跑过来坐下歪头看你）",
  "不可以": "呜...（耷拉耳朵委屈后退）",
};

const CAT_SOUNDS: Record<string, string> = {
  "吃饭时间到啦": "喵～喵呜～（急促地在食碗旁踱步）",
  "乖，别叫了": "嘶...（甩尾巴扭头不理你）",
  "出去玩好不好": "喵嗷！（瞳孔放大耳朵竖起盯着门）",
  "过来": "喵...（慢慢踱步靠近蹭了蹭你的腿）",
  "不可以": "哈！（炸毛弓背侧身警告）",
};

const waveBars = Array.from({ length: 24 }, (_, i) => i);

export default function Translate() {
  const location = useLocation();
  const locState = location.state as { showHistory?: boolean; focusAnalysisId?: string } | null;
  const { pets, analyses, addAnalysis } = useAppStore();

  const [petType, setPetType] = useState<Species>("dog");
  const [flowStep, setFlowStep] = useState<FlowStep>("idle");
  const [recordDuration, setRecordDuration] = useState(0);
  const [selectedAnalysis, setSelectedAnalysis] = useState<VoiceprintAnalysis | null>(null);
  const [bubbleText, setBubbleText] = useState("");
  const [bubbleStyle, setBubbleStyle] = useState<"cloud" | "round" | "shout">("cloud");
  const [reverseInput, setReverseInput] = useState("");
  const [reverseOutput, setReverseOutput] = useState("");
  const [showHistory, setShowHistory] = useState(locState?.showHistory ?? false);
  const [historyPetFilter, setHistoryPetFilter] = useState<string>("all");
  const [expandedReport, setExpandedReport] = useState<string | null>(locState?.focusAnalysisId ?? null);

  const currentPet = pets.find((p) => p.species === petType);

  const speciesAnalyses = analyses.filter((a) => {
    const pet = pets.find((p) => p.id === a.petId);
    return pet?.species === petType;
  });

  const filteredHistory = historyPetFilter === "all"
    ? analyses
    : analyses.filter((a) => a.petId === historyPetFilter);

  useEffect(() => {
    if (locState?.focusAnalysisId) {
      const target = analyses.find((a) => a.id === locState.focusAnalysisId);
      if (target) {
        const pet = pets.find((p) => p.id === target.petId);
        if (pet) setPetType(pet.species);
        setSelectedAnalysis(target);
        setFlowStep("result");
        setExpandedReport(target.id);
      }
    }
  }, [locState, analyses, pets]);

  const handleStartRecording = useCallback(() => {
    setFlowStep("recording");
    setRecordDuration(0);
    setSelectedAnalysis(null);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (flowStep === "recording") {
      interval = setInterval(() => {
        setRecordDuration((d) => {
          if (d >= 3) {
            setFlowStep("processing");
            return d;
          }
          return +(d + 0.1).toFixed(1);
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [flowStep]);

  useEffect(() => {
    if (flowStep !== "processing") return;
    const timer = setTimeout(() => {
      const pool = petType === "dog" ? DOG_EMOTIONS : CAT_EMOTIONS;
      const picked = pool[Math.floor(Math.random() * pool.length)];
      const newAnalysis: VoiceprintAnalysis = {
        ...picked,
        id: "a_new_" + Date.now(),
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      };
      setSelectedAnalysis(newAnalysis);
      addAnalysis(newAnalysis);
      setBubbleText(newAnalysis.semanticText);
      setFlowStep("result");
    }, 1500);
    return () => clearTimeout(timer);
  }, [flowStep, petType, addAnalysis]);

  const handleReverseTranslate = () => {
    if (!reverseInput.trim()) return;
    const soundMap = petType === "dog" ? DOG_SOUNDS : CAT_SOUNDS;
    const match = Object.entries(soundMap).find(([k]) => reverseInput.includes(k));
    setReverseOutput(match ? match[1] : (petType === "dog"
      ? "汪汪！（歪头看着你，好像在认真听）"
      : "喵～（眯着眼，似乎在思考什么）"));
  };

  const handleSwitchSpecies = (s: Species) => {
    setPetType(s);
    setFlowStep("idle");
    setRecordDuration(0);
    setSelectedAnalysis(null);
    setReverseOutput("");
    setBubbleText("");
  };

  const emotion = selectedAnalysis ? emotionConfig[selectedAnalysis.emotion] : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between animate-stagger-1">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl text-warm-brown flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-brand-orange" />
            实时声纹翻译
          </h1>
          <p className="mt-1 text-warm-gray">
            按下按钮，听听你的毛孩子在说什么～
          </p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`btn-ghost flex items-center gap-2 ${showHistory ? "!border-brand-orange/40 !bg-brand-orange/5" : ""}`}
        >
          <History className="w-4 h-4" />
          {showHistory ? "收起历史" : "翻译历史"}
        </button>
      </div>

      {showHistory && (
        <HistoryPanel
          analyses={filteredHistory}
          pets={pets}
          historyPetFilter={historyPetFilter}
          setHistoryPetFilter={setHistoryPetFilter}
          expandedReport={expandedReport}
          setExpandedReport={setExpandedReport}
          onSelect={(a) => {
            const pet = pets.find((p) => p.id === a.petId);
            if (pet) setPetType(pet.species);
            setSelectedAnalysis(a);
            setFlowStep("result");
            setBubbleText(a.semanticText);
            setExpandedReport(a.id);
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 card animate-stagger-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl text-warm-brown flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-mint" />
              声纹采集
              {flowStep !== "idle" && (
                <span className="badge bg-brand-mint/15 text-brand-mint-dark text-[10px] ml-1">
                  {flowStep === "recording" ? "采集中" : flowStep === "processing" ? "分析中" : "已完成"}
                </span>
              )}
            </h2>
            <div className="flex bg-cream-100 rounded-2xl p-1">
              <button
                onClick={() => handleSwitchSpecies("dog")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  petType === "dog" ? "bg-white text-brand-orange shadow-soft" : "text-warm-gray hover:text-warm-brown"
                }`}
              >
                <Dog className="w-4 h-4" />
                狗狗模式
              </button>
              <button
                onClick={() => handleSwitchSpecies("cat")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  petType === "cat" ? "bg-white text-brand-mint shadow-soft" : "text-warm-gray hover:text-warm-brown"
                }`}
              >
                <Cat className="w-4 h-4" />
                猫猫模式
              </button>
            </div>
          </div>

          <div className="relative flex flex-col items-center justify-center py-8 px-4">
            {currentPet && (
              <div className="mb-6 text-center">
                <div className={`w-20 h-20 mx-auto rounded-full overflow-hidden border-3 shadow-soft ${
                  petType === "dog" ? "border-brand-orange/30" : "border-brand-mint/30"
                }`}>
                  <img src={currentPet.avatar} alt={currentPet.name} className="w-full h-full object-cover" />
                </div>
                <p className="mt-2 font-medium text-warm-brown">{currentPet.name}</p>
                <p className="text-xs text-warm-gray">
                  {petType === "dog" ? "🐕 犬类声纹模型 v2.3.0" : "🐱 猫类声纹模型 v2.3.0"}
                </p>
              </div>
            )}

            <div className="relative flex items-center justify-center w-48 h-48">
              {(flowStep === "recording" || flowStep === "processing") && (
                <>
                  <div className={`absolute w-full h-full rounded-full animate-pulse-ring ${
                    flowStep === "processing" ? "bg-brand-mint/20" : "bg-brand-orange/20"
                  }`} />
                  <div className={`absolute w-5/6 h-5/6 rounded-full animate-pulse-ring ${
                    flowStep === "processing" ? "bg-brand-mint/15" : "bg-brand-orange/15"
                  }`} style={{ animationDelay: "0.3s" }} />
                </>
              )}
              <button
                onClick={() => {
                  if (flowStep === "idle") handleStartRecording();
                  else if (flowStep === "recording") setFlowStep("processing");
                }}
                disabled={flowStep === "processing"}
                className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-hover disabled:opacity-80 ${
                  flowStep === "recording"
                    ? "bg-gradient-to-br from-red-500 to-red-400 text-white scale-105"
                    : flowStep === "processing"
                      ? "bg-gradient-to-br from-brand-mint to-brand-mint-light text-white scale-105 animate-pulse"
                      : "bg-gradient-to-br from-brand-orange to-brand-orange-light text-white hover:scale-105 active:scale-95"
                }`}
              >
                {flowStep === "recording" ? (
                  <StopCircle className="w-14 h-14 animate-pulse" />
                ) : flowStep === "processing" ? (
                  <Sparkles className="w-14 h-14 animate-spin" />
                ) : (
                  <Mic className="w-14 h-14" />
                )}
              </button>
            </div>

            <div className="mt-8 h-16 flex items-end justify-center gap-1 w-full max-w-sm">
              {waveBars.map((i) => {
                const baseH = 8 + Math.sin(i * 0.6) * 6;
                const isActive = flowStep === "recording";
                const isProcessing = flowStep === "processing";
                return (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-150 ${
                      isActive ? (i % 2 === 0 ? "bg-brand-orange" : "bg-brand-mint")
                        : isProcessing ? "bg-brand-mint/60"
                        : "bg-cream-200"
                    }`}
                    style={{
                      height: isActive
                        ? `${baseH + Math.random() * 40}px`
                        : isProcessing
                          ? `${baseH + 12 + Math.sin(Date.now() / 300 + i) * 16}px`
                          : `${baseH}px`,
                      animation: isActive ? "wave 0.8s ease-in-out infinite" : isProcessing ? "wave 1.2s ease-in-out infinite" : "none",
                      animationDelay: `${i * 40}ms`,
                    }}
                  />
                );
              })}
            </div>

            <div className="mt-6 flex items-center gap-3 text-warm-gray">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-lg">
                {flowStep === "recording" ? recordDuration.toFixed(1) : flowStep === "processing" ? "分析中..." : "0.0"}s
              </span>
              <span className="text-sm text-warm-gray/70">
                {flowStep === "idle" && "点击开始录音"}
                {flowStep === "recording" && "正在聆听...点击停止"}
                {flowStep === "processing" && "AI 声纹模型分析中..."}
                {flowStep === "result" && "分析完成！查看右侧结果"}
              </span>
            </div>
          </div>
        </section>

        <div className="lg:col-span-5 space-y-6">
          <EmotionResultCard
            analysis={selectedAnalysis}
            emotion={emotion}
            expanded={expandedReport === selectedAnalysis?.id}
            onToggleExpand={() => setExpandedReport(
              expandedReport === selectedAnalysis?.id ? null : selectedAnalysis?.id ?? null
            )}
          />
          <BubbleGenerator
            bubbleText={bubbleText}
            setBubbleText={setBubbleText}
            bubbleStyle={bubbleStyle}
            setBubbleStyle={setBubbleStyle}
            analysis={selectedAnalysis}
          />
          <ReverseTranslatePanel
            input={reverseInput}
            setInput={setReverseInput}
            output={reverseOutput}
            onTranslate={handleReverseTranslate}
            petType={petType}
          />
        </div>
      </div>
    </div>
  );
}

function HistoryPanel({
  analyses,
  pets,
  historyPetFilter,
  setHistoryPetFilter,
  expandedReport,
  setExpandedReport,
  onSelect,
}: {
  analyses: VoiceprintAnalysis[];
  pets: Pet[];
  historyPetFilter: string;
  setHistoryPetFilter: (v: string) => void;
  expandedReport: string | null;
  setExpandedReport: (v: string | null) => void;
  onSelect: (a: VoiceprintAnalysis) => void;
}) {
  return (
    <section className="card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg text-warm-brown flex items-center gap-2">
          <History className="w-5 h-5 text-brand-orange" />
          翻译历史记录
          <span className="badge bg-cream-100 text-warm-gray text-[10px]">{analyses.length} 条</span>
        </h3>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-warm-gray" />
          <select
            value={historyPetFilter}
            onChange={(e) => setHistoryPetFilter(e.target.value)}
            className="text-sm rounded-xl border border-cream-200 bg-white px-3 py-1.5 text-warm-brown focus:outline-none focus:border-brand-orange/40"
          >
            <option value="all">全部宠物</option>
            {pets.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.species === "dog" ? "🐕" : "🐱"})</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
        {analyses.length === 0 ? (
          <p className="text-center text-warm-gray py-8">暂无翻译记录</p>
        ) : analyses.map((a) => {
          const pet = pets.find((p) => p.id === a.petId);
          const emo = emotionConfig[a.emotion];
          const isExpanded = expandedReport === a.id;
          return (
            <div key={a.id} className="rounded-2xl border border-cream-200 overflow-hidden">
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-cream-50 transition-colors"
                onClick={() => onSelect(a)}
              >
                <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-cream-200">
                  <img src={pet?.avatar} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-warm-brown">{pet?.name}</span>
                    {emo && <span className={`badge ${emo.bg} ${emo.text} text-[10px]`}>{emo.emoji} {emo.label}</span>}
                    <span className="text-[10px] text-warm-gray/60 ml-auto">{a.createdAt}</span>
                  </div>
                  <p className="text-xs text-warm-gray mt-0.5 truncate">&ldquo;{a.semanticText}&rdquo;</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setExpandedReport(isExpanded ? null : a.id); }}
                  className="p-1.5 rounded-lg hover:bg-cream-100 text-warm-gray"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-cream-100 animate-fade-in space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Zap className="w-3 h-3 text-accent-sunny" />
                    <span className="text-warm-gray">置信度</span>
                    <span className="font-semibold text-warm-brown">{Math.round(a.confidence * 100)}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-cream-50 rounded-lg p-2 text-center">
                      <div className="text-warm-gray">频率</div>
                      <div className="font-semibold text-warm-brown">{a.voiceprintReport.frequency}Hz</div>
                    </div>
                    <div className="bg-cream-50 rounded-lg p-2 text-center">
                      <div className="text-warm-gray">时长</div>
                      <div className="font-semibold text-warm-brown">{a.voiceprintReport.duration}s</div>
                    </div>
                    <div className="bg-cream-50 rounded-lg p-2 text-center">
                      <div className="text-warm-gray">强度</div>
                      <div className="font-semibold text-warm-brown">{Math.round(a.voiceprintReport.intensity * 100)}%</div>
                    </div>
                  </div>
                  <div className="bg-brand-mint/5 rounded-lg p-2 text-xs flex items-start gap-2">
                    <BarChart3 className="w-4 h-4 text-brand-mint shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-brand-mint-dark">声纹模式：</span>
                      <span className="text-warm-brown/80">{a.voiceprintReport.pattern}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EmotionResultCard({
  analysis,
  emotion,
  expanded,
  onToggleExpand,
}: {
  analysis: VoiceprintAnalysis | null;
  emotion: (typeof emotionConfig)[Emotion] | null;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  if (!analysis || !emotion) {
    return (
      <section className="card animate-stagger-2">
        <h2 className="font-display text-xl text-warm-brown mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-brand-orange" />
          情绪分析结果
        </h2>
        <div className="text-center py-10 text-warm-gray">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>开始录音后将在这里显示分析结果</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card animate-stagger-2">
      <h2 className="font-display text-xl text-warm-brown mb-4 flex items-center gap-2">
        <Heart className="w-5 h-5 text-brand-orange" />
        情绪分析结果
      </h2>
      <div className="space-y-5">
        <div className={`rounded-2xl p-4 border border-white/60 ${emotion.bg}`}>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{emotion.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${emotion.dot}`} />
                <span className={`font-display text-lg font-semibold ${emotion.text}`}>{emotion.label}</span>
                <span className={`badge ${emotion.bg} ${emotion.text} border border-white/50`}>{analysis.emotionLabel}</span>
              </div>
              <p className="mt-1 text-sm text-warm-gray">情绪识别</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-warm-gray flex items-center gap-1"><Zap className="w-4 h-4 text-accent-sunny" />置信度</span>
            <span className="font-semibold text-warm-brown">{Math.round(analysis.confidence * 100)}%</span>
          </div>
          <div className="h-3 bg-cream-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-orange to-brand-mint rounded-full transition-all duration-700" style={{ width: `${analysis.confidence * 100}%` }} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-cream-50 to-cream-100 rounded-2xl p-5 border border-cream-200">
          <div className="flex items-center gap-2 text-sm text-warm-gray mb-2">
            <MessageSquare className="w-4 h-4 text-brand-orange" />语义翻译
          </div>
          <p className="font-medium text-warm-brown leading-relaxed text-lg">&ldquo;{analysis.semanticText}&rdquo;</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-cream-50 rounded-xl p-3 border border-cream-100">
            <div className="text-xs text-warm-gray flex items-center gap-1"><Activity className="w-3 h-3" />声纹频率</div>
            <div className="mt-1 font-display text-xl text-warm-brown">{analysis.voiceprintReport.frequency}<span className="text-xs ml-1 text-warm-gray">Hz</span></div>
          </div>
          <div className="bg-cream-50 rounded-xl p-3 border border-cream-100">
            <div className="text-xs text-warm-gray flex items-center gap-1"><Clock className="w-3 h-3" />持续时长</div>
            <div className="mt-1 font-display text-xl text-warm-brown">{analysis.voiceprintReport.duration}<span className="text-xs ml-1 text-warm-gray">秒</span></div>
          </div>
        </div>

        <button onClick={onToggleExpand} className="w-full text-left">
          <div className={`flex items-start gap-3 rounded-xl p-4 border transition-colors ${
            expanded ? "bg-brand-mint/10 border-brand-mint/30" : "bg-brand-mint/5 border-brand-mint/20 hover:bg-brand-mint/10"
          }`}>
            <BarChart3 className="w-5 h-5 text-brand-mint shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-brand-mint-dark">声纹报告详情</p>
              <p className="mt-1 text-sm text-warm-brown/80">{analysis.voiceprintReport.pattern}，强度 {Math.round(analysis.voiceprintReport.intensity * 100)}%</p>
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-brand-mint" /> : <Eye className="w-4 h-4 text-brand-mint" />}
          </div>
        </button>

        {expanded && (
          <div className="bg-cream-50 rounded-2xl p-4 border border-cream-100 space-y-3 animate-fade-in">
            <h4 className="font-medium text-warm-brown text-sm flex items-center gap-1"><Sparkles className="w-4 h-4 text-brand-orange" />声纹分析报告</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-warm-gray">基频范围</span>
                <div className="font-semibold text-warm-brown">{Math.round(analysis.voiceprintReport.frequency * 0.85)}-{Math.round(analysis.voiceprintReport.frequency * 1.15)} Hz</div>
              </div>
              <div>
                <span className="text-warm-gray">谐波结构</span>
                <div className="font-semibold text-warm-brown">{analysis.voiceprintReport.intensity > 0.6 ? "丰富谐波" : "单谐波"}</div>
              </div>
              <div>
                <span className="text-warm-gray">声纹模式</span>
                <div className="font-semibold text-warm-brown">{analysis.voiceprintReport.pattern}</div>
              </div>
              <div>
                <span className="text-warm-gray">模型版本</span>
                <div className="font-semibold text-warm-brown">v2.3.0</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-cream-200">
              <span className="text-xs text-warm-gray">模型分析说明</span>
              <p className="text-sm text-warm-brown mt-1">
                基于自研{analysis.petId === "p1" ? "犬类" : "猫类"}声纹模型 v2.3.0 分析，
                该声纹样本频率为 {analysis.voiceprintReport.frequency}Hz，
                匹配{analysis.voiceprintReport.pattern}特征，
                结合时长 {analysis.voiceprintReport.duration}s 和强度 {Math.round(analysis.voiceprintReport.intensity * 100)}%，
                判定情绪为「{analysis.emotionLabel}」，置信度 {Math.round(analysis.confidence * 100)}%。
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function BubbleGenerator({
  bubbleText,
  setBubbleText,
  bubbleStyle,
  setBubbleStyle,
  analysis,
}: {
  bubbleText: string;
  setBubbleText: (v: string) => void;
  bubbleStyle: "cloud" | "round" | "shout";
  setBubbleStyle: (v: "cloud" | "round" | "shout") => void;
  analysis: VoiceprintAnalysis | null;
}) {
  const styles: { id: typeof bubbleStyle; label: string; icon: string }[] = [
    { id: "cloud", label: "云朵", icon: "☁️" },
    { id: "round", label: "圆形", icon: "💬" },
    { id: "shout", label: "呐喊", icon: "📢" },
  ];

  return (
    <section className="card animate-stagger-3">
      <h2 className="font-display text-xl text-warm-brown mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-accent-pink" />
        文字气泡生成
        {analysis && <span className="badge bg-brand-mint/10 text-brand-mint-dark text-[10px]">已自动填充翻译结果</span>}
      </h2>
      <div className="space-y-4">
        <div className="flex gap-2">
          {styles.map((s) => (
            <button key={s.id} onClick={() => setBubbleStyle(s.id)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              bubbleStyle === s.id ? "bg-gradient-to-r from-brand-orange/10 to-brand-mint/10 text-brand-orange-dark shadow-soft border border-brand-orange/20" : "bg-cream-50 text-warm-gray hover:bg-cream-100 border border-transparent"
            }`}>
              <span className="mr-1">{s.icon}</span>{s.label}
            </button>
          ))}
        </div>
        <textarea value={bubbleText} onChange={(e) => setBubbleText(e.target.value)} placeholder="输入想要生成气泡的文字..." className="input-base min-h-[90px] resize-none" />
        {bubbleText && (
          <div className={`relative inline-block max-w-full px-5 py-3 text-warm-brown bg-gradient-to-br ${
            bubbleStyle === "cloud" ? "from-cream-100 to-white rounded-[2rem] shadow-soft"
              : bubbleStyle === "round" ? "from-white to-cream-50 rounded-3xl shadow-soft"
                : "from-accent-sunny/20 to-accent-pink/20 rounded-2xl shadow-soft"
          }`}>
            <p className="text-sm leading-relaxed">{bubbleText}</p>
            <div className={`absolute -bottom-2 left-8 w-4 h-4 rotate-45 ${
              bubbleStyle === "shout" ? "bg-accent-sunny/20" : bubbleStyle === "cloud" ? "bg-cream-100" : "bg-cream-50"
            }`} />
          </div>
        )}
      </div>
    </section>
  );
}

function ReverseTranslatePanel({
  input,
  setInput,
  output,
  onTranslate,
  petType,
}: {
  input: string;
  setInput: (v: string) => void;
  output: string;
  onTranslate: () => void;
  petType: Species;
}) {
  return (
    <section className="card animate-stagger-4">
      <h2 className="font-display text-xl text-warm-brown mb-4 flex items-center gap-2">
        <ArrowLeftRight className="w-5 h-5 text-brand-mint" />
        反向翻译
        <span className="badge bg-cream-100 text-warm-gray text-[10px]">
          {petType === "dog" ? "🐕 人话→狗语" : "🐱 人话→猫语"}
        </span>
      </h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-warm-gray mb-2 block flex items-center gap-1">
            <Volume2 className="w-3 h-3" />你想对{petType === "dog" ? "狗狗" : "猫猫"}说的话
          </label>
          <div className="relative">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onTranslate()} placeholder={petType === "dog" ? "例如：吃饭时间到啦" : "例如：乖，过来"} className="input-base pr-14" />
            <button onClick={onTranslate} disabled={!input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gradient-to-r from-brand-mint to-brand-mint-light text-white flex items-center justify-center shadow-soft hover:shadow-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {(petType === "dog" ? Object.keys(DOG_SOUNDS) : Object.keys(CAT_SOUNDS)).map((phrase) => (
              <button key={phrase} onClick={() => { setInput(phrase); }} className="text-xs px-2.5 py-1 rounded-full bg-cream-100 text-warm-brown hover:bg-brand-orange/10 hover:text-brand-orange-dark transition-colors">
                {phrase}
              </button>
            ))}
          </div>
        </div>
        {output && (
          <div className="bg-gradient-to-br from-brand-mint/10 to-accent-sky/10 rounded-2xl p-4 border border-brand-mint/20 animate-slide-in-right">
            <div className="flex items-center gap-2 text-sm text-brand-mint-dark mb-2">
              <Play className="w-4 h-4" />
              翻译为{petType === "dog" ? "狗狗" : "猫猫"}语言
            </div>
            <p className="text-warm-brown font-medium leading-relaxed">{output}</p>
          </div>
        )}
      </div>
    </section>
  );
}
