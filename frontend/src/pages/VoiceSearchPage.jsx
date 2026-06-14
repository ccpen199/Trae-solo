import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { voiceAPI } from '../utils/api.js';

function VoiceSearchPage() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [loading, setLoading] = useState(false);

  const voiceExamples = [
    '附近奶茶店招人',
    '今天能上班的餐饮工作',
    '快递分拣员 3日内到岗',
    '便利店店员 包吃住',
    '火锅店里今天招人'
  ];

  const simulateVoiceRecognition = () => {
    setIsRecording(true);
    setTimeout(() => {
      const randomText = voiceExamples[Math.floor(Math.random() * voiceExamples.length)];
      setVoiceText(randomText);
      setIsRecording(false);
      handleSearch(randomText);
    }, 2000);
  };

  const handleSearch = async (text = voiceText) => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const res = await voiceAPI.search(text);
      const parsed = res.data.parsed_query;
      
      const params = new URLSearchParams();
      if (parsed.keyword) params.append('keyword', parsed.keyword);
      if (parsed.industry) params.append('industry', parsed.industry);
      if (parsed.arrival_time) params.append('arrival_time', parsed.arrival_time);
      if (parsed.min_salary) params.append('min_salary', parsed.min_salary);
      if (parsed.max_salary) params.append('max_salary', parsed.max_salary);
      
      params.append('voice_text', text);
      if (parsed.keyword) params.append('voice_keywords', parsed.keyword);
      if (parsed.location) params.append('voice_location', parsed.location);
      
      navigate(`/jobs?${params.toString()}`);
    } catch (err) {
      console.error('搜索失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>🎤 语音搜索</h1>

      <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
        <strong>💡 提示：</strong> 点击麦克风按钮说出您的求职需求，如"附近奶茶店招人"、"今天能上班的快递工作"等，
        系统将自动识别关键词、行业和到岗时间，为您精准匹配职位。
      </div>

      <div className="voice-search-box">
        <button
          className={`voice-btn ${isRecording ? 'recording' : ''}`}
          onClick={simulateVoiceRecognition}
          disabled={isRecording}
        >
          {isRecording ? '🔴' : '🎤'}
        </button>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            value={voiceText}
            onChange={(e) => setVoiceText(e.target.value)}
            placeholder="点击麦克风说话，或手动输入搜索内容..."
            style={{ marginBottom: '0.5rem' }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          {isRecording && (
            <div className="success-text">
              🎙️ 正在录音... 请说出您的求职需求
            </div>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => handleSearch()} disabled={loading || isRecording}>
          🔍 搜索
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>试试这些：</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {voiceExamples.map((ex, idx) => (
            <button
              key={idx}
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setVoiceText(ex);
                handleSearch(ex);
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="empty-state">
          <div>🎙️</div>
          <p>正在解析您的语音搜索...</p>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem' }}>
            正在识别关键词、行业、到岗时间...
          </p>
        </div>
      )}

      {!loading && (
        <div className="alert alert-info">
          <strong>💡 使用说明：</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
            <li>点击麦克风按钮开始语音输入，或直接在输入框打字</li>
            <li>支持自然语言搜索，如"附近奶茶店招人"、"今天能上班的快递工作"</li>
            <li>系统自动识别关键词、行业、到岗时间等信息</li>
            <li>搜索后自动跳转到职位列表页，展示智能匹配结果</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default VoiceSearchPage;
