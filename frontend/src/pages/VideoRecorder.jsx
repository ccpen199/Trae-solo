import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

function VideoRecorder() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      alert('无法访问摄像头，请确保已授权摄像头权限');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const startRecording = async () => {
    if (!cameraActive) {
      await startCamera();
    }

    if (!mediaStreamRef.current) return;

    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(mediaStreamRef.current, {
      mimeType: 'video/webm'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedVideo({ url, blob });
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);

    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    stopCamera();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const reRecord = () => {
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo.url);
    }
    setRecordedVideo(null);
    setRecordingTime(0);
  };

  const uploadVideo = async () => {
    if (!recordedVideo || !videoTitle) {
      alert('请填写视频标题');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', recordedVideo.blob, 'resume.webm');
      formData.append('title', videoTitle);
      formData.append('description', videoDescription);
      formData.append('type', user?.role === 'company' ? 'job' : 'resume');

      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        alert('视频上传成功，等待审核');
        navigate(user?.role === 'company' ? '/company/dashboard' : '/jobseeker/dashboard');
      } else {
        const data = await response.json();
        alert(data.error || '上传失败');
      }
    } catch (err) {
      alert('上传失败');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div className="page-header">
        <h1 className="page-title">视频录制</h1>
        <p className="page-subtitle">录制您的个人视频简历</p>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-body">
            <div style={{ 
              position: 'relative',
              width: '100%',
              aspectRatio: '16/9',
              background: '#000',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              {recordedVideo ? (
                <video 
                  src={recordedVideo.url} 
                  controls 
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    transform: 'scaleX(-1)'
                  }}
                />
              )}

              {isRecording && (
                <div style={{ 
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  color: 'white'
                }}>
                  <div style={{ 
                    width: '10px', 
                    height: '10px', 
                    background: '#ef4444',
                    borderRadius: '50%',
                    animation: 'pulse 1s infinite'
                  }} />
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    {formatTime(recordingTime)}
                  </span>
                </div>
              )}

              {!cameraActive && !recordedVideo && (
                <div style={{ 
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '16px'
                }}>
                  点击下方按钮开启摄像头
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              {!recordedVideo ? (
                <>
                  {!isRecording ? (
                    <button 
                      className="btn btn-primary btn-lg"
                      onClick={startRecording}
                      style={{ gap: '8px' }}
                    >
                      ⏺ 开始录制
                    </button>
                  ) : (
                    <button 
                      className="btn btn-danger btn-lg"
                      onClick={stopRecording}
                      style={{ gap: '8px' }}
                    >
                      ⏹ 停止录制
                    </button>
                  )}
                  {cameraActive && !isRecording && (
                    <button 
                      className="btn btn-secondary btn-lg"
                      onClick={stopCamera}
                    >
                      关闭摄像头
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button 
                    className="btn btn-outline btn-lg"
                    onClick={reRecord}
                  >
                    重新录制
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
              视频信息
            </h3>

            {recordedVideo ? (
              <>
                <div className="form-group">
                  <label className="form-label">视频标题 *</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="如：前端开发工程师自我介绍"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">视频描述</label>
                  <textarea 
                    className="form-input form-textarea"
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    placeholder="简要介绍视频内容..."
                  />
                </div>

                <div style={{ 
                  padding: '16px', 
                  background: '#f0fdf4', 
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '14px', color: '#166534', fontWeight: '500' }}>
                    ✓ 录制完成
                  </div>
                  <div style={{ fontSize: '13px', color: '#22c55e' }}>
                    时长: {formatTime(recordingTime)}
                  </div>
                </div>

                <button 
                  className="btn btn-primary w-full btn-lg"
                  onClick={uploadVideo}
                  disabled={uploading}
                >
                  {uploading ? '上传中...' : '提交审核'}
                </button>
              </>
            ) : (
              <div style={{ 
                padding: '40px 20px', 
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📹</div>
                <p style={{ marginBottom: '16px' }}>
                  完成录制后在此填写视频信息
                </p>
                <div style={{ 
                  textAlign: 'left', 
                  fontSize: '13px', 
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                    录制建议：
                  </div>
                  <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                    <li>保持光线充足，面部清晰可见</li>
                    <li>环境安静，语音清晰</li>
                    <li>时长建议 30-90 秒</li>
                    <li>介绍个人优势和求职意向</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoRecorder;
