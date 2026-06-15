import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs, Radio } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('employer');
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: values.username,
        password: values.password,
        real_name: values.real_name,
        phone: values.phone,
        role,
      });
      message.success('注册成功');
      navigate('/');
    } catch (error: any) {
      message.error(error.response?.data?.error || '注册失败');
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
      background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
      padding: 20,
    }}>
      <Card 
        style={{ width: 420, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        title={<div style={{ textAlign: 'center', fontSize: 24, color: '#1890ff' }}>注册账号</div>}
      >
        <div style={{ marginBottom: 24 }}>
          <Radio.Group 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-around' }}
          >
            <Radio.Button value="employer">我是雇主</Radio.Button>
            <Radio.Button value="worker">我是工人</Radio.Button>
            <Radio.Button value="driver">我是司机</Radio.Button>
          </Radio.Group>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          layout="vertical"
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '用户名至少3个字符' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            label="真实姓名"
            name="real_name"
            rules={[{ required: true, message: '请输入真实姓名' }]}
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>

          <Form.Item
            label="手机号"
            name="phone"
            rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6个字符' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirmPassword"
            rules={[{ required: true, message: '请确认密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%' }}
              size="large"
            >
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', color: '#8c8c8c', fontSize: 13 }}>
            已有账号？
            <a onClick={() => navigate('/login')} style={{ color: '#1890ff' }}>立即登录</a>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default Register;
