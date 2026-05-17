import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFollowedTopics, getRecommendTopics } from '../api/topics';
import Loading, { EmptyState } from '../components/Loading';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('topics');
  const [followedTopics, setFollowedTopics] = useState([]);
  const [recommendTopics, setRecommendTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [followedRes, recommendRes] = await Promise.all([
        getFollowedTopics({ pageSize: 20 }),
        getRecommendTopics({ limit: 5 }),
      ]);
      setFollowedTopics(followedRes.data?.list || []);
      setRecommendTopics(recommendRes.data || []);
    } catch (err) {
      console.error('Get data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTopicClick = (topicId) => {
    navigate(`/topic/${topicId}`);
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="avatar">👤</div>
        <h1 className="username">我的</h1>
      </div>

      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'topics' ? 'active' : ''}`}
            onClick={() => setActiveTab('topics')}
          >
            关注的话题
          </button>
        </div>
      </div>

      <div className="content-section">
        {loading ? (
          <Loading />
        ) : (
          <>
            <div className="followed-topics">
              <h2 className="section-title">已关注话题</h2>
              {followedTopics.length === 0 ? (
                <EmptyState message="暂无关注的话题" />
              ) : (
                <div className="topics-list">
                  {followedTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className="topic-item"
                      onClick={() => handleTopicClick(topic.id)}
                    >
                      <div className="topic-info">
                        <h3 className="topic-name">{topic.name}</h3>
                        <p className="topic-meta">
                          {topic.note_count || 0} 笔记 · {topic.view_count || 0} 浏览
                        </p>
                      </div>
                      <span className="followed-badge">已关注</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="recommend-topics">
              <h2 className="section-title">推荐话题</h2>
              {recommendTopics.length === 0 ? (
                <EmptyState message="暂无推荐话题" />
              ) : (
                <div className="topics-list">
                  {recommendTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className="topic-item"
                      onClick={() => handleTopicClick(topic.id)}
                    >
                      <div className="topic-info">
                        <h3 className="topic-name">{topic.name}</h3>
                        <p className="topic-meta">
                          {topic.note_count || 0} 笔记 · {topic.view_count || 0} 浏览
                        </p>
                      </div>
                      <span className="recommend-badge">推荐</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
