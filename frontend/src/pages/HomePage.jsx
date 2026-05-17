import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useToastStore } from '../store';
import api from '../services/api';

function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();
  const [myPlans, setMyPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyPlans();
  }, []);

  const fetchMyPlans = async () => {
    try {
      const res = await api.get('/plans/user/my');
      if (res.data.success) {
        setMyPlans(res.data.data || []);
      }
    } catch (error) {
      console.error('Fetch my plans error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPlan = async (planId) => {
    try {
      const res = await api.post(`/plans/${planId}/join`);
      if (res.data.success) {
        showToast('加入成功', 'success');
        fetchMyPlans();
      }
    } catch (error) {
      console.error('Join plan error:', error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.banner}>
        <div style={styles.bannerContent}>
          <h1 style={styles.greeting}>
            早安，{user?.nickname || '朋友'}
          </h1>
          <p style={styles.bannerDesc}>今天是冥想的好日子</p>
        </div>
        <div style={styles.bannerIcon}>🌅</div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>我的计划</h2>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
          </div>
        ) : myPlans.length === 0 ? (
          <div className="card" style={styles.emptyCard}>
            <div style={styles.emptyIcon}>📋</div>
            <p style={styles.emptyText}>还没有加入任何计划</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/plans')}
            >
              去选择计划
            </button>
          </div>
        ) : (
          <div style={styles.planList}>
            {myPlans.map((plan) => (
              <div key={plan.id} className="card" style={styles.planCard}>
                <img
                  src={plan.cover_image}
                  alt={plan.title}
                  style={styles.planCover}
                />
                <div style={styles.planInfo}>
                  <h3 style={styles.planTitle}>{plan.title}</h3>
                  <p style={styles.planDesc}>{plan.description}</p>
                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${(plan.userProgress?.completedDays?.length || 0) / plan.total_days * 100}%`
                      }}
                    />
                  </div>
                  <p style={styles.progressText}>
                    已完成 {plan.userProgress?.completedDays?.length || 0}/{plan.total_days} 天
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.entranceGrid}>
        <div className="card" style={styles.entranceCard} onClick={() => navigate('/plans')}>
          <div style={styles.entranceIcon}>📚</div>
          <h3 style={styles.entranceTitle}>冥想计划</h3>
          <p style={styles.entranceDesc}>探索更多冥想课程</p>
        </div>
        
        <div className="card" style={styles.entranceCard} onClick={() => navigate('/progress')}>
          <div style={styles.entranceIcon}>📊</div>
          <h3 style={styles.entranceTitle}>我的路线</h3>
          <p style={styles.entranceDesc}>查看练习进度</p>
        </div>
        
        <div className="card" style={styles.entranceCard} onClick={() => navigate('/courses')}>
          <div style={styles.entranceIcon}>🎓</div>
          <h3 style={styles.entranceTitle}>智慧课堂</h3>
          <p style={styles.entranceDesc}>学习冥想知识</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f7fa',
    padding: '20px'
  },
  banner: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px',
    padding: '24px',
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  bannerContent: {
    color: 'white'
  },
  greeting: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '8px'
  },
  bannerDesc: {
    fontSize: '14px',
    opacity: 0.9
  },
  bannerIcon: {
    fontSize: '60px'
  },
  section: {
    marginBottom: '24px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333'
  },
  emptyCard: {
    padding: '40px 20px',
    textAlign: 'center'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  emptyText: {
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
    width: '120px',
    height: '120px',
    objectFit: 'cover'
  },
  planInfo: {
    padding: '16px',
    flex: 1
  },
  planTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '4px'
  },
  planDesc: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '12px',
    display: '-webkit-box',
    WebkitLineClamp: 1,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  progressBar: {
    width: '100%',
    height: '6px',
    background: '#e9ecef',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '8px'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '3px',
    transition: 'width 0.3s ease'
  },
  progressText: {
    fontSize: '12px',
    color: '#999'
  },
  entranceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  entranceCard: {
    padding: '20px 12px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'transform 0.3s ease'
  },
  entranceIcon: {
    fontSize: '32px',
    marginBottom: '8px'
  },
  entranceTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '4px'
  },
  entranceDesc: {
    fontSize: '11px',
    color: '#999'
  }
};

export default HomePage;
