import React, { useState, useEffect } from 'react';
import request from '../utils/request';
import Loading from '../components/Loading';

const GameCenter = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const res = await request.get('/game/list');
      setGames(res.data?.list || getMockGames());
    } catch (error) {
      setGames(getMockGames());
    } finally {
      setLoading(false);
    }
  };

  const getMockGames = () => {
    const games = [];
    const names = [
      '原神', '崩坏：星穹铁道', '明日方舟', '和平精英',
      '王者荣耀', '阴阳师', '碧蓝航线', '第五人格',
      '崩坏3', '公主连结', 'FGO', '光遇'
    ];
    const categories = ['RPG', 'RPG', '策略', '射击', 'MOBA', 'RPG', '策略', '生存', '动作', 'RPG', 'RPG', '休闲'];
    
    for (let i = 0; i < 12; i++) {
      games.push({
        id: i + 1,
        name: names[i],
        icon: `https://picsum.photos/100/100?random=${i + 300}`,
        description: `这是${names[i]}的精彩介绍，快来体验吧！`,
        category: categories[i],
        is_hot: i < 4,
        is_new: i >= 4 && i < 7,
        downloadCount: Math.floor(Math.random() * 10000000)
      });
    }
    return games;
  };

  const formatCount = (num) => {
    if (num >= 10000000) {
      return (num / 10000000).toFixed(1) + '千万';
    }
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toString();
  };

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>🎮 游戏中心</h1>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {['all', 'RPG', '策略', '射击', 'MOBA', '动作', '休闲'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: activeCategory === cat ? 'var(--primary-color)' : 'white',
                color: activeCategory === cat ? 'white' : 'var(--text-primary)',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {cat === 'all' ? '全部' : cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>🔥 热门推荐</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {games.filter(g => g.is_hot).map(game => (
                <div key={game.id} className="card" style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: 'var(--bg-secondary)'
                }}>
                  <img
                    src={game.icon}
                    alt={game.name}
                    style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{game.name}</h3>
                      <span style={{
                        backgroundColor: '#ff4d4f',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        热门
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {game.category} · {formatCount(game.downloadCount)} 下载
                    </p>
                    <button className="btn btn-primary" style={{ padding: '6px 20px', fontSize: '14px' }}>
                      下载
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>📱 全部游戏</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '16px'
          }}>
            {games.map(game => (
              <div key={game.id} className="card" style={{ padding: '16px', textAlign: 'center' }}>
                <img
                  src={game.icon}
                  alt={game.name}
                  style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover', marginBottom: '12px' }}
                />
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{game.name}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {game.category}
                </p>
                <button className="btn btn-outline" style={{ width: '100%', padding: '6px', fontSize: '12px' }}>
                  下载
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default GameCenter;
