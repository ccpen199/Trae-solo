import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { liveAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function LiveList() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');
  const [stats, setStats] = useState({ live: 0, upcoming: 0, ended: 0 });

  useEffect(() => {
    loadRooms();
    loadStats();
  }, [activeTab]);

  const loadStats = async () => {
    try {
      const [liveRes, upcomingRes, endedRes] = await Promise.all([
        liveAPI.getRooms({ status: 'live', limit: 1 }),
        liveAPI.getRooms({ status: 'upcoming', limit: 1 }),
        liveAPI.getRooms({ status: 'ended', limit: 1 }),
      ]);
      setStats({
        live: liveRes.data.total || 0,
        upcoming: upcomingRes.data.total || 0,
        ended: endedRes.data.total || 0,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadRooms = async () => {
    try {
      setLoading(true);
      const res = await liveAPI.getRooms({ status: activeTab, limit: 50 });
      setRooms(res.data.rooms);
    } catch (err) {
      console.error('Failed to load live rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📺 直播招聘</h1>
        {user?.role === 'hr' && (
          <button className="btn btn-primary" onClick={() => alert('请联系管理员开通直播权限')}>
            + 创建直播间
          </button>
        )}
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        borderBottom: '1px solid var(--border-color)',
      }}>
        {[
          { key: 'live', label: '🔴 正在直播', count: stats.live, color: 'var(--danger-color)' },
          { key: 'upcoming', label: '⏰ 即将开始', count: stats.upcoming, color: 'var(--accent-color)' },
          { key: 'ended', label: '✅ 已结束', count: stats.ended, color: 'var(--text-muted)' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 20px',
              fontWeight: 500,
              color: activeTab === tab.key ? tab.color : 'var(--text-secondary)',
              borderBottom: activeTab === tab.key ? `2px solid ${tab.color}` : '2px solid transparent',
              marginBottom: -1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {tab.label}
            <span style={{
              background: activeTab === tab.key ? `${tab.color}20` : 'var(--bg-secondary)',
              color: activeTab === tab.key ? tab.color : 'var(--text-secondary)',
              padding: '2px 8px',
              borderRadius: 10,
              fontSize: 12,
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'upcoming' && rooms.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 24, background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.05) 100%)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>🔔</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>开播提醒</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                共 {stats.upcoming} 场直播即将开始，点击进入预约提醒
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'live' && rooms.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 24, background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>直播中功能</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                支持弹幕提问、在线投递简历、虚拟展位导航，与 HR 实时互动
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading" style={{ padding: 60, textAlign: 'center' }}>加载中...</div>
      ) : rooms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📺</div>
          <p>暂无{activeTab === 'live' ? '正在直播' : activeTab === 'upcoming' ? '即将开始' : '已结束'}的直播间</p>
        </div>
      ) : (
        <div className="grid-3">
          {rooms.map(room => (
            <Link key={room.id} to={`/live/${room.id}`} className="card card-hover" style={{ display: 'block', overflow: 'hidden' }}>
              <div style={{
                height: 180,
                background: room.status === 'live'
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : room.status === 'upcoming'
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                color: 'white',
              }}>
                <span style={{ fontSize: 48 }}>📺</span>
                {room.status === 'live' && (
                  <span style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: 'rgba(220, 38, 38, 0.9)',
                    padding: '4px 10px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    🔴 直播中
                  </span>
                )}
                {room.status === 'live' && (
                  <span style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: 'rgba(0,0,0,0.5)',
                    padding: '4px 10px',
                    borderRadius: 4,
                    fontSize: 12,
                  }}>
                    👁️ {room.viewer_count}
                  </span>
                )}
                {room.cover_image && (
                  <img src={room.cover_image} alt="" style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }} />
                )}
              </div>
              <div style={{ padding: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, lineHeight: 1.4, minHeight: 44 }}>{room.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div className="avatar avatar-sm">
                    {room.hr_name?.charAt(0).toUpperCase() || 'H'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{room.company_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>主播: {room.hr_name}</div>
                  </div>
                </div>

                {room.status === 'live' && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span className="tag tag-sm tag-danger">🔴 直播中</span>
                    <span className="tag tag-sm tag-success">👥 {room.viewer_count}</span>
                    <span className="tag tag-sm">💬 弹幕</span>
                    <span className="tag tag-sm">� 投递</span>
                  </div>
                )}
                {room.status === 'upcoming' && room.start_time && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: 'var(--accent-color)', fontWeight: 500 }}>
                      ⏰ {room.start_time.replace('T', ' ').substring(0, 16)}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className="tag tag-sm tag-warning">即将开始</span>
                      <span className="tag tag-sm">🔔 预约提醒</span>
                    </div>
                  </div>
                )}
                {room.status === 'ended' && room.end_time && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span className="tag tag-sm">👁️ {room.viewer_count} 人看过</span>
                    <span className="tag tag-sm">📼 可回看</span>
                  </div>
                )}

                <div className="divider" style={{ margin: '12px 0' }} />

                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                  🎯 本场招聘: {room.job_count || 3} 个职位
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to={`/live/${room.id}`} className="btn btn-sm btn-primary" style={{ flex: 1, textAlign: 'center' }}>
                    {room.status === 'live' ? '立即观看' : room.status === 'upcoming' ? '预约观看' : '查看回放'}
                  </Link>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Link to={`/jobs?keyword=${encodeURIComponent(room.company_name)}`} className="btn btn-sm btn-outline" title="查看该公司职位">
                      💼
                    </Link>
                    <Link to={`/communities?type=company&keyword=${encodeURIComponent(room.company_name)}`} className="btn btn-sm btn-outline" title="公司社群">
                      🏘️
                    </Link>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default LiveList;
