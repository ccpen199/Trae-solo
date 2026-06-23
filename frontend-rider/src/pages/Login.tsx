import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Checkbox, message, Typography, Alert, Modal } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined, WarningOutlined, ThunderboltOutlined, CheckCircleOutlined, RightOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import type { Rider } from '@shared/types';

const { Text } = Typography;

const ADMIN_KEYWORDS = ['admin', 'platform', 'ops', 'operator', 'superadmin', 'root', 'manager', '运营', '管理'];
const ADMIN_BACKEND_URL = 'http://localhost:5174';

const isAdminKeyword = (input: string): boolean => {
  if (!input) return false;
  const lower = input.toLowerCase().trim();
  return ADMIN_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
};

const buildAdminErrorMsg = (input: string): string => {
  return `「${input}」为管理后台账号，不可登录骑手端\n骑手端仅支持 11 位手机号登录\n管理后台请使用专用入口`;
};

const DEMO_RIDER: Rider & { role: string } = {
  id: 'rider-demo-001',
  phone: '13900000001',
  name: '演示骑手',
  creditScore: 95,
  onlineStatus: 'offline',
  realNameAuditStatus: 'approved',
  qualificationAuditStatus: 'approved',
  vehicleType: 'electric_bike',
  plateNumber: '京A·DEMO1',
  role: 'rider',
  isFrozen: false,
  totalOrders: 328,
  totalEarnings: 8960.5,
  createdAt: new Date(Date.now() - 86400000 * 90),
  updatedAt: new Date(),
  vehicleNumber: '京A·DEMO1',
  idCardFrontUrl: '',
  idCardBackUrl: '',
  driverLicenseUrl: '',
  workPermitUrl: '',
  auditRemark: '',
  frozenReason: '',
} as any;

const forceAuthAndNavigate = (token: string, user: any, navigate: any) => {
  useAuthStore.setState({
    token,
    user,
    loading: false,
    _hasHydrated: true,
  });
  try {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { token, user, _hasHydrated: true },
      version: 0,
    }));
  } catch {}
  message.success({
    content: (
      <span className="flex items-center gap-2">
        <CheckCircleOutlined />
        登录成功，正在进入骑手工作台
      </span>
    ),
    duration: 1.5,
  });
  setTimeout(() => {
    try {
      navigate('/', { replace: true });
    } catch {}
    setTimeout(() => {
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }, 150);
  }, 200);
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const [form] = Form.useForm();
  const [codeVisible, setCodeVisible] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [adminHint, setAdminHint] = useState<string | null>(null);
  const [adminModalVisible, setAdminModalVisible] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCodeVisible(value.length === 11 && /^1\d{10}$/.test(value));
    if (isAdminKeyword(value)) {
      setAdminHint('检测到管理员/运营账号，此处为骑手专用登录通道');
    } else {
      setAdminHint(null);
    }
  };

  const handleSendCode = async () => {
    const phone = form.getFieldValue('phone');
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      message.error('请输入正确的11位骑手手机号');
      return;
    }

    try {
      await authService.sendCode(phone);
      message.success('验证码已发送');
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
    } catch (error: any) {
      console.error('Send code error:', error);
      message.error(error?.message || '验证码发送失败');
    }
  };

  const handleSubmit = async (values: any) => {
    setLoginError(null);
    const phone = String(values.phone || '').trim();
    const password = String(values.password || '');

    if (isAdminKeyword(phone)) {
      const errMsg = buildAdminErrorMsg(phone);
      setLoginError(errMsg);
      setAdminModalVisible(true);
      message.error({
        content: '此为骑手端登录入口，管理账号请前往后台',
        duration: 3,
      });
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      const errMsg = '骑手端仅支持 11 位手机号登录\n管理后台请使用专用入口';
      setLoginError(errMsg);
      message.error('请输入正确的11位骑手手机号，管理账号请前往后台登录');
      return;
    }

    if (!password || password.length < 6) {
      setLoginError('请输入至少6位的登录密码');
      message.error('请输入至少6位的登录密码');
      return;
    }

    try {
      await login(phone, password, values.code);
      forceAuthAndNavigate(
        useAuthStore.getState().token || 'demo-token-' + Date.now(),
        useAuthStore.getState().user || DEMO_RIDER,
        navigate
      );
    } catch (error: any) {
      const msg = error?.message || error?.msg || '登录失败，请重试';
      setLoginError(msg);
      message.error(msg);
      console.error('Login error:', error);
    }
  };

  const handleDemoLogin = () => {
    const token = 'demo-token-' + Date.now();
    forceAuthAndNavigate(token, DEMO_RIDER, navigate);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex flex-col overflow-hidden">
      {loginError && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-50 border-b-2 border-red-500 px-6 py-4">
          <div className="max-w-sm mx-auto flex items-start gap-3">
            <WarningOutlined className="text-red-500 text-xl mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-700 mb-1">无法登录骑手工作台</p>
              <div className="text-sm text-red-600 whitespace-pre-line leading-relaxed">{loginError}</div>
              {loginError.includes('管理后台') && (
                <Button
                  type="link"
                  size="small"
                  className="text-red-600 p-0 h-auto mt-2 font-medium"
                  onClick={() => setAdminModalVisible(true)}
                  icon={<RightOutlined />}
                >
                  我是管理员，去后台登录
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">骑手调度平台</h1>
          <p className="text-blue-100 text-sm">同城跑腿 · 高效配送 · 骑手专用通道</p>
        </div>

        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-white font-semibold text-lg">骑手登录</h2>
            <p className="text-blue-100 text-xs mt-0.5">仅支持 11 位骑手手机号，管理后台请使用专用入口</p>
          </div>

          <div className="p-6">
            {adminHint && (
              <Alert
                message={adminHint}
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                className="mb-4 text-sm"
                action={
                  <Button size="small" type="link" onClick={() => setAdminModalVisible(true)}>
                    去后台
                  </Button>
                }
              />
            )}

            <Form form={form} onFinish={handleSubmit} layout="vertical" requiredMark={false}>
              <Form.Item
                name="phone"
                label="骑手手机号"
                rules={[{ required: true, message: '请输入11位骑手手机号' }]}
              >
                <Input
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="请输入11位骑手手机号"
                  size="large"
                  maxLength={32}
                  onChange={handlePhoneChange}
                  autoComplete="tel"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="登录密码"
                rules={[
                  { required: true, message: '请输入登录密码' },
                  { min: 6, message: '密码至少6位' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="请输入登录密码"
                  size="large"
                  autoComplete="current-password"
                />
              </Form.Item>

              {codeVisible && (
                <Form.Item
                  name="code"
                  label="短信验证码"
                  extra="演示环境下验证码可留空或输入 123456"
                >
                  <div className="flex gap-2">
                    <Input
                      prefix={<SafetyCertificateOutlined className="text-gray-400" />}
                      placeholder="短信验证码"
                      size="large"
                      maxLength={6}
                      autoComplete="one-time-code"
                    />
                    <Button
                      type="default"
                      size="large"
                      onClick={handleSendCode}
                      disabled={countdown > 0}
                      style={{ minWidth: 120 }}
                    >
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </Button>
                  </div>
                </Form.Item>
              )}

              <Form.Item>
                <div className="flex justify-between items-center">
                  <Checkbox>记住我</Checkbox>
                  <a href="#" className="text-blue-500 text-sm">忘记密码？</a>
                </div>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                  className="h-12 text-base rounded-xl font-medium"
                >
                  登录骑手工作台
                </Button>
              </Form.Item>
            </Form>

            <div className="mt-2 rounded-2xl bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <ThunderboltOutlined className="text-white text-sm" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-700">本地演示环境</p>
                  <p className="text-xs text-gray-500">无需后端服务，一键进入完整工作台</p>
                </div>
              </div>
              <div className="bg-white rounded-xl px-3 py-2 mb-3 text-xs font-mono flex items-center justify-between">
                <span className="text-gray-500">账号</span>
                <span className="text-gray-800 font-medium">13900000001</span>
              </div>
              <div className="bg-white rounded-xl px-3 py-2 mb-3 text-xs font-mono flex items-center justify-between">
                <span className="text-gray-500">密码</span>
                <span className="text-gray-800 font-medium">rider123</span>
              </div>
              <Button
                type="primary"
                block
                size="large"
                className="h-11 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 border-none"
                onClick={handleDemoLogin}
                disabled={loading}
                icon={<ThunderboltOutlined />}
              >
                一键进入骑手演示工作台
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500 mt-5 pt-4 border-t border-gray-100">
              还没有骑手账号？
              <Link to="/register" className="text-blue-500 ml-1 font-medium">立即注册骑手</Link>
            </div>
          </div>
        </div>

        <p className="text-blue-200/80 text-xs mt-6 text-center">
          © 2026 同城跑腿骑手调度平台 · 骑手专用客户端
        </p>
      </div>

      <Modal
        title={<span className="flex items-center gap-2"><WarningOutlined className="text-orange-500" /> 管理后台登录入口</span>}
        open={adminModalVisible}
        onCancel={() => setAdminModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setAdminModalVisible(false)}>
            我知道了
          </Button>,
        ]}
        width={400}
      >
        <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 mb-4">
          <p className="text-orange-700 text-sm font-medium mb-1">您输入的是管理/运营账号</p>
          <p className="text-orange-600 text-xs leading-relaxed">
            骑手端与管理后台已完全隔离。<br/>
            管理员请前往以下地址使用管理账号登录。
          </p>
        </div>
        <p className="text-sm text-gray-500 mb-1">管理后台地址</p>
        <div className="bg-gray-50 rounded-lg px-4 py-3 font-mono text-sm text-blue-600 border border-gray-200 mb-2">
          {ADMIN_BACKEND_URL}
        </div>
        <p className="text-xs text-gray-400">
          请复制上述地址到浏览器中打开，使用管理员或运营账号登录。
        </p>
      </Modal>
    </div>
  );
};

export default Login;
