import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore, useToastStore } from '../store';
import api from '../services/api';

function PlanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [practicing, setPracticing] = useState(false);
  const [practiceDuration, setPracticeDuration] = useState(0);

  useEffect(() => {
    fetchPlan();
  }, [id]);

  const fetchPlan = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get(`/plans/${id}`);
      if (res.data.success) {
        setPlan(res.data.data);
      }
    } catch (error) {
      console.error('Fetch plan error:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = () => {
    setPracticing(true);
    setPracticeDuration(plan.duration * 60);
  };

  const handleFinishPractice = async () => {
    try {
      const res = await api.post('/progress/record', {
        planId: plan.id,
        duration: plan.duration,
        selfScore: 5
      });
      if (res.data.success) {
        showToast('练习完成！', 'success');
        setPracticing(false);
        fetchPlan();
      }
    } catch (error) {
      console.error('Record practice error:', error);
    }
  };

  useEffect(() => {
    if (practicing && practiceDuration > 0) {
      const timer = setTimeout(() => setPracticeDuration(practiceDuration - 1), 1000);
      return () => clearTimeout(timer);
    } else if (practicing && practiceDuration === 0) {
      handleFinishPractice();
    }
  }, [practicing, practiceDuration]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div className="loading-container">
          <div className="spinner" />
          <p style={styles.loadingText}>加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div style={styles.container}>
        <div style={styles.errorState}>
          <div style={styles.errorIcon}>😔</div>
          <h2 style={styles.errorTitle}>加载失败</h2>
          <p style={styles.errorDesc}>获取计划详情失败，请重试</p>
          <button className="btn btn-primary" onClick={fetchPlan}>
            重试
          </button>
        </div>
      </div>
    );
  }

  if (practicing) {
    const progress = ((plan.duration * 60 - practiceDuration) / (plan.duration * 60)) * 100;
    return (
      <div style={styles.practiceContainer}>
        <div style={styles.practiceContent}>
          <div style={styles.practiceIcon}>🧘</div>
          <h2 style={styles.practiceTitle}>正在冥想</h2>
          <p style={styles.practicePlan}>{plan.title}</p>
          <div style={styles.timer}>{formatTime(practiceDuration)}</div>
          <div style={styles.timerProgressBar}>
            <div style={{ ...styles.timerProgressFill, width: `${progress}%` }} />
          </div>
          <p style={styles.practiceGuide}>
            {plan.guide_text || '闭上眼睛，专注于呼吸，保持内心平静...'}
          </p>
          <button
            className="btn"
            style={styles.finishButton}
            onClick={handleFinishPractice}
          >
            提前完成
          </button>
        </div>
      </div>
    );
  }

  const completedDays = plan.userProgress?.completedDays?.length || 0;
  const progressPercent = (completedDays / plan.total_days) * 100;

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.backOverlay}>
          <button style={styles.backButton} onClick={() => navigate('/plans')}>
            ← 返回
          </button>
        </div>
        <img
          src={plan.cover_image}
          alt={plan.title}
          style={styles.coverImage}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600';
          }}
        />
        <div style={styles.heroOverlay}>
          <h1 style={styles.planTitle}>{plan.title}</h1>
          <p style={styles.planMeta}>
            {plan.duration}分钟 · {plan.total_days}天计划
          </p>
        </div>
      </div>

      <div style={styles.content}>
        <div className="card" style={styles.progressCard}>
          <h3 style={styles.sectionTitle}>我的进度</h3>
          <div style={styles.progressInfo}>
            <div style={styles.progressCircle}>
              <svg style={styles.progressSvg} viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e9ecef" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${progressPercent * 2.83} 283`}
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={styles.progressPercent}>
                <span style={styles.percentText}>{Math.round(progressPercent)}%</span>
                <span style={styles.percentLabel}>已完成</span>
              </div>
            </div>
            <div style={styles.progressStats}>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{completedDays}</span>
                <span style={styles.statLabel}>已完成天数</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{plan.total_days - completedDays}</span>
                <span style={styles.statLabel}>剩余天数</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={styles.detailCard}>
          <h3 style={styles.sectionTitle}>计划介绍</h3>
          <p style={styles.description}>{plan.description}</p>
          <div style={styles.tags}>
            {plan.is_free ? (
              <span style={styles.freeTag}>免费</span>
            ) : (
              <span style={styles.vipTag}>会员</span>
            )}
            <span style={styles.levelTag}>
              {plan.level === 'beginner' ? '入门级' : plan.level === 'intermediate' ? '进阶级' : '高级'}
            </span>
            <span style={styles.categoryTag}>{plan.category || '冥想'}</span>
          </div>
        </div>

        <div className="card" style={styles.audioCard}>
          <h3 style={styles.sectionTitle}>引导音频</h3>
          {(!plan.is_free && !user?.is_vip) ? (
            <div style={styles.vipRequired}>
              <span style={styles.vipIcon}>🔒</span>
              <p style={styles.vipText}>开通会员即可解锁完整引导音频</p>
            </div>
          ) : (
            <div style={styles.audioPlayer}>
              <div style={styles.audioIcon}>🎵</div>
              <div style={styles.audioInfo}>
                <p style={styles.audioTitle}>引导冥想 - {plan.title}</p>
                <p style={styles.audioDuration}>{plan.duration}分钟</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={styles.bottomBar}>
        <button
          className="btn btn-primary"
          style={styles.startButton}
          onClick={handleStartPractice}
        >
          开始冥想
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f7fa',
    paddingBottom: '100px'
  },
  hero: {
    position: 'relative',
    height: '280px',
    overflow: 'hidden'
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  backOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    padding: '20px'
  },
  backButton: {
    background: 'rgba(0, 0, 0, 0.5)',
    border: 'none',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '24px 20px',
    background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.7))',
    color: 'white'
  },
  planTitle: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '4px'
  },
  planMeta: {
    fontSize: '14px',
    opacity: 0.9
  },
  content: {
    padding: '20px',
    marginTop: '-20px',
    position: 'relative',
    zIndex: 5
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
  progressCard: {
    marginBottom: '16px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '16px'
  },
  progressInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px'
  },
  progressCircle: {
    position: 'relative',
    width: '100px',
    height: '100px'
  },
  progressSvg: {
    width: '100%',
    height: '100%'
  },
  progressPercent: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center'
  },
  percentText: {
    display: 'block',
    fontSize: '20px',
    fontWeight: 700,
    color: '#667eea'
  },
  percentLabel: {
    display: 'block',
    fontSize: '10px',
    color: '#999'
  },
  progressStats: {
    flex: 1,
    display: 'flex',
    gap: '24px'
  },
  statItem: {
    textAlign: 'center'
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 700,
    color: '#333'
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#999',
    marginTop: '4px'
  },
  detailCard: {
    marginBottom: '16px'
  },
  description: {
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.7,
    marginBottom: '16px'
  },
  tags: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  freeTag: {
    padding: '6px 12px',
    background: '#e8f5e9',
    color: '#4caf50',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: 500
  },
  vipTag: {
    padding: '6px 12px',
    background: '#fff3e0',
    color: '#ff9800',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: 500
  },
  levelTag: {
    padding: '6px 12px',
    background: '#e3f2fd',
    color: '#2196f3',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: 500
  },
  categoryTag: {
    padding: '6px 12px',
    background: '#f3e5f5',
    color: '#9c27b0',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: 500
  },
  audioCard: {
    marginBottom: '16px'
  },
  vipRequired: {
    textAlign: 'center',
    padding: '20px'
  },
  vipIcon: {
    fontSize: '32px',
    display: 'block',
    marginBottom: '8px'
  },
  vipText: {
    fontSize: '14px',
    color: '#999'
  },
  audioPlayer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px',
    background: '#f8f9fa',
    borderRadius: '12px'
  },
  audioIcon: {
    fontSize: '32px'
  },
  audioInfo: {},
  audioTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
    marginBottom: '4px'
  },
  audioDuration: {
    fontSize: '12px',
    color: '#999'
  },
  bottomBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '16px 20px',
    background: 'white',
    boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.08)'
  },
  startButton: {
    width: '100%',
    padding: '16px'
  },
  practiceContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  practiceContent: {
    textAlign: 'center',
    color: 'white'
  },
  practiceIcon: {
    fontSize: '80px',
    marginBottom: '20px'
  },
  practiceTitle: {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '8px'
  },
  practicePlan: {
    fontSize: '16px',
    opacity: 0.9,
    marginBottom: '40px'
  },
  timer: {
    fontSize: '64px',
    fontWeight: 700,
    marginBottom: '20px',
    fontVariant: 'tabular-nums'
  },
  timerProgressBar: {
    width: '200px',
    height: '6px',
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '3px',
    overflow: 'hidden',
    margin: '0 auto 30px'
  },
  timerProgressFill: {
    height: '100%',
    background: 'white',
    borderRadius: '3px',
    transition: 'width 1s linear'
  },
  practiceGuide: {
    fontSize: '16px',
    lineHeight: 1.8,
    maxWidth: '400px',
    margin: '0 auto 30px',
    opacity: 0.95
  },
  finishButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    color: 'white',
    padding: '12px 32px',
    borderRadius: '25px',
    fontSize: '16px',
    cursor: 'pointer'
  }
};

export default PlanDetailPage;
