import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, ChevronLeft, Heart, Share2, Clock, Music, User } from 'lucide-react';
import SongCard from '../components/SongCard';
import Loading from '../components/Loading';
import usePlayerStore from '../store/usePlayerStore';
import useUIStore from '../store/useUIStore';
import { playlistsAPI } from '../utils/api';

function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setPlaylist, setPlaying } = usePlayerStore();
  const { showToast, setLoading, loadingStates } = useUIStore();
  const [playlist, setPlaylistData] = useState(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (id) {
      loadPlaylistDetail();
    }
  }, [id]);

  const loadPlaylistDetail = async () => {
    try {
      setLoading('playlistDetail', true);
      const data = await playlistsAPI.getPlaylistDetail(id);
      setPlaylistData(data);
    } catch (error) {
      showToast(error.message || '加载失败', 'error');
    } finally {
      setLoading('playlistDetail', false);
    }
  };

  const handlePlayAll = () => {
    if (playlist?.songs?.length > 0) {
      setPlaylist(playlist.songs, 0);
      setPlaying(true);
      showToast('开始播放', 'success');
    }
  };

  if (loadingStates['playlistDetail'] || !playlist) {
    return <Loading text="加载歌单中..." />;
  }

  const totalDuration = playlist.songs?.reduce((sum, song) => sum + (song.duration || 0), 0) || 0;
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
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
          <ChevronLeft size={28} />
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: '800' }}>歌单详情</h1>
      </div>

      <div style={{
        display: 'flex',
        gap: '40px',
        marginBottom: '40px',
        alignItems: 'flex-start',
      }}>
        <div style={{
          width: '280px',
          height: '280px',
          borderRadius: '20px',
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
          <img
            src={playlist.cover || `https://picsum.photos/seed/playlist${playlist.id}/280/280`}
            alt={playlist.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '800',
            marginBottom: '12px',
          }}>
            {playlist.title}
          </h2>

          <p style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '20px',
            lineHeight: '1.6',
          }}>
            {playlist.description || '暂无描述'}
          </p>

          <div style={{
            display: 'flex',
            gap: '24px',
            marginBottom: '24px',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.5)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Music size={16} />
              {playlist.song_count || playlist.songs?.length || 0} 首歌曲
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} />
              {formatDuration(totalDuration)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={16} />
              {Math.floor(playlist.plays / 10000) || 0}万播放
            </span>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button
              onClick={handlePlayAll}
              className="btn btn-primary"
              style={{
                padding: '14px 40px',
                fontSize: '16px',
                borderRadius: '30px',
              }}
            >
              <Play size={20} />
              播放全部
            </button>

            <button
              onClick={() => setIsLiked(!isLiked)}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: isLiked ? '#fe2c55' : '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <Heart size={22} fill={isLiked ? '#fe2c55' : 'none'} />
            </button>

            <button
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Share2 size={22} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          <Music size={24} style={{ color: '#fe2c55' }} />
          歌曲列表
        </h2>
      </div>

      {playlist.songs?.length > 0 ? (
        <div style={{ display: 'grid', gap: '12px' }}>
          {playlist.songs.map((song, index) => (
            <SongCard key={song.id} song={song} showRank rank={index + 1} />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          color: 'rgba(255,255,255,0.5)',
        }}>
          <Music size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p>歌单中暂无歌曲</p>
        </div>
      )}
    </div>
  );
}

export default PlaylistDetail;
