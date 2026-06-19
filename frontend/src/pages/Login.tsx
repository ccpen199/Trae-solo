import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Select, message, Divider, Alert, Typography, Tag, Spin, Space, Steps } from 'antd';
import { MobileOutlined, SafetyOutlined, LoginOutlined, BankOutlined, UserOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import api from '../api';

interface CommunityOption {
  id: number;
  name: string;
  subdomain: string;
  address: string;
}

const roleConfig: Record<string, { label: string; color: string; redirect: string }> = {
  platform_admin: { label: '平台管理员', color: 'purple', redirect: '/admin' },
  property_admin: { label: '物业管理员', color: 'orange', redirect: '/property' },
  resident: { label: '住户', color: 'blue', redirect: '/' },
};

const DEFAULT_COMMUNITIES: CommunityOption[] = [
  { id: 1, name: '花园小区', subdomain: 'huayuan', address: '北京市朝阳区花园路1号' },
  { id: 2, name: '金山社区', subdomain: 'jinshan', address: '上海市金山区金山大道100号' },
  { id: 3, name: '翠湖花园', subdomain: 'cuihu', address: '杭州市西湖区翠湖路88号' },
];

const demoAccounts = [
  { phone: '10000000000', community_id: '1', role: 'platform_admin', label: '平台管理员', desc: '健康仪表盘/虚假溯源/风控', icon: '🛡️' },
  { phone: '13800000001', community_id: '1', role: 'property_admin', label: '花园小区 物业管理', desc: '门禁/缴费/报修 工作台', icon: '🏢' },
  { phone: '13800000002', community_id: '2', role: 'property_admin', label: '金山社区 物业管理', desc: '门禁/缴费/报修 工作台', icon: '🏢' },
  { phone: '13800000003', community_id: '3', role: 'property_admin', label: '翠湖花园 物业管理', desc: '门禁/缴费/报修 工作台', icon: '🏢' },
  { phone: '13800000004', community_id: '1', role: 'resident', label: '花园小区 住户 赵六', desc: '话题/购物/任务/小金库', icon: '👤' },
  { phone: '13800000005', community_id: '1', role: 'resident', label: '花园小区 住户 钱七', desc: '话题/购物/任务/小金库', icon: '👤' },
  { phone: '13800000006', community_id: '2', role: 'resident', label: '金山社区 住户 孙八', desc: '话题/购物/任务/小金库', icon: '👤' },
  { phone: '13800000007', community_id: '3', role: 'resident', label: '翠湖花园 住户 周九', desc: '话题/购物/任务/小金库', icon: '👤' },
];

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [samlLoading, setSamlLoading] = useState(false);
  const [communities, setCommunities] = useState<CommunityOption[]>(DEFAULT_COMMUNITIES);
  const [commStatus, setCommStatus] = useState<'offline' | 'ok'>('offline');
  const [authStep, setAuthStep] = useState(0);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const resp = await api.get('/auth/communities', { timeout: 3000 });
        if (resp.data?.success && Array.isArray(resp.data.data) && resp.data.data.length > 0) {
          console.log('[Login] 社区列表API成功:', resp.data.data);
          setCommunities(resp.data.data);
          setCommStatus('ok');
        }
      } catch (e) {
        console.warn('[Login] 社区列表API失败，使用内置数据:', e);
      }
    };
    fetchCommunities();
  }, []);

  const communityOptions = communities.map((c) => ({
    value: String(c.id),
    label: `${c.name} · ${c.subdomain}.邻居.中国`,
  }));

  const roleRedirect = (role: string) => roleConfig[role]?.redirect || '/';

  const verifyAndNavigate = async (token: string, user: any, community: CommunityOption) => {
    console.log('[Login] Step 2: 写入 localStorage 并验证 /api/auth/me');
    setAuthStep(2);

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('community', JSON.stringify(community));

    try {
      const meResp = await api.get('/auth/me', { timeout: 5000 });
      if (meResp.data?.success) {
        console.log('[Login] Step 2 ✅ /api/auth/me 验证通过:', meResp.data.data);
        localStorage.setItem('user', JSON.stringify(meResp.data.data));
      } else {
        console.warn('[Login] Step 2 ⚠️ /api/auth/me 返回非success，仍然继续跳转');
      }
    } catch (meErr: any) {
      console.warn('[Login] Step 2 ⚠️ /api/auth/me 验证异常，仍然继续跳转:', meErr?.message || meErr);
    }

    const redirect = roleRedirect(user.role);
    const roleLabel = roleConfig[user.role]?.label || '用户';
    setAuthStep(3);
    console.log(`[Login] Step 3 🚀 跳转: role=${user.role} -> ${redirect}`);

    message.success(`✅ ${community.name} ${roleLabel} ${user.real_name} 登录成功，跳转中...`);
    setTimeout(() => {
      navigate(redirect, { replace: true });
    }, 500);
  };

  const doLogin = async (account: typeof demoAccounts[0] | { phone: string; code: string; community_id: string }) => {
    const phone = account.phone;
    const code = 'code' in account ? account.code : '123456';
    const community_id = account.community_id;

    setLoading(true);
    setAuthStep(1);
    console.log('[Login] Step 1: 调用 /auth/login', { phone, community_id });

    try {
      const resp = await api.post('/auth/login', {
        phone,
        verification_code: code,
        community_id: parseInt(community_id, 10),
      });

      if (resp.data?.success) {
        const { token, user, community } = resp.data.data;
        const commObj: CommunityOption = community || communities.find((c) => String(c.id) === community_id) || DEFAULT_COMMUNITIES[0];
        await verifyAndNavigate(token, user, commObj);
      } else {
        const err = resp.data?.error || '登录失败';
        console.error('[Login] Step 1 ❌ 后端返回失败:', err);
        message.error(`登录失败：${err}`);
        setAuthStep(0);
      }
    } catch (err: any) {
      const serverErr = err?.response?.data?.error;
      const finalMsg = serverErr || err?.message || '网络错误';
      console.error('[Login] Step 1 ❌ 异常:', finalMsg);
      message.error(`登录失败：${finalMsg}`);
      setAuthStep(0);
    } finally {
      setLoading(false);
    }
  };

  const doSamlLogin = async () => {
    const community_id = form.getFieldValue('community_id') || '1';
    setSamlLoading(true);
    setAuthStep(1);
    console.log('[Login] SAML Step 1: 调用 /auth/saml/demo community_id=', community_id);

    try {
      const resp = await api.post('/auth/saml/demo', { community_id: parseInt(community_id, 10) });
      if (resp.data?.success) {
        const { token, user, community } = resp.data.data;
        const commObj: CommunityOption = community || communities.find((c) => String(c.id) === community_id) || DEFAULT_COMMUNITIES[0];
        await verifyAndNavigate(token, user, commObj);
      } else {
        message.error(`SAML SSO 失败：${resp.data?.error || '未知错误'}`);
        setAuthStep(0);
      }
    } catch (err: any) {
      message.error(`SAML SSO 失败：${err?.response?.data?.error || err?.message || '网络错误'}`);
      setAuthStep(0);
    } finally {
      setSamlLoading(false);
    }
  };

  const sendCode = () => {
    const phone = form.getFieldValue('phone');
    if (!phone || !/^1\d{10}$/.test(phone)) { message.warning('请输入正确的11位手机号'); return; }
    setCodeLoading(true);
    message.success('验证码已发送（演示验证码：123456）');
    setTimeout(() => setCodeLoading(false), 1000);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '32px 16px', background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap', maxWidth: 1000, margin: '0 auto' }}>
        <Card style={{ width: 500, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
          title={<div style={{ textAlign: 'center', fontSize: 18 }}><BankOutlined style={{ marginRight: 8 }} />邻里数字基座 · 社区独立子域登录</div>}>

          <Alert type={commStatus === 'ok' ? 'success' : 'warning'} showIcon
            message={commStatus === 'ok' ? `在线模式 · 已加载 ${communities.length} 个社区` : '离线模式 · 使用内置社区（API 连通后自动刷新）'}
            description="选择您所属的社区子域。可选3个社区：花园小区/金山社区/翠湖花园"
            style={{ marginBottom: 16 }} />

          <Steps size="small" current={authStep} style={{ marginBottom: 16 }} items={[
            { title: '调用登录API', icon: loading || samlLoading ? <Spin size="small" /> : authStep >= 1 ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined /> },
            { title: '验证令牌 /api/auth/me', icon: authStep >= 2 ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : authStep === 1 ? <Spin size="small" /> : null },
            { title: '跳转到对应工作台', icon: authStep >= 3 ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : null },
          ]} />

          <Form form={form} onFinish={(v) => doLogin(v)} layout="vertical" size="large"
            initialValues={{ community_id: '1', phone: '13800000004', code: '123456' }}>
            <Form.Item name="community_id" label="所属社区子域" rules={[{ required: true, message: '请选择社区' }]}>
              <Select options={communityOptions} size="large" />
            </Form.Item>
            <Form.Item name="phone" label="手机号" rules={[{ required: true, pattern: /^1\d{10}$/, message: '请输入11位手机号' }]}>
              <Input prefix={<MobileOutlined />} maxLength={11} placeholder="请输入手机号" />
            </Form.Item>
            <Form.Item name="code" label="验证码" rules={[{ required: true, message: '请输入验证码' }]}>
              <Space.Compact style={{ width: '100%' }}>
                <Input prefix={<SafetyOutlined />} maxLength={6} placeholder="演示验证码固定 123456" />
                <Button onClick={sendCode} loading={codeLoading} style={{ width: 130 }}>获取验证码</Button>
              </Space.Compact>
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block icon={<LoginOutlined />} size="large">登录</Button>
          </Form>

          <Divider style={{ margin: '16px 0' }}>物业 SAML 单点登录（对接物业身份系统）</Divider>
          <Button block onClick={doSamlLogin} loading={samlLoading} icon={<SafetyOutlined />} size="large">
            SAML SSO 物业单点登录（直接进入物业工作台）
          </Button>
          <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 12, lineHeight: 1.6 }}>
            物业 SSO 登录后直接进入物业工作台，可验收：门禁开通、物业缴费、报修工单
          </Typography.Text>
        </Card>

        <Card style={{ width: 440, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
          title={<div style={{ fontSize: 16 }}>� 演示账号 · 点击即登录进入工作台</div>} size="small">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {demoAccounts.map((acc) => {
              const rc = roleConfig[acc.role];
              return (
                <Button key={acc.phone} size="large" onClick={() => {
                  form.setFieldsValue({ phone: acc.phone, code: '123456', community_id: acc.community_id });
                  doLogin(acc);
                }} loading={loading} style={{ textAlign: 'left', height: 'auto', padding: '10px 14px', whiteSpace: 'normal' }}>
                  <span style={{ fontSize: 16, marginRight: 6 }}>{acc.icon}</span>
                  <Tag color={rc.color} style={{ marginRight: 6 }}>{rc.label}</Tag>
                  <span style={{ fontWeight: 500 }}>{acc.label}</span>
                  <br />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>手机号 {acc.phone} · 进入：{acc.desc}</Typography.Text>
                </Button>
              );
            })}
          </div>
          <div style={{ marginTop: 12, padding: 10, background: '#f6f6f6', borderRadius: 6, fontSize: 12, color: '#666', lineHeight: 1.8 }}>
            <div>� <strong>验收指引：</strong></div>
            <div>1. 点击 <Tag color="purple">平台管理员</Tag> 进入 <strong>健康仪表盘/虚假溯源/风控</strong></div>
            <div>2. 点击 <Tag color="orange">物业管理员</Tag> 进入 <strong>门禁/缴费/报修 工作台</strong></div>
            <div>3. 点击 <Tag color="blue">住户</Tag> 进入 <strong>话题/购物/任务/小金库</strong> 工作台</div>
            <div>4. 点击右下角 <strong>💡 诊断按钮</strong> 查看当前登录状态</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
