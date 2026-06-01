import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    announcements: 0,
    leaves: 0,
    feedbacks: 0,
    unread: 0
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [annRes, leaveRes, feedRes] = await Promise.all([
        api.get('/announcements'),
        api.get('/leaves'),
        api.get('/feedbacks')
      ]);

      const unreadCount = annRes.data.filter(a => !a.read_at).length;

      setStats({
        announcements: annRes.data.length,
        leaves: leaveRes.data.length,
        feedbacks: feedRes.data.length,
        unread: unreadCount
      });

      setRecentAnnouncements(annRes.data.slice(0, 5));
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <h1 className="page-title">欢迎回来，{user.name}</h1>
      
      <div className="grid grid-cols-3 mb-4">
        <div className="stat-card">
          <div className="number">{stats.announcements}</div>
          <div className="label">公告通知</div>
          {stats.unread > 0 && <span className="badge badge-danger mt-2">{stats.unread} 未读</span>}
        </div>
        <div className="stat-card">
          <div className="number">{stats.leaves}</div>
          <div className="label">请假记录</div>
        </div>
        <div className="stat-card">
          <div className="number">{stats.feedbacks}</div>
          <div className="label">反馈交流</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title flex flex-between items-center">
          <span>最新公告</span>
          <span style={{ fontSize: '12px', color: '#999' }}>最近5条</span>
        </div>
        {recentAnnouncements.length === 0 ? (
          <p style={{ color: '#999' }}>暂无公告</p>
        ) : (
          recentAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className={`announcement-item ${!ann.read_at ? 'unread' : ''}`}
              onClick={() => navigate('/announcements')}
              style={{ cursor: 'pointer' }}
            >
              <div className="flex flex-between items-center">
                <strong>{ann.title}</strong>
                <div className="flex gap-2">
                  {ann.priority === 'high' && <span className="badge badge-danger">重要</span>}
                  {!ann.read_at && <span className="badge badge-info">未读</span>}
                </div>
              </div>
              <p style={{ marginTop: '8px', color: '#666' }}>{ann.content.substring(0, 100)}...</p>
              <div className="announcement-meta">
                <span>发布人: {ann.author_name}</span>
                <span>发布时间: {new Date(ann.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;
