import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useUserStore from '../store/userStore';
import { boardAPI, topicAPI, categoryAPI } from '../utils/api';

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  card: {
    background: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '24px',
    color: '#333'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#555',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none'
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    background: 'white'
  },
  textarea: {
    width: '100%',
    minHeight: '200px',
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    resize: 'vertical',
    outline: 'none'
  },
  btnGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  btn: {
    padding: '12px 32px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  },
  btnCancel: {
    background: '#f5f5f5',
    color: '#666'
  },
  btnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed'
  },
  error: {
    background: '#fff0f0',
    color: '#d93025',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  hint: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px'
  }
};

function CreateTopic() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useUserStore();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    boardId: searchParams.get('boardId') || '',
    title: '',
    content: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data.data || []);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.boardId) {
      setError('请选择版块');
      return;
    }
    if (!form.title.trim()) {
      setError('请输入标题');
      return;
    }
    if (!form.content.trim()) {
      setError('请输入内容');
      return;
    }

    setSubmitting(true);
    try {
      const response = await topicAPI.create({
        boardId: form.boardId,
        title: form.title,
        content: form.content
      });
      navigate(`/topic/${response.data.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || '发布失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const availableBoards = [];
  categories.forEach(cat => {
    if (cat.boards?.length > 0) {
      cat.boards.forEach(board => {
        availableBoards.push({
          ...board,
          categoryName: cat.name
        });
      });
    }
  });

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>发布新主题</h2>
        
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>选择版块 *</label>
            <select
              style={styles.select}
              value={form.boardId}
              onChange={(e) => setForm({ ...form, boardId: e.target.value })}
            >
              <option value="">请选择版块</option>
              {categories.map(cat => (
                <optgroup key={cat.id} label={cat.name}>
                  {cat.boards?.map(board => (
                    <option key={board.id} value={board.id}>
                      {board.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>标题 *</label>
            <input
              type="text"
              style={styles.input}
              placeholder="请输入标题（2-200个字符）"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={200}
            />
            <div style={styles.hint}>
              已输入 {form.title.length}/200 个字符
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>内容 *</label>
            <textarea
              style={styles.textarea}
              placeholder="请输入内容（至少10个字符）"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            <div style={styles.hint}>
              已输入 {form.content.length} 个字符
            </div>
          </div>

          <div style={styles.btnGroup}>
            <button
              type="button"
              style={{ ...styles.btn, ...styles.btnCancel }}
              onClick={() => navigate(-1)}
            >
              取消
            </button>
            <button
              type="submit"
              style={{ 
                ...styles.btn, 
                ...styles.btnPrimary,
                ...(submitting ? styles.btnDisabled : {})
              }}
              disabled={submitting}
            >
              {submitting ? '发布中...' : '发布'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTopic;
