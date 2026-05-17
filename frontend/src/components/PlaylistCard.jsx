import React from 'react';
import { Play, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/usePlayerStore';

function PlaylistCard({ playlist }) {
  const navigate = useNavigate();
  const { setPlaylist, setPlaying } = usePlayerStore();

  const handlePlay = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(`http://localhost:47791/api/playlists/${playlist.id}`);
      const data = await response.json();
      if (data.success && data.data.songs?.length > 0) {
        setPlaylist(data.data.songs, 0);
        setPlaying(true);
      }
    } catch (error) {
      console.error('获取歌单失败:', error);
    }
  };

  const handleClick = () => {
    navigate(`/playlist/${playlist.id}`);
  };

  return (
    <div 
      className="card"
      style={{ 
        padding: '12px',
        cursor: 'pointer',
        width: '100%',
        maxWidth: '200px',
      }}
      onClick={handleClick}
    >
      <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
        <img
          src={playlist.cover || `https://picsum.photos/seed/playlist${playlist.id}/200/200`}
          alt={playlist.title}
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transition: 'opacity 0.3s ease',
          transform: 'scale(0.9)',
        }} className="play-btn">
          <Play size={18} style={{ color: '#fff', marginLeft: '2px' }} />
        </div>
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          padding: '4px 8px',
          background: 'rgba(0,0,0,0.6)',
          borderRadius: '12px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <Music size={12} />
          <span>{playlist.song_count || 0}</span>
        </div>
      </div>

      <h4 style={{
        fontSize: '14px',
        fontWeight: '600',
        marginBottom: '6px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {playlist.title}
      </h4>

      {playlist.description && (
        <p style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.5)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: '1.4',
        }}>
          {playlist.description}
        </p>
      )}

      <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
        {Math.floor((playlist.plays || 0) / 10000)}万播放
      </div>

      <button
        onClick={handlePlay}
        className="btn btn-primary"
        style={{ width: '100%', marginTop: '12px', padding: '10px', justifyContent: 'center', fontSize: '13px' }}
      >
        <Play size={16} />
        播放全部
      </button>
    </div>
  );
}

export default PlaylistCard;
