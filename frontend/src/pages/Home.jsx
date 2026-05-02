import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameApi, authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

function Home() {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authApi.getProfile();
      updateUser(response.data);
    } catch (err) {
      console.error('获取用户信息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const claimDailyReward = async () => {
    try {
      const response = await gameApi.claimDailyReward();
      updateUser(response.data.user);
      showToast(`领取成功！获得 ${response.data.reward.coins} 金币、${response.data.reward.exp} 经验和 ${response.data.reward.item} x${response.data.reward.item_count}`, 'success');
    } catch (err) {
      showToast(err.response?.data?.error || '领取失败', 'error');
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  const expNeeded = user.level * 100;
  const expProgress = Math.min((user.exp / expNeeded) * 100, 100);

  return (
    <div className="container" style={{ paddingTop: '24px' }}>
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card">
          <h3 className="card-title">👋 欢迎回来，{user.nickname || user.username}</h3>
          
          <div className="stats-card">
            <div className="stat-card">
              <div className="stat-card-value">{user.coins}</div>
              <div className="stat-card-label">💰 金币</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{user.level}</div>
              <div className="stat-card-label">⭐ 等级</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{user.exp}</div>
              <div className="stat-card-label">📊 经验</div>
            </div>
          </div>

          <div className="level-progress">
            <div className="level-info">
              <span>等级 {user.level}</span>
              <span>{user.exp} / {expNeeded} EXP</span>
            </div>
            <div className="level-bar">
              <div className="level-fill" style={{ width: `${expProgress}%` }}></div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">⚡ 快捷操作</h3>
          
          <div className="quick-actions">
            <div className="action-btn" onClick={claimDailyReward}>
              <span className="action-icon">🎁</span>
              <span className="action-label">领取每日奖励</span>
            </div>
            <div className="action-btn" onClick={() => navigate('/inventory')}>
              <span className="action-icon">📦</span>
              <span className="action-label">查看背包</span>
            </div>
            <div className="action-btn" onClick={() => navigate('/recipes')}>
              <span className="action-icon">📜</span>
              <span className="action-label">合成配方</span>
            </div>
            <div className="action-btn">
              <span className="action-icon">🏆</span>
              <span className="action-label">成就系统</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h3 className="card-title">📖 游戏指南</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <div style={{ padding: '20px', background: '#f7fafc', borderRadius: '12px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>1️⃣</div>
            <h4 style={{ marginBottom: '8px', color: '#2d3748' }}>收集材料</h4>
            <p style={{ color: '#718096', fontSize: '0.875rem', lineHeight: '1.6' }}>
              通过每日奖励获得基础材料，包括木柴、石头、水、泥土和种子等。
            </p>
          </div>
          <div style={{ padding: '20px', background: '#f7fafc', borderRadius: '12px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>2️⃣</div>
            <h4 style={{ marginBottom: '8px', color: '#2d3748' }}>合成物品</h4>
            <p style={{ color: '#718096', fontSize: '0.875rem', lineHeight: '1.6' }}>
              查看配方列表，按照配方收集材料，合成更高级的物品，获得经验和金币。
            </p>
          </div>
          <div style={{ padding: '20px', background: '#f7fafc', borderRadius: '12px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>3️⃣</div>
            <h4 style={{ marginBottom: '8px', color: '#2d3748' }}>升级解锁</h4>
            <p style={{ color: '#718096', fontSize: '0.875rem', lineHeight: '1.6' }}>
              积累经验升级，解锁更多高级配方，建造更豪华的建筑！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
