import React, { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, Alert, Divider, Typography, Result } from 'antd';
import { 
  UserOutlined, LockOutlined, SafetyOutlined, TeamOutlined, HomeOutlined,
  ArrowRightOutlined, CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

type LoginRole = 'customer' | 'provider' | 'admin';

interface LoginValues {
  phone: string;
  password: string;
}

interface RegisterValues {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'customer' | 'provider';
}

interface ErrorInfo {
  code: string;
  message: string;
  suggestion: string;
}

const roleConfig = {
  customer: {
    icon: <HomeOutlined />,
    title: '家庭用户',
    subtitle: '预约服务 / 进度跟踪 / 评价服务',
    desc: '预约上门服务，跟踪服务进度，评价服务质量',
    color: '#1890ff',
    gradient: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    bgColor: '#e6f7ff',
    targetPage: '/services',
    targetText: '去预约服务',
    welcomeDesc: '您可以浏览服务商城、预约上门服务、跟踪订单进度',
  },
  provider: {
    icon: <TeamOutlined />,
    title: '技能师傅',
    subtitle: '接单服务 / 日程管理 / 收入查看',
    desc: '接收派单、管理服务日程、查看收入结算',
    color: '#52c41a',
    gradient: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
    bgColor: '#f6ffed',
    targetPage: '/provider/orders',
    targetText: '查看待接订单',
    welcomeDesc: '您可以查看待接订单、管理服务日程、查看收入明细',
  },
  admin: {
    icon: <SafetyOutlined />,
    title: '平台管理员',
    subtitle: '服务商审核 / 争议仲裁 / 数据分析',
    desc: '服务商准入审核、订单管理、争议仲裁、数据分析',
    color: '#722ed1',
    gradient: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
    bgColor: '#f9f0ff',
    targetPage: '/admin',
    targetText: '进入运营后台',
    welcomeDesc: '您可以审核服务商准入、管理订单、仲裁争议、查看数据分析',
  },
};

const demoAccounts = [
  { role: 'admin' as LoginRole, phone: '13800000000', password: '123456', name: '系统管理员', badge: '👑' },
  { role: 'provider' as LoginRole, phone: '13900000000', password: '123456', name: '张师傅', badge: '🔧' },
  { role: 'customer' as LoginRole, phone: '13600000000', password: '123456', name: '测试用户', badge: '🏠' },
];

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [loginRole, setLoginRole] = useState<LoginRole>('customer');
  const [loginError, setLoginError] = useState<ErrorInfo | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginForm] = Form.useForm();
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.phone && user.phone !== 'admin' && /^1\d{10}$/.test(user.phone)) {
      const targetRole = user.role as LoginRole;
      setLoginSuccess(true);
      const timer = setTimeout(() => {
        navigate(roleConfig[targetRole].targetPage);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  const handleLogin = useCallback(async (values: LoginValues) => {
    try {
      setLoading(true);
      setLoginError(null);
      await login(values.phone, values.password);
    } catch (error: any) {
      const status = error.response?.status;
      const backendError = error.response?.data?.error;
      let errorInfo: ErrorInfo;

      if (status === 401) {
        if (backendError?.includes('密码')) {
          errorInfo = {
            code: 'WRONG_PASSWORD',
            message: `密码错误 — 当前以【${roleConfig[loginRole].title}】身份登录`,
            suggestion: loginRole === 'admin' 
              ? '管理员初始密码为 123456，如已修改请使用新密码' 
              : '请确认密码是否正确，忘记密码可联系平台客服重置',
          };
        } else if (backendError?.includes('不存在')) {
          errorInfo = {
            code: 'USER_NOT_FOUND',
            message: `该手机号未注册为【${roleConfig[loginRole].title}】`,
            suggestion: loginRole === 'admin' 
              ? '管理员账号由系统分配，测试账号：13800000000 / 123456'
              : '请检查手机号是否正确，或点击「立即注册」创建新账号',
          };
        } else {
          errorInfo = {
            code: 'AUTH_FAILED',
            message: `登录失败 — ${backendError || '账号或密码错误'}`,
            suggestion: `请确认该账号属于【${roleConfig[loginRole].title}】角色，或点击左侧测试账号快速登录`,
          };
        }
      } else if (status === 403) {
        errorInfo = {
          code: 'ACCOUNT_DISABLED',
          message: '账号已被禁用',
          suggestion: '该账号已被平台停用，请联系客服处理',
        };
      } else if (!error.response) {
        errorInfo = {
          code: 'NETWORK_ERROR',
          message: '网络连接失败',
          suggestion: '请检查网络连接，确认后端服务是否正常运行',
        };
      } else {
        errorInfo = {
          code: 'SERVER_ERROR',
          message: '服务器暂时不可用',
          suggestion: '请稍后重试，或联系技术支持',
        };
      }

      setLoginError(errorInfo);
    } finally {
      setLoading(false);
    }
  }, [login, loginRole]);

  const handleRegister = async (values: RegisterValues) => {
    try {
      setLoading(true);
      setLoginError(null);
      await register(values.phone, values.password, values.name, values.role);
    } catch (error: any) {
      const backendError = error.response?.data?.error;
      setLoginError({
        code: 'REGISTER_FAILED',
        message: backendError || '注册失败',
        suggestion: '请检查输入信息后重试，或使用其他手机号注册',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = useCallback((role: LoginRole) => {
    setLoginRole(role);
    setLoginError(null);
    loginForm.resetFields();
  }, [loginForm]);

  const handleQuickLogin = useCallback(async (account: typeof demoAccounts[0]) => {
    setLoginRole(account.role);
    setLoginError(null);
    loginForm.setFieldsValue({
      phone: account.phone,
      password: account.password,
    });
    try {
      setLoading(true);
      await login(account.phone, account.password);
    } catch (error: any) {
      setLoginError({
        code: 'QUICK_LOGIN_FAILED',
        message: '快速登录失败',
        suggestion: '请检查后端服务是否正常运行，或手动输入账号密码登录',
      });
    } finally {
      setLoading(false);
    }
  }, [login, loginForm]);

  const validatePhone = (_: any, value: string) => {
    if (!value) return Promise.reject(new Error('请输入手机号'));
    if (value === 'admin') return Promise.resolve();
    if (!/^1[3-9]\d{9}$/.test(value)) return Promise.reject(new Error('请输入正确的11位手机号（以1开头）'));
    return Promise.resolve();
  };

  const validatePassword = (_: any, value: string) => {
    if (!value) return Promise.reject(new Error('请输入密码'));
    if (value.length < 6) return Promise.reject(new Error('密码长度不能少于6位'));
    return Promise.resolve();
  };

  if (loginSuccess && user && user.phone && /^1\d{10}$/.test(user.phone)) {
    const roleInfo = roleConfig[user.role as LoginRole];
    return (
      <div style={{ 
        display: 'flex', justifyContent: 'center', alignItems: 'center', 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${roleInfo.color}22 0%, ${roleInfo.color}44 100%)`,
        padding: 24,
      }}>
        <div style={{ 
          background: '#fff', borderRadius: 16, padding: '48px 64px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: 560 
        }}>
          <Result
            icon={<CheckCircleOutlined style={{ color: roleInfo.color }} />}
            status="success"
            title={<span style={{ fontSize: 24 }}>登录成功，欢迎{user.name}！</span>}
            subTitle={<span style={{ fontSize: 15, color: '#666' }}>{roleInfo.welcomeDesc}</span>}
            extra={[
              <div key="info" style={{ marginBottom: 24, padding: '16px 24px', background: roleInfo.bgColor, borderRadius: 8, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{roleInfo.icon}</span>
                  <Text strong style={{ fontSize: 16, color: roleInfo.color }}>{roleInfo.title}工作台</Text>
                </div>
                {user.role === 'admin' && (
                  <div style={{ color: '#666', fontSize: 13, lineHeight: 2 }}>
                    · 服务商准入审核 → 审核通过后师傅方可接单<br/>
                    · 订单管理与监控 → 全链路履约跟踪<br/>
                    · 售后争议仲裁 → 三方协商+平台裁决<br/>
                    · 供应商账期与分账 → 资金合规管理<br/>
                    · 服务质量巡检与数据分析
                  </div>
                )}
                {user.role === 'provider' && (
                  <div style={{ color: '#666', fontSize: 13, lineHeight: 2 }}>
                    · 待接订单 → 系统派单后立即响应<br/>
                    · 服务日程 → 管理今日/本周预约<br/>
                    · 工单留痕 → 现场照片+时间戳记录<br/>
                    · 收入结算 → 查看到账明细
                  </div>
                )}
                {user.role === 'customer' && (
                  <div style={{ color: '#666', fontSize: 13, lineHeight: 2 }}>
                    · 服务预约 → 12大类上门服务<br/>
                    · 价格比价 → 透明定价，套餐组合<br/>
                    · 进度可视化 → 派单→上门→验收<br/>
                    · 评价反馈 → 服务质量保障
                  </div>
                )}
              </div>,
              <Button 
                key="go" type="primary" size="large"
                style={{ background: roleInfo.color, borderColor: roleInfo.color, height: 48, padding: '0 36px', fontSize: 16 }}
                onClick={() => navigate(roleInfo.targetPage)}
              >
                {roleInfo.targetText} <ArrowRightOutlined />
              </Button>,
            ]}
          />
        </div>
      </div>
    );
  }

  const currentConfig = roleConfig[loginRole];

  return (
    <div style={{ 
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 24,
    }}>
      <div style={{ 
        display: 'flex', maxWidth: 1060, width: '100%',
        background: '#fff', borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
      }}>
        {/* LEFT: Role Selection Panel */}
        <div style={{ 
          width: '42%', padding: 36, 
          background: currentConfig.gradient,
          color: '#fff', display: 'flex', flexDirection: 'column',
          transition: 'background 0.4s ease',
        }}>
          <div>
            <div style={{ fontSize: 52, marginBottom: 16 }}>{currentConfig.icon}</div>
            <Title level={2} style={{ color: '#fff', margin: 0, marginBottom: 6 }}>
              家庭生活服务平台
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
              连接专业技能师傅与万千家庭
            </Text>
          </div>

          <div style={{ marginTop: 28 }}>
            <Title level={5} style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 14, fontWeight: 400 }}>
              选择身份进入系统
            </Title>
            {Object.entries(roleConfig).map(([key, info]) => (
              <div 
                key={key}
                onClick={() => handleRoleChange(key as LoginRole)}
                style={{ 
                  padding: 14, marginBottom: 8, borderRadius: 10, cursor: 'pointer',
                  background: loginRole === key ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)',
                  border: loginRole === key ? '2px solid rgba(255,255,255,0.7)' : '2px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 22 }}>{info.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{info.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                      {info.subtitle}
                    </div>
                  </div>
                  {loginRole === key && <CheckCircleOutlined style={{ fontSize: 16 }} />}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 20 }}>
            <div style={{ 
              background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: 16,
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, display: 'block', marginBottom: 10, fontWeight: 500 }}>
                🎯 一键快速登录
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {demoAccounts.filter(a => a.role === loginRole).map((account) => (
                  <Button 
                    key={account.phone}
                    size="middle"
                    loading={loading}
                    onClick={() => handleQuickLogin(account)}
                    style={{ 
                      background: 'rgba(255,255,255,0.18)', 
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.35)',
                      borderRadius: 8,
                      textAlign: 'left',
                      height: 42,
                    }}
                  >
                    <span style={{ marginRight: 6 }}>{account.badge}</span>
                    {account.name}
                    <span style={{ opacity: 0.7, fontSize: 12, marginLeft: 8 }}>
                      ({account.phone})
                    </span>
                  </Button>
                ))}
              </div>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block', marginTop: 10 }}>
                点击即自动登录，无需手动输入
              </Text>
            </div>
          </div>
        </div>

        {/* RIGHT: Login Form */}
        <div style={{ width: '58%', padding: 40 }}>
          {/* Role Header - changes with selection */}
          <div style={{ 
            display: 'flex', alignItems: 'center', marginBottom: 24,
            padding: '16px 20px', borderRadius: 10,
            background: currentConfig.bgColor, border: `1px solid ${currentConfig.color}33`,
            transition: 'all 0.3s',
          }}>
            <div style={{ 
              fontSize: 26, color: currentConfig.color,
              width: 44, height: 44, borderRadius: 10,
              background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginRight: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
              {currentConfig.icon}
            </div>
            <div>
              <Title level={4} style={{ margin: 0, marginBottom: 2, color: currentConfig.color }}>
                {currentConfig.title}登录
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                登录后进入{currentConfig.title}专属工作台
              </Text>
            </div>
          </div>

          {/* Error Alert */}
          {loginError && (
            <Alert
              message={loginError.message}
              description={loginError.suggestion}
              type="error"
              showIcon
              icon={<CloseCircleOutlined />}
              style={{ marginBottom: 20, borderRadius: 8 }}
              closable
              onClose={() => setLoginError(null)}
            />
          )}

          {/* Login Form */}
          <Form
            form={loginForm}
            name="login"
            onFinish={handleLogin}
            layout="vertical"
            requiredMark={false}
            size="large"
          >
            <Form.Item
              label="手机号码"
              name="phone"
              rules={[{ validator: validatePhone }]}
            >
              <Input 
                prefix={<UserOutlined style={{ color: '#bbb' }} />} 
                placeholder={`请输入${currentConfig.title}的手机号`}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              label="登录密码"
              name="password"
              rules={[{ validator: validatePassword }]}
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: '#bbb' }} />} 
                placeholder="请输入密码（至少6位）"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 12 }}>
              <Button 
                type="primary" htmlType="submit" block 
                loading={loading}
                style={{ 
                  height: 48, fontSize: 16, fontWeight: 500, borderRadius: 8,
                  background: currentConfig.color, borderColor: currentConfig.color,
                }}
              >
                {currentConfig.title}登录
              </Button>
            </Form.Item>
          </Form>

          <Divider plain style={{ margin: '12px 0 20px' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {loginRole === 'admin' ? '管理员账号由系统分配' : '还没有账号？'}
            </Text>
          </Divider>

          {/* Register section for non-admin */}
          {loginRole !== 'admin' && (
            <Form
              name="register"
              onFinish={handleRegister}
              layout="vertical"
              requiredMark={false}
              initialValues={{ role: loginRole === 'provider' ? 'provider' : 'customer' }}
              size="large"
            >
              <Form.Item name="role" hidden><Input /></Form.Item>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <Form.Item label="真实姓名" name="name" rules={[{ required: true, message: '请输入' }, { min: 2, message: '至少2字' }]} style={{ marginBottom: 0 }}>
                  <Input placeholder="姓名" style={{ borderRadius: 8 }} />
                </Form.Item>
                <Form.Item label="手机号" name="phone" rules={[{ validator: validatePhone }]} style={{ marginBottom: 0 }}>
                  <Input placeholder="11位手机号" style={{ borderRadius: 8 }} />
                </Form.Item>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <Form.Item label="密码" name="password" rules={[{ validator: validatePassword }]} style={{ marginBottom: 0 }}>
                  <Input.Password placeholder="至少6位" style={{ borderRadius: 8 }} />
                </Form.Item>
                <Form.Item label="确认密码" name="confirmPassword" dependencies={['password']} rules={[
                  { required: true, message: '请确认' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) return Promise.resolve();
                      return Promise.reject(new Error('密码不一致'));
                    },
                  }),
                ]} style={{ marginBottom: 0 }}>
                  <Input.Password placeholder="再次输入" style={{ borderRadius: 8 }} />
                </Form.Item>
              </div>

              {loginRole === 'provider' && (
                <Alert
                  message="入驻须知：注册后需完成实名认证+技能证书+人脸识别，审核通过后方可接单"
                  type="info" showIcon style={{ marginBottom: 12, borderRadius: 8, fontSize: 13 }}
                />
              )}

              <Form.Item style={{ marginBottom: 0 }}>
                <Button block style={{ height: 44, borderRadius: 8 }} htmlType="submit" loading={loading}>
                  注册{loginRole === 'provider' ? '服务商' : '用户'}账号
                </Button>
              </Form.Item>
            </Form>
          )}

          {loginRole === 'admin' && (
            <Alert
              message="管理员账号说明"
              description="平台管理员账号由系统统一分配，不支持自主注册。测试环境可直接点击左侧「👑 系统管理员」一键登录。"
              type="info" showIcon style={{ borderRadius: 8, fontSize: 13 }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
