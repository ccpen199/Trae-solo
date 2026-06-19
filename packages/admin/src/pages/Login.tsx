import { useState } from 'react';
import { Form, Input, Button, Card, Typography, App, Divider, Tag } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore, USER_ROLES, RoleConfig } from '@/store/user';

const { Title, Text } = Typography;

export default function Login() {
  const navigate = useNavigate();
  const { setToken, setUser, getUserByRole } = useUserStore();
  const { message } = App.useApp();
  const [selectedRole, setSelectedRole] = useState<string>('SUPER_ADMIN');

  const doLogin = (role: string) => {
    const user = getUserByRole(role);
    if (!user) return;
    setToken(`${role}-token`);
    setUser(user);
    message.success(`已以【${USER_ROLES[role].name}】身份登录`);
    navigate('/dashboard');
  };

  const onFinish = (values: { phone: string; password: string }) => {
    const roleEntry = Object.entries(USER_ROLES).find(([_, v]) => v.phone === values.phone);
    const role = roleEntry ? roleEntry[0] : selectedRole;
    doLogin(role);
  };

  const roleCards = (Object.keys(USER_ROLES) as Array<keyof typeof USER_ROLES>).map((r) => ({
    key: r,
    ...(USER_ROLES[r] as RoleConfig),
  }));

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
          maxWidth: 920,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
        bordered={false}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 28 }}>
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏘️</div>
              <Title level={3} style={{ margin: '0 0 8px', color: '#0F172A' }}>社区服务中台</Title>
              <Text type="secondary">面向物业方 · 业委会 · 居民 · 服务商的全角色管理系统</Text>
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
                  账号密码登录
                </Button>
              </Form.Item>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  统一密码：123456 · 不同手机号对应不同角色权限
                </Text>
              </div>
            </Form>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <SafetyOutlined style={{ color: '#10B981' }} />
              <span style={{ fontWeight: 600, color: '#0F172A' }}>选择角色一键进入（演示用）</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {roleCards.map(({ key, name, color, desc, phone, permissions }) => {
                const active = selectedRole === key;
                return (
                  <div
                    key={key}
                    onMouseEnter={() => setSelectedRole(key)}
                    onClick={() => doLogin(key)}
                    style={{
                      position: 'relative',
                      padding: 14,
                      borderRadius: 12,
                      border: `2px solid ${active ? color : '#E2E8F0'}`,
                      background: active ? `${color}10` : '#F8FAFC',
                      cursor: 'pointer',
                      transition: 'all .2s',
                    }}
                  >
                    {active && (
                      <div style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 18, height: 18, borderRadius: 9,
                        background: color, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12,
                      }}>
                        <CheckOutlined />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 16,
                        background: color, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700,
                      }}>
                        {name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>{name}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{phone}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, marginBottom: 6, minHeight: 32 }}>
                      {desc}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {permissions.map((p) => (
                        <Tag key={p} color="geekblue" style={{ fontSize: 10, margin: 0, padding: '0 4px' }}>
                          {p}
                        </Tag>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <Divider style={{ margin: '14px 0' }} />
            <div style={{
              padding: 12,
              background: '#F0FDF4',
              borderRadius: 8,
              border: '1px solid #BBF7D0',
              fontSize: 12,
              color: '#166534',
              lineHeight: 1.6,
            }}>
              <b>🔑 角色权限提示：</b><br />
              切换角色后会看到不同菜单、数据范围和可用操作。居民只能看自己的房产和工单；物业管理员可看整小区；超级管理员可跨小区全权管理。
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
