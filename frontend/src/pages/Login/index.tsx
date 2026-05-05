import React, { useState } from 'react';
import { Form, Input, Button, Card, Space, Divider, Modal } from 'antd';
import { message } from '@/utils/message';
import { UserOutlined, LockOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { authApi, userApi, roleApi, moduleApi } from '@/services/api';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const { setToken, setUser } = useUserStore();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res: any = await authApi.login(values);
      setToken(res.accessToken);
      setUser(res.user);
      message.success('登录成功');
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInitSystem = async () => {
    Modal.confirm({
      title: '确认初始化',
      content: '此操作将创建默认模块、角色和管理员账号。是否继续？',
      onOk: async () => {
        setInitLoading(true);
        try {
          const modules = await moduleApi.initDefaults();
          message.success('模块创建成功');

          const roles = await roleApi.initDefaults();
          message.success('角色创建成功');

          const admin = await userApi.initAdmin();
          message.success('管理员创建成功');

          message.success('系统初始化完成！请使用 admin / admin123 登录');
        } catch (error: any) {
          message.error(error.message || '初始化失败');
        } finally {
          setInitLoading(false);
        }
      },
    });
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-title">
          <h1>系统管理平台</h1>
          <p>请输入您的账号密码登录</p>
        </div>
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          size="large"
          initialValues={{ username: 'admin', password: 'admin123' }}
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
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
        <Divider />
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button
              type="link"
              icon={<ReloadOutlined />}
              loading={initLoading}
              onClick={handleInitSystem}
            >
              初始化系统数据
            </Button>
          </Space>
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(0, 0, 0, 0.45)', marginTop: 16 }}>
          <p>端口说明：前端 22611，后端 22610</p>
          <p>默认账号：admin / admin123</p>
          <p style={{ color: '#faad14' }}>首次使用请先点击"初始化系统数据"</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
