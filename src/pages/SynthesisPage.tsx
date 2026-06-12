import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Download,
  Settings,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCcw,
  Save,
  Wand2,
  Loader2,
  Heart,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { AudioSynthesizer } from '@/audio/audioSynthesizer';
import { WaveformRenderer } from '@/audio/waveformRenderer';
import { emotions, getEmotionByCategory } from '@/data/emotions';
import { scenes } from '@/data/scenes';
import { useJournalStore } from '@/store/journalStore';
import type { Emotion, EmotionCategory } from '@/types';

interface PresetCommand {
  text: string;
  category: string;
  emotion: EmotionCategory;
  icon: string;
}

const presetCommands: PresetCommand[] = [
  { text: '我想摸你', category: '亲近', emotion: 'content', icon: '🤲' },
  { text: '过来', category: '亲近', emotion: 'meow', icon: '👋' },
  { text: '好猫猫', category: '亲近', emotion: 'purr', icon: '💕' },
  { text: '抱抱', category: '亲近', emotion: 'content', icon: '🫂' },
  { text: '吃饭啦', category: '需求', emotion: 'meow', icon: '🍽️' },
  { text: '喝水', category: '需求', emotion: 'meow', icon: '💧' },
  { text: '睡觉', category: '需求', emotion: 'purr', icon: '😴' },
  { text: '玩耍', category: '需求', emotion: 'meow', icon: '🧶' },
  { text: '不怕', category: '安抚', emotion: 'purr', icon: '🛡️' },
  { text: '安静', category: '安抚', emotion: 'content', icon: '🤫' },
  { text: '对不起', category: '安抚', emotion: 'purr', icon: '🙏' },
  { text: '乖', category: '安抚', emotion: 'content', icon: '✨' },
  { text: '出去吗', category: '互动', emotion: 'meow', icon: '🚪' },
  { text: '一起玩', category: '互动', emotion: 'meow', icon: '🎾' },
  { text: '你在哪', category: '互动', emotion: 'wail', icon: '🔍' },
  { text: '喵喵', category: '互动', emotion: 'meow', icon: '🐱' },
  { text: '好孩子', category: '亲近', emotion: 'purr', icon: '⭐' },
  { text: '来这里', category: '互动', emotion: 'meow', icon: '📍' },
];

const defaultParams = {
  baseFrequency: 500,
  duration: 0.8,
  vibratoDepth: 30,
  harmonics: 4,
};

interface ReactionGroup {
  label: string;
  color: 'mint' | 'sky' | 'coral' | 'purple';
  description: string;
  probability: number;
  icon: React.ReactNode;
  details: string[];
}

export default function SynthesisPage() {
  const [inputText, setInputText] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [baseFrequency, setBaseFrequency] = useState(defaultParams.baseFrequency);
  const [duration, setDuration] = useState(defaultParams.duration);
  const [vibratoDepth, setVibratoDepth] = useState(defaultParams.vibratoDepth);
  const [harmonics, setHarmonics] = useState(defaultParams.harmonics);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [selectedScene, setSelectedScene] = useState(scenes[0].id);
  const [catReaction, setCatReaction] = useState('');
  const [targetEmotion, setTargetEmotion] = useState<Emotion | null>(null);
  const [reactionGroups, setReactionGroups] = useState<ReactionGroup[]>([]);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const waveformRendererRef = useRef<WaveformRenderer | null>(null);
  const progressRafRef = useRef<number | null>(null);
  const addEntry = useJournalStore((s) => s.addEntry);

  const currentEmotionRef = useRef<Emotion | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      waveformRendererRef.current = new WaveformRenderer(canvasRef.current);
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, []);

  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current || !waveformRendererRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvasRef.current.width = rect.width * dpr;
    canvasRef.current.height = rect.height * dpr;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    waveformRendererRef.current.resize(rect.width, rect.height);
  }, []);

  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const predictEmotionFromText = (text: string): Emotion => {
    const lowerText = text.toLowerCase();
    const found = presetCommands.find((c) => c.text === text);
    if (found) {
      const em = getEmotionByCategory(found.emotion);
      if (em) return em;
    }
    const keywordMap: Array<{ keywords: string[]; category: EmotionCategory }> = [
      { keywords: ['吃', '饭', '饿', '食', '餐'], category: 'meow' },
      { keywords: ['睡', '觉', '休息', '困'], category: 'purr' },
      { keywords: ['玩', '逗', '耍', '球'], category: 'meow' },
      { keywords: ['摸', '抱', '亲', '爱', '乖', '好'], category: 'content' },
      { keywords: ['不怕', '别怕', '安慰', '安抚'], category: 'purr' },
      { keywords: ['找', '哪', '呼唤', '过来', '来'], category: 'meow' },
      { keywords: ['对不起', '抱歉', '错了'], category: 'purr' },
      { keywords: ['安静', '别吵', '嘘'], category: 'content' },
      { keywords: ['走', '出去', '门'], category: 'meow' },
    ];
    for (const { keywords, category } of keywordMap) {
      if (keywords.some((k) => lowerText.includes(k))) {
        const em = getEmotionByCategory(category);
        if (em) return em;
      }
    }
    return emotions[1];
  };

  const buildReactionGroups = (emotion: Emotion): ReactionGroup[] => {
    const synth = new AudioSynthesizer();
    const rawReactions = synth.getExpectedReactions(emotion.id);

    let positiveProb = 0;
    let neutralProb = 0;
    let negativeProb = 0;

    const posDetails: string[] = [];
    const neuDetails: string[] = [];
    const negDetails: string[] = [];

    rawReactions.forEach((r) => {
      if (['relaxation', 'approach', 'purr_response', 'affection', 'purring'].includes(r.type)) {
        positiveProb = Math.max(positiveProb, r.probability);
        posDetails.push(r.description);
      } else if (['attention', 'curiosity', 'vocal_response', 'concern'].includes(r.type)) {
        neutralProb = Math.max(neutralProb, r.probability);
        neuDetails.push(r.description);
      } else if (['fear', 'defense', 'escape', 'aggression', 'retreat'].includes(r.type)) {
        negativeProb = Math.max(negativeProb, r.probability);
        negDetails.push(r.description);
      }
    });

    if (positiveProb === 0) {
      positiveProb = emotion.category === 'purr' || emotion.category === 'content' ? 0.75 : 0.35;
      posDetails.push('猫咪可能展现出放松姿态');
    }
    if (neutralProb === 0) {
      neutralProb = 0.4;
      neuDetails.push('猫咪会观察情况后再做反应');
    }
    if (negativeProb === 0) {
      negativeProb = emotion.category === 'hiss' || emotion.category === 'growl' ? 0.6 : 0.1;
      negDetails.push('若猫咪紧张可能产生回避行为');
    }
    const noneProb = Math.max(0.05, 1 - (positiveProb + neutralProb + negativeProb) / 2.5);

    const sum = positiveProb + neutralProb + negativeProb + noneProb;
    return [
      {
        label: '积极响应',
        color: 'mint',
        description: '靠近、呼噜、蹭人、眨眼',
        probability: (positiveProb / sum) * 100,
        icon: <Heart className="w-4 h-4" />,
        details: posDetails.length > 0 ? posDetails : ['猫咪会以友好方式回应'],
      },
      {
        label: '中性响应',
        color: 'sky',
        description: '观望、摇尾巴、耳朵转动',
        probability: (neutralProb / sum) * 100,
        icon: <HelpCircle className="w-4 h-4" />,
        details: neuDetails.length > 0 ? neuDetails : ['猫咪会观察并评估情况'],
      },
      {
        label: '消极响应',
        color: 'coral',
        description: '后退、耳朵后压、甩尾',
        probability: (negativeProb / sum) * 100,
        icon: <AlertCircle className="w-4 h-4" />,
        details: negDetails.length > 0 ? negDetails : ['猫咪可能会保持距离'],
      },
      {
        label: '无响应',
        color: 'purple',
        description: '继续原来的活动、无视',
        probability: (noneProb / sum) * 100,
        icon: <CheckCircle2 className="w-4 h-4" />,
        details: ['猫咪可能正在专注其他事物', '音量或频率未吸引注意力'],
      },
    ];
  };

  const handleSynthesize = async () => {
    if (!inputText.trim()) return;
    setIsSynthesizing(true);
    stopPlayback();

    try {
      await new Promise((r) => setTimeout(r, 600));
      const audioContext = ensureAudioContext();
      const emotion = predictEmotionFromText(inputText);
      currentEmotionRef.current = emotion;
      setTargetEmotion(emotion);

      const harmonicsArr: number[] = [];
      for (let i = 0; i < Math.max(1, Math.min(8, harmonics)); i++) {
        harmonicsArr.push(1 + i * 0.5);
      }

      const intensity = 0.5;
      const sampleRate = audioContext.sampleRate;
      const totalSamples = Math.floor(duration * sampleRate);
      const buffer = audioContext.createBuffer(1, totalSamples, sampleRate);
      const channelData = buffer.getChannelData(0);

      const baseFreq = baseFrequency;
      const attackSamples = Math.floor(0.05 * sampleRate);
      const releaseSamples = Math.floor(0.1 * sampleRate);
      const sustainSamples = Math.max(0, totalSamples - attackSamples - releaseSamples);
      const vibratoRate = 5;

      if (baseFreq >= 2000) {
        let previousOut = 0;
        const cutoff = baseFreq / (sampleRate / 2);
        for (let i = 0; i < totalSamples; i++) {
          const whiteNoise = (Math.random() * 2 - 1) * 0.5;
          const filtered = previousOut + cutoff * (whiteNoise - previousOut);
          previousOut = filtered;
          let envelope = 1;
          if (i < attackSamples) envelope = i / attackSamples;
          else if (i >= attackSamples + sustainSamples) {
            const releasePos = i - (attackSamples + sustainSamples);
            envelope = 1 - releasePos / releaseSamples;
          }
          envelope = Math.max(0, Math.min(1, envelope));
          const t = i / sampleRate;
          const amplitudeMod = 1 + 0.3 * Math.sin(2 * Math.PI * 15 * t);
          channelData[i] = filtered * intensity * envelope * amplitudeMod * 0.8;
        }
      } else {
        for (let i = 0; i < totalSamples; i++) {
          const t = i / sampleRate;
          const vibrato = Math.sin(2 * Math.PI * vibratoRate * t) * vibratoDepth;
          const freq = baseFreq + vibrato;
          let envelope = 1;
          if (i < attackSamples) envelope = i / attackSamples;
          else if (i >= attackSamples + sustainSamples) {
            const releasePos = i - (attackSamples + sustainSamples);
            envelope = 1 - releasePos / releaseSamples;
          }
          envelope = Math.max(0, Math.min(1, envelope));
          let sample = 0;
          for (let h = 0; h < harmonicsArr.length; h++) {
            const harmonicFreq = freq * harmonicsArr[h];
            const harmonicGain = 1 / (h + 1);
            sample += Math.sin(2 * Math.PI * harmonicFreq * t) * harmonicGain;
          }
          channelData[i] = sample * intensity * envelope * 0.5;
        }
      }

      audioBufferRef.current = buffer;
      setTotalDuration(buffer.duration);
      setReactionGroups(buildReactionGroups(emotion));

      setTimeout(() => {
        if (waveformRendererRef.current && audioBufferRef.current) {
          const data = audioBufferRef.current.getChannelData(0);
          waveformRendererRef.current.drawAnimatedWaveform(data, 0);
        }
      }, 50);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const stopPlayback = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // ignore
      }
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (progressRafRef.current) {
      cancelAnimationFrame(progressRafRef.current);
      progressRafRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const updateProgress = useCallback(() => {
    if (!audioContextRef.current || !audioBufferRef.current || !startTimeRef.current) return;
    const ctx = audioContextRef.current;
    const elapsed = ctx.currentTime - startTimeRef.current;
    const dur = audioBufferRef.current.duration;
    const progress = Math.min(1, Math.max(0, elapsed / dur));
    setPlayProgress(progress * 100);
    setCurrentTime(Math.min(elapsed, dur));

    if (waveformRendererRef.current && audioBufferRef.current) {
      const data = audioBufferRef.current.getChannelData(0);
      waveformRendererRef.current.drawAnimatedWaveform(data, progress);
    }

    if (progress < 1) {
      progressRafRef.current = requestAnimationFrame(updateProgress);
    } else {
      setIsPlaying(false);
      startTimeRef.current = 0;
    }
  }, []);

  const handlePlayPause = () => {
    if (!audioBufferRef.current || !audioContextRef.current) return;
    if (isPlaying) {
      stopPlayback();
      return;
    }
    ensureAudioContext();
    const ctx = audioContextRef.current!;
    const source = ctx.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(ctx.destination);
    source.onended = () => {
      if (sourceNodeRef.current === source) {
        stopPlayback();
      }
    };
    source.start(0);
    sourceNodeRef.current = source;
    startTimeRef.current = ctx.currentTime;
    setIsPlaying(true);
    progressRafRef.current = requestAnimationFrame(updateProgress);
  };

  useEffect(() => {
    return () => {
      stopPlayback();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopPlayback]);

  const handleResetParams = () => {
    setBaseFrequency(defaultParams.baseFrequency);
    setDuration(defaultParams.duration);
    setVibratoDepth(defaultParams.vibratoDepth);
    setHarmonics(defaultParams.harmonics);
  };

  const handlePresetClick = (cmd: PresetCommand) => {
    setInputText(cmd.text);
  };

  const handleSaveEntry = () => {
    if (!currentEmotionRef.current) return;
    addEntry({
      type: 'synthesis',
      emotion: currentEmotionRef.current,
      confidence: 0.8,
      scene: scenes.find((s) => s.id === selectedScene)?.name || '',
      catReaction: catReaction || undefined,
      notes: inputText || undefined,
      duration: totalDuration || undefined,
    });
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  const handleDownload = () => {
    if (!audioBufferRef.current) return;
    const buffer = audioBufferRef.current;
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    const writeStr = (offset: number, s: string) => {
      for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeStr(36, 'data');
    view.setUint32(40, dataLength, true);

    const chData: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) chData.push(buffer.getChannelData(i));
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, chData[ch][i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
    const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cat-meow-${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const groupedCommands = presetCommands.reduce<Record<string, PresetCommand[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  const categoryColors: Record<string, 'mint' | 'amber' | 'sky' | 'purple'> = {
    亲近: 'mint',
    需求: 'amber',
    安抚: 'sky',
    互动: 'purple',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-orange/10 border border-amber-orange/30 text-amber-orange text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>🎵 20Hz – 65kHz 猫科听觉频段</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
            猫语反向合成
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            输入文字指令，生成猫咪拟真叫声
          </p>
        </div>

        <GlassCard glow="amber">
          <GlassCard.Header>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-amber-orange" />
                  指令输入
                </h2>
                <p className="text-sm text-slate-400 mt-1">选择预设指令或输入自定义文本</p>
              </div>
              <Button
                onClick={handleSynthesize}
                loading={isSynthesizing}
                icon={<Sparkles className="w-4 h-4" />}
                size="lg"
              >
                合成音频
              </Button>
            </div>
          </GlassCard.Header>
          <GlassCard.Body>
            <div className="space-y-6">
              <div className="space-y-4">
                {Object.entries(groupedCommands).map(([category, cmds]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={categoryColors[category]} size="sm">
                        {category}类
                      </Badge>
                      <span className="text-xs text-slate-500">点击标签快速填入</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cmds.map((cmd) => (
                        <button
                          key={cmd.text}
                          onClick={() => handlePresetClick(cmd)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border
                            ${
                              inputText === cmd.text
                                ? 'bg-amber-orange/20 border-amber-orange/50 text-amber-orange shadow-glow'
                                : 'bg-deep-sea-light/30 border-deep-sea-light/50 text-slate-300 hover:bg-deep-sea-light/60 hover:text-white hover:border-deep-sea-light'
                            }`}
                        >
                          <span className="mr-1.5">{cmd.icon}</span>
                          {cmd.text}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">自定义文字</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="输入你想对猫咪说的话..."
                  className="w-full h-28 px-4 py-3 rounded-xl bg-deep-sea-dark/50 border border-deep-sea-light/50
                    text-white placeholder-slate-500 resize-none focus:outline-none focus:border-amber-orange/50
                    focus:ring-2 focus:ring-amber-orange/20 transition-all duration-200"
                />
              </div>

              <div>
                <button
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors duration-200"
                >
                  <Settings className="w-4 h-4" />
                  <span>高级参数微调</span>
                  {advancedOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {advancedOpen && (
                  <div className="mt-4 p-5 rounded-xl bg-deep-sea-dark/40 border border-deep-sea-light/30 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-end mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<RotateCcw className="w-3.5 h-3.5" />}
                        onClick={handleResetParams}
                      >
                        重置默认
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300">基础频率</span>
                          <span className="text-amber-orange font-mono">{baseFrequency} Hz</span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={20000}
                          value={baseFrequency}
                          onChange={(e) => setBaseFrequency(Number(e.target.value))}
                          className="w-full h-2 rounded-full bg-deep-sea-light/50 appearance-none cursor-pointer accent-amber-orange"
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>20</span>
                          <span>10000</span>
                          <span>20000</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300">时长</span>
                          <span className="text-amber-orange font-mono">{duration.toFixed(1)} s</span>
                        </div>
                        <input
                          type="range"
                          min={0.2}
                          max={3}
                          step={0.1}
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className="w-full h-2 rounded-full bg-deep-sea-light/50 appearance-none cursor-pointer accent-amber-orange"
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>0.2s</span>
                          <span>1.5s</span>
                          <span>3s</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300">颤音深度</span>
                          <span className="text-amber-orange font-mono">{vibratoDepth}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={200}
                          value={vibratoDepth}
                          onChange={(e) => setVibratoDepth(Number(e.target.value))}
                          className="w-full h-2 rounded-full bg-deep-sea-light/50 appearance-none cursor-pointer accent-amber-orange"
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>0</span>
                          <span>100</span>
                          <span>200</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300">谐波数量</span>
                          <span className="text-amber-orange font-mono">{harmonics}</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={8}
                          step={1}
                          value={harmonics}
                          onChange={(e) => setHarmonics(Number(e.target.value))}
                          className="w-full h-2 rounded-full bg-deep-sea-light/50 appearance-none cursor-pointer accent-amber-orange"
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>1</span>
                          <span>4</span>
                          <span>8</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </GlassCard.Body>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard>
            <GlassCard.Header>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <span className="text-2xl">🔊</span>
                    合成结果
                  </h2>
                  {targetEmotion && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-slate-400">目标情绪:</span>
                      <Badge variant="amber">
                        <span className="mr-1" style={{ color: targetEmotion.color }}>
                          ●
                        </span>
                        {targetEmotion.name}
                      </Badge>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Download className="w-4 h-4" />}
                  onClick={handleDownload}
                  disabled={!audioBufferRef.current}
                >
                  下载
                </Button>
              </div>
            </GlassCard.Header>
            <GlassCard.Body>
              <div className="space-y-5">
                <div className="relative h-36 rounded-xl overflow-hidden bg-deep-sea-dark/60 border border-deep-sea-light/30">
                  <canvas ref={canvasRef} className="w-full h-full" />
                  {isSynthesizing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-deep-sea-dark/80 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-amber-orange" />
                        <span className="text-sm text-slate-300">正在合成猫叫声...</span>
                      </div>
                    </div>
                  )}
                  {!isSynthesizing && !audioBufferRef.current && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <div className="text-5xl opacity-40">🎵</div>
                        <p className="text-sm text-slate-500">输入指令后点击"合成音频"</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    variant="primary"
                    size="lg"
                    iconOnly
                    icon={isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    onClick={handlePlayPause}
                    disabled={!audioBufferRef.current || isSynthesizing}
                    className={isPlaying ? 'animate-glow' : ''}
                  />
                  <div className="flex-1 space-y-1">
                    <ProgressBar
                      value={playProgress}
                      showPercentage={false}
                      color={isPlaying ? 'mint' : 'amber'}
                      size="lg"
                    />
                    <div className="flex justify-between text-xs font-mono text-slate-400">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(totalDuration)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard.Body>
          </GlassCard>

          <GlassCard glow="purple">
            <GlassCard.Header>
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  预期响应概率
                </h2>
                <p className="text-sm text-slate-400 mt-1">基于情绪模型的猫咪行为预测</p>
              </div>
            </GlassCard.Header>
            <GlassCard.Body>
              {reactionGroups.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="text-5xl opacity-40">🔮</div>
                    <p className="text-sm text-slate-500">合成音频后显示预测结果</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-4">
                    {reactionGroups.map((group) => (
                      <div key={group.label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={group.color} size="sm">
                              {group.icon}
                              <span className="ml-1">{group.label}</span>
                            </Badge>
                            <span className="text-xs text-slate-500">{group.description}</span>
                          </div>
                          <span className="font-mono font-semibold text-sm text-slate-200">
                            {group.probability.toFixed(1)}%
                          </span>
                        </div>
                        <ProgressBar
                          value={group.probability}
                          color={group.color}
                          showPercentage={false}
                          size="md"
                        />
                        <ul className="pl-5 space-y-0.5">
                          {group.details.slice(0, 2).map((d, i) => (
                            <li key={i} className="text-xs text-slate-500 list-disc">
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard.Body>
          </GlassCard>
        </div>

        <GlassCard glow="mint">
          <GlassCard.Header>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <span className="text-2xl">📝</span>
                  记录实验
                </h2>
                <p className="text-sm text-slate-400 mt-1">保存合成结果并记录猫咪的实际反应</p>
              </div>
              {showSaveSuccess && (
                <Badge variant="mint" size="md">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  已保存到日志
                </Badge>
              )}
            </div>
          </GlassCard.Header>
          <GlassCard.Body>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">场景选择</label>
                <select
                  value={selectedScene}
                  onChange={(e) => setSelectedScene(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-deep-sea-dark/50 border border-deep-sea-light/50
                    text-white focus:outline-none focus:border-mood-mint/50 focus:ring-2 focus:ring-mood-mint/20
                    transition-all duration-200 cursor-pointer"
                >
                  {scenes.map((scene) => (
                    <option key={scene.id} value={scene.id} className="bg-deep-sea">
                      {scene.icon} {scene.name}
                    </option>
                  ))}
                </select>
                {selectedScene && (
                  <p className="text-xs text-slate-500">
                    {scenes.find((s) => s.id === selectedScene)?.description}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  实际猫咪反应 <span className="text-slate-500 font-normal">(事后填写)</span>
                </label>
                <textarea
                  value={catReaction}
                  onChange={(e) => setCatReaction(e.target.value)}
                  placeholder="例如：猫咪耳朵转过来，尾巴轻轻摇动，5秒后走过来蹭我腿..."
                  className="w-full h-24 px-4 py-3 rounded-xl bg-deep-sea-dark/50 border border-deep-sea-light/50
                    text-white placeholder-slate-500 resize-none focus:outline-none focus:border-mood-mint/50
                    focus:ring-2 focus:ring-mood-mint/20 transition-all duration-200 text-sm"
                />
              </div>
            </div>
          </GlassCard.Body>
          <GlassCard.Footer>
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="lg"
                icon={<Save className="w-4 h-4" />}
                onClick={handleSaveEntry}
                disabled={!targetEmotion || showSaveSuccess}
              >
                保存到日志
              </Button>
            </div>
          </GlassCard.Footer>
        </GlassCard>
      </div>
  );
}
