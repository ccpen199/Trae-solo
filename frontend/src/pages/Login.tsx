import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Select, message, Divider, Space } from 'antd';
import { MobileOutlined, SafetyOutlined, LoginOutlined } from '@ant-design/icons';
import api from '../api';

const communities = [
  { value: 'jinjiang', label: '锦江社区' },
  { value: 'wuhou', label: '武侯社区' },
  { value: 'gaoxin', label: '高新社区' },
  { value: 'qingyang', label: '青羊社区' },
];

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const sendCode = async () => {
    const phone = form.getFieldValue('phone');
    if (!phone || !/^1\d{10}$/.test(phone)) {
      message.warning('请输入正确的手机号');
      return;
    }
    setCodeLoading(true);
    try {
      await api.post('/auth/sms/send', { phone });
      message.success('验证码已发送');
    } catch {
      message.error('发送失败，请稍后重试');
    } finally {
      setCodeLoading(false);
    }
  };

  const handleLogin = async (values: { phone: string; code: string; community: string }) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        phone: values.phone,
        code: values.code,
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('community', values.community);
      message.success('登录成功');
      navigate('/');
    } catch {
      message.error('登录失败，请检查验证码');
    } finally {
      setLoading(false);
    }
  };

  const handleSAML = async () => {
    const community = form.getFieldValue('community');
    if (!community) {
      message.warning('请先选择社区');
      return;
    }
    window.location.href = `/api/auth/saml/login?community=${community}`;
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 420 }} title="🏘️ 邻里数字基座 — 登录">
        <Form form={form} onFinish={handleLogin} layout="vertical">
          <Form.Item name="community" label="所属社区" rules={[{ required: true, message: '请选择社区' }]}>
            <Select options={communities} placeholder="请选择社区子域名" />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, pattern: /^1\d{10}$/, message: '请输入正确的手机号' }]}>
            <Input prefix={<MobileOutlined />} placeholder="请输入手机号" maxLength={11} />
          </Form.Item>
          <Form.Item name="code" label="验证码" rules={[{ required: true, message: '请输入验证码' }]}>
            <Space.Compact style={{ width: '100%' }}>
              <Input prefix={<SafetyOutlined />} placeholder="请输入验证码" maxLength={6} />
              <Button onClick={sendCode} loading={codeLoading} style={{ width: 120 }}>
                获取验证码
              </Button>
            </Space.Compact>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block icon={<LoginOutlined />}>
              登录
            </Button>
          </Form.Item>
        </Form>
        <Divider>其他登录方式</Divider>
        <Button block onClick={handleSAML} icon={<SafetyOutlined />}>
          SAML SSO 单点登录
        </Button>
      </Card>
    </div>
  );
};

export default Login;
