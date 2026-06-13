import React, { useState } from 'react';
import {
  Form, Input, Button, Card, Tabs, App, Typography, Alert, Tag, Space, Divider,
} from 'antd';
import {
  UserOutlined, LockOutlined, MailOutlined, PhoneOutlined,
  SafetyCertificateOutlined, CrownOutlined, TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store';

const { Title, Text, Paragraph } = Typography;

type RoleKey = 'demo' | 'admin' | 'platform';

const TEST_ACCOUNTS: { key: RoleKey; username: string; password: string; role: string; roleLabel: string; desc: string; color: string; icon: React.ReactNode }[] = [
  {
    key: 'demo', username: 'demo', password: 'demo1234', role: 'user',
    roleLabel: '普通用户', color: 'blue', icon: <TeamOutlined />,
    desc: '拥有个人设备、场景、分享、语音控制等所有用户级功能，适合体验完整业务流程',
  },
  {
    key: 'admin', username: 'admin', password: 'admin1234', role: 'super_admin',
    roleLabel: '平台超级管理员', color: 'magenta', icon: <CrownOutlined />,
    desc: '拥有所有厂商管理、全局设备监控、告警配置、平台数据分析等超级权限',
  },
  {
    key: 'platform', username: 'platform', password: 'platform1234', role: 'admin',
    roleLabel: '厂商接入方', color: 'geekblue', icon: <SafetyCertificateOutlined />,
    desc: '拥有厂商设备接入、API Key 管理、固件发布、接入数据看板等厂商级权限',
  },
];

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState<RoleKey | false>(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleLogin = async (values: any, accountKey?: RoleKey) => {
    setErrorMsg('');
    setLoading(accountKey || 'demo');
    try {
      const result: any = await authAPI.login(values);
      const roleInfo = TEST_ACCOUNTS.find(a => a.username === values.username);
      const roleLabel = roleInfo?.roleLabel || (result.user.role === 'super_admin' ? '平台超级管理员' : result.user.role === 'admin' ? '厂商接入方' : '普通用户');
      message.success(`登录成功！欢迎${roleLabel}：${result.user.username}`);
      setAuth(result);
      setTimeout(() => navigate('/dashboard'), 400);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '登录失败，请稍后重试';
      setErrorMsg(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: any) => {
    setErrorMsg('');
    setLoading('demo');
    try {
      const result: any = await authAPI.register(values);
      message.success('注册成功，已自动登录');
      setAuth(result);
      setTimeout(() => navigate('/dashboard'), 400);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '注册失败，请稍后重试';
      setErrorMsg(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (acc: typeof TEST_ACCOUNTS[0]) => {
    const form = document.querySelectorAll('form')[0] as HTMLFormElement;
    if (form) {
      handleLogin({ username: acc.username, password: acc.password }, acc.key);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #4f46e5 100%)',
      padding: 24,
      gap: 32,
      flexWrap: 'wrap',
    }}>
      <div style={{ flex: '0 1 520px', color: '#fff', maxWidth: 520 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⚡</div>
        <Title style={{ color: '#fff', margin: 0, fontSize: 40, fontWeight: 800 }}>
          IoT 统一管控平台
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, lineHeight: 1.8, marginTop: 16 }}>
          支持 <b style={{ color: '#38bdf8' }}>2000+</b> 硬件厂商接入 · 标准 MQTT/HTTP 协议 · 厂商白名单认证<br />
          设备发现 · 固件 OTA 升级 · 远程控制 · 场景联动 · 细粒度分享权限<br />
          多品牌设备抽象 · 语音指令语义解析 · 智能场景编排 · 在线率监控
        </Paragraph>
        <Divider style={{ borderColor: 'rgba(255,255,255,0.15)', margin: '24px 0' }} />
        <Space size={[8, 8]} wrap>
          <Tag color="blue" style={{ padding: '4px 12px', fontSize: 13 }}>🎯 设备统一管控</Tag>
          <Tag color="cyan" style={{ padding: '4px 12px', fontSize: 13 }}>🔐 细粒度权限</Tag>
          <Tag color="purple" style={{ padding: '4px 12px', fontSize: 13 }}>🎤 语音指令</Tag>
          <Tag color="magenta" style={{ padding: '4px 12px', fontSize: 13 }}>🤖 智能场景</Tag>
          <Tag color="orange" style={{ padding: '4px 12px', fontSize: 13 }}>📊 数据分析</Tag>
          <Tag color="green" style={{ padding: '4px 12px', fontSize: 13 }}>🔔 告警推送</Tag>
        </Space>
      </div>

      <div style={{ flex: '0 1 460px', maxWidth: 460 }}>
        <Card style={{
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
          bodyStyle={{ padding: 0 }}
        >
          <div style={{
            padding: '32px 32px 16px 32px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
          }}>
            <div style={{ fontSize: 48, color: '#1677ff', marginBottom: 8 }}>🔐</div>
            <Title level={3} style={{ margin: 0 }}>账户登录</Title>
            <Text type="secondary">选择测试账户一键体验，或手动输入账号密码</Text>
          </div>

          <div style={{ padding: 24 }}>
            {errorMsg && (
              <Alert
                type="error"
                showIcon
                message="登录失败"
                description={errorMsg}
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            )}

            <Card
              size="small"
              style={{ marginBottom: 20, borderRadius: 8, background: '#fafafa' }}
              title={<Text strong style={{ fontSize: 13 }}>⚡ 测试账户快捷登录（点击卡片直接登录）</Text>}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                {TEST_ACCOUNTS.map((acc) => (
                  <div
                    key={acc.key}
                    onClick={() => quickFill(acc)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      cursor: loading === acc.key ? 'wait' : 'pointer',
                      border: '1px solid #e5e7eb',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'all 0.2s',
                      opacity: loading && loading !== acc.key ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        (e.currentTarget as HTMLElement).style.borderColor = '#1677ff';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(22,119,255,0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  >
                    <Tag color={acc.color} icon={acc.icon} style={{ fontSize: 12, padding: '2px 10px', margin: 0 }}>
                      {acc.roleLabel}
                    </Tag>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong style={{ fontSize: 13 }}>{acc.username}</Text>
                      <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                        / {acc.password}
                      </Text>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{acc.desc}</div>
                    </div>
                    <Button
                      size="small"
                      type="primary"
                      loading={loading === acc.key}
                      style={{ flexShrink: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        quickFill(acc);
                      }}
                    >
                      登录
                    </Button>
                  </div>
                ))}
              </Space>
            </Card>

            <Tabs
              activeKey={mode}
              onChange={(k) => { setMode(k as any); setErrorMsg(''); }}
              centered
              size="large"
              items={[
                {
                  key: 'login',
                  label: '账号密码登录',
                  children: (
                    <Form
                      layout="vertical"
                      onFinish={(v) => handleLogin(v)}
                      initialValues={{ username: '', password: '' }}
                      size="large"
                    >
                      <Form.Item
                        name="username"
                        label="用户名 / 邮箱 / 手机号"
                        rules={[{ required: true, message: '请输入登录信息' }]}
                      >
                        <Input prefix={<UserOutlined />} placeholder="请输入用户名 / demo / admin / platform" />
                      </Form.Item>
                      <Form.Item
                        name="password"
                        label="密码"
                        rules={[{ required: true, message: '请输入密码' }]}
                      >
                        <Input.Password prefix={<LockOutlined />} placeholder="请输入密码 / demo1234 / admin1234 / platform1234" />
                      </Form.Item>
                      <Form.Item style={{ marginBottom: 8 }}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={loading === 'demo'}
                          block
                          size="large"
                          style={{ height: 44, fontSize: 15, fontWeight: 600 }}
                        >
                          登 录
                        </Button>
                      </Form.Item>
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          💡 登录后会根据账户角色自动呈现不同的功能菜单和操作权限
                        </Text>
                      </div>
                    </Form>
                  ),
                },
                {
                  key: 'register',
                  label: '新账户注册',
                  children: (
                    <Form
                      layout="vertical"
                      onFinish={handleRegister}
                      size="large"
                    >
                      <Form.Item
                        name="username"
                        label="用户名"
                        rules={[{ required: true, min: 3, message: '用户名至少3位' }]}
                      >
                        <Input prefix={<UserOutlined />} placeholder="请设置用户名（3-50字符）" />
                      </Form.Item>
                      <Form.Item name="email" label="邮箱 (可选)">
                        <Input prefix={<MailOutlined />} placeholder="请输入邮箱用于找回密码" />
                      </Form.Item>
                      <Form.Item name="phone" label="手机号 (可选)">
                        <Input prefix={<PhoneOutlined />} placeholder="请输入手机号用于短信告警" />
                      </Form.Item>
                      <Form.Item
                        name="password"
                        label="密码"
                        rules={[{ required: true, min: 8, message: '密码至少8位' }]}
                      >
                        <Input.Password prefix={<LockOutlined />} placeholder="请设置密码（至少8位）" />
                      </Form.Item>
                      <Form.Item style={{ marginBottom: 8 }}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={loading === 'demo'}
                          block
                          size="large"
                          style={{ height: 44, fontSize: 15, fontWeight: 600 }}
                        >
                          创建账户
                        </Button>
                      </Form.Item>
                      <Alert
                        type="info"
                        showIcon
                        message="注册账户默认为普通用户角色"
                        description="如需厂商接入或平台管理权限，请联系平台管理员进行角色升级"
                        style={{ borderRadius: 8 }}
                      />
                    </Form>
                  ),
                },
              ]}
            />
          </div>
        </Card>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
            © 2026 IoT 统一管控平台 · 跨品牌智能设备一站式解决方案
          </Text>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
