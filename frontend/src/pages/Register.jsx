import React, { useState } from 'react';
import { Form, Input, Button, Card, Select, message } from 'antd';
import { UserOutlined, LockOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/auth';

const { Option } = Select;

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      const res = await register(values);
      localStorage.setItem('tft_token', res.token);
      localStorage.setItem('tft_user', JSON.stringify(res.user));
      message.success('注册成功，已自动登录');
      navigate('/home');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 420, borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🚌</div>
          <h1 style={{ fontSize: 24, margin: 0, color: '#1890ff' }}>天府通</h1>
          <p style={{ color: '#999', margin: '8px 0 0' }}>用户注册</p>
        </div>
        <Form
          name="register"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="phone"
            rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码（至少6位）" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            rules={[{ required: true, message: '请确认密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" />
          </Form.Item>
          <Form.Item name="real_name">
            <Input prefix={<IdcardOutlined />} placeholder="请输入真实姓名（选填）" />
          </Form.Item>
          <Form.Item name="id_card">
            <Input placeholder="请输入身份证号（选填）" />
          </Form.Item>
          <Form.Item name="user_type" initialValue="normal">
            <Select>
              <Option value="normal">普通卡</Option>
              <Option value="student">学生卡</Option>
              <Option value="elderly">老年卡</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              注册并登录
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            已有账号？<a onClick={() => navigate('/login')}>立即登录</a>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
