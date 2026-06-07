import { useState } from 'react';
import { Form, Input, Button, Card, Tabs, message } from 'antd';
import { UserOutlined, LockOutlined, BankOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export default function RegisterPage() {
  const [activeTab, setActiveTab] = useState('jobseeker');
  const [loading, setLoading] = useState(false);
  const registerJobseeker = useAuthStore((state) => state.registerJobseeker);
  const registerHR = useAuthStore((state) => state.registerHR);
  const navigate = useNavigate();

  const handleJobseekerSubmit = async (values: any) => {
    setLoading(true);
    try {
      await registerJobseeker(values.phone, values.password, values.name);
      message.success('注册成功');
      navigate('/jobseeker/profile');
    } catch (error: any) {
      message.error(error.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const handleHRSubmit = async (values: any) => {
    setLoading(true);
    try {
      await registerHR(values);
      message.success('注册成功');
      navigate('/hr/dashboard');
    } catch (error: any) {
      message.error(error.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'jobseeker',
      label: '求职者注册',
      children: (
        <Form onFinish={handleJobseekerSubmit} size="large">
          <Form.Item name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input prefix={<UserOutlined />} placeholder="姓名" />
          </Form.Item>
          <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input prefix={<UserOutlined />} placeholder="手机号" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              注册
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'hr',
      label: '企业HR注册',
      children: (
        <Form onFinish={handleHRSubmit} size="large">
          <Form.Item name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input prefix={<UserOutlined />} placeholder="HR姓名" />
          </Form.Item>
          <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input prefix={<UserOutlined />} placeholder="手机号" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item name="companyName" rules={[{ required: true, message: '请输入公司名称' }]}>
            <Input prefix={<BankOutlined />} placeholder="公司名称" />
          </Form.Item>
          <Form.Item name="companyLicense" rules={[{ required: true, message: '请输入营业执照号' }]}>
            <Input prefix={<BankOutlined />} placeholder="营业执照号" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              注册
            </Button>
          </Form.Item>
        </Form>
      )
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 450, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ color: '#1890ff', marginBottom: 8 }}>智聘平台</h1>
          <p style={{ color: '#666' }}>加入我们，开启新的职业旅程</p>
        </div>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        <div style={{ textAlign: 'center', color: '#666', marginTop: 16 }}>
          已有账号？<Link to="/login">立即登录</Link>
        </div>
      </Card>
    </div>
  );
}
