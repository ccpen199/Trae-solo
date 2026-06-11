import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Tabs, Row, Col, Divider, message } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MobileOutlined,
  WechatOutlined,
  AlipayCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { loginThunk } from '@/store/slices/authSlice';
import type { LoginParams } from '@/services/auth';
import { sendSmsCode } from '@/services/auth';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [activeTab, setActiveTab] = useState('password');
  const [passwordForm] = Form.useForm();
  const [smsForm] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (values: LoginParams) => {
    setLoading(true);
    try {
      await dispatch(loginThunk({ ...values, type: activeTab as LoginParams['type'] })).unwrap();
      message.success('登录成功');
      navigate('/');
    } catch {
      message.error('登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSms = async () => {
    try {
      const phone = smsForm.getFieldValue('phone');
      if (!phone) {
        message.warning('请输入手机号');
        return;
      }
      await sendSmsCode(phone);
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
    } catch {
      message.error('发送验证码失败');
    }
  };

  const tabItems = [
    {
      key: 'password',
      label: '账号密码',
      children: (
        <Form form={passwordForm} onFinish={(v) => handleLogin({ ...v, type: 'password' })}>
          <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input prefix={<UserOutlined />} placeholder="手机号" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{ borderRadius: 8 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'sms',
      label: '短信验证码',
      children: (
        <Form form={smsForm} onFinish={(v) => handleLogin({ ...v, type: 'sms' })}>
          <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input prefix={<MobileOutlined />} placeholder="手机号" size="large" />
          </Form.Item>
          <Form.Item name="smsCode" rules={[{ required: true, message: '请输入验证码' }]}>
            <Row gutter={8}>
              <Col span={16}>
                <Input
                  prefix={<SafetyCertificateOutlined />}
                  placeholder="验证码"
                  size="large"
                />
              </Col>
              <Col span={8}>
                <Button
                  size="large"
                  block
                  disabled={countdown > 0}
                  onClick={handleSendSms}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </Button>
              </Col>
            </Row>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{ borderRadius: 8 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <Card
        style={{
          width: 420,
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ color: '#1B5E20', fontSize: 24, marginBottom: 4 }}>
            贵州省全域数字服务融合平台
          </h1>
          <p style={{ color: '#999', margin: 0 }}>市民门户登录</p>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          centered
        />

        <Divider plain>其他登录方式</Divider>

        <Row justify="center" gutter={32}>
          <Col>
            <Button
              shape="circle"
              size="large"
              icon={<WechatOutlined style={{ color: '#07C160', fontSize: 22 }} />}
              onClick={() => handleLogin({ type: 'wechat', wechatCode: 'mock' })}
            />
            <div style={{ textAlign: 'center', marginTop: 4, fontSize: 12, color: '#999' }}>
              微信
            </div>
          </Col>
          <Col>
            <Button
              shape="circle"
              size="large"
              icon={<AlipayCircleOutlined style={{ color: '#1677FF', fontSize: 22 }} />}
              onClick={() => handleLogin({ type: 'alipay', alipayCode: 'mock' })}
            />
            <div style={{ textAlign: 'center', marginTop: 4, fontSize: 12, color: '#999' }}>
              支付宝
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
