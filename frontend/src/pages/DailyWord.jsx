import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dailyAPI } from '../utils/api';

function DailyWord() {
  const [word, setWord] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadWord();
  }, []);

  const loadWord = async () => {
    try {
      const res = await dailyAPI.getWord();
      if (res.data.success) {
        setWord(res.data.data);
      }
    } catch (error) {
      console.error('Load word failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container">加载中...</div>;
  }

  return (
    <div style={{ padding: 16 }}>
      <button
        className="btn btn-outline"
        style={{ marginBottom: 16 }}
        onClick={() => navigate('/')}
      >
        ← 返回
      </button>

      <div className="card" style={{ textAlign: 'center', padding: 32 }}>
        <h2 style={{ color: 'var(--primary-color)', marginBottom: 8 }}>
          📚 每日热词
        </h2>
        <div style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 24 }}>
          {new Date().toLocaleDateString('zh-CN')}
        </div>

        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>
          {word?.word}
        </h1>
        <div style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 24 }}>
          {word?.phonetic}
        </div>

        <div
          style={{
            backgroundColor: '#f0f5ff',
            borderRadius: 12,
            padding: 20,
            marginBottom: 16
          }}
        >
          <h4 style={{ margin: '0 0 8px 0' }}>释义</h4>
          <p style={{ fontSize: 18, margin: 0 }}>{word?.meaning}</p>
        </div>

        {word?.example && (
          <div
            style={{
              backgroundColor: '#f6ffed',
              borderRadius: 12,
              padding: 20
            }}
          >
            <h4 style={{ margin: '0 0 8px 0' }}>例句</h4>
            <p style={{ fontSize: 16, margin: '0 0 8px 0', fontStyle: 'italic' }}>
              {word.example}
            </p>
            {word.example_translation && (
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                {word.example_translation}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DailyWord;
