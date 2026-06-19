import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/user';

const { Title, Text } = Typography;

export default function Login() {
  const navigate = useNavigate();
  const { setToken, setUser } = useUserStore();
  const { message } = App.useApp();

  const onFinish = (values: { phone: string; password: string }) => {
    console.log('[Login] values:', values.phone);
    setToken('admin-token');
    setUser({
      id: 'admin-1',
      phone: values.phone,
      nickname: '超级管理员',
      realName: '系统管理员',
      role: 'SUPER_ADMIN',
    });
    message.success('登录成功');
    navigate('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
        bordered={false}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏘️</div>
          <Title level={3} style={{ margin: '0 0 8px', color: '#0F172A' }}>社区服务中台</title>
          <Text type="secondary">请登录管理账户</Text>
        </div>
        <Form
          name="login"
          initialValues={{ phone: '13800000001', password: '123456' }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="phone"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="手机号" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              style={{
                height: 44,
                borderRadius: 22,
                background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                border: 'none',
                fontWeight: 600,
              }}
            >
              登录
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              测试账号：13800000001 / 123456
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
}
