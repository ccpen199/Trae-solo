import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTopicDetail, followTopic } from '../api/topics';
import { getNotes } from '../api/notes';
import Loading, { EmptyState } from '../components/Loading';
import { showSuccess } from '../utils/request';
import './TopicDetail.css';

const TopicDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [sortType, setSortType] = useState('newest');

  const fetchTopicDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTopicDetail(id);
      setTopic(res.data);
    } catch (err) {
      setError(err.message || '获取话题详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      setNotesLoading(true);
      const res = await getNotes({ topic_id: id, sort: sortType, pageSize: 20 });
      setNotes(res.data?.list || []);
    } catch (err) {
      console.error('Get notes error:', err);
    } finally {
      setNotesLoading(false);
    }
  };

  useEffect(() => {
    fetchTopicDetail();
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchNotes();
    }
  }, [id, sortType]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFollow = async () => {
    if (followLoading) return;
    try {
      setFollowLoading(true);
      const res = await followTopic(id);
      setTopic((prev) => ({
        ...prev,
        is_followed: res.data?.followed ?? !prev?.is_followed
      }));
      showSuccess(res.data?.followed ? '关注成功' : '取消关注成功');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleParticipate = () => {
    navigate('/create', { state: { topicId: id, topicName: topic?.name } });
  };

  if (loading) {
    return <Loading message="加载中..." />;
  }

  if (error || !topic) {
    return (
      <div className="error-page">
        <p>{error || '话题不存在'}</p>
        <button onClick={fetchTopicDetail} className="retry-btn">重试</button>
      </div>
    );
  }

  return (
    <div className="topic-detail-page">
      <div className={`topic-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="header-content">
          {topic.background_image && (
            <div className="background-image">
              <img src={topic.background_image} alt="" />
            </div>
          )}
          <div className="topic-header-info">
            <h1 className="topic-title">{topic.name}</h1>
            {!isScrolled && (
              <>
                <p className="topic-description">{topic.description || '暂无描述'}</p>
                <div className="topic-meta">
                  <span className="meta-item">📝 {topic.note_count || 0} 笔记</span>
                  <span className="meta-item">👁️ {topic.view_count || 0} 浏览</span>
                </div>
              </>
            )}
            {isScrolled && (
              <div className="topic-meta-small">
                <span>{topic.note_count || 0} 笔记</span>
                <span>·</span>
                <span>{topic.view_count || 0} 浏览</span>
              </div>
            )}
          </div>
          {!isScrolled && (
            <div className="topic-actions">
              <button
                className={`follow-btn ${topic.is_followed ? 'followed' : ''}`}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? '处理中...' : topic.is_followed ? '已关注' : '+ 关注'}
              </button>
              <button className="participate-btn" onClick={handleParticipate}>
                立即参与
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="notes-section">
        <div className="sort-tabs">
          <button
            className={`sort-tab ${sortType === 'newest' ? 'active' : ''}`}
            onClick={() => setSortType('newest')}
          >
            最新
          </button>
          <button
            className={`sort-tab ${sortType === 'hot' ? 'active' : ''}`}
            onClick={() => setSortType('hot')}
          >
            最热
          </button>
          <button
            className={`sort-tab ${sortType === 'recommend' ? 'active' : ''}`}
            onClick={() => setSortType('recommend')}
          >
            推荐
          </button>
        </div>

        {notesLoading ? (
          <Loading />
        ) : notes.length === 0 ? (
          <EmptyState message="该话题下暂无笔记，快来发布第一条吧！" />
        ) : (
          <div className="notes-grid">
            {notes.map((note) => (
              <div 
                key={note.id} 
                className="note-card"
                onClick={() => console.log('Click note:', note.id)}
              >
                <div className="note-image">
                  {note.images?.[0] ? (
                    <img src={note.images[0]} alt="" />
                  ) : (
                    <div className="note-image-placeholder">📷</div>
                  )}
                  {note.type === 'video' && (
                    <span className="video-badge">▶️</span>
                  )}
                </div>
                <div className="note-content">
                  <h3 className="note-title">{note.title}</h3>
                  <div className="note-stats">
                    <span className="stat">❤️ {note.like_count || 0}</span>
                    <span className="stat">💬 {note.comment_count || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicDetail;
