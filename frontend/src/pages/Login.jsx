import React, { useState } from 'react';
import { Card, Form, Input, Button, Select, message, Tabs, Alert, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const roles = [
  { value: 'customer', label: '用户' },
  { value: 'service_agent', label: '客服' },
  { value: 'dispatcher', label: '调度' },
  { value: 'engineer', label: '工程师' },
  { value: 'finance', label: '财务' },
];

export default function Login({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState(null);

  const doLogin = async (username, password) => {
    console.log('[Login] doLogin called:', username);
    setLoading(true);
    setLastError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      console.log('[Login] HTTP status:', response.status);

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        const errMsg = '服务器返回格式异常';
        console.error('[Login] JSON parse error:', parseErr);
        message.error(errMsg);
        setLastError(errMsg);
        return;
      }

      console.log('[Login] Response data:', JSON.stringify(data).substring(0, 200));

      if (!response.ok) {
        const errMsg = data.error || `登录失败 (HTTP ${response.status})`;
        console.error('[Login] Login failed:', errMsg);
        message.error(errMsg);
        setLastError(errMsg);
        return;
      }

      if (!data.token || !data.user) {
        const errMsg = '登录返回数据不完整';
        console.error('[Login] Incomplete data:', data);
        message.error(errMsg);
        setLastError(errMsg);
        return;
      }

      console.log('[Login] Login success, calling onLoginSuccess');
      message.success(`登录成功！欢迎 ${data.user.name}（${data.user.role}）`);
      onLoginSuccess(data.user, data.token);

    } catch (err) {
      const errMsg = '网络请求失败：' + (err.message || '未知错误');
      console.error('[Login] Network error:', err);
      message.error(errMsg);
      setLastError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFormLogin = (values) => {
    console.log('[Login] Form submitted:', values.username);
    doLogin(values.username, values.password);
  };

  const handleFormRegister = async (values) => {
    console.log('[Login] Register submitted:', values.username);
    setLoading(true);
    setLastError(null);
    try {
      const { confirm, ...rest } = values;
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest),
      });
      const data = await res.json();
      if (!res.ok) {
        message.error(data.error || '注册失败');
        setLastError(data.error || '注册失败');
        return;
      }
      message.success('注册成功，正在自动登录...');
      await doLogin(values.username, values.password);
    } catch (err) {
      message.error('注册失败：' + err.message);
      setLastError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5', padding: 20 }}>
      <div style={{ width: 440, maxWidth: '100%' }}>
        <Card title={<span style={{ fontSize: 20 }}>上门服务派单系统</span>} style={{ marginBottom: 16 }}>
          {lastError && (
            <Alert type="error" showIcon message="登录失败" description={lastError} closable onClose={() => setLastError(null)} style={{ marginBottom: 16 }} />
          )}

          <Tabs
            defaultActiveKey="login"
            items={[
              {
                key: 'login',
                label: '登录',
                children: (
                  <Form onFinish={handleFormLogin} layout="vertical" size="large">
                    <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                      <Input prefix={<UserOutlined />} placeholder="请输入用户名" disabled={loading} />
                    </Form.Item>
                    <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                      <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" disabled={loading} />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={loading} block>登 录</Button>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: 'register',
                label: '注册',
                children: (
                  <Form onFinish={handleFormRegister} layout="vertical" size="large">
                    <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                      <Input prefix={<UserOutlined />} placeholder="用户名" disabled={loading} />
                    </Form.Item>
                    <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                      <Input.Password prefix={<LockOutlined />} placeholder="密码" disabled={loading} />
                    </Form.Item>
                    <Form.Item name="confirm" dependencies={['password']} rules={[
                      { required: true, message: '请确认密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) return Promise.resolve();
                          return Promise.reject(new Error('两次密码不一致'));
                        },
                      }),
                    ]}>
                      <Input.Password prefix={<LockOutlined />} placeholder="确认密码" disabled={loading} />
                    </Form.Item>
                    <Form.Item name="name" rules={[{ required: true, message: '请输入姓名' }]}>
                      <Input placeholder="姓名" disabled={loading} />
                    </Form.Item>
                    <Form.Item name="role" rules={[{ required: true, message: '请选择角色' }]}>
                      <Select placeholder="选择角色" options={roles} disabled={loading} />
                    </Form.Item>
                    <Form.Item name="phone">
                      <Input placeholder="手机号（可选）" disabled={loading} />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={loading} block>注 册</Button>
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />
        </Card>

        <Card title="快捷登录（演示账号，密码: 123456）" size="small">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 16 }}><Spin tip="登录中..." /></div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Button onClick={() => doLogin('customer1', '123456')}>customer1（用户）</Button>
              <Button onClick={() => doLogin('agent1', '123456')}>agent1（客服）</Button>
              <Button onClick={() => doLogin('dispatcher1', '123456')}>dispatcher1（调度）</Button>
              <Button onClick={() => doLogin('engineer1', '123456')}>engineer1（工程师）</Button>
              <Button onClick={() => doLogin('finance1', '123456')}>finance1（财务）</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
