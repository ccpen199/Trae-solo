import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const mockHotSearches = [
  { keyword: '热点新闻1' },
  { keyword: '热点新闻2' },
  { keyword: '热点新闻3' },
  { keyword: '热点新闻4' },
  { keyword: '热点新闻5' }
];

const mockShortcuts = [
  { name: '天气', icon: '🌤️' },
  { name: '快递', icon: '📦' },
  { name: '健康码', icon: '💚' },
  { name: '火车票', icon: '🚄' },
  { name: '外卖', icon: '🍜' },
  { name: '打车', icon: '🚕' },
  { name: '电影票', icon: '🎬' },
  { name: '酒店', icon: '🏨' }
];

const mockAiApps = [
  { name: 'AI写作', icon: '✍️', description: '智能创作助手' },
  { name: 'AI翻译', icon: '🌐', description: '多语言翻译' },
  { name: 'AI问答', icon: '💬', description: '智能问答助手' },
  { name: 'AI绘图', icon: '🎨', description: '文字生成图片' }
];

const mockFeatured = [
  { title: '热门推荐1', image: '🔥', desc: '精选内容推荐' },
  { title: '热门推荐2', image: '⭐', desc: '精选内容推荐' },
  { title: '热门推荐3', image: '💎', desc: '精选内容推荐' }
];

const mockLearning = [
  { title: '小学课程', locked: true },
  { title: '初中课程', locked: true },
  { title: '高中课程', locked: true }
];

const mockScanTools = [
  { name: '扫码', icon: '📷', description: '扫描二维码' },
  { name: '翻译', icon: '🌍', description: '拍照翻译' },
  { name: '试卷', icon: '📝', description: '扫描试卷' },
  { name: '题目', icon: '❓', description: '拍照搜题' },
  { name: '识物', icon: '🔍', description: '识别万物' },
  { name: '扫描文件', icon: '📄', description: '文档扫描' },
  { name: '提取文字', icon: '📝', description: 'OCR文字提取' },
  { name: '证件照', icon: '📸', description: '证件照制作' },
  { name: '药品', icon: '💊', description: '药品识别' }
];

function HomePage() {
  const navigate = useNavigate();
  const { isLoggedIn, setShowLoginModal } = useAuth();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [hotSearches, setHotSearches] = useState([]);
  const [shortcuts, setShortcuts] = useState([]);
  const [aiApps, setAiApps] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [learning, setLearning] = useState([]);
  const [scanTools, setScanTools] = useState([]);
  const [showScanModal, setShowScanModal] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [hotRes, shortcutsRes, aiAppsRes, featuredRes, learningRes, scanRes] = await Promise.all([
        axios.get('/api/search/hot').catch(() => ({ data: { hotSearches: mockHotSearches } })),
        axios.get('/api/home/shortcuts').catch(() => ({ data: { shortcuts: mockShortcuts } })),
        axios.get('/api/home/ai-apps').catch(() => ({ data: { aiApps: mockAiApps } })),
        axios.get('/api/home/featured').catch(() => ({ data: { featured: mockFeatured } })),
        axios.get('/api/home/learning').catch(() => ({ data: { learning: mockLearning } })),
        axios.get('/api/home/scan-tools').catch(() => ({ data: { scanTools: mockScanTools } }))
      ]);

      setHotSearches(hotRes.data.hotSearches || []);
      setShortcuts(shortcutsRes.data.shortcuts || []);
      setAiApps(aiAppsRes.data.aiApps || []);
      setFeatured(featuredRes.data.featured || []);
      setLearning(learningRes.data.learning || []);
      setScanTools(scanRes.data.scanTools || []);
    } catch (error) {
      console.error('加载数据失败，使用模拟数据', error);
      setHotSearches(mockHotSearches);
      setShortcuts(mockShortcuts);
      setAiApps(mockAiApps);
      setFeatured(mockFeatured);
      setLearning(mockLearning);
      setScanTools(mockScanTools);
    }
  };

  const handleSearch = async (keyword = searchKeyword) => {
    if (!keyword.trim()) return;
    try {
      await axios.post('/api/search', { keyword }).catch(() => {});
      navigate(`/search?q=${encodeURIComponent(keyword)}`);
    } catch (error) {
      navigate(`/search?q=${encodeURIComponent(keyword)}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleVoiceSearch = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      setSearchKeyword('语音识别测试');
    }, 2000);
  };

  const handleLearningClick = (item) => {
    if (item.locked) {
      setShowLoginModal(true);
    } else {
      console.log('访问学习内容:', item.title);
    }
  };

  const handleShortcutClick = (item) => {
    console.log('点击捷径:', item.name);
    navigate(`/shortcut/${encodeURIComponent(item.name)}`);
  };

  const handleAiAppClick = (item) => {
    console.log('点击AI应用:', item.name);
    navigate(`/ai/${encodeURIComponent(item.name)}`);
  };

  const handleFeaturedClick = (item) => {
    console.log('点击精选:', item.title);
    navigate(`/featured/${encodeURIComponent(item.title)}`);
  };

  const handleScanToolClick = (item) => {
    console.log('点击扫描工具:', item.name);
    setShowScanModal(true);
  };

  return (
    <div className="home-page">
      <div className="logo-section">
        <h1 className="logo">夸克</h1>
      </div>

      <div className="search-section">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="搜索或输入网址"
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <div className="search-actions">
            <button 
              className={`search-btn ${isListening ? 'listening' : ''}`}
              onClick={handleVoiceSearch}
              title="语音搜索"
            >
              🎤
            </button>
            <button 
              className="search-btn"
              onClick={() => setShowScanModal(true)}
              title="拍照扫描"
            >
              📷
            </button>
          </div>
        </div>

        <div className="hot-searches">
          <div className="hot-title">🔥 热搜榜</div>
          <div className="hot-list">
            {hotSearches.map((item, index) => (
              <span 
                key={index} 
                className="hot-tag"
                onClick={() => handleSearch(item.keyword)}
              >
                {item.keyword}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">⚡ 捷径</h2>
        <div className="shortcuts-grid">
          {shortcuts.map((item, index) => (
            <div 
              key={index} 
              className="shortcut-item"
              onClick={() => handleShortcutClick(item)}
            >
              <div className="shortcut-icon">{item.icon}</div>
              <span className="shortcut-name">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">🤖 AI 应用</h2>
        <div className="ai-apps-grid">
          {aiApps.map((item, index) => (
            <div 
              key={index} 
              className="ai-app-item"
              onClick={() => handleAiAppClick(item)}
            >
              <div className="ai-app-icon">{item.icon}</div>
              <div className="ai-app-name">{item.name}</div>
              <div className="ai-app-desc">{item.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">✨ 精选</h2>
        <div className="featured-list">
          {featured.map((item, index) => (
            <div 
              key={index} 
              className="featured-item"
              onClick={() => handleFeaturedClick(item)}
            >
              <div className="featured-icon">{item.image}</div>
              <div className="featured-content">
                <div className="featured-title">{item.title}</div>
                <div className="featured-desc">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">📖 夸克学习</h2>
        <div className="learning-grid">
          {learning.map((item, index) => (
            <div 
              key={index} 
              className={`learning-item ${item.locked ? 'locked' : ''}`}
              onClick={() => handleLearningClick(item)}
            >
              {item.locked && <span className="learning-lock">🔒</span>}
              <div>📚</div>
              <div className="learning-title">{item.title}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">📷 拍照扫描</h2>
        <div className="scan-tools-grid">
          {scanTools.map((item, index) => (
            <div 
              key={index} 
              className="scan-tool-item"
              onClick={() => handleScanToolClick(item)}
            >
              <div className="scan-tool-icon">{item.icon}</div>
              <span className="scan-tool-name">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {showScanModal && (
        <div className="scan-modal">
          <div className="scan-header">
            <span>拍照扫描</span>
            <button className="scan-close" onClick={() => setShowScanModal(false)}>✕</button>
          </div>
          <div className="scan-view">
            <div className="scan-frame"></div>
          </div>
          <div className="scan-tools-bar">
            {scanTools.slice(0, 4).map((item, index) => (
              <button key={index} className="scan-tool-btn">
                <div className="scan-tool-icon">{item.icon}</div>
                <span className="scan-tool-name">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
