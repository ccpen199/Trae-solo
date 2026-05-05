import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import useUserStore from '../store/userStore';
import { topicAPI, replyAPI, moderatorAPI } from '../utils/api';

const styles = {
  container: {},
  topicCard: {
    background: 'white',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  topicHeader: {
    padding: '20px',
    borderBottom: '1px solid #f0f0f0'
  },
  topicTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#333'
  },
  topicMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: '#999'
  },
  topicContent: {
    padding: '20px',
    lineHeight: '1.8',
    fontSize: '15px',
    color: '#333',
    minHeight: '100px'
  },
  topicActions: {
    padding: '16px 20px',
    borderTop: '1px solid #f0f0f0',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  btn: {
    padding: '8px 16px',
    background: '#f5f5f5',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#666',
    cursor: 'pointer'
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  },
  btnDanger: {
    background: '#fff0f0',
    color: '#ff4d4f'
  },
  replySection: {
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  replyHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #f0f0f0',
    fontWeight: '600',
    fontSize: '15px',
    color: '#333'
  },
  replyItem: {
    padding: '16px 20px',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    gap: '12px'
  },
  replyAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '18px',
    fontWeight: 'bold',
    flexShrink: 0
  },
  replyContent: {
    flex: 1,
    minWidth: 0
  },
  replyHeaderInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  replyAuthor: {
    fontWeight: '600',
    color: '#333'
  },
  replyTime: {
    fontSize: '12px',
    color: '#999'
  },
  replyText: {
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.6',
    marginBottom: '8px'
  },
  replyActions: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
    color: '#999'
  },
  replyAction: {
    cursor: 'pointer'
  },
  replyForm: {
    padding: '20px',
    borderTop: '1px solid #f0f0f0'
  },
  replyTextarea: {
    width: '100%',
    minHeight: '100px',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    resize: 'vertical',
    outline: 'none'
  },
  replySubmit: {
    marginTop: '12px',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  statusTag: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    marginRight: '8px'
  },
  topTag: {
    background: '#52c41a',
    color: 'white'
  },
  highlightTag: {
    background: '#faad14',
    color: 'white'
  },
  lockedTag: {
    background: '#999',
    color: 'white'
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
  childReply: {
    marginLeft: '60px',
    marginTop: '12px',
    padding: '12px',
    background: '#fafafa',
    borderRadius: '6px'
  }
};

function Topic() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, isModerator } = useUserStore();
  const [topic, setTopic] = useState(null);
  const [replies, setReplies] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, pagination.page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [topicRes, repliesRes] = await Promise.all([
        topicAPI.getById(id),
        topicAPI.getReplies(id, {
          page: pagination.page,
          pageSize: pagination.pageSize
        })
      ]);
      
      setTopic(topicRes.data.data);
      setReplies(repliesRes.data.data.replies || []);
      setPagination(repliesRes.data.data.pagination);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;
    
    setSubmitting(true);
    try {
      await replyAPI.create({
        content: replyContent,
        topicId: id
      });
      setReplyContent('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || '回复失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModeratorAction = async (action) => {
    try {
      switch (action) {
        case 'lock':
          await moderatorAPI.lockTopic(id);
          break;
        case 'unlock':
          await moderatorAPI.unlockTopic(id);
          break;
        case 'top':
          await moderatorAPI.topTopic(id);
          break;
        case 'untop':
          await moderatorAPI.untopTopic(id);
          break;
        case 'highlight':
          await moderatorAPI.highlightTopic(id);
          break;
        case 'unhighlight':
          await moderatorAPI.unhighlightTopic(id);
          break;
        case 'delete':
          if (confirm('确定要删除这个主题吗？')) {
            await topicAPI.delete(id);
            navigate('/');
            return;
          }
          return;
      }
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  const getStatusTags = () => {
    if (!topic) return null;
    const tags = [];
    if (topic.status === 'top') tags.push(<span key="top" style={{ ...styles.statusTag, ...styles.topTag }}>置顶</span>);
    if (topic.status === 'highlight') tags.push(<span key="highlight" style={{ ...styles.statusTag, ...styles.highlightTag }}>精华</span>);
    if (topic.status === 'locked') tags.push(<span key="locked" style={{ ...styles.statusTag, ...styles.lockedTag }}>锁定</span>);
    return tags;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>;
  }

  if (!topic) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>主题不存在或已被删除</div>;
  }

  const isTopicOwner = user?.id === topic.userId;
  const isTopicLocked = topic.status === 'locked';

  return (
    <div style={styles.container}>
      <div style={styles.topicCard}>
        <div style={styles.topicHeader}>
          <div style={{ marginBottom: '8px' }}>
            {getStatusTags()}
            <Link to={`/board/${topic.boardId}`} style={{ color: '#667eea', fontSize: '13px' }}>
              {topic.board?.name}
            </Link>
          </div>
          <h1 style={styles.topicTitle}>{topic.title}</h1>
          <div style={styles.topicMeta}>
            <span>作者: {topic.author?.nickname || topic.author?.username}</span>
            <span>发布于: {dayjs(topic.createdAt).format('YYYY-MM-DD HH:mm')}</span>
            <span>浏览: {topic.viewCount}</span>
            <span>回复: {topic.replyCount}</span>
          </div>
        </div>
        
        <div style={styles.topicContent}>
          {topic.content}
        </div>

        <div style={styles.topicActions}>
          {(isModerator() || isAdmin()) && (
            <>
              {isTopicLocked ? (
                <button style={styles.btn} onClick={() => handleModeratorAction('unlock')}>解锁</button>
              ) : (
                <button style={styles.btn} onClick={() => handleModeratorAction('lock')}>锁定</button>
              )}
              {topic.status === 'top' ? (
                <button style={styles.btn} onClick={() => handleModeratorAction('untop')}>取消置顶</button>
              ) : (
                <button style={styles.btn} onClick={() => handleModeratorAction('top')}>置顶</button>
              )}
              {topic.status === 'highlight' ? (
                <button style={styles.btn} onClick={() => handleModeratorAction('unhighlight')}>取消精华</button>
              ) : (
                <button style={styles.btn} onClick={() => handleModeratorAction('highlight')}>加精</button>
              )}
              <button style={{ ...styles.btn, ...styles.btnDanger }} onClick={() => handleModeratorAction('delete')}>删除</button>
            </>
          )}
        </div>
      </div>

      <div style={styles.replySection}>
        <div style={styles.replyHeader}>
          全部回复 ({pagination.total})
        </div>

        {replies.map((reply) => (
          <div key={reply.id} style={styles.replyItem}>
            <div style={styles.replyAvatar}>
              {reply.author?.nickname?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={styles.replyContent}>
              <div style={styles.replyHeaderInfo}>
                <span style={styles.replyAuthor}>
                  {reply.author?.nickname || reply.author?.username}
                </span>
                <span style={styles.replyTime}>
                  {dayjs(reply.createdAt).format('YYYY-MM-DD HH:mm')}
                </span>
              </div>
              <div style={styles.replyText}>{reply.content}</div>
              <div style={styles.replyActions}>
                <span style={styles.replyAction}>楼层 {reply.floor}</span>
                {isAuthenticated && !isTopicLocked && (
                  <span style={styles.replyAction}>回复</span>
                )}
                {(isModerator() || isAdmin()) && (
                  <span style={{ ...styles.replyAction, color: '#ff4d4f' }}>删除</span>
                )}
              </div>
              
              {reply.children?.length > 0 && reply.children.map((child) => (
                <div key={child.id} style={styles.childReply}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                    {child.author?.nickname || child.author?.username} 回复 
                    {child.parentReplyUsername && ` ${child.parentReplyUsername}`}
                    <span style={{ marginLeft: '8px' }}>
                      {dayjs(child.createdAt).format('MM-DD HH:mm')}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px' }}>{child.content}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {replies.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            暂无回复
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div style={styles.pagination}>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(page => page === 1 || page === pagination.totalPages || 
                Math.abs(page - pagination.page) <= 2)
              .map((page) => (
                <button
                  key={page}
                  style={{
                    ...styles.pageBtn,
                    ...(page === pagination.page ? styles.pageBtnActive : {})
                  }}
                  onClick={() => setPagination(p => ({ ...p, page }))}
                >
                  {page}
                </button>
              ))
            }
          </div>
        )}

        {isAuthenticated && !isTopicLocked ? (
          <div style={styles.replyForm}>
            <div style={{ fontWeight: '600', marginBottom: '12px' }}>发表回复</div>
            <textarea
              style={styles.replyTextarea}
              placeholder="请输入回复内容..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            <div style={styles.replySubmit}>
              <button
                style={{ ...styles.btn, ...styles.btnPrimary }}
                onClick={handleSubmitReply}
                disabled={submitting || !replyContent.trim()}
              >
                {submitting ? '提交中...' : '发表回复'}
              </button>
            </div>
          </div>
        ) : isTopicLocked ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            该主题已被锁定，无法回复
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <Link to="/login" style={{ color: '#667eea' }}>登录</Link> 后发表回复
          </div>
        )}
      </div>
    </div>
  );
}

export default Topic;
