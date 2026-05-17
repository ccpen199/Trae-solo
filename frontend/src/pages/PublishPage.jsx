import { useState } from 'react';
import { Upload, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { videoAPI } from '../utils/api';
import useUserStore from '../store/userStore';
import useToastStore from '../store/toastStore';
import LoginModal from '../components/LoginModal';

export default function PublishPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { isLoggedIn } = useUserStore();
  const { show } = useToastStore();

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    if (!videoUrl) {
      show('请上传视频');
      return;
    }

    setSubmitting(true);
    try {
      const res = await videoAPI.create({
        title,
        description,
        video_url: videoUrl,
        cover_url: coverUrl
      });
      if (res.success) {
        show('发布成功');
        navigate('/');
      }
    } catch (err) {
      show(err.message || '发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectDemo = () => {
    setVideoUrl('https://www.w3schools.com/html/mov_bbb.mp4');
    setCoverUrl('https://picsum.photos/400/700');
    show('已选择示例视频');
  };

  return (
    <div className="page-container" style={{ background: '#000', padding: '20px 16px' }}>
      <div className="publish-header">
        <h1 className="publish-title">发布作品</h1>
        <button 
          className="publish-btn" 
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '发布中...' : '发布'}
        </button>
      </div>

      <div className="publish-form">
        <div className="form-group">
          <label className="form-label">视频</label>
          {videoUrl ? (
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
              <video 
                src={videoUrl} 
                style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover' }} 
                controls 
              />
              <button 
                onClick={handleSelectDemo}
                style={{ 
                  position: 'absolute', 
                  top: '8px', 
                  right: '8px',
                  padding: '6px 12px',
                  background: '#fe2c55',
                  borderRadius: '16px',
                  fontSize: '12px',
                  color: '#fff'
                }}
              >
                更换视频
              </button>
            </div>
          ) : (
            <div className="upload-area" onClick={handleSelectDemo}>
              <Upload size={48} className="upload-icon" />
              <p className="upload-text">点击选择示例视频</p>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">标题</label>
          <input
            className="form-input"
            placeholder="添加标题"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">描述</label>
          <textarea
            className="form-textarea"
            placeholder="添加作品描述"
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
      </div>

      <LoginModal visible={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}
