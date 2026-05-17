import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useToastStore } from '../store';
import api from '../services/api';

function CoursesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/courses');
      if (res.data.success) {
        setCourses(res.data.data.list || []);
      }
    } catch (error) {
      console.error('Fetch courses error:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleWatchCourse = (course) => {
    if (!course.is_free && !user?.is_vip) {
      showToast('该课程仅对会员开放', 'error');
      return;
    }
    showToast(`开始学习：${course.title}`, 'success');
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

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorState}>
          <div style={styles.errorIcon}>😔</div>
          <h2 style={styles.errorTitle}>加载失败</h2>
          <p style={styles.errorDesc}>获取课程列表失败，请重试</p>
          <button className="btn btn-primary" onClick={fetchCourses}>
            重试
          </button>
        </div>
      </div>
    );
  }

  const freeCourses = courses.filter(c => c.is_free);
  const vipCourses = courses.filter(c => !c.is_free);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('/home')}>
          ← 返回
        </button>
        <h1 style={styles.title}>智慧课堂</h1>
      </div>

      <div className="card" style={styles.introCard}>
        <div style={styles.introContent}>
          <div style={styles.introIcon}>🎓</div>
          <div>
            <h3 style={styles.introTitle}>学习冥想知识</h3>
            <p style={styles.introDesc}>
              从基础到进阶，系统学习冥想理论与实践技巧
            </p>
          </div>
        </div>
      </div>

      {freeCourses.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>免费课程</h2>
            <span style={styles.sectionBadge}>免费</span>
          </div>
          <div style={styles.courseGrid}>
            {freeCourses.map((course) => (
              <div key={course.id} className="card" style={styles.courseCard}>
                <div style={styles.courseCover}>
                  <img
                    src={course.cover_image}
                    alt={course.title}
                    style={styles.coverImage}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400';
                    }}
                  />
                  <div style={styles.playOverlay}>
                    <span style={styles.playIcon}>▶</span>
                  </div>
                </div>
                <div style={styles.courseInfo}>
                  <h3 style={styles.courseTitle}>{course.title}</h3>
                  <p style={styles.courseDesc}>{course.description}</p>
                  <div style={styles.courseMeta}>
                    <span style={styles.instructor}>👨‍🏫 {course.instructor || '讲师'}</span>
                    <span style={styles.duration}>⏱️ {course.duration || 30}分钟</span>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={styles.watchButton}
                    onClick={() => handleWatchCourse(course)}
                  >
                    开始学习
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {vipCourses.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>会员专享</h2>
            <span style={styles.vipSectionBadge}>VIP</span>
          </div>
          <div style={styles.courseGrid}>
            {vipCourses.map((course) => (
              <div key={course.id} className="card" style={styles.courseCard}>
                <div style={styles.courseCover}>
                  <img
                    src={course.cover_image}
                    alt={course.title}
                    style={styles.coverImage}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400';
                    }}
                  />
                  {!user?.is_vip && (
                    <div style={styles.lockedOverlay}>
                      <span style={styles.lockedIcon}>🔒</span>
                      <span style={styles.lockedText}>会员专享</span>
                    </div>
                  )}
                  {user?.is_vip && (
                    <div style={styles.playOverlay}>
                      <span style={styles.playIcon}>▶</span>
                    </div>
                  )}
                </div>
                <div style={styles.courseInfo}>
                  <h3 style={styles.courseTitle}>{course.title}</h3>
                  <p style={styles.courseDesc}>{course.description}</p>
                  <div style={styles.courseMeta}>
                    <span style={styles.instructor}>👨‍🏫 {course.instructor || '讲师'}</span>
                    <span style={styles.duration}>⏱️ {course.duration || 30}分钟</span>
                  </div>
                  <button
                    className="btn"
                    style={{
                      ...styles.watchButton,
                      ...(user?.is_vip ? {} : styles.vipButton)
                    }}
                    onClick={() => handleWatchCourse(course)}
                  >
                    {user?.is_vip ? '开始学习' : '升级会员解锁'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {courses.length === 0 && (
        <div className="empty-state">
          <p>暂无课程，敬请期待</p>
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
  introCard: {
    marginBottom: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  introContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    color: 'white'
  },
  introIcon: {
    fontSize: '40px'
  },
  introTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '4px'
  },
  introDesc: {
    fontSize: '13px',
    opacity: 0.9,
    lineHeight: 1.5
  },
  section: {
    marginBottom: '24px'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333'
  },
  sectionBadge: {
    padding: '4px 10px',
    background: '#e8f5e9',
    color: '#4caf50',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 500
  },
  vipSectionBadge: {
    padding: '4px 10px',
    background: '#fff3e0',
    color: '#ff9800',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 500
  },
  courseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px'
  },
  courseCard: {
    overflow: 'hidden'
  },
  courseCover: {
    position: 'relative',
    height: '160px',
    overflow: 'hidden'
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.3)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    cursor: 'pointer'
  },
  playIcon: {
    fontSize: '48px',
    color: 'white'
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.6)'
  },
  lockedIcon: {
    fontSize: '32px',
    marginBottom: '8px'
  },
  lockedText: {
    color: 'white',
    fontSize: '14px',
    fontWeight: 500
  },
  courseInfo: {
    padding: '16px'
  },
  courseTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '8px'
  },
  courseDesc: {
    fontSize: '13px',
    color: '#666',
    lineHeight: 1.5,
    marginBottom: '12px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  courseMeta: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px'
  },
  instructor: {
    fontSize: '12px',
    color: '#999'
  },
  duration: {
    fontSize: '12px',
    color: '#999'
  },
  watchButton: {
    width: '100%',
    padding: '10px',
    fontSize: '14px'
  },
  vipButton: {
    background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
  }
};

export default CoursesPage;
