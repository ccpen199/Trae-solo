import { useState, useEffect } from 'react';
import { examAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const response = await examAPI.getExams();
      setExams(response.data.exams);
    } catch (error) {
      console.error('加载考试失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: '总考试数', value: exams.length, color: '#667eea', icon: '📝' },
    { label: '进行中', value: exams.filter(e => e.status === 'published').length, color: '#f59e0b', icon: '⏳' },
    { label: '已完成', value: exams.filter(e => e.status === 'ended').length, color: '#10b981', icon: '✅' }
  ];

  if (user?.role === 'student') {
    const myExams = exams.filter(e => e.status !== 'draft');
    return (
      <div>
        <h1 style={styles.title}>欢迎回来，{user?.name}</h1>
        
        <div style={styles.statsGrid}>
          <div style={{ ...styles.statCard, background: '#667eea' }}>
            <span style={styles.statIcon}>📋</span>
            <div style={styles.statValue}>{myExams.length}</div>
            <div style={styles.statLabel}>我的考试</div>
          </div>
          <div style={{ ...styles.statCard, background: '#10b981' }}>
            <span style={styles.statIcon}>✅</span>
            <div style={styles.statValue}>{myExams.filter(e => e.status === 'submitted').length}</div>
            <div style={styles.statLabel}>已完成</div>
          </div>
        </div>

        <h2 style={styles.subtitle}>最近考试</h2>
        {loading ? (
          <div style={styles.loading}>加载中...</div>
        ) : (
          <div style={styles.examList}>
            {myExams.map(exam => (
              <div key={exam.id} style={styles.examCard}>
                <h3 style={styles.examTitle}>{exam.title}</h3>
                <p style={styles.examDesc}>{exam.description}</p>
                <div style={styles.examMeta}>
                  <span>🕒 {new Date(exam.start_time).toLocaleString()}</span>
                  <span style={styles.examStatus}>
                    {exam.status === 'published' ? '进行中' : exam.status === 'ended' ? '已结束' : '草稿'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 style={styles.title}>欢迎回来，{user?.name}</h1>
      
      <div style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div key={index} style={{ ...styles.statCard, background: stat.color }}>
            <span style={styles.statIcon}>{stat.icon}</span>
            <div style={styles.statValue}>{stat.value}</div>
            <div style={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <h2 style={styles.subtitle}>最近考试</h2>
      {loading ? (
        <div style={styles.loading}>加载中...</div>
      ) : (
        <div style={styles.examList}>
          {exams.slice(0, 5).map(exam => (
            <div key={exam.id} style={styles.examCard}>
              <h3 style={styles.examTitle}>{exam.title}</h3>
              <p style={styles.examDesc}>{exam.description}</p>
              <div style={styles.examMeta}>
                <span>🕒 {new Date(exam.start_time).toLocaleString()}</span>
                <span style={styles.examStatus}>
                  {exam.status === 'draft' ? '草稿' : exam.status === 'published' ? '已发布' : '已结束'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '30px'
  },
  subtitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    margin: '30px 0 20px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    padding: '24px',
    borderRadius: '12px',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  statIcon: {
    fontSize: '32px',
    marginBottom: '12px'
  },
  statValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '14px',
    opacity: 0.9
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  examList: {
    display: 'grid',
    gap: '16px'
  },
  examCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
  },
  examTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px'
  },
  examDesc: {
    color: '#666',
    marginBottom: '12px',
    fontSize: '14px'
  },
  examMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    color: '#888'
  },
  examStatus: {
    padding: '4px 12px',
    borderRadius: '20px',
    background: '#e3f2fd',
    color: '#1976d2',
    fontWeight: '500'
  }
};

export default Dashboard;
