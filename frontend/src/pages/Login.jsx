import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import api from '../utils/api';

function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', values);
      localStorage.setItem('token', response.data.token);
      onLogin(response.data.user);
      message.success('登录成功');
    } catch (error) {
      console.error('Login error:', error);
      let errorMsg = '登录失败';
      if (error.response) {
        errorMsg = error.response.data?.error || `服务器错误 (${error.response.status})`;
      } else if (error.request) {
        errorMsg = '无法连接到服务器，请检查后端服务是否启动';
      } else {
        errorMsg = error.message || '登录失败';
      }
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card title="物业巡更系统" className="login-card">
        <Form
          name="login"
          initialValues={{ username: 'manager', password: '123456' }}
          onFinish={onFinish}
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
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', color: '#999', fontSize: '12px' }}>
            <p>测试账号：manager / 123456 (项目经理)</p>
            <p>测试账号：patrol1 / 123456 (巡更员)</p>
            <p>测试账号：repair1 / 123456 (维修工)</p>
            <p>测试账号：service1 / 123456 (客服)</p>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default Login;
