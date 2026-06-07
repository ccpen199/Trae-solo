import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Select, message, Tag, Space, Row, Col, Steps } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, HomeOutlined, ShopOutlined, AuditOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, cityAPI } from '../api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface RegisterProps {
  onRegister: (user: any, token: string) => void;
}

const ROLE_OPTIONS = [
  {
    value: 'user',
    label: '同城居民',
    icon: <HomeOutlined />,
    color: 'blue',
    desc: '浏览同城信息流，发布内容、评论互动、预约看房/面试/相亲',
    extra: '注册后可立即使用全部社区功能',
  },
  {
    value: 'merchant',
    label: '商户入驻',
    icon: <ShopOutlined />,
    color: 'orange',
    desc: '入驻本地商户，创建店铺页面、广告投放、活动报名、数据包',
    extra: '需要提交营业执照等资质，管理员审核通过后开通',
  },
  {
    value: 'reviewer',
    label: '审核人员',
    icon: <AuditOutlined />,
    color: 'purple',
    desc: '内容安全审核工作台，敏感词+图像识别+人工复审',
    extra: '需实名认证，由城市管理员授权后开通审核权限',
  },
];

const LoginPage: React.FC<RegisterProps> = ({ onRegister }) => {
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('user');
  const navigate = useNavigate();

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const res = await cityAPI.getCities();
      setCities(res.data.cities);
    } catch (error) {
      console.error('加载城市失败', error);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const data = { ...values, role: selectedRole };
      const res = await authAPI.register(data);
      const role = res.data.user.role || 'user';
      message.success('注册成功');
      onRegister(res.data.user, res.data.token);
      if (role === 'merchant') {
        navigate('/merchants');
      } else if (role === 'reviewer') {
        navigate('/verify');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const currentRoleConfig = ROLE_OPTIONS.find(r => r.value === selectedRole);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <EnvironmentOutlined style={{ fontSize: 36, color: '#1890ff', marginBottom: 8 }} />
        <Title level={2} style={{ color: '#fff', margin: 0, marginBottom: 4 }}>城事通 · 注册</Title>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
          选择你的身份类型，开启同城生活
        </Text>
      </div>

      <Row gutter={24} style={{ maxWidth: 900, width: '100%' }}>
        <Col xs={24} md={10}>
          <Card
            style={{ borderRadius: 12, background: 'rgba(255,255,255,0.95)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', height: '100%' }}
            styles={{ body: { padding: 24 } }}
          >
            <Title level={5} style={{ marginBottom: 16, textAlign: 'center' }}>
              选择注册身份
            </Title>

            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {ROLE_OPTIONS.map((role) => (
                <div
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    cursor: 'pointer',
                    border: selectedRole === role.value ? `2px solid ${role.color === 'blue' ? '#1890ff' : role.color === 'orange' ? '#fa8c16' : '#722ed1'}` : '2px solid #f0f0f0',
                    background: selectedRole === role.value
                      ? (role.color === 'blue' ? '#e6f7ff' : role.color === 'orange' ? '#fff7e6' : '#f9f0ff')
                      : '#fff',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    {role.icon}
                    <Tag color={role.color} style={{ margin: 0 }}>{role.label}</Tag>
                  </div>
                  <Paragraph style={{ margin: 0, fontSize: 12, color: '#666' }}>
                    {role.desc}
                  </Paragraph>
                  <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                    {role.extra}
                  </Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card
            style={{ borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
            styles={{ body: { padding: 32 } }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Tag color={currentRoleConfig?.color} style={{ fontSize: 14, padding: '4px 16px', marginBottom: 8 }}>
                {currentRoleConfig?.icon} {currentRoleConfig?.label}注册
              </Tag>
              <br />
              <Text type="secondary" style={{ fontSize: 13 }}>{currentRoleConfig?.desc}</Text>
            </div>

            <Form
              name="register"
              onFinish={onFinish}
              size="large"
              layout="vertical"
            >
              <Form.Item name="username" rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' }
              ]}>
                <Input prefix={<UserOutlined />} placeholder="用户名" />
              </Form.Item>

              <Form.Item name="nickname" rules={[{ required: true, message: '请输入昵称' }]}>
                <Input placeholder="昵称" />
              </Form.Item>

              <Form.Item name="password" rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}>
                <Input.Password prefix={<LockOutlined />} placeholder="密码" />
              </Form.Item>

              <Form.Item name="phone" rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}>
                <Input prefix={<PhoneOutlined />} placeholder="手机号（选填）" />
              </Form.Item>

              <Form.Item name="city_id" label="所在城市" rules={[{ required: true, message: '请选择城市' }]}>
                <Select placeholder="选择城市">
                  {cities.map((city) => (
                    <Option key={city.id} value={city.id}>
                      {city.name} · {city.dialect}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {selectedRole === 'merchant' && (
                <>
                  <Form.Item name="company_name" rules={[{ required: true, message: '请输入商户名称' }]}>
                    <Input prefix={<ShopOutlined />} placeholder="商户名称/店铺名" />
                  </Form.Item>
                  <Form.Item name="license_number" rules={[{ required: true, message: '请输入营业执照号' }]}>
                    <Input placeholder="营业执照编号" />
                  </Form.Item>
                </>
              )}

              {selectedRole === 'reviewer' && (
                <>
                  <Form.Item name="real_name" rules={[{ required: true, message: '审核人员需实名注册' }]}>
                    <Input placeholder="真实姓名（审核人员必须）" />
                  </Form.Item>
                  <Form.Item name="id_card" rules={[{ required: true, message: '审核人员需提供身份证号' }]}>
                    <Input placeholder="身份证号码（审核人员必须）" />
                  </Form.Item>
                </>
              )}

              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading} size="large" style={{ height: 44 }}>
                  注册为{currentRoleConfig?.label}
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center' }}>
                <Text>已有账号？</Text>
                <Link to="/login" style={{ marginLeft: 8, color: '#1890ff' }}>返回登录</Link>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LoginPage;
