import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Tabs, Alert, Space, Tag } from 'antd';
import { UserOutlined, LockOutlined, WarningOutlined, CheckCircleOutlined, LoginOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { authApi } from '../api';

const QUICK_ACCOUNTS = [
  { label: '求职者', email: 'test@example.com', password: '123456', role: '普通用户' },
  { label: '管理员', email: 'admin@resume.com', password: '123456', role: '管理员' }
];

const normalizeEmail = (input: string): string => {
  const trimmed = input.trim().toLowerCase();
  if (trimmed === 'test') return 'test@example.com';
  if (trimmed === 'admin') return 'admin@resume.com';
  if (trimmed === 'platform') return 'admin@resume.com';
  if (trimmed === 'word') return 'test@example.com';
  if (!trimmed.includes('@')) {
    return trimmed + '@example.com';
  }
  return trimmed;
};

interface LoginPageProps {
  autoAdmin?: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ autoAdmin = false }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [validateError, setValidateError] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setToken, token } = useAppStore();

  useEffect(() => {
    if (token) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          navigate(parsed?.is_admin ? '/admin' : '/resumes', { replace: true });
          return;
        } catch (_error) {}
      }
      navigate('/resumes', { replace: true });
    }
  }, [token, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const expired = params.get('expired');
    if (expired === '1') {
      setErrorMsg('登录状态已过期，请重新登录');
    }
    const registered = params.get('registered');
    if (registered === '1') {
      setSuccessMsg('注册成功，请登录');
    }
  }, [location]);

  const getErrorMessage = (err: any): string => {
    const status = err?.status;
    const code = err?.code;
    const message = err?.error || err?.message;
    
    if (code === 'network_error') {
      return '网络连接失败，请检查网络或稍后重试';
    }
    if (status === 401) {
      if (message?.includes('密码') || message?.includes('password')) {
        return '密码错误，请检查后重试';
      }
      if (message?.includes('用户') || message?.includes('user') || message?.includes('邮箱') || message?.includes('email')) {
        return '该账号未注册，请先注册或使用其他账号';
      }
      return '账号或密码错误，请检查后重试';
    }
    if (status === 403) {
      return '该账号无权限访问，请联系管理员';
    }
    if (status === 422) {
      return message || '输入信息不完整，请检查后重试';
    }
    if (status === 500) {
      return '服务器繁忙，请稍后重试';
    }
    return message || '登录失败，请稍后重试';
  };

  const loginWithValues = async (values: any) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setValidateError('');
    try {
      const normalizedValues = {
        ...values,
        email: normalizeEmail(values.email)
      };
      
      const res: any = await authApi.login(normalizedValues);
      if (!res?.token) {
        throw new Error('服务器返回数据异常，请稍后重试');
      }
      setToken(res.token);
      setUser(res.user);
      message.success({
        content: `欢迎回来，${res.user?.name || '用户'}！`,
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        duration: 2
      });
      setTimeout(() => {
        navigate(res.user?.is_admin ? '/admin' : '/resumes', { replace: true });
      }, 300);
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setErrorMsg(errorMessage);
      message.error({
        content: errorMessage,
        icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
        duration: 3
      });
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    await loginWithValues(values);
  };

  const onFinishFailed = (errorInfo: any) => {
    const firstError = errorInfo.errorFields?.[0]?.errors?.[0];
    if (firstError) {
      setValidateError(firstError);
      message.warning({
        content: firstError,
        icon: <WarningOutlined style={{ color: '#faad14' }} />,
        duration: 2
      });
    }
  };

  const fillAccount = async (account: typeof QUICK_ACCOUNTS[0]) => {
    form.setFieldsValue({
      email: account.email,
      password: account.password
    });
    setValidateError('');
    setErrorMsg('');
    await loginWithValues({ email: account.email, password: account.password });
  };

  useEffect(() => {
    if (!autoAdmin || token || loading) return;
    fillAccount(QUICK_ACCOUNTS[1]);
  }, [autoAdmin, token]);

  const onRegisterFinish = async (values: any) => {
    setRegisterLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setValidateError('');
    try {
      const res: any = await authApi.register(values);
      if (!res?.token) {
        throw new Error('注册成功但登录异常，请手动登录');
      }
      setToken(res.token);
      setUser(res.user);
      message.success({
        content: '注册成功，正在进入工作台...',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        duration: 2
      });
      setTimeout(() => {
        navigate('/resumes', { replace: true });
      }, 500);
    } catch (err: any) {
      let errorMessage = getErrorMessage(err);
      if (err?.status === 409 || err?.message?.includes('已存在') || err?.message?.includes('already')) {
        errorMessage = '该邮箱已注册，请直接登录或使用其他邮箱';
      }
      setErrorMsg(errorMessage);
      message.error({
        content: errorMessage,
        icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
        duration: 3
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card style={{ width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', borderRadius: 12 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#1a365d' }}>📄 智能简历工作台</h1>
          <p style={{ color: '#718096', margin: 0 }}>让求职更高效，让简历更专业</p>
        </div>

        <div style={{ 
          background: '#f0f9ff', 
          border: '1px solid #bae6fd', 
          borderRadius: 8, 
          padding: '12px 16px', 
          marginBottom: 16 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <ThunderboltOutlined style={{ color: '#0284c7' }} />
            <span style={{ fontWeight: 600, color: '#0369a1' }}>快捷登录（点击直接进入）</span>
          </div>
          <Button
            type="primary"
            icon={<LoginOutlined />}
            loading={loading}
            onClick={() => fillAccount(QUICK_ACCOUNTS[1])}
            block
            style={{ marginBottom: 8, fontWeight: 600 }}
          >
            进入管理后台
          </Button>
          <Space wrap size={[8, 8]}>
            {QUICK_ACCOUNTS.map((account) => (
              <Button
                key={account.email}
                size="small"
                icon={<LoginOutlined />}
                loading={loading}
                onClick={() => fillAccount(account)}
                style={{ 
                  background: account.role === '管理员' ? '#fef3c7' : '#dbeafe',
                  borderColor: account.role === '管理员' ? '#f59e0b' : '#3b82f6',
                  color: account.role === '管理员' ? '#92400e' : '#1e40af'
                }}
              >
                {account.label} <Tag color={account.role === '管理员' ? 'orange' : 'blue'} style={{ marginLeft: 4 }}>{account.role}</Tag>
              </Button>
            ))}
          </Space>
        </div>

        {errorMsg && (
          <Alert
            message="登录提示"
            description={errorMsg}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMsg('')}
            style={{ marginBottom: 16 }}
          />
        )}

        {successMsg && (
          <Alert
            message="操作成功"
            description={successMsg}
            type="success"
            showIcon
            closable
            onClose={() => setSuccessMsg('')}
            style={{ marginBottom: 16 }}
          />
        )}

        {validateError && (
          <Alert
            message="输入提示"
            description={validateError}
            type="warning"
            showIcon
            closable
            onClose={() => setValidateError('')}
            style={{ marginBottom: 16 }}
          />
        )}
        
        <Tabs
          centered
          defaultActiveKey="login"
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form
                  form={form}
                  name="login"
                  onFinish={onFinish}
                  onFinishFailed={onFinishFailed}
                  initialValues={{ email: '', password: '' }}
                  size="large"
                  validateTrigger={['onBlur', 'onSubmit']}
                >
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: '请输入邮箱或快捷账号（test/admin）' },
                      { 
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();
                          const normalized = normalizeEmail(value);
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                          if (!emailRegex.test(normalized)) {
                            return Promise.reject('请输入有效的邮箱地址，或使用快捷账号 test/admin');
                          }
                          return Promise.resolve();
                        }
                      }
                    ]}
                    validateFirst
                  >
                    <Input 
                      prefix={<UserOutlined />} 
                      placeholder="邮箱地址 或 快捷账号（test/admin）" 
                      autoComplete="email"
                      onChange={(e) => {
                        if (validateError) setValidateError('');
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined />} 
                      placeholder="密码（123456）" 
                      autoComplete="current-password"
                      onChange={(e) => {
                        if (validateError) setValidateError('');
                      }}
                    />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 12 }}>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      aria-label="登录"
                      loading={loading} 
                      block 
                      size="large"
                      style={{ height: 44, fontSize: 16, fontWeight: 600 }}
                    >
                      {loading ? '登录中，请稍候...' : '登录'}
                    </Button>
                  </Form.Item>

                  <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12, lineHeight: 1.8 }}>
                    <p style={{ margin: 0 }}>
                      💡 输入 <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>test</code> 或 <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>admin</code> 可自动补全邮箱
                    </p>
                    <p style={{ margin: '4px 0 0 0' }}>
                      管理员：admin / 123456（管理后台）；测试账号：test / 123456
                    </p>
                  </div>
                </Form>
              )
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form
                  name="register"
                  onFinish={onRegisterFinish}
                  onFinishFailed={onFinishFailed}
                  size="large"
                  validateTrigger={['onBlur', 'onSubmit']}
                >
                  <Form.Item
                    name="name"
                    rules={[
                      { required: true, message: '请输入姓名' },
                      { min: 2, max: 50, message: '姓名长度必须在2-50个字符之间' }
                    ]}
                    validateFirst
                  >
                    <Input placeholder="请输入您的姓名" autoComplete="name" />
                  </Form.Item>
                  
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}
                    validateFirst
                  >
                    <Input prefix={<UserOutlined />} placeholder="邮箱地址" autoComplete="email" />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: '请输入密码' },
                      { min: 6, max: 50, message: '密码长度必须在6-50个字符之间' }
                    ]}
                    validateFirst
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="密码（至少6位）" autoComplete="new-password" />
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={registerLoading} 
                      block 
                      size="large"
                      style={{ height: 44, fontSize: 16, fontWeight: 600 }}
                    >
                      {registerLoading ? '注册中，请稍候...' : '注册并开始使用'}
                    </Button>
                  </Form.Item>
                </Form>
              )
            }
          ]}
        />
        
        <div style={{ textAlign: 'center', marginTop: 16, color: '#718096', fontSize: 13, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <p style={{ margin: 0 }}>💡 支持 Word、PDF 导入 · 9类行业模板 · ATS优化 · 质量诊断</p>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
