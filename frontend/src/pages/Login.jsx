import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, message, Typography, Divider, Alert, Space, Tag } from 'antd';
import { LockOutlined, SendOutlined, UserOutlined, SafetyCertificateOutlined, CarOutlined, ArrowRightOutlined, LoadingOutlined } from '@ant-design/icons';
import { authAPI } from '../api';
import { saveToken, saveUser, removeToken, removeUser, getUserRole, getToken } from '../utils/auth';

const { Title, Text } = Typography;

const roleRedirectMap = {
  requester: '/requester/publish',
  courier: '/courier/available',
  admin: '/admin/dashboard',
};

const roleLabelMap = {
  requester: '需求方',
  courier: '跑腿员',
  admin: '平台运营',
};

const demoAccounts = [
  { label: '平台运营', sublabel: '运营看板 · 调度 · 质检', username: 'admin', alias: 'platform / ops', password: 'admin123', role: 'admin', color: '#722ed1' },
  { label: '需求方', sublabel: '发布任务 · 查看订单', username: 'requester', alias: 'user', password: 'user123', role: 'requester', color: '#1890ff' },
  { label: '跑腿员', sublabel: '接单 · 打卡 · 留痕', username: 'courier', alias: 'runner', password: 'courier123', role: 'courier', color: '#52c41a' },
];

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [form] = Form.useForm();
  const location = useLocation();

  const existingToken = getToken();
  const existingRole = getUserRole();
  if (existingToken && existingRole && location.pathname === '/login') {
    const redirectPath = roleRedirectMap[existingRole];
    if (redirectPath) {
      message.info('检测到已登录状态，正在跳转...');
      window.location.href = redirectPath;
      return null;
    }
  }

  const performRedirect = (role) => {
    const redirectPath = roleRedirectMap[role];
    if (!redirectPath) {
      setErrorMsg(`未知角色类型: ${role}，请联系管理员`);
      setLoading(false);
      return;
    }
    setLoading(false);
    window.location.href = redirectPath;
  };

  const handleLogin = async (values) => {
    setErrorMsg('');
    setLoading(true);

    const loginPayload = {};
    const accountInput = values.username || values.phone || '';
    const phoneRegex = /^1[3-9]\d{9}$/;

    if (phoneRegex.test(accountInput)) {
      loginPayload.phone = accountInput;
    } else {
      loginPayload.username = accountInput;
    }
    loginPayload.password = values.password;

    try {
      removeToken();
      removeUser();

      const apiData = await authAPI.login(loginPayload);
      const token = apiData.token;
      const user = apiData.user;

      if (!token || !user) {
        setErrorMsg('服务器返回数据异常，请稍后重试');
        setLoading(false);
        return;
      }

      if (!user.role || !roleRedirectMap[user.role]) {
        setErrorMsg(`未知角色类型: ${user.role || '空'}，请联系管理员`);
        setLoading(false);
        return;
      }

      if (user.status && user.status !== 'active') {
        const statusText = user.status === 'blacklisted' ? '账号已被加入黑名单' : user.status === 'suspended' ? '账号已被冻结' : `账号状态异常(${user.status})`;
        setErrorMsg(statusText);
        setLoading(false);
        return;
      }

      saveToken(token);
      saveUser(user);

      const roleLabel = user.roleLabel || roleLabelMap[user.role] || '';

      message.success({
        content: (
          <span>
            登录成功！欢迎 <Tag color={user.role === 'admin' ? 'purple' : user.role === 'courier' ? 'green' : 'blue'}>{roleLabel}</Tag> {user.name || ''}
          </span>
        ),
        duration: 1,
      });

      setTimeout(() => {
        performRedirect(user.role);
      }, 300);
    } catch (err) {
      setLoading(false);
      let msg = '登录失败，请检查账号密码';
      if (err.response) {
        const { status, data } = err.response;
        if (status === 401) {
          msg = data?.error || '账号或密码错误，请重新输入';
        } else if (status === 403) {
          msg = data?.error || '账号已被禁用，请联系管理员';
        } else if (status === 400) {
          msg = data?.error || '请求参数错误';
        } else if (status >= 500) {
          msg = '服务器异常，请稍后重试';
        } else {
          msg = data?.error || '登录失败';
        }
      } else if (err.request) {
        msg = '网络连接失败，请检查网络后重试';
      }
      setErrorMsg(msg);
    }
  };

  const handleDemoLogin = (account) => {
    if (loading) return;
    form.setFieldsValue({ username: account.username, password: account.password });
    form.submit();
  };

  const getRoleIcon = (role) => {
    if (role === 'admin') return <SafetyCertificateOutlined />;
    if (role === 'requester') return <UserOutlined />;
    return <CarOutlined />;
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 12,
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        }}
        styles={{ body: { padding: '36px 36px 24px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <SendOutlined style={{ fontSize: 44, color: '#667eea', marginBottom: 12 }} />
          <Title level={3} style={{ marginBottom: 4 }}>同城即时服务调度平台</Title>
          <Text type="secondary">快速 · 可靠 · 可追溯的同城跑腿服务调度系统</Text>
        </div>

        {errorMsg && (
          <Alert
            message="登录失败"
            description={errorMsg}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMsg('')}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          size="large"
          autoComplete="off"
          initialValues={{ username: '', password: '' }}
          style={{ display: 'block' }}
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入账号（手机号/用户名/角色名）' },
            ]}
            style={{ display: 'block' }}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入账号：手机号 / admin / platform / ops / requester / courier"
              maxLength={30}
              allowClear
              disabled={loading}
              style={{ display: 'block' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
            style={{ display: 'block' }}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码（演示密码：admin123 / user123 / courier123）"
              disabled={loading}
              onPressEnter={(e) => { e.preventDefault(); form.submit(); }}
              style={{ display: 'block' }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8, display: 'block' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              icon={loading ? <LoadingOutlined /> : <ArrowRightOutlined />}
              style={{
                height: 44,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 500,
                display: 'block',
              }}
            >
              {loading ? '登录中...' : '登录进入'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            权限边界说明：不同角色进入不同工作台，数据与菜单严格隔离
          </Text>
        </div>

        <Divider style={{ margin: '12px 0 12px', color: '#bbb', fontSize: 12 }}>
          演示账号 · 一键登录
        </Divider>

        <Space direction="vertical" style={{ width: '100%', display: 'flex' }} size={8}>
          {demoAccounts.map((account) => (
            <Button
              key={account.role}
              block
              loading={loading}
              disabled={loading}
              onClick={() => handleDemoLogin(account)}
              style={{
                height: 60,
                textAlign: 'left',
                padding: '0 16px',
                borderRadius: 8,
                border: `1px solid ${account.color}33`,
                background: `${account.color}08`,
                display: 'block',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: `${account.color}20`,
                  color: account.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                  flexShrink: 0,
                  fontSize: 18,
                }}>
                  {getRoleIcon(account.role)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#333', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {account.label}
                    <Tag color={account.color} style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>
                      {roleLabelMap[account.role]}
                    </Tag>
                  </div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>
                    {account.sublabel}
                  </div>
                  <div style={{ fontSize: 10, color: '#bbb', marginTop: 2, fontFamily: 'monospace' }}>
                    {account.username}:{account.password} · 别名 {account.alias}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </Space>

        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px dashed #eee' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            💡 角色功能边界：<br />
            <Tag color="purple" style={{ marginRight: 4 }}>平台运营</Tag>管理台：看板 · 订单 · 跑腿员 · 调度 · 质检 · 信用 · 企业API · 区域<br />
            <Tag color="blue" style={{ marginRight: 4 }}>需求方</Tag>工作台：发布任务 · 我的订单 · 双向评价<br />
            <Tag color="green" style={{ marginRight: 4 }}>跑腿员</Tag>工作台：待接订单 · 上门打卡 · 服务留痕 · 完成确认
          </Text>
        </div>
      </Card>
    </div>
  );
}
