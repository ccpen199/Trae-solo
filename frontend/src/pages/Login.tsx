import { useState } from 'react';
import { Form, Input, Button, Card, message, Collapse, Tag, Space } from 'antd';
import { UserOutlined, LockOutlined, DownOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

const testAccounts = [
  {
    role: '管理员',
    color: 'red',
    features: ['风控中心', '数据看板', '企业审核', '职位审核'],
    accounts: [{ phone: '13700000001', password: 'admin123' }],
  },
  {
    role: '求职者',
    color: 'blue',
    features: ['能力图谱', '技能匹配', '面试管理', 'AI初筛报告'],
    accounts: Array.from({ length: 7 }, (_, i) => ({
      phone: `1390000100${i + 1}`,
      password: 'test123',
    })),
  },
  {
    role: '企业HR',
    color: 'green',
    features: ['招聘效能', '职位发布', '简历筛选', '面试邀约'],
    accounts: Array.from({ length: 9 }, (_, i) => ({
      phone: `1390000200${i + 1}`,
      password: 'test123',
    })),
  },
];

const roleRedirectMap: Record<string, string> = {
  jobseeker: '/jobseeker/profile',
  hr: '/hr/dashboard',
  admin: '/admin/dashboard',
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const user = await login(values.phone, values.password);
      message.success('登录成功');
      const redirect = roleRedirectMap[user.role] || '/';
      navigate(redirect);
    } catch (error: any) {
      message.error(error.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (phone: string, password: string) => {
    setLoading(true);
    try {
      const user = await login(phone, password);
      message.success('登录成功');
      const redirect = roleRedirectMap[user.role] || '/';
      navigate(redirect);
    } catch (error: any) {
      message.error(error.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFillAndLogin = async (phone: string, password: string) => {
    form.setFieldsValue({ phone, password });
    try {
      await form.validateFields();
      await handleQuickLogin(phone, password);
    } catch {
      message.warning('请检查表单信息');
    }
  };

  const handleFillForm = (phone: string, password: string) => {
    form.setFieldsValue({ phone, password });
    message.info('已填充账号信息，请点击登录');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card style={{ width: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ color: '#1890ff', marginBottom: 8 }}>智聘平台</h1>
          <p style={{ color: '#666' }}>泛蓝领与白领融合招聘服务平台</p>
        </div>
        <Form form={form} onFinish={handleSubmit} size="large">
          <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input prefix={<UserOutlined />} placeholder="手机号" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', color: '#666' }}>
          还没有账号？<Link to="/register">立即注册</Link>
        </div>
        <Collapse
          ghost
          size="small"
          style={{ marginTop: 8 }}
          items={[
            {
              key: 'test',
              label: (
                <span style={{ fontSize: 12, color: '#999' }}>
                  <DownOutlined style={{ marginRight: 4 }} />
                  测试账号
                </span>
              ),
              children: (
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {testAccounts.map((group) => (
                    <div key={group.role} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
                      <Space size={8} style={{ marginBottom: 8 }}>
                        <Tag color={group.color}>{group.role}</Tag>
                        <Space size={[4, 4]} wrap>
                          {group.features.map((f, idx) => (
                            <Tag key={idx} color="default" style={{ fontSize: 11, margin: 0 }}>{f}</Tag>
                          ))}
                        </Space>
                      </Space>
                      <div style={{ fontSize: 12, color: '#888', lineHeight: '22px' }}>
                        {group.accounts.map((acc, accIdx) => (
                          <div 
                            key={acc.phone} 
                            style={{ 
                              marginBottom: 4, 
                              display: 'flex', 
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '4px 8px',
                              borderRadius: 4,
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f5f5f5';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            onClick={() => handleFillForm(acc.phone, acc.password)}
                          >
                            <span style={{ flex: 1 }}>
                              {acc.phone} / {acc.password}
                            </span>
                            <Space size={4}>
                              <Button
                                type="link"
                                size="small"
                                icon={<ThunderboltOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFillAndLogin(acc.phone, acc.password);
                                }}
                                loading={loading}
                                style={{ padding: '0 4px', fontSize: 11 }}
                              >
                                一键登录
                              </Button>
                            </Space>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ),
            },
          ]}
        />
        <div style={{ marginTop: 8, textAlign: 'center', fontSize: 11, color: '#aaa' }}>
          点击账号可自动填充，点击"一键登录"可直接登录
        </div>
      </Card>
    </div>
  );
}
