import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wordbookAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';

function Wordbook() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadWords();
    }
  }, [user]);

  const loadWords = async () => {
    try {
      setLoading(true);
      const res = await wordbookAPI.getList({ limit: 50, offset: 0 });
      if (res.data.success) {
        setWords(res.data.data.words || []);
        setTotal(res.data.data.total || 0);
      }
    } catch (error) {
      console.error('Load words failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await wordbookAPI.deleteWord(id);
      if (res.data.success) {
        showToast('删除成功');
        loadWords();
      }
    } catch (error) {
      showToast('删除失败，请重试');
    }
  };

  const handleStudy = () => {
    if (words.length === 0) {
      showToast('单词本暂无单词');
      return;
    }
    showToast('背单词功能开发中');
  };

  if (!user) {
    return (
      <div className="empty-container">
        <p>请先登录查看单词本</p>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>
          去登录
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>📚 我的单词本</h3>
        <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          共 {total} 个单词
        </span>
      </div>

      {words.length > 0 && (
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: 16 }}
          onClick={handleStudy}
        >
          🎯 开始背单词
        </button>
      )}

      {loading ? (
        <div className="loading-container">加载中...</div>
      ) : words.length === 0 ? (
        <div className="empty-container">
          <p>单词本空空如也</p>
          <p style={{ fontSize: 14, marginBottom: 16 }}>去翻译页面收藏单词吧</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            去翻译
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {words.map((word) => (
            <div key={word.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                    {word.word}
                  </div>
                  {word.phonetic && (
                    <div style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 8 }}>
                      {word.phonetic}
                    </div>
                  )}
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    {word.meaning}
                  </div>
                </div>
                <button
                  className="btn btn-outline"
                  style={{ padding: '4px 8px', fontSize: 12 }}
                  onClick={() => handleDelete(word.id)}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Wordbook;
