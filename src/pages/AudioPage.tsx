import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, Sparkles, CloudRain, Brain, Moon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { GlassCard, PillButton } from '@/components/ui';
import AudioCard from '@/components/audio/AudioCard';
import AudioPlayer from '@/components/audio/AudioPlayer';
import { cn, categoryLabel, categoryColor } from '@/lib/utils';
import type { AudioCategory } from '@/types';

const categories: { id: AudioCategory; label: string; icon: typeof Heart; gradient: string }[] = [
  {
    id: 'anxiety',
    label: '焦虑缓解',
    icon: CloudRain,
    gradient: 'from-coral-500 to-coral-300',
  },
  {
    id: 'stress',
    label: '压力释放',
    icon: Sparkles,
    gradient: 'from-dream-500 to-dream-300',
  },
  {
    id: 'insomnia',
    label: '深度失眠',
    icon: Moon,
    gradient: 'from-mint-500 to-mint-300',
  },
  {
    id: 'meditation',
    label: '专注冥想',
    icon: Brain,
    gradient: 'from-night-400 to-dream-400',
  },
];

export default function AudioPage() {
  const { audioTracks, currentAudio, setCurrentAudio, setPlaying } = useAppStore();

  const [activeCategory, setActiveCategory] = useState<AudioCategory>('anxiety');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTracks = useMemo(() => {
    let tracks = audioTracks.filter((t) => t.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tracks = tracks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return tracks;
  }, [audioTracks, activeCategory, searchQuery]);

  const playAll = () => {
    if (filteredTracks.length > 0) {
      setCurrentAudio(filteredTracks[0]);
      setPlaying(true);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen pb-40">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-30 backdrop-blur-xl bg-night-900/70 border-b border-white/5"
      >
        <div className="max-w-6xl mx-auto px-6 py-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">音频干预库</h1>
              <p className="text-sm text-silver-400 mt-1">
                精选 {audioTracks.length} 条专业音频，助你改善睡眠
              </p>
            </div>
            <PillButton
              variant="mint"
              size="sm"
              onClick={playAll}
              disabled={filteredTracks.length === 0}
            >
              播放全部
            </PillButton>
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
              placeholder="搜索音频、标签或作者..."
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

          <div className="grid grid-cols-4 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              const trackCount = audioTracks.filter((t) => t.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'relative group flex items-center gap-3 p-4 rounded-2xl transition-all duration-500',
                    isActive
                      ? 'bg-white/10 border-white/15'
                      : 'bg-white/5 border-white/5 hover:bg-white/[0.07] hover:border-white/10',
                    'border overflow-hidden'
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
                      <div
                        className={cn(
                          'absolute inset-0 bg-gradient-to-r opacity-40 blur-xl',
                          cat.gradient
                        )}
                      />
                      <div
                        className={cn(
                          'absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br opacity-60 blur-2xl',
                          cat.gradient
                        )}
                      />
                    </motion.div>
                  )}

                  <div
                    className={cn(
                      'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300',
                      isActive
                        ? `bg-gradient-to-br ${cat.gradient} text-night-900 shadow-lg`
                        : 'bg-white/5 text-silver-300'
                    )}
                  >
                    <Icon size={20} />
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div
                      className={cn(
                        'font-semibold transition-colors duration-300',
                        isActive ? 'text-white' : 'text-silver-200'
                      )}
                    >
                      {cat.label}
                    </div>
                    <div className="text-xs text-silver-400 mt-0.5">
                      {trackCount} 条音频
                    </div>
                  </div>

                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="flex-shrink-0 w-2 h-2 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                      }}
                    >
                      <div className={cn('w-full h-full rounded-full bg-gradient-to-r', cat.gradient)} />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-sm text-silver-400">
              {categoryLabel(activeCategory)}
            </span>
            <span className="text-xs text-silver-500">
              · 共 {filteredTracks.length} 条结果
            </span>
            {searchQuery && (
              <span className="text-xs text-dream-300 ml-2">
                搜索："{searchQuery}"
              </span>
            )}
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
            className="grid grid-cols-2 md:grid-cols-3 gap-5"
          >
            {filteredTracks.map((track, index) => (
              <motion.div key={track.id} variants={itemVariants}>
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
      </div>

      <AudioPlayer />
    </div>
  );
}
