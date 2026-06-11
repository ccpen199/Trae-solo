import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Radio,
  Tabs,
  Typography,
  Divider,
  Alert,
} from 'antd';
import { UserOutlined, LockOutlined, MobileOutlined } from '@ant-design/icons';
import { useUserStore } from '../store/user';
import { authApi } from '../api';
import type { UserRole } from '../../shared/types';

const { Title, Text } = Typography;

interface LoginFormData {
  username: string;
  password: string;
}

interface SmsLoginFormData {
  phone: string;
  code: string;
}

const roleOptions = [
  { label: '货主', value: 'owner' as UserRole, desc: '发布货源、查询运价' },
  { label: '车队', value: 'fleet' as UserRole, desc: '管理运力、接收货源' },
  { label: '司机', value: 'driver' as UserRole, desc: '抢单接单、运输执行' },
  { label: '运营', value: 'operator' as UserRole, desc: '审核管理、数据分析' },
  { label: '管理员', value: 'admin' as UserRole, desc: '系统配置、权限管理' },
];

const ROLE_HOME: Record<UserRole, string> = {
  owner: '/cargo/list',
  fleet: '/capacity',
  driver: '/waybills',
  operator: '/orders',
  admin: '/',
};

const ROLE_ACCOUNTS: Record<UserRole, { username: string; password: string }> = {
  owner: { username: 'owner', password: '123456' },
  fleet: { username: 'fleet', password: '123456' },
  driver: { username: 'driver', password: '123456' },
  operator: { username: 'ops', password: '123456' },
  admin: { username: 'admin', password: 'admin123' },
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useUserStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [errorMsg, setErrorMsg] = useState('');
  const [passwordForm] = Form.useForm<LoginFormData>();
  const [smsForm] = Form.useForm<SmsLoginFormData>();

  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  const handlePasswordLogin = async (values: LoginFormData) => {
    setErrorMsg('');
    try {
      setLoading(true);
      const response = await authApi.login({
        ...values,
        role: selectedRole,
      });

      if (response.code === 200 && response.data) {
        const { token, user } = response.data;
        login(token, user);
        const homePath = ROLE_HOME[user.role] || '/';
        navigate(homePath, { replace: true });
      }
    } catch (error: any) {
      setErrorMsg(error?.message || '登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSmsLogin = async (values: SmsLoginFormData) => {
    setErrorMsg('');
    try {
      setLoading(true);
      const response = await authApi.loginBySms({
        ...values,
        role: selectedRole,
      });
      if (response.code === 200 && response.data) {
        const { token, user } = response.data;
        login(token, user);
        const homePath = ROLE_HOME[user.role] || '/';
        navigate(homePath, { replace: true });
      }
    } catch (error: any) {
      setErrorMsg(error?.message || '登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSmsCode = async () => {
    try {
      const phone = smsForm.getFieldValue('phone');
      if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
        setErrorMsg('请输入正确的手机号');
        return;
      }
      setSmsLoading(true);
      setErrorMsg('');
      await authApi.sendSmsCode(phone);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setErrorMsg('验证码发送失败，请稍后重试');
    } finally {
      setSmsLoading(false);
    }
  };

  const handleQuickFill = () => {
    const account = ROLE_ACCOUNTS[selectedRole];
    passwordForm.setFieldsValue({
      username: account.username,
      password: account.password,
    });
    setErrorMsg('');
  };

  const tabItems = [
    {
      key: 'password',
      label: '密码登录',
      children: (
        <Form<LoginFormData>
          form={passwordForm}
          name="password_login"
          onFinish={handlePasswordLogin}
          size="large"
          className="mt-6"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="请输入用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <div className="flex justify-end items-center mb-4">
            <Button type="link" size="small" onClick={handleQuickFill} className="text-primary-500 p-0">
              快速填入演示账号
            </Button>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-11 text-base font-medium"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'sms',
      label: '短信登录',
      children: (
        <Form<SmsLoginFormData>
          form={smsForm}
          name="sms_login"
          onFinish={handleSmsLogin}
          size="large"
          className="mt-6"
        >
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input
              prefix={<MobileOutlined className="text-gray-400" />}
              placeholder="请输入手机号"
              maxLength={11}
            />
          </Form.Item>

          <Form.Item
            name="code"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <div className="flex gap-3">
              <Input
                className="flex-1"
                placeholder="请输入验证码"
                maxLength={6}
              />
              <Button
                disabled={countdown > 0}
                loading={smsLoading}
                onClick={handleSendSmsCode}
                className="w-32 text-primary-500"
              >
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </Button>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-11 text-base font-medium"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-cyan-50 p-4">
      <div className="w-full max-w-5xl flex gap-12 items-center">
        <div className="flex-1 hidden lg:block">
          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary-500/20">
              <span className="text-white text-2xl font-bold">W</span>
            </div>
            <Title level={1} className="!mb-4 !text-gray-900">
              货运数字化服务平台
            </Title>
            <Text className="text-lg text-gray-500">
              智能、高效、安全的货运物流解决方案
            </Text>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-primary-500 text-xl">📦</span>
              </div>
              <div>
                <Title level={4} className="!mb-1 !text-gray-800">
                  智能匹配
                </Title>
                <Text className="text-gray-500">
                  AI 算法智能匹配货主与运力，提升运输效率
                </Text>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-success-500 text-xl">📍</span>
              </div>
              <div>
                <Title level={4} className="!mb-1 !text-gray-800">
                  实时追踪
                </Title>
                <Text className="text-gray-500">
                  GPS 实时定位，全程可视化监控货物运输状态
                </Text>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-500 text-xl">💰</span>
              </div>
              <div>
                <Title level={4} className="!mb-1 !text-gray-800">
                  在线结算
                </Title>
                <Text className="text-gray-500">
                  安全便捷的在线支付结算，保障交易双方权益
                </Text>
              </div>
            </div>
          </div>
        </div>

        <Card className="w-full max-w-md shadow-xl" variant="borderless">
          <div className="text-center mb-2 lg:hidden">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl font-bold">W</span>
            </div>
            <Title level={3} className="!mb-1">
              货运数字化平台
            </Title>
            <Text className="text-gray-500">智能、高效、安全</Text>
          </div>

          <Title level={4} className="!mb-2">
            欢迎登录
          </Title>
          <Text className="text-gray-500 block mb-6">
            请选择您的角色并登录账号
          </Text>

          <div className="mb-6">
            <Text className="text-sm text-gray-600 block mb-3">选择角色</Text>
            <Radio.Group
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setErrorMsg('');
              }}
              className="w-full"
            >
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map((option) => (
                  <Radio.Button
                    key={option.value}
                    value={option.value}
                    className={`text-center h-auto py-2 px-1 ${selectedRole === option.value ? 'ant-radio-button-wrapper-checked' : ''}`}
                  >
                    <div>{option.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{option.desc}</div>
                  </Radio.Button>
                ))}
              </div>
            </Radio.Group>
          </div>

          {errorMsg && (
            <Alert
              message={errorMsg}
              type="error"
              showIcon
              closable
              onClose={() => setErrorMsg('')}
              className="mb-4"
            />
          )}

          <Tabs
            defaultActiveKey="password"
            items={tabItems}
            centered
            onChange={() => setErrorMsg('')}
          />

          <Divider plain className="my-4">
            <Text type="secondary" className="text-xs">
              演示账号
            </Text>
          </Divider>

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>货主: owner / 123456</span>
              <span>车队: fleet / 123456</span>
            </div>
            <div className="flex justify-between">
              <span>司机: driver / 123456</span>
              <span>运营: ops / 123456</span>
            </div>
            <div>
              管理员: admin / admin123
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
