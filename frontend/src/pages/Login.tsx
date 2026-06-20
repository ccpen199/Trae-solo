import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Tabs, Select, Row, Col, Divider, Tag, message } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, MailOutlined, ApartmentOutlined, ShopOutlined, UserSwitchOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/request';

const { Title, Paragraph } = Typography;
const { Option } = Select;

interface Props {
  onLogin: (data: any) => void;
}

const roleQuickEntries = [
  {
    key: 'agent',
    icon: <UserSwitchOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
    title: '经纪人工作台',
    desc: '客户跟进 · 带看日志 · 业绩看板',
    color: '#1890ff',
    bgColor: '#e6f7ff',
    testAccount: 'agent001 / agent123',
  },
  {
    key: 'developer',
    icon: <ApartmentOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
    title: '开发商营销看板',
    desc: '渠道转化 · 客户热力 · 去化分析',
    color: '#722ed1',
    bgColor: '#f9f0ff',
    testAccount: 'dev001 / dev123',
  },
  {
    key: 'owner',
    icon: <HomeOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
    title: '业主委托管理',
    desc: '看房反馈 · 置换匹配 · 交易追踪',
    color: '#52c41a',
    bgColor: '#f6ffed',
    testAccount: 'user001 / user123',
  },
];

export default function Login({ onLogin }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [quickRole, setQuickRole] = useState<string | null>(null);

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      const res: any = await api.post('/auth/login', values);
      message.success('登录成功');
      onLogin(res);
      
      const user = res.user;
      if (user.role === 'agent') {
        navigate('/agent/dashboard');
      } else if (user.role === 'developer') {
        navigate('/developer/dashboard');
      } else if (user.role === 'admin') {
        navigate('/user');
      } else {
        navigate('/');
      }
    } catch (e: any) {
      message.error(e.message || '登录失败');
    }
    setLoading(false);
  };

  const handleQuickLogin = async (role: string) => {
    setQuickRole(role);
    let username = '';
    let password = '';
    
    if (role === 'agent') {
      username = 'agent001';
      password = 'agent123';
    } else if (role === 'developer') {
      username = 'dev001';
      password = 'dev123';
    } else if (role === 'owner') {
      username = 'user001';
      password = 'user123';
    }
    
    try {
      const res: any = await api.post('/auth/login', { username, password });
      message.success(`已登录${role === 'agent' ? '经纪人' : role === 'developer' ? '开发商' : '业主'}工作台`);
      onLogin(res);
      
      const user = res.user;
      if (user.role === 'agent') {
        navigate('/agent/dashboard');
      } else if (user.role === 'developer') {
        navigate('/developer/dashboard');
      } else {
        navigate('/user');
      }
    } catch (e: any) {
      message.error(e.message || '快捷登录失败');
    } finally {
      setQuickRole(null);
    }
  };

  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      await api.post('/auth/register', values);
      message.success('注册成功，请登录');
      navigate('/login');
    } catch (e: any) {
      message.error(e.message || '注册失败');
    }
    setLoading(false);
  };

  const loginItems = [
    {
      key: 'login',
      label: '账号登录',
      children: (
        <Form
          name="login"
          onFinish={handleLogin}
          size="large"
        >
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', color: '#999', fontSize: 13 }}>
            测试账号：admin/admin123、user001/user123
          </div>
        </Form>
      ),
    },
    {
      key: 'register',
      label: '注册账号',
      children: (
        <Form
          name="register"
          onFinish={handleRegister}
          size="large"
        >
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item name="realName" rules={[{ required: true, message: '请输入真实姓名' }]}>
            <Input placeholder="真实姓名" />
          </Form.Item>
          <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input prefix={<PhoneOutlined />} placeholder="手机号" />
          </Form.Item>
          <Form.Item name="email">
            <Input prefix={<MailOutlined />} placeholder="邮箱（选填）" />
          </Form.Item>
          <Form.Item name="role" label="注册身份">
            <Select defaultValue="user">
              <Option value="user">普通用户/业主</Option>
              <Option value="agent">经纪人</Option>
              <Option value="developer">开发商</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              注册
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: 1000, width: '100%' }}>
        <Row gutter={[32, 32]} align="middle">
          <Col xs={24} lg={12}>
            <div style={{ color: '#fff', marginBottom: 32 }}>
              <Title level={1} style={{ color: '#fff', fontSize: 42, marginBottom: 16 }}>
                🏠 房产交易协同平台
              </Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, lineHeight: 1.8 }}>
                区域性全链条房产交易平台，覆盖新房、二手房、租赁、商业物业四大场景。
                真房源治理体系 + 智能推荐引擎 + 交易中台，让房产交易更安心、更高效。
              </Paragraph>
              <Row gutter={[12, 12]} style={{ marginTop: 24 }}>
                <Col span={12}>
                  <Tag color="success" style={{ fontSize: 13, padding: '4px 12px' }}>✅ 真房源四重治理</Tag>
                </Col>
                <Col span={12}>
                  <Tag color="blue" style={{ fontSize: 13, padding: '4px 12px' }}>✅ 智能推荐引擎</Tag>
                </Col>
                <Col span={12}>
                  <Tag color="purple" style={{ fontSize: 13, padding: '4px 12px' }}>✅ 交易全流程监管</Tag>
                </Col>
                <Col span={12}>
                  <Tag color="orange" style={{ fontSize: 13, padding: '4px 12px' }}>✅ 住建平台备案</Tag>
                </Col>
              </Row>
            </div>

            <Card style={{ borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <Title level={4} style={{ margin: 0 }}>角色快捷登录</Title>
                <div style={{ color: '#999', fontSize: 13, marginTop: 4 }}>选择您的身份，一键进入专属工作台</div>
              </div>
              <Row gutter={[12, 12]}>
                {roleQuickEntries.map((entry) => (
                  <Col span={8} key={entry.key}>
                    <div
                      style={{
                        padding: '20px 12px',
                        borderRadius: 8,
                        background: entry.bgColor,
                        border: `2px solid ${entry.color}20`,
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        textAlign: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = `0 4px 16px ${entry.color}30`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      onClick={() => handleQuickLogin(entry.key)}
                    >
                      <div>{entry.icon}</div>
                      <div style={{ fontWeight: 600, marginTop: 8, color: entry.color, fontSize: 14 }}>
                        {entry.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#666', marginTop: 4, lineHeight: 1.4 }}>
                        {entry.desc}
                      </div>
                      <div style={{ fontSize: 10, color: '#999', marginTop: 8 }}>
                        {entry.testAccount}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card style={{ borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ color: '#1890ff', marginBottom: 8 }}>欢迎登录</Title>
                <div style={{ color: '#999' }}>真房源 · 智推荐 · 安心交易</div>
              </div>
              <Tabs items={loginItems} centered />
              <Divider style={{ margin: '20px 0' }}>
                <span style={{ color: '#999', fontSize: 12 }}>业务入口说明</span>
              </Divider>
              <Row gutter={[12, 12]} style={{ fontSize: 12, color: '#666' }}>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <UserSwitchOutlined style={{ color: '#1890ff' }} />
                    <span><b>经纪人</b>：客户跟进、带看管理</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ApartmentOutlined style={{ color: '#722ed1' }} />
                    <span><b>开发商</b>：营销看板、渠道分析</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <HomeOutlined style={{ color: '#52c41a' }} />
                    <span><b>业主</b>：委托管理、交易追踪</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShopOutlined style={{ color: '#faad14' }} />
                    <span><b>管理员</b>：平台治理、监管备案</span>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
