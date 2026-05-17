import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipForward,
  SkipBack,
  X,
  Crown,
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { videoApi, adApi, userApi } from '../api/client';
import type { Video, Advertisement, User } from '../types';

interface VideoPlayerProps {
  videoId: number;
  userId?: number;
  onNext?: () => void;
  onPrev?: () => void;
  autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, userId, onNext, onPrev, autoPlay = true }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [video, setVideo] = useState<Video | null>(null);
  const [playerState, setPlayerState] = useState<string>('loading');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentQuality, setCurrentQuality] = useState<string>('720p');
  const [qualities, setQualities] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);
  const [adTimeLeft, setAdTimeLeft] = useState(0);
  const [adType, setAdType] = useState<string>('');

  const [user, setUser] = useState<User | null>(null);
  const [showVipModal, setShowVipModal] = useState(false);
  const [autoPlayNext, setAutoPlayNext] = useState(true);

  const [showPauseAd, setShowPauseAd] = useState(false);
  const [midAdPlayed, setMidAdPlayed] = useState(false);

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const checkVipStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await userApi.getVipStatus(userId);
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (err) {
      console.error('获取VIP状态失败:', err);
    }
  }, [userId]);

  const startVideoPlayback = useCallback(() => {
    console.log('开始播放主视频');
    setCurrentAd(null);
    setPlayerState(autoPlay ? 'playing' : 'paused');
    setTimeout(() => {
      if (videoRef.current) {
        if (autoPlay) {
          videoRef.current.play().catch((err) => {
            console.log('自动播放失败:', err);
          });
        }
      }
    }, 100);
  }, [autoPlay]);

  const loadAd = useCallback(async (type: string) => {
    try {
      const response = await adApi.getAd(type, videoId);
      if (response.success && response.data && response.data.video_url) {
        console.log('加载广告:', response.data);
        setCurrentAd(response.data);
        setAdType(type);
        setAdTimeLeft(response.data.duration);
        setPlayerState('ad');
      } else {
        console.log('无广告数据，直接播放主视频');
        startVideoPlayback();
      }
    } catch (err) {
      console.error('加载广告失败，直接播放主视频:', err);
      startVideoPlayback();
    }
  }, [videoId, startVideoPlayback]);

  const loadVideo = useCallback(async () => {
    setPlayerState('loading');
    setError(null);

    try {
      const response = await videoApi.getVideo(videoId);
      
      if (!response.success) {
        if (response.errorCode === 'VIDEO_NOT_FOUND') {
          setError('视频不存在');
        } else if (response.errorCode === 'VIDEO_NOT_APPROVED') {
          setError('视频审核未通过');
        } else {
          setError(response.message || '加载视频失败');
        }
        setPlayerState('error');
        return;
      }

      const videoData = response.data!;
      
      if (videoData.is_vip) {
        await checkVipStatus();
        if (!user?.is_vip_valid) {
          setVideo(videoData);
          setPlayerState('vip_required');
          setShowVipModal(true);
          return;
        }
      }

      setVideo(videoData);
      
      if (videoData.qualities) {
        setQualities(videoData.qualities);
      } else {
        const qualityResponse = await videoApi.getQualities(videoId);
        if (qualityResponse.success) {
          setQualities(qualityResponse.data || []);
        }
      }

      await loadAd('pre');
    } catch (err: any) {
      setError(err.message || '加载视频失败');
      setPlayerState('error');
    }
  }, [videoId, checkVipStatus, user?.is_vip_valid, loadAd]);

  const handleAdTimeUpdate = useCallback(() => {
    if (adTimeLeft > 0) {
      setAdTimeLeft(prev => prev - 1);
    } else {
      startVideoPlayback();
    }
  }, [adTimeLeft, startVideoPlayback]);

  const handleVideoEnded = useCallback(() => {
    if (autoPlayNext && onNext) {
      onNext();
    } else {
      setPlayerState('paused');
    }
  }, [autoPlayNext, onNext]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    
    setCurrentTime(current);
    setDuration(total);

    if (videoRef.current.buffered.length > 0) {
      setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
    }

    if (!midAdPlayed && current >= total / 2 && total > 60) {
      setMidAdPlayed(true);
      loadMidAd();
    }
  }, [midAdPlayed]);

  const loadMidAd = useCallback(async () => {
    try {
      const response = await adApi.getMidAd(videoId);
      if (response.success && response.data) {
        videoRef.current?.pause();
        setCurrentAd(response.data);
        setAdType('mid');
        setAdTimeLeft(response.data.duration);
        setPlayerState('ad');
      }
    } catch (err) {
      console.error('加载中插广告失败:', err);
    }
  }, [videoId]);

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current || !video) return;

    if (playerState === 'playing') {
      videoRef.current.pause();
      setPlayerState('paused');
      if (!currentAd) {
        loadPauseAd();
      }
    } else if (playerState === 'paused') {
      setShowPauseAd(false);
      videoRef.current.play().catch(() => {});
      setPlayerState('playing');
    }
  }, [playerState, video, currentAd]);

  const loadPauseAd = useCallback(async () => {
    try {
      const response = await adApi.getAd('pause', videoId);
      if (response.success && response.data) {
        setCurrentAd(response.data);
        setShowPauseAd(true);
      }
    } catch (err) {
      console.error('加载暂停广告失败:', err);
    }
  }, [videoId]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setIsSeeking(true);
    setTimeout(() => setIsSeeking(false), 500);

    videoApi.saveProgress(videoId, newTime, duration, userId).catch(() => {});
  }, [duration, videoId, userId]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isMuted) {
      videoRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const handleQualityChange = useCallback((quality: string) => {
    setCurrentQuality(quality);
    setShowQualityMenu(false);
    
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const qualityData = qualities.find(q => q.quality === quality);
      if (qualityData) {
        videoRef.current.src = qualityData.url;
        videoRef.current.currentTime = currentTime;
        if (playerState === 'playing') {
          videoRef.current.play().catch(() => {});
        }
      }
    }
  }, [qualities, playerState]);

  const skipAd = useCallback(() => {
    if (adType === 'pre' || adType === 'mid') {
      startVideoPlayback();
    }
  }, [adType, startVideoPlayback]);

  useEffect(() => {
    loadVideo();
  }, [loadVideo]);

  useEffect(() => {
    if (playerState === 'ad') {
      if (adTimeLeft > 0) {
        const timer = setTimeout(handleAdTimeUpdate, 1000);
        return () => clearTimeout(timer);
      } else {
        startVideoPlayback();
      }
    }
  }, [playerState, adTimeLeft, handleAdTimeUpdate, startVideoPlayback]);

  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;

    const resetHideTimeout = () => {
      setShowControls(true);
      clearTimeout(hideTimeout);
      if (playerState === 'playing') {
        hideTimeout = setTimeout(() => setShowControls(false), 3000);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', resetHideTimeout);
      container.addEventListener('touchstart', resetHideTimeout);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', resetHideTimeout);
        container.removeEventListener('touchstart', resetHideTimeout);
      }
      clearTimeout(hideTimeout);
    };
  }, [playerState]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (playerState === 'error') {
    return (
      <div className="video-player" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <AlertCircle size={64} style={{ marginBottom: '1rem', color: '#ef4444' }} />
          <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{error || '加载失败'}</p>
          <button
            onClick={loadVideo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: '0 auto',
              padding: '0.5rem 1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={20} />
            重试
          </button>
        </div>
      </div>
    );
  }

  if (playerState === 'loading') {
    return (
      <div className="video-player" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <Loader2 size={48} style={{ marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`video-player ${video?.aspect_ratio === '4:3' ? 'aspect-4-3' : ''}`}
    >
      <>
        <video
          ref={videoRef}
          src={qualities.find(q => q.quality === currentQuality)?.url || video?.url}
          poster={video?.thumbnail}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onClick={handlePlayPause}
          playsInline
          style={{ display: playerState === 'ad' && currentAd && (adType === 'pre' || adType === 'mid') ? 'none' : 'block' }}
        />

        {playerState === 'ad' && currentAd && (adType === 'pre' || adType === 'mid') && (
          <div className="ad-overlay">
            <video
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              src={currentAd.video_url}
              autoPlay
              muted
              playsInline
              onEnded={startVideoPlayback}
              onError={startVideoPlayback}
            />
            <div className="ad-top">
              <span style={{ color: 'white' }}>广告 {adTimeLeft}秒</span>
              {adTimeLeft <= 5 && (
                <button onClick={skipAd} className="skip-btn">
                  跳过广告
                </button>
              )}
            </div>
            <div className="ad-title">{currentAd.title}</div>
          </div>
        )}

        {showPauseAd && currentAd && (
          <div className="ad-overlay">
            <video
              style={{ width: '60%', height: '60%', objectFit: 'contain', marginBottom: '1rem' }}
              src={currentAd.video_url}
              autoPlay
              muted
              loop
            />
            <h3 style={{ color: 'white', marginBottom: '1rem' }}>{currentAd.title}</h3>
            <button
              onClick={() => {
                setShowPauseAd(false);
                setCurrentAd(null);
                handlePlayPause();
              }}
              style={{
                padding: '0.5rem 1rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              继续播放
            </button>
          </div>
        )}

        {showVipModal && (
            <div className="vip-modal">
              <div className="vip-content">
                <Crown className="vip-icon" />
                <h2 className="vip-modal-title">VIP专享内容</h2>
                <p className="vip-modal-desc">
                  此视频为VIP专享内容，请开通VIP后观看
                </p>
                <div className="vip-modal-buttons">
                  <button 
                    type="button"
                    onClick={() => setShowVipModal(false)} 
                    className="btn-cancel"
                  >
                    返回
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowVipModal(false);
                      setTimeout(() => {
                        alert('🎉 恭喜！您已成功开通VIP会员！现在可以观看所有VIP内容了。');
                        if (videoRef.current) {
                          videoRef.current.play().catch(() => {});
                        }
                        setPlayerState('playing');
                      }, 100);
                    }}
                    className="btn-vip"
                  >
                    开通VIP
                  </button>
                </div>
              </div>
            </div>
          )}

          <div
            className="player-controls"
            style={{ opacity: showControls ? 1 : 0 }}
          >
            <div className="progress-bar" onClick={handleSeek}>
              <div
                className="progress-buffered"
                style={{ width: `${(buffered / duration) * 100}%` }}
              />
              <div
                className="progress-played"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              <div
                className="progress-handle"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
            </div>

            <div className="controls-row">
              <div className="controls-left">
                <button onClick={handlePlayPause} className="control-btn">
                  {playerState === 'playing' ? <Pause size={24} /> : <Play size={24} />}
                </button>

                {onPrev && (
                  <button onClick={onPrev} className="control-btn">
                    <SkipBack size={20} />
                  </button>
                )}

                {onNext && (
                  <button onClick={onNext} className="control-btn">
                    <SkipForward size={20} />
                  </button>
                )}

                <div className="volume-control">
                  <button onClick={toggleMute} className="control-btn" style={{ padding: 0 }}>
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    style={{
                      width: '0px',
                      transition: 'width 0.3s',
                      opacity: 0
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.width = '80px';
                      e.currentTarget.style.opacity = '1';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.width = '0px';
                      e.currentTarget.style.opacity = '0';
                    }}
                  />
                </div>

                <span className="time-display">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="controls-right">
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => {
                      setShowQualityMenu(!showQualityMenu);
                      setShowSettings(false);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      padding: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  >
                    {currentQuality}
                  </button>
                  {showQualityMenu && (
                    <div className="quality-menu">
                      {qualities.map((q) => (
                        <button
                          key={q.quality}
                          onClick={() => handleQualityChange(q.quality)}
                          className={currentQuality === q.quality ? 'active' : ''}
                        >
                          {q.quality}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => {
                      setShowSettings(!showSettings);
                      setShowQualityMenu(false);
                    }}
                    className="control-btn"
                  >
                    <Settings size={20} />
                  </button>
                  {showSettings && (
                    <div className="settings-menu">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1rem', gap: '1rem' }}>
                        <span style={{ color: 'white', fontSize: '0.875rem' }}>自动连播</span>
                        <button
                          onClick={() => setAutoPlayNext(!autoPlayNext)}
                          style={{
                            width: '2.5rem',
                            height: '1.25rem',
                            borderRadius: '9999px',
                            background: autoPlayNext ? '#ef4444' : '#4b5563',
                            border: 'none',
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                        >
                          <div
                            style={{
                              width: '1rem',
                              height: '1rem',
                              background: 'white',
                              borderRadius: '50%',
                              transition: 'transform 0.2s',
                              transform: autoPlayNext ? 'translateX(0.75rem)' : 'translateX(0)'
                            }}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={toggleFullscreen} className="control-btn">
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
              padding: '1rem',
              opacity: showControls ? 1 : 0,
              transition: 'opacity 0.3s'
            }}
          >
            <h2 style={{ color: 'white', fontSize: '1.125rem', fontWeight: 600 }}>
              {video?.title}
              {video?.is_vip && (
                <span style={{
                  marginLeft: '0.5rem',
                  padding: '0.125rem 0.5rem',
                  background: '#fbbf24',
                  color: 'black',
                  fontSize: '0.75rem',
                  borderRadius: '9999px'
                }}>
                  VIP
                </span>
              )}
            </h2>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoPlayer;
