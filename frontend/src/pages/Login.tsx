import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Select, message, Divider, Modal, Alert, Typography, Tag } from 'antd';
import { MobileOutlined, SafetyOutlined, LoginOutlined, BankOutlined } from '@ant-design/icons';
import api from '../api';

interface CommunityOption {
  id: number;
  name: string;
  subdomain: string;
  address: string;
}

interface UserRole {
  key: string;
  label: string;
  color: string;
  redirect: string;
}

const roleConfig: Record<string, UserRole> = {
  platform_admin: { key: 'platform_admin', label: '平台管理员', color: 'purple', redirect: '/admin' },
  property_admin: { key: 'property_admin', label: '物业管理员', color: 'orange', redirect: '/property' },
  resident: { key: 'resident', label: '住户', color: 'blue', redirect: '/' },
};

const demoAccounts = [
  { phone: '10000000000', role: 'platform_admin', label: '平台管理员' },
  { phone: '13800000001', role: 'property_admin', label: '花园小区物业管理' },
  { phone: '13800000002', role: 'property_admin', label: '金山社区物业管理' },
  { phone: '13800000003', role: 'property_admin', label: '翠湖花园物业管理' },
  { phone: '13800000004', role: 'resident', label: '花园小区住户(赵六)' },
  { phone: '13800000005', role: 'resident', label: '花园小区住户(钱七)' },
  { phone: '13800000006', role: 'resident', label: '金山社区住户(孙八)' },
  { phone: '13800000007', role: 'resident', label: '翠湖花园住户(周九)' },
];

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [communities, setCommunities] = useState<CommunityOption[]>([]);
  const [samlModalVisible, setSamlModalVisible] = useState(false);
  const [samlLoading, setSamlLoading] = useState(false);
  const [samlInfo, setSamlInfo] = useState<any>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const { data } = await api.get('/auth/communities');
        if (data.success) {
          setCommunities(data.data);
        }
      } catch {
        message.error('无法加载社区列表');
      }
    };
    fetchCommunities();
  }, []);

  const communityOptions = communities.map((c) => ({
    value: String(c.id),
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{c.name}</span>
        <Tag color="blue" style={{ marginLeft: 8 }}>{c.subdomain}.邻居.中国</Tag>
      </div>
    ),
    community: c,
  }));

  const sendCode = async () => {
    const phone = form.getFieldValue('phone');
    if (!phone || !/^1\d{10}$/.test(phone)) {
      message.warning('请输入正确的11位手机号');
      return;
    }
    setCodeLoading(true);
    try {
      await api.post('/auth/sms/send', { phone });
      message.success('验证码已发送（演示验证码: 123456）');
    } catch {
      message.success('验证码已发送（演示验证码: 123456）');
    } finally {
      setCodeLoading(false);
    }
  };

  const getRedirectByRole = (role: string): string => {
    return roleConfig[role]?.redirect || '/';
  };

  const handleLoginSuccess = (token: string, user: any, community: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('community', JSON.stringify(community));

    const redirect = getRedirectByRole(user.role);
    const roleLabel = roleConfig[user.role]?.label || '用户';

    message.success(`欢迎回来，${community.name} ${roleLabel} ${user.real_name}！`);
    navigate(redirect);
  };

  const handleLogin = async (values: { phone: string; code: string; community_id: string }) => {
    setLoading(true);
    try {
      const { data: res } = await api.post('/auth/login', {
        phone: values.phone,
        verification_code: values.code,
        community_id: parseInt(values.community_id),
      });

      if (res.success) {
        handleLoginSuccess(res.data.token, res.data.user, res.data.community);
      } else {
        message.error(res.error || '登录失败');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '登录失败，请检查网络连接后重试';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSAMLClick = async () => {
    const communityId = form.getFieldValue('community_id');
    if (!communityId) {
      message.warning('请先选择所属社区，SAML SSO 需要绑定社区物业身份');
      return;
    }

    setSamlLoading(true);
    try {
      const { data: res } = await api.post('/auth/saml/login', {
        community_id: parseInt(communityId),
      });
      if (res.success) {
        setSamlInfo(res.data);
        setSamlModalVisible(true);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'SAML 登录初始化失败';
      message.error(errorMsg);
    } finally {
      setSamlLoading(false);
    }
  };

  const handleSAMLDemo = async (communityId: number) => {
    setSamlLoading(true);
    try {
      const { data: res } = await api.post('/auth/saml/demo', { community_id: communityId });
      if (res.success) {
        setSamlModalVisible(false);
        handleLoginSuccess(res.data.token, res.data.user, res.data.community);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'SAML SSO 登录失败';
      message.error(errorMsg);
    } finally {
      setSamlLoading(false);
    }
  };

  const handleQuickLogin = (account: typeof demoAccounts[0]) => {
    const communityMap: Record<string, number> = {
      '10000000000': 1,
      '13800000001': 1,
      '13800000002': 2,
      '13800000003': 3,
      '13800000004': 1,
      '13800000005': 1,
      '13800000006': 2,
      '13800000007': 3,
    };

    form.setFieldsValue({
      phone: account.phone,
      code: '123456',
      community_id: String(communityMap[account.phone] || 1),
    });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ width: '100%', maxWidth: 900, display: 'flex', gap: 24, padding: '0 24px', alignItems: 'flex-start' }}>
        <Card style={{ width: 460, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }} title={
          <div style={{ textAlign: 'center', fontSize: 18 }}>
            <BankOutlined style={{ marginRight: 8 }} />邻里数字基座 — 社区登录
          </div>
        }>
          <Alert
            message="每个社区拥有独立子域身份入口"
            description="选择您所属的社区子域，使用手机号或物业 SAML SSO 登录。不同角色将进入对应工作台。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form form={form} onFinish={handleLogin} layout="vertical" size="large">
            <Form.Item name="community_id" label="所属社区子域" rules={[{ required: true, message: '请选择您所属的社区' }]}>
              <Select
                options={communityOptions}
                placeholder="请选择社区子域名"
                loading={communities.length === 0}
                notFoundContent={communities.length === 0 ? '加载中...' : '暂无社区'}
                optionLabelProp="label"
              />
            </Form.Item>
            <Form.Item name="phone" label="手机号" rules={[{ required: true, pattern: /^1\d{10}$/, message: '请输入正确的11位手机号' }]}>
              <Input prefix={<MobileOutlined />} placeholder="请输入手机号" maxLength={11} />
            </Form.Item>
            <Form.Item name="code" label="验证码" rules={[{ required: true, message: '请输入验证码' }]}>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input prefix={<SafetyOutlined />} placeholder="请输入验证码" maxLength={6} style={{ flex: 1 }} />
                <Button onClick={sendCode} loading={codeLoading} style={{ width: 130, whiteSpace: 'nowrap' }}>
                  获取验证码
                </Button>
              </div>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block icon={<LoginOutlined />} size="large">
                登录
              </Button>
            </Form.Item>
          </Form>
          <Divider style={{ margin: '12px 0' }}>物业管理人员单点登录</Divider>
          <Button block onClick={handleSAMLClick} loading={samlLoading} icon={<SafetyOutlined />} size="large">
            SAML SSO 物业单点登录
          </Button>
          <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 12 }}>
            物业管理人员可通过 SAML SSO 对接物业系统身份，登录后直接进入物业工作台（门禁/缴费/报修）
          </Typography.Text>
        </Card>

        <Card style={{ width: 380, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', alignSelf: 'center' }} title="演示账号快速登录" size="small">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {demoAccounts.map((account) => (
              <Button
                key={account.phone}
                size="small"
                style={{ textAlign: 'left', height: 'auto', padding: '6px 12px', whiteSpace: 'normal' }}
                onClick={() => handleQuickLogin(account)}
              >
                <Tag color={roleConfig[account.role]?.color} style={{ marginRight: 4 }}>
                  {roleConfig[account.role]?.label}
                </Tag>
                {account.label}
                <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>({account.phone})</Typography.Text>
              </Button>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: '8px', background: '#f6f6f6', borderRadius: 6, fontSize: 12, color: '#888' }}>
            演示验证码统一为 <Typography.Text strong>123456</Typography.Text>
            <br />点击账号自动填入，点击登录即可进入对应工作台
          </div>
        </Card>
      </div>

      <Modal
        title="物业 SAML SSO 单点登录"
        open={samlModalVisible}
        onCancel={() => setSamlModalVisible(false)}
        footer={null}
        width={560}
      >
        {samlInfo && (
          <div>
            <Alert
              message={samlInfo.message}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>目标社区：</Typography.Text>
              <Tag color="blue">{samlInfo.community?.name}</Tag>
              <Tag>{samlInfo.community?.subdomain}.邻居.中国</Tag>
            </div>
            {samlInfo.redirect_url && (
              <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>SAML IdP 认证入口（生产环境跳转地址）：</Typography.Text>
                <br />
                <Typography.Text code style={{ fontSize: 11, wordBreak: 'break-all' }}>{samlInfo.redirect_url}</Typography.Text>
              </div>
            )}
            <Divider>演示模式：模拟 SAML 回调</Divider>
            <Typography.Paragraph type="secondary">
              实际部署时，物业系统 IdP 认证成功后会回调 <Typography.Text code>/api/auth/saml/callback</Typography.Text> 并携带 SAML ID。
              演示模式下点击下方按钮自动以该社区物业管理员身份登录。
            </Typography.Paragraph>
            <Button
              type="primary"
              block
              size="large"
              loading={samlLoading}
              onClick={() => handleSAMLDemo(samlInfo.community?.id)}
              icon={<BankOutlined />}
            >
              模拟物业 SSO 登录 — 进入物业工作台
            </Button>
            <div style={{ marginTop: 12, padding: 8, background: '#fff7e6', borderRadius: 6, fontSize: 12 }}>
              <Typography.Text type="warning">物业 SSO 登录后，将直接进入物业工作台，可管理门禁开通、物业缴费、报修工单等业务。</Typography.Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Login;
