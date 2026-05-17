import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, Flashlight, Text, X } from 'lucide-react';
import { cameraAPI } from '../utils/api';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';

const CameraPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState('photo');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [flashOn, setFlashOn] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('mode', mode);

      const response = await cameraAPI.uploadImage(formData);
      if (response.data.success) {
        setResult(response.data.data);
        showSuccess('识别成功');
      }
    } catch (err) {
      showError('识别失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'black' }}>
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <X size={24} color="white" />
        </button>
        <h2 style={{ color: 'white', fontSize: 16, fontWeight: 600 }}>拍照翻译</h2>
        <div style={{ width: 24 }} />
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        minHeight: '60vh'
      }}>
        <div
          onClick={triggerFileSelect}
          style={{
            width: 200,
            height: 200,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: '2px dashed rgba(255,255,255,0.3)'
          }}
        >
          <Camera size={48} color="white" style={{ marginBottom: 12 }} />
          <p style={{ color: 'white', fontSize: 14 }}>点击拍照或上传图片</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      <div style={{
        position: 'fixed',
        bottom: 100,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: 20,
        padding: '0 20px'
      }}>
        <button
          onClick={() => setMode('photo')}
          style={{
            padding: '12px 20px',
            borderRadius: 20,
            border: 'none',
            backgroundColor: mode === 'photo' ? '#007AFF' : 'rgba(255,255,255,0.2)',
            color: 'white',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          拍照翻译
        </button>
        <button
          onClick={() => setMode('ar')}
          style={{
            padding: '12px 20px',
            borderRadius: 20,
            border: 'none',
            backgroundColor: mode === 'ar' ? '#007AFF' : 'rgba(255,255,255,0.2)',
            color: 'white',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          AR翻译
        </button>
        <button
          onClick={() => setMode('word')}
          style={{
            padding: '12px 20px',
            borderRadius: 20,
            border: 'none',
            backgroundColor: mode === 'word' ? '#007AFF' : 'rgba(255,255,255,0.2)',
            color: 'white',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          取词
        </button>
      </div>

      <div style={{
        position: 'fixed',
        bottom: 30,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: 40
      }}>
        <button
          onClick={() => setFlashOn(!flashOn)}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: flashOn ? '#FF9500' : 'rgba(255,255,255,0.2)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Flashlight size={24} color="white" />
        </button>
        <button
          onClick={triggerFileSelect}
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: 'white',
            border: '4px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Camera size={32} color="black" />
        </button>
        <button
          onClick={() => {
            fileInputRef.current?.removeAttribute('capture');
            fileInputRef.current?.click();
          }}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Upload size={24} color="white" />
        </button>
      </div>

      {loading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <Loading message="识别中..." />
        </div>
      )}

      {result && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'white',
          zIndex: 1000,
          overflowY: 'auto'
        }}>
          <div style={{
            padding: 16,
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ fontSize: 18 }}>识别结果</h2>
            <button onClick={() => setResult(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
              <X size={24} color="#666" />
            </button>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{
              backgroundColor: '#f5f5f7',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16
            }}>
              <h3 style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>原文</h3>
              <p style={{ fontSize: 16, color: '#333' }}>{result.source_text}</p>
            </div>
            <div style={{
              backgroundColor: '#007AFF15',
              borderRadius: 12,
              padding: 16
            }}>
              <h3 style={{ fontSize: 14, color: '#007AFF', marginBottom: 8 }}>译文</h3>
              <p style={{ fontSize: 16, color: '#333' }}>{result.target_text}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraPage;
