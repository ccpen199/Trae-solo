import React, { useState } from 'react';

function LoginPage({ onLogin }) {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    
    setLoading(true);
    await onLogin(nickname.trim());
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>欢迎加入棋牌游戏</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>输入你的昵称</label>
            <input
              type="text"
              className="input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="请输入昵称..."
              autoFocus
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading || !nickname.trim()}
          >
            {loading ? '登录中...' : '进入游戏大厅'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;