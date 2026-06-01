import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, RobotOutlined } from '@ant-design/icons';
import { authApi } from '../utils/api';

function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await authApi.login(values);
      message.success('登录成功');
      onLogin(response.data.user, response.data.token);
    } catch (error) {
      message.error(error.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" variant="borderless">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <RobotOutlined style={{ fontSize: 48, color: '#1890ff' }} />
        </div>
        <h1 className="login-title">AI 招投标标书助手</h1>
        <p className="login-subtitle">智能解析 · 自动响应 · 资质匹配</p>
        
        <Form
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ fontSize: 12, color: '#999', textAlign: 'center', marginTop: 20 }}>
          <p>测试账号：</p>
          <p>owner / 123456 (业务负责人)</p>
          <p>operator / 123456 (模型运营)</p>
          <p>reviewer / 123456 (审核人员)</p>
          <p>user / 123456 (一线使用者)</p>
        </div>
      </Card>
    </div>
  );
}

export default Login;
