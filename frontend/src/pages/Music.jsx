import { useState, useEffect } from 'react';
import { musicAPI } from '../api';
import useStore from '../store';

function Music() {
  const { user } = useStore();
  const [categories, setCategories] = useState([]);
  const [musicList, setMusicList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catData, musicData] = await Promise.all([
        musicAPI.getCategories(),
        musicAPI.getLibrary(null, 1, 50)
      ]);
      if (catData.success) setCategories(catData.data || []);
      if (musicData.success) setMusicList(musicData.data?.list || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPlaylists();
    }
  }, [user]);

  const loadPlaylists = async () => {
    try {
      const data = await musicAPI.getPlaylists();
      if (data.success) setPlaylists(data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCategoryClick = async (category) => {
    setSelectedCategory(category?.name || null);
    try {
      const data = await musicAPI.getLibrary(category?.name || null, 1, 50);
      if (data.success) setMusicList(data.data?.list || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName) {
      alert('请输入歌单名称');
      return;
    }
    try {
      await musicAPI.createPlaylist(newPlaylistName);
      alert('歌单创建成功');
      setNewPlaylistName('');
      setShowPlaylistModal(false);
      loadPlaylists();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading && musicList.length === 0) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>;
  }

  return (
    <div>
      <h2>🎵 运动音乐</h2>

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>音乐分类</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleCategoryClick(null)}
            style={{
              padding: '10px 20px',
              background: !selectedCategory ? '#00d563' : '#f0f0f0',
              color: !selectedCategory ? 'white' : '#333',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer'
            }}
          >
            全部
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat)}
              style={{
                padding: '10px 20px',
                background: selectedCategory === cat.name ? '#00d563' : '#f0f0f0',
                color: selectedCategory === cat.name ? 'white' : '#333',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer'
              }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3>推荐音乐</h3>
        {user && (
          <button
            onClick={() => setShowPlaylistModal(true)}
            style={{
              padding: '8px 16px',
              background: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            + 创建歌单
          </button>
        )}
      </div>

      {musicList.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#999'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎵</div>
          暂无音乐
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '15px'
        }}>
          {musicList.map(music => (
            <div key={music.id} style={{
              background: 'white',
              padding: '15px',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px'
              }}>
                🎵
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 5px 0' }}>{music.title}</h4>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  {music.artist} · {Math.floor(music.duration / 60)}:{String(music.duration % 60).padStart(2, '0')}
                </p>
                <p style={{ margin: '5px 0 0 0', color: '#999', fontSize: '12px' }}>
                  {music.category}
                </p>
              </div>
              <button style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                background: '#00d563',
                color: 'white',
                cursor: 'pointer',
                fontSize: '18px'
              }}>
                ▶
              </button>
            </div>
          ))}
        </div>
      )}

      {user && playlists.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h3>我的歌单</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            {playlists.map(playlist => (
              <div key={playlist.id} style={{
                background: 'white',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 10px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '30px'
                }}>
                  📁
                </div>
                <h4 style={{ margin: 0 }}>{playlist.name}</h4>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPlaylistModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>创建歌单</h3>
            <div style={{ marginBottom: '20px' }}>
              <label>歌单名称</label>
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginTop: '8px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  boxSizing: 'border-box'
                }}
                placeholder="请输入歌单名称"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowPlaylistModal(false)}
                style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}
              >
                取消
              </button>
              <button
                onClick={handleCreatePlaylist}
                style={{ flex: 1, padding: '12px', background: '#00d563', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Music;
