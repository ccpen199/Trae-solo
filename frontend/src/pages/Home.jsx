import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { api } from '../utils/request';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import BottomNav from '../components/BottomNav';
import useStore from '../store';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ongoing, setOngoing] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [activeTab, setActiveTab] = useState('ongoing');

  const navigate = useNavigate();
  const { showToast } = useToast();
  const isLoggedIn = useStore(state => !!state.token);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get('/flash-sale/list');
      setOngoing(result?.data?.ongoing || []);
      setUpcoming(result?.data?.upcoming || []);
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleShare = (item) => {
    navigate(`/share/${item.id}`);
  };

  const handleBuy = (item) => {
    if (item?.taobao_url) {
      window.open(item.taobao_url, '_blank');
    } else {
      showToast('暂无购买链接', 'error');
    }
  };

  const handleRemind = async (item) => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: { pathname: '/' } } });
      return;
    }

    if (item?.has_reminder) {
      showToast('已设置过提醒', 'info');
      return;
    }

    navigate(`/reminder/create/${item.id}`);
  };

  const renderProductCard = (item, isOngoing) => {
    const now = dayjs();
    const startTime = item?.start_time ? dayjs(item.start_time) : null;
    const endTime = item?.end_time ? dayjs(item.end_time) : null;
    let countdownText = '';

    if (isOngoing && endTime) {
      const diff = endTime.diff(now, 'minute');
      if (diff > 60) {
        countdownText = `距结束 ${Math.floor(diff / 60)}小时${diff % 60}分`;
      } else {
        countdownText = `距结束 ${diff}分钟`;
      }
    } else if (!isOngoing && startTime) {
      const diff = startTime.diff(now, 'minute');
      if (diff > 60) {
        countdownText = `${Math.floor(diff / 60)}小时${diff % 60}分后开始`;
      } else if (diff > 0) {
        countdownText = `${diff}分钟后开始`;
      } else {
        countdownText = '即将开始';
      }
    }

    return (
      <div key={item?.id} style={styles.productCard}>
        <div style={styles.productImage}>
          <div style={styles.skeleton}></div>
          <img
            src={item?.product_thumb || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="%23999">📦</text></svg>'}
            alt={item?.product_name || ''}
            style={styles.image}
            onLoad={(e) => {
              e.target.previousElementSibling.style.display = 'none';
            }}
            onError={(e) => {
              e.target.previousElementSibling.style.display = 'none';
              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f5f5f5" width="100" height="100"/><text x="50" y="55" font-size="24" text-anchor="middle" fill="%23999">📱</text></svg>';
            }}
          />
          {isOngoing && (
            <div style={styles.ongoingBadge}>
              进行中
            </div>
          )}
          {!isOngoing && (
            <div style={styles.upcomingBadge}>
              即将开始
            </div>
          )}
        </div>
        <div style={styles.productInfo}>
          <h3 style={styles.productName}>{item?.product_name || '未知商品'}</h3>
          <div style={styles.priceRow}>
            <span style={styles.salePrice}>¥{item?.sale_price || 0}</span>
            <span style={styles.originalPrice}>¥{item?.original_price || 0}</span>
          </div>
          {countdownText && (
            <p style={styles.countdown}>{countdownText}</p>
          )}
          <div style={styles.actionRow}>
            <button
              style={styles.secondaryButton}
              onClick={() => handleShare(item)}
            >
              📤 分享
            </button>
            {isOngoing ? (
              <button
                style={styles.primaryButton}
                onClick={() => handleBuy(item)}
              >
                🛒 立即购买
              </button>
            ) : (
              <button
                style={{
                  ...styles.primaryButton,
                  ...(item?.has_reminder ? styles.remindedButton : {})
                }}
                onClick={() => handleRemind(item)}
              >
                {item?.has_reminder ? '✅ 已提醒' : '⏰ 设置提醒'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>ME 淘</h1>
          <p style={styles.headerSub}>秒杀专场</p>
        </div>
        <div style={styles.content}>
          <Loading message="加载中..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>ME 淘</h1>
          <p style={styles.headerSub}>秒杀专场</p>
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

  const displayList = activeTab === 'ongoing' ? ongoing : upcoming;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>ME 淘</h1>
        <p style={styles.headerSub}>秒杀专场</p>
      </div>

      <div style={styles.tabBar}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'ongoing' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('ongoing')}
        >
          进行中 ({ongoing.length})
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'upcoming' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('upcoming')}
        >
          下一场 ({upcoming.length})
        </button>
      </div>

      <div style={styles.content}>
        {displayList.length === 0 ? (
          <EmptyState
            icon="⏳"
            title={activeTab === 'ongoing' ? '暂无进行中的秒杀' : '暂无即将开始的秒杀'}
            description={activeTab === 'ongoing' ? '快来看看下一场吧' : '敬请期待更多精彩'}
          />
        ) : (
          <div style={styles.productList}>
            {displayList.map(item => renderProductCard(item, activeTab === 'ongoing'))}
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
    background: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)',
    padding: '24px 20px 20px',
    color: '#fff'
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '4px'
  },
  headerSub: {
    fontSize: '14px',
    opacity: 0.9
  },
  tabBar: {
    display: 'flex',
    backgroundColor: '#fff',
    padding: '0 20px',
    borderBottom: '1px solid #eee'
  },
  tab: {
    flex: 1,
    padding: '16px 0',
    fontSize: '14px',
    color: '#666',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    position: 'relative'
  },
  activeTab: {
    color: '#ff4757',
    fontWeight: '600'
  },
  content: {
    padding: '16px 16px 24px'
  },
  productList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  productImage: {
    position: 'relative',
    height: '200px',
    backgroundColor: '#f0f0f0'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  ongoingBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    padding: '4px 12px',
    backgroundColor: '#ff4757',
    color: '#fff',
    fontSize: '12px',
    borderRadius: '12px'
  },
  upcomingBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    padding: '4px 12px',
    backgroundColor: '#2ed573',
    color: '#fff',
    fontSize: '12px',
    borderRadius: '12px'
  },
  productInfo: {
    padding: '16px'
  },
  productName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    marginBottom: '8px'
  },
  salePrice: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ff4757'
  },
  originalPrice: {
    fontSize: '14px',
    color: '#999',
    textDecoration: 'line-through'
  },
  countdown: {
    fontSize: '12px',
    color: '#ff6b81',
    marginBottom: '12px'
  },
  actionRow: {
    display: 'flex',
    gap: '8px'
  },
  secondaryButton: {
    flex: 1,
    padding: '10px 0',
    fontSize: '14px',
    color: '#666',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  primaryButton: {
    flex: 1,
    padding: '10px 0',
    fontSize: '14px',
    color: '#fff',
    backgroundColor: '#ff4757',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  remindedButton: {
    backgroundColor: '#2ed573'
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

export default Home;
