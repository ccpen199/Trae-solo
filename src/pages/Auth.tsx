import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Alert, Button, Card, Form, Input, Segmented, Space, Typography, Tag } from 'antd';
import { LockOutlined, UserOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

type Mode = 'login' | 'register';

const quickAccounts = [
  { label: '代理人', username: 'agent', password: 'agent123' },
  { label: '后台管理员', username: 'admin', password: 'Admin@123' },
  { label: '企业客户', username: 'client01', password: 'client123' },
];

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>(location.pathname.includes('register') ? 'register' : 'login');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const submit = async (values: { username: string; password: string; displayName?: string }) => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || '认证失败');
      localStorage.setItem('ip_platform_token', payload.data.token);
      localStorage.setItem('ip_platform_user', JSON.stringify(payload.data.user));
      setMessage({ type: 'success', text: mode === 'login' ? '登录成功，正在进入工作台' : '注册成功，正在进入工作台' });
      setTimeout(() => navigate('/dashboard'), 400);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '认证失败' });
    } finally {
      setLoading(false);
    }
  };

  const fillQuick = (account: (typeof quickAccounts)[number]) => {
    setMode('login');
    form.setFieldsValue(account);
    setMessage(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'linear-gradient(135deg, #f5f7ff 0%, #eef8ff 48%, #fff7fb 100%)',
      }}
    >
      <Card variant="borderless" style={{ width: 'min(960px, 100%)', borderRadius: 16, boxShadow: '0 16px 48px rgba(15, 23, 42, 0.12)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 390px', gap: 32 }}>
          <div style={{ padding: 12 }}>
            <Tag color="blue" style={{ marginBottom: 16 }}>SQLite 本地认证</Tag>
            <Title level={2} style={{ marginTop: 0 }}>知产全链条平台账号中心</Title>
            <Text type="secondary" style={{ fontSize: 15, lineHeight: 1.8 }}>
              登录注册动作写入本地 auth_events 表，便于后台管理复查。认证成功后进入工作台，
              可继续使用商标检索、专利年费、版权存证和代理人管理流程。
            </Text>
            <div style={{ marginTop: 16, color: '#595959', fontSize: 13, lineHeight: 1.7 }}>
              演示账号：agent / agent123、admin / Admin@123、client01 / client123
            </div>
            <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {quickAccounts.map((account) => (
                <Button key={account.username} onClick={() => fillQuick(account)}>
                  {account.label}
                </Button>
              ))}
            </div>
            <div style={{ marginTop: 28 }}>
              <Link to="/dashboard">返回工作台</Link>
            </div>
          </div>

          <div>
            <Segmented
              block
              value={mode}
              onChange={(value) => {
                setMode(value as Mode);
                setMessage(null);
              }}
              options={[
                { label: '登录', value: 'login', icon: <LoginOutlined /> },
                { label: '注册', value: 'register', icon: <UserAddOutlined /> },
              ]}
              style={{ marginBottom: 20 }}
            />

            {message && <Alert type={message.type} message={message.text} showIcon style={{ marginBottom: 16 }} />}

            <Form
              form={form}
              layout="vertical"
              initialValues={{ username: 'agent', password: 'agent123' }}
              onFinish={submit}
            >
              <Form.Item label="账号" name="username" rules={[{ required: true, message: '请输入账号' }]}>
                <Input prefix={<UserOutlined />} placeholder="agent / admin / client01" size="large" />
              </Form.Item>

              {mode === 'register' && (
                <Form.Item label="显示名称" name="displayName">
                  <Input placeholder="例如：企业知识产权负责人" size="large" />
                </Form.Item>
              )}

              <Form.Item label="密码" name="password" rules={[{ required: true, min: 6, message: '密码至少 6 位' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" size="large" />
              </Form.Item>

              <Space direction="vertical" style={{ width: '100%' }}>
                <Button type="primary" htmlType="submit" loading={loading} size="large" block>
                  {mode === 'login' ? '登录并进入工作台' : '注册并进入工作台'}
                </Button>
              </Space>
            </Form>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
