import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useUserStore from '@/store/userStore';
import type { FormProps } from 'antd';

interface LoginFormValues {
  idCard: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useUserStore();

  const onFinish: FormProps<LoginFormValues>['onFinish'] = async (values) => {
    setLoading(true);
    try {
      await login(values);
      message.success('登录成功');
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #165DFF 0%, #0E42B3 50%, #0A348A 100%)',
      }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <Card
        className="relative z-10 w-full max-w-md shadow-2xl"
        style={{ borderRadius: '16px' }}
        bodyStyle={{ padding: '48px 40px' }}
      >
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: 'linear-gradient(135deg, #165DFF 0%, #0E42B3 100%)' }}
          >
            <SafetyOutlined className="text-3xl text-white" />
          </div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: 'Noto Serif SC, serif', color: '#165DFF' }}
          >
            社保服务平台
          </h1>
          <p className="text-gray-500">请使用身份证号和密码登录</p>
        </div>

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="idCard"
            label="身份证号"
            rules={[
              { required: true, message: '请输入身份证号' },
              {
                pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
                message: '请输入正确的身份证号',
              },
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="请输入身份证号"
              maxLength={18}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                height: '48px',
                fontSize: '16px',
                fontWeight: 500,
                background: 'linear-gradient(135deg, #165DFF 0%, #0E42B3 100%)',
                border: 'none',
                borderRadius: '8px',
              }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>政务服务 · 便民利民</p>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
