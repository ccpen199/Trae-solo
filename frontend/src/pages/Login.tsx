import { useState } from 'react';
import { Form, Input, Button, Card, Tabs, message, Radio, Alert } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const [loginError, setLoginError] = useState('');

  const handleLogin = async (values: any) => {
    setLoading(true);
    setLoginError('');
    try {
      const result = await authApi.login(values);
      if (!result.token || !result.user) {
        setLoginError('服务器返回数据异常，请稍后重试');
        return;
      }
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      message.success('登录成功，正在跳转...');
      navigate(from, { replace: true });
    } catch (error: any) {
      const status = error?.response?.status;
      const errMsg = error?.response?.data?.error || error?.message || '';
      if (status === 401) {
        setLoginError('用户名或密码错误，请检查后重试');
      } else if (status === 400) {
        setLoginError(errMsg || '请求参数错误');
      } else if (!error?.response) {
        setLoginError('无法连接到服务器，请检查网络或稍后重试');
      } else {
        setLoginError(errMsg || `登录失败（${status}），请稍后重试`);
      }
    } finally {
      setLoading(false);
    }
  };

  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');

  const handleRegister = async (values: any) => {
    setLoading(true);
    setRegisterError('');
    setRegisterSuccess('');
    try {
      await authApi.register(values);
      setRegisterSuccess('注册成功！请切换到"用户登录"标签页，使用新账号登录');
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || error?.message || '';
      if (!error?.response) {
        setRegisterError('无法连接到服务器，请检查网络或稍后重试');
      } else {
        setRegisterError(errMsg || '注册失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card">
        <div className="login-title">
          <h2>🏠 家政从业者赋能工作台</h2>
          <p>Housekeeping Worker Empowerment Platform</p>
        </div>
        <Tabs
          defaultActiveKey="login"
          centered
          items={[
            {
              key: 'login',
              label: '用户登录',
              children: (
                <Form name="login" onFinish={handleLogin} size="large" layout="vertical">
                  <Form.Item
                    name="username"
                    rules={[{ required: true, message: '请输入用户名' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="用户名" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}>
                      登 录
                    </Button>
                  </Form.Item>
                  {loginError && (
                    <Alert
                      message={loginError}
                      type="error"
                      showIcon
                      closable
                      onClose={() => setLoginError('')}
                      style={{ marginBottom: 16 }}
                    />
                  )}
                  <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
                    <p style={{ margin: '8px 0' }}>
                      测试账号：admin/admin123（管理员）| worker1/worker123（阿姨）| employer1/employer123（雇主）
                    </p>
                  </div>
                </Form>
              ),
            },
            {
              key: 'register',
              label: '用户注册',
              children: (
                <Form name="register" onFinish={handleRegister} size="large" layout="vertical">
                  <Form.Item
                    name="username"
                    rules={[{ required: true, message: '请输入用户名' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="设置用户名" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: '请输入密码' },
                      { min: 6, message: '密码至少6位' },
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="设置密码" />
                  </Form.Item>
                  <Form.Item
                    name="role"
                    label="注册身份"
                    rules={[{ required: true, message: '请选择身份' }]}
                    initialValue="worker"
                  >
                    <Radio.Group>
                      <Radio value="worker">阿姨/服务者</Radio>
                      <Radio value="employer">雇主</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item
                    name="phone"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
                    ]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="手机号" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}>
                      注 册
                    </Button>
                  </Form.Item>
                  {registerError && (
                    <Alert message={registerError} type="error" showIcon closable onClose={() => setRegisterError('')} style={{ marginBottom: 16 }} />
                  )}
                  {registerSuccess && (
                    <Alert message={registerSuccess} type="success" showIcon closable onClose={() => setRegisterSuccess('')} style={{ marginBottom: 16 }} />
                  )}
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
