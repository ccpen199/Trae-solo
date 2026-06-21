import { useState } from 'react';
import { Form, Input, Button, Tabs, message, Divider } from 'antd';
import {
  Phone,
  Lock,
  ShieldCheck,
  Building2,
  UserPlus,
  MessageCircle,
  Eye,
  EyeOff,
  Send,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { post } from '@/utils/api';
import { useUserStore } from '@/store/userStore';
import type { UserInfo } from 'shared/types';

interface SmsLoginValues {
  phone: string;
  code: string;
}

interface PasswordLoginValues {
  phone: string;
  password: string;
}

function Login() {
  const navigate = useNavigate();
  const login = useUserStore((s) => s.login);
  const [activeTab, setActiveTab] = useState<string>('sms');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [smsForm] = Form.useForm<SmsLoginValues>();
  const [pwdForm] = Form.useForm<PasswordLoginValues>();

  const sendSmsCode = async () => {
    try {
      await smsForm.validateFields(['phone']);
      const phone = smsForm.getFieldValue('phone');
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        message.error('请输入正确的手机号');
        return;
      }
      message.success('验证码已发送，请查收短信');
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
    } catch {
      message.error('请先输入手机号');
    }
  };

  const handleSmsLogin = async (values: SmsLoginValues) => {
    try {
      setLoading(true);
      const res = await post<{ token: string; user: UserInfo }>('/auth/login', {
        phone: values.phone,
        code: values.code,
      });
      if (res.code === 200) {
        login(res.data.user, res.data.token);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        message.success('登录成功');
        navigate('/dashboard');
      }
    } catch (err: any) {
      message.error(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (values: PasswordLoginValues) => {
    try {
      setLoading(true);
      const res = await post<{ token: string; user: UserInfo }>('/auth/login', {
        phone: values.phone,
        password: values.password,
      });
      if (res.code === 200) {
        login(res.data.user, res.data.token);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        message.success('登录成功');
        navigate('/dashboard');
      }
    } catch (err: any) {
      message.error(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'sms',
      label: (
        <span className="flex items-center gap-2">
          <MessageCircle size={16} />
          短信登录
        </span>
      ),
      children: (
        <Form
          form={smsForm}
          layout="vertical"
          onFinish={handleSmsLogin}
          size="large"
          className="pt-4"
        >
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input
              prefix={<Phone size={18} className="text-slate-400" />}
              placeholder="请输入手机号"
              maxLength={11}
            />
          </Form.Item>
          <Form.Item
            name="code"
            label="短信验证码"
            rules={[
              { required: true, message: '请输入验证码' },
              { len: 6, message: '验证码为6位数字' },
            ]}
          >
            <Input
              prefix={<ShieldCheck size={18} className="text-slate-400" />}
              placeholder="请输入6位验证码"
              maxLength={6}
              suffix={
                <Button
                  type="link"
                  size="small"
                  disabled={countdown > 0}
                  onClick={sendSmsCode}
                  icon={<Send size={14} />}
                  className="!px-0 !text-brand-700 disabled:!text-slate-400"
                >
                  {countdown > 0 ? `${countdown}s后重试` : '获取验证码'}
                </Button>
              }
            />
          </Form.Item>
          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              className="h-11 text-base font-medium"
            >
              登 录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'password',
      label: (
        <span className="flex items-center gap-2">
          <Lock size={16} />
          密码登录
        </span>
      ),
      children: (
        <Form
          form={pwdForm}
          layout="vertical"
          onFinish={handlePasswordLogin}
          size="large"
          className="pt-4"
        >
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input
              prefix={<Phone size={18} className="text-slate-400" />}
              placeholder="请输入手机号"
              maxLength={11}
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="登录密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password
              prefix={<Lock size={18} className="text-slate-400" />}
              placeholder="请输入密码"
              iconRender={(visible) =>
                visible ? <Eye size={18} /> : <EyeOff size={18} />
              }
            />
          </Form.Item>
          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              className="h-11 text-base font-medium"
            >
              登 录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-1" style={{ fontFamily: '"Noto Serif SC", serif' }}>
          欢迎登录
        </h2>
        <p className="text-sm text-slate-500">政务级社保公积金服务平台</p>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        centered
        size="large"
        className="login-tabs"
      />

      <div className="flex justify-between items-center mt-4 text-sm">
        <a
          href="#"
          className="text-brand-700 hover:text-brand-800 flex items-center gap-1"
          onClick={(e) => e.preventDefault()}
        >
          <UserPlus size={14} />
          注册新账号
        </a>
        <a
          href="#"
          className="text-slate-500 hover:text-brand-700"
          onClick={(e) => e.preventDefault()}
        >
          忘记密码？
        </a>
      </div>

      <Divider plain className="text-slate-400 text-xs my-6">
        其他登录方式
      </Divider>

      <div className="grid grid-cols-3 gap-4">
        {['微信', '支付宝', '银联'].map((name) => (
          <Button
            key={name}
            size="large"
            className="h-12 border-slate-200"
            onClick={() => message.info(`${name}登录暂未开放`)}
          >
            {name}
          </Button>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-brand-50 border border-brand-100">
        <div className="flex items-center gap-2 text-brand-800 font-medium mb-2">
          <Building2 size={18} />
          企业用户快速登录
        </div>
        <p className="text-xs text-slate-500 mb-3">
          企业HR/财务人员可使用统一社会信用代码快速登录，支持批量员工管理、薪资代发等功能
        </p>
        <Button
          size="small"
          type="primary"
          ghost
          className="border-brand-600 text-brand-700"
          onClick={() => message.info('企业登录通道即将开放')}
        >
          企业登录入口
        </Button>
      </div>

      <style>{`
        .login-tabs .ant-tabs-nav {
          margin-bottom: 0;
        }
        .login-tabs .ant-tabs-tab {
          font-size: 15px;
          font-weight: 500;
          padding: 12px 24px;
        }
        .login-tabs .ant-tabs-ink-bar {
          background: #1e40af;
          height: 3px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}

export default Login;
