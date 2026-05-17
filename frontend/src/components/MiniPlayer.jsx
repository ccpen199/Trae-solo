import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/usePlayerStore';
import useUIStore from '../store/useUIStore';

function MiniPlayer() {
  const navigate = useNavigate();
  const { 
    currentSong, 
    isPlaying, 
    currentTime, 
    duration, 
    volume, 
    isMuted,
    isLooping,
    isShuffle,
    playPrev, 
    playNext, 
    togglePlay,
    setCurrentTime,
    setDuration,
    setVolume,
    toggleMute,
    toggleLoop,
    toggleShuffle,
  } = usePlayerStore();
  const { setPlayerExpanded } = useUIStore();
  const audioRef = useRef(null);
  const [showVolume, setShowVolume] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current && currentSong) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (audioRef.current && currentSong) {
      audioRef.current.src = currentSong.audio_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      audioRef.current.currentTime = 0;
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [currentSong?.id]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [setCurrentTime]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, [setDuration]);

  const handleEnded = useCallback(() => {
    if (isLooping) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } else {
      playNext();
    }
  }, [isLooping, playNext]);

  const handleProgressClick = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleExpand = () => {
    if (currentSong) {
      navigate(`/player/${currentSong.id}`);
      setPlayerExpanded(true);
    }
  };

  if (!currentSong) {
    return null;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />
      
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '80px',
        background: 'linear-gradient(180deg, rgba(26,26,46,0.95) 0%, rgba(15,15,35,0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '24px',
      }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0, cursor: 'pointer' }}
          onClick={handleExpand}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            overflow: 'hidden',
            flexShrink: 0,
            animation: isPlaying ? 'spin 8s linear infinite' : 'none',
          }}>
            <img
              src={currentSong.cover || `https://picsum.photos/seed/${currentSong.id}/56/56`}
              alt={currentSong.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <h4 style={{
              fontSize: '15px',
              fontWeight: '600',
              marginBottom: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {currentSong.title}
            </h4>
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.6)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {currentSong.artist_name || '未知歌手'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={toggleShuffle}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: isShuffle ? '#fe2c55' : 'rgba(255,255,255,0.6)',
                padding: '8px',
              }}
            >
              <Music size={18} />
            </button>

            <button
              onClick={playPrev}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.8)',
                padding: '8px',
              }}
            >
              <SkipBack size={24} />
            </button>

            <button
              onClick={togglePlay}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fe2c55, #ff6b8a)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '2px' }} />}
            </button>

            <button
              onClick={playNext}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.8)',
                padding: '8px',
              }}
            >
              <SkipForward size={24} />
            </button>

            <button
              onClick={toggleLoop}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: isLooping ? '#fe2c55' : 'rgba(255,255,255,0.6)',
                padding: '8px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', maxWidth: '500px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', width: '40px' }}>
              {formatTime(currentTime)}
            </span>
            <div
              style={{
                flex: 1,
                height: '4px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '2px',
                cursor: 'pointer',
                position: 'relative',
              }}
              onClick={handleProgressClick}
            >
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #fe2c55, #ff6b8a)',
                borderRadius: '2px',
                width: `${progress}%`,
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  right: '-6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }} />
              </div>
            </div>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', width: '40px', textAlign: 'right' }}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={toggleMute}
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.8)',
                padding: '8px',
              }}
            >
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            
            {showVolume && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  right: '0',
                  padding: '12px',
                  background: 'rgba(0,0,0,0.9)',
                  borderRadius: '12px',
                  marginBottom: '8px',
                }}
                onMouseEnter={() => setShowVolume(true)}
                onMouseLeave={() => setShowVolume(false)}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  style={{
                    width: '100px',
                    height: '4px',
                    WebkitAppearance: 'none',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                />
              </div>
            )}
          </div>

          <button
            onClick={handleExpand}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.8)',
              padding: '8px',
            }}
          >
            <Maximize2 size={20} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .card:hover .play-btn,
        .card:hover .play-overlay {
          opacity: 1 !important;
          transform: scale(1);
        }
      `}</style>
    </>
  );
}

export default MiniPlayer;
