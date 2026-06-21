import React, { useState } from 'react';
import { Form, Input, Button, Card, Tabs, Typography, Checkbox, Alert } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import appStore from '@/store';

const { Title, Text } = Typography;

const Login: React.FC = observer(() => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [riskWarn, setRiskWarn] = useState('');

  const onFinish = async (values: any) => {
    setLoading(true);
    setRiskWarn('');
    try {
      const res = await appStore.login(values.username, values.password, values.imei);
      if (res.riskLevel === 'high' || res.riskLevel === 'medium') {
        setRiskWarn(res.riskLevel === 'high'
          ? '检测到高风险登录！请确认是否为本人操作，建议立即修改密码。'
          : '本次登录存在一定风险（新设备或异地登录），请确认账号安全。');
      }
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (e: any) {
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: any) => {
    setLoading(true);
    try {
      await appStore.register(values);
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundImage: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 backdrop-blur">
            <SafetyOutlined className="text-4xl text-white" />
          </div>
          <Title level={2} style={{ color: '#fff', margin: 0 }} className="!mb-1">
            智能视频监控平台
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
            家庭与小微场所实时视频监控与告警协同系统
          </Text>
        </div>

        <Card className="!rounded-2xl !shadow-2xl">
          <Tabs
            defaultActiveKey="login"
            centered
            size="large"
            items={[
              {
                key: 'login',
                label: '账号登录',
                children: (
                  <>
                    {riskWarn && (
                      <Alert
                        message={riskWarn}
                        type="warning"
                        showIcon
                        className="mb-4"
                        closable
                      />
                    )}
                    <Form
                      name="login"
                      layout="vertical"
                      onFinish={onFinish}
                      autoComplete="off"
                      size="large"
                    >
                      <Form.Item
                        name="username"
                        rules={[{ required: true, message: '请输入用户名/手机号/邮箱' }]}
                      >
                        <Input prefix={<UserOutlined />} placeholder="用户名 / 手机号 / 邮箱" />
                      </Form.Item>
                      <Form.Item
                        name="password"
                        rules={[{ required: true, message: '请输入密码' }]}
                      >
                        <Input.Password prefix={<LockOutlined />} placeholder="登录密码" />
                      </Form.Item>
                      <Form.Item name="imei">
                        <Input prefix={<SafetyOutlined />} placeholder="设备IMEI（可选，增强安全）" maxLength={15} />
                      </Form.Item>
                      <div className="flex justify-between items-center mb-4">
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                          <Checkbox>记住登录</Checkbox>
                        </Form.Item>
                        <Link to="#" className="text-blue-600">忘记密码？</Link>
                      </div>
                      <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block className="!h-11">
                          登录
                        </Button>
                      </Form.Item>
                    </Form>
                  </>
                )
              },
              {
                key: 'register',
                label: '注册账号',
                children: (
                  <Form
                    name="register"
                    layout="vertical"
                    onFinish={onRegister}
                    autoComplete="off"
                    size="large"
                  >
                    <Form.Item
                      name="username"
                      rules={[
                        { required: true, message: '请输入用户名' },
                        { min: 3, max: 20, message: '用户名长度3-20位' }
                      ]}
                    >
                      <Input prefix={<UserOutlined />} placeholder="设置用户名" />
                    </Form.Item>
                    <Form.Item name="nickname">
                      <Input prefix={<UserOutlined />} placeholder="昵称（可选）" />
                    </Form.Item>
                    <Form.Item
                      name="phone"
                      rules={[{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }]}
                    >
                      <Input prefix={<PhoneOutlined />} placeholder="手机号（可选）" maxLength={11} />
                    </Form.Item>
                    <Form.Item
                      name="email"
                      rules={[{ type: 'email', message: '邮箱格式不正确' }]}
                    >
                      <Input prefix={<MailOutlined />} placeholder="邮箱（可选）" />
                    </Form.Item>
                    <Form.Item
                      name="password"
                      rules={[
                        { required: true, message: '请输入密码' },
                        { min: 8, message: '密码长度至少8位' }
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined />} placeholder="设置密码（至少8位）" />
                    </Form.Item>
                    <Form.Item
                      name="confirmPassword"
                      dependencies={['password']}
                      rules={[
                        { required: true, message: '请确认密码' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('两次输入的密码不一致'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={loading} block className="!h-11">
                        立即注册
                      </Button>
                    </Form.Item>
                  </Form>
                )
              }
            ]}
          />
        </Card>

        <div className="text-center mt-6 text-white/70 text-sm">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <span>🔒 国密SM4加密</span>
            <span>📹 H.264/H.265</span>
            <span>🛡 AI智能侦测</span>
            <span>💬 双向语音</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Login;
