import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Filter, GitCompare, X, Play, Pause, Volume2, ChevronDown, ChevronUp, Check, BarChart3, Sparkles, AlertTriangle, BookOpen, Activity } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { emotions } from '@/data/emotions';
import type { Emotion } from '@/types';
import { AudioSynthesizer } from '@/audio/audioSynthesizer';
import { WaveformRenderer } from '@/audio/waveformRenderer';
import { cn } from '@/lib/utils';

type SentimentType = '正面' | '负面' | '中性';

const sentimentMap: Record<string, SentimentType> = {
  purr: '正面',
  content: '正面',
  meow: '中性',
  hiss: '负面',
  growl: '负面',
  wail: '负面',
};

const sentimentBadgeMap: Record<SentimentType, 'mint' | 'coral' | 'amber'> = {
  正面: 'mint',
  负面: 'coral',
  中性: 'amber',
};

const emojiMap: Record<string, string> = {
  purr: '😺',
  meow: '🐱',
  hiss: '😾',
  wail: '😿',
  growl: '🙀',
  content: '😸',
};

const synthesizer = new AudioSynthesizer();

function HexagonCard({
  emotion,
  onClick,
  isSelected,
  isCompareMode,
  onCompareToggle,
}: {
  emotion: Emotion;
  onClick: () => void;
  isSelected: boolean;
  isCompareMode: boolean;
  onCompareToggle: () => void;
}) {
  const sentiment = sentimentMap[emotion.category];
  const emoji = emojiMap[emotion.category];
  const badgeVariant = sentimentBadgeMap[sentiment];

  return (
    <div className="relative group perspective-1000">
      <div
        className={cn(
          'relative cursor-pointer transition-all duration-500 transform-style-3d',
          'hover:-translate-y-2'
        )}
        onClick={!isCompareMode ? onClick : onCompareToggle}
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        }}
      >
        <div
          className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            background: `linear-gradient(135deg, ${emotion.color}40, ${emotion.color}10)`,
            boxShadow: `0 0 40px ${emotion.color}60`,
            filter: 'blur(8px)',
          }}
        />
        <div
          className={cn(
            'relative p-8 pt-14 pb-14 min-h-[380px]',
            'bg-deep-sea-light/70 backdrop-blur-xl',
            'border-2 transition-all duration-300',
            isSelected
              ? 'border-amber-orange bg-deep-sea-light/90'
              : `border-[${emotion.color}]`
          )}
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            borderColor: isSelected ? '#F59E0B' : `${emotion.color}80`,
            boxShadow: isSelected
              ? `0 0 30px ${emotion.color}80, inset 0 0 30px ${emotion.color}30`
              : `inset 0 0 20px ${emotion.color}15`,
          }}
        >
          {isCompareMode && (
            <div
              className={cn(
                'absolute top-4 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all z-10',
                isSelected
                  ? 'bg-amber-orange border-amber-orange-light'
                  : 'bg-deep-sea-dark/60 border-deep-sea-light'
              )}
            >
              {isSelected && <Check className="w-4 h-4 text-white" />}
            </div>
          )}

          <div className="flex flex-col items-center text-center">
            <div
              className="text-6xl mb-3 transition-transform duration-300 group-hover:scale-110"
              style={{ filter: `drop-shadow(0 0 15px ${emotion.color})` }}
            >
              {emoji}
            </div>

            <h3 className="font-display text-2xl font-bold text-white mb-1">{emotion.name}</h3>
            <p className="text-slate-400 text-sm mb-3 font-mono">{emotion.nameEn}</p>

            <Badge variant={badgeVariant} size="sm" className="mb-4">
              {sentiment}
            </Badge>

            <div className="w-full space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">基础频率</span>
                <span className="font-mono font-medium" style={{ color: emotion.color }}>
                  {emotion.baseFrequency} Hz
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">平均时长</span>
                <span className="font-mono font-medium" style={{ color: emotion.color }}>
                  {(emotion.avgDuration / 1000).toFixed(1)}s
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5 mb-5">
              {emotion.typicalScenarios.slice(0, 3).map((s, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${emotion.color}15`,
                    color: emotion.color,
                    border: `1px solid ${emotion.color}30`,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>

            <div className="flex gap-2 mt-auto">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 px-3 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                <BookOpen className="w-3.5 h-3.5" />
                详情
              </Button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="h-8 w-8 rounded-lg flex items-center justify-center transition-all"
                style={{
                  backgroundColor: `${emotion.color}20`,
                  border: `1px solid ${emotion.color}40`,
                  color: emotion.color,
                }}
              >
                <Play className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailModal({
  emotion,
  onClose,
}: {
  emotion: Emotion;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const sentiment = sentimentMap[emotion.category];
  const badgeVariant = sentimentBadgeMap[sentiment];
  const emoji = emojiMap[emotion.category];

  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const result = synthesizer.synthesizeByEmotion(emotion.id, audioCtx);
      setAudioUrl(result.audioUrl);

      if (canvasRef.current) {
        const renderer = new WaveformRenderer(canvasRef.current);
        const params = {
          text: '',
          emotion: emotion.category,
          intensity: 0.6,
          duration: emotion.avgDuration / 1000,
          pitch: 1,
        };
        const buffer = synthesizer.synthesizeMeow(params, audioCtx);
        const channelData = buffer.getChannelData(0);
        const samples = 256;
        const blockSize = Math.floor(channelData.length / samples);
        const filteredData = new Float32Array(samples);
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[i * blockSize + j] || 0);
          }
          filteredData[i] = sum / blockSize;
        }
        renderer.drawWaveform(filteredData, emotion.color);
      }
    } catch (err) {
      console.error('Failed to synthesize audio:', err);
    }
    return () => {
      if (audioCtx) audioCtx.close();
    };
  }, [emotion]);

  const handlePlay = () => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
    }
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play().then(() => setIsPlaying(true)).catch(console.error);
      audioRef.current!.onended = () => setIsPlaying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-deep-sea-light/50 bg-deep-sea/95 backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 0 60px rgba(0, 0, 0, 0.5), 0 0 80px rgba(245, 158, 11, 0.1)',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-48 rounded-t-3xl -z-10"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${emotion.color}30 0%, transparent 70%)`,
          }}
        />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-deep-sea-light/50 border border-deep-sea-light/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-deep-sea-light transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="flex items-start gap-6 mb-8">
            <div
              className="flex-shrink-0 w-24 h-24 rounded-2xl flex items-center justify-center text-5xl"
              style={{
                backgroundColor: `${emotion.color}20`,
                border: `2px solid ${emotion.color}60`,
                boxShadow: `0 0 30px ${emotion.color}40`,
              }}
            >
              {emoji}
            </div>
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="font-display text-4xl font-bold text-white">
                  {emotion.name}
                </h2>
                <Badge variant={badgeVariant} size="md">
                  {sentiment}
                </Badge>
              </div>
              <p className="text-slate-400 font-mono text-lg mb-4">
                {emotion.nameEn}
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-slate-500">基础频率</span>
                  <p className="font-mono font-bold text-xl mt-0.5" style={{ color: emotion.color }}>
                    {emotion.baseFrequency} <span className="text-sm font-normal">Hz</span>
                  </p>
                </div>
                <div className="w-px h-10 bg-deep-sea-light/50" />
                <div>
                  <span className="text-slate-500">平均时长</span>
                  <p className="font-mono font-bold text-xl mt-0.5" style={{ color: emotion.color }}>
                    {(emotion.avgDuration / 1000).toFixed(1)} <span className="text-sm font-normal">秒</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <GlassCard padding="md" className="mb-6">
            <h4 className="text-sm text-amber-orange font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              详细描述
            </h4>
            <p className="text-slate-300 leading-relaxed">{emotion.description}</p>
          </GlassCard>

          <GlassCard padding="md" className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm text-amber-orange font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4" />
                波形样本
              </h4>
              <Button
                size="sm"
                variant="primary"
                onClick={handlePlay}
                className="h-9"
                icon={isPlaying ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              >
                {isPlaying ? '暂停' : '试听样本'}
              </Button>
            </div>
            <div className="rounded-xl overflow-hidden bg-deep-sea-dark/60 border border-deep-sea-light/30 p-4">
              <canvas
                ref={canvasRef}
                width={600}
                height={100}
                className="w-full h-24 rounded-lg"
              />
            </div>
          </GlassCard>

          <div className="grid md:grid-cols-2 gap-6">
            <GlassCard padding="md">
              <h4 className="text-sm text-amber-orange font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                典型场景
              </h4>
              <ul className="space-y-2.5">
                {emotion.typicalScenarios.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor: `${emotion.color}20`,
                        color: emotion.color,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-slate-300 text-sm">{s}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>

            <GlassCard padding="md">
              <h4 className="text-sm text-amber-orange font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                行为建议
              </h4>
              <ul className="space-y-2.5">
                {emotion.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check
                      className="flex-shrink-0 w-5 h-5 mt-0.5"
                      style={{ color: emotion.color }}
                    />
                    <span className="text-slate-300 text-sm">{s}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparePanel({
  selectedEmotions,
  onRemove,
}: {
  selectedEmotions: Emotion[];
  onRemove: (id: string) => void;
}) {
  const maxFreq = Math.max(...selectedEmotions.map((e) => e.baseFrequency));

  const allScenarios = selectedEmotions.flatMap((e) => e.typicalScenarios);
  const scenarioCount: Record<string, number> = {};
  allScenarios.forEach((s) => {
    scenarioCount[s] = (scenarioCount[s] || 0) + 1;
  });
  const overlapScenarios = Object.entries(scenarioCount)
    .filter(([, count]) => count > 1)
    .map(([scenario]) => scenario);

  return (
    <GlassCard padding="lg" className="mb-8 border-amber-orange/40" glow="amber">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-amber-orange" />
          情绪对比分析
        </h3>
        <span className="text-slate-400 text-sm">
          已选 {selectedEmotions.length}/3
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {selectedEmotions.map((e) => (
          <div
            key={e.id}
            className="relative rounded-2xl p-4 border"
            style={{
              backgroundColor: `${e.color}10`,
              borderColor: `${e.color}40`,
            }}
          >
            <button
              onClick={() => onRemove(e.id)}
              className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-deep-sea-dark/60 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="text-3xl mb-2">{emojiMap[e.category]}</div>
            <h4 className="font-display font-bold text-white">{e.name}</h4>
            <p className="text-xs text-slate-400 font-mono mb-3">{e.nameEn}</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">频率</span>
                <span style={{ color: e.color }}>{e.baseFrequency}Hz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">时长</span>
                <span style={{ color: e.color }}>
                  {(e.avgDuration / 1000).toFixed(1)}s
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-sm text-amber-orange font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            频率范围对比
          </h4>
          <div className="space-y-3">
            {selectedEmotions.map((e) => {
              const percent = (e.baseFrequency / maxFreq) * 100;
              return (
                <div key={e.id}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="text-slate-300 font-medium flex items-center gap-2">
                      <span>{emojiMap[e.category]}</span>
                      {e.name}
                    </span>
                    <span className="font-mono" style={{ color: e.color }}>
                      {e.baseFrequency} Hz
                    </span>
                  </div>
                  <div className="h-6 bg-deep-sea-dark/60 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full rounded-lg transition-all duration-700 relative"
                      style={{
                        width: `${percent}%`,
                        background: `linear-gradient(90deg, ${e.color}80, ${e.color})`,
                        boxShadow: `0 0 15px ${e.color}60`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm text-amber-orange font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              场景重叠分析
            </h4>
            {overlapScenarios.length > 0 ? (
              <div className="p-4 rounded-xl bg-deep-sea-dark/60 border border-deep-sea-light/30">
                <p className="text-xs text-slate-400 mb-2">
                  以下场景在多种情绪中出现：
                </p>
                <div className="flex flex-wrap gap-2">
                  {overlapScenarios.map((s, i) => (
                    <Badge key={i} variant="amber" size="sm">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-deep-sea-dark/60 border border-deep-sea-light/30 text-center">
                <p className="text-slate-400 text-sm">无重叠场景</p>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm text-amber-orange font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              建议差异
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {selectedEmotions.map((e) => (
                <div
                  key={e.id}
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${e.color}10` }}
                >
                  <p className="text-xs font-semibold mb-1" style={{ color: e.color }}>
                    {e.name}
                  </p>
                  <ul className="space-y-0.5">
                    {e.suggestions.slice(0, 2).map((s, i) => (
                      <li key={i} className="text-xs text-slate-400">
                        · {s}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export default function VocabularyPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'全部' | SentimentType>('全部');
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const totalSamples = useMemo(() => {
    return emotions.reduce((sum, e) => sum + e.typicalScenarios.length, 0);
  }, []);

  const positiveCount = emotions.filter((e) => sentimentMap[e.category] === '正面').length;
  const negativeCount = emotions.filter((e) => sentimentMap[e.category] === '负面').length;
  const neutralCount = emotions.filter((e) => sentimentMap[e.category] === '中性').length;

  const filteredEmotions = useMemo(() => {
    let result = [...emotions];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.nameEn.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.typicalScenarios.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (filterCategory !== '全部') {
      result = result.filter((e) => sentimentMap[e.category] === filterCategory);
    }

    return result;
  }, [searchQuery, filterCategory]);

  const compareEmotions = useMemo(
    () => emotions.filter((e) => compareIds.includes(e.id)),
    [compareIds]
  );

  const handleCompareToggle = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  return (
    <>
    <div className="max-w-7xl mx-auto">
        <div className="mb-10 text-center relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[600px] h-64 -z-10" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)' }} />
          <h1 className="font-display text-5xl font-bold mb-3">
            <span className="glow-text">声纹特征库</span>
          </h1>
          <p className="text-slate-400 text-lg">6类猫咪基础情绪声纹档案</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <GlassCard padding="md" className="text-center">
            <p className="text-slate-400 text-xs mb-2">总样本数</p>
            <p className="font-display text-3xl font-bold text-white">{totalSamples}</p>
            <p className="text-[10px] text-slate-500 mt-1">典型场景条目</p>
          </GlassCard>
          <GlassCard padding="md" className="text-center">
            <p className="text-slate-400 text-xs mb-2">情绪类别</p>
            <p className="font-display text-3xl font-bold text-white">{emotions.length}</p>
            <p className="text-[10px] text-slate-500 mt-1">基础声纹类型</p>
          </GlassCard>
          <GlassCard padding="md" className="text-center">
            <p className="text-slate-400 text-xs mb-2">正面情绪</p>
            <p className="font-display text-3xl font-bold text-mood-mint">{positiveCount}</p>
            <p className="text-[10px] text-slate-500 mt-1">放松/满足</p>
          </GlassCard>
          <GlassCard padding="md" className="text-center">
            <p className="text-slate-400 text-xs mb-2">负面情绪</p>
            <p className="font-display text-3xl font-bold text-mood-coral">
              {negativeCount + neutralCount}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">含中性警示</p>
          </GlassCard>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索情绪名、场景关键词..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-deep-sea/60 border border-deep-sea-light/40 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-orange/50 focus:border-amber-orange/50 transition-all"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={cn(
                'h-12 px-5 rounded-xl border flex items-center gap-2 transition-all',
                filterCategory !== '全部'
                  ? 'bg-amber-orange/20 border-amber-orange/50 text-amber-orange'
                  : 'bg-deep-sea/60 border-deep-sea-light/40 text-slate-300 hover:border-deep-sea-light/60'
              )}
            >
              <Filter className="w-5 h-5" />
              <span>{filterCategory}</span>
              {showFilter ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showFilter && (
              <div className="absolute right-0 mt-2 w-40 rounded-xl bg-deep-sea-light/95 border border-deep-sea-light/50 backdrop-blur-xl py-2 z-20 shadow-xl">
                {(['全部', '正面', '负面', '中性'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setFilterCategory(cat);
                      setShowFilter(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-sm transition-all',
                      filterCategory === cat
                        ? 'text-amber-orange bg-amber-orange/10'
                        : 'text-slate-300 hover:bg-deep-sea-light/50'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setIsCompareMode(!isCompareMode);
              if (isCompareMode) setCompareIds([]);
            }}
            className={cn(
              'h-12 px-5 rounded-xl border flex items-center gap-2 transition-all',
              isCompareMode
                ? 'bg-amber-orange text-white border-amber-orange shadow-glow'
                : 'bg-deep-sea/60 border-deep-sea-light/40 text-slate-300 hover:border-amber-orange/50 hover:text-amber-orange'
            )}
          >
            <GitCompare className="w-5 h-5" />
            <span>对比模式</span>
            {isCompareMode && compareIds.length > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {compareIds.length}
              </span>
            )}
          </button>
        </div>

        {isCompareMode && compareEmotions.length > 0 && (
          <ComparePanel
            selectedEmotions={compareEmotions}
            onRemove={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
          />
        )}

        {filteredEmotions.length === 0 ? (
          <GlassCard padding="lg" className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="font-display text-xl font-bold text-white mb-2">未找到匹配情绪</h3>
            <p className="text-slate-400">尝试调整搜索关键词或筛选条件</p>
          </GlassCard>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
            {filteredEmotions.map((emotion) => (
              <HexagonCard
                key={emotion.id}
                emotion={emotion}
                onClick={() => setSelectedEmotion(emotion)}
                isSelected={compareIds.includes(emotion.id)}
                isCompareMode={isCompareMode}
                onCompareToggle={() => handleCompareToggle(emotion.id)}
              />
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-slate-500 text-sm">
            💡 小贴士：点击情绪卡片查看详细声纹档案，开启对比模式可分析多种情绪差异
          </p>
        </div>
      </div>

      {selectedEmotion && (
        <DetailModal emotion={selectedEmotion} onClose={() => setSelectedEmotion(null)} />
      )}
    </>
  );
}
