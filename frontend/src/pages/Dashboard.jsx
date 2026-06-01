import { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setError(null);
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (err) {
      console.error('加载统计数据失败:', err);
      setError(err.response?.data?.error || err.message || '数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: '客户数量', value: stats?.clients || 0, color: '#3498db', icon: '👥' },
    { label: '职位数量', value: stats?.positions || 0, color: '#2ecc71', icon: '💼' },
    { label: '候选人数量', value: stats?.candidates || 0, color: '#e74c3c', icon: '📋' },
    { label: '推荐数量', value: stats?.recommendations || 0, color: '#f39c12', icon: '📨' },
  ];

  return (
    <div style={{ padding: '20px' }}>
      {loading && <div>加载中...</div>}
      {error && <div style={{ color: '#e74c3c', padding: '20px', background: '#fee' }}>错误: {error}</div>}
      <h1 style={{ margin: '0 0 30px 0', fontSize: '28px', color: '#2c3e50' }}>仪表板</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        {statCards.map((card, index) => (
          <div key={index} style={{
            background: 'white',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>{card.icon}</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: card.color, marginBottom: '8px' }}>
              {card.value}
            </div>
            <div style={{ color: '#7f8c8d', fontSize: '14px' }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#2c3e50' }}>顾问推荐统计</h2>
        {stats?.consultantStats?.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #ecf0f1', color: '#7f8c8d' }}>顾问</th>
                <th style={{ textAlign: 'center', padding: '12px', borderBottom: '2px solid #ecf0f1', color: '#7f8c8d' }}>推荐数量</th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #ecf0f1', color: '#7f8c8d' }}>进度</th>
              </tr>
            </thead>
            <tbody>
              {stats.consultantStats.map((consultant, index) => {
                const maxCount = Math.max(...stats.consultantStats.map(c => c.recommendation_count));
                const percentage = maxCount > 0 ? (consultant.recommendation_count / maxCount) * 100 : 0;
                return (
                  <tr key={index}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ecf0f1' }}>{consultant.name}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ecf0f1', textAlign: 'center' }}>
                      {consultant.recommendation_count}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ecf0f1' }}>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        background: '#ecf0f1',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: '#3498db',
                          borderRadius: '4px'
                        }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
            暂无数据
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
