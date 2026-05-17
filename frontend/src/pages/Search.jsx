import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchTopics } from '../api/topics';
import Loading, { EmptyState } from '../components/Loading';
import './Search.css';

const Search = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTopics = async (searchKeyword = '') => {
    try {
      setLoading(true);
      setError(null);
      const res = await searchTopics({ keyword: searchKeyword, limit: 10 });
      setTopics(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || '获取话题列表失败，请重试');
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTopics(keyword);
  };

  const handleTopicClick = (topicId) => {
    navigate(`/topic/${topicId}`);
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="搜索话题..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">搜索</button>
        </form>
      </div>

      <div className="topics-section">
        <h2 className="section-title">
          {keyword ? `搜索结果: "${keyword}"` : '热门话题'}
        </h2>
        
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={() => fetchTopics(keyword)} className="retry-btn">重试</button>
          </div>
        ) : topics.length === 0 ? (
          <EmptyState message={keyword ? '未找到相关话题' : '暂无话题'} />
        ) : (
          <div className="topics-list">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="topic-card"
                onClick={() => handleTopicClick(topic.id)}
              >
                <div className="topic-info">
                  <h3 className="topic-name">{topic.name}</h3>
                  <p className="topic-desc">{topic.description || '暂无描述'}</p>
                  <div className="topic-stats">
                    <span className="stat-item">📝 {topic.note_count || 0} 笔记</span>
                    <span className="stat-item">👁️ {topic.view_count || 0} 浏览</span>
                  </div>
                </div>
                {topic.thumbnails?.length > 0 && (
                  <div className="topic-thumbnails">
                    {topic.thumbnails.slice(0, 3).map((img, idx) => (
                      <img key={idx} src={img} alt="" className="thumbnail-img" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
