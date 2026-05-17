import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useToastStore } from '../store';
import api from '../services/api';

function PlansListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/plans');
      if (res.data.success) {
        setPlans(res.data.data.list || []);
      }
    } catch (error) {
      console.error('Fetch plans error:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPlan = async (planId) => {
    try {
      const res = await api.post(`/plans/${planId}/join`);
      if (res.data.success) {
        showToast('加入成功', 'success');
        fetchPlans();
      }
    } catch (error) {
      console.error('Join plan error:', error);
    }
  };

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorState}>
          <div style={styles.errorIcon}>😔</div>
          <h2 style={styles.errorTitle}>加载失败</h2>
          <p style={styles.errorDesc}>获取冥想计划列表失败，请重试</p>
          <button className="btn btn-primary" onClick={fetchPlans}>
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('/home')}>
          ← 返回
        </button>
        <h1 style={styles.title}>冥想计划</h1>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p style={styles.loadingText}>加载中...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="empty-state">
          <p>暂无冥想计划</p>
        </div>
      ) : (
        <div style={styles.planList}>
          {plans.map((plan) => (
            <div key={plan.id} className="card" style={styles.planCard}>
              <img
                src={plan.cover_image}
                alt={plan.title}
                style={styles.planCover}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400';
                }}
              />
              <div style={styles.planInfo}>
                <div style={styles.planHeader}>
                  <h3 style={styles.planTitle}>{plan.title}</h3>
                  <div style={styles.planMeta}>
                    <span style={styles.duration}>{plan.duration}分钟/次</span>
                    <span style={styles.days}>{plan.total_days}天计划</span>
                  </div>
                </div>
                <p style={styles.planDesc}>{plan.description}</p>
                <div style={styles.planFooter}>
                  <div style={styles.tags}>
                    {plan.is_free ? (
                      <span style={styles.freeTag}>免费</span>
                    ) : (
                      <span style={styles.vipTag}>会员</span>
                    )}
                    <span style={styles.levelTag}>{plan.level === 'beginner' ? '入门' : plan.level === 'intermediate' ? '进阶' : '高级'}</span>
                  </div>
                  {plan.isJoined ? (
                    <button
                      className="btn btn-secondary"
                      style={styles.joinedButton}
                      onClick={() => navigate(`/plans/${plan.id}`)}
                    >
                      继续练习
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={styles.joinButton}
                      onClick={() => handleJoinPlan(plan.id)}
                    >
                      加入计划
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f7fa',
    padding: '20px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '24px'
  },
  backButton: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    color: '#667eea',
    cursor: 'pointer',
    marginRight: '16px',
    fontWeight: 500
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#333'
  },
  loadingText: {
    marginTop: '12px',
    color: '#999',
    fontSize: '14px'
  },
  errorState: {
    textAlign: 'center',
    padding: '60px 20px'
  },
  errorIcon: {
    fontSize: '60px',
    marginBottom: '16px'
  },
  errorTitle: {
    fontSize: '20px',
    color: '#333',
    marginBottom: '8px'
  },
  errorDesc: {
    fontSize: '14px',
    color: '#999',
    marginBottom: '20px'
  },
  planList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  planCard: {
    display: 'flex',
    overflow: 'hidden'
  },
  planCover: {
    width: '140px',
    height: '140px',
    objectFit: 'cover',
    flexShrink: 0
  },
  planInfo: {
    padding: '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  planHeader: {
    marginBottom: '8px'
  },
  planTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '6px'
  },
  planMeta: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
    color: '#999'
  },
  duration: {},
  days: {},
  planDesc: {
    fontSize: '13px',
    color: '#666',
    lineHeight: 1.5,
    marginBottom: 'auto',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  planFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px'
  },
  tags: {
    display: 'flex',
    gap: '8px'
  },
  freeTag: {
    padding: '4px 10px',
    background: '#e8f5e9',
    color: '#4caf50',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 500
  },
  vipTag: {
    padding: '4px 10px',
    background: '#fff3e0',
    color: '#ff9800',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 500
  },
  levelTag: {
    padding: '4px 10px',
    background: '#e3f2fd',
    color: '#2196f3',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 500
  },
  joinButton: {
    padding: '8px 20px',
    fontSize: '14px'
  },
  joinedButton: {
    padding: '8px 20px',
    fontSize: '14px'
  }
};

export default PlansListPage;
