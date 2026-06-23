import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, App, Tag, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminLogin } from '../services/api';
import { useAdminStore, AdminUser } from '../store/adminStore';
import { AdminRole, ROLE_LABELS, ROLE_PERMISSIONS } from '../services/permissions';

interface DemoAccount {
  username: string;
  password: string;
  role: AdminRole;
  desc: string;
  color: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { username: 'admin', password: 'admin123', role: 'super', desc: '超级管理员，全部权限', color: 'red' },
  { username: 'platform', password: '123456', role: 'admin', desc: '运营主管，任务配置/用户管理', color: 'orange' },
  { username: 'ops', password: '123456', role: 'operator', desc: '运营人员，任务创建/数据查看', color: 'blue' },
  { username: 'auditor', password: '123456', role: 'auditor', desc: '财务审核，提现审核/风控查看', color: 'gold' },
  { username: 'viewer', password: '123456', role: 'viewer', desc: '数据观察员，只读权限', color: 'default' },
];

const CLIENT_HOST = 'http://localhost:5174';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAdminStore();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [autoLogin, setAutoLogin] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.hash.split('?')[1] || location.search);
    const demo = params.get('demo');
    const role = params.get('role') as AdminRole;

    if (demo) {
      const account = DEMO_ACCOUNTS.find((a) => a.username === demo);
      if (account) {
        form.setFieldsValue({ username: account.username, password: account.password });
        message.info(`已识别【${ROLE_LABELS[account.role]}】账号，正在自动登录...`);
        setAutoLogin(true);
        setTimeout(() => {
          form.submit();
        }, 800);
      } else if (role) {
        const acc = DEMO_ACCOUNTS.find((a) => a.role === role);
        if (acc) {
          form.setFieldsValue({ username: acc.username, password: acc.password });
        }
      }
    }
  }, [location.hash, location.search, form, message]);

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      setLoading(true);
      const result = await adminLogin(values.username, values.password);

      const adminUser: AdminUser = {
        id: result.admin.id,
        username: result.admin.username,
        role: (result.admin.role as AdminRole) || 'admin',
        created_at: result.admin.created_at,
      };

      setAuth(result.token, adminUser);
      message.success(`登录成功，欢迎${ROLE_LABELS[adminUser.role]}`, 1.5);

      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    } catch (e: any) {
      // error handled by interceptor
    } finally {
      setLoading(false);
      setAutoLogin(false);
    }
  };

  const handleQuickLogin = (account: DemoAccount) => {
    form.setFieldsValue({ username: account.username, password: account.password });
    message.info(`已选择【${ROLE_LABELS[account.role]}】，点击登录即可进入`);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>
        <Card
          style={{ width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
          title={
            <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 600 }}>
              🚀 增长中台管理系统
            </div>
          }
          extra={
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => (window.location.href = CLIENT_HOST)}
            >
              返回用户端
            </Button>
          }
        >
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 10 }}>
              <Space size={[4, 0]}>
                <SafetyOutlined style={{ color: '#52c41a' }} />
                演示账号一键登录（权限分离）
              </Space>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DEMO_ACCOUNTS.map((acc) => (
                <Tag
                  key={acc.username}
                  color={acc.color}
                  style={{
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: 16,
                    fontSize: 12,
                    transition: 'all 0.2s',
                  }}
                  onClick={() => handleQuickLogin(acc)}
                >
                  {acc.username} · {ROLE_LABELS[acc.role]}
                </Tag>
              ))}
            </div>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          <Form
            form={form}
            onFinish={onFinish}
            size="large"
            initialValues={{ username: 'admin', password: 'admin123' }}
          >
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined />} placeholder="用户名" autoComplete="username" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                autoComplete="current-password"
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading || autoLogin}>
                {autoLogin ? '自动登录中...' : '登 录'}
              </Button>
            </Form.Item>
          </Form>

          <div
            style={{
              background: '#f5f7fa',
              borderRadius: 8,
              padding: 12,
              marginTop: 8,
              fontSize: 12,
              color: '#8c8c8c',
            }}
          >
            <div style={{ fontWeight: 500, color: '#595959', marginBottom: 6 }}>
              💡 角色权限说明
            </div>
            <div style={{ lineHeight: 1.8 }}>
              {DEMO_ACCOUNTS.map((acc) => (
                <div key={acc.username} style={{ display: 'flex', gap: 8 }}>
                  <Tag color={acc.color} style={{ minWidth: 80, textAlign: 'center' }}>
                    {ROLE_LABELS[acc.role]}
                  </Tag>
                  <span>{acc.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div style={{ textAlign: 'center', marginTop: 16, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
          登录即代表您已阅读并同意《管理后台使用协议》
        </div>
      </div>
    </div>
  );
};

export default Login;
