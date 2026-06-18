import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Tabs,
  Divider,
  message,
  Space,
  Typography,
  Checkbox,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MobileOutlined,
  WechatOutlined,
  AlipayCircleOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { authApi } from '@/api';
import type { UserRole } from '@/types';
import '@/styles/index.css';

const { Title, Text } = Typography;

interface LoginFormValues {
  phone: string;
  password: string;
  remember?: boolean;
}

interface RegisterFormValues {
  phone?: string;
  password: string;
  confirmPassword: string;
  nickname?: string;
  role?: UserRole;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const from = (location.state as any)?.from?.pathname || '/';

  const getDefaultRoute = (role?: UserRole) => {
    switch (role) {
      case 'resident': return '/resident';
      case 'property': return '/property';
      case 'operator':
      case 'admin': return '/operator';
      default: return from;
    }
  };

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const result = await login({
        phone: values.phone,
        password: values.password,
      });
      
      if (result.success) {
        message.success('登录成功');
        const { user } = useAuthStore.getState();
        navigate(getDefaultRoute(user?.role), { replace: true });
      } else {
        message.error(result.message || '登录失败');
      }
    } catch (error: any) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleThirdPartyLogin = async (provider: 'wechat' | 'alipay') => {
    setLoading(true);
    try {
      const mockId = `${provider}_mock_${Date.now()}`;
      const result = await login({
        [provider === 'wechat' ? 'openid' : 'alipayId']: mockId,
        nickname: `${provider === 'wechat' ? '微信' : '支付宝'}用户`,
        avatar: '',
      });
      
      if (result.success) {
        message.success(`${provider === 'wechat' ? '微信' : '支付宝'}登录成功`);
        const { user } = useAuthStore.getState();
        navigate(getDefaultRoute(user?.role), { replace: true });
      } else {
        message.error(result.message || '登录失败');
      }
    } catch (error: any) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      const response = await authApi.register({
        phone: values.phone || '',
        password: values.password,
        nickname: values.nickname,
        role: values.role || 'resident',
      });
      
      if (response.success && response.data) {
        message.success('注册成功');
        const result = await login({
          phone: values.phone,
          password: values.password,
        });
        
        if (result.success) {
          const { user } = useAuthStore.getState();
          navigate(getDefaultRoute(user?.role), { replace: true });
        }
      } else {
        message.error(response.message || '注册失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const loginForm = (
    <Form
      name="login"
      layout="vertical"
      onFinish={handleLogin}
      autoComplete="off"
      size="large"
    >
      <Form.Item
        name="phone"
        label="手机号"
        rules={[
          { required: true, message: '请输入手机号' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
        ]}
      >
        <Input
          prefix={<MobileOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="请输入手机号"
          maxLength={11}
        />
      </Form.Item>

      <Form.Item
        name="password"
        label="密码"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6位' },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="请输入密码"
          iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
        />
      </Form.Item>

      <Form.Item name="remember" valuePropName="checked">
        <Checkbox>记住我</Checkbox>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block style={{ height: '44px', fontSize: '16px' }}>
          登录
        </Button>
      </Form.Item>
    </Form>
  );

  const registerForm = (
    <Form
      name="register"
      layout="vertical"
      onFinish={handleRegister}
      autoComplete="off"
      size="large"
    >
      <Form.Item
        name="phone"
        label="手机号（可选）"
        rules={[
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
        ]}
      >
        <Input
          prefix={<MobileOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="请输入手机号（选填）"
          maxLength={11}
        />
      </Form.Item>

      <Form.Item
        name="nickname"
        label="昵称"
        rules={[
          { max: 20, message: '昵称最多20个字符' },
        ]}
      >
        <Input
          prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="请输入昵称"
        />
      </Form.Item>

      <Form.Item
        name="password"
        label="密码"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6位' },
          { max: 20, message: '密码最多20位' },
        ]}
        hasFeedback
      >
        <Input.Password
          prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="请输入密码（6-20位）"
          iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        label="确认密码"
        dependencies={['password']}
        hasFeedback
        rules={[
          { required: true, message: '请确认密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次输入的密码不一致'));
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="请再次输入密码"
          iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
        />
      </Form.Item>

      <Form.Item
        name="role"
        label="用户角色"
        initialValue="resident"
      >
        <Input.Group compact>
          <Button type="primary" htmlType="submit" loading={loading} block style={{ height: '44px', fontSize: '16px' }}>
            注册
          </Button>
        </Input.Group>
      </Form.Item>
    </Form>
  );

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: loginForm,
    },
    {
      key: 'register',
      label: '注册',
      children: registerForm,
    },
  ];

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-bg-gradient" />
        <div className="login-bg-pattern" />
      </div>
      
      <div className="login-container">
        <div className="login-card-wrapper">
          <div className="login-header">
            <div className="login-logo">
              <span className="logo-icon">🧺</span>
            </div>
            <Title level={2} className="login-title">
              智慧社区物联网平台
            </Title>
            <Text type="secondary" className="login-subtitle">
              便捷生活，智能服务
            </Text>
          </div>

          <div className="login-card">
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as 'login' | 'register')}
              items={tabItems}
              centered
              size="large"
            />

            {activeTab === 'login' && (
              <>
                <Divider plain>
                  <Text type="secondary" style={{ fontSize: '13px' }}>其他登录方式</Text>
                </Divider>
                
                <div className="third-party-login">
                  <Space size="large" align="center" style={{ width: '100%', justifyContent: 'center' }}>
                    <Button
                      type="text"
                      icon={<WechatOutlined style={{ fontSize: '28px', color: '#07c160' }} />}
                      onClick={() => handleThirdPartyLogin('wechat')}
                      loading={loading}
                      className="third-party-btn"
                    >
                      <div style={{ fontSize: '12px', color: '#595959', marginTop: '4px' }}>微信登录</div>
                    </Button>
                    <Button
                      type="text"
                      icon={<AlipayCircleOutlined style={{ fontSize: '28px', color: '#1677ff' }} />}
                      onClick={() => handleThirdPartyLogin('alipay')}
                      loading={loading}
                      className="third-party-btn"
                    >
                      <div style={{ fontSize: '12px', color: '#595959', marginTop: '4px' }}>支付宝登录</div>
                    </Button>
                  </Space>
                </div>
              </>
            )}
          </div>

          <div className="login-footer">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              © 2024 智慧社区物联网平台 版权所有
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
