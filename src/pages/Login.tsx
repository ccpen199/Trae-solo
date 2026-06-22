import { useState, useEffect } from 'react';
import { Form, Input, Button, Tabs, message, Divider, Alert, Tag, Progress, Steps } from 'antd';
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
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { post } from '@/utils/api';
import { useUserStore } from '@/store/userStore';
import type { UserInfo, UserRole } from 'shared/types';

interface SmsLoginValues {
  phone: string;
  code: string;
}

interface PasswordLoginValues {
  phone: string;
  password: string;
}

interface EnterpriseLoginValues {
  creditCode: string;
  password: string;
}

const ROLE_HOME_MAP: Record<UserRole, string> = {
  PERSONAL: '/dashboard',
  ENTERPRISE_HR: '/dashboard',
  FINANCE: '/finance',
  CS_AGENT: '/support',
  ADMIN: '/admin/dashboard',
};

const ROLE_LABELS: Record<UserRole, string> = {
  PERSONAL: '个人用户',
  ENTERPRISE_HR: '企业HR',
  FINANCE: '财务人员',
  CS_AGENT: '客服专员',
  ADMIN: '平台管理员',
};

const QUICK_ACCOUNTS = [
  { label: '个人用户', phone: '13800138000', password: '123456', role: 'PERSONAL' as UserRole },
  { label: '企业HR', phone: '13800138001', password: '123456', role: 'ENTERPRISE_HR' as UserRole },
  { label: '财务人员', phone: '13800138002', password: '123456', role: 'FINANCE' as UserRole },
  { label: '平台管理员', phone: '13800138003', password: 'admin123', role: 'ADMIN' as UserRole },
];

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useUserStore((s) => s.login);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);

  const from = (location.state as any)?.from?.pathname || null;

  const [activeTab, setActiveTab] = useState<string>('password');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [smsForm] = Form.useForm<SmsLoginValues>();
  const [pwdForm] = Form.useForm<PasswordLoginValues>();
  const [entForm] = Form.useForm<EnterpriseLoginValues>();

  useEffect(() => {
    if (isLoggedIn) {
      const user = useUserStore.getState().user;
      const target = from || ROLE_HOME_MAP[user?.role || 'PERSONAL'];
      navigate(target, { replace: true });
    }
  }, [isLoggedIn, from, navigate]);

  const doLogin = async (payload: Record<string, any>, loginType: 'sms' | 'password' | 'enterprise') => {
    setErrorMsg('');
    setLoginStep(1);

    try {
      setLoading(true);
      setLoginStep(2);

      const res = await post<{ token: string; user: UserInfo }>('/auth/login', payload);
      if (res.code !== 200 || !res.data) {
        throw new Error(res.message || '登录失败');
      }

      setLoginStep(3);
      const { user, token } = res.data;
      login(user, token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setLoginStep(4);
      message.success(`登录成功，欢迎回来${user.realName || user.nickname || '用户'}！`);

      const target = from || ROLE_HOME_MAP[user.role] || '/dashboard';
      setTimeout(() => navigate(target, { replace: true }), 300);
    } catch (err: any) {
      setErrorMsg(err.message || '登录失败，请检查账号密码');
      message.error(err.message || '登录失败');
      setLoginStep(0);
    } finally {
      setLoading(false);
    }
  };

  const sendSmsCode = async () => {
    try {
      await smsForm.validateFields(['phone']);
      const phone = smsForm.getFieldValue('phone');
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        message.error('请输入正确的手机号');
        return;
      }
      message.success('验证码已发送（测试验证码：123456）');
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
    await doLogin({ phone: values.phone, code: values.code }, 'sms');
  };

  const handlePasswordLogin = async (values: PasswordLoginValues) => {
    await doLogin({ phone: values.phone, password: values.password }, 'password');
  };

  const handleEnterpriseLogin = async (values: EnterpriseLoginValues) => {
    await doLogin(
      { creditCode: values.creditCode, password: values.password, enterprise: true },
      'enterprise'
    );
  };

  const fillQuickAccount = (account: (typeof QUICK_ACCOUNTS)[number]) => {
    pwdForm.setFieldsValue({ phone: account.phone, password: account.password });
    setActiveTab('password');
    message.info(`已填入${account.label}测试账号`);
  };

  const stepItems = [
    { title: '准备登录', icon: loginStep >= 1 ? <CheckCircle2 size={16} /> : <Loader2 size={16} /> },
    { title: '校验账号', icon: loginStep >= 2 ? <CheckCircle2 size={16} /> : <Loader2 size={16} /> },
    { title: '同步状态', icon: loginStep >= 3 ? <CheckCircle2 size={16} /> : <Loader2 size={16} /> },
    { title: '进入工作台', icon: loginStep >= 4 ? <CheckCircle2 size={16} /> : <Loader2 size={16} /> },
  ];

  return (
    <div className="fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-1" style={{ fontFamily: '"Noto Serif SC", serif' }}>
          欢迎登录
        </h2>
        <p className="text-sm text-slate-500">政务级社保公积金服务平台</p>
      </div>

      {loginStep > 0 && loginStep < 4 && (
        <div className="mb-4">
          <Steps size="small" current={loginStep - 1} items={stepItems} />
        </div>
      )}

      {errorMsg && (
        <Alert
          message="登录失败"
          description={errorMsg}
          type="error"
          showIcon
          closable
          onClose={() => setErrorMsg('')}
          className="mb-4"
        />
      )}

      <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
        <div className="text-xs text-slate-500 mb-2">快速体验账号（点击自动填入）：</div>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACCOUNTS.map((acc) => (
            <Tag
              key={acc.role}
              color="blue"
              style={{ cursor: 'pointer', margin: 0 }}
              onClick={() => fillQuickAccount(acc)}
            >
              {acc.label}
            </Tag>
          ))}
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(k) => {
          setActiveTab(k);
          setErrorMsg('');
        }}
        items={[
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
                initialValues={{ phone: '13800138000', password: '123456' }}
              >
                <Form.Item
                  name="phone"
                  label="手机号"
                  rules={[
                    { required: true, message: '请输入手机号' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                  ]}
                  validateTrigger={['onBlur', 'onChange']}
                >
                  <Input
                    prefix={<Phone size={18} className="text-slate-400" />}
                    placeholder="请输入手机号"
                    maxLength={11}
                    autoComplete="username"
                  />
                </Form.Item>
                <Form.Item
                  name="password"
                  label="登录密码"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码至少6位' },
                  ]}
                  validateTrigger={['onBlur', 'onChange']}
                >
                  <Input.Password
                    prefix={<Lock size={18} className="text-slate-400" />}
                    placeholder="请输入密码（默认123456）"
                    iconRender={(visible) =>
                      visible ? <Eye size={18} /> : <EyeOff size={18} />
                    }
                    autoComplete="current-password"
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
                    {loading ? '登录中...' : '登 录'}
                  </Button>
                </Form.Item>
              </Form>
            ),
          },
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
                initialValues={{ code: '123456' }}
              >
                <Form.Item
                  name="phone"
                  label="手机号"
                  rules={[
                    { required: true, message: '请输入手机号' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                  ]}
                  validateTrigger={['onBlur', 'onChange']}
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
                  validateTrigger={['onBlur', 'onChange']}
                >
                  <Input
                    prefix={<ShieldCheck size={18} className="text-slate-400" />}
                    placeholder="测试验证码：123456"
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
                    {loading ? '登录中...' : '登 录'}
                  </Button>
                </Form.Item>
              </Form>
            ),
          },
          {
            key: 'enterprise',
            label: (
              <span className="flex items-center gap-2">
                <Building2 size={16} />
                企业登录
              </span>
            ),
            children: (
              <Form
                form={entForm}
                layout="vertical"
                onFinish={handleEnterpriseLogin}
                size="large"
                className="pt-4"
                initialValues={{ creditCode: '91110000MA01234567', password: '123456' }}
              >
                <Form.Item
                  name="creditCode"
                  label="统一社会信用代码"
                  rules={[
                    { required: true, message: '请输入18位统一社会信用代码' },
                    { len: 18, message: '信用代码为18位' },
                  ]}
                  validateTrigger={['onBlur', 'onChange']}
                >
                  <Input
                    prefix={<Building2 size={18} className="text-slate-400" />}
                    placeholder="请输入18位统一社会信用代码"
                    maxLength={18}
                  />
                </Form.Item>
                <Form.Item
                  name="password"
                  label="企业密码"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码至少6位' },
                  ]}
                  validateTrigger={['onBlur', 'onChange']}
                >
                  <Input.Password
                    prefix={<Lock size={18} className="text-slate-400" />}
                    placeholder="请输入企业登录密码"
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
                    {loading ? '登录中...' : '企业登 录'}
                  </Button>
                </Form.Item>
              </Form>
            ),
          },
        ]}
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
          企业用户登录指引
        </div>
        <p className="text-xs text-slate-500 mb-3">
          企业HR/财务人员可使用上方"企业登录"Tab，凭统一社会信用代码快速登录，支持批量员工管理、薪资代发、账单对账等功能
        </p>
        <div className="flex gap-2 flex-wrap">
          <Tag color="blue">批量参保</Tag>
          <Tag color="green">薪资代发</Tag>
          <Tag color="orange">财务对账</Tag>
          <Tag color="purple">电子凭证</Tag>
        </div>
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
