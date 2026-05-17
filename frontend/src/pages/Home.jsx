import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { translationAPI, dailyAPI, wordbookAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';

function Home() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dailyData, setDailyData] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(true);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDaily();
  }, []);

  const loadDaily = async () => {
    try {
      setDailyLoading(true);
      const res = await dailyAPI.getAll();
      if (res.data.success) {
        setDailyData(res.data.data);
      }
    } catch (error) {
      console.error('Load daily failed:', error);
    } finally {
      setDailyLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      showToast('请输入要翻译的内容');
      return;
    }

    try {
      setLoading(true);
      const res = await translationAPI.translate(inputText.trim());
      if (res.data.success) {
        setResult(res.data.data);
      }
    } catch (error) {
      showToast('翻译失败，请重试');
      console.error('Translate failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoTranslate = () => {
    showToast('拍照翻译功能开发中');
  };

  const handleAddToWordbook = async () => {
    if (!result || !user) {
      if (!user) {
        showToast('请先登录');
        navigate('/login');
        return;
      }
      return;
    }

    try {
      await wordbookAPI.addWord({
        word: inputText.trim(),
        meaning: result.target_text
      });
      showToast('已添加到单词本');
    } catch (error) {
      showToast('添加失败，请重试');
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <div className="card">
        <textarea
          className="input"
          placeholder="请输入单词或句子进行翻译..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{ height: 120, resize: 'none', marginBottom: 12 }}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleTranslate}
            disabled={loading}
          >
            {loading ? '翻译中...' : '翻译'}
          </button>
          <button className="btn btn-outline" onClick={handlePhotoTranslate}>
            📷 拍照
          </button>
        </div>
      </div>

      {result && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 8 }}>
                {result.source_lang === 'en' ? 'English' : '中文'}
              </div>
              <div style={{ fontSize: 16, marginBottom: 16 }}>{result.source_text}</div>
              <div style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 8 }}>
                {result.target_lang === 'en' ? 'English' : '中文翻译'}
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--primary-color)' }}>
                {result.target_text}
              </div>
            </div>
            <button
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: 12 }}
              onClick={handleAddToWordbook}
            >
              ⭐ 收藏
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16, color: 'var(--text-color)' }}>每日学习计划</h3>
        
        {dailyLoading ? (
          <div className="loading-container">加载中...</div>
        ) : (
          <>
            <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/daily/word')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>📚 每日热词</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-color)' }}>
                    {dailyData?.word?.word}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    {dailyData?.word?.meaning}
                  </div>
                </div>
                <span style={{ color: 'var(--text-light)' }}>→</span>
              </div>
            </div>

            <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/daily/reading')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>📖 每日一读</div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>
                    {dailyData?.reading?.title}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                    {dailyData?.reading?.content?.slice(0, 50)}...
                  </div>
                </div>
                <span style={{ color: 'var(--text-light)' }}>→</span>
              </div>
            </div>

            <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/daily/movie')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>🎬 每日抖英</div>
                  <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
                    {dailyData?.movie?.movie_name}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14, fontStyle: 'italic' }}>
                    "{dailyData?.movie?.line?.slice(0, 30)}..."
                  </div>
                </div>
                <span style={{ color: 'var(--text-light)' }}>→</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Home;
