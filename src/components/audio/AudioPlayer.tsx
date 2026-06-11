import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Heart,
  Volume2,
  VolumeX,
  Timer,
  SkipBack,
  SkipForward,
  X,
  Shield,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatSecondsToTime } from '@/lib/utils';

const WAVEFORM_BARS = 48;

export default function AudioPlayer() {
  const {
    currentAudio,
    isPlaying,
    audioProgress,
    sleepTimer,
    favorites,
    setPlaying,
    setAudioProgress,
    setSleepTimer,
    toggleFavorite,
    setCurrentAudio,
  } = useAppStore();

  const [volume, setVolume] = useState(0.8);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [waveformHeights] = useState(() =>
    Array.from({ length: WAVEFORM_BARS }, () => 0.3 + Math.random() * 0.7)
  );

  const timerOptions = [15, 30, 45, 60, 90, null];

  useEffect(() => {
    if (!isPlaying || !currentAudio) return;
    const interval = setInterval(() => {
      setAudioProgress(Math.min(audioProgress + 1, currentAudio.duration));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, audioProgress, currentAudio, setAudioProgress]);

  if (!currentAudio) return null;

  const progress = currentAudio.duration > 0 ? audioProgress / currentAudio.duration : 0;
  const isFavorite = favorites.includes(currentAudio.id);

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    setAudioProgress(Math.floor(pct * currentAudio.duration));
  };

  const togglePlay = () => {
    setPlaying(!isPlaying);
  };

  const skipBack = () => {
    setAudioProgress(Math.max(0, audioProgress - 15));
  };

  const skipForward = () => {
    setAudioProgress(Math.min(currentAudio.duration, audioProgress + 15));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-night-900/95 via-night-900/80 to-transparent pointer-events-none" />
      <div className="relative px-4 pb-safe pt-3">
        <div className="glass-card relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-30"
            style={{ background: currentAudio.coverImage }}
          />

          <div className="relative flex items-center gap-4 p-4">
            <div className="relative flex-shrink-0">
              <div
                className={cn(
                  'w-16 h-16 rounded-full overflow-hidden shadow-lg',
                  isPlaying && 'animate-spin',
                  'border-2 border-white/10'
                )}
                style={{ animationDuration: '8s' }}
              >
                <div
                  className="w-full h-full"
                  style={{ background: currentAudio.coverImage }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-night-900 border-2 border-white/20" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="min-w-0 flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white truncate text-sm">
                      {currentAudio.title}
                    </h4>
                    {currentAudio.watermarkEmbedded && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-mint-400/15 text-mint-300 border border-mint-400/20 flex-shrink-0" title={`水印ID: ${currentAudio.copyrightInfo.watermarkId}`}>
                        <Shield size={8} />
                        {currentAudio.copyrightInfo.watermarkId.slice(-5)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-silver-400 truncate">
                    {currentAudio.author} · © {currentAudio.copyrightInfo.copyrightHolder}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-xs font-mono text-silver-400 tabular-nums">
                    {formatSecondsToTime(audioProgress)}
                  </span>
                  <span className="text-xs text-silver-500">/</span>
                  <span className="text-xs font-mono text-silver-400 tabular-nums">
                    {formatSecondsToTime(currentAudio.duration)}
                  </span>
                </div>
              </div>

              <div
                className="h-8 flex items-center justify-between gap-0.5 cursor-pointer group"
                onClick={handleWaveformClick}
              >
                {waveformHeights.map((height, i) => {
                  const isActive = i / WAVEFORM_BARS < progress;
                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex-1 rounded-full transition-all duration-200 waveform-bar',
                        isActive
                          ? 'bg-gradient-to-t from-mint-400 to-dream-400'
                          : 'bg-white/15 group-hover:bg-white/25',
                        isPlaying && isActive && 'active'
                      )}
                      style={{
                        height: `${Math.max(4, height * 100)}%`,
                        opacity: isActive ? 1 : 0.5,
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={skipBack}
                className="w-10 h-10 rounded-full flex items-center justify-center text-silver-300 hover:text-white hover:bg-white/10 transition-all"
              >
                <SkipBack size={18} />
              </button>

              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-mint-400 to-dream-400 text-night-900 flex items-center justify-center shadow-glow-mint hover:brightness-110 transition-all active:scale-95"
              >
                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
              </button>

              <button
                onClick={skipForward}
                className="w-10 h-10 rounded-full flex items-center justify-center text-silver-300 hover:text-white hover:bg-white/10 transition-all"
              >
                <SkipForward size={18} />
              </button>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0 pl-2 border-l border-white/10">
              <div className="relative">
                <button
                  onClick={() => setShowTimerMenu(!showTimerMenu)}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                    sleepTimer
                      ? 'text-mint-300 bg-mint-400/15'
                      : 'text-silver-300 hover:text-white hover:bg-white/10'
                  )}
                >
                  <Timer size={18} />
                </button>

                {showTimerMenu && (
                  <div className="absolute bottom-full mb-2 right-0 glass-card p-2 min-w-[120px]">
                    <p className="text-xs text-silver-400 px-3 py-1">定时关闭</p>
                    {timerOptions.map((mins) => (
                      <button
                        key={mins ?? 'off'}
                        onClick={() => {
                          setSleepTimer(mins);
                          setShowTimerMenu(false);
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg text-sm transition-all',
                          sleepTimer === mins
                            ? 'bg-mint-400/20 text-mint-300'
                            : 'text-silver-300 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        {mins ? `${mins} 分钟` : '关闭'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-silver-300 hover:text-white hover:bg-white/10 transition-all"
                >
                  {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>

                {showVolumeSlider && (
                  <div className="absolute bottom-full mb-2 right-0 glass-card p-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-24 h-1 accent-mint-400"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={() => toggleFavorite(currentAudio.id)}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  isFavorite
                    ? 'text-coral-400'
                    : 'text-silver-300 hover:text-coral-300 hover:bg-white/10'
                )}
              >
                <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>

              <button
                onClick={() => setCurrentAudio(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-silver-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
