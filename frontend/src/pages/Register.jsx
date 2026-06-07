import React, { useState } from 'react';
import { Form, Input, Button, Card, Radio, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Register = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { register, loading } = useAuthStore();
  const [role, setRole] = useState('jobseeker');

  const handleSubmit = async (values) => {
    const data = { ...values, role };
    const result = await register(data);
    if (result.success) {
      message.success('注册成功，请登录');
      setTimeout(() => navigate('/login'), 500);
    } else {
      message.error(result.error || '注册失败');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 50%, #91caff 100%)',
      padding: 24,
    }}>
      <div style={{
        display: 'flex',
        gap: 48,
        alignItems: 'center',
        maxWidth: 1000,
        width: '100%',
      }}>
        <div style={{ flex: 1, color: '#003a8c' }}>
          <h1 style={{ fontSize: 48, fontWeight: 700, marginBottom: 16, color: '#0958d9' }}>
            加入制造业招聘平台
          </h1>
          <p style={{ fontSize: 18, marginBottom: 24, lineHeight: 1.8, color: '#1d4e89' }}>
            连接先进制造业企业与专业技术人才
            <br />
            让每一位技术人才都能找到理想岗位
          </p>
        </div>

        <Card
          style={{ width: 440, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
          bordered={false}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>账号注册</h2>
            <p style={{ color: '#8c8c8c', fontSize: 14 }}>创建您的招聘平台账号</p>
          </div>

          <Tabs
            activeKey={role}
            onChange={setRole}
            centered
            items={[
              { key: 'jobseeker', label: '求职者注册' },
              { key: 'hr', label: '企业HR注册' },
            ]}
          />

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
            </Form.Item>

            <Form.Item
              name="name"
              label={role === 'jobseeker' ? '真实姓名' : '企业名称'}
              rules={[{ required: true, message: `请输入${role === 'jobseeker' ? '真实姓名' : '企业名称'}` }]}
            >
              <Input prefix={role === 'jobseeker' ? <UserOutlined /> : <TeamOutlined />}
                     placeholder={`请输入${role === 'jobseeker' ? '真实姓名' : '企业名称'}`} />
            </Form.Item>

            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入正确的邮箱地址' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="请输入邮箱地址" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
              ]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
              hasFeedback
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认密码"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{ height: 44, fontSize: 16 }}
              >
                注册
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#8c8c8c' }}>已有账号？</span>
            <Link to="/login" style={{ color: '#1677ff', marginLeft: 4 }}>立即登录</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;
