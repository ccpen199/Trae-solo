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
  Save,
  Check,
  X,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  User,
  RefreshCw,
  VolumeX,
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
  const { pets, analyses, addAnalysis, updateAnalysis } = useAppStore();

  const [petType, setPetType] = useState<Species>("dog");
  const [flowStep, setFlowStep] = useState<FlowStep>("idle");
  const [recordDuration, setRecordDuration] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [detectedPeak, setDetectedPeak] = useState<{ freq: number; db: number } | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<VoiceprintAnalysis | null>(null);
  const [bubbleText, setBubbleText] = useState("");
  const [bubbleStyle, setBubbleStyle] = useState<"cloud" | "round" | "shout">("cloud");
  const [reverseInput, setReverseInput] = useState("");
  const [reverseOutput, setReverseOutput] = useState("");
  const [reversePlaying, setReversePlaying] = useState(false);
  const [reverseSaved, setReverseSaved] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(locState?.showHistory ?? false);
  const [historyPetFilter, setHistoryPetFilter] = useState<string>("all");
  const [expandedReport, setExpandedReport] = useState<string | null>(locState?.focusAnalysisId ?? null);
  const [reviewModal, setReviewModal] = useState<{ analysis: VoiceprintAnalysis; action: "approve" | "reject" | "resample" } | null>(null);
  const [reviewNote, setReviewNote] = useState("");

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
    setVolumeLevel(0);
    setDetectedPeak(null);
    setSelectedAnalysis(null);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let volInterval: ReturnType<typeof setInterval>;
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
      volInterval = setInterval(() => {
        const baseVol = petType === "dog" ? 0.55 : 0.4;
        const noise = Math.random() * 0.35;
        const wave = Math.sin(Date.now() / 180) * 0.15;
        const newVol = Math.min(0.98, Math.max(0.05, baseVol + noise + wave));
        setVolumeLevel(newVol);
        if (newVol > 0.65) {
          const freqBase = petType === "dog" ? 450 : 300;
          const freq = freqBase + Math.floor(Math.random() * (petType === "dog" ? 120 : 200));
          const db = 55 + Math.floor(newVol * 35);
          setDetectedPeak({ freq, db });
        }
      }, 80);
    }
    return () => {
      clearInterval(interval);
      clearInterval(volInterval);
    };
  }, [flowStep, petType]);

  useEffect(() => {
    if (flowStep !== "processing") return;
    const timer = setTimeout(() => {
      const pool = petType === "dog" ? DOG_EMOTIONS : CAT_EMOTIONS;
      const picked = pool[Math.floor(Math.random() * pool.length)];
      const newAnalysis: VoiceprintAnalysis = {
        ...picked,
        id: "a_new_" + Date.now(),
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        reviewStatus: "pending",
        reviewHistory: [
          { status: "pending", at: new Date().toISOString().slice(0, 16).replace("T", " "), by: "系统" },
        ],
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
    const output = match ? match[1] : (petType === "dog"
      ? "汪汪！（歪头看着你，好像在认真听）"
      : "喵～（眯着眼，似乎在思考什么）");
    setReverseOutput(output);
    setReverseSaved(null);
  };

  const handlePlayReverse = () => {
    if (!reverseOutput) return;
    setReversePlaying(true);
    setTimeout(() => setReversePlaying(false), 2500);
  };

  const handleSaveReverse = () => {
    if (!reverseOutput || !currentPet) return;
    const record: VoiceprintAnalysis = {
      id: "r_new_" + Date.now(),
      petId: currentPet.id,
      audioUrl: "/audio/reverse_" + Date.now() + ".wav",
      emotion: "happy",
      emotionLabel: "主人对话",
      confidence: 0.95,
      semanticText: `【主人说】${reverseInput} → ${reverseOutput}`,
      voiceprintReport: {
        frequency: petType === "dog" ? 420 : 350,
        duration: 2.0,
        intensity: 0.7,
        pattern: "主人语音→宠物拟声 反向翻译对话",
      },
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      isReverse: true,
      reverseSource: {
        ownerText: reverseInput,
        petSound: reverseOutput,
        playedDuration: reversePlaying ? 2.5 : 0,
      },
      reviewStatus: "approved",
      reviewNote: "反向翻译对话已保存",
      reviewHistory: [
        { status: "pending", at: new Date().toISOString().slice(0, 16).replace("T", " "), by: "系统" },
        { status: "approved", note: "反向翻译对话已保存", at: new Date().toISOString().slice(0, 16).replace("T", " "), by: "小林" },
      ],
    };
    addAnalysis(record);
    setReverseSaved(record.id);
    setShowHistory(true);
    setExpandedReport(record.id);
  };

  const handleQuickPhrase = (phrase: string) => {
    setReverseInput(phrase);
    const soundMap = petType === "dog" ? DOG_SOUNDS : CAT_SOUNDS;
    const match = Object.entries(soundMap).find(([k]) => phrase.includes(k));
    const output = match ? match[1] : (petType === "dog"
      ? "汪汪！（歪头看着你，好像在认真听）"
      : "喵～（眯着眼，似乎在思考什么）");
    setReverseOutput(output);
    setReverseSaved(null);
  };

  const handleSwitchSpecies = (s: Species) => {
    setPetType(s);
    setFlowStep("idle");
    setRecordDuration(0);
    setSelectedAnalysis(null);
    setReverseOutput("");
    setBubbleText("");
  };

  const handleReview = (analysis: VoiceprintAnalysis, action: "approve" | "reject" | "resample") => {
    const newHistory = analysis.reviewHistory ? [...analysis.reviewHistory] : [];
    const statusMap = {
      approve: "approved" as const,
      reject: "rejected" as const,
      resample: "resampled" as const,
    };
    const newStatus = statusMap[action];
    newHistory.push({
      status: newStatus,
      note: reviewNote || undefined,
      at: new Date().toISOString().slice(0, 16).replace("T", " "),
      by: "小林",
    });
    const updated: VoiceprintAnalysis = {
      ...analysis,
      reviewStatus: newStatus,
      reviewNote: reviewNote || undefined,
      reviewHistory: newHistory,
    };
    updateAnalysis(updated);
    if (action === "resample") {
      const pet = pets.find((p) => p.id === analysis.petId);
      if (pet) setPetType(pet.species);
      setFlowStep("recording");
      setRecordDuration(0);
      setSelectedAnalysis(null);
      setShowHistory(false);
    }
    setReviewModal(null);
    setReviewNote("");
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
          onOpenReview={(analysis, action) => {
            setReviewModal({ analysis, action });
            setReviewNote(analysis.reviewNote || "");
          }}
          petType={petType}
        />
      )}

      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-brown/30 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-md w-full mx-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl text-warm-brown flex items-center gap-2">
                {reviewModal.action === "approve" && <ThumbsUp className="w-5 h-5 text-brand-mint" />}
                {reviewModal.action === "reject" && <ThumbsDown className="w-5 h-5 text-red-500" />}
                {reviewModal.action === "resample" && <RefreshCw className="w-5 h-5 text-brand-orange" />}
                {reviewModal.action === "approve" && "确认审核通过"}
                {reviewModal.action === "reject" && "确认审核驳回"}
                {reviewModal.action === "resample" && "重新采集声纹"}
              </h3>
              <button onClick={() => setReviewModal(null)} className="p-1.5 rounded-lg hover:bg-cream-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mb-4 space-y-2 text-sm">
              <div className="bg-cream-50 rounded-lg p-3">
                <div className="text-warm-gray mb-1">待审核报告</div>
                <div className="text-warm-brown font-medium">
                  {reviewModal.analysis.emotionLabel} - {reviewModal.analysis.semanticText}
                </div>
                <div className="text-xs text-warm-gray mt-1">
                  {pets.find(p => p.id === reviewModal.analysis.petId)?.name} · {reviewModal.analysis.createdAt}
                </div>
              </div>
              <div>
                <label className="text-warm-gray mb-1 block text-xs">审核备注（可选）</label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={reviewModal.action === "approve" ? "例如：情绪识别准确，声纹特征匹配" :
                    reviewModal.action === "reject" ? "例如：声纹强度偏高，情绪判断有误" :
                      "例如：环境噪音较大，需要重新采集"}
                  className="input-base min-h-[80px] resize-y"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setReviewModal(null)} className="btn-secondary flex-1">
                取消
              </button>
              <button
                onClick={() => handleReview(reviewModal.analysis, reviewModal.action)}
                className={`flex-1 ${
                  reviewModal.action === "approve" ? "btn-primary !bg-gradient-to-r !from-brand-mint !to-brand-mint-light" :
                    reviewModal.action === "reject" ? "btn-primary !bg-gradient-to-r !from-red-400 !to-red-500" :
                      "btn-primary"
                }`}
              >
                {reviewModal.action === "approve" ? "✓ 确认通过" :
                  reviewModal.action === "reject" ? "✗ 确认驳回" :
                    "↻ 开始重新采集"}
              </button>
            </div>
          </div>
        </div>
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

            {flowStep === "result" && selectedAnalysis && (
              <div className="absolute top-0 right-0 z-20">
                <button
                  onClick={handleStartRecording}
                  className="btn-primary !py-2 !px-4 text-sm"
                >
                  <Mic className="w-4 h-4" />
                  再来一次
                </button>
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
              {flowStep === "idle" && (
                <>
                  <div className="absolute w-full h-full rounded-full bg-brand-orange/8 animate-pulse-ring" />
                  <div className="absolute w-5/6 h-5/6 rounded-full bg-brand-orange/5 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
                </>
              )}
              <button
                onClick={() => {
                  if (flowStep === "idle" || flowStep === "result") handleStartRecording();
                  else if (flowStep === "recording") setFlowStep("processing");
                }}
                disabled={flowStep === "processing"}
                className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-hover disabled:opacity-80 ${
                  flowStep === "recording"
                    ? "bg-gradient-to-br from-red-500 to-red-400 text-white scale-105"
                    : flowStep === "processing"
                      ? "bg-gradient-to-br from-brand-mint to-brand-mint-light text-white scale-105 animate-pulse"
                      : flowStep === "result"
                        ? "bg-gradient-to-br from-brand-mint to-brand-mint-light text-white hover:scale-105 active:scale-95"
                        : "bg-gradient-to-br from-brand-orange to-brand-orange-light text-white hover:scale-105 active:scale-95"
                }`}
              >
                {flowStep === "recording" ? (
                  <StopCircle className="w-14 h-14 animate-pulse" />
                ) : flowStep === "processing" ? (
                  <Sparkles className="w-14 h-14 animate-spin" />
                ) : flowStep === "result" ? (
                  <Mic className="w-14 h-14" />
                ) : (
                  <div className="flex flex-col items-center">
                    <Mic className="w-12 h-12" />
                    <span className="text-[11px] mt-1 font-medium opacity-90">点击录音</span>
                  </div>
                )}
              </button>
            </div>

            <div className="mt-8 h-16 flex items-end justify-center gap-1 w-full max-w-sm">
              {waveBars.map((i) => {
                const baseH = 8 + Math.sin(i * 0.6) * 6;
                const isActive = flowStep === "recording";
                const isProcessing = flowStep === "processing";
                const isIdle = flowStep === "idle";
                const dynamicH = isActive
                  ? baseH + volumeLevel * 50 + Math.random() * 10
                  : isProcessing
                    ? baseH + 12 + Math.sin(Date.now() / 300 + i) * 16
                    : isIdle
                      ? baseH + Math.sin(Date.now() / 600 + i * 0.8) * 4
                      : baseH;
                return (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-75 ${
                      isActive
                        ? volumeLevel > 0.7
                          ? "bg-red-400"
                          : volumeLevel > 0.5
                            ? (i % 2 === 0 ? "bg-brand-orange" : "bg-brand-mint")
                            : (i % 2 === 0 ? "bg-brand-orange/50" : "bg-brand-mint/50")
                        : isProcessing
                          ? "bg-brand-mint/60"
                          : isIdle
                            ? (i % 2 === 0 ? "bg-brand-orange/20" : "bg-brand-mint/20")
                            : "bg-cream-200"
                    }`}
                    style={{
                      height: `${dynamicH}px`,
                      animation: isActive ? "none" : isProcessing ? "wave 1.2s ease-in-out infinite" : isIdle ? "wave 2.4s ease-in-out infinite" : "none",
                      animationDelay: `${i * 40}ms`,
                    }}
                  />
                );
              })}
            </div>

            {flowStep === "recording" && (
              <div className="mt-3 w-full max-w-sm space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 text-xs">
                  <Volume2 className={`w-3.5 h-3.5 ${
                    volumeLevel > 0.7 ? "text-red-500" : volumeLevel > 0.4 ? "text-brand-orange" : "text-brand-mint"
                  }`} />
                  <span className="text-warm-gray">输入音量</span>
                  <div className="flex-1 h-2 bg-cream-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-75 ${
                      volumeLevel > 0.7 ? "bg-gradient-to-r from-orange-400 to-red-500" :
                        volumeLevel > 0.4 ? "bg-gradient-to-r from-brand-orange to-brand-mint" :
                          "bg-gradient-to-r from-brand-mint to-accent-sky"
                    }`} style={{ width: `${volumeLevel * 100}%` }} />
                  </div>
                  <span className="font-mono text-warm-brown font-medium w-10 text-right">
                    {Math.round(volumeLevel * 100)}%
                  </span>
                </div>
                {detectedPeak && (
                  <div className="flex items-center justify-center gap-4 text-[10px] bg-gradient-to-r from-brand-orange/10 to-brand-mint/10 rounded-lg px-3 py-1.5 animate-slide-in-right">
                    <span className="flex items-center gap-1">
                      <Activity className="w-2.5 h-2.5 text-brand-orange" />
                      峰值频率 <span className="font-semibold text-warm-brown">{detectedPeak.freq}Hz</span>
                    </span>
                    <span className="w-px h-3 bg-cream-200" />
                    <span className="flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 text-accent-sunny" />
                      声压 <span className="font-semibold text-warm-brown">{detectedPeak.db}dB</span>
                    </span>
                    <span className="w-px h-3 bg-cream-200" />
                    <span className="flex items-center gap-1">
                      <Check className="w-2.5 h-2.5 text-brand-mint" />
                      <span className="text-brand-mint-dark font-medium">有效声纹 ✓</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {flowStep === "processing" && (
              <div className="mt-3 w-full max-w-sm bg-gradient-to-r from-brand-mint/10 to-accent-sky/10 rounded-lg px-3 py-2 animate-fade-in">
                <div className="flex items-center justify-center gap-2 text-[10px] text-brand-mint-dark">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  <span>正在匹配{petType === "dog" ? "犬类" : "猫类"}声纹特征库 → 情绪分类 → 生成语义气泡</span>
                  <ArrowLeftRight className="w-3 h-3" />
                </div>
              </div>
            )}

            {flowStep === "result" && selectedAnalysis && (
              <div className="mt-3 w-full max-w-sm bg-gradient-to-r from-brand-orange/10 to-brand-mint/10 rounded-lg px-3 py-2 animate-fade-in">
                <div className="flex items-center justify-center gap-2 text-[10px]">
                  <Check className="w-3 h-3 text-brand-mint" />
                  <span className="text-brand-mint-dark font-medium">
                    采集完成 → 情绪识别 → 气泡生成 → 已写入历史
                  </span>
                  <Sparkles className="w-3 h-3 text-accent-sunny" />
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-3 text-warm-gray">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-lg">
                  {flowStep === "recording" ? recordDuration.toFixed(1) : flowStep === "processing" ? "分析中..." : flowStep === "result" ? "✓ 完成" : "0.0"}s
                </span>
              </div>
              <div className="text-sm text-center min-h-[20px]">
                {flowStep === "idle" && (
                  <span className="text-warm-gray/80">
                    🎯 对准{petType === "dog" ? "狗狗" : "猫猫"}点击大按钮，聆听 3 秒即可识别情绪
                  </span>
                )}
                {flowStep === "recording" && (
                  <span className="text-brand-orange font-medium animate-pulse">
                    🎙️ 正在聆听中... 点击红色按钮可提前停止分析
                  </span>
                )}
                {flowStep === "processing" && (
                  <span className="text-brand-mint-dark font-medium">
                    ✨ AI 模型匹配声纹特征中...
                  </span>
                )}
                {flowStep === "result" && (
                  <span className="text-brand-mint-dark font-medium">
                    ✅ 分析完成！右侧展示情绪→气泡→反向翻译，可点击「再来一次」
                  </span>
                )}
              </div>
              {flowStep === "idle" && (
                <div className="flex flex-wrap justify-center gap-1.5 mt-1 max-w-sm">
                  {petType === "dog" ? (
                    <>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange-dark">😊 开心吠叫</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-pink/15 text-pink-600">🎾 玩耍求伴</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-sky/20 text-sky-700">😟 焦虑呜咽</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-mint/15 text-brand-mint-dark">🤔 好奇探询</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange-dark">🍖 饥饿喵叫</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-mint/15 text-brand-mint-dark">🤔 好奇颤音</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-sky/20 text-sky-700">😴 困倦呼噜</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-sunny/20 text-amber-700">😊 满足咕噜</span>
                    </>
                  )}
                </div>
              )}
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
            onQuickPhrase={handleQuickPhrase}
            onPlay={handlePlayReverse}
            onSave={handleSaveReverse}
            playing={reversePlaying}
            savedId={reverseSaved}
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
  onOpenReview,
  petType,
}: {
  analyses: VoiceprintAnalysis[];
  pets: Pet[];
  historyPetFilter: string;
  setHistoryPetFilter: (v: string) => void;
  expandedReport: string | null;
  setExpandedReport: (v: string | null) => void;
  onSelect: (a: VoiceprintAnalysis) => void;
  onOpenReview: (a: VoiceprintAnalysis, action: "approve" | "reject" | "resample") => void;
  petType: Species;
}) {
  const getStatusStyle = (status?: string) => {
    switch (status) {
      case "approved": return { bg: "bg-brand-mint/15", text: "text-brand-mint-dark", icon: <Check className="w-2.5 h-2.5" />, label: "已通过" };
      case "rejected": return { bg: "bg-red-100", text: "text-red-600", icon: <X className="w-2.5 h-2.5" />, label: "已驳回" };
      case "resampled": return { bg: "bg-brand-orange/15", text: "text-brand-orange-dark", icon: <RefreshCw className="w-2.5 h-2.5" />, label: "已重采" };
      default: return { bg: "bg-cream-100", text: "text-warm-gray", icon: <Clock className="w-2.5 h-2.5" />, label: "待审核" };
    }
  };

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
      <div className="space-y-3 max-h-[420px] overflow-y-auto scrollbar-thin">
        {analyses.length === 0 ? (
          <p className="text-center text-warm-gray py-8">暂无翻译记录</p>
        ) : analyses.map((a) => {
          const pet = pets.find((p) => p.id === a.petId);
          const emo = emotionConfig[a.emotion];
          const isExpanded = expandedReport === a.id;
          const status = getStatusStyle(a.reviewStatus);
          const isReverse = !!a.isReverse;

          if (isReverse && a.reverseSource) {
            return (
              <div key={a.id} className="rounded-2xl border border-accent-sky/20 bg-gradient-to-br from-accent-sky/5 to-brand-mint/5 overflow-hidden">
                <div
                  className="flex items-start gap-3 p-3 cursor-pointer hover:from-accent-sky/8 hover:to-brand-mint/8 transition-colors"
                  onClick={() => onSelect(a)}
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-cream-200 bg-white">
                    <img src={pet?.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-warm-brown">{pet?.name}</span>
                        <span className="text-[10px] text-warm-gray/60">↔️ 主人对话</span>
                      </div>
                      <span className={`badge ${status.bg} ${status.text} text-[10px] flex items-center gap-0.5`}>
                        {status.icon} {status.label}
                      </span>
                      <span className="badge bg-brand-mint/10 text-brand-mint-dark text-[10px] flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" /> {Math.round(a.confidence * 100)}%
                      </span>
                      <span className="text-[10px] text-warm-gray/60 ml-auto">{a.createdAt}</span>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-start gap-1.5">
                        <User className="w-3 h-3 text-accent-sky shrink-0 mt-0.5" />
                        <div className="text-xs bg-white/80 rounded-lg px-2 py-1.5 border border-white">
                          <span className="text-warm-gray">主人说：</span>
                          <span className="text-warm-brown font-medium">{a.reverseSource.ownerText}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5 pl-6">
                        <ArrowLeftRight className="w-3 h-3 text-brand-mint shrink-0 mt-0.5" />
                        <div className="text-xs bg-gradient-to-r from-brand-mint/10 to-accent-sky/10 rounded-lg px-2 py-1.5 border border-brand-mint/15">
                          <span className="text-warm-gray">{petType === "dog" ? "🐕 狗狗拟声：" : "🐱 猫猫拟声："}</span>
                          <span className="text-warm-brown font-medium">{a.reverseSource.petSound}</span>
                        </div>
                      </div>
                      {a.reverseSource.playedDuration && a.reverseSource.playedDuration > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-brand-mint-dark pl-8">
                          <Volume2 className="w-2.5 h-2.5" />
                          已播放拟声 {a.reverseSource.playedDuration}s
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpandedReport(isExpanded ? null : a.id); }}
                    className="p-1.5 rounded-lg hover:bg-white/60 text-warm-gray"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-cream-100 animate-fade-in space-y-2.5">
                    <div className="bg-white/70 rounded-lg p-2.5">
                      <div className="text-xs text-warm-gray mb-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 审核记录
                      </div>
                      <div className="space-y-1.5">
                        {a.reviewHistory?.map((h, i) => (
                          <div key={i} className="flex items-start gap-2 text-[10px]">
                            <div className={`w-2 h-2 mt-1 rounded-full ${h.status === "approved" ? "bg-brand-mint" : h.status === "rejected" ? "bg-red-400" : h.status === "resampled" ? "bg-brand-orange" : "bg-warm-gray/40"}`} />
                            <div>
                              <span className="text-warm-brown font-medium">{h.by}</span>
                              <span className="text-warm-gray"> · {h.at}</span>
                              <div className={`${h.status === "approved" ? "text-brand-mint-dark" : h.status === "rejected" ? "text-red-500" : "text-warm-brown"}`}>
                                {h.status === "pending" ? "待系统审核" :
                                  h.status === "approved" ? "审核通过 ✓" :
                                    h.status === "rejected" ? "审核驳回 ✗" :
                                      "重新采集 ↻"}
                                {h.note && <span className="text-warm-gray"> — {h.note}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={a.id} className={`rounded-2xl border ${
              a.reviewStatus === "rejected" ? "border-red-200 bg-red-50/30" :
                a.reviewStatus === "approved" ? "border-brand-mint/20 bg-brand-mint/5" :
                  "border-cream-200"
            } overflow-hidden`}>
              <div
                className="flex items-start gap-3 p-3 cursor-pointer hover:bg-cream-50 transition-colors"
                onClick={() => onSelect(a)}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-cream-200">
                  <img src={pet?.avatar} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-warm-brown">{pet?.name}</span>
                    {emo && <span className={`badge ${emo.bg} ${emo.text} text-[10px]`}>{emo.emoji} {emo.label}</span>}
                    <span className={`badge ${status.bg} ${status.text} text-[10px] flex items-center gap-0.5`}>
                      {status.icon} {status.label}
                    </span>
                    <span className="badge bg-accent-sunny/15 text-amber-700 text-[10px] flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" /> {Math.round(a.confidence * 100)}%
                    </span>
                    <span className="text-[10px] text-warm-gray/60 ml-auto">{a.createdAt}</span>
                  </div>
                  <p className="text-xs text-warm-brown/90 mt-1 truncate">&ldquo;{a.semanticText}&rdquo;</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10px] text-warm-gray/80">
                    <span className="flex items-center gap-1">
                      <Activity className="w-2.5 h-2.5 text-brand-mint" />
                      {a.voiceprintReport.frequency}Hz
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-accent-sky" />
                      {a.voiceprintReport.duration}s
                    </span>
                    <span className="flex items-center gap-1 truncate max-w-[180px]">
                      <BarChart3 className="w-2.5 h-2.5 text-brand-orange" />
                      {a.voiceprintReport.pattern}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpandedReport(isExpanded ? null : a.id); }}
                    className="p-1.5 rounded-lg hover:bg-cream-100 text-warm-gray"
                    title={isExpanded ? "收起详情" : "展开详情"}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelect(a); }}
                    className="px-2 py-1 rounded-lg text-[10px] font-medium bg-brand-orange/10 text-brand-orange-dark hover:bg-brand-orange/20 transition-colors flex items-center gap-0.5"
                    title="复查这条报告"
                  >
                    <Eye className="w-2.5 h-2.5" /> 复查
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-cream-100 animate-fade-in space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-accent-sunny" />
                      <span className="text-warm-gray">模型置信度</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 max-w-[60%] ml-3">
                      <div className="flex-1 h-2 bg-cream-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          a.confidence > 0.9 ? "bg-gradient-to-r from-brand-mint to-brand-mint-light" :
                            a.confidence > 0.75 ? "bg-gradient-to-r from-brand-orange to-brand-mint" :
                              "bg-gradient-to-r from-amber-400 to-brand-orange"
                        }`} style={{ width: `${a.confidence * 100}%` }} />
                      </div>
                      <span className="font-semibold text-warm-brown">{Math.round(a.confidence * 100)}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-cream-50 rounded-lg p-2 text-center">
                      <div className="text-warm-gray">声纹频率</div>
                      <div className="font-semibold text-warm-brown">{a.voiceprintReport.frequency}Hz</div>
                      <div className="text-[9px] text-warm-gray/70">基频 {Math.round(a.voiceprintReport.frequency * 0.85)}-{Math.round(a.voiceprintReport.frequency * 1.15)}Hz</div>
                    </div>
                    <div className="bg-cream-50 rounded-lg p-2 text-center">
                      <div className="text-warm-gray">持续时长</div>
                      <div className="font-semibold text-warm-brown">{a.voiceprintReport.duration}s</div>
                      <div className="text-[9px] text-warm-gray/70">{a.voiceprintReport.duration < 1.5 ? "短促" : a.voiceprintReport.duration < 2.5 ? "中等" : "较长"}</div>
                    </div>
                    <div className="bg-cream-50 rounded-lg p-2 text-center">
                      <div className="text-warm-gray">能量强度</div>
                      <div className="font-semibold text-warm-brown">{Math.round(a.voiceprintReport.intensity * 100)}%</div>
                      <div className="text-[9px] text-warm-gray/70">{a.voiceprintReport.intensity > 0.7 ? "洪亮" : a.voiceprintReport.intensity > 0.5 ? "适中" : "轻柔"}</div>
                    </div>
                  </div>
                  <div className="bg-brand-mint/5 rounded-lg p-2.5 text-xs flex items-start gap-2">
                    <BarChart3 className="w-4 h-4 text-brand-mint shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-brand-mint-dark mb-0.5">声纹模式分析</div>
                      <div className="text-warm-brown/80">{a.voiceprintReport.pattern}</div>
                      <div className="mt-1 text-[10px] text-warm-gray/70">
                        模型版本 v2.3.0 · 物种：{pet?.species === "dog" ? "犬类" : "猫类"}专项模型
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-cream-200 p-2.5">
                    <div className="text-xs text-warm-gray mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 审核记录与操作
                    </div>
                    {a.reviewHistory && a.reviewHistory.length > 0 && (
                      <div className="space-y-2 mb-3 max-h-[120px] overflow-y-auto">
                        {a.reviewHistory.map((h, i) => (
                          <div key={i} className="flex items-start gap-2 text-[10px]">
                            <div className={`w-2 h-2 mt-1 rounded-full shrink-0 ${
                              h.status === "approved" ? "bg-brand-mint" :
                                h.status === "rejected" ? "bg-red-400" :
                                  h.status === "resampled" ? "bg-brand-orange" :
                                    "bg-warm-gray/40"
                            }`} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-warm-brown font-medium">{h.by}</span>
                                <span className="text-warm-gray">·</span>
                                <span className="text-warm-gray">{h.at}</span>
                              </div>
                              <div className={`${
                                h.status === "approved" ? "text-brand-mint-dark" :
                                  h.status === "rejected" ? "text-red-500" :
                                    "text-warm-brown"
                              }`}>
                                {h.status === "pending" ? "系统自动标记待审核" :
                                  h.status === "approved" ? "✓ 审核通过" :
                                    h.status === "rejected" ? "✗ 审核驳回" :
                                      "↻ 重新采集"}
                                {h.note && <span className="text-warm-gray ml-1">— {h.note}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpenReview(a, "approve"); }}
                        disabled={a.reviewStatus === "approved"}
                        className={`flex-1 min-w-[70px] text-[10px] px-2 py-1.5 rounded-lg font-medium flex items-center justify-center gap-0.5 transition-colors ${
                          a.reviewStatus === "approved"
                            ? "bg-brand-mint/15 text-brand-mint-dark cursor-default"
                            : "bg-brand-mint/10 text-brand-mint-dark hover:bg-brand-mint/20"
                        }`}
                      >
                        <ThumbsUp className="w-2.5 h-2.5" />
                        {a.reviewStatus === "approved" ? "已通过" : "通过"}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpenReview(a, "reject"); }}
                        disabled={a.reviewStatus === "rejected"}
                        className={`flex-1 min-w-[70px] text-[10px] px-2 py-1.5 rounded-lg font-medium flex items-center justify-center gap-0.5 transition-colors ${
                          a.reviewStatus === "rejected"
                            ? "bg-red-100 text-red-600 cursor-default"
                            : "bg-red-50 text-red-500 hover:bg-red-100"
                        }`}
                      >
                        <ThumbsDown className="w-2.5 h-2.5" />
                        {a.reviewStatus === "rejected" ? "已驳回" : "驳回"}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpenReview(a, "resample"); }}
                        className="flex-1 min-w-[70px] text-[10px] px-2 py-1.5 rounded-lg font-medium bg-brand-orange/10 text-brand-orange-dark hover:bg-brand-orange/20 transition-colors flex items-center justify-center gap-0.5"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        重新采样
                      </button>
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
  onQuickPhrase,
  onPlay,
  onSave,
  playing,
  savedId,
  petType,
}: {
  input: string;
  setInput: (v: string) => void;
  output: string;
  onTranslate: () => void;
  onQuickPhrase: (phrase: string) => void;
  onPlay: () => void;
  onSave: () => void;
  playing: boolean;
  savedId: string | null;
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
          <div className="mt-2">
            <div className="text-[10px] text-warm-gray/60 mb-1.5">快捷短语（点击一键生成拟声）：</div>
            <div className="flex flex-wrap gap-2">
              {(petType === "dog" ? Object.keys(DOG_SOUNDS) : Object.keys(CAT_SOUNDS)).map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => onQuickPhrase(phrase)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                    input === phrase
                      ? "bg-brand-orange/15 text-brand-orange-dark border border-brand-orange/30"
                      : "bg-cream-100 text-warm-brown hover:bg-brand-orange/10 hover:text-brand-orange-dark"
                  }`}
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        </div>
        {output && (
          <div className="bg-gradient-to-br from-brand-mint/10 to-accent-sky/10 rounded-2xl p-4 border border-brand-mint/20 animate-slide-in-right">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-brand-mint-dark">
                {playing ? (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-mint opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-mint" />
                    </span>
                    正在播放{petType === "dog" ? "狗狗" : "猫猫"}拟声...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    翻译为{petType === "dog" ? "狗狗" : "猫猫"}语言
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={onPlay}
                  disabled={playing}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 transition-colors ${
                    playing
                      ? "bg-brand-mint/20 text-brand-mint-dark cursor-wait"
                      : "bg-white text-brand-mint-dark hover:bg-brand-mint/15 border border-brand-mint/20"
                  }`}
                >
                  <Volume2 className="w-3 h-3" />
                  {playing ? "播放中 2.5s" : "🔊 播放拟声"}
                </button>
                <button
                  onClick={onSave}
                  disabled={!!savedId}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 transition-colors ${
                    savedId
                      ? "bg-brand-orange/15 text-brand-orange-dark border border-brand-orange/30"
                      : "bg-white text-warm-brown hover:bg-brand-orange/10 border border-cream-200"
                  }`}
                >
                  {savedId ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                  {savedId ? "已保存到历史" : "保存到历史"}
                </button>
              </div>
            </div>
            <div className={`relative rounded-xl bg-white/80 p-3 border border-white ${playing ? "animate-pulse" : ""}`}>
              <div className="absolute -left-1 top-3 w-3 h-3 rotate-45 bg-white/80 border-l border-b border-white" />
              <p className="text-warm-brown font-medium leading-relaxed text-sm pl-1">{output}</p>
            </div>
            {playing && (
              <div className="mt-3 h-8 flex items-end justify-center gap-0.5">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full ${petType === "dog" ? "bg-brand-orange" : "bg-brand-mint"}`}
                    style={{
                      height: `${6 + Math.sin(i * 0.7 + Date.now() / 100) * 12 + Math.random() * 10}px`,
                      animation: `wave 0.4s ease-in-out infinite`,
                      animationDelay: `${i * 30}ms`,
                    }}
                  />
                ))}
              </div>
            )}
            {savedId && (
              <div className="mt-2 flex items-center gap-1 text-[10px] text-brand-orange-dark bg-brand-orange/5 rounded-lg px-2 py-1.5">
                <Sparkles className="w-3 h-3" />
                已记录到翻译历史，可在历史面板查看对话详情
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
