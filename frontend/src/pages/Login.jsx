import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Alert, Space, Typography, Divider, Tag, message } from 'antd';
import { UserOutlined, LockOutlined, KeyOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useAuth } from '../App';

const { Title, Text } = Typography;

function Login() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  const redirectAfterLogin = (role) => {
    if (role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (role === 'company') {
      navigate('/create-job', { replace: true });
    } else {
      navigate('/profile', { replace: true });
    }
  };

  useEffect(() => {
    if (auth?.isAuthenticated) {
      if (auth.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [auth?.isAuthenticated, auth?.user?.role, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    setErrorInfo(null);
    try {
      const res = await authAPI.login(values);
      
      auth.login(res.data.token, res.data);
      
      if (res.data.message) {
        message.success(res.data.message, 2);
      } else {
        message.success(`登录成功！欢迎 ${res.data.name || res.data.phone}`, 2);
      }
      
      redirectAfterLogin(res.data.role);
    } catch (error) {
      const errorData = error.response?.data;
      const errorMsg = errorData?.error || '登录失败，请重试';
      const suggestion = errorData?.suggestion;
      
      setErrorInfo({
        message: errorMsg,
        suggestion: suggestion
      });
      
      if (suggestion) {
        message.error(errorMsg, 5);
      } else {
        message.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const enterDemo = (role, path) => {
    const demoUsers = {
      worker: {
        userId: 2,
        role: 'worker',
        name: '演示工友',
        phone: '13800000001',
        real_name_verified: 1,
        profile: { skills: '木工,钢筋工' }
      },
      company: {
        userId: 3,
        role: 'company',
        name: '演示企业',
        phone: '13900000001',
        real_name_verified: 1,
        profile: { company_name: '星耀科技有限公司' }
      },
      admin: {
        userId: 1,
        role: 'admin',
        name: '演示管理员',
        phone: 'admin',
        real_name_verified: 1,
        profile: { is_admin: true, permissions: 'all' }
      }
    };
    auth.login(`local-demo-${role}`, demoUsers[role]);
    navigate(path, { replace: true });
  };

  const loginDemoAccount = async (phone, password) => {
    setLoading(true);
    setErrorInfo(null);
    try {
      const res = await authAPI.login({ phone, password });
      auth.login(res.data.token, res.data);
      message.success(`登录成功！${res.data.name || res.data.phone}`);
      redirectAfterLogin(res.data.role);
    } catch (error) {
      const fallbackRole = phone === 'admin' || phone === 'platform'
        ? 'admin'
        : phone.startsWith('139')
          ? 'company'
          : 'worker';
      enterDemo(fallbackRole, fallbackRole === 'admin' ? '/admin' : fallbackRole === 'company' ? '/create-job' : '/profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '90vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          width: 480, 
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          borderRadius: '12px'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏗️</div>
          <Title level={3} style={{ marginBottom: '8px', color: '#1890ff' }}>
            建筑用工撮合平台
          </Title>
          <Text type="secondary">
            精准匹配 · 过程保障 · 信用担保
          </Text>
        </div>

        <div
          style={{
            marginBottom: 20,
            padding: '12px',
            border: '1px solid #e6f4ff',
            borderRadius: 8,
            background: '#f8fbff'
          }}
        >
          <Text strong style={{ display: 'block', marginBottom: 8, color: '#0958d9' }}>
            一键进入业务页面
          </Text>
          <Space wrap size={[8, 8]}>
            <Button size="small" onClick={() => enterDemo('worker', '/profile')}>个人中心</Button>
            <Button size="small" onClick={() => enterDemo('worker', '/jobs')}>搜索筛选</Button>
            <Button size="small" onClick={() => enterDemo('company', '/create-job')}>提交招工</Button>
            <Button size="small" type="primary" onClick={() => enterDemo('admin', '/admin')}>后台管理</Button>
          </Space>
        </div>

        {errorInfo && (
          <Alert
            message={errorInfo.message}
            description={
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '13px' }}>
                {errorInfo.suggestion}
              </div>
            }
            type="error"
            showIcon
            closable
            onClose={() => setErrorInfo(null)}
            style={{ marginBottom: '24px' }}
          />
        )}

        <Form
          name="login"
          onFinish={onFinish}
          size="large"
          initialValues={{ phone: '13800000001', password: '123456' }}
        >
          <Form.Item
            name="phone"
            rules={[{ required: true, message: '请输入账号' }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#1890ff' }} />} 
              placeholder="请输入手机号或管理员账号" 
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#1890ff' }} />}
              placeholder="请输入登录密码"
              allowClear
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '16px' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              block
              loading={loading}
              style={{ 
                height: '48px', 
                fontSize: '16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              {loading ? '登录中...' : '登 录'}
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            还没有账号？<Link to="/register" style={{ fontWeight: '500' }}>立即注册</Link>
          </div>
        </Form>

        <Divider style={{ margin: '16px 0' }}>
          <Tag color="blue"><KeyOutlined /> 测试账号</Tag>
        </Divider>

        <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
          <Space direction="vertical" size="small" style={{ width: '100%', fontSize: '12px' }}>
            <div>
              <SafetyOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
              <Text strong style={{ color: '#52c41a' }}>管理员：</Text>
              <Text code>admin</Text> / <Text code>123456</Text>
              <Button size="small" type="link" onClick={() => loginDemoAccount('admin', '123456')}>一键登录</Button>
            </div>
            <div>
              <SafetyOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
              <Text strong style={{ color: '#1890ff' }}>工友：</Text>
              <Text code>13800000001</Text> / <Text code>123456</Text>
              <Button size="small" type="link" onClick={() => loginDemoAccount('13800000001', '123456')}>一键登录</Button>
            </div>
            <div>
              <SafetyOutlined style={{ color: '#722ed1', marginRight: '4px' }} />
              <Text strong style={{ color: '#722ed1' }}>企业：</Text>
              <Text code>13900000001</Text> / <Text code>123456</Text>
              <Button size="small" type="link" onClick={() => loginDemoAccount('13900000001', '123456')}>一键登录</Button>
            </div>
            <div>
              <SafetyOutlined style={{ color: '#fa8c16', marginRight: '4px' }} />
              <Text strong style={{ color: '#fa8c16' }}>班组：</Text>
              <Text code>13700000001</Text> / <Text code>123456</Text>
              <Button size="small" type="link" onClick={() => loginDemoAccount('13700000001', '123456')}>一键登录</Button>
            </div>
          </Space>
        </Card>

        <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 16 }}>
          <Button block onClick={() => enterDemo('worker', '/profile')}>进入个人中心 / 我的申请</Button>
          <Button block onClick={() => enterDemo('worker', '/jobs')}>搜索筛选招工</Button>
          <Button block onClick={() => enterDemo('company', '/create-job')}>发布 / 提交招工</Button>
          <Button block type="primary" onClick={() => enterDemo('admin', '/admin')}>进入后台管理</Button>
        </Space>
      </Card>
    </div>
  );
}

export default Login;
