import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Play, Trophy, Clock } from 'lucide-react';
import { speakingAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';

const SpeakingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [sentences, setSentences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSentence, setCurrentSentence] = useState(null);
  const [practicing, setPracticing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('practice');

  useEffect(() => {
    loadSentences();
  }, []);

  const loadSentences = async () => {
    try {
      const response = await speakingAPI.getSentences();
      if (response.data?.data) {
        setSentences(response.data.data.sentences || []);
      }
    } catch (err) {
      console.error('Load sentences error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const response = await speakingAPI.getHistory();
      if (response.data?.data) {
        setHistory(response.data.data.history || []);
      }
    } catch (err) {
      console.error('Load history error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history' && user) {
      loadHistory();
    }
  }, [activeTab, user]);

  const handlePractice = async (sentence) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentSentence(sentence);
    setPracticing(true);
  };

  const handleSubmitPractice = async () => {
    try {
      const response = await speakingAPI.submitPractice({
        original_text: currentSentence.text
      });
      if (response.data?.success) {
        setResult(response.data.data);
        showSuccess('评测完成！');
      }
    } catch (err) {
      showError('提交失败，请重试');
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <Loading message="加载中..." />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7' }}>
      <div style={{
        padding: 16,
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>练听说</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActiveTab('practice')}
            style={{
              padding: '8px 20px',
              borderRadius: 20,
              border: 'none',
              backgroundColor: activeTab === 'practice' ? '#007AFF' : '#f0f0f0',
              color: activeTab === 'practice' ? 'white' : '#333',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            练习
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '8px 20px',
              borderRadius: 20,
              border: 'none',
              backgroundColor: activeTab === 'history' ? '#007AFF' : '#f0f0f0',
              color: activeTab === 'history' ? 'white' : '#333',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            历史
          </button>
        </div>
      </div>

      {activeTab === 'practice' ? (
        <div style={{ padding: 16 }}>
          {sentences.map((sentence, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 20,
                marginBottom: 12
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1, marginRight: 12 }}>
                  <p style={{ fontSize: 18, fontWeight: 500, color: '#333', marginBottom: 8 }}>
                    {sentence.text}
                  </p>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: sentence.difficulty === 'easy' ? '#34C75920' :
                      sentence.difficulty === 'medium' ? '#FF950020' : '#FF3B3020',
                    color: sentence.difficulty === 'easy' ? '#34C759' :
                      sentence.difficulty === 'medium' ? '#FF9500' : '#FF3B30',
                    borderRadius: 12,
                    fontSize: 12
                  }}>
                    {sentence.difficulty === 'easy' ? '简单' :
                      sentence.difficulty === 'medium' ? '中等' : '困难'}
                  </span>
                </div>
                <button
                  onClick={() => speak(sentence.text)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: '#007AFF15',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Play size={20} color="#007AFF" />
                </button>
              </div>
              <button
                onClick={() => handlePractice(sentence)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#007AFF',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <Mic size={18} />
                开始跟读
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: 16 }}>
          {!user ? (
            <div style={{
              textAlign: 'center',
              padding: 40,
              backgroundColor: 'white',
              borderRadius: 16
            }}>
              <p style={{ color: '#666', marginBottom: 16 }}>请先登录查看练习历史</p>
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#007AFF',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer'
                }}
              >
                去登录
              </button>
            </div>
          ) : historyLoading ? (
            <Loading message="加载中..." />
          ) : history.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 40,
              backgroundColor: 'white',
              borderRadius: 16
            }}>
              <p style={{ color: '#666' }}>暂无练习记录</p>
            </div>
          ) : (
            history.map((item, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12
                }}
              >
                <p style={{ fontSize: 14, color: '#333', marginBottom: 8 }}>
                  {item.original_text}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Trophy size={16} color="#FF9500" />
                    <span style={{ fontSize: 14, color: '#FF9500', fontWeight: 600 }}>
                      {item.score}分
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={14} color="#999" />
                    <span style={{ fontSize: 12, color: '#999' }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {item.feedback && (
                  <p style={{ fontSize: 12, color: '#666', marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                    {item.feedback}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {practicing && currentSentence && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'white',
          zIndex: 1000
        }}>
          <div style={{
            padding: 16,
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ fontSize: 18 }}>口语跟读</h2>
            <button
              onClick={() => { setPracticing(false); setResult(null); }}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#666' }}
            >
              关闭
            </button>
          </div>
          
          <div style={{ padding: 24 }}>
            {result ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <div style={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    backgroundColor: result.score >= 80 ? '#34C759' : result.score >= 60 ? '#FF9500' : '#FF3B30',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <span style={{ fontSize: 32, fontWeight: 700, color: 'white' }}>{result.score}</span>
                  </div>
                  <p style={{ fontSize: 16, color: '#333', marginBottom: 8 }}>{result.feedback}</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => setResult(null)}
                    style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: '#f0f0f0',
                    color: '#333',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 16,
                    cursor: 'pointer'
                  }}
                  >
                    重新练习
                  </button>
                  <button
                    onClick={() => { setPracticing(false); setResult(null); }}
                    style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: '#007AFF',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 16,
                    cursor: 'pointer'
                  }}
                  >
                    完成
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  backgroundColor: '#f5f5f7',
                  borderRadius: 16,
                  padding: 24,
                  marginBottom: 32,
                  textAlign: 'center'
                }}>
                  <p style={{ fontSize: 20, fontWeight: 500, color: '#333', marginBottom: 16 }}>
                    {currentSentence.text}
                  </p>
                  <button
                    onClick={() => speak(currentSentence.text)}
                    style={{
                    padding: '10px 20px',
                    backgroundColor: '#007AFF',
                    color: 'white',
                    border: 'none',
                    borderRadius: 20,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  >
                    <Play size={16} />
                    听范读
                  </button>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={handleSubmitPractice}
                    style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    backgroundColor: '#FF9500',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(255,149,0,0.3)'
                  }}
                  >
                    <Mic size={48} color="white" />
                  </button>
                  <p style={{ marginTop: 16, color: '#666' }}>点击麦克风开始录音</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeakingPage;
