import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Select } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';

const { Option } = Select;

function Login() {
  const [loading, setLoading] = useState(false);
  const { login, getRoleHomePath } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await login(values.username, values.password);
      if (result.success) {
        message.success('登录成功');
        setTimeout(() => {
          const user = JSON.parse(localStorage.getItem('user'));
          navigate(getRoleHomePath(user.role));
        }, 500);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <h2 className="login-title">信贷管理系统</h2>
        <Form
          name="login"
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
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/register">还没有账号？立即注册</Link>
          </div>

          <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8, fontSize: 12, color: '#666' }}>
            <p><strong>测试账号：</strong></p>
            <p>借款人: borrower1 / 123456</p>
            <p>客户经理: manager1 / 123456</p>
            <p>风控专家: risk1 / 123456</p>
            <p>审批总监: approval1 / 123456</p>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default Login;
