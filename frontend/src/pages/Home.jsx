import React, { useState, useEffect } from 'react';

function Home() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:47791/api/songs?limit=6');
      const result = await response.json();
      if (result.success) {
        setSongs(result.data.songs || []);
      } else {
        setError('加载失败');
      }
    } catch (err) {
      console.error('API错误:', err);
      setError('网络连接失败，请确保后端服务已启动');
    } finally {
      setLoading(false);
    }
  };

  const playSong = (song) => {
    const audio = new Audio(song.audio_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    audio.play().catch(e => console.log('播放:', e));
    alert(`正在播放: ${song.title} - ${song.artist_name || '未知歌手'}`);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>🎵 加载中...</div>
        <p>正在连接后端API (http://localhost:47791)</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#fff', marginBottom: '8px', fontSize: '28px' }}>发现音乐</h1>
      <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px' }}>
        为你推荐每日精选好歌
        {error && <span style={{ color: '#f87171', marginLeft: '12px' }}>({error})</span>}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {songs.map((song, index) => (
          <div
            key={song.id}
            style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => playSong(song)}
          >
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <img
                src={song.cover || `https://picsum.photos/seed/${song.id}/200/200`}
                alt={song.title}
                style={{ width: '100%', aspectRatio: '1', borderRadius: '12px', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fe2c55, #ff6b8a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '18px',
                  boxShadow: '0 4px 12px rgba(254,44,85,0.4)',
                }}
              >
                ▶
              </div>
            </div>
            <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '4px', fontWeight: '600' }}>
              {song.title}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
              {song.artist_name || '未知歌手'}
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              <span>👁 {(song.plays || 0).toLocaleString()} 播放</span>
              <span>❤️ {song.likes || 0} 喜欢</span>
            </div>
          </div>
        ))}
      </div>

      {songs.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎶</div>
          <p>暂无歌曲数据</p>
        </div>
      )}
    </div>
  );
}

export default Home;
