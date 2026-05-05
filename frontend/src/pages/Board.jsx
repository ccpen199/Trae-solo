import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import useUserStore from '../store/userStore';
import { boardAPI } from '../utils/api';

const styles = {
  container: {},
  header: {
    background: 'white',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333'
  },
  headerDesc: {
    fontSize: '14px',
    color: '#666'
  },
  headerStats: {
    marginTop: '12px',
    display: 'flex',
    gap: '20px',
    fontSize: '13px',
    color: '#999'
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  btn: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  sortTabs: {
    display: 'flex',
    gap: '8px'
  },
  sortTab: {
    padding: '6px 16px',
    background: 'white',
    border: '1px solid #ddd',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#666',
    cursor: 'pointer'
  },
  sortTabActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderColor: 'transparent'
  },
  topicList: {
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  topicListHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 100px 120px 150px',
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '13px',
    color: '#999',
    fontWeight: '500'
  },
  topicItem: {
    display: 'grid',
    gridTemplateColumns: '1fr 100px 120px 150px',
    padding: '14px 16px',
    borderBottom: '1px solid #f0f0f0',
    alignItems: 'center'
  },
  topicInfo: {
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
  topicAuthor: {
    fontSize: '12px',
    color: '#999'
  },
  topicCell: {
    fontSize: '13px',
    color: '#666',
    textAlign: 'center'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    padding: '20px'
  },
  pageBtn: {
    padding: '8px 14px',
    background: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#666',
    cursor: 'pointer'
  },
  pageBtnActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderColor: 'transparent'
  },
  pageBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
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

function Board() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const [board, setBoard] = useState(null);
  const [topTopics, setTopTopics] = useState([]);
  const [topics, setTopics] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [sort, setSort] = useState('lastReply');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, pagination.page, sort]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [boardRes, topicsRes] = await Promise.all([
        boardAPI.getById(id),
        boardAPI.getTopics(id, {
          page: pagination.page,
          pageSize: pagination.pageSize,
          sort
        })
      ]);
      
      setBoard(boardRes.data.data);
      setTopTopics(topicsRes.data.data.topTopics || []);
      setTopics(topicsRes.data.data.topics || []);
      setPagination(topicsRes.data.data.pagination);
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

  const renderTopicItem = (topic, isTop = false) => (
    <div key={topic.id} style={styles.topicItem}>
      <div style={styles.topicInfo}>
        <Link to={`/topic/${topic.id}`} style={styles.topicTitle}>
          {isTop && getStatusTag('top')}
          {getStatusTag(topic.status)}
          {topic.title}
        </Link>
        <div style={styles.topicAuthor}>
          {topic.author?.nickname || topic.author?.username}
        </div>
      </div>
      <div style={styles.topicCell}>{topic.replyCount}</div>
      <div style={styles.topicCell}>{topic.viewCount}</div>
      <div style={styles.topicCell}>
        {dayjs(topic.lastReplyAt || topic.createdAt).format('MM-DD HH:mm')}
      </div>
    </div>
  );

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>;
  }

  return (
    <div style={styles.container}>
      {board && (
        <div style={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={styles.headerTitle}>
                {board.name}
              </div>
              <div style={styles.headerDesc}>{board.description}</div>
              <div style={styles.headerStats}>
                <span>主题: {board.topicCount}</span>
                <span>回复: {board.replyCount}</span>
              </div>
            </div>
            {isAuthenticated && (
              <button
                style={styles.btn}
                onClick={() => navigate(`/topic/create?boardId=${id}`)}
              >
                + 发布新主题
              </button>
            )}
          </div>
        </div>
      )}

      <div style={styles.actionBar}>
        <div style={styles.sortTabs}>
          {[
            { key: 'lastReply', label: '最后回复' },
            { key: 'newest', label: '最新发布' },
            { key: 'hot', label: '热门' }
          ].map((tab) => (
            <span
              key={tab.key}
              style={{
                ...styles.sortTab,
                ...(sort === tab.key ? styles.sortTabActive : {})
              }}
              onClick={() => { setSort(tab.key); setPagination(p => ({ ...p, page: 1 })); }}
            >
              {tab.label}
            </span>
          ))}
        </div>
      </div>

      <div style={styles.topicList}>
        {topTopics.length > 0 && (
          <>
            <div style={styles.topicListHeader}>
              <span>主题</span>
              <span style={{ textAlign: 'center' }}>回复</span>
              <span style={{ textAlign: 'center' }}>浏览</span>
              <span style={{ textAlign: 'center' }}>最后更新</span>
            </div>
            {topTopics.map(topic => renderTopicItem(topic, true))}
          </>
        )}
        
        {topics.length === 0 && topTopics.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            暂无主题
            {isAuthenticated && (
              <div style={{ marginTop: '16px' }}>
                <button
                  style={styles.btn}
                  onClick={() => navigate(`/topic/create?boardId=${id}`)}
                >
                  发布第一个主题
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {topics.map(topic => renderTopicItem(topic))}
          </>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={{
              ...styles.pageBtn,
              ...(pagination.page <= 1 ? styles.pageBtnDisabled : {})
            }}
            disabled={pagination.page <= 1}
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
          >
            上一页
          </button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
            .filter(page => page === 1 || page === pagination.totalPages || 
              Math.abs(page - pagination.page) <= 2)
            .map((page, index, arr) => (
              <React.Fragment key={page}>
                {index > 0 && arr[index - 1] !== page - 1 && (
                  <span style={{ padding: '8px', color: '#999' }}>...</span>
                )}
                <button
                  style={{
                    ...styles.pageBtn,
                    ...(page === pagination.page ? styles.pageBtnActive : {})
                  }}
                  onClick={() => setPagination(p => ({ ...p, page }))}
                >
                  {page}
                </button>
              </React.Fragment>
            ))
          }
          <button
            style={{
              ...styles.pageBtn,
              ...(pagination.page >= pagination.totalPages ? styles.pageBtnDisabled : {})
            }}
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}

export default Board;
