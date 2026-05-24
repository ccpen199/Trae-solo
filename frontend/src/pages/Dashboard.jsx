import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';

const getStatusBadge = (status) => {
  const statusMap = {
    recruiting: { text: '招募中', className: 'info' },
    confirmed: { text: '已成局', className: 'success' },
    completed: { text: '已完成', className: 'success' },
    cancelled: { text: '已取消', className: 'danger' }
  };
  const s = statusMap[status] || { text: status, className: '' };
  return <span className={`badge ${s.className}`}>{s.text}</span>;
};

function Dashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [myGames, setMyGames] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      if (['admin', 'operator', 'customer_service'].includes(user.role)) {
        const res = await api.get('/reports/overview');
        setStats(res.data);
      }
      const gamesRes = await api.get('/games/my');
      setMyGames(gamesRes.data.slice(0, 5));
      const notifRes = await api.get('/notifications/my', { params: { read: false } });
      setNotifications(notifRes.data.slice(0, 5));
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const isStaff = ['admin', 'operator', 'customer_service'].includes(user.role);
  const canCreate = ['user', 'organizer', 'venue_manager'].includes(user.role);
  const registeredCount = myGames.filter(g => ['recruiting', 'confirmed'].includes(g.status) && g.member_status === 'registered').length;
  const completedCount = myGames.filter(g => g.status === 'completed').length;
  const organizedCount = myGames.filter(g => g.member_role === 'organizer').length;

  const UserDashboard = () => (
    <div>
      <div className="grid">
        <div className="stat-card">
          <div className="stat-value">{myGames.length}</div>
          <div className="stat-label">参与球局</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-value">{registeredCount}</div>
          <div className="stat-label">进行中</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">{organizedCount}</div>
          <div className="stat-label">我发起的</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-value">{completedCount}</div>
          <div className="stat-label">已完成</div>
        </div>
      </div>
      <div className="grid" style={{ marginTop: '15px' }}>
        <div className="stat-card green">
          <div className="stat-value">Lv.{user.level}</div>
          <div className="stat-label">当前等级</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-value">{user.credit_score}</div>
          <div className="stat-label">信用分</div>
        </div>
      </div>
      {canCreate && (
        <div style={{ marginTop: '20px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/create-game')}>
            + 发起约球
          </button>
        </div>
      )}
    </div>
  );

  const AdminDashboard = () => (
    <div>
      <div className="grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.total_users || 0}</div>
          <div className="stat-label">用户总数</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-value">{stats?.total_games || 0}</div>
          <div className="stat-label">球局总数</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">{stats?.active_games || 0}</div>
          <div className="stat-label">进行中</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-value">{stats?.completed_games || 0}</div>
          <div className="stat-label">已完成</div>
        </div>
      </div>
      <div className="grid" style={{ marginTop: '15px' }}>
        <div className="stat-card">
          <div className="stat-value">{stats?.total_venues || 0}</div>
          <div className="stat-label">场馆数量</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-value">¥{stats?.deposit_revenue?.toFixed(2) || '0.00'}</div>
          <div className="stat-label">订金收入</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">¥{stats?.fee_revenue?.toFixed(2) || '0.00'}</div>
          <div className="stat-label">结算收入</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-value">¥{stats?.total_revenue?.toFixed(2) || '0.00'}</div>
          <div className="stat-label">平台总营收</div>
        </div>
      </div>
      {stats?.pending_exceptions > 0 && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#fed7d7', borderRadius: '8px' }}>
          <strong>⚠️ 待处理异常：{stats.pending_exceptions} 条</strong>
          <button className="btn btn-danger" style={{ marginLeft: '15px' }} onClick={() => navigate('/exceptions')}>
            立即处理
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {isStaff ? <AdminDashboard /> : <UserDashboard />}
      
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>最近球局</h3>
        {myGames.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
            <p>暂无球局记录</p>
            {canCreate && (
              <button className="btn btn-primary" style={{ marginTop: '15px' }} onClick={() => navigate('/create-game')}>
                + 发起第一个球局
              </button>
            )}
          </div>
        ) : (
          myGames.map(game => (
            <div key={game.id} className="game-item" onClick={() => navigate(`/games/${game.id}`)} style={{ cursor: 'pointer' }}>
              <div className="game-header">
                <span className="game-title">{game.title}</span>
                <div>
                  {game.member_role === 'organizer' && <span className="badge warning" style={{ marginRight: '8px' }}>我发起的</span>}
                  {getStatusBadge(game.status)}
                </div>
              </div>
              <div className="game-meta">
                📍 {game.venue_name} - {game.court_name} | 🕐 {game.date} {game.start_time}-{game.end_time}
              </div>
              <div className="game-meta">
                👥 {game.member_count}/{game.max_players} 人 | 💰 订金 ¥{game.deposit_amount}
              </div>
            </div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="card">
          <h3>未读通知</h3>
          {notifications.map(n => (
            <div key={n.id} className="log-item">
              <span className="log-time">{n.created_at}</span>
              <strong>{n.title}</strong> - {n.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
