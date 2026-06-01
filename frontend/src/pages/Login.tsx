import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Toast } from 'antd-mobile';
import { useAuthStore } from '../store/useAuthStore';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, loading } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');

  const handleSubmit = async () => {
    if (!username || !password) {
      Toast.show({ content: '请输入用户名和密码', icon: 'fail' });
      return;
    }

    const success = isRegister 
      ? await register(username, password, nickname || username)
      : await login(username, password);

    if (success) {
      Toast.show({ content: isRegister ? '注册成功' : '登录成功', icon: 'success' });
      navigate('/');
    }
  };

  return (
    <div className="login-container">
      <div className="login-logo">💰</div>
      <h1 className="login-title">叨叨记账</h1>
      <p className="login-subtitle">聊天式记账，让记账更有趣</p>
      
      <div className="login-form">
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="用户名"
            value={username}
            onChange={val => setUsername(val)}
            clearable
          />
        </div>
        
        {isRegister && (
          <div style={{ marginBottom: 16 }}>
            <Input
              placeholder="昵称（可选）"
              value={nickname}
              onChange={val => setNickname(val)}
              clearable
            />
          </div>
        )}
        
        <div style={{ marginBottom: 20 }}>
          <Input
            type="password"
            placeholder="密码"
            value={password}
            onChange={val => setPassword(val)}
            clearable
          />
        </div>
        
        <Button
          block
          color="primary"
          size="large"
          onClick={handleSubmit}
          loading={loading}
          style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 10,
            marginBottom: 16
          }}
        >
          {isRegister ? '注册' : '登录'}
        </Button>
        
        <div 
          style={{ 
            textAlign: 'center', 
            fontSize: 14, 
            color: '#667eea',
            cursor: 'pointer'
          }}
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;