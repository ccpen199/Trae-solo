import React, { useState } from 'react';
import { Play, Pause, Heart, ThumbsDown, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/usePlayerStore';
import useUIStore from '../store/useUIStore';
import { songsAPI } from '../utils/api';

function SongCard({ song, showCover = true, showRank = false, rank = 0 }) {
  const navigate = useNavigate();
  const { currentSong, isPlaying, playSong } = usePlayerStore();
  const { showToast } = useUIStore();
  const [isLiked, setIsLiked] = useState(false);

  const isCurrentSong = currentSong?.id === song.id;

  const handlePlay = (e) => {
    e.stopPropagation();
    if (isCurrentSong && isPlaying) {
      playSong(song);
    } else {
      playSong(song);
    }
    songsAPI.playSong(song.id, { duration: 0 }).catch(() => {});
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      await songsAPI.likeSong(song.id, { user_id: 1 });
      setIsLiked(!isLiked);
      showToast(isLiked ? '已取消点赞' : '点赞成功', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleDislike = async (e) => {
    e.stopPropagation();
    try {
      await songsAPI.dislikeSong(song.id, { user_id: 1, reason: '' });
      showToast('已标记为不感兴趣', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleClick = () => {
    navigate(`/player/${song.id}`);
  };

  return (
    <div 
      className="card"
      style={{ 
        padding: showCover ? '16px' : '12px 16px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        cursor: 'pointer',
        background: isCurrentSong ? 'rgba(254, 44, 85, 0.1)' : 'rgba(255,255,255,0.05)',
        borderColor: isCurrentSong ? 'rgba(254, 44, 85, 0.3)' : 'rgba(255,255,255,0.1)',
      }}
      onClick={handleClick}
    >
      {showRank > 0 && (
        <div style={{
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          background: rank <= 3 ? 'linear-gradient(135deg, #fe2c55, #ff6b8a)' : 'rgba(255,255,255,0.1)',
          fontWeight: '700',
          fontSize: rank <= 3 ? '16px' : '14px',
        }}>
          {rank}
        </div>
      )}

      {showCover && (
        <div style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden' }}>
          <img
            src={song.cover || `https://picsum.photos/seed/${song.id}/64/64`}
            alt={song.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.3s ease',
            }}
            className="play-overlay"
            onClick={handlePlay}
          >
            {isCurrentSong && isPlaying ? (
              <Pause size={24} style={{ color: '#fff' }} />
            ) : (
              <Play size={24} style={{ color: '#fff' }} />
            )}
          </div>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          fontSize: '15px',
          fontWeight: '600',
          marginBottom: '4px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: isCurrentSong ? '#fe2c55' : '#fff',
        }}>
          {song.title}
        </h4>
        <p style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.6)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {song.artist_name || '未知歌手'}
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
          <span>{Math.floor(song.plays / 10000)}万播放</span>
          {song.complete_rate && <span>完播率 {song.complete_rate}%</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={handlePlay}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: isCurrentSong && isPlaying ? 'linear-gradient(135deg, #fe2c55, #ff6b8a)' : 'rgba(255,255,255,0.1)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          {isCurrentSong && isPlaying ? (
            <Pause size={18} style={{ color: '#fff' }} />
          ) : (
            <Play size={18} style={{ color: '#fff', marginLeft: '2px' }} />
          )}
        </button>

        <button
          onClick={handleLike}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Heart 
            size={18} 
            style={{ 
              color: isLiked ? '#fe2c55' : 'rgba(255,255,255,0.6)',
              fill: isLiked ? '#fe2c55' : 'none',
            }} 
          />
        </button>

        <button
          onClick={handleDislike}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ThumbsDown size={18} style={{ color: 'rgba(255,255,255,0.6)' }} />
        </button>

        <button
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MoreHorizontal size={18} style={{ color: 'rgba(255,255,255,0.6)' }} />
        </button>
      </div>
    </div>
  );
}

export default SongCard;
