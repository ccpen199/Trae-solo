import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Select, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authApi } from '../api';
import { useAuthStore } from '../store';

const { Option } = Select;

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.register({
        username: values.username,
        password: values.password,
        role: values.role,
        nickname: values.nickname
      });
      
      if (result.success) {
        setAuth(result.data.token, result.data.user);
        message.success('注册成功');
        navigate('/dashboard');
      } else {
        message.error(result.error?.message || '注册失败');
      }
    } catch (error) {
      message.error(error.error?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <h1 className="login-title">注册账号</h1>
        
        <Form
          name="register"
          initialValues={{ role: 'viewer' }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名（3-20个字符）" 
            />
          </Form.Item>

          <Form.Item
            name="nickname"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="昵称" 
            />
          </Form.Item>

          <Form.Item
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="选择您的角色">
              <Option value="viewer">观众</Option>
              <Option value="streamer">主播</Option>
              <Option value="merchant">商家</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码（至少6个字符）"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[{ required: true, message: '请确认密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认密码"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
              size="large"
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <div className="form-footer">
          已有账号？ <Link to="/login">立即登录</Link>
        </div>
      </Card>
    </div>
  );
}

export default Register;
