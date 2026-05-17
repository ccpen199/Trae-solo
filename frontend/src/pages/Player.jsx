import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Share2,
  MoreHorizontal,
  Volume2,
  Repeat,
  Shuffle,
  ChevronDown,
  Music,
  Flame,
  Coins,
} from 'lucide-react';
import usePlayerStore from '../store/usePlayerStore';
import useUIStore from '../store/useUIStore';
import { songsAPI } from '../utils/api';
import Loading from '../components/Loading';

function Player() {
  const { id } = useParams();
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
    isHighMode,
    playSong,
    playPrev,
    playNext,
    togglePlay,
    setVolume,
    toggleMute,
    toggleLoop,
    toggleShuffle,
    toggleHighMode,
  } = usePlayerStore();
  const { showToast, setLoading, loadingStates } = useUIStore();
  const [songDetail, setSongDetail] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState('lyrics');

  useEffect(() => {
    if (id) {
      loadSongDetail();
    }
  }, [id]);

  const loadSongDetail = async () => {
    try {
      setLoading('songDetail', true);
      const data = await songsAPI.getSongDetail(id);
      setSongDetail(data);
      if (!currentSong || currentSong.id !== parseInt(id)) {
        playSong(data);
      }
    } catch (error) {
      showToast(error.message || '加载失败', 'error');
    } finally {
      setLoading('songDetail', false);
    }
  };

  const handleLike = async () => {
    try {
      await songsAPI.likeSong(id, { user_id: 1 });
      setIsLiked(!isLiked);
      showToast(isLiked ? '已取消点赞' : '点赞成功', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleCoin = async () => {
    try {
      await songsAPI.coinSong(id, { user_id: 1, amount: 1 });
      showToast('投币成功！', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  if (loadingStates['songDetail'] || !songDetail) {
    return <Loading text="加载歌曲中..." />;
  }

  const song = songDetail || currentSong;
  if (!song) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const parseLyrics = (lyricsText) => {
    if (!lyricsText) return [];
    const lines = lyricsText.split('\n');
    return lines.filter(line => line.trim()).map((line, index) => ({
      time: index * 5,
      text: line.replace(/\[\d{2}:\d{2}\.\d{2}\]/g, '').trim(),
    }));
  };

  const lyrics = parseLyrics(song.lyrics);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, rgba(26,26,46,0.95) 0%, rgba(15,15,35,0.98) 100%)',
    }}>
      <div style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: '8px',
          }}
        >
          <ChevronDown size={28} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>正在播放</h3>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>来自 {song.artist_name || '未知歌手'}</p>
        </div>
        <button
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: '8px',
          }}
        >
          <MoreHorizontal size={24} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
        <div style={{
          width: '300px',
          height: '300px',
          borderRadius: '20px',
          overflow: 'hidden',
          marginBottom: '40px',
          boxShadow: '0 20px 60px rgba(254,44,85,0.3)',
          animation: isPlaying ? 'float 4s ease-in-out infinite' : 'none',
        }}>
          <img
            src={song.cover || `https://picsum.photos/seed/${song.id}/300/300`}
            alt={song.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>
            {song.title}
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)' }}>
            {song.artist_name || '未知歌手'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
          <button
            onClick={handleLike}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              color: isLiked ? '#fe2c55' : 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
            }}
          >
            <Heart size={24} fill={isLiked ? '#fe2c55' : 'none'} />
            <span style={{ fontSize: '12px' }}>{(song.likes || 0).toLocaleString()}</span>
          </button>
          <button
            onClick={handleCoin}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
            }}
          >
            <Coins size={24} />
            <span style={{ fontSize: '12px' }}>{(song.coins || 0).toLocaleString()}</span>
          </button>
          <button
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
            }}
          >
            <Share2 size={24} />
            <span style={{ fontSize: '12px' }}>分享</span>
          </button>
        </div>

        <div style={{ width: '100%', maxWidth: '400px', marginBottom: '16px' }}>
          <div
            style={{
              height: '6px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '3px',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #fe2c55, #ff6b8a)',
              borderRadius: '3px',
              width: `${progress}%`,
              transition: 'width 0.1s ease',
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.5)',
          }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '32px' }}>
          <button
            onClick={toggleShuffle}
            style={{
              background: 'transparent',
              border: 'none',
              color: isShuffle ? '#fe2c55' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            <Shuffle size={20} />
          </button>
          <button
            onClick={playPrev}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            <SkipBack size={32} />
          </button>
          <button
            onClick={togglePlay}
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #fe2c55, #ff6b8a)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 10px 30px rgba(254,44,85,0.4)',
            }}
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} style={{ marginLeft: '4px' }} />}
          </button>
          <button
            onClick={playNext}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            <SkipForward size={32} />
          </button>
          <button
            onClick={toggleLoop}
            style={{
              background: 'transparent',
              border: 'none',
              color: isLooping ? '#fe2c55' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            <Repeat size={20} />
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 20px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '24px',
        }}>
          <Volume2 size={18} style={{ color: 'rgba(255,255,255,0.6)' }} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{
              width: '120px',
              height: '4px',
              WebkitAppearance: 'none',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
          />
        </div>

        <button
          onClick={toggleHighMode}
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            borderRadius: '24px',
            background: isHighMode
              ? 'linear-gradient(135deg, #fe2c55, #ff6b8a)'
              : 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease',
          }}
        >
          <Flame size={20} style={{ color: isHighMode ? '#fff' : '#fe2c55' }} />
          {isHighMode ? '嗨歌模式已开启' : '开启嗨歌模式'}
        </button>
      </div>

      <div style={{
        padding: '24px',
        background: 'rgba(0,0,0,0.3)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ display: 'flex', gap: '24px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {['lyrics', 'similar', 'comments'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 0',
                background: 'transparent',
                border: 'none',
                color: activeTab === tab ? '#fe2c55' : 'rgba(255,255,255,0.6)',
                fontSize: '14px',
                fontWeight: activeTab === tab ? '600' : '400',
                cursor: 'pointer',
                borderBottom: activeTab === tab ? '2px solid #fe2c55' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {tab === 'lyrics' ? '歌词' : tab === 'similar' ? '相似歌曲' : '评论'}
            </button>
          ))}
        </div>

        {activeTab === 'lyrics' && (
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.6)',
            lineHeight: '2.5',
          }}>
            {lyrics.length > 0 ? (
              lyrics.map((line, index) => (
                <p
                  key={index}
                  style={{
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    color: Math.abs(currentTime - line.time) < 3 ? '#fff' : undefined,
                    fontWeight: Math.abs(currentTime - line.time) < 3 ? '600' : '400',
                  }}
                >
                  {line.text}
                </p>
              ))
            ) : (
              <p>暂无歌词</p>
            )}
          </div>
        )}

        {activeTab === 'similar' && (
          <div style={{ display: 'grid', gap: '12px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={`https://picsum.photos/seed/similar${i}/48/48`}
                  alt="song"
                  style={{ width: '48px', height: '48px', borderRadius: '8px' }}
                />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>相似歌曲 {i}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>歌手名</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'comments' && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '20px' }}>
            <p>暂无评论，快来发表第一条评论吧</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          background: #fe2c55;
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

export default Player;
