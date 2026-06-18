import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, App, Divider, Tag } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, roleNames } from '../store/auth';
import type { UserRole } from '../store/auth';

const { Title, Text } = Typography;

interface TestAccount {
  username: string;
  name: string;
  role: UserRole;
  password: string;
}

const testAccounts: TestAccount[] = [
  { username: 'admin', name: '系统管理员', role: 'admin', password: 'admin123' },
  { username: 'platform', name: '平台运营', role: 'store_manager', password: 'platform123' },
  { username: 'ops', name: '运维管理', role: 'store_manager', password: 'ops123' },
  { username: 'owner1', name: '张三', role: 'owner', password: '123456' },
  { username: 'designer1', name: '王设计', role: 'designer', password: '123456' },
  { username: 'supervisor1', name: '赵监理', role: 'supervisor', password: '123456' },
  { username: 'supplier1', name: '孙供应商', role: 'supplier', password: '123456' },
  { username: 'manager1', name: '吴经理', role: 'store_manager', password: '123456' },
];

const roleColorMap: Record<UserRole, string> = {
  admin: 'red',
  owner: 'blue',
  designer: 'purple',
  supervisor: 'orange',
  supplier: 'green',
  store_manager: 'cyan',
};

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const { message } = App.useApp();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError('');
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      navigate('/dashboard');
    } catch (err: any) {
      const status = err.response?.status;
      const serverError = err.response?.data?.error;
      if (status === 401) {
        setError(serverError || '用户名或密码错误，请核实后重试');
      } else if (status === 403) {
        setError(serverError || '该账号已被禁用，请联系管理员');
      } else if (status === 400) {
        setError(serverError || '请求参数不合法，请检查输入');
      } else if (!err.response) {
        setError('网络连接失败，请检查网络或稍后重试');
      } else {
        setError(serverError || `登录失败（错误码: ${status}），请稍后重试`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (acc: TestAccount) => {
    onFinish({ username: acc.username, password: acc.password });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 50%, #1a202c 100%)',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 520,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          borderRadius: 16,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <SafetyCertificateOutlined style={{ fontSize: 40, color: '#1890ff', marginBottom: 12 }} />
          <Title level={2} style={{ marginBottom: 8 }}>
            家装产业协同SaaS平台
          </Title>
          <Text type="secondary">Home Decoration Industry Collaboration Platform</Text>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            closable
            onClose={() => setError('')}
            style={{ marginBottom: 24 }}
          />
        )}

        <Form
          name="login"
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '16px 0' }}>测试账号快捷登录</Divider>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {testAccounts.map((acc) => (
            <Button
              key={acc.username}
              size="small"
              onClick={() => handleQuickLogin(acc)}
              disabled={loading}
              style={{ height: 'auto', padding: '4px 8px', textAlign: 'left' }}
            >
              <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, lineHeight: 1.2 }}>
                <span>
                  <Tag color={roleColorMap[acc.role]} style={{ marginRight: 4, marginLeft: -4 }}>
                    {roleNames[acc.role]}
                  </Tag>
                  {acc.name}
                </span>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {acc.username}:{acc.password}
                </Text>
              </span>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Login;
