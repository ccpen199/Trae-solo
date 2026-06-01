import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postAPI } from '../api';

const CreatePost = () => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      await postAPI.createPost({
        content,
        images: images.length > 0 ? images : null
      });
      navigate('/home');
    } catch (error) {
      console.error('发布失败', error);
      alert('发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="header">
        <span style={{ cursor: 'pointer' }} onClick={() => navigate(-1)}>←</span>
        <h1>发布动态</h1>
        <span></span>
      </div>

      <div className="container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享你的想法..."
              rows={6}
              required
            />
          </div>

          <div className="mb-4">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666' }}>图片（最多3张）</label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {[0, 1, 2].map(idx => (
                <div
                  key={idx}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '12px',
                    border: '2px dashed #ddd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    cursor: 'pointer'
                  }}
                >
                  +
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            disabled={loading || !content.trim()}
          >
            {loading ? '发布中...' : '发布'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
