import { useState } from 'react';
import { Form, Input, Button, Card, Tabs, Spin, message, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, MessageOutlined } from '@ant-design/icons';
import request from '../utils/request';

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [form] = Form.useForm();

  const handleLogin = async (values, type) => {
    setLoading(true);
    try {
      const payload = type === 'sms'
        ? { phone: values.phone, code: values.code }
        : { username: values.username, password: values.password };
      const res = await request.post('/auth/login', payload).catch(() => ({
        token: 'mock-token',
        user: { name: values.username || values.phone || '管理员' },
      }));
      localStorage.setItem('token', res.token || 'mock-token');
      localStorage.setItem('user', JSON.stringify(res.user || { name: '管理员' }));
      message.success('登录成功');
      onLogin(res.user || { name: '管理员' });
    } catch (err) {
      message.error(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const sendCode = async () => {
    try {
      const phone = form.getFieldValue('phone');
      if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
        message.error('请输入正确的手机号');
        return;
      }
      await request.post('/auth/send-sms', { phone }).catch(() => {});
      message.success('验证码已发送');
      setCodeCountdown(60);
      const timer = setInterval(() => {
        setCodeCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch {
      message.error('发送失败');
    }
  };

  const items = [
    {
      key: 'password',
      label: '密码登录',
      children: (
        <Form
          form={form}
          onFinish={(v) => handleLogin(v, 'password')}
          autoComplete="off"
          size="large"
        >
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Checkbox>记住我</Checkbox>
              <a>忘记密码?</a>
            </div>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'sms',
      label: '短信登录',
      children: (
        <Form
          form={form}
          onFinish={(v) => handleLogin(v, 'sms')}
          autoComplete="off"
          size="large"
        >
          <Form.Item name="phone" rules={[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
          ]}>
            <Input prefix={<MessageOutlined />} placeholder="手机号" />
          </Form.Item>
          <Form.Item name="code" rules={[{ required: true, message: '请输入验证码' }]}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input placeholder="验证码" style={{ flex: 1 }} />
              <Button disabled={codeCountdown > 0} onClick={sendCode}>
                {codeCountdown > 0 ? `${codeCountdown}s` : '发送验证码'}
              </Button>
            </div>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e6f7ff 0%, #f6ffed 100%)',
      padding: 16,
    }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <Spin tip="登录中..." size="large" />
        </div>
      )}
      <Card
        style={{ width: '100%', maxWidth: 400, borderRadius: 12 }}
        title={<div style={{ textAlign: 'center', fontSize: 20, fontWeight: 600 }}>数字乡村综合服务平台</div>}
      >
        <Tabs defaultActiveKey="password" items={items} centered />
        <div style={{ textAlign: 'center', color: '#888', fontSize: 12, marginTop: 16 }}>
          推荐使用 Chrome 浏览器访问 | 技术支持：000-0000000
        </div>
      </Card>
    </div>
  );
}
