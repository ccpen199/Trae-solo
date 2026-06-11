import { Heart, Play, Clock } from 'lucide-react';
import type { AudioTrack } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatDuration, categoryLabel, categoryColor } from '@/lib/utils';

interface AudioCardProps {
  track: AudioTrack;
  onClick?: () => void;
}

export default function AudioCard({ track, onClick }: AudioCardProps) {
  const { favorites, toggleFavorite, setCurrentAudio, setPlaying } = useAppStore();
  const isFavorite = favorites.includes(track.id);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentAudio(track);
    setPlaying(true);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(track.id);
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
    </div>
  );
}
