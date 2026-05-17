import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useToastStore } from '../store';

const Record = () => {
  const [recording, setRecording] = useState(false);
  const navigate = useNavigate();
  const isLogin = useAuthStore((state) => state.isLogin);
  const showToast = useToastStore((state) => state.showToast);

  const handleRecord = () => {
    if (!isLogin) {
      showToast('请先登录');
      navigate('/login');
      return;
    }
    setRecording(!recording);
    showToast(recording ? '录制已暂停' : '开始录制');
  };

  return (
    <div className="record-page">
      <div className="record-preview">
        <div style={{ color: '#666', fontSize: '14px' }}>
          {recording ? '🎥 录制中...' : '点击下方按钮开始录制'}
        </div>
      </div>
      
      <div className="record-controls">
        <div className="side-tool">
          <div className="side-tool-icon">🎵</div>
          <span>音乐</span>
        </div>
        
        <div className="side-tool">
          <div className="side-tool-icon">✨</div>
          <span>特效</span>
        </div>
        
        <div 
          className={`record-btn ${recording ? 'recording' : ''}`}
          onClick={handleRecord}
        />
        
        <div className="side-tool">
          <div className="side-tool-icon">📷</div>
          <span>滤镜</span>
        </div>
        
        <div className="side-tool">
          <div className="side-tool-icon">⏱️</div>
          <span>倒计时</span>
        </div>
      </div>
    </div>
  );
};

export default Record;
