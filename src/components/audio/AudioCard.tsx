import { useState } from 'react';
import { Heart, Play, Clock, Shield, FileText, X } from 'lucide-react';
import type { AudioTrack } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatDuration, categoryLabel, categoryColor } from '@/lib/utils';
import { GlassCard } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioCardProps {
  track: AudioTrack;
  onClick?: () => void;
}

export default function AudioCard({ track, onClick }: AudioCardProps) {
  const { favorites, toggleFavorite, setCurrentAudio, setPlaying } = useAppStore();
  const isFavorite = favorites.includes(track.id);
  const [showCopyright, setShowCopyright] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentAudio(track);
    setPlaying(true);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(track.id);
  };

  const handleShowCopyright = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCopyright(true);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-3xl cursor-pointer',
        'transition-all duration-500 ease-out',
        'hover:-translate-y-1 hover:shadow-glow-dream'
      )}
    >
      <div
        className="absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity duration-500"
        style={{ background: track.coverImage }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-night-900/90 via-night-900/30 to-transparent" />

      <div className="absolute inset-0 border border-white/10 rounded-3xl group-hover:border-dream-400/40 transition-colors duration-300" />

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div
          className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full blur-3xl opacity-40"
          style={{ background: track.coverImage }}
        />
      </div>

      <div className="relative p-5 aspect-[4/5] flex flex-col">
        <div className="flex justify-between items-start">
          <span className={cn('chip text-xs', categoryColor(track.category))}>
            {categoryLabel(track.category)}
          </span>

          <button
            onClick={handleFavorite}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300',
              'backdrop-blur-md',
              isFavorite
                ? 'bg-coral-400/25 text-coral-300'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            )}
          >
            <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="flex-1" />

        <div className="space-y-2">
          <h3 className="font-semibold text-white text-lg leading-tight line-clamp-2 group-hover:text-dream-100 transition-colors">
            {track.title}
          </h3>
          <p className="text-sm text-silver-300/80 line-clamp-2">
            {track.description}
          </p>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1.5 text-silver-400">
            <Clock size={14} />
            <span className="text-xs font-mono">
              {formatDuration(track.duration)}
            </span>
          </div>

          <button
            onClick={handlePlay}
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center',
              'bg-gradient-to-r from-mint-400 to-dream-400 text-night-900',
              'shadow-glow-mint opacity-0 translate-y-2',
              'group-hover:opacity-100 group-hover:translate-y-0',
              'transition-all duration-300',
              'hover:brightness-110 active:scale-95'
            )}
          >
            <Play size={18} fill="currentColor" className="ml-0.5" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-mint-400 to-dream-400 transition-all duration-500"
          style={{ width: `${Math.min(100, (track.playCount / 50000) * 100)}%` }}
        />
      </div>

      {track.watermarkEmbedded && (
        <div className="absolute top-5 right-5 flex items-center gap-1.5 px-2 py-1 rounded-full bg-night-900/70 backdrop-blur-md border border-mint-400/20 text-[10px] font-mono text-mint-300">
          <Shield size={10} />
          <span>WM</span>
        </div>
      )}

      <button
        onClick={handleShowCopyright}
        className="absolute top-5 right-14 w-7 h-7 rounded-full bg-night-900/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-silver-300 hover:text-white hover:border-dream-400/50 transition-all duration-300 opacity-0 group-hover:opacity-100"
        title="版权与水印信息"
      >
        <FileText size={12} />
      </button>

      <AnimatePresence>
        {showCopyright && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCopyright(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[92%] max-w-md"
            >
              <GlassCard className="p-6 relative">
                <button
                  onClick={() => setShowCopyright(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-silver-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-mint-400/20 to-dream-400/20 border border-mint-400/30">
                    <Shield className="w-6 h-6 text-mint-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">版权与水印信息</h3>
                    <p className="text-xs text-silver-400">此音频受版权保护并嵌入追踪水印</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                      <div className="text-[10px] text-silver-500 mb-1">水印ID</div>
                      <div className="text-sm font-mono text-mint-300 break-all">
                        {track.copyrightInfo.watermarkId}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                      <div className="text-[10px] text-silver-500 mb-1">内容ID</div>
                      <div className="text-sm font-mono text-dream-300 break-all">
                        {track.copyrightInfo.contentId}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-silver-400">版权方</span>
                      <span className="text-white font-medium">{track.copyrightInfo.copyrightHolder}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-silver-400">授权类型</span>
                      <span className="text-dream-300">{track.copyrightInfo.licenseType}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-silver-400">结算方式</span>
                      <span className="text-mint-300">{track.copyrightInfo.royaltyInfo}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-silver-400">水印状态</span>
                      <span className={track.watermarkEmbedded ? 'text-mint-300' : 'text-coral-300'}>
                        {track.watermarkEmbedded ? '已嵌入' : '未嵌入'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-silver-400">播放次数</span>
                      <span className="text-silver-200">{track.playCount.toLocaleString()} 次</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-dream-400/10 border border-dream-400/20">
                    <p className="text-xs text-silver-300 leading-relaxed">
                      💡 平台所有音频均嵌入不可感知版权水印，用于追踪非法传播，保护内容创作者合法权益。
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
