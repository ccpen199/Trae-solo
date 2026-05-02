import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Select } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authApi } from '../api';
import { useAuthContext } from '../App';

interface LoginForm {
  username: string;
  password: string;
  role: string;
}

const roleOptions = [
  { label: '群众', value: 'citizen1' },
  { label: '审核员', value: 'auditor1' },
  { label: '窗口人员', value: 'window1' },
  { label: '管理员', value: 'admin1' },
];

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<LoginForm>();
  const navigate = useNavigate();
  const { login } = useAuthContext();

  const handleRoleChange = (value: string) => {
    form.setFieldsValue({
      username: value,
      password: '123456',
    });
  };

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('username', values.username);
      params.append('password', values.password);

      const response = await authApi.login(values.username, values.password);
      const data = response.data;

      login(data.access_token, data.user);
      message.success('登录成功');

      const role = data.user.role;
      switch (role) {
        case 'CITIZEN':
          navigate('/citizen');
          break;
        case 'AUDITOR':
          navigate('/auditor');
          break;
        case 'WINDOW_STAFF':
          navigate('/window');
          break;
        case 'ADMIN':
          navigate('/admin');
          break;
        default:
          navigate('/');
      }
    } catch (error: any) {
      message.error(error.response?.data?.detail || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        title={
          <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold' }}>
            政务办事预约系统
          </div>
        }
      >
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          initialValues={{
            username: 'citizen1',
            password: '123456',
            role: 'citizen1',
          }}
        >
          <Form.Item name="role">
            <Select
              placeholder="选择角色（快速填充账号）"
              onChange={handleRoleChange}
              options={roleOptions}
            />
          </Form.Item>

          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              style={{ width: '100%' }}
            >
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
            测试账号：
            <br />
            群众: citizen1 / 123456
            <br />
            审核员: auditor1 / 123456
            <br />
            窗口人员: window1 / 123456
            <br />
            管理员: admin1 / 123456
          </div>
        </Form>
      </Card>
    </div>
  );
};
