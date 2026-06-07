import React, { useState } from 'react';
import { Form, Input, Button, Card, Tabs, message, Typography, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, TeamOutlined, BankOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAppStore } from '../store';
import { LoginResponse } from '../types';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorCode, setErrorCode] = useState<string>('');
  const navigate = useNavigate();
  const { setToken, setUser } = useAppStore();

  const getRouteByRole = (role: string) => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'platform') return '/admin/dashboard';
    if (role === 'ops') return '/admin/dashboard';
    if (role === 'enterprise') return '/enterprise/dashboard';
    return '/dashboard';
  };

  const getErrorSuggestion = (code: string) => {
    switch (code) {
      case 'USER_NOT_FOUND':
        return '请检查用户名是否正确，或点击"注册"创建新账号';
      case 'INVALID_PASSWORD':
        return '请确认密码是否正确，注意区分大小写';
      case 'ACCOUNT_DISABLED':
        return '请联系管理员解禁账号';
      case 'ACCOUNT_PENDING':
        return '企业账号通常在1-2个工作日内完成审核';
      case 'EMPTY_CREDENTIALS':
        return '请输入用户名和密码';
      default:
        return '请稍后重试或联系技术支持';
    }
  };

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    setErrorMessage('');
    setErrorCode('');
    try {
      const response = await api.auth.login(values);
      const data = response.data as LoginResponse;
      setToken(data.token);
      setUser(data.user);
      message.success(`登录成功！欢迎，${data.user.realName || data.user.username}`);
      const targetRoute = getRouteByRole(data.user.role);
      navigate(targetRoute, { replace: true });
    } catch (error: any) {
      const msg = error.response?.data?.message || '登录失败，请检查用户名和密码';
      const code = error.response?.data?.code || 'UNKNOWN_ERROR';
      setErrorMessage(msg);
      setErrorCode(code);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (username: string, password: string) => {
    form.setFieldsValue({ username, password });
    void handleLogin({ username, password });
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const goToRegisterWorker = () => {
    navigate('/register/worker');
  };

  const goToRegisterEnterprise = () => {
    navigate('/register/enterprise');
  };

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <>
          <Form
            form={form}
            name="login"
            layout="vertical"
            onFinish={handleLogin}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block icon={<LoginOutlined />}>
                登录
              </Button>
            </Form.Item>
          </Form>

          {errorMessage && (
          <Alert
            message="登录失败"
            description={
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text>{errorMessage}</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <InfoCircleOutlined style={{ marginRight: '4px' }} />
                  建议：{getErrorSuggestion(errorCode)}
                </Text>
              </Space>
            }
            type="error"
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}

        <Alert
          message="测试账号"
          description={
            <div>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                系统已预置以下测试账号，可直接登录体验各角色功能：
              </Text>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ fontSize: '12px' }}>
                  <Text strong>管理员：</Text>
                  <Text code>admin</Text> / <Text code>admin123</Text>
                  <Text type="secondary">（数据概览、用户管理、认证审核、社保预警等）</Text>
                </div>
                <div style={{ fontSize: '12px' }}>
                  <Text strong>运营/平台：</Text>
                  <Text code>platform</Text> / <Text code>platform123</Text>
                  <Text type="secondary">（同管理员权限）</Text>
                </div>
                <div style={{ fontSize: '12px' }}>
                  <Text strong>运维：</Text>
                  <Text code>ops</Text> / <Text code>ops123</Text>
                  <Text type="secondary">（同管理员权限）</Text>
                </div>
                <div style={{ fontSize: '12px' }}>
                  <Text strong>工人：</Text>
                  <Text code>worker01</Text> / <Text code>worker123</Text>
                  <Text type="secondary">（工种认证、技能评定、找工作、考勤、工资条）</Text>
                </div>
                <div style={{ fontSize: '12px' }}>
                  <Text strong>企业：</Text>
                  <Text code>enterprise01</Text> / <Text code>enterprise123</Text>
                  <Text type="secondary">（岗位发布、项目管理、合同管理、工资发放）</Text>
                </div>
                <Space wrap style={{ marginTop: 8 }}>
                  <Button size="small" onClick={() => quickLogin('admin', 'admin123')}>
                    进入管理后台
                  </Button>
                  <Button size="small" onClick={() => quickLogin('enterprise01', 'enterprise123')}>
                    进入企业工作台
                  </Button>
                  <Button size="small" onClick={() => quickLogin('worker01', 'worker123')}>
                    进入工人端
                  </Button>
                </Space>
              </Space>
            </div>
          }
          type="info"
          showIcon
          style={{ marginTop: '16px' }}
        />
        </>
      )
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Title level={4} style={{ marginBottom: '32px' }}>选择注册类型</Title>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
            <Card
              hoverable
              style={{ width: 200, textAlign: 'center' }}
              className="card-shadow"
              onClick={goToRegisterWorker}
            >
              <TeamOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
              <Title level={5} style={{ margin: 0 }}>工人注册</Title>
              <Text type="secondary">个人求职用户</Text>
            </Card>
            <Card
              hoverable
              style={{ width: 200, textAlign: 'center' }}
              className="card-shadow"
              onClick={goToRegisterEnterprise}
            >
              <BankOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
              <Title level={5} style={{ margin: 0 }}>企业注册</Title>
              <Text type="secondary">招聘用工企业</Text>
            </Card>
          </div>
        </div>
      )
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏗️</div>
          <Title level={2} style={{ color: 'white', margin: 0 }}>建筑行业蓝领用工平台</Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px' }}>数字化用工管理系统</Text>
        </div>
        <Card className="card-shadow">
          <Tabs activeKey={activeTab} onChange={handleTabChange} centered items={tabItems} />
        </Card>
      </div>
    </div>
  );
};

export default Login;
