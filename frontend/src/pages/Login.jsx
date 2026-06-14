import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Tabs, Alert, message, Space } from 'antd';
import { UserOutlined, LockOutlined, ScanOutlined } from '@ant-design/icons';
import useAuth from '../hooks/useAuth';

const roleTabs = [
  { key: 'personal', label: '个人用户' },
  { key: 'enterprise', label: '企业HR' },
  { key: 'staff', label: '基层经办' },
];

const testAccounts = {
  personal: { username: 'zhangsan', password: '123456' },
  enterprise: { username: 'lisi', password: '123456' },
  staff: { username: 'wangwu', password: '123456' },
};

const Login = () => {
  const [activeRole, setActiveRole] = useState('personal');
  const [form] = Form.useForm();
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [faceLoginLoading, setFaceLoginLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (values) => {
    try {
      const loginData = {
        ...values,
        role: activeRole,
      };
      await login(loginData.username, loginData.password);
      message.success('登录成功');
      navigate(from, { replace: true });
    } catch (error) {
      message.error(error.message || '登录失败，请检查用户名和密码');
    }
  };

  const handleRoleChange = (key) => {
    setActiveRole(key);
    form.setFieldsValue(testAccounts[key]);
  };

  const handleFaceLogin = () => {
    setFaceLoginLoading(true);
    setTimeout(() => {
      setFaceLoginLoading(false);
      message.info('人脸识别功能开发中，敬请期待');
    }, 2000);
  };

  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#1a1a1a' }}>
        欢迎登录
      </h2>
      <p style={{ color: '#999', marginBottom: 32, fontSize: 14 }}>
        请选择登录方式并输入您的账号信息
      </p>

      <Alert
        message="测试账号"
        description={
          <div>
            <div>个人用户：zhangsan / 123456</div>
            <div>企业HR：lisi / 123456</div>
            <div>基层经办：wangwu / 123456</div>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Tabs
        activeKey={activeRole}
        onChange={handleRoleChange}
        items={roleTabs}
        centered
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        name="login"
        initialValues={testAccounts.personal}
        onFinish={handleSubmit}
        size="large"
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input
            prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="请输入用户名"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="请输入密码"
          />
        </Form.Item>

        <Form.Item>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>记住我</Checkbox>
            </Form.Item>
            <a href="#forgot" style={{ color: '#1E6FDB' }}>
              忘记密码？
            </a>
          </div>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            style={{
              height: 44,
              fontSize: 16,
              background: '#1E6FDB',
              borderRadius: 8,
            }}
          >
            登录
          </Button>
        </Form.Item>

        <Form.Item>
          <Button
            icon={<ScanOutlined />}
            loading={faceLoginLoading}
            block
            style={{ height: 44, borderRadius: 8 }}
            onClick={handleFaceLogin}
          >
            人脸识别登录
          </Button>
        </Form.Item>
      </Form>

      <div style={{ marginTop: 24, textAlign: 'center', color: '#999', fontSize: 13 }}>
        <Space size={16}>
          <a href="#register" style={{ color: '#1E6FDB' }}>立即注册</a>
          <span>|</span>
          <a href="#help" style={{ color: '#1E6FDB' }}>帮助中心</a>
        </Space>
      </div>
    </div>
  );
};

export default Login;
