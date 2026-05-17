import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, ChevronLeft, Music, Users, Crown, Flame, Trophy, Medal } from 'lucide-react';
import SongCard from '../components/SongCard';
import Loading from '../components/Loading';
import { rankingsAPI } from '../utils/api';
import useUIStore from '../store/useUIStore';

function Ranking() {
  const navigate = useNavigate();
  const { showToast, setLoading, loadingStates } = useUIStore();
  const [rankingData, setRankingData] = useState([]);
  const [activeType, setActiveType] = useState('plays');

  const rankingTypes = [
    { key: 'plays', label: '播放榜', icon: Music },
    { key: 'complete_rate', label: '完播榜', icon: Flame },
    { key: 'likes', label: '点赞榜', icon: Crown },
    { key: 'coins', label: '投币榜', icon: Trophy },
  ];

  useEffect(() => {
    loadRankingData();
  }, [activeType]);

  const loadRankingData = async () => {
    try {
      setLoading('ranking', true);
      const data = await rankingsAPI.getSongRanking(activeType, 50);
      setRankingData(data?.songs || []);
    } catch (error) {
      showToast(error.message || '加载失败', 'error');
    } finally {
      setLoading('ranking', false);
    }
  };

  if (loadingStates['ranking']) {
    return <Loading text="加载排行榜中..." />;
  }

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
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TrendingUp size={32} style={{ color: '#fe2c55' }} />
            音乐排行榜
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '4px' }}>
            发现最热门的音乐
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {rankingTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.key}
              onClick={() => setActiveType(type.key)}
              style={{
                padding: '12px 24px',
                borderRadius: '24px',
                background: activeType === type.key
                  ? 'linear-gradient(135deg, #fe2c55, #ff6b8a)'
                  : 'rgba(255,255,255,0.05)',
                border: activeType === type.key ? 'none' : '1px solid rgba(255,255,255,0.1)',
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
              <Icon size={18} />
              {type.label}
            </button>
          );
        })}
      </div>

      {rankingData.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginBottom: '32px',
        }}>
          {[0, 1, 2].map((index) => {
            const song = rankingData[index];
            if (!song) return null;

            const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
            const medalLabels = ['冠军', '亚军', '季军'];

            return (
              <Link
                key={song.id}
                to={`/player/${song.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="card"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                  }}
                >
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    marginBottom: '16px',
                    position: 'relative',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  }}>
                    <img
                      src={song.cover || `https://picsum.photos/seed/${song.id}/120/120`}
                      alt={song.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: medalColors[index],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    }}>
                      <Medal size={20} style={{ color: '#fff' }} />
                    </div>
                  </div>

                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    marginBottom: '6px',
                    color: '#fff',
                  }}>
                    {song.title}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.6)',
                    marginBottom: '12px',
                  }}>
                    {song.artist_name}
                  </p>

                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.5)',
                  }}>
                    <span>{Math.floor(song.plays / 10000)}万播放</span>
                    {song.complete_rate && <span>完播率 {song.complete_rate}%</span>}
                  </div>

                  <p style={{
                    marginTop: '12px',
                    fontSize: '12px',
                    color: medalColors[index],
                    fontWeight: '600',
                  }}>
                    {medalLabels[index]}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          <Trophy size={24} style={{ color: '#fe2c55' }} />
          完整榜单
        </h2>
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {rankingData.map((song, index) => {
          if (index < 3) return null;
          return <SongCard key={song.id} song={song} showRank rank={index + 1} />;
        })}
      </div>
    </div>
  );
}

export default Ranking;
