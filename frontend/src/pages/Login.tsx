import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Select } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';

const { Option } = Select;

interface LoginForm {
  username: string;
  password: string;
  role: UserRole;
}

const quickAccounts = [
  { username: 'admin', password: 'admin123', role: UserRole.ADMIN, label: '管理员' },
  { username: 'publisher', password: 'publisher123', role: UserRole.PUBLISHER, label: '发布方' },
  { username: 'worker', password: 'worker123', role: UserRole.WORKER, label: '接单员' },
  { username: 'expert', password: 'expert123', role: UserRole.EXPERT, label: '专家' },
];

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form] = Form.useForm<LoginForm>();

  const handleQuickLogin = (account: typeof quickAccounts[0]) => {
    form.setFieldsValue({
      username: account.username,
      password: account.password,
      role: account.role,
    });
  };

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      const response = await api.post(
        `/auth/login?username=${encodeURIComponent(values.username)}&password=${encodeURIComponent(values.password)}`
      );
      
      const { access_token, user } = response.data;
      setAuth(access_token, user);
      message.success('登录成功');
      navigate('/');
    } catch (error: any) {
      message.error(error.response?.data?.detail || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card 
        title={<h2 style={{ margin: 0, textAlign: 'center' }}>众包任务平台</h2>}
        style={{ width: 420, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
      >
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>快速登录（测试账户）：</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {quickAccounts.map((account) => (
              <Button
                key={account.username}
                size="small"
                onClick={() => handleQuickLogin(account)}
              >
                {account.label}
              </Button>
            ))}
          </div>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item
            name="role"
            initialValue={UserRole.WORKER}
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="选择角色">
              <Option value={UserRole.PUBLISHER}>发布方</Option>
              <Option value={UserRole.WORKER}>接单员</Option>
              <Option value={UserRole.EXPERT}>专家</Option>
              <Option value={UserRole.ADMIN}>管理员</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
          默认测试账户：admin/admin123, publisher/publisher123, worker/worker123, expert/expert123
        </div>
      </Card>
    </div>
  );
};

export default Login;
