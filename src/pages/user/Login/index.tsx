import React, { useState } from 'react';
import { Form, Input, Button, Tabs, message, Checkbox, Divider, Alert } from 'antd';
import { UserOutlined, LockOutlined, MobileOutlined, SafetyOutlined, DashboardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { userApi } from '@/services/user';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login: storeLogin } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [captchaCode] = useState('8527');
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  const handleLogin = async (values: any) => {
    if (!values.phone) {
      message.warning('请输入手机号');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(values.phone)) {
      message.warning('请输入正确的11位手机号');
      return;
    }
    if (!values.password) {
      message.warning('请输入密码');
      return;
    }
    if (values.password.length < 6) {
      message.warning('密码至少6位');
      return;
    }
    if (!values.captcha) {
      message.warning('请输入验证码');
      return;
    }
    if (values.captcha?.toUpperCase() !== captchaCode) {
      message.error('验证码错误，请输入：' + captchaCode);
      return;
    }
    setLoading(true);
    try {
      await storeLogin(values.phone, values.password, values.captcha);
      message.success('登录成功，正在进入个人工作台...');
      setTimeout(() => {
        navigate('/payment/bills');
      }, 500);
    } catch (error: any) {
      message.error(error.message || '登录失败，请检查手机号和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: any) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      await userApi.register({
        phone: values.phone,
        password: values.password,
        code: values.code,
        userType: 1,
      });
      message.success('注册成功，请登录');
    } catch (error: any) {
      message.error(error.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const sendSmsCode = async (phone: string) => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      message.error('请输入正确的手机号');
      return;
    }
    try {
      await userApi.sendSmsCode(phone, 'register');
      message.success('验证码已发送（演示模式，任意6位数字即可）');
      setCodeCountdown(60);
      const timer = setInterval(() => {
        setCodeCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      message.error(error.message || '发送失败');
    }
  };

  const fillDemoLogin = () => {
    loginForm.setFieldsValue({
      phone: '13800138000',
      password: '123456',
      captcha: '8527',
    });
  };

  const tabItems = [
    {
      key: 'login',
      label: '账号登录',
      children: (
        <Form form={loginForm} name="login" onFinish={handleLogin} autoComplete="off" size="large">
          <Alert
            message="演示账号"
            description="手机号：13800138000，密码：123456，验证码：8527"
            type="info"
            showIcon
            className="mb-4"
            action={
              <Button size="small" type="primary" onClick={fillDemoLogin}>
                一键填充
              </Button>
            }
          />
          <Form.Item
            name="phone"
            rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}
          >
            <Input prefix={<MobileOutlined />} placeholder="请输入手机号" maxLength={11} />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>
          <Form.Item name="captcha" rules={[{ required: true, message: '请输入验证码' }]}>
            <div className="flex gap-2">
              <Input prefix={<SafetyOutlined />} placeholder="请输入验证码" maxLength={4} style={{ flex: 1 }} />
              <div
                className="h-10 w-[120px] bg-gray-100 rounded flex items-center justify-center cursor-pointer select-none"
                style={{ letterSpacing: '8px', fontSize: '22px', fontWeight: 'bold', color: '#165DFF', fontFamily: 'monospace' }}
              >
                {captchaCode}
              </div>
            </div>
          </Form.Item>
          <Form.Item>
            <Checkbox>记住我</Checkbox>
            <a href="#" className="float-right text-primary-500">忘记密码？</a>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large" className="h-12 text-base font-medium">
              登 录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'register',
      label: '快速注册',
      children: (
        <Form form={registerForm} name="register" onFinish={handleRegister} autoComplete="off" size="large">
          <Form.Item
            name="phone"
            rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}
          >
            <Input prefix={<MobileOutlined />} placeholder="请输入手机号" maxLength={11} />
          </Form.Item>
          <Form.Item name="code" rules={[{ required: true, message: '请输入验证码' }]}>
            <div className="flex gap-2">
              <Input prefix={<SafetyOutlined />} placeholder="请输入短信验证码" maxLength={6} style={{ flex: 1 }} />
              <Button
                disabled={codeCountdown > 0}
                onClick={() => {
                  const phone = registerForm.getFieldValue('phone');
                  sendSmsCode(phone || '');
                }}
              >
                {codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码'}
              </Button>
            </div>
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请设置密码' }, { min: 6, message: '密码至少6位' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请设置密码（至少6位）" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            rules={[{ required: true, message: '请确认密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" />
          </Form.Item>
          <Form.Item>
            <Checkbox required>
              我已阅读并同意 <a href="#" className="text-primary-500">《用户服务协议》</a> 和 <a href="#" className="text-primary-500">《隐私政策》</a>
            </Checkbox>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large" className="h-12 text-base font-medium">
              注 册
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-100 rounded-full opacity-40 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-100 rounded-full opacity-40 translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative w-full max-w-md animate-fadeInUp">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg mb-4">
            <span className="text-white text-4xl font-bold">爱</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">爱众公用事业服务</h1>
          <p className="text-gray-500">水·电·气 一站式服务平台</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Tabs items={tabItems} centered size="large" />
        </div>

        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center">
              <DashboardOutlined className="text-white text-lg" />
            </div>
            <div>
              <p className="font-bold text-gray-800">管理后台入口</p>
              <p className="text-xs text-gray-500">运营管理人员请从此处登录</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { role: '系统管理员', user: 'admin' },
              { role: '运营管理员', user: 'operator' },
              { role: '客服主管', user: 'supervisor' },
              { role: '客服人员', user: 'service' },
            ].map((item) => (
              <div key={item.user} className="p-2 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">{item.role}</p>
                <p className="text-sm font-medium text-gray-700">{item.user}</p>
              </div>
            ))}
          </div>
          <Button
            block
            size="large"
            icon={<DashboardOutlined />}
            onClick={() => navigate('/admin/login')}
            className="h-11 rounded-xl"
          >
            进入管理后台
          </Button>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>客服热线：962960 | 服务时间：7×24小时</p>
          <p className="mt-2">本系统已对接四川省能源监管平台</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
