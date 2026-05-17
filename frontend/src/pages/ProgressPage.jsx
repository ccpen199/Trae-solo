import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useToastStore } from '../store';
import api from '../services/api';

function ProgressPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { showToast } = useToastStore();
  const [stats, setStats] = useState(null);
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [statsRes, todayRes] = await Promise.all([
        api.get('/progress/stats'),
        api.get('/progress/today')
      ]);
      
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (todayRes.data.success) {
        setToday(todayRes.data.data);
      }
    } catch (error) {
      console.error('Fetch progress error:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPractice = async () => {
    try {
      const res = await api.post('/progress/record', {
        duration: 5,
        selfScore: 5
      });
      if (res.data.success) {
        showToast('快速练习完成！', 'success');
        fetchData();
        
        if (user) {
          setUser({
            ...user,
            total_meditation_minutes: (user.total_meditation_minutes || 0) + 5,
            meditation_days: user.last_meditation_date === new Date().toISOString().split('T')[0] 
              ? user.meditation_days 
              : (user.meditation_days || 0) + 1,
            last_meditation_date: new Date().toISOString().split('T')[0]
          });
        }
      }
    } catch (error) {
      console.error('Quick practice error:', error);
    }
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

  if (error || !stats) {
    return (
      <div style={styles.container}>
        <div style={styles.errorState}>
          <div style={styles.errorIcon}>😔</div>
          <h2 style={styles.errorTitle}>加载失败</h2>
          <p style={styles.errorDesc}>获取进度数据失败，请重试</p>
          <button className="btn btn-primary" onClick={fetchData}>
            重试
          </button>
        </div>
      </div>
    );
  }

  const maxDuration = Math.max(...stats.chartData.map(d => d.duration), 60);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('/home')}>
          ← 返回
        </button>
        <h1 style={styles.title}>我的进度</h1>
      </div>

      <div className="card" style={styles.todayCard}>
        <div style={styles.todayHeader}>
          <div style={styles.todayIcon}>☀️</div>
          <div style={styles.todayInfo}>
            <h3 style={styles.todayTitle}>今日冥想</h3>
            <p style={styles.todayDate}>
              {new Date().toLocaleDateString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>
          {today?.practice && (
            <div style={styles.completedBadge}>
              ✓ 已完成
            </div>
          )}
        </div>
        
        {today?.content && (
          <div style={styles.todayContent}>
            <h4 style={styles.contentTitle}>{today.content.title}</h4>
            <p style={styles.contentDesc}>{today.content.description}</p>
            {!today?.practice && (
              <button
                className="btn btn-primary"
                style={styles.startTodayButton}
                onClick={handleQuickPractice}
              >
                快速练习 ({today.content.duration}分钟)
              </button>
            )}
          </div>
        )}

        {today?.practice && (
          <div style={styles.todayPractice}>
            <div style={styles.practiceStat}>
              <span style={styles.practiceValue}>{today.practice.duration}</span>
              <span style={styles.practiceLabel}>分钟</span>
            </div>
            <div style={styles.practiceStat}>
              <span style={styles.practiceValue}>
                {'⭐'.repeat(today.practice.self_score || 5)}
              </span>
              <span style={styles.practiceLabel}>自评</span>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={styles.statsCard}>
        <h3 style={styles.sectionTitle}>累计数据</h3>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>⏱️</div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>{stats.totalMinutes || 0}</span>
              <span style={styles.statLabel}>总分钟</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📅</div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>{stats.meditationDays || 0}</span>
              <span style={styles.statLabel}>练习天数</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📚</div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>{stats.activePlans || 0}</span>
              <span style={styles.statLabel}>进行中计划</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={styles.chartCard}>
        <h3 style={styles.sectionTitle}>近30天练习趋势</h3>
        <div style={styles.chartContainer}>
          <div style={styles.chartBars}>
            {stats.chartData.map((day, index) => {
              const height = day.duration > 0 ? Math.max((day.duration / maxDuration) * 100, 8) : 0;
              return (
                <div key={index} style={styles.chartBarWrapper}>
                  <div
                    style={{
                      ...styles.chartBar,
                      height: `${height}%`,
                      background: height > 0 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent'
                    }}
                  />
                  <span style={styles.chartLabel}>
                    {new Date(day.date).getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card" style={styles.quickActionCard}>
        <h3 style={styles.sectionTitle}>快捷操作</h3>
        <div style={styles.actionGrid}>
          <div style={styles.actionItem} onClick={handleQuickPractice}>
            <div style={styles.actionIcon}>⚡</div>
            <span style={styles.actionLabel}>快速冥想</span>
            <span style={styles.actionDesc}>5分钟</span>
          </div>
          <div style={styles.actionItem} onClick={() => navigate('/plans')}>
            <div style={styles.actionIcon}>📖</div>
            <span style={styles.actionLabel}>选择计划</span>
            <span style={styles.actionDesc}>更多课程</span>
          </div>
          <div style={styles.actionItem} onClick={() => navigate('/courses')}>
            <div style={styles.actionIcon}>🎓</div>
            <span style={styles.actionLabel}>智慧课堂</span>
            <span style={styles.actionDesc}>学习知识</span>
          </div>
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
  todayCard: {
    marginBottom: '16px'
  },
  todayHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px'
  },
  todayIcon: {
    fontSize: '40px'
  },
  todayInfo: {
    flex: 1
  },
  todayTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '2px'
  },
  todayDate: {
    fontSize: '13px',
    color: '#999'
  },
  completedBadge: {
    padding: '6px 12px',
    background: '#e8f5e9',
    color: '#4caf50',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: 500
  },
  todayContent: {
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: '12px',
    marginBottom: '16px'
  },
  contentTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '6px'
  },
  contentDesc: {
    fontSize: '13px',
    color: '#666',
    lineHeight: 1.5,
    marginBottom: '12px'
  },
  startTodayButton: {
    padding: '10px 20px',
    fontSize: '14px'
  },
  todayPractice: {
    display: 'flex',
    gap: '32px'
  },
  practiceStat: {
    textAlign: 'center'
  },
  practiceValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 700,
    color: '#667eea'
  },
  practiceLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#999',
    marginTop: '4px'
  },
  statsCard: {
    marginBottom: '16px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '16px'
  },
  statsGrid: {
    display: 'flex',
    gap: '12px'
  },
  statCard: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: '12px'
  },
  statIcon: {
    fontSize: '28px'
  },
  statContent: {
    flex: 1
  },
  statValue: {
    display: 'block',
    fontSize: '20px',
    fontWeight: 700,
    color: '#333'
  },
  statLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#999',
    marginTop: '2px'
  },
  chartCard: {
    marginBottom: '16px'
  },
  chartContainer: {
    height: '180px'
  },
  chartBars: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '140px',
    gap: '4px',
    paddingBottom: '30px'
  },
  chartBarWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%'
  },
  chartBar: {
    width: '100%',
    maxWidth: '12px',
    borderRadius: '6px 6px 0 0',
    minHeight: '0',
    transition: 'height 0.3s ease'
  },
  chartLabel: {
    fontSize: '10px',
    color: '#999',
    marginTop: '6px',
    position: 'absolute',
    bottom: 0
  },
  quickActionCard: {
    marginBottom: '16px'
  },
  actionGrid: {
    display: 'flex',
    gap: '12px'
  },
  actionItem: {
    flex: 1,
    textAlign: 'center',
    padding: '16px 12px',
    background: '#f8f9fa',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease'
  },
  actionIcon: {
    fontSize: '28px',
    marginBottom: '8px'
  },
  actionLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#333',
    marginBottom: '4px'
  },
  actionDesc: {
    display: 'block',
    fontSize: '11px',
    color: '#999'
  }
};

export default ProgressPage;
