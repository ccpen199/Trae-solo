import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { api } from '../utils/request';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import BottomNav from '../components/BottomNav';

const Reminders = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reminders, setReminders] = useState([]);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get('/reminder/list');
      setReminders(result?.data || []);
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleReminder = async (item) => {
    try {
      await api.put(`/reminder/toggle/${item.id}`, {
        enabled: !item.enabled
      });
      setReminders(prev => prev.map(r => 
        r.id === item.id ? { ...r, enabled: !item.enabled } : r
      ));
      showToast(item.enabled ? '提醒已关闭' : '提醒已开启', 'success');
    } catch (err) {
      // 错误已处理
    }
  };

  const deleteReminder = async (item) => {
    if (!window.confirm('确定要删除这个提醒吗？')) {
      return;
    }
    try {
      await api.delete(`/reminder/${item.id}`);
      setReminders(prev => prev.filter(r => r.id !== item.id));
      showToast('提醒已删除', 'success');
    } catch (err) {
      // 错误已处理
    }
  };

  const renderReminderCard = (item) => {
    const startTime = item?.start_time ? dayjs(item.start_time) : null;

    return (
      <div key={item.id} style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.productRow}>
            {item.product_thumb && (
              <img
                src={item.product_thumb}
                alt={item.product_name}
                style={styles.productThumb}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div style={styles.productInfo}>
              <h4 style={styles.productName}>
                {item.product_name || `提醒 #${item.id}`}
              </h4>
              {startTime && (
                <p style={styles.timeText}>
                  {startTime.format('MM月DD日 HH:mm')} 开始
                </p>
              )}
            </div>
          </div>
          <label style={styles.switch}>
            <input
              type="checkbox"
              checked={!!item.enabled}
              onChange={() => toggleReminder(item)}
            />
            <span style={styles.switchSlider}></span>
          </label>
        </div>

        <div style={styles.settingsRow}>
          <div style={styles.settingItem}>
            <span style={styles.settingLabel}>提前提醒</span>
            <span style={styles.settingValue}>{item.advance_time || 5}分钟</span>
          </div>
          <div style={styles.settingItem}>
            <span style={styles.settingLabel}>铃声</span>
            <span style={styles.settingValue}>{item.ringtone === 'default' ? '默认' : item.ringtone}</span>
          </div>
          <div style={styles.settingItem}>
            <span style={styles.settingLabel}>震动</span>
            <span style={styles.settingValue}>{item.vibration ? '开启' : '关闭'}</span>
          </div>
        </div>

        {item.keyword && (
          <div style={styles.keywordRow}>
            <span style={styles.keywordLabel}>关键字</span>
            <span style={styles.keywordValue}>{item.keyword}</span>
          </div>
        )}

        <div style={styles.actionsRow}>
          <button
            style={styles.deleteButton}
            onClick={() => deleteReminder(item)}
          >
            删除
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>我的提醒</h1>
        </div>
        <div style={styles.content}>
          <Loading message="加载提醒中..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>我的提醒</h1>
        </div>
        <div style={styles.content}>
          <div style={styles.errorContainer}>
            <p style={styles.errorText}>{error}</p>
            <button style={styles.retryButton} onClick={fetchData}>
              点击重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>我的提醒</h1>
        <p style={styles.headerSub}>管理您的秒杀和物流提醒</p>
      </div>

      <div style={styles.content}>
        {reminders.length === 0 ? (
          <EmptyState
            icon="⏰"
            title="暂无提醒"
            description="去秒杀列表设置您感兴趣的商品提醒吧"
            onAction={() => navigate('/')}
            actionText="去看看"
          />
        ) : (
          <div style={styles.cardList}>
            {reminders.map(renderReminderCard)}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    paddingBottom: '70px'
  },
  header: {
    backgroundColor: '#fff',
    padding: '20px 20px 16px',
    borderBottom: '1px solid #eee'
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333'
  },
  headerSub: {
    fontSize: '13px',
    color: '#999',
    marginTop: '4px'
  },
  content: {
    padding: '16px'
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  productRow: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    marginRight: '12px'
  },
  productThumb: {
    width: '56px',
    height: '56px',
    borderRadius: '8px',
    objectFit: 'cover',
    marginRight: '12px'
  },
  productInfo: {
    flex: 1,
    minWidth: 0
  },
  productName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  timeText: {
    fontSize: '12px',
    color: '#ff4757'
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '44px',
    height: '24px',
    flexShrink: 0
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
  settingsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0'
  },
  settingItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  settingLabel: {
    fontSize: '11px',
    color: '#999'
  },
  settingValue: {
    fontSize: '13px',
    color: '#333',
    fontWeight: '500'
  },
  keywordRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    backgroundColor: '#fff7e6',
    borderRadius: '8px',
    marginBottom: '12px'
  },
  keywordLabel: {
    fontSize: '12px',
    color: '#fa8c16'
  },
  keywordValue: {
    fontSize: '13px',
    color: '#d48806',
    fontWeight: '500'
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0'
  },
  deleteButton: {
    padding: '8px 20px',
    fontSize: '13px',
    color: '#ff4757',
    backgroundColor: 'transparent',
    border: '1px solid #ffccc7',
    borderRadius: '20px',
    cursor: 'pointer'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 20px'
  },
  errorText: {
    color: '#999',
    marginBottom: '16px'
  },
  retryButton: {
    padding: '10px 24px',
    backgroundColor: '#ff4757',
    color: '#fff',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer'
  }
};

export default Reminders;
