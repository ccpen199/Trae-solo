import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  CloudRain,
  Compass,
  Headphones,
  Moon,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { GlassCard, PillButton, Chip } from '@/components/ui';
import { cn, categoryLabel, formatDuration } from '@/lib/utils';
import type { AudioCategory, AudioTrack } from '@/types';

interface DiscoverCategory {
  id: AudioCategory;
  name: string;
  summary: string;
  protocol: string;
  riskFit: string;
  trackCount: number;
  tracks?: { id: number; title: string; category: string; duration: number }[];
}

const fallbackCategories: DiscoverCategory[] = [
  {
    id: 'insomnia',
    name: '深度失眠',
    summary: '睡前故事、白噪音与CBT-I助眠练习',
    protocol: 'CBT-I + 睡眠限制疗法',
    riskFit: '入睡困难、早醒、睡眠效率偏低',
    trackCount: 0,
  },
  {
    id: 'anxiety',
    name: '焦虑缓解',
    summary: '呼吸节律、接地练习与夜间惊醒安抚',
    protocol: '4-7-8呼吸 + 正念接地',
    riskFit: '压力升高、夜间觉醒、心率波动',
    trackCount: 0,
  },
  {
    id: 'stress',
    name: '压力释放',
    summary: '身体扫描、雨声放松与渐进式肌肉松弛',
    protocol: 'PMR渐进放松',
    riskFit: '工作压力、肩颈紧张、浅睡比例高',
    trackCount: 0,
  },
  {
    id: 'meditation',
    name: '专注冥想',
    summary: '晨间唤醒、正念冥想与情绪记录',
    protocol: '正念认知训练',
    riskFit: '情绪波动、晨间疲惫、专注下降',
    trackCount: 0,
  },
];

const categoryMeta: Record<AudioCategory, { icon: typeof Moon; color: string; badge: string }> = {
  insomnia: { icon: Moon, color: 'from-mint-500/30 to-night-500/30', badge: 'chip-mint' },
  anxiety: { icon: CloudRain, color: 'from-coral-500/30 to-night-500/30', badge: 'chip-coral' },
  stress: { icon: Sparkles, color: 'from-dream-500/30 to-night-500/30', badge: 'chip-dream' },
  meditation: { icon: Brain, color: 'from-night-400/50 to-dream-500/25', badge: 'chip' },
};

function trackMatches(track: AudioTrack, query: string) {
  const word = query.trim().toLowerCase();
  if (!word) return true;
  return (
    track.title.toLowerCase().includes(word) ||
    track.description.toLowerCase().includes(word) ||
    track.author.toLowerCase().includes(word) ||
    track.tags.some((tag) => tag.toLowerCase().includes(word))
  );
}

export default function DiscoverPage() {
  const audioTracks = useAppStore((s) => s.audioTracks);
  const setCurrentAudio = useAppStore((s) => s.setCurrentAudio);
  const setPlaying = useAppStore((s) => s.setPlaying);
  const [categories, setCategories] = useState<DiscoverCategory[]>(fallbackCategories);
  const [activeCategory, setActiveCategory] = useState<AudioCategory>('insomnia');
  const [query, setQuery] = useState('');
  const [apiStatus, setApiStatus] = useState<'loading' | 'ok' | 'fallback'>('loading');

  useEffect(() => {
    let cancelled = false;

    fetch('/api/discover/categories')
      .then((res) => {
        if (!res.ok) throw new Error('discover api failed');
        return res.json();
      })
      .then((payload) => {
        if (cancelled) return;
        const next = Array.isArray(payload.data) ? payload.data : fallbackCategories;
        setCategories(next);
        setApiStatus('ok');
      })
      .catch(() => {
        if (cancelled) return;
        setCategories(fallbackCategories);
        setApiStatus('fallback');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const enrichedCategories = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      trackCount: Math.max(category.trackCount, audioTracks.filter((track) => track.category === category.id).length),
    }));
  }, [categories, audioTracks]);

  const activeTracks = useMemo(() => {
    return audioTracks
      .filter((track) => track.category === activeCategory)
      .filter((track) => trackMatches(track, query));
  }, [audioTracks, activeCategory, query]);

  const selectedCategory = enrichedCategories.find((category) => category.id === activeCategory) || enrichedCategories[0];

  const playTrack = (track: AudioTrack) => {
    setCurrentAudio(track);
    setPlaying(true);
  };

  return (
    <div className="min-h-screen pb-40">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-mint-300">
              <Compass className="h-4 w-4" />
              <span className="text-sm">发现分类 · 个性化干预内容</span>
              <Chip variant={apiStatus === 'ok' ? 'mint' : 'dream'}>
                {apiStatus === 'loading' ? '接口加载中' : apiStatus === 'ok' ? 'API已连接' : '本地数据'}
              </Chip>
            </div>
            <h1 className="font-display text-3xl font-semibold text-white md:text-4xl">按睡眠问题发现干预方案</h1>
            <p className="mt-2 max-w-3xl text-sm text-silver-400">
              分类聚合音频、CBT-I模块和风险适配说明，复验可以直接进入“发现/分类”业务页面。
            </p>
          </div>
          <div className="relative w-full xl:w-96">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-silver-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-full border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-dream-300/50"
              placeholder="搜索音频、标签或作者"
            />
          </div>
        </div>
      </motion.div>

      <div className="grid gap-5 xl:grid-cols-4">
        {enrichedCategories.map((category, index) => {
          const meta = categoryMeta[category.id];
          const Icon = meta.icon;
          const active = activeCategory === category.id;
          return (
            <motion.button
              key={category.id}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                'rounded-4xl border p-5 text-left transition-all duration-300',
                'bg-gradient-to-br',
                meta.color,
                active
                  ? 'border-dream-300/40 shadow-glow-dream'
                  : 'border-white/5 hover:border-white/15 hover:bg-white/5'
              )}
            >
              <div className="mb-5 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <span className={cn('chip', meta.badge)}>{category.trackCount} 个内容</span>
              </div>
              <h2 className="text-lg font-semibold text-white">{category.name}</h2>
              <p className="mt-2 min-h-[3rem] text-sm text-silver-400">{category.summary}</p>
              <div className="mt-4 rounded-2xl border border-white/5 bg-night-900/40 p-3 text-xs text-silver-400">
                <span className="text-silver-300">适配：</span>{category.riskFit}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <GlassCard className="p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Headphones className="h-4 w-4 text-dream-300" />
                <span className="text-sm text-silver-400">{selectedCategory?.name || categoryLabel(activeCategory)}</span>
              </div>
              <h2 className="text-xl font-semibold text-white">分类内容列表</h2>
            </div>
            <PillButton
              size="sm"
              variant="mint"
              leftIcon={<Play className="h-4 w-4" />}
              disabled={activeTracks.length === 0}
              onClick={() => activeTracks[0] && playTrack(activeTracks[0])}
            >
              播放首个
            </PillButton>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {activeTracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-3xl border border-white/5 bg-night-700/40 p-4 transition hover:border-white/15"
              >
                <div className="flex gap-4">
                  <div
                    className="h-20 w-20 shrink-0 rounded-3xl"
                    style={{ background: track.coverImage }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-white">{track.title}</h3>
                        <p className="text-xs text-silver-500">{track.author} · {formatDuration(track.duration)}</p>
                      </div>
                      <button
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint-400 text-night-900 transition hover:brightness-110"
                        onClick={() => playTrack(track)}
                        aria-label={`播放${track.title}`}
                      >
                        <Play className="h-4 w-4 fill-current" />
                      </button>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-silver-400">{track.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {track.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="chip">
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {activeTracks.length === 0 && (
              <div className="col-span-full rounded-3xl border border-dashed border-white/10 p-10 text-center text-sm text-silver-500">
                当前分类没有匹配内容
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-mint-300" />
            <h2 className="text-lg font-semibold text-white">分类说明</h2>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-4">
              <div className="text-xs text-silver-500">干预协议</div>
              <div className="mt-1 text-sm font-medium text-white">{selectedCategory?.protocol}</div>
            </div>
            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-4">
              <div className="text-xs text-silver-500">风险适配</div>
              <div className="mt-1 text-sm text-silver-300">{selectedCategory?.riskFit}</div>
            </div>
            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-4">
              <div className="text-xs text-silver-500">内容来源</div>
              <div className="mt-1 text-sm text-silver-300">本地 SQLite 分类接口 + 前端版权水印音频库</div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
