import { useState, useEffect } from 'react';
import { Search, TrendingUp, Play } from 'lucide-react';
import { searchAPI, videoAPI } from '../utils/api';
import useToastStore from '../store/toastStore';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

export default function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const [hotSearches, setHotSearches] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { show } = useToastStore();

  useEffect(() => {
    loadHotSearches();
  }, []);

  const loadHotSearches = async () => {
    try {
      const res = await searchAPI.getHot();
      if (res.success && res.data?.list) {
        setHotSearches(res.data.list);
      }
    } catch (err) {
      console.error('Load hot searches error:', err);
    }
  };

  const handleSearch = async () => {
    if (!keyword.trim()) {
      show('请输入搜索关键词');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchAPI.searchVideos(keyword.trim());
      if (res.success) {
        setResults(res.data.list || []);
      }
    } catch (err) {
      show(err.message || '搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const handleHotClick = (item) => {
    setKeyword(item.keyword);
    handleSearch();
  };

  const formatCount = (num) => {
    if (!num) return '0';
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <div className="page-container" style={{ background: '#000', padding: '60px 16px 80px' }}>
      <div className="search-input-box">
        <Search size={20} color="#999" />
        <input
          className="search-input"
          placeholder="搜索视频、用户..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} style={{ color: '#fe2c55' }}>搜索</button>
      </div>

      {loading ? (
        <Loading />
      ) : searched ? (
        results.length === 0 ? (
          <EmptyState message="没有找到相关视频" />
        ) : (
          <div className="search-results">
            {results.map(video => (
              <div key={video.id} className="video-card">
                <img 
                  className="video-cover" 
                  src={video.cover_url || `https://picsum.photos/300/500?random=${video.id}`} 
                  alt="" 
                />
                <div className="video-card-info">
                  <div className="video-card-views">
                    <Play size={14} />
                    <span>{formatCount(video.views_count)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="hot-searches">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <TrendingUp size={20} color="#fe2c55" />
            <h3 style={{ marginLeft: '8px', marginBottom: 0 }}>热搜榜</h3>
          </div>
          {hotSearches.slice(0, 10).map((item, index) => (
            <div 
              key={index} 
              className="hot-item" 
              onClick={() => handleHotClick(item)}
            >
              <span className={`hot-rank ${index < 3 ? 'top' : ''}`}>{index + 1}</span>
              <span className="hot-keyword">{item.keyword}</span>
              <span className="hot-count">{formatCount(item.count)}</span>
              {item.is_hot && <span className="hot-tag">热</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
