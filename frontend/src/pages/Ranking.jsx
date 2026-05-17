import { useState, useEffect } from 'react';
import { rankingAPI } from '../api';

function Ranking() {
  const [activeTab, setActiveTab] = useState('daily');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, [activeTab]);

  const loadRankings = async () => {
    setLoading(true);
    try {
      let data;
      switch (activeTab) {
        case 'daily':
          data = await rankingAPI.getDaily();
          break;
        case 'weekly':
          data = await rankingAPI.getWeekly();
          break;
        case 'monthly':
          data = await rankingAPI.getMonthly();
          break;
        default:
          data = await rankingAPI.getDaily();
      }
      if (data.success) {
        setRankings(data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (index) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  if (loading && rankings.length === 0) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>;
  }

  return (
    <div>
      <h2>🏆 运动排行榜</h2>

      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        borderBottom: '1px solid #eee',
        paddingBottom: '10px'
      }}>
        {[
          { key: 'daily', label: '今日榜' },
          { key: 'weekly', label: '本周榜' },
          { key: 'monthly', label: '本月榜' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 24px',
              border: 'none',
              background: activeTab === tab.key ? '#00d563' : '#f0f0f0',
              color: activeTab === tab.key ? 'white' : '#333',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === tab.key ? 'bold' : 'normal'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {rankings.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#999'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🏆</div>
          暂无排行数据，快来运动吧！
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {rankings.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '15px 20px',
                borderBottom: index < rankings.length - 1 ? '1px solid #f0f0f0' : 'none',
                background: index < 3 ? 'linear-gradient(90deg, #f8f9fa 0%, #ffffff 100%)' : 'transparent'
              }}
            >
              <div style={{
                width: '50px',
                fontSize: '24px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                {getMedalEmoji(index)}
              </div>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: index < 3 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px',
                marginRight: '15px'
              }}>
                🏃
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>
                  {item.nickname || '运动达人'}
                </h4>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  已运动 {item.total_minutes || 0} 分钟 · {item.workout_count || 0} 次
                </p>
              </div>
              <div style={{
                textAlign: 'right',
                color: '#00d563',
                fontWeight: 'bold',
                fontSize: '18px'
              }}>
                🔥 {item.total_calories || 0} 千卡
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Ranking;
