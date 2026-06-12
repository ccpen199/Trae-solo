import { Form, Input, Button, Card, Tabs, Typography, App, Alert, Space, Tag, Divider, Spin } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef } from 'react';
import api from '../api';
import { useAppStore, User } from '../store';

const { Title, Text, Paragraph } = Typography;

const TEST_ACCOUNTS = [
  { username: 'admin', name: '系统管理员', desc: '全部权限', role: 'admin' },
  { username: 'hr01', name: 'HR招聘专员', desc: '招聘、线索、聊天', role: 'hr' },
  { username: 'trainer01', name: '培训管理员', desc: '课程、学习、证书', role: 'trainer' },
  { username: 'seeker01', name: '个人求职者', desc: '简历、岗位、社区', role: 'jobseeker' },
];

const ROLE_NAMES: Record<string, string> = {
  admin: '系统管理员',
  hr: 'HR招聘专员',
  trainer: '培训管理员',
  jobseeker: '个人求职者',
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAppStore(s => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [statusInfo, setStatusInfo] = useState<string | null>(null);
  const { message: msg } = App.useApp();
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const navigatingRef = useRef(false);

  const doNavigate = (target: string) => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    navigate(target, { replace: true });
  };

  const onLogin = async (values: { username: string; password: string }) => {
    if (navigatingRef.current) return;
    setLoading(true);
    setLoginError(null);
    setStatusInfo(`正在验证 ${values.username} ...`);

    try {
      if (!values.username || !values.password) {
        throw new Error('请填写用户名和密码');
      }

      const data = await api.post('/auth/login', { username: values.username, password: values.password }) as any;

      if (!data?.token || !data?.user) {
        throw new Error(data?.error || '服务器返回异常，请稍后重试');
      }

      setAuth(data.token, data.user);

      const userRole = data.user.role;
      const roleName = ROLE_NAMES[userRole] || userRole;
      setStatusInfo(`✅ 登录成功！身份：${roleName}（${userRole}），正在进入工作台...`);
      msg.success(`欢迎回来，${data.user.name || data.user.username}！角色：${roleName}`);

      const from = (location.state as any)?.from?.pathname;
      const target = from && from !== '/login' ? from : '/dashboard';
      doNavigate(target);
    } catch (e: any) {
      const raw = e?.error || e?.message || '登录失败，请检查网络连接';
      let detail: string;
      let accountStatus = '';

      if (raw.includes('不存在') || raw.includes('用户')) {
        detail = '用户不存在，请检查用户名或注册新账号';
        accountStatus = '账号状态：未找到对应用户';
      } else if (raw.includes('密码')) {
        detail = '密码错误，请重试';
        accountStatus = '账号状态：用户存在但密码不匹配（测试密码：123456）';
      } else if (raw.includes('禁用') || raw.includes('disabled')) {
        detail = '账号已被禁用，请联系管理员';
        accountStatus = '账号状态：已禁用';
      } else if (raw.includes('填写') || raw.includes('必填')) {
        detail = '请填写用户名和密码';
        accountStatus = '';
      } else if (raw.includes('Network Error') || raw.includes('网络')) {
        detail = '网络连接失败，请检查后端服务是否启动（端口 59168）';
        accountStatus = '账号状态：无法连接服务器';
      } else {
        detail = raw;
        accountStatus = '';
      }

      setLoginError(`❌ ${detail}${accountStatus ? `\n${accountStatus}` : ''}`);
      msg.error(detail, 3);
      setStatusInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: any) => {
    setLoading(true);
    setLoginError(null);
    try {
      if (!values.username || !values.password || !values.email || !values.name) {
        throw new Error('请填写所有必填项');
      }
      const data = await api.post('/auth/register', values) as any;
      if (!data?.token || !data?.user) {
        throw new Error(data?.error || '注册返回异常');
      }
      setAuth(data.token, data.user);
      msg.success('注册成功，欢迎加入！');
      doNavigate('/dashboard');
    } catch (e: any) {
      const errorMsg = e?.error || e?.message || '注册失败';
      setLoginError(`❌ ${errorMsg}`);
      msg.error(errorMsg, 3);
    } finally {
      setLoading(false);
    }
  };

  const fillTestAccount = (username: string) => {
    setLoginError(null);
    setStatusInfo(null);
    loginForm.setFieldsValue({ username, password: '123456' });
    const account = TEST_ACCOUNTS.find(a => a.username === username);
    setStatusInfo(`已填充：${account?.name} (${username})，自动提交中...`);
    loginForm.submit();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }}>
      <Card style={{ width: 520, borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Title level={3} style={{ margin: 0, marginBottom: 4 }}>🏢 企业招聘与内训工作台</Title>
          <Text type="secondary">智能匹配 · 职场社区 · 在线学习</Text>
        </div>

        {loginError && (
          <Alert
            message="登录失败"
            description={<pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>{loginError}</pre>}
            type="error"
            showIcon
            closable
            onClose={() => setLoginError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        {statusInfo && !loginError && (
          <Alert
            message="当前状态"
            description={statusInfo}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Card
          size="small"
          style={{ marginBottom: 16, background: '#fafafa', borderColor: '#d6e4ff' }}
          title={<Text strong style={{ color: '#1677ff' }}>🎯 一键登录（点击即自动填充并提交）</Text>}
        >
          <Space wrap size={[8, 10]} style={{ width: '100%' }}>
            {TEST_ACCOUNTS.map(acc => (
              <Tag
                key={acc.username}
                color="blue"
                style={{
                  cursor: 'pointer',
                  padding: '8px 16px',
                  fontSize: 14,
                  borderRadius: 8,
                  userSelect: 'none',
                  border: '1px solid #91caff',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onClick={() => fillTestAccount(acc.username)}
              >
                <UserOutlined /> <strong>{acc.username}</strong>
                <Text type="secondary" style={{ marginLeft: 6, fontSize: 11 }}>
                  {acc.name} · {acc.desc}
                </Text>
              </Tag>
            ))}
          </Space>
          <Paragraph style={{ marginTop: 12, marginBottom: 0, fontSize: 13 }} type="secondary">
            🔑 所有测试账号密码统一为：<Text code style={{ fontSize: 14, fontWeight: 600 }}>123456</Text>
          </Paragraph>
        </Card>

        <Tabs
          defaultActiveKey="login"
          centered
          size="large"
          items={[
            {
              key: 'login', label: '账号登录',
              children: (
                <Form
                  form={loginForm}
                  onFinish={onLogin}
                  layout="vertical"
                  initialValues={{ username: '', password: '' }}
                >
                  <Form.Item
                    name="username"
                    rules={[{ required: true, message: '请输入用户名或邮箱' }]}
                    label={<Text strong>用户名 / 邮箱</Text>}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="请输入用户名或邮箱"
                      size="large"
                      autoComplete="username"
                    />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                    label={<Text strong>密码</Text>}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请输入密码"
                      size="large"
                      autoComplete="current-password"
                    />
                  </Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    loading={loading}
                    icon={<LoginOutlined />}
                    style={{ height: 46, fontSize: 16, fontWeight: 600, marginTop: 8 }}
                  >
                    {loading ? '正在登录...' : '登 录 进 入 工 作 台'}
                  </Button>
                  <div style={{ marginTop: 12, textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      遇到问题？请点击上方「一键登录」卡片中的账号直接体验
                    </Text>
                  </div>
                </Form>
              )
            },
            {
              key: 'register', label: '新用户注册',
              children: (
                <Form
                  form={registerForm}
                  onFinish={onRegister}
                  layout="vertical"
                >
                  <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]} label="用户名">
                    <Input size="large" placeholder="设置登录用户名" />
                  </Form.Item>
                  <Form.Item name="name" rules={[{ required: true, message: '请输入姓名' }]} label="姓名">
                    <Input size="large" placeholder="真实姓名" />
                  </Form.Item>
                  <Form.Item name="email" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]} label="邮箱">
                    <Input prefix={<MailOutlined />} size="large" placeholder="用于接收通知" />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, min: 6, message: '密码至少6位' }]} label="密码">
                    <Input.Password prefix={<LockOutlined />} size="large" placeholder="至少6位密码" />
                  </Form.Item>
                  <Form.Item name="role" label="选择角色" initialValue="jobseeker">
                    <select
                      className="ant-input ant-input-lg"
                      style={{ height: 40, width: '100%', borderRadius: 6, border: '1px solid #d9d9d9', padding: '0 11px', fontSize: 14 }}
                    >
                      <option value="jobseeker">个人求职者</option>
                      <option value="hr">HR招聘专员</option>
                      <option value="trainer">培训管理员</option>
                    </select>
                  </Form.Item>
                  <Form.Item name="tenantName" label="企业名称（HR/培训管理员必填）">
                    <Input size="large" placeholder="企业/组织名称" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ height: 46, fontSize: 15 }}>
                    注册并立即登录
                  </Button>
                </Form>
              )
            }
          ]}
        />

        <Divider style={{ margin: '14px 0' }} />
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            © 2026 企业招聘与内训一体化数字工作台 · 端口 前端 49168 / 后端 59168
          </Text>
        </div>
      </Card>
    </div>
  );
}
