import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await login(values.username, values.password);
      if (result.success) {
        message.success('登录成功！');
        navigate(from, { replace: true });
      } else {
        message.error(result.message || '登录失败');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-title">
          <div style={{ marginBottom: 16 }}>
            <MedicineBoxOutlined style={{ fontSize: 48, color: '#667eea' }} />
          </div>
          <h1>药房进销存管理系统</h1>
          <p>Pharmacy ERP System</p>
        </div>
        <Form
          name="login"
          onFinish={onFinish}
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
              style={{ height: 44 }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ textAlign: 'center', marginTop: 24, color: '#999', fontSize: 12 }}>
          <p>测试账号：</p>
          <p>管理员: admin / 123456</p>
          <p>采购员: purchaser1 / 123456</p>
          <p>库管: warehouse1 / 123456</p>
          <p>药师: pharmacist1 / 123456</p>
          <p>收银员: cashier1 / 123456</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
