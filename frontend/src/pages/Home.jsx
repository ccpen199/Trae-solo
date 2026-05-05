import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { categoryAPI, topicAPI } from '../utils/api';

const styles = {
  container: {
    display: 'grid',
    gridTemplateColumns: '1fr 300px',
    gap: '20px'
  },
  mainColumn: {
    minWidth: 0
  },
  sidebar: {},
  card: {
    background: 'white',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  cardHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #f0f0f0',
    fontWeight: '600',
    fontSize: '16px',
    color: '#333'
  },
  categorySection: {
    marginBottom: '20px'
  },
  categoryHeader: {
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '8px 8px 0 0',
    fontWeight: 'bold',
    fontSize: '15px'
  },
  boardList: {
    background: 'white',
    borderRadius: '0 0 8px 8px',
    border: '1px solid #f0f0f0',
    borderTop: 'none'
  },
  boardItem: {
    padding: '16px',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  boardInfo: {
    display: 'flex',
    gap: '12px'
  },
  boardIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '20px',
    flexShrink: 0
  },
  boardContent: {
    minWidth: 0
  },
  boardName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px',
    textDecoration: 'none'
  },
  boardDesc: {
    fontSize: '13px',
    color: '#999',
    lineHeight: '1.5'
  },
  boardStats: {
    textAlign: 'right',
    fontSize: '13px',
    color: '#666',
    flexShrink: 0
  },
  statNumber: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#667eea'
  },
  topicItem: {
    padding: '14px 16px',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    gap: '12px'
  },
  topicIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#667eea',
    fontSize: '18px',
    flexShrink: 0
  },
  topicContent: {
    flex: 1,
    minWidth: 0
  },
  topicTitle: {
    fontSize: '14px',
    color: '#333',
    marginBottom: '4px',
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  topicMeta: {
    fontSize: '12px',
    color: '#999'
  },
  topicStats: {
    textAlign: 'right',
    fontSize: '12px',
    color: '#999',
    flexShrink: 0
  },
  hotTag: {
    background: '#ff4d4f',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    marginRight: '8px'
  },
  topTag: {
    background: '#52c41a',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    marginRight: '8px'
  },
  highlightTag: {
    background: '#faad14',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    marginRight: '8px'
  },
  lockedTag: {
    background: '#999',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    marginRight: '8px'
  }
};

function Home() {
  const [categories, setCategories] = useState([]);
  const [latestTopics, setLatestTopics] = useState([]);
  const [hotTopics, setHotTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catRes, latestRes, hotRes] = await Promise.all([
        categoryAPI.getAll(),
        topicAPI.getLatest({ limit: 10 }),
        topicAPI.getHot({ limit: 10, days: 7 })
      ]);
      
      setCategories(catRes.data.data || []);
      setLatestTopics(latestRes.data.data || []);
      setHotTopics(hotRes.data.data || []);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'top':
        return <span style={styles.topTag}>置顶</span>;
      case 'highlight':
        return <span style={styles.highlightTag}>精华</span>;
      case 'locked':
        return <span style={styles.lockedTag}>锁定</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.mainColumn}>
        {categories.map((category) => (
          <div key={category.id} style={styles.categorySection}>
            <div style={styles.categoryHeader}>
              📁 {category.name}
            </div>
            <div style={styles.boardList}>
              {category.boards?.map((board) => (
                <div key={board.id} style={styles.boardItem}>
                  <div style={styles.boardInfo}>
                    <Link to={`/board/${board.id}`}>
                      <div style={styles.boardIcon}>
                        {board.name.charAt(0)}
                      </div>
                    </Link>
                    <div style={styles.boardContent}>
                      <Link to={`/board/${board.id}`} style={styles.boardName}>
                        {board.name}
                      </Link>
                      <div style={styles.boardDesc}>{board.description}</div>
                    </div>
                  </div>
                  <div style={styles.boardStats}>
                    <div>
                      <span style={styles.statNumber}>{board.topicCount}</span>
                      <span style={{ marginLeft: '4px' }}>主题</span>
                    </div>
                    <div>
                      <span style={styles.statNumber}>{board.replyCount}</span>
                      <span style={{ marginLeft: '4px' }}>回复</span>
                    </div>
                  </div>
                </div>
              ))}
              {(!category.boards || category.boards.length === 0) && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  暂无版块
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.sidebar}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>🔥 最新主题</div>
          <div>
            {latestTopics.map((topic) => (
              <div key={topic.id} style={styles.topicItem}>
                <div style={styles.topicIcon}>
                  {topic.author?.nickname?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div style={styles.topicContent}>
                  <Link to={`/topic/${topic.id}`} style={styles.topicTitle}>
                    {getStatusTag(topic.status)}
                    {topic.title}
                  </Link>
                  <div style={styles.topicMeta}>
                    {topic.author?.nickname || topic.author?.username} · 
                    {dayjs(topic.createdAt).format('MM-DD HH:mm')}
                  </div>
                </div>
              </div>
            ))}
            {latestTopics.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                暂无主题
              </div>
            )}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>⭐ 热门主题</div>
          <div>
            {hotTopics.map((topic) => (
              <div key={topic.id} style={styles.topicItem}>
                <div style={styles.topicContent}>
                  <Link to={`/topic/${topic.id}`} style={styles.topicTitle}>
                    {topic.title}
                  </Link>
                  <div style={styles.topicMeta}>
                    {topic.author?.nickname || topic.author?.username} · 
                    回复 {topic.replyCount}
                  </div>
                </div>
              </div>
            ))}
            {hotTopics.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                暂无热门主题
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
