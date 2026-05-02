import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api';
import { useUserStore } from '../store';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setToken = useUserStore((state) => state.setToken);
  const setUser = useUserStore((state) => state.setUser);
  const [loading, setLoading] = React.useState(false);
  const [form] = Form.useForm();

  const from = location.state?.from?.pathname || '/';

  const handleQuickLogin = async (username) => {
    setLoading(true);
    try {
      const res = await authApi.login({ username, password: '123456' });
      const token = res.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(token);
      setUser(res.data.user);
      message.success('登录成功');
      navigate(from, { replace: true });
    } catch (error) {
      console.error('登录失败:', error);
      message.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await authApi.login(values);
      const token = res.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(token);
      setUser(res.data.user);
      message.success('登录成功');
      navigate(from, { replace: true });
    } catch (error) {
      console.error('登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-form">
        <h1 className="login-title">内部即时通讯系统</h1>
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          initialValues={{ username: 'admin', password: '123456' }}
          autoComplete="off"
          size="large"
        >
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
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>

          <div style={{ fontSize: '12px', color: '#999', textAlign: 'center', marginBottom: '12px' }}>
            <p>快速登录（点击下方按钮即可登录）：</p>
          </div>

          <Form.Item>
            <Button
              type="default"
              block
              onClick={() => handleQuickLogin('admin')}
              loading={loading}
              style={{ marginBottom: '8px' }}
            >
              admin / 超级管理员
            </Button>
            <Button
              type="default"
              block
              onClick={() => handleQuickLogin('zhangsan')}
              loading={loading}
              style={{ marginBottom: '8px' }}
            >
              zhangsan / 部门负责人
            </Button>
            <Button
              type="default"
              block
              onClick={() => handleQuickLogin('lisi')}
              loading={loading}
            >
              lisi / 普通员工
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
