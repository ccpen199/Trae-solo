import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dailyAPI } from '../utils/api';

function DailyReading() {
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadReading();
  }, []);

  const loadReading = async () => {
    try {
      const res = await dailyAPI.getReading();
      if (res.data.success) {
        setReading(res.data.data);
      }
    } catch (error) {
      console.error('Load reading failed:', error);
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

      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ color: 'var(--primary-color)', marginBottom: 8, textAlign: 'center' }}>
          📖 每日一读
        </h2>
        <div style={{ fontSize: 14, color: 'var(--text-light)', textAlign: 'center', marginBottom: 24 }}>
          {new Date().toLocaleDateString('zh-CN')}
        </div>

        <h3 style={{ marginBottom: 16, textAlign: 'center' }}>{reading?.title}</h3>

        {reading?.source && (
          <div style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: 14, marginBottom: 24 }}>
            来源：{reading.source}
          </div>
        )}

        <div
          style={{
            backgroundColor: '#f0f5ff',
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            lineHeight: 1.8
          }}
        >
          {reading?.content}
        </div>

        {reading?.translation && (
          <div
            style={{
              backgroundColor: '#fff7e6',
              borderRadius: 12,
              padding: 20,
              lineHeight: 1.8
            }}
          >
            <h4 style={{ margin: '0 0 8px 0' }}>中文翻译</h4>
            {reading.translation}
          </div>
        )}
      </div>
    </div>
  );
}

export default DailyReading;
