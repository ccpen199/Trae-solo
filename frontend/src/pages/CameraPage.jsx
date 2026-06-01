import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CameraPage = () => {
  const navigate = useNavigate();
  const [captured, setCaptured] = useState(false);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#000',
      position: 'relative'
    }}>
      {/* 预览区域 */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a2e'
      }}>
        {captured ? (
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>📸</div>
            <p style={{ fontSize: '1.25rem' }}>照片已拍摄</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>📷</div>
            <p style={{ fontSize: '1.25rem' }}>相机预览</p>
            <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>点击下方按钮拍摄</p>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: '2rem 1.5rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center'
        }}>
          {/* 登录按钮 */}
          <button
            onClick={() => navigate('/login')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'white',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem'
            }}>
              👤
            </div>
            <span style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>登录</span>
          </button>

          {/* 拍摄按钮 */}
          <button
            onClick={() => setCaptured(!captured)}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'white',
              border: '4px solid #9ca3af',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'white'
            }} />
          </button>

          {/* 滤镜按钮 */}
          <button
            onClick={() => navigate('/login')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'white',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem'
            }}>
              🎨
            </div>
            <span style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>滤镜</span>
          </button>
        </div>
      </div>

      {/* 返回首页按钮 */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          fontSize: '1.25rem',
          cursor: 'pointer'
        }}
      >
        ←
      </button>
    </div>
  );
};

export default CameraPage;
