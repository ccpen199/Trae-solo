import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Radio, Typography, Space, message, Divider, Tag } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { auth } from '../api/endpoints';
import { setToken, setUser, isLoggedIn } from '../utils/auth';
import type { UserRole } from '../types';

const { Title, Text } = Typography;

interface LoginForm {
  email: string;
  password: string;
  role: UserRole;
}

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<LoginForm>();
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn()) {
      navigate('/');
      return;
    }
    const roleParam = searchParams.get('role');
    if (roleParam === 'enterprise' || roleParam === 'jobseeker' || roleParam === 'admin') {
      form.setFieldsValue({ role: roleParam });
    }
  }, [searchParams, form, navigate]);

  const handleSubmit = async (values: LoginForm) => {
    try {
      setLoading(true);
      const response: any = await auth.login(values);
      const result = response?.data || response;
      setToken(result.token);
      setUser(result.user);
      message.success('登录成功');

      const { role } = result.user;
      navigate('/');
    } catch (error: any) {
      console.error('Login failed:', error);
      message.error(error?.response?.data?.message || '登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'enterprise' as UserRole, email: 'enterprise@example.com', password: '123456', label: '企业账号', desc: '岗位管理/简历解析/人才推荐' },
    { role: 'jobseeker' as UserRole, email: 'jobseeker@example.com', password: '123456', label: '求职者账号', desc: '简历编辑/求职广场/社群' },
    { role: 'admin' as UserRole, email: 'admin@example.com', password: '123456', label: '管理员账号', desc: '企业审核/信用档案/敏感词' },
  ];

  const handleDemoLogin = async (account: typeof demoAccounts[0]) => {
    try {
      setDemoLoading(account.role);
      const response: any = await auth.login({ email: account.email, password: account.password, role: account.role });
      const result = response?.data || response;
      setToken(result.token);
      setUser(result.user);
      message.success(`${account.label}登录成功`);

      navigate('/');
    } catch (error: any) {
      message.error(error?.response?.data?.message || '演示账号登录失败');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card style={{ width: 420, boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>
            印刷人才招聘平台
          </Title>
          <Text type="secondary">专业印刷行业人才服务平台</Text>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          initialValues={{ role: 'enterprise' }}
          size="large"
        >
          <Form.Item
            name="role"
            rules={[{ required: true, message: '请选择登录角色' }]}
          >
            <Radio.Group optionType="button" buttonStyle="solid" style={{ width: '100%' }}>
              <Radio.Button value="enterprise" style={{ width: '33.33%', textAlign: 'center' }}>
                企业
              </Radio.Button>
              <Radio.Button value="jobseeker" style={{ width: '33.33%', textAlign: 'center' }}>
                求职者
              </Radio.Button>
              <Radio.Button value="admin" style={{ width: '33.33%', textAlign: 'center' }}>
                管理员
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              icon={<LoginOutlined />}
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <ThunderboltOutlined style={{ color: '#faad14' }} /> 快速体验
          </Text>
        </Divider>

        <div style={{ marginBottom: '16px' }}>
          {demoAccounts.map(account => (
            <Button
              key={account.role}
              block
              size="large"
              style={{
                marginBottom: '8px',
                borderColor: account.role === 'enterprise' ? '#1890ff' :
                            account.role === 'jobseeker' ? '#52c41a' : '#722ed1',
                color: account.role === 'enterprise' ? '#1890ff' :
                       account.role === 'jobseeker' ? '#52c41a' : '#722ed1',
              }}
              onClick={() => handleDemoLogin(account)}
              loading={demoLoading === account.role}
            >
              <Space direction="vertical" size={0} style={{ alignItems: 'flex-start' }}>
                <Text strong style={{ color: 'inherit', fontSize: '14px' }}>
                  {account.label}
                </Text>
                <Text style={{ fontSize: '11px', color: 'rgba(0,0,0,0.45)' }}>
                  {account.desc}
                </Text>
              </Space>
            </Button>
          ))}
        </div>

        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <Text type="secondary">还没有账号？</Text>
          <Link to="/register">立即注册</Link>
        </Space>
      </Card>
    </div>
  );
};

export default Login;
