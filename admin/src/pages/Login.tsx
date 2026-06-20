import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { http } from '../utils/request';
import { useAdminStore } from '../store/adminStore';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setToken = useAdminStore(s => s.setToken);
  const setUser = useAdminStore(s => s.setUser);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (vals: any) => {
    setLoading(true);
    try {
      const data = await http.post<any>('/auth/login', {
        phone: vals.phone, password: vals.password, loginType: 'password'
      }) as any;
      if (data) {
        const user = data.user;
        if (user.role !== 'admin' && user.role !== 'reviewer') {
          message.error('该账号无后台管理权限');
          return;
        }
        setToken(data.token);
        setUser({ id: user.id, name: user.name, role: user.role, phone: user.phone });
        message.success(`欢迎回来，${user.name}`);
        setTimeout(() => navigate('/dashboard'), 300);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1E5DAB 0%, #0D47A1 50%, #0A3A8C 100%)'
    }}>
      <Card style={{ width: 460, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', borderRadius: 12, border: 'none' }}>
        <div style={{ textAlign: 'center', padding: '12px 0 32px' }}>
          <SafetyCertificateOutlined style={{ fontSize: 56, color: '#1E5DAB' }} />
          <Title level={3} style={{ margin: '16px 0 6px', color: '#0f172a' }}>
            省级市场监管 · 后台管理
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            电子签名 · 国密合规 · 不见面审批平台
          </Text>
        </div>
        <Form
          layout="vertical"
          onFinish={onSubmit}
          initialValues={{ phone: '137****0000', password: '123456', remember: true }}
        >
          <Form.Item label="账号" name="phone" rules={[{ required: true, message: '请输入账号' }]}>
            <Input prefix={<UserOutlined />} placeholder="手机号/工号" size="large" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="登录密码" size="large" />
          </Form.Item>
          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>记住登录状态</Checkbox>
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}
            style={{ height: 46, background: '#1E5DAB', fontWeight: 500 }}>
            安全登录
          </Button>
        </Form>
        <div style={{ marginTop: 28, padding: 14, background: '#f8fafc', borderRadius: 8 }}>
          <Text style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
            🔐 本系统符合《电子签名法》《密码法》及国家商用密码管理规范；
            所有操作均被审计记录，登录即表示同意《后台操作承诺书》。
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
