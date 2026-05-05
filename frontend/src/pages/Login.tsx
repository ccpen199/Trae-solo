import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Navigate } from 'react-router-dom';
import { authApi } from '@/api';
import { useAuthStore } from '@/store';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { token, setAuth } = useAuthStore();
  const navigate = useNavigate();

  if (token) {
    return <Navigate to="/scheduling" replace />;
  }

  const onFinish = async (values: { erpId: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(values.erpId, values.password);
      setAuth(res.data.token, res.data.user);
      message.success('登录成功');
      navigate('/scheduling');
    } catch (error: any) {
      message.error(error.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card title="大件订单多维度调度系统" style={{ width: 400 }}>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="erpId"
            rules={[{ required: true, message: '请输入ERPID' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="ERPID" />
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

          <div style={{ color: '#999', fontSize: '12px', textAlign: 'center' }}>
            <p>测试账号：</p>
            <p>管理员: admin / admin123</p>
            <p>北京调度员: scheduler_bj / 123456</p>
            <p>上海调度员: scheduler_sh / 123456</p>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
