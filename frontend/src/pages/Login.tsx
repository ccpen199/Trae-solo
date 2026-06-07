import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider, Tag, Space, Row, Col, Alert, Tooltip, Spin } from 'antd';
import {
  UserOutlined, LockOutlined, HomeOutlined, ShopOutlined, AuditOutlined,
  CrownOutlined, SafetyCertificateOutlined, EnvironmentOutlined,
  TeamOutlined, AlertOutlined, WarningOutlined, CloseCircleOutlined,
  CheckCircleOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { AxiosError } from 'axios';

const { Title, Text, Paragraph } = Typography;

interface LoginProps {
  onLogin: (user: any, token: string) => void;
  cities?: any[];
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; desc: string; home: string }> = {
  user: { label: '同城居民', color: 'blue', icon: <HomeOutlined />, desc: '浏览同城信息流、发布内容、预约服务', home: '/' },
  merchant: { label: '商户端', color: 'orange', icon: <ShopOutlined />, desc: '商户运营中心、广告投放、活动管理', home: '/merchants' },
  reviewer: { label: '审核员', color: 'purple', icon: <AuditOutlined />, desc: '内容安全审核工作台、敏感词管理', home: '/admin/review' },
  admin: { label: '城市管理员', color: 'red', icon: <CrownOutlined />, desc: '城市活跃度仪表盘、运营总览', home: '/admin/dashboard' },
};

const TEST_ACCOUNTS = [
  { username: 'admin', password: '123456', role: 'admin', label: '城市管理员', tag: '运营总览' },
  { username: 'reviewer', password: '123456', role: 'reviewer', label: '内容审核员', tag: '审核工作台' },
  { username: 'merchant', password: '123456', role: 'merchant', label: '商户代表', tag: '商户中心' },
  { username: 'zhangsan', password: '123456', role: 'user', label: '同城居民', tag: '信息流' },
];

const getErrorInfo = (error: AxiosError): { type: 'error' | 'warning' | 'info'; title: string; message: string; icon: React.ReactNode } => {
  const status = error.response?.status;
  const data: any = error.response?.data;
  const errorMsg = data?.error || data?.message || error.message;

  if (!navigator.onLine) {
    return {
      type: 'error',
      title: '网络连接失败',
      message: '请检查网络连接后重试',
      icon: <WarningOutlined />
    };
  }

  if (error.code === 'ERR_NETWORK' || status === undefined) {
    return {
      type: 'error',
      title: '服务不可用',
      message: '后端服务暂时无法访问，请稍后重试或联系管理员',
      icon: <CloseCircleOutlined />
    };
  }

  if (status === 401) {
    if (errorMsg.includes('密码') || errorMsg.includes('用户名')) {
      return {
        type: 'error',
        title: '账号或密码错误',
        message: '请检查用户名和密码是否正确，或点击下方测试账号快速体验',
        icon: <UserOutlined />
      };
    }
    if (errorMsg.includes('冻结') || errorMsg.includes('禁用')) {
      return {
        type: 'warning',
        title: '账号已被冻结',
        message: '您的账号存在异常操作，已被暂时冻结，请联系管理员',
        icon: <AlertOutlined />
      };
    }
    return {
      type: 'error',
      title: '账号校验失败',
      message: errorMsg || '无法验证您的身份，请重新登录',
      icon: <LockOutlined />
    };
  }

  if (status === 403) {
    return {
      type: 'warning',
      title: '权限不足',
      message: '您的账号没有此系统的访问权限，请联系管理员开通',
      icon: <SafetyCertificateOutlined />
    };
  }

  if (status === 500) {
    return {
      type: 'error',
      title: '服务器异常',
      message: '后端服务发生内部错误，请稍后重试',
      icon: <AlertOutlined />
    };
  }

  return {
    type: 'error',
    title: '登录失败',
    message: errorMsg || '未知错误，请稍后重试',
    icon: <InfoCircleOutlined />
  };
};

const LoginPage: React.FC<LoginProps> = ({ onLogin, cities = [] }) => {
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<ReturnType<typeof getErrorInfo> | null>(null);
  const [quickLoginLoading, setQuickLoginLoading] = useState<string | null>(null);
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    setLoading(true);
    setLoginError(null);
    try {
      const res = await authAPI.login(values);
      onLogin(res.data.user, res.data.token);
    } catch (error: any) {
      const errorInfo = getErrorInfo(error as AxiosError);
      setLoginError(errorInfo);
      if (errorInfo.type === 'error') {
        message.error(`${errorInfo.title}: ${errorInfo.message}`);
      } else {
        message.warning(`${errorInfo.title}: ${errorInfo.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (account: typeof TEST_ACCOUNTS[0]) => {
    if (quickLoginLoading) return;
    setQuickLoginLoading(account.username);
    setLoginError(null);
    try {
      const res = await authAPI.login({ username: account.username, password: account.password });
      message.success(`一键登录成功！欢迎，${ROLE_CONFIG[account.role]?.label}「${account.label}」`);
      onLogin(res.data.user, res.data.token);
    } catch (error: any) {
      const errorInfo = getErrorInfo(error as AxiosError);
      setLoginError(errorInfo);
      message.error(`${errorInfo.title}: ${errorInfo.message}`);
      form.setFieldsValue({ username: account.username, password: account.password });
    } finally {
      setQuickLoginLoading(null);
    }
  };

  const selectedCity = cities.length > 0 ? cities[0] : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <EnvironmentOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 12 }} />
        <Title level={1} style={{ color: '#fff', margin: 0, marginBottom: 4 }}>城事通</Title>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>
          以地级市为单位的本地化社区内容与服务聚合平台
        </Text>
        <br />
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          同城资讯 · 招聘求职 · 房屋租售 · 二手交易 · 相亲交友 · 商户服务
        </Text>
      </div>

      {selectedCity && (
        <Card size="small" style={{ marginBottom: 16, maxWidth: 960, width: '100%', background: 'rgba(255,255,255,0.1)', border: 'none' }}>
          <Space wrap style={{ color: '#fff', width: '100%', justifyContent: 'center' }}>
            <Space><EnvironmentOutlined style={{ color: '#1890ff' }} /> <Text strong style={{ color: '#fff' }}>当前城市：</Text><Text style={{ color: '#1890ff' }}>{selectedCity.name}</Text></Space>
            <Space><TeamOutlined style={{ color: '#52c41a' }} /> <Text style={{ color: '#fff' }}>人口：{selectedCity.population || '约980万'}</Text></Space>
            <Space><InfoCircleOutlined style={{ color: '#faad14' }} /> <Text style={{ color: '#fff' }}>方言：{selectedCity.dialect || '吴语'}</Text></Space>
            <Space><CheckCircleOutlined style={{ color: '#13c2c2' }} /> <Text style={{ color: '#fff' }}>共接入 {cities.length} 个地级市</Text></Space>
          </Space>
        </Card>
      )}

      <Row gutter={24} style={{ maxWidth: 960, width: '100%' }}>
        <Col xs={24} md={14}>
          <Card
            style={{ borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
            styles={{ body: { padding: 32 } }}
          >
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Title level={3} style={{ marginBottom: 4 }}>账号登录</Title>
              <Text type="secondary">选择你的身份，进入对应业务端</Text>
            </div>

            {loginError && (
              <Alert
                message={loginError.title}
                description={loginError.message}
                type={loginError.type}
                showIcon
                icon={loginError.icon}
                style={{ marginBottom: 16 }}
                closable
                onClose={() => setLoginError(null)}
              />
            )}

            <Form
              form={form}
              name="login"
              onFinish={onFinish}
              size="large"
            >
              <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
              </Form.Item>

              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading} size="large" style={{ height: 44 }}>
                  登录
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center' }}>
                <Text>还没有账号？</Text>
                <Link to="/register" style={{ marginLeft: 8, color: '#1890ff' }}>选择身份注册</Link>
              </div>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card
            style={{ borderRadius: 12, background: 'rgba(255,255,255,0.95)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
            styles={{ body: { padding: 24 } }}
          >
            <Title level={5} style={{ marginBottom: 12, textAlign: 'center' }}>
              <SafetyCertificateOutlined style={{ marginRight: 8, color: '#faad14' }} />
              四大角色身份分流
            </Title>

            <Space direction="vertical" style={{ width: '100%' }} size={10}>
              {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                <div key={key} style={{
                  padding: '10px 14px',
                  background: key === 'admin' ? '#fff1f0' : key === 'reviewer' ? '#f9f0ff' : key === 'merchant' ? '#fff7e6' : '#e6f7ff',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <Tag color={cfg.color} style={{ margin: 0, minWidth: 80, textAlign: 'center' }}>{cfg.label}</Tag>
                  <Text style={{ fontSize: 12, color: '#666' }}>{cfg.desc}</Text>
                </div>
              ))}
            </Space>

            <Divider style={{ margin: '14px 0 10px' }} />

            <Title level={5} style={{ marginBottom: 10, textAlign: 'center' }}>
              测试账号快速体验
            </Title>

            <Space direction="vertical" style={{ width: '100%' }} size={6}>
              {TEST_ACCOUNTS.map((acc) => (
                <Tooltip title={`点击一键登录：${acc.username} / ${acc.password} → ${ROLE_CONFIG[acc.role]?.label}`} key={acc.username}>
                  <div
                    onClick={() => handleQuickLogin(acc)}
                    style={{
                      padding: '8px 12px',
                      background: quickLoginLoading === acc.username ? '#e6f7ff' : '#fafafa',
                      borderRadius: 6,
                      cursor: quickLoginLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                      border: quickLoginLoading === acc.username ? '1px solid #1890ff' : '1px solid #f0f0f0',
                      opacity: quickLoginLoading && quickLoginLoading !== acc.username ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!quickLoginLoading) {
                        e.currentTarget.style.background = '#e6f7ff';
                        e.currentTarget.style.borderColor = '#1890ff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!quickLoginLoading || quickLoginLoading !== acc.username) {
                        e.currentTarget.style.background = quickLoginLoading === acc.username ? '#e6f7ff' : '#fafafa';
                        e.currentTarget.style.borderColor = quickLoginLoading === acc.username ? '#1890ff' : '#f0f0f0';
                      }
                    }}
                  >
                    <Space>
                      {quickLoginLoading === acc.username ? (
                        <Spin size="small" />
                      ) : (
                        <Text strong style={{ fontSize: 13 }}>{acc.username}</Text>
                      )}
                      {quickLoginLoading !== acc.username && (
                        <Text type="secondary" style={{ fontSize: 12 }}>/ {acc.password}</Text>
                      )}
                    </Space>
                    <Space size={4}>
                      <Tag color={ROLE_CONFIG[acc.role]?.color} style={{ margin: 0, fontSize: 11 }}>{acc.label}</Tag>
                      <Tag style={{ margin: 0, fontSize: 11 }}>{acc.tag}</Tag>
                    </Space>
                  </div>
                </Tooltip>
              ))}
            </Space>

            <Paragraph type="secondary" style={{ fontSize: 11, marginTop: 10, marginBottom: 0, textAlign: 'center' }}>
              点击账号一键登录，直接进入对应业务端
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
          城事通 · 本地化社区内容与服务聚合平台 · 数据落库可复查
        </Text>
      </div>
    </div>
  );
};

export default LoginPage;
