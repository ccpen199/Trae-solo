import React from 'react';
import { Form, Input, Button, Card, Select, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import request from '../utils/request.js';

const { Option } = Select;

function Register({ setUser }) {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const res = await request.post('/auth/register', values);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      message.success('注册成功');
      
      setTimeout(() => {
        switch (res.user.role) {
          case 'author':
            navigate('/author/novels');
            break;
          case 'editor':
          case 'admin':
            navigate('/editor/dashboard');
            break;
          case 'finance':
            navigate('/finance/settlements');
            break;
          default:
            navigate('/');
        }
      }, 500);
    } catch (e) {
      message.error(e.response?.data?.error || '注册失败');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Card title="注册" style={{ width: 400 }}>
        <Form onFinish={onFinish}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item name="nickname" rules={[{ required: true, message: '请输入昵称' }]}>
            <Input placeholder="昵称" size="large" />
          </Form.Item>
          <Form.Item name="role" initialValue="reader" label="注册身份">
            <Select size="large">
              <Option value="reader">读者</Option>
              <Option value="author">作者</Option>
            </Select>
          </Form.Item>
          <Form.Item name="phone">
            <Input placeholder="手机号（可选）" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" style={{ width: '100%' }}>
              注册
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: 16 }}>
            <p>已有账号？<a onClick={() => navigate('/login')} style={{ cursor: 'pointer', color: '#1677ff' }}>立即登录</a></p>
            <p style={{ marginTop: 12 }}>编辑、管理员、结算员账号请联系平台开通</p>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default Register;
