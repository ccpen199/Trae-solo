import React, { useState } from 'react';
import { Form, Input, Button, Card, Radio, message, Tabs, Alert } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const roleDescriptions = {
  jobseeker: {
    title: '求职者入口',
    desc: '浏览职位、创建三维简历、上传技能证书、查看匹配度、投递申请',
    color: '#1677ff',
  },
  hr: {
    title: '企业HR入口',
    desc: '发布职位、使用JD模板、ATS智能初筛、安排面试、日历联动',
    color: '#52c41a',
  },
  admin: {
    title: '管理员入口',
    desc: '企业资质核验、薪酬合规检查、HR操作审计、行业数据看板',
    color: '#722ed1',
  },
};

const roleMap = {
  jobseeker: '求职者',
  hr: '企业HR',
  admin: '管理员',
};

const Login = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { login, loading } = useAuthStore();
  const [role, setRole] = useState('jobseeker');
  const [loginError, setLoginError] = useState('');

  const handleSubmit = async (values) => {
    setLoginError('');
    const result = await login(values.username, values.password);
    if (result.success) {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (user && user.role !== role) {
        setLoginError(`账号角色不匹配：当前选择的是「${roleMap[role]}」入口，但该账号属于「${roleMap[user.role]}」，请切换到正确的入口登录`);
        message.warning('账号角色与所选入口不匹配');
        return;
      }
      
      message.success(`登录成功，欢迎${roleMap[user.role]}${user.username}`);
      setTimeout(() => {
        if (user?.role === 'admin') navigate('/admin/dashboard');
        else if (user?.role === 'hr') navigate('/enterprise/dashboard');
        else navigate('/');
      }, 300);
    } else {
      setLoginError(result.error || '用户名或密码错误，请检查后重试');
      message.error(result.error || '登录失败');
    }
  };

  const quickLogin = async (username, password, targetRole) => {
    setRole(targetRole);
    setLoginError('');
    form.setFieldsValue({ username, password });
    const result = await login(username, password);
    if (result.success) {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      message.success(`登录成功，欢迎${roleMap[user.role]}${user.username}`);
      setTimeout(() => {
        if (user?.role === 'admin') navigate('/admin/dashboard');
        else if (user?.role === 'hr') navigate('/enterprise/dashboard');
        else navigate('/');
      }, 300);
    } else {
      setLoginError(result.error || '快速登录失败，请手动输入账号密码');
      message.error(result.error || '快速登录失败');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 50%, #91caff 100%)',
      padding: 24,
    }}>
      <div style={{
        display: 'flex',
        gap: 48,
        alignItems: 'center',
        maxWidth: 1000,
        width: '100%',
      }}>
        <div style={{ flex: 1, color: '#003a8c' }}>
          <h1 style={{ fontSize: 48, fontWeight: 700, marginBottom: 16, color: '#0958d9' }}>
            制造业垂直招聘SaaS
          </h1>
          <p style={{ fontSize: 18, marginBottom: 24, lineHeight: 1.8, color: '#1d4e89' }}>
            专注先进制造业人才招聘
            <br />
            智能匹配 · 三维简历 · 资质核验 · 数据洞察
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#1d4e89' }}>
              <div style={{ width: 8, height: 8, background: '#52c41a', borderRadius: '50%' }} />
              OCR技能证书识别
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#1d4e89' }}>
              <div style={{ width: 8, height: 8, background: '#52c41a', borderRadius: '50%' }} />
              ATS智能初筛系统
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#1d4e89' }}>
              <div style={{ width: 8, height: 8, background: '#52c41a', borderRadius: '50%' }} />
              岗位匹配度雷达图
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#1d4e89' }}>
              <div style={{ width: 8, height: 8, background: '#52c41a', borderRadius: '50%' }} />
              企业资质人工核验
            </div>
          </div>
        </div>

        <Card
          style={{ width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
          variant="borderless"
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>账号登录</h2>
            <p style={{ color: '#8c8c8c', fontSize: 14 }}>欢迎使用制造业招聘平台</p>
          </div>

          <Tabs
            activeKey={role}
            onChange={setRole}
            centered
            items={[
              { key: 'jobseeker', label: '求职者' },
              { key: 'hr', label: '企业HR' },
              { key: 'admin', label: '管理员' },
            ]}
          />

          <div
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              marginBottom: 20,
              backgroundColor: `${roleDescriptions[role].color}0d`,
              border: `1px solid ${roleDescriptions[role].color}33`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <InfoCircleOutlined style={{ color: roleDescriptions[role].color, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, color: roleDescriptions[role].color, marginBottom: 4 }}>
                  {roleDescriptions[role].title}
                </div>
                <div style={{ fontSize: 13, color: '#595959', lineHeight: 1.6 }}>
                  {roleDescriptions[role].desc}
                </div>
              </div>
            </div>
          </div>

          {loginError && (
            <Alert
              message="登录失败"
              description={loginError}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              closable
              onClose={() => setLoginError('')}
            />
          )}

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
            validateTrigger="onBlur"
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
                { max: 20, message: '用户名最多20个字符' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" autoComplete="username" />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 4, message: '密码至少4个字符' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" autoComplete="current-password" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                icon={<LoginOutlined />}
                style={{ height: 44, fontSize: 16 }}
              >
                {role === 'admin' ? '管理员登录' : role === 'hr' ? '企业HR登录' : '求职者登录'}
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <span style={{ color: '#8c8c8c' }}>还没有账号？</span>
            <Link to="/register" style={{ color: '#1677ff', marginLeft: 4 }}>立即注册</Link>
          </div>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <p style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 12, textAlign: 'center' }}>
              快速登录（测试账号 · 密码均为 123456）
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button size="small" onClick={() => quickLogin('seeker1', '123456', 'jobseeker')}>
                求职者 seeker1
              </Button>
              <Button size="small" onClick={() => quickLogin('hr1', '123456', 'hr')}>
                企业HR hr1
              </Button>
              <Button size="small" onClick={() => quickLogin('admin', '123456', 'admin')}>
                管理员 admin
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
