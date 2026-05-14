import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import QuestionDetail from './pages/QuestionDetail';
import Video from './pages/Video';
import VideoDetail from './pages/VideoDetail';
import Member from './pages/Member';
import MemberRead from './pages/MemberRead';
import Message from './pages/Message';
import Profile from './pages/Profile';
import Login from './pages/Login';
import CreateQuestion from './pages/CreateQuestion';
import api from './utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

function App() {
  const [user, setUser] = useState(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    } else if (!token && location.pathname === '/') {
      setTimeout(() => setShowGuestModal(true), 500);
    }
  }, [location.pathname]);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const guestLogin = async (gender, interests) => {
    try {
      const res = await api.post('/auth/guest', { gender, interests });
      if (res.data.success) {
        login(res.data.data.user, res.data.data.token);
        setShowGuestModal(false);
      }
    } catch (err) {
      console.error('游客登录失败:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/question/:id" element={<QuestionDetail />} />
          <Route path="/video" element={<Video />} />
          <Route path="/video/:id" element={<VideoDetail />} />
          <Route path="/member" element={<Member />} />
          <Route path="/member/read/:id" element={<MemberRead />} />
          <Route path="/message" element={<Message />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create/question" element={<CreateQuestion />} />
        </Routes>

        {showGuestModal && (
          <div className="modal-overlay">
            <div className="modal-content guest-modal">
              <h3>欢迎来到知识社区</h3>
              <p style={{ color: 'var(--text-secondary)', margin: '12px 0' }}>
                完善信息，为您推荐更感兴趣的内容
              </p>
              <div className="form-group">
                <label className="form-label">性别</label>
                <div className="guest-options">
                  <div className="guest-option" onClick={() => guestLogin('male', [])}>
                    男
                  </div>
                  <div className="guest-option" onClick={() => guestLogin('female', [])}>
                    女
                  </div>
                </div>
              </div>
              <button
                className="form-submit"
                onClick={() => {
                  guestLogin('unknown', []);
                  setShowGuestModal(false);
                }}
                style={{ marginTop: '16px', background: 'var(--text-secondary)' }}
              >
                跳过，随便看看
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthContext.Provider>
  );
}

export default App;
