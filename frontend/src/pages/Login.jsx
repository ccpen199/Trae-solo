import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/common/Toast';
import Loading from '../components/common/Loading';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const LoginCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 40px 30px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const LogoIcon = styled.div`
  font-size: 60px;
  margin-bottom: 10px;
`;

const LogoText = styled.h1`
  font-size: 24px;
  color: #333;
  font-weight: 600;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 24px;
  border-bottom: 2px solid #f0f0f0;
`;

const Tab = styled.div`
  flex: 1;
  text-align: center;
  padding: 12px;
  cursor: pointer;
  font-size: 16px;
  color: ${props => props.$active ? '#3b82f6' : '#666'};
  border-bottom: 2px solid ${props => props.$active ? '#3b82f6' : 'transparent'};
  margin-bottom: -2px;
  transition: all 0.3s;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 14px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    background: #93c5fd;
    cursor: not-allowed;
  }
`;

const BackButton = styled.button`
  width: 100%;
  padding: 12px;
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  margin-top: 12px;
  transition: all 0.3s;
  
  &:hover {
    background: #f5f5f5;
  }
`;

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const { login, register, loading } = useAuthStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      showToast('请填写用户名和密码', 'warning');
      return;
    }

    let result;
    if (isLogin) {
      result = await login(username, password);
    } else {
      result = await register(username, password, email);
    }

    if (result.success) {
      showToast(isLogin ? '登录成功' : '注册成功', 'success');
      navigate('/');
    } else {
      showToast(result.message, 'error');
    }
  };

  return (
    <PageContainer>
      <LoginCard>
        <Logo>
          <LogoIcon>📚</LogoIcon>
          <LogoText>藏书馆</LogoText>
        </Logo>

        <TabContainer>
          <Tab $active={isLogin} onClick={() => setIsLogin(true)}>登录</Tab>
          <Tab $active={!isLogin} onClick={() => setIsLogin(false)}>注册</Tab>
        </TabContainer>

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>用户名</Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              disabled={loading}
            />
          </FormGroup>

          {!isLogin && (
            <FormGroup>
              <Label>邮箱（选填）</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                disabled={loading}
              />
            </FormGroup>
          )}

          <FormGroup>
            <Label>密码</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              disabled={loading}
            />
          </FormGroup>

          <SubmitButton type="submit" disabled={loading}>
            {loading ? <Loading size="20px" /> : (isLogin ? '登录' : '注册')}
          </SubmitButton>

          <BackButton type="button" onClick={() => navigate('/')}>
            返回首页
          </BackButton>
        </form>
      </LoginCard>
    </PageContainer>
  );
};

export default Login;
