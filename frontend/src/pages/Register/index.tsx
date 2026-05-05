import { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Radio,
  Collapse,
  CollapseProps,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'MEMBER' | 'DEALER'>('MEMBER');
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { register } = useUserStore();

  const onFinish = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      await register({
        username: values.username as string,
        email: values.email as string,
        phone: values.phone as string,
        password: values.password as string,
        nickname: values.nickname as string,
        role,
        dealerCompany: values.dealerCompany as string,
        dealerLicense: values.dealerLicense as string,
        dealerRegion: values.dealerRegion as string,
      });
      message.success(role === 'DEALER' ? '经销商注册成功，请等待审核' : '注册成功');
      navigate('/');
    } catch (error) {
      console.error('注册失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const dealerItems: CollapseProps['items'] = [
    {
      key: '1',
      label: '经销商信息（选填）',
      children: (
        <>
          <Form.Item name="dealerCompany" label="公司名称">
            <Input prefix={<HomeOutlined />} placeholder="请输入公司名称" />
          </Form.Item>

          <Form.Item name="dealerLicense" label="营业执照号">
            <Input prefix={<IdcardOutlined />} placeholder="请输入营业执照号" />
          </Form.Item>

          <Form.Item name="dealerRegion" label="经销区域">
            <Input prefix={<EnvironmentOutlined />} placeholder="请输入经销区域" />
          </Form.Item>
        </>
      ),
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'linear-gradient(135deg, #c41e3a 0%, #8b0000 100%)',
      }}
    >
      <Card
        style={{ width: 450, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        title={
          <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}>
            用户注册
          </div>
        }
      >
        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          layout="vertical"
        >
          <Form.Item label="注册类型">
            <Radio.Group
              value={role}
              onChange={(e) => setRole(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="MEMBER">普通会员</Radio.Button>
              <Radio.Button value="DEALER">经销商</Radio.Button>
            </Radio.Group>
          </Form.Item>

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
            name="nickname"
            label="昵称"
          >
            <Input prefix={<UserOutlined />} placeholder="请输入昵称" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
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
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
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

          {role === 'DEALER' && (
            <Collapse items={dealerItems} defaultActiveKey={['1']} />
          )}

          <Form.Item style={{ marginTop: '24px' }}>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            已有账号？ <Link to="/login">立即登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage;
