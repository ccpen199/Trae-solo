import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await login(values.username, values.password);
      if (result.success) {
        message.success('登录成功');
        navigate('/');
      }
    } catch (error) {
      message.error(error.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const roleLabels = {
    admin: '管理员',
    operator: '运营',
    customer_service: '客服',
    anticheat: '反作弊审核',
    player: '玩家'
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <h1 className="login-title">游戏排行榜系统</h1>
        
        <Alert
          message="默认账号"
          description={
            <div style={{ fontSize: '12px' }}>
              <p>管理员: admin / admin123</p>
              <p>运营: operator / operator123</p>
              <p>客服: cs / cs123</p>
              <p>反作弊: anticheat / anticheat123</p>
              <p>玩家: player1~player10 / player123</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          name="login"
          onFinish={onFinish}
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
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 44, fontSize: 16 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
