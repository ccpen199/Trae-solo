import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../api';
import { useToastStore } from '../store';

const Search = () => {
  const [keyword, setKeyword] = useState('');
  const [hotSearches, setHotSearches] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    loadHotSearches();
    
    const handleSearchKeyword = (event) => {
      const keyword = event.detail;
      if (keyword) {
        setKeyword(keyword);
        handleSearchWithKeyword(keyword);
      }
    };
    
    window.addEventListener('searchKeyword', handleSearchKeyword);
    return () => window.removeEventListener('searchKeyword', handleSearchKeyword);
  }, []);

  const handleSearchWithKeyword = async (searchKeyword) => {
    try {
      setLoading(true);
      const res = await searchAPI.search({ keyword: searchKeyword, type: 'video' });
      setResults(res.data.data?.videos || []);
      setHasSearched(true);
    } catch (err) {
      showToast('搜索失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const loadHotSearches = async () => {
    try {
      const res = await searchAPI.getHotSearches();
      setHotSearches(res.data.data || []);
    } catch (err) {
      console.error('Load hot searches error:', err);
    }
  };

  const handleSearch = async () => {
    if (!keyword.trim()) {
      showToast('请输入搜索关键词');
      return;
    }

    try {
      setLoading(true);
      const res = await searchAPI.search({ keyword, type: 'video' });
      setResults(res.data.data?.videos || []);
      setHasSearched(true);
    } catch (err) {
      showToast('搜索失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleHotClick = (item) => {
    setKeyword(item.keyword);
    setLoading(true);
    searchAPI.search({ keyword: item.keyword, type: 'video' })
      .then(res => {
        setResults(res.data.data?.videos || []);
        setHasSearched(true);
      })
      .catch(() => showToast('搜索失败'))
      .finally(() => setLoading(false));
  };

  const formatCount = (count) => {
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + 'w';
    }
    return count?.toString() || '0';
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <input
          className="search-input"
          placeholder="搜索视频、用户"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          autoFocus
        />
        <span className="search-cancel" onClick={() => navigate(-1)}>取消</span>
      </div>

      {loading ? (
        <div className="loading">搜索中...</div>
      ) : hasSearched ? (
        <div className="search-results">
          {results.length === 0 ? (
            <div className="empty-state">没有找到相关视频</div>
          ) : (
            results.map(video => (
              <div key={video.id} className="video-card">
                <img src={video.cover_url} alt="" />
                <div className="video-info">
                  <div className="video-title">{video.title}</div>
                  <div className="video-author">@{video.nickname}</div>
                  <div className="video-stats">❤️ {formatCount(video.like_count)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="hot-search-list">
          <h2 className="hot-title">🔥 热门搜索</h2>
          {hotSearches.map((item, index) => (
            <div 
              key={item.id} 
              className="hot-item" 
              onClick={() => handleHotClick(item)}
            >
              <span className={`hot-rank ${index < 3 ? 'top' : ''}`}>{index + 1}</span>
              {item.is_hot && <span className="hot-tag">热</span>}
              <span className="hot-keyword">{item.keyword}</span>
              <span className="hot-count">{formatCount(item.search_count)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
