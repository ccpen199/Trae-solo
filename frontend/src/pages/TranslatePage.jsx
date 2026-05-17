import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Camera, Volume2, ChevronUp, X, History, Star, ArrowLeftRight } from 'lucide-react';
import { translationAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';

const languages = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: '英文' },
  { code: 'ja', name: '日文' },
  { code: 'ko', name: '韩文' },
  { code: 'fr', name: '法文' },
  { code: 'de', name: '德文' }
];

const TranslatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [sourceLang, setSourceLang] = useState('zh');
  const [targetLang, setTargetLang] = useState('en');
  const [sourceText, setSourceText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSimultaneous, setShowSimultaneous] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [recording, setRecording] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await translationAPI.getHistory();
      if (response.data.success) {
        setHistory(response.data.data.history || []);
      }
    } catch (e) {
      console.error('Load history error:', e);
    }
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    
    setLoading(true);
    try {
      const response = await translationAPI.translate({
        source_text: sourceText,
        source_lang: sourceLang,
        target_lang: targetLang
      });
      if (response.data.success) {
        setResult(response.data.data.target_text);
        loadHistory();
      }
    } catch (e) {
      showError('翻译失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const swapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    if (result) {
      setSourceText(result);
      setResult('');
    }
  };

  const speak = (text, lang) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-US' : lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  const recognitionRef = useRef(null);

  const mockVoiceTexts = {
    zh: ['你好，我想翻译这句话', '今天天气怎么样', '我爱学习', '早上好', '谢谢你的帮助'],
    en: ['Hello, how are you today', 'What is the weather like', 'I love learning', 'Good morning', 'Thank you for your help']
  };

  const startMockRecording = (isSimultaneous = false) => {
    setRecording(true);
    
    setTimeout(() => {
      const texts = mockVoiceTexts[sourceLang] || mockVoiceTexts.en;
      const randomText = texts[Math.floor(Math.random() * texts.length)];
      
      if (isSimultaneous) {
        setSourceText(prev => prev + (prev ? ' ' : '') + randomText);
        translationAPI.translate({
          source_text: randomText,
          source_lang: sourceLang,
          target_lang: targetLang
        }).then(res => {
          if (res.data.success) {
            setResult(prev => prev + (prev ? '\n' : '') + res.data.data.target_text);
          }
        }).catch(err => {
          console.error('Translate error:', err);
        });
        setRecording(false);
      } else {
        setSourceText(randomText);
        setRecording(false);
        setShowVoiceModal(false);
        setTimeout(() => {
          if (randomText) {
            handleTranslate();
          }
        }, 300);
      }
      
      showSuccess('语音识别成功（演示模式）');
    }, 2000);
  };

  const startRecording = (isSimultaneous = false) => {
    if (recording) {
      return;
    }

    const hasSpeechAPI = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    if (!hasSpeechAPI) {
      showSuccess('使用演示模式语音识别');
      startMockRecording(isSimultaneous);
      return;
    }

    setRecording(true);

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = sourceLang === 'zh' ? 'zh-CN' : sourceLang === 'en' ? 'en-US' : sourceLang;
      recognition.continuous = isSimultaneous;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        
        if (isSimultaneous) {
          setSourceText(prev => prev + (prev ? ' ' : '') + transcript);
          translationAPI.translate({
            source_text: transcript,
            source_lang: sourceLang,
            target_lang: targetLang
          }).then(res => {
            if (res.data.success) {
              setResult(prev => prev + (prev ? '\n' : '') + res.data.data.target_text);
            }
          }).catch(err => {
            console.error('Translate error:', err);
          });
        } else {
          setSourceText(transcript);
          setRecording(false);
          setShowVoiceModal(false);
          setTimeout(() => {
            if (transcript) {
              handleTranslate();
            }
          }, 300);
        }
      };

      let errorShown = false;
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setRecording(false);
        if (errorShown) return;
        errorShown = true;
        
        if (event.error === 'no-speech') {
          showError('没有检测到语音');
        } else if (event.error === 'audio-capture') {
          showError('无法访问麦克风，切换到演示模式');
          startMockRecording(isSimultaneous);
        } else if (event.error === 'not-allowed') {
          showError('麦克风权限被拒绝，切换到演示模式');
          startMockRecording(isSimultaneous);
        } else {
          showError('语音识别失败，切换到演示模式');
          startMockRecording(isSimultaneous);
        }
      };

      recognition.onend = () => {
        if (!isSimultaneous) {
          setRecording(false);
        }
      };

      recognition.start();
    } catch (e) {
      console.error('Recognition start error:', e);
      setRecording(false);
      showSuccess('使用演示模式语音识别');
      startMockRecording(isSimultaneous);
    }
  };

  const handleClearHistory = async () => {
    try {
      await translationAPI.clearHistory();
      setHistory([]);
      showSuccess('历史记录已清空');
    } catch (e) {
      showError('清空失败');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7' }}>
      <div style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        backgroundColor: 'white',
        padding: '12px 16px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: 14,
              backgroundColor: 'white'
            }}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
          
          <button onClick={swapLanguages} style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer' }}>
            <ArrowLeftRight size={20} color="#007AFF" />
          </button>
          
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: 14,
              backgroundColor: 'white'
            }}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <textarea
            ref={inputRef}
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="输入要翻译的文本..."
            style={{
              width: '100%',
              minHeight: 120,
              border: 'none',
              outline: 'none',
              fontSize: 18,
              resize: 'none',
              marginBottom: 12
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => speak(sourceText, sourceLang)}
                style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <Volume2 size={20} color="#666" />
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <History size={20} color="#666" />
              </button>
              <button
                onClick={() => navigate('/favorites')}
                style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <Star size={20} color="#666" />
              </button>
            </div>
            <span style={{ color: '#999', fontSize: 12 }}>{sourceText.length}/5000</span>
          </div>
        </div>

        {showHistory && history.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 16,
            marginBottom: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>翻译历史</h3>
              <button onClick={handleClearHistory} style={{ color: '#FF3B30', fontSize: 14, border: 'none', background: 'none', cursor: 'pointer' }}>
                清空
              </button>
            </div>
            {history.slice(0, 5).map((item, index) => (
              <div
                key={index}
                onClick={() => { setSourceText(item.source_text); setResult(item.target_text); setShowHistory(false); }}
                style={{
                  padding: '12px 0',
                  borderBottom: index < 4 ? '1px solid #f0f0f0' : 'none',
                  cursor: 'pointer'
                }}
              >
                <p style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>{item.source_text}</p>
                <p style={{ fontSize: 13, color: '#666' }}>{item.target_text}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 40,
            textAlign: 'center'
          }}>
            <Loading message="翻译中..." />
          </div>
        ) : result ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <p style={{ fontSize: 18, color: '#333', marginBottom: 12, lineHeight: 1.6 }}>{result}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => speak(result, targetLang)}
                style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <Volume2 size={20} color="#007AFF" />
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(result).then(() => showSuccess('已复制到剪贴板'))}
                style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 16 }}
              >
                📋
              </button>
            </div>
          </div>
        ) : null}

        {sourceText && !loading && (
          <button
            onClick={handleTranslate}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 12
            }}
          >
            翻译
          </button>
        )}
      </div>

      <div style={{
        position: 'fixed',
        bottom: 80,
        left: 0,
        right: 0,
        padding: '0 16px',
        display: 'flex',
        gap: 12,
        justifyContent: 'center'
      }}>
        <button
          onClick={() => setShowVoiceModal(true)}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: '#FF9500',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(255,149,0,0.3)'
          }}
        >
          <Mic size={24} color="white" />
        </button>
        <button
          onClick={() => navigate('/camera')}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: '#34C759',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(52,199,89,0.3)'
          }}
        >
          <Camera size={24} color="white" />
        </button>
      </div>

      <div
        onClick={() => setShowSimultaneous(true)}
        style={{
          position: 'fixed',
          bottom: 150,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer'
        }}
      >
        <ChevronUp size={24} color="#007AFF" />
        <span style={{ fontSize: 12, color: '#007AFF', marginTop: 2 }}>同声传译</span>
      </div>

      {showVoiceModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 32,
            textAlign: 'center',
            margin: 20,
            position: 'relative',
            minWidth: 280
          }}>
            <button
              onClick={() => setShowVoiceModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <X size={24} color="#666" />
            </button>
            <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600 }}>语音翻译</h3>
            <button
              onClick={() => startRecording(false)}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: recording ? '#FF3B30' : '#FF9500',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                margin: '0 auto 16px',
                transition: 'background-color 0.3s'
              }}
            >
              <Mic size={36} color="white" />
            </button>
            <p style={{ color: '#666', fontSize: 14 }}>{recording ? '正在录音...' : '点击开始录音'}</p>
            <p style={{ color: '#999', fontSize: 12, marginTop: 8 }}>支持中文和英文语音识别</p>
          </div>
        </div>
      )}

      {showSimultaneous && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'white',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: 16, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 18 }}>同声传译</h2>
            <button onClick={() => { setShowSimultaneous(false); setSourceText(''); setResult(''); }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
              <X size={24} color="#666" />
            </button>
          </div>
          <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>原文：</p>
              <div style={{ backgroundColor: '#f5f5f7', borderRadius: 12, padding: 16, minHeight: 60 }}>
                <p style={{ fontSize: 16, color: '#333', whiteSpace: 'pre-wrap' }}>{sourceText || '等待输入...'}</p>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>译文：</p>
              <div style={{ backgroundColor: '#007AFF15', borderRadius: 12, padding: 16, minHeight: 60 }}>
                <p style={{ fontSize: 16, color: '#333', whiteSpace: 'pre-wrap' }}>{result || '等待翻译...'}</p>
              </div>
            </div>
          </div>
          <div style={{ padding: 16, borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'center', gap: 16 }}>
            <button
              onClick={() => startRecording(true)}
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: recording ? '#FF3B30' : '#007AFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
            >
              <Mic size={32} color="white" />
            </button>
            <button
              onClick={() => { setSourceText(''); setResult(''); }}
              style={{
                padding: '0 24px',
                borderRadius: 24,
                backgroundColor: '#f5f5f7',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#666',
                fontSize: 14
              }}
            >
              清除
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslatePage;
