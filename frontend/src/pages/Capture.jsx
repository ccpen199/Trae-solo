import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import request, { showToast } from '../utils/request';

function Capture() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('video');
  const [recording, setRecording] = useState(false);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState('');
  const [publishing, setPublishing] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: mode === 'video' 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      showToast('无法访问摄像头');
    }
  };

  React.useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [mode]);

  const capturePhoto = () => {
    if (mode === 'photo' && videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      setPreview(canvas.toDataURL('image/jpeg'));
    } else {
      setPreview('https://picsum.photos/300/400');
    }
  };

  const toggleRecording = () => {
    if (recording) {
      setRecording(false);
      setPreview('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
    } else {
      setRecording(true);
      setTimeout(() => {
        setRecording(false);
        setPreview('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
      }, 3000);
    }
  };

  const publish = async () => {
    if (!preview) {
      showToast('请先拍摄内容');
      return;
    }

    setPublishing(true);
    try {
      const res = await request.post('/moments', {
        type: mode === 'video' ? 1 : 0,
        mediaUrl: preview,
        description
      });
      
      if (res?.success) {
        showToast('发布成功');
        navigate('/world');
      } else {
        showToast(res?.message || '发布失败');
      }
    } catch (e) {
      showToast('发布失败');
    } finally {
      setPublishing(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setDescription('');
  };

  if (preview) {
    return (
      <div style={{ height: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ cursor: 'pointer', color: '#fff', fontSize: 20 }} onClick={reset}>
            ✕
          </div>
          <div style={{ color: '#fff' }}>预览</div>
          <div style={{ width: 20 }}></div>
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          {mode === 'video' ? (
            <video
              src={preview}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              autoPlay
              loop
              muted
            />
          ) : (
            <img
              src={preview}
              alt="preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.6))'
          }}>
            <input
              type="text"
              placeholder="分享此刻心情..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: 12,
                border: 'none',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.9)',
                fontSize: 14,
                outline: 'none'
              }}
              maxLength={100}
            />
          </div>
        </div>

        <div style={{ padding: 24, display: 'flex', justifyContent: 'center', gap: 24 }}>
          <button
            className="btn"
            onClick={reset}
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '12px 32px' }}
          >
            重拍
          </button>
          <button
            className="btn btn-primary"
            onClick={publish}
            disabled={publishing}
            style={{ padding: '12px 48px' }}
          >
            {publishing ? '发布中...' : '发布'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ cursor: 'pointer', color: '#fff', fontSize: 20 }} onClick={() => navigate(-1)}>
          ←
        </div>
        <div style={{ display: 'flex', gap: 16, color: '#fff', fontSize: 14 }}>
          <span
            style={{ 
              cursor: 'pointer',
              fontWeight: mode === 'video' ? 600 : 400,
              opacity: mode === 'video' ? 1 : 0.6
            }}
            onClick={() => setMode('video')}
          >
            视频
          </span>
          <span
            style={{ 
              cursor: 'pointer',
              fontWeight: mode === 'photo' ? 600 : 400,
              opacity: mode === 'photo' ? 1 : 0.6
            }}
            onClick={() => setMode('photo')}
          >
            照片
          </span>
        </div>
        <div style={{ cursor: 'pointer', color: '#fff', fontSize: 20 }}>⚡</div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        
        {recording && (
          <div style={{
            position: 'absolute',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#fff',
            background: 'rgba(0,0,0,0.5)',
            padding: '8px 16px',
            borderRadius: 20
          }}>
            <span style={{ color: '#ff4757', animation: 'pulse 1s infinite' }}>●</span>
            <span>录制中...</span>
          </div>
        )}
      </div>

      <div style={{ padding: 40, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: recording ? '#ff4757' : '#fff',
            border: `6px solid ${recording ? '#ff4757' : 'rgba(255,255,255,0.3)'}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s'
          }}
          onClick={mode === 'video' ? toggleRecording : capturePhoto}
        >
          {recording && (
            <div style={{ width: 24, height: 24, background: '#fff', borderRadius: 4 }}></div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Capture;
