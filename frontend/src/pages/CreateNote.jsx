import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createNote } from '../api/notes';
import { showSuccess } from '../utils/request';
import './CreateNote.css';

const CreateNote = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const topicId = location.state?.topicId;
  const topicName = location.state?.topicName;

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    images: '',
    type: 'image',
    topic_id: topicId || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const images = formData.images
        ? formData.images.split('\n').filter((url) => url.trim())
        : [];

      await createNote({
        ...formData,
        topic_id: formData.topic_id || undefined,
        images: JSON.stringify(images),
      });

      showSuccess('发布成功');
      navigate('/');
    } catch (err) {
      console.error('Create note error:', err);
    }
  };

  return (
    <div className="create-page">
      <form onSubmit={handleSubmit}>
        <div className="create-header">
          <button type="button" className="back-btn" onClick={() => navigate(-1)}>
            ← 取消
          </button>
          <h1>发布笔记</h1>
          <button type="submit" className="submit-btn">
            发布
          </button>
        </div>

        <div className="create-form">
          {topicName && (
            <div className="topic-tag">
              <span>话题：{topicName}</span>
            </div>
          )}

          <div className="form-group">
            <label>标题 *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="请输入笔记标题"
            />
          </div>

          <div className="form-group">
            <label>内容</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="请输入笔记内容"
              rows={6}
            />
          </div>

          <div className="form-group">
            <label>图片URL</label>
            <textarea
              name="images"
              value={formData.images}
              onChange={handleChange}
              placeholder="每行输入一个图片URL (例如: https://picsum.photos/400/400?random=1)"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>类型</label>
            <div className="type-options">
              <label className="type-option">
                <input
                  type="radio"
                  name="type"
                  value="image"
                  checked={formData.type === 'image'}
                  onChange={handleChange}
                />
                <span>图文</span>
              </label>
              <label className="type-option">
                <input
                  type="radio"
                  name="type"
                  value="video"
                  checked={formData.type === 'video'}
                  onChange={handleChange}
                />
                <span>视频</span>
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateNote;
