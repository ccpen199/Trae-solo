import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Music, Upload, Camera, Zap, Sparkles } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import useUserStore from '../store/userStore';
import { videoAPI } from '../services/api';

const CapturePage = () => {
  const [mode, setMode] = useState('video');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100%',
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <p style={{ color: '#fff', marginBottom: '20px' }}>登录后才能发布视频</p>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '12px 32px',
            background: '#fe2c55',
            border: 'none',
            borderRadius: '24px',
            color: '#fff',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          去登录
        </button>
        <BottomNav />
      </div>
    );
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('请选择视频文件');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('title', title);
      formData.append('description', description);

      await videoAPI.upload(formData);

      alert('发布成功！');
      setSelectedFile(null);
      setPreviewUrl(null);
      setTitle('');
      setDescription('');
      navigate('/');
    } catch (error) {
      alert('发布失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const modes = [
    { id: 'photo', icon: Camera, label: '拍照' },
    { id: 'video', icon: Video, label: '拍15秒' },
    { id: 'video60', icon: Video, label: '拍60秒' }
  ];

  const tools = [
    { icon: Music, label: '音乐', color: '#fe2c55' },
    { icon: Zap, label: '特效', color: '#25f4ee' },
    { icon: Sparkles, label: '滤镜', color: '#ffd700' }
  ];

  return (
    <div style={{ minHeight: '100%', background: '#000', paddingBottom: '80px' }}>
      <div style={{
        position: 'relative',
        height: '60vh',
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {previewUrl ? (
          <video
            ref={videoRef}
            src={previewUrl}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            controls
            muted
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#666' }}>
            <Video size={64} style={{ marginBottom: '16px' }} />
            <p>点击下方按钮上传视频</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        padding: '20px',
        borderBottom: '1px solid #333'
      }}>
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              color: mode === m.id ? '#fe2c55' : '#999',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <m.icon size={24} />
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '40px',
        padding: '30px 20px',
        alignItems: 'center'
      }}>
        {tools.map((tool, index) => (
          <button
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <tool.icon size={24} color={tool.color} />
            </div>
            <span>{tool.label}</span>
          </button>
        ))}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '30px',
        padding: '20px',
        alignItems: 'center'
      }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Upload size={24} />
          </div>
          <span>上传</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fe2c55, #ff6b6b)',
            border: '4px solid rgba(255,255,255,0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Video size={32} color="#fff" />
        </button>

        <div style={{ width: '48px' }} />
      </div>

      {previewUrl && (
        <div style={{ padding: '20px' }}>
          <input
            type="text"
            placeholder="视频标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              marginBottom: '12px',
              background: '#1a1a1a',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <textarea
            placeholder="视频描述"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '12px 16px',
              marginBottom: '16px',
              background: '#1a1a1a',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              resize: 'none'
            }}
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              width: '100%',
              padding: '14px',
              background: '#fe2c55',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: uploading ? 'not-allowed' : 'pointer'
            }}
          >
            {uploading ? '发布中...' : '发布视频'}
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default CapturePage;
