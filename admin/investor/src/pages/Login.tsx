import { useState } from 'react';
import { Form, Input, Button, Card, Typography, App as AntdApp } from 'antd';
import { MobileOutlined, SafetyOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { investorApi } from '../services/investorApi';
import { useAppStore } from '../store';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { setUserInfo, setToken } = useAppStore();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();

  const handleSendCode = async () => {
    const phone = form.getFieldValue('phone');
    if (!phone) {
      message.warning('请先输入手机号');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      message.error('请输入正确的手机号');
      return;
    }
    try {
      setCodeLoading(true);
      await investorApi.sendSmsCode(phone);
      message.success('验证码已发送');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      message.error('验证码发送失败');
    } finally {
      setCodeLoading(false);
    }
  };

  const handleLogin = async (values: { phone: string; code: string }) => {
    try {
      setLoading(true);
      const mockResponse = {
        token: 'mock_token_' + Date.now(),
        userInfo: {
          id: '1',
          name: '张投资商',
          phone: values.phone,
          avatar: '',
          investorLevel: 'VIP会员',
        },
      };
      setToken(mockResponse.token);
      setUserInfo(mockResponse.userInfo);
      localStorage.setItem('investor_token', mockResponse.token);
      message.success('登录成功');
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch {
      message.error('登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: -200,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -300,
          right: -300,
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }}
      />
      <Card
        style={{
          width: 420,
          borderRadius: 16,
          boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
          zIndex: 1,
        }}
        bodyStyle={{ padding: '40px 32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #1890ff, #722ed1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              fontSize: 32,
              color: '#fff',
              fontWeight: 'bold',
            }}
          >
            I
          </div>
          <Title level={3} style={{ margin: '0 0 8px', color: '#1f1f1f' }}>
            投资商管理平台
          </Title>
          <Text type="secondary">欢迎登录，请输入您的信息</Text>
        </div>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          size="large"
          autoComplete="off"
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
            name="code"
            label="验证码"
            rules={[
              { required: true, message: '请输入验证码' },
              { len: 6, message: '验证码为6位数字' },
            ]}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                prefix={<SafetyOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="请输入验证码"
                maxLength={6}
                style={{ flex: 1 }}
              />
              <Button
                onClick={handleSendCode}
                disabled={countdown > 0}
                loading={codeLoading}
                style={{ width: 120, whiteSpace: 'nowrap' }}
              >
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </Button>
            </div>
          </Form.Item>
          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              icon={<LoginOutlined />}
              style={{
                height: 44,
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        <div
          style={{
            textAlign: 'center',
            padding: '16px 0 0',
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            © 2024 投资商管理平台 版权所有
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;
