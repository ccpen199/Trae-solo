import { useState, useEffect } from 'react';
import { Form, Input, Button, Checkbox, message, Tabs, Tag, Tooltip, Progress, Spin } from 'antd';
import {
  UserOutlined, LockOutlined, SafetyCertificateOutlined,
  TeamOutlined, BankOutlined,
  ApartmentOutlined, ClusterOutlined,
  CheckCircleOutlined, CloseCircleOutlined, WarningOutlined,
  InfoCircleOutlined, KeyOutlined, ScanOutlined,
  EyeOutlined, EyeInvisibleOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, type LoginResult } from '@/store/authStore';
import { roleConfig } from '@/mock/data';
import type { LoginErrorCode } from '@/mock/data';

const roleButtonGradients: Record<RoleKey, string> = {
  citizen: 'linear-gradient(135deg, #165DFF 0%, #4088FF 100%)',
  enterprise: 'linear-gradient(135deg, #0FC6C2 0%, #36CFC9 100%)',
  staff: 'linear-gradient(135deg, #3478F6 0%, #597EF7 100%)',
  platform: 'linear-gradient(135deg, #F77234 0%, #FF9A6C 100%)',
  ops: 'linear-gradient(135deg, #7B61FF 0%, #B37FEB 100%)',
  admin: 'linear-gradient(135deg, #F5222D 0%, #FF7875 100%)',
};

const { Password } = Input;

interface LoginFormValues {
  username: string;
  password: string;
  remember: boolean;
}

type RoleKey = 'citizen' | 'enterprise' | 'staff' | 'platform' | 'ops' | 'admin';

const roleIcons: Record<RoleKey, React.ReactNode> = {
  citizen: <UserOutlined />,
  enterprise: <ApartmentOutlined />,
  staff: <TeamOutlined />,
  platform: <ClusterOutlined />,
  ops: <BankOutlined />,
  admin: <SafetyCertificateOutlined />,
};

const testAccounts: Record<RoleKey, { username: string; password: string; desc: string }[]> = {
  citizen: [{ username: 'citizen', password: '123456', desc: '办事群众/个人用户' }],
  enterprise: [{ username: 'enterprise', password: 'enterprise123', desc: '企业法人用户' }],
  staff: [{ username: 'staff', password: 'staff123', desc: '政务大厅办事人员' }],
  platform: [{ username: 'platform', password: 'platform123', desc: '平台运维技术人员' }],
  ops: [{ username: 'ops', password: 'ops123', desc: '委办局协同部门人员' }],
  admin: [{ username: 'admin', password: 'admin123', desc: '系统超级管理员' }],
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname: string } } };
  const { login, caLogin, isLoading, lastLoginResult, clearLastError, getDefaultRoute, isAuthenticated, user, loginRole } = useAuthStore();
  const [form] = Form.useForm<LoginFormValues>();
  const [caLoading, setCaLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleKey>('citizen');
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [loginSuccessInfo, setLoginSuccessInfo] = useState<{
    name: string;
    role: string;
    redirectRoute: string;
    countdown: number;
  } | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(true);

  useEffect(() => {
    clearLastError();
    const acc = testAccounts[selectedRole]?.[0];
    if (acc) {
      form.setFieldsValue({ username: acc.username, password: acc.password });
    }
  }, [selectedRole, clearLastError, form]);

  useEffect(() => {
    if (loginSuccessInfo && loginSuccessInfo.countdown > 0) {
      const timer = setTimeout(() => {
        setLoginSuccessInfo({ ...loginSuccessInfo, countdown: loginSuccessInfo.countdown - 1 });
      }, 1000);
      return () => clearTimeout(timer);
    }
    if (loginSuccessInfo && loginSuccessInfo.countdown === 0) {
      const fromRoute = location.state?.from?.pathname;
      navigate(fromRoute || loginSuccessInfo.redirectRoute, { replace: true });
    }
  }, [loginSuccessInfo, navigate, location.state]);

  const getErrorDisplay = (result: LoginResult | null) => {
    if (!result || result.success || !result.errorCode || !result.errorInfo) return null;
    const { errorCode, errorInfo, remainingAttempts, availableRoles } = result;
    const severityConfig = {
      error: {
        icon: <CloseCircleOutlined className="text-gov-red text-xl" />,
        bg: 'bg-red-50 border-red-200',
        titleColor: 'text-red-700',
        descColor: 'text-red-600',
        headerBg: 'bg-red-500',
      },
      warning: {
        icon: <WarningOutlined className="text-gov-orange text-xl" />,
        bg: 'bg-orange-50 border-orange-200',
        titleColor: 'text-orange-700',
        descColor: 'text-orange-600',
        headerBg: 'bg-orange-500',
      },
      info: {
        icon: <InfoCircleOutlined className="text-primary-500 text-xl" />,
        bg: 'bg-blue-50 border-blue-200',
        titleColor: 'text-blue-700',
        descColor: 'text-blue-600',
        headerBg: 'bg-primary-500',
      },
    };
    const cfg = severityConfig[errorInfo.severity];
    return (
      <div className={`rounded-2xl border-2 ${cfg.bg} overflow-hidden mb-6 animate-slide-down shadow-sm`}>
        <div className={`${cfg.headerBg} text-white px-5 py-3 flex items-center gap-3`}>
          {cfg.icon}
          <div className="flex-1">
            <h4 className="font-semibold text-base">{errorInfo.title}</h4>
          </div>
          <Tag color="default" className="bg-white/20 border-white/30 text-white border">
            错误码: {errorCode}
          </Tag>
        </div>
        <div className="p-5">
          <p className={`text-sm mb-4 ${cfg.descColor} leading-relaxed`}>{errorInfo.detail}</p>

          {remainingAttempts !== undefined && errorCode === 'PASSWORD_ERROR' && (
            <div className="mb-4 flex items-center gap-2">
              <Tag color={remainingAttempts <= 1 ? 'red' : remainingAttempts <= 2 ? 'orange' : 'blue'} className="m-0">
                剩余尝试: {remainingAttempts}次
              </Tag>
              <span className="text-xs text-gov-gray-500">累计5次错误账号将被锁定</span>
            </div>
          )}

          {availableRoles && availableRoles.length > 0 && errorCode === 'NO_ROLE_PERMISSION' && (
            <div className="mb-4 p-4 bg-white rounded-xl border border-gov-gray-200">
              <p className="text-sm font-medium text-gov-gray-700 mb-3 flex items-center gap-2">
                <InfoCircleOutlined className="text-primary-500" />
                该账号可使用的角色入口：
              </p>
              <div className="flex flex-wrap gap-2">
                {availableRoles.map(r => (
                  <Tag
                    key={r}
                    color="blue"
                    className="cursor-pointer hover:bg-primary-100 transition-colors m-0 px-3 py-1"
                    onClick={() => setSelectedRole(r as RoleKey)}
                  >
                    → 切换到「{roleConfig[r]?.label || r}」入口
                  </Tag>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 bg-white/70 rounded-xl border border-gov-gray-100">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gov-green/10 flex items-center justify-center">
              <span className="text-gov-green text-sm font-bold">✓</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gov-gray-600 mb-1">建议方案</p>
              <p className="text-sm text-gov-gray-500 leading-relaxed">{errorInfo.suggestion}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSuccessView = () => {
    if (!loginSuccessInfo) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl animate-slide-up">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 animate-bounce">
              <CheckCircleOutlined className="text-5xl text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gov-gray-700 mb-2">登录成功</h2>
            <p className="text-gov-gray-500 mb-8">欢迎访问省级一体化政务服务中台</p>

            <div className="bg-gov-gray-50 rounded-2xl p-5 mb-6 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gov-gray-500 text-sm">当前用户</span>
                <span className="font-semibold text-gov-gray-700">{loginSuccessInfo.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gov-gray-500 text-sm">角色身份</span>
                <Tag color="blue" className="m-0">{loginSuccessInfo.role}</Tag>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gov-gray-500 text-sm">工作台跳转</span>
                <span className="font-mono text-primary-500">{loginSuccessInfo.redirectRoute}</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-gov-gray-500">自动跳转中...</span>
                <span className="font-semibold text-primary-500">{loginSuccessInfo.countdown}s</span>
              </div>
              <Progress
                percent={((3 - loginSuccessInfo.countdown) / 3) * 100}
                showInfo={false}
                strokeColor={{ from: '#165DFF', to: '#4088FF' }}
                strokeWidth={8}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="primary"
                size="large"
                block
                className="gov-btn-primary h-12 rounded-xl text-base"
                onClick={() => {
                  const fromRoute = location.state?.from?.pathname;
                  navigate(fromRoute || loginSuccessInfo.redirectRoute, { replace: true });
                }}
              >
                立即进入工作台
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleSubmit = async (values: LoginFormValues) => {
    clearLastError();
    const result = await login(values.username, values.password, selectedRole);
    if (result.success && result.user && result.redirectRoute) {
      setShowSuccessAnim(true);
      const userType = result.user.userType as RoleKey;
      const roleLabel = roleConfig[selectedRole]?.label
        || roleConfig[userType]?.label
        || result.user.userType;
      setLoginSuccessInfo({
        name: result.user.name,
        role: roleLabel,
        redirectRoute: result.redirectRoute,
        countdown: 3,
      });
    }
  };

  const handleCaLogin = async () => {
    clearLastError();
    setCaLoading(true);
    try {
      const mockCertData = `CA-CERT-${Date.now()}-VALID`;
      const result = await caLogin(mockCertData, selectedRole);
      if (result.success && result.user && result.redirectRoute) {
        setShowSuccessAnim(true);
        setLoginSuccessInfo({
          name: result.user.name,
          role: '省政务云CA认证用户',
          redirectRoute: result.redirectRoute,
          countdown: 3,
        });
      }
    } finally {
      setCaLoading(false);
    }
  };

  const handleForgetPassword = () => {
    message.info({
      content: (
        <div>
          <p className="font-medium text-gov-gray-700 mb-1">密码找回</p>
          <p className="text-sm text-gov-gray-500 whitespace-pre-line">请通过以下方式找回密码：{'\n'}1. 拨打12345政务服务热线{'\n'}2. 携带身份证件到就近政务大厅{'\n'}3. 使用省政务云CA证书重置</p>
        </div>
      ),
      duration: 6,
    });
  };

  const currentRoleCfg = roleConfig[selectedRole];
  const errorDisplay = getErrorDisplay(lastLoginResult);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gov-gray-50">
      {showSuccessAnim && renderSuccessView()}

      <div className="hidden md:flex md:w-1/2 lg:w-[55%] bg-gradient-to-br from-primary-800 via-primary-600 to-primary-500 flex-col justify-between p-10 lg:p-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white/10 blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-primary-300/20 blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/3 left-1/3 w-48 h-48 rounded-full bg-white/5 blur-2xl"></div>
          <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-16">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center border border-white/30">
              <SafetyCertificateOutlined className="text-4xl text-white" />
            </div>
            <div>
              <span className="text-white text-2xl font-bold block">政务服务中台</span>
              <span className="text-white/60 text-sm">Provincial Gov Service Platform</span>
            </div>
          </div>

          <h1 className="text-white text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 leading-tight">
            省级一体化
            <br />
            <span className="bg-gradient-to-r from-white via-primary-100 to-primary-200 bg-clip-text text-transparent">
              政务服务中台
            </span>
          </h1>
          <p className="text-white/80 text-lg lg:text-xl max-w-xl leading-relaxed mb-10">
            构建统一、高效、智能的政务服务体系，整合人社、公安、卫健、住建等12个委办局业务系统，
            实现<span className="text-white font-semibold">"一网通办、跨省通办、一件事一次办"</span>
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-lg">
            {[
              { num: '12', label: '委办局接入' },
              { num: '200+', label: '电子证照互认' },
              { num: '98.5%', label: '群众满意度' },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20">
                <div className="text-white text-2xl lg:text-3xl font-bold mb-1">{item.num}</div>
                <div className="text-white/70 text-xs lg:text-sm">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-8 text-white/70 text-sm mb-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gov-green animate-pulse"></div>
              <span>安全可靠 · 等保三级</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gov-green animate-pulse"></div>
              <span>高效便捷 · 7×24服务</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gov-green animate-pulse"></div>
              <span>智能服务 · AI驱动</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-white/50 text-xs">
            <p>© 2025 省级一体化政务服务中台 版权所有</p>
            <p>技术支持：省大数据中心</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-xl">
          <div className="md:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-500 rounded-2xl mb-4 shadow-lg shadow-primary-500/30">
              <SafetyCertificateOutlined className="text-4xl text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gov-gray-700 mb-1">省级一体化政务服务中台</h2>
            <p className="text-gov-gray-400">欢迎登录</p>
          </div>

          <div className="bg-white rounded-3xl shadow-card p-6 sm:p-8 md:p-10 border border-gov-gray-100">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gov-gray-700 mb-2 flex items-center gap-3">
                <span>统一身份认证</span>
                <Tag color="blue" bordered={false} className="text-xs font-normal">
                  省政务云CA对接
                </Tag>
              </h2>
              <p className="text-gov-gray-400">请选择您的角色身份后登录系统</p>
            </div>

            <div className="mb-6">
              <Tabs
                activeKey={selectedRole}
                onChange={(k) => setSelectedRole(k as RoleKey)}
                size="small"
                className="role-tabs"
                tabBarStyle={{
                  borderBottom: '1px solid #E5E6EB',
                  marginBottom: 20,
                }}
                items={(['citizen', 'enterprise', 'staff', 'platform', 'ops', 'admin'] as RoleKey[]).map(role => ({
                  key: role,
                  label: (
                    <span className="flex items-center gap-1.5 px-1 py-1">
                      {roleIcons[role]}
                      <span>{roleConfig[role].label}</span>
                    </span>
                  ),
                }))}
              />

              <div className="bg-gradient-to-r from-primary-50 to-transparent rounded-xl p-4 border border-primary-100 flex items-start gap-3">
                {roleIcons[selectedRole]}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-gov-gray-700">{currentRoleCfg?.label}</p>
                    <Tag color={selectedRole === 'admin' ? 'red' : selectedRole === 'platform' ? 'orange' : selectedRole === 'ops' ? 'purple' : 'blue'} className="m-0 text-xs">
                      {currentRoleCfg?.defaultRoute === '/' ? '掌上办事首页' : currentRoleCfg?.defaultRoute}
                    </Tag>
                  </div>
                  <p className="text-xs text-gov-gray-500 mb-2">{currentRoleCfg?.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentRoleCfg?.tips.map((tip, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs text-primary-600 bg-white px-2 py-0.5 rounded-full border border-primary-200">
                        <span className="w-1 h-1 rounded-full bg-primary-500"></span>
                        {tip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {errorDisplay}

            <Form
              form={form}
              name="login"
              onFinish={handleSubmit}
              autoComplete="off"
              size="large"
              layout="vertical"
              requiredMark={false}
            >
              <Form.Item
                name="username"
                label={<span className="font-medium text-gov-gray-600">账号 / 身份证号 / 手机号</span>}
                rules={[
                  { required: true, message: '请输入登录账号' },
                  { min: 2, message: '账号至少2个字符' },
                ]}
              >
                <Input
                  prefix={<UserOutlined className="text-gov-gray-400" />}
                  placeholder={`请输入${currentRoleCfg?.label || '用户'}账号`}
                  className="h-12 rounded-xl"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span className="font-medium text-gov-gray-600">登录密码</span>}
                rules={[
                  { required: true, message: '请输入登录密码' },
                  { min: 6, message: '密码至少6个字符' },
                ]}
              >
                <Password
                  prefix={<LockOutlined className="text-gov-gray-400" />}
                  suffix={
                    <span
                      className="cursor-pointer text-gov-gray-400 hover:text-primary-500 transition-colors"
                      onClick={() => setShowPwd(!showPwd)}
                    >
                      {showPwd ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    </span>
                  }
                  placeholder="请输入密码"
                  className="h-12 rounded-xl"
                  autoComplete="current-password"
                  iconRender={() => <></>}
                />
              </Form.Item>

              <div className="flex justify-between items-center mb-6">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox className="text-gov-gray-500">记住账号（7天内免登录）</Checkbox>
                </Form.Item>
                <button
                  type="button"
                  onClick={handleForgetPassword}
                  className="text-primary-500 hover:text-primary-600 text-sm font-medium transition-colors"
                >
                  忘记密码？
                </button>
              </div>

              <Form.Item className="mb-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  block
                  className="h-14 rounded-xl text-base font-medium"
                  style={{
                    backgroundImage: roleButtonGradients[selectedRole],
                    border: 'none',
                    boxShadow: `0 4px 14px 0 ${
                      selectedRole === 'admin' ? '#F5222D44' :
                      selectedRole === 'platform' ? '#F7723444' :
                      selectedRole === 'ops' ? '#7B61FF44' :
                      '#165DFF44'
                    }`,
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Spin size="small" />
                      统一认证校验中...
                    </span>
                  ) : (
                    <span className="flex flex-col items-center leading-tight">
                      <span>安全登录 → 进入{currentRoleCfg?.label}工作台</span>
                      <span className="text-[11px] opacity-80 font-normal">
                        {currentRoleCfg?.defaultRoute === '/' ? '掌上办事首页' : `跳转至 ${currentRoleCfg?.defaultRoute}`}
                      </span>
                    </span>
                  )}
                </Button>
              </Form.Item>
            </Form>

            <div className="my-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-gov-gray-200"></div>
              <span className="text-gov-gray-400 text-sm whitespace-nowrap">统一认证通道</span>
              <div className="flex-1 h-px bg-gov-gray-200"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                icon={<KeyOutlined />}
                onClick={handleCaLogin}
                loading={caLoading}
                size="large"
                className="h-12 rounded-xl text-sm font-medium border-primary-200 text-primary-600 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
              >
                {caLoading ? 'CA证书读取中...' : '省政务云CA登录'}
              </Button>
              <Button
                icon={<ScanOutlined />}
                onClick={() => message.info({
                  content: (
                    <div>
                      <p className="font-medium text-gov-gray-700 mb-1">扫码登录</p>
                      <p className="text-sm text-gov-gray-500">请使用"XX政务APP"扫描二维码登录，功能开发中</p>
                    </div>
                  ),
                  duration: 4,
                })}
                size="large"
                className="h-12 rounded-xl text-sm font-medium border-gov-gray-300 text-gov-gray-600 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
              >
                扫码登录
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-gov-gray-100">
              <div
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setShowTestAccounts(!showTestAccounts)}
              >
                <span className="text-sm font-medium text-primary-600 flex items-center gap-2">
                  <KeyOutlined />
                  测试账号（点击自动填充，切换角色Tab自动切换账号）
                </span>
                <span className={`text-primary-500 text-xs transition-transform ${showTestAccounts ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </div>

              {showTestAccounts && (
                <div className="mt-3 bg-primary-50/50 rounded-xl p-3 border border-primary-100 animate-slide-down">
                  {testAccounts[selectedRole]?.map((acc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-primary-200 hover:border-primary-400 hover:shadow-sm transition-all mb-2 last:mb-0"
                    >
                      <div onClick={() => form.setFieldsValue({ username: acc.username, password: acc.password })} className="flex-1 cursor-pointer">
                        <div className="text-sm font-medium text-gov-gray-700">{acc.desc}</div>
                        <div className="text-xs text-gov-gray-500 mt-1 font-mono">
                          账号: <span className="text-primary-600 font-semibold">{acc.username}</span>
                          <span className="mx-2 text-gov-gray-300">|</span>
                          密码: <span className="text-primary-600 font-semibold">{acc.password}</span>
                        </div>
                      </div>
                      <Button
                        type="primary"
                        size="small"
                        loading={isLoading}
                        onClick={async () => {
                          clearLastError();
                          const result = await login(acc.username, acc.password, selectedRole);
                          if (result.success && result.user && result.redirectRoute) {
                            setShowSuccessAnim(true);
                            const userType = result.user.userType as RoleKey;
                            const roleLabel = roleConfig[selectedRole]?.label
                              || roleConfig[userType]?.label
                              || result.user.userType;
                            setLoginSuccessInfo({
                              name: result.user.name,
                              role: roleLabel,
                              redirectRoute: result.redirectRoute,
                              countdown: 3,
                            });
                          }
                        }}
                        className="h-8 px-4 text-xs rounded-lg"
                        style={{
                          backgroundImage: roleButtonGradients[selectedRole],
                          border: 'none',
                        }}
                      >
                        一键登录
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gov-gray-100 text-center">
              <p className="text-xs text-gov-gray-400 leading-relaxed">
                本系统已对接<span className="text-primary-500 font-medium">省政务云统一身份认证平台</span>，
                登录信息全程<span className="text-gov-green font-medium">HTTPS/SSL加密传输</span>。
                <br />
                服务监督电话：<span className="font-mono text-gov-gray-600">12345</span>
                <span className="mx-2">·</span>
                技术支持：<span className="font-mono text-gov-gray-600">010-XXXXXXXX</span>
              </p>
            </div>

            <div className="mt-4 p-3 bg-gov-gray-50 rounded-xl border border-gov-gray-200 text-xs font-mono">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gov-gray-500">🔍 认证状态</span>
                <span className={isAuthenticated ? 'text-gov-green font-semibold' : 'text-gov-red font-semibold'}>
                  {isAuthenticated ? '已认证' : '未认证'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-gov-gray-500">
                <div>loginRole: <span className="text-gov-gray-700">{loginRole || '-'}</span></div>
                <div>user: <span className="text-gov-gray-700">{user?.name || '-'}</span></div>
                <div>isLoading: <span className="text-gov-gray-700">{String(isLoading)}</span></div>
                <div>defaultRoute: <span className="text-gov-gray-700">{getDefaultRoute()}</span></div>
              </div>
              {lastLoginResult && (
                <div className="mt-2 pt-2 border-t border-gov-gray-200">
                  <div className="text-gov-gray-500 mb-1">lastLoginResult:</div>
                  <pre className="text-[10px] text-gov-gray-600 overflow-x-auto whitespace-pre-wrap break-all">
{JSON.stringify(lastLoginResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
