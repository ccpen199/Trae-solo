import React, { useEffect } from 'react';
import { useDailyStore } from '../store';
import { dailyAPI } from '../services/api';

function DailyPage() {
  const { quote, loading, offline, setQuote, setLoading, setOffline } = useDailyStore();

  useEffect(() => {
    fetchDailyQuote();
  }, []);

  const fetchDailyQuote = async () => {
    setLoading(true);
    try {
      const response = await dailyAPI.getToday();
      setQuote(response.data.quote);
      setOffline(false);
    } catch (error) {
      setOffline(true);
      setQuote({
        id: 0,
        content: '保持内心的平静，即使在喧嚣中也能找到安宁。',
        author: '潮汐',
        likes: 0,
        shares: 0,
        color: '#6B7C93'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!quote || offline) return;
    try {
      await dailyAPI.like(quote.id);
      setQuote({ ...quote, likes: quote.likes + 1 });
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const handleShare = async () => {
    if (!quote || offline) return;
    try {
      await dailyAPI.share(quote.id);
      setQuote({ ...quote, shares: quote.shares + 1 });
      alert('分享成功！');
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>加载中...</p>
      </div>
    );
  }

  return (
    <div 
      className="page-container fade-in" 
      style={{ 
        minHeight: '100vh', 
        background: quote?.color || 'var(--primary-color)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }}
    >
      <div style={{ maxWidth: '80%' }}>
        <p style={{ fontSize: '28px', fontWeight: 300, lineHeight: 1.6, marginBottom: 24 }}>
          "{quote?.content}"
        </p>
        <p style={{ fontSize: '16px', opacity: 0.8 }}>
          —— {quote?.author}
        </p>
      </div>

      {offline && (
        <div style={{ marginTop: 40, padding: '12px 24px', background: 'rgba(255,255,255,0.2)', borderRadius: 20, fontSize: 14 }}>
          🔌 离线模式
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 100, display: 'flex', gap: 40 }}>
        <button 
          onClick={handleLike}
          style={{ 
            background: 'none', 
            color: 'white', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 8,
            fontSize: 14
          }}
        >
          <span style={{ fontSize: 24 }}>❤️</span>
          <span>{quote?.likes || 0}</span>
        </button>
        <button 
          onClick={handleShare}
          style={{ 
            background: 'none', 
            color: 'white', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 8,
            fontSize: 14
          }}
        >
          <span style={{ fontSize: 24 }}>📤</span>
          <span>{quote?.shares || 0}</span>
        </button>
      </div>
    </div>
  );
}

export default DailyPage;
