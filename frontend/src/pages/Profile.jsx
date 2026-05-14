import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import dayjs from 'dayjs';
import useStore from '../store';
import { api } from '../utils/request';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import BottomNav from '../components/BottomNav';

const Profile = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const user = useStore(state => state.user);
  const token = useStore(state => state.token);
  const logout = useStore(state => state.logout);
  const fetchUserProfile = useStore(state => state.fetchUserProfile);
  const updateNotificationPermission = useStore(state => state.updateNotificationPermission);

  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [myReminders, setMyReminders] = useState(null);
  const [shareRecords, setShareRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchUserProfile();
      await loadMyReminders();
      await loadShareRecords();
    } catch (err) {
      // 错误已处理
    } finally {
      setLoading(false);
    }
  };

  const loadMyReminders = async () => {
    try {
      const result = await api.get('/reminder/my');
      setMyReminders(result?.data);
    } catch (err) {
      console.error('加载我的提醒失败:', err);
    }
  };

  const loadShareRecords = async () => {
    setLoadingRecords(true);
    try {
      const result = await api.get('/share/records');
      setShareRecords(result?.data || []);
    } catch (err) {
      console.error('加载分享记录失败:', err);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('确定要退出登录吗？')) {
      return;
    }

    setLoggingOut(true);
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // 忽略退出时的错误
    }

    logout();
    showToast('已退出登录', 'success');
    navigate('/login', { replace: true });
    setLoggingOut(false);
  };

  const handleNotificationToggle = async (enabled) => {
    if ('Notification' in window && enabled) {
      const permission = Notification.permission;
      if (permission === 'default') {
        try {
          const newPermission = await Notification.requestPermission();
          if (newPermission !== 'granted') {
            showToast('未获得通知权限，请在浏览器设置中开启', 'warning');
            return;
          }
        } catch (err) {
          showToast('请求通知权限失败', 'error');
          return;
        }
      } else if (permission !== 'granted') {
        showToast('未获得通知权限，请在浏览器设置中开启', 'warning');
        return;
      }
    }

    await updateNotificationPermission(enabled);
    showToast(enabled ? '已开启通知权限' : '已关闭通知权限', 'success');
  };

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.content}>
          <Loading message="加载中..." />
        </div>
        <BottomNav />
      </div>
    );
  }

  const flashSaleCount = myReminders?.flash_sales?.length || 0;
  const logisticsCount = myReminders?.logistics?.length || 0;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.avatar}>
          <span style={styles.avatarIcon}>👤</span>
        </div>
        <h2 style={styles.username}>
          {user?.nickname || user?.taobao_account || '用户'}
        </h2>
        <p style={styles.account}>
          {user?.taobao_account}
        </p>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statItem} onClick={() => navigate('/reminders')}>
          <div style={styles.statValue}>{flashSaleCount}</div>
          <div style={styles.statLabel}>秒杀提醒</div>
        </div>
        <div style={styles.statItem} onClick={() => navigate('/logistics')}>
          <div style={styles.statValue}>{logisticsCount}</div>
          <div style={styles.statLabel}>物流提醒</div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statValue}>{shareRecords.length}</div>
          <div style={styles.statLabel}>分享记录</div>
        </div>
      </div>

      <div style={styles.menu}>
        <div style={styles.menuGroup}>
          <div style={styles.menuItem}>
            <div style={styles.menuLeft}>
              <span style={styles.menuIcon}>🔔</span>
              <span style={styles.menuText}>接收通知</span>
            </div>
            <label style={styles.switch}>
              <input
                type="checkbox"
                checked={user?.notification_permission === 1}
                onChange={(e) => handleNotificationToggle(e.target.checked)}
              />
              <span style={styles.switchSlider}></span>
            </label>
          </div>
        </div>

        <div style={styles.menuGroup}>
          <div style={styles.menuItem} onClick={() => navigate('/reminders')}>
            <div style={styles.menuLeft}>
              <span style={styles.menuIcon}>⏰</span>
              <span style={styles.menuText}>我的提醒</span>
            </div>
            <span style={styles.menuArrow}>›</span>
          </div>
          <div style={styles.menuItem} onClick={() => navigate('/logistics')}>
            <div style={styles.menuLeft}>
              <span style={styles.menuIcon}>📦</span>
              <span style={styles.menuText}>物流追踪</span>
            </div>
            <span style={styles.menuArrow}>›</span>
          </div>
        </div>

        {shareRecords.length > 0 && (
          <div style={styles.menuGroup}>
            <div style={styles.menuSectionTitle}>最近分享</div>
            {shareRecords.slice(0, 3).map(record => (
              <div key={record.id} style={styles.recordItem}>
                <span style={styles.recordPlatform}>
                  {platformIcons[record.platform] || '📱'} {record.platform_name || record.platform}
                </span>
                <span style={styles.recordTime}>
                  {dayjs(record.share_time).format('MM-DD HH:mm')}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={styles.menuGroup}>
          <div style={styles.logoutButton} onClick={handleLogout}>
            {loggingOut ? '退出中...' : '退出登录'}
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>ME 淘 Web 端 v1.0.0</p>
      </div>

      <BottomNav />
    </div>
  );
};

const platformIcons = {
  weibo: '🌐',
  wechat: '💬',
  qq: '🐧',
  douyin: '🎵'
};

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  header: {
    background: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)',
    padding: '40px 20px 56px',
    textAlign: 'center',
    color: '#fff'
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px'
  },
  avatarIcon: {
    fontSize: '40px'
  },
  username: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '4px'
  },
  account: {
    fontSize: '13px',
    opacity: 0.85
  },
  statsRow: {
    display: 'flex',
    marginTop: '-32px',
    marginHorizontal: '16px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '16px 0',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    marginLeft: '16px',
    marginRight: '16px'
  },
  statItem: {
    flex: 1,
    textAlign: 'center',
    cursor: 'pointer'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ff4757'
  },
  statLabel: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px'
  },
  menu: {
    marginTop: '20px',
    padding: '0 16px'
  },
  menuGroup: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    marginBottom: '16px',
    overflow: 'hidden'
  },
  menuSectionTitle: {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#999',
    backgroundColor: '#fafafa'
  },
  menuItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer'
  },
  menuLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  menuIcon: {
    fontSize: '20px'
  },
  menuText: {
    fontSize: '15px',
    color: '#333'
  },
  menuArrow: {
    fontSize: '18px',
    color: '#ccc'
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '44px',
    height: '24px'
  },
  switchSlider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ccc',
    transition: '.4s',
    borderRadius: '24px'
  },
  recordItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    borderBottom: '1px solid #f0f0f0'
  },
  recordPlatform: {
    fontSize: '14px',
    color: '#333'
  },
  recordTime: {
    fontSize: '12px',
    color: '#999'
  },
  logoutButton: {
    padding: '16px',
    textAlign: 'center',
    fontSize: '15px',
    color: '#ff4757',
    cursor: 'pointer'
  },
  footer: {
    textAlign: 'center',
    padding: '20px'
  },
  footerText: {
    fontSize: '12px',
    color: '#ccc'
  }
};

export default Profile;
