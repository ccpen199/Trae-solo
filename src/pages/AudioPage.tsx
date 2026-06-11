import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Heart,
  Sparkles,
  CloudRain,
  Brain,
  Moon,
  ListMusic,
  Shuffle,
  ChevronRight,
  Shield,
  FileText,
  Clock,
  PlayCircle,
  X,
  SkipForward,
  SkipBack,
  Pause,
  Play,
  Volume2,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { GlassCard, PillButton, Chip } from '@/components/ui';
import AudioCard from '@/components/audio/AudioCard';
import AudioPlayer from '@/components/audio/AudioPlayer';
import { cn, categoryLabel, categoryColor, dayjs, formatSecondsToTime } from '@/lib/utils';
import type { AudioCategory, AudioTrack, WatermarkLog } from '@/types';

const categories: { id: AudioCategory; label: string; icon: typeof Heart; gradient: string; desc: string }[] = [
  {
    id: 'anxiety',
    label: '焦虑缓解',
    icon: CloudRain,
    gradient: 'from-coral-500 to-coral-300',
    desc: '呼吸引导、接地技术、自然音景，快速缓解急性焦虑情绪',
  },
  {
    id: 'stress',
    label: '压力释放',
    icon: Sparkles,
    gradient: 'from-dream-500 to-dream-300',
    desc: '环境音、减压Lo-fi、身体扫描，释放工作生活的日常压力',
  },
  {
    id: 'insomnia',
    label: '深度失眠',
    icon: Moon,
    gradient: 'from-mint-500 to-mint-300',
    desc: '白/粉/棕噪音、双耳节拍、睡前故事，CBT-I专业助眠内容',
  },
  {
    id: 'meditation',
    label: '专注冥想',
    icon: Brain,
    gradient: 'from-night-400 to-dream-400',
    desc: '正念、慈心、感恩冥想，培养觉察力与情绪稳定性',
  },
];

const generateWatermarkId = (audioId: string) => `WM-${audioId.slice(-4)}-${Date.now().toString(36).toUpperCase()}`;

const deviceFingerprint = typeof window !== 'undefined'
  ? `${navigator.platform?.slice(0, 6) || 'web'}-${(window.screen.width + 'x' + window.screen.height)}`
  : 'web-device';

export default function AudioPage() {
  const {
    audioTracks,
    currentAudio,
    isPlaying,
    setCurrentAudio,
    setPlaying,
    setAudioProgress,
    audioProgress,
  } = useAppStore();

  const [activeCategory, setActiveCategory] = useState<AudioCategory>('anxiety');
  const [searchQuery, setSearchQuery] = useState('');
  const [playQueue, setPlayQueue] = useState<AudioTrack[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [isShuffled, setIsShuffled] = useState(false);
  const [showQueuePanel, setShowQueuePanel] = useState(false);
  const [watermarkLogs, setWatermarkLogs] = useState<WatermarkLog[]>(() => {
    const initial: WatermarkLog[] = [];
    const sample = audioTracks.slice(0, 8);
    sample.forEach((t, i) => {
      initial.push({
        id: `log-${i}`,
        audioId: t.id,
        userId: 'user-001',
        playedAt: dayjs().subtract(i * (0.5 + Math.random() * 3), 'day').toISOString(),
        duration: Math.floor(60 + Math.random() * t.duration),
        watermarkId: generateWatermarkId(t.id),
        deviceFingerprint,
      });
    });
    return initial.sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
  });

  const [localProgress, setLocalProgress] = useState(audioProgress);
  const [isLocalPlaying, setIsLocalPlaying] = useState(isPlaying);

  useEffect(() => {
    setIsLocalPlaying(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    setLocalProgress(audioProgress);
  }, [audioProgress]);

  useEffect(() => {
    if (!isLocalPlaying || !currentAudio) return;
    const timer = setInterval(() => {
      setLocalProgress((p) => {
        const next = p + 1 / currentAudio.duration;
        if (next >= 1) {
          handleAutoNext();
          return 0;
        }
        setAudioProgress(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLocalPlaying, currentAudio?.id]);

  useEffect(() => {
    if (!currentAudio || playQueue.length > 0) return;
    const categoryQueue = audioTracks.filter((t) => t.category === currentAudio.category);
    const idx = categoryQueue.findIndex((t) => t.id === currentAudio.id);
    if (idx >= 0) {
      setPlayQueue(categoryQueue);
      setQueueIndex(idx);
    }
  }, [currentAudio?.id]);

  const filteredTracks = useMemo(() => {
    let tracks = audioTracks.filter((t) => t.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tracks = tracks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          t.author.toLowerCase().includes(q)
      );
    }
    return tracks;
  }, [audioTracks, activeCategory, searchQuery]);

  const currentTrack = currentAudio;
  const currentInQueue = playQueue[queueIndex] || null;

  const playAll = () => {
    if (filteredTracks.length === 0) return;
    const queue = isShuffled
      ? [...filteredTracks].sort(() => Math.random() - 0.5)
      : [...filteredTracks];
    setPlayQueue(queue);
    setQueueIndex(0);
    setCurrentAudio(queue[0]);
    setPlaying(true);
    setLocalProgress(0);
    setAudioProgress(0);
    setShowQueuePanel(true);

    setWatermarkLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        audioId: queue[0].id,
        userId: 'user-001',
        playedAt: new Date().toISOString(),
        duration: 0,
        watermarkId: generateWatermarkId(queue[0].id),
        deviceFingerprint,
      },
      ...prev,
    ]);
  };

  const handlePlayOne = (track: AudioTrack) => {
    let baseQueue = playQueue;
    let newIdx = playQueue.findIndex((t) => t.id === track.id);
    if (newIdx < 0 || playQueue.length === 0) {
      baseQueue = audioTracks.filter((t) => t.category === track.category);
      newIdx = baseQueue.findIndex((t) => t.id === track.id);
      setPlayQueue(baseQueue);
    }
    setQueueIndex(newIdx);
    setCurrentAudio(track);
    setPlaying(true);
    setLocalProgress(0);
    setAudioProgress(0);

    setWatermarkLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        audioId: track.id,
        userId: 'user-001',
        playedAt: new Date().toISOString(),
        duration: 0,
        watermarkId: generateWatermarkId(track.id),
        deviceFingerprint,
      },
      ...prev,
    ]);
  };

  const handleAutoNext = () => {
    if (playQueue.length === 0) return;
    const nextIdx = isShuffled
      ? Math.floor(Math.random() * playQueue.length)
      : (queueIndex + 1) % playQueue.length;
    setQueueIndex(nextIdx);
    const nextTrack = playQueue[nextIdx];
    setCurrentAudio(nextTrack);
    setPlaying(true);
    setLocalProgress(0);
    setAudioProgress(0);
    setWatermarkLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        audioId: nextTrack.id,
        userId: 'user-001',
        playedAt: new Date().toISOString(),
        duration: 0,
        watermarkId: generateWatermarkId(nextTrack.id),
        deviceFingerprint,
      },
      ...prev,
    ]);
  };

  const handleManualNext = () => {
    if (playQueue.length === 0) return;
    const nextIdx = isShuffled
      ? Math.floor(Math.random() * playQueue.length)
      : (queueIndex + 1) % playQueue.length;
    setQueueIndex(nextIdx);
    const nextTrack = playQueue[nextIdx];
    setCurrentAudio(nextTrack);
    setPlaying(true);
    setLocalProgress(0);
    setAudioProgress(0);
  };

  const handleManualPrev = () => {
    if (playQueue.length === 0) return;
    const prevIdx = Math.max(0, queueIndex - 1);
    setQueueIndex(prevIdx);
    const prevTrack = playQueue[prevIdx];
    setCurrentAudio(prevTrack);
    setPlaying(true);
    setLocalProgress(0);
    setAudioProgress(0);
  };

  const playFromQueue = (idx: number) => {
    const track = playQueue[idx];
    if (!track) return;
    setQueueIndex(idx);
    setCurrentAudio(track);
    setPlaying(true);
    setLocalProgress(0);
    setAudioProgress(0);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  const activeCatMeta = categories.find((c) => c.id === activeCategory);
  const totalDurationSec = filteredTracks.reduce((sum, t) => sum + t.duration, 0);
  const totalPlayCount = filteredTracks.reduce((sum, t) => sum + t.playCount, 0);

  return (
    <div className="min-h-screen pb-40">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-30 backdrop-blur-xl bg-night-900/80 border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-6 py-5 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                音频干预库
                <Chip variant="dream" className="py-0">
                  <Shield size={10} />
                  全量版权水印
                </Chip>
              </h1>
              <p className="text-sm text-silver-400 mt-1">
                精选 {audioTracks.length} 条专业音频 · 4 大场景分类 · 追踪播放记录
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsShuffled(!isShuffled)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-300 border',
                  isShuffled
                    ? 'bg-dream-400/15 text-dream-300 border-dream-400/40 shadow-[0_0_16px_rgba(155,126,219,0.25)]'
                    : 'bg-white/5 text-silver-300 border-white/5 hover:bg-white/10'
                )}
              >
                <Shuffle size={14} />
                随机播放
              </button>
              <button
                onClick={() => setShowQueuePanel(!showQueuePanel)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-300 border',
                  showQueuePanel
                    ? 'bg-mint-400/15 text-mint-300 border-mint-400/40'
                    : 'bg-white/5 text-silver-300 border-white/5 hover:bg-white/10'
                )}
              >
                <ListMusic size={14} />
                队列 {playQueue.length > 0 && `(${playQueue.length})`}
              </button>
              <PillButton
                variant="mint"
                size="sm"
                leftIcon={<PlayCircle size={14} />}
                onClick={playAll}
                disabled={filteredTracks.length === 0}
              >
                播放全部 · {filteredTracks.length} 条
              </PillButton>
            </div>
          </div>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-silver-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索音频、标签、作者..."
              className="w-full h-12 pl-12 pr-5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-silver-500 focus:outline-none focus:border-dream-400/50 focus:bg-white/8 transition-all duration-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-silver-400 hover:text-white transition-colors text-sm"
              >
                清除
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              const trackCount = audioTracks.filter((t) => t.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'relative group flex flex-col gap-2 p-4 rounded-2xl transition-all duration-500 text-left border overflow-hidden min-h-[108px]',
                    isActive
                      ? 'bg-white/10 border-white/15 shadow-glow-dream scale-[1.01]'
                      : 'bg-white/5 border-white/5 hover:bg-white/[0.07] hover:border-white/10'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryGlow"
                      className="absolute inset-0 -z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className={cn('absolute inset-0 bg-gradient-to-r opacity-40 blur-xl', cat.gradient)} />
                      <div className={cn('absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br opacity-60 blur-2xl', cat.gradient)} />
                    </motion.div>
                  )}
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300',
                        isActive
                          ? `bg-gradient-to-br ${cat.gradient} text-night-900 shadow-lg`
                          : 'bg-white/5 text-silver-300'
                      )}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn('font-semibold transition-colors text-base', isActive ? 'text-white' : 'text-silver-200')}>
                        {cat.label}
                      </div>
                      <div className="text-xs text-silver-400 mt-0.5">
                        {trackCount} 条 · {categoryColor(cat.id)?.includes('mint') ? '高效助眠' : categoryColor(cat.id)?.includes('coral') ? '情绪舒缓' : '压力管理'}
                      </div>
                    </div>
                  </div>
                  <p className={cn(
                    'text-[11px] leading-relaxed transition-colors',
                    isActive ? 'text-silver-300' : 'text-silver-500'
                  )}>
                    {cat.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-white flex items-center gap-1.5">
                  <span className={cn(
                    'w-2.5 h-2.5 rounded-full bg-gradient-to-br',
                    activeCatMeta?.gradient
                  )} />
                  {categoryLabel(activeCategory)}
                </span>
                <span className="text-xs text-silver-500">·</span>
                <span className="text-xs text-silver-400">共 {filteredTracks.length} 条结果</span>
                <span className="text-xs text-silver-500">·</span>
                <span className="text-xs text-silver-400">
                  <Clock size={10} className="inline mr-1" />
                  总时长 {formatSecondsToTime(totalDurationSec)}
                </span>
                <span className="text-xs text-silver-500">·</span>
                <span className="text-xs text-silver-400">
                  <Volume2 size={10} className="inline mr-1" />
                  累计播放 {(totalPlayCount / 10000).toFixed(1)}w+
                </span>
                {searchQuery && (
                  <>
                    <span className="text-xs text-silver-500">·</span>
                    <span className="text-xs text-dream-300">搜索："{searchQuery}"</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Chip variant="mint" className="py-0">
                  <Shield size={10} />
                  所有音频嵌入版权水印
                </Chip>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeCategory}-${searchQuery}`}
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {filteredTracks.map((track) => (
                  <motion.div
                    key={track.id}
                    variants={itemVariants}
                    className={cn(
                      'transition-all duration-300',
                      currentTrack?.id === track.id && 'scale-[1.01] ring-1 ring-mint-400/50 rounded-3xl'
                    )}
                    onClick={() => handlePlayOne(track)}
                  >
                    <AudioCard track={track} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {filteredTracks.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Search size={28} className="text-silver-500" />
                </div>
                <p className="text-white font-medium mb-1">未找到相关音频</p>
                <p className="text-sm text-silver-400">换个关键词或分类试试吧</p>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-5">
              <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <Shield className="h-4 w-4 text-mint-300" />
                    音频版权水印追踪日志
                  </h3>
                  <p className="text-xs text-silver-500 mt-0.5">
                    每一次播放均嵌入不可感知水印，用于版权追踪与侵权取证
                  </p>
                </div>
                <Chip variant="mint" className="py-0">
                  今日 {watermarkLogs.filter((l) => dayjs(l.playedAt).isSame(dayjs(), 'day')).length} 条
                </Chip>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/5">
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-white/[0.03] text-[10px] text-silver-500 uppercase tracking-wider border-b border-white/5">
                  <div className="col-span-4">音频内容</div>
                  <div className="col-span-3">水印 ID</div>
                  <div className="col-span-2">播放时长</div>
                  <div className="col-span-2">时间</div>
                  <div className="col-span-1 text-right">操作</div>
                </div>
                <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
                  {watermarkLogs.slice(0, 20).map((log) => {
                    const track = audioTracks.find((t) => t.id === log.audioId);
                    if (!track) return null;
                    const isCurrent = currentTrack?.id === track.id;
                    return (
                      <div
                        key={log.id}
                        className={cn(
                          'grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs transition-colors border-b border-white/[0.03] last:border-0',
                          isCurrent && 'bg-mint-400/[0.04]'
                        )}
                      >
                        <div className="col-span-4 flex items-center gap-2 min-w-0">
                          <div
                            className="w-9 h-9 rounded-lg flex-shrink-0"
                            style={{ background: track.coverImage }}
                          />
                          <div className="min-w-0">
                            <div className={cn(
                              'font-medium truncate',
                              isCurrent ? 'text-mint-300' : 'text-silver-200'
                            )}>
                              {track.title}
                              {isCurrent && (
                                <span className="ml-1 text-[9px] text-mint-400">● 播放中</span>
                              )}
                            </div>
                            <div className="text-[10px] text-silver-500 truncate">
                              {track.author} · © {track.copyrightInfo.copyrightHolder.slice(0, 12)}
                            </div>
                          </div>
                        </div>
                        <div className="col-span-3">
                          <span className="font-mono text-[11px] text-dream-300 break-all">
                            {log.watermarkId}
                          </span>
                        </div>
                        <div className="col-span-2 text-silver-300 font-mono text-[11px]">
                          {formatSecondsToTime(log.duration)}
                          <span className="text-[9px] text-silver-600 ml-1">
                            / {formatSecondsToTime(track.duration)}
                          </span>
                        </div>
                        <div className="col-span-2 text-[11px] text-silver-400">
                          {dayjs(log.playedAt).isSame(dayjs(), 'day')
                            ? dayjs(log.playedAt).format('HH:mm')
                            : dayjs(log.playedAt).format('MM-DD HH:mm')}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            className="flex items-center gap-0.5 text-[10px] text-silver-400 hover:text-dream-300 transition-colors"
                            title="查看完整版权信息"
                          >
                            <FileText size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {watermarkLogs.length === 0 && (
                    <div className="py-8 text-center text-xs text-silver-500">
                      暂无播放记录
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-[10px] text-silver-500 mb-1">累计播放</div>
                  <div className="text-lg font-mono font-semibold text-silver-200">
                    {watermarkLogs.length}<span className="text-xs text-silver-500 ml-0.5">次</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-[10px] text-silver-500 mb-1">累计时长</div>
                  <div className="text-lg font-mono font-semibold text-silver-200">
                    {formatSecondsToTime(watermarkLogs.reduce((s, l) => s + l.duration, 0))}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-[10px] text-silver-500 mb-1">授权内容</div>
                  <div className="text-lg font-mono font-semibold text-dream-300">
                    {new Set(watermarkLogs.map((l) => l.audioId)).size}<span className="text-xs text-silver-500 ml-0.5">条</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-[10px] text-silver-500 mb-1">水印追踪率</div>
                  <div className="text-lg font-mono font-semibold text-mint-300">100<span className="text-xs text-silver-500 ml-0.5">%</span></div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        <div className="space-y-5">
          <AnimatePresence>
            {showQueuePanel && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="xl:sticky xl:top-28"
              >
                <GlassCard className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-white flex items-center gap-1.5">
                        <ListMusic className="h-4 w-4 text-mint-300" />
                        批量播放队列
                      </h3>
                      <p className="text-[11px] text-silver-500 mt-0.5">
                        {playQueue.length} 条 · 顺序播放 {isShuffled && '· 随机模式'}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowQueuePanel(false)}
                      className="xl:hidden w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-silver-400"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {playQueue.length > 0 && (
                    <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-mint-400/10 to-dream-400/10 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex-shrink-0 relative overflow-hidden"
                          style={{ background: currentTrack?.coverImage }}
                        >
                          {isLocalPlaying && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Pause size={18} className="text-white fill-current" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] text-mint-300 uppercase tracking-wider">
                            {queueIndex + 1} / {playQueue.length} · 正在播放
                          </div>
                          <div className="text-sm font-medium text-white truncate mt-0.5">
                            {currentTrack?.title || '未选择'}
                          </div>
                          <div className="text-[11px] text-silver-400 truncate">
                            {currentTrack?.author} · © {currentTrack?.copyrightInfo.copyrightHolder.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-center gap-3">
                        <button
                          onClick={handleManualPrev}
                          className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-silver-300 hover:bg-white/10"
                        >
                          <SkipBack size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setPlaying(!isLocalPlaying);
                            setIsLocalPlaying(!isLocalPlaying);
                          }}
                          className="w-11 h-11 rounded-full bg-gradient-to-br from-mint-400 to-dream-400 flex items-center justify-center text-night-900 shadow-glow-mint"
                        >
                          {isLocalPlaying ? (
                            <Pause size={18} className="fill-current" />
                          ) : (
                            <Play size={18} className="fill-current ml-0.5" />
                          )}
                        </button>
                        <button
                          onClick={handleManualNext}
                          className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-silver-300 hover:bg-white/10"
                        >
                          <SkipForward size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
                    {playQueue.length === 0 ? (
                      <div className="py-10 text-center">
                        <div className="w-14 h-14 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-3">
                          <ListMusic size={22} className="text-silver-600" />
                        </div>
                        <p className="text-xs text-silver-500">暂无队列</p>
                        <p className="text-[11px] text-silver-600 mt-1">
                          点击"播放全部"或任意音频开始播放
                        </p>
                      </div>
                    ) : (
                      playQueue.map((t, idx) => {
                        const active = idx === queueIndex;
                        return (
                          <button
                            key={t.id + idx}
                            onClick={() => playFromQueue(idx)}
                            className={cn(
                              'w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all duration-300 border',
                              active
                                ? 'bg-mint-400/10 border-mint-400/30'
                                : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05] hover:border-white/10'
                            )}
                          >
                            <div className={cn(
                              'w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-mono',
                              active ? 'bg-mint-400/30 text-white' : 'bg-white/5 text-silver-500'
                            )}>
                              {active ? (
                                isLocalPlaying ? (
                                  <div className="flex items-end gap-0.5 h-3">
                                    <div className="w-0.5 h-2 bg-mint-300 animate-[bounce_1s_infinite]" />
                                    <div className="w-0.5 h-3 bg-mint-300 animate-[bounce_1s_infinite_0.15s]" />
                                    <div className="w-0.5 h-2 bg-mint-300 animate-[bounce_1s_infinite_0.3s]" />
                                  </div>
                                ) : (
                                  <Play size={10} className="text-mint-300 fill-current ml-0.5" />
                                )
                              ) : (
                                idx + 1
                              )}
                            </div>
                            <div
                              className="w-10 h-10 rounded-lg flex-shrink-0"
                              style={{ background: t.coverImage }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className={cn(
                                'text-xs font-medium truncate',
                                active ? 'text-mint-300' : 'text-silver-200'
                              )}>
                                {t.title}
                              </div>
                              <div className="text-[10px] text-silver-500 truncate flex items-center gap-1 mt-0.5">
                                <Shield size={9} className={active ? 'text-mint-400' : 'text-silver-600'} />
                                <span className="font-mono">
                                  {t.copyrightInfo.watermarkId.slice(-8)}
                                </span>
                              </div>
                            </div>
                            <div className="text-[10px] font-mono text-silver-500 flex-shrink-0">
                              {formatSecondsToTime(t.duration)}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {playQueue.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setPlayQueue([]);
                          setQueueIndex(-1);
                        }}
                        className="text-[11px] text-silver-500 hover:text-coral-300 transition-colors"
                      >
                        清空队列
                      </button>
                      <ChevronRight size={14} className="text-silver-600" />
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <GlassCard className="p-5">
              <div className="mb-3">
                <h3 className="text-sm font-medium text-white flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-dream-300" />
                  分类速览
                </h3>
                <p className="text-[11px] text-silver-500 mt-0.5">点击切换对应分类</p>
              </div>
              <div className="space-y-1.5">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 border text-left',
                        isActive
                          ? 'bg-white/10 border-white/15'
                          : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05]'
                      )}
                    >
                      <div className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center',
                        isActive ? `bg-gradient-to-br ${cat.gradient} text-night-900` : 'bg-white/5 text-silver-400'
                      )}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1">
                        <div className={cn('text-xs font-medium', isActive ? 'text-white' : 'text-silver-200')}>
                          {cat.label}
                        </div>
                        <div className="text-[10px] text-silver-500">
                          {audioTracks.filter((t) => t.category === cat.id).length} 条内容
                        </div>
                      </div>
                      <ChevronRight size={14} className={cn(
                        'transition-colors',
                        isActive ? 'text-mint-300' : 'text-silver-600'
                      )} />
                    </button>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>

      <AudioPlayer />
    </div>
  );
}
