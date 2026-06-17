import { Form, Input, Button, Typography, Spin, Alert, Divider, Tag, Space } from 'antd';
import { UserOutlined, LockOutlined, DashboardOutlined, ShoppingOutlined, TeamOutlined, CheckCircleFilled, CloseCircleFilled, LoadingOutlined, SafetyCertificateOutlined, GlobalOutlined, EnvironmentOutlined, ApiOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const { Title, Text, Paragraph } = Typography;

type Step = 'idle' | 'loading' | 'ok' | 'fail';

interface AccountDef {
  user: string;
  pwd: string;
  label: string;
  icon: any;
  color: string;
  bg: string;
  desc: string;
  target: string;
  features: string[];
}

const ACCOUNTS: AccountDef[] = [
  {
    user: 'admin', pwd: '123456', label: '平台管理员',
    icon: <DashboardOutlined />, color: '#1677ff', bg: '#e6f4ff',
    target: '/',
    desc: '全局运营管控、品牌资源调度、网络拓扑监控与开放接口管理',
    features: ['运营仪表盘', '品牌质量钻取', '网点吞吐拓扑', 'API开放中心', '异常地址复核']
  },
  {
    user: 'user1', pwd: '123456', label: '普通用户',
    icon: <ShoppingOutlined />, color: '#52c41a', bg: '#f6ffed',
    target: '/orders',
    desc: '包裹生命周期跟踪、智能发件比价、面单扫码与签收验证',
    features: ['运单筛选追踪', '面单扫码/电商同步', '智能比价下单', '人脸核验签收', '异常地址拦截']
  },
  {
    user: 'courier1', pwd: '123456', label: '快递员',
    icon: <TeamOutlined />, color: '#fa8c16', bg: '#fff7e6',
    target: '/couriers',
    desc: '待派单聚合与优先排序、上门协商、电子签收回传与SLA响应',
    features: ['待派单聚合', '上门时间协商', 'Canvas电子签收', '投诉SLA 8h倒计时', '复查异常记录']
  },
];

export default function Login() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>('idle');
  const [msg, setMsg] = useState('');
  const [detail, setDetail] = useState('');
  const [form] = Form.useForm();

  const go = (role: string) => {
    let path = '/';
    if (role === 'courier') path = '/couriers';
    else if (role === 'user') path = '/orders';
    nav(path);
  };

  const doLogin = async (username: string, password: string) => {
    if (!username?.trim() || !password?.trim()) {
      setStep('fail');
      setMsg('请输入用户名和密码');
      setDetail('用户名和密码均为必填项，不能为空。');
      return;
    }

    setStep('loading');
    setMsg('正在验证身份...');
    setDetail('');
    const t0 = Date.now();

    try {
      const res: any = await api.auth.login({ username: username.trim(), password });
      const elapsed = Date.now() - t0;

      if (!res?.token) {
        setStep('fail');
        setMsg('服务器响应异常');
        setDetail(`登录接口返回了数据但缺少 token 字段。响应耗时 ${elapsed}ms，返回字段：${res ? Object.keys(res).join(', ') : '空'}`);
        return;
      }

      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user || {}));

      const role = res.user?.role || '';
      const name = res.user?.name || res.user?.username || username;
      setStep('ok');
      setMsg(`✅ 登录成功！欢迎 ${name}（${role === 'admin' ? '平台管理员' : role === 'courier' ? '快递员' : '普通用户'}）`);
      setDetail(`身份已确认，权限范围已加载，正在进入工作台...`);

      setTimeout(() => go(role), 400);

    } catch (err: any) {
      const elapsed = Date.now() - t0;
      setStep('fail');

      const em = err?.message || String(err);
      const ec = err?.code || '';

      if (ec === 'ERR_NETWORK' || em.includes('Network Error') || em.includes('ECONNREFUSED')) {
        setMsg('后端服务连接失败');
        setDetail(`无法连接到后端 API（http://127.0.0.1:59219）。请确认后端已启动。耗时 ${elapsed}ms`);
      } else if (em.includes('用户名或密码错误') || em.includes('INVALID_CREDENTIALS') || em.includes('401')) {
        setMsg('账号或密码错误');
        setDetail(`用户名 "${username}" 验证未通过。正确账号：admin / user1 / courier1，密码：123456`);
      } else if (em.includes('参数') || em.includes('400')) {
        setMsg('请求参数不完整');
        setDetail(`服务器提示：${em}`);
      } else if (em.includes('500') || em.includes('内部错误')) {
        setMsg('服务器内部错误');
        setDetail(`后端异常：${em}`);
      } else if (ec === 'ECONNABORTED' || em.includes('timeout')) {
        setMsg('请求超时');
        setDetail(`后端 ${elapsed}ms 未响应`);
      } else {
        setMsg('登录失败');
        setDetail(em);
      }
    }
  };

  const statusIcon = step === 'ok' ? <CheckCircleFilled style={{ color: '#52c41a', fontSize: 20 }} /> :
                     step === 'fail' ? <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 20 }} /> :
                     step === 'loading' ? <Spin indicator={<LoadingOutlined style={{ fontSize: 20, color: '#1677ff' }} spin />} /> :
                     null;

  const statusBg = step === 'ok' ? '#f6ffed' : step === 'fail' ? '#fff2f0' : step === 'loading' ? '#e6f4ff' : '#fafafa';
  const statusBorder = step === 'ok' ? '#b7eb8f' : step === 'fail' ? '#ffccc7' : step === 'loading' ? '#91caff' : '#d9d9d9';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 50%, #003eb3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 1160, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        <div style={{ padding: 44, background: 'linear-gradient(160deg, #001529 0%, #003a8c 100%)', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(22,119,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GlobalOutlined style={{ fontSize: 24, color: '#69b1ff' }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>快递全链路协同平台</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Express Open Platform</div>
            </div>
          </div>

          <Title level={3} style={{ color: '#fff', marginBottom: 12 }}>连接 30+ 快递品牌<br />一站式智能物流协同</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
            面向快递全链路协同的开放平台，核心能力覆盖快递员资源池管理、用户包裹生命周期跟踪、智能发件决策。
          </Paragraph>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: <TeamOutlined style={{ fontSize: 18 }} />, t: '快递员资源池', d: '统一认证·服务评级' },
              { icon: <SafetyCertificateOutlined style={{ fontSize: 18 }} />, t: '30+品牌API', d: '申通/中通/顺丰等' },
              { icon: <EnvironmentOutlined style={{ fontSize: 18 }} />, t: '实时地图追踪', d: '位置·倒计时·语音' },
              { icon: <ApiOutlined style={{ fontSize: 18 }} />, t: '开放接口中心', d: '电商/ERP集成调用' },
            ].map((f, i) => (
              <div key={i} style={{ padding: 14, background: 'rgba(255,255,255,0.07)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ color: '#69b1ff', marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{f.t}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{f.d}</div>
              </div>
            ))}
          </div>

          <Divider style={{ borderColor: 'rgba(255,255,255,0.12)', margin: '24px 0 16px' }} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.8 }}>
            <div>✅ 统一身份认证 · 三角色权限分流</div>
            <div>✅ 快递员轻量化工作台 · 电子签收回传</div>
            <div>✅ 错收误收防护 · 人脸二次确认</div>
            <div>✅ API开放中心 · 电商/ERP运单创建与轨迹查询</div>
          </div>
        </div>

        <div style={{ padding: 44, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Title level={3} style={{ marginBottom: 4 }}>账号登录</Title>
          <Text type="secondary" style={{ marginBottom: 20, display: 'block' }}>输入账号密码或点击下方演示账号快速进入</Text>

          {step !== 'idle' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14, marginBottom: 16, borderRadius: 10, border: `1px solid ${statusBorder}`, background: statusBg }}>
              {statusIcon}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: step === 'ok' ? '#389e0d' : step === 'fail' ? '#cf1322' : '#1677ff' }}>{msg}</div>
                {detail && <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4, lineHeight: 1.6 }}>{detail}</div>}
              </div>
            </div>
          )}

          <Form form={form} layout="vertical" onFinish={(v) => doLogin(v.username, v.password)} size="large" disabled={step === 'loading'}>
            <Form.Item name="username" label="用户名" rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, message: '用户名至少2个字符' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名仅支持字母、数字和下划线' }
            ]}>
              <Input prefix={<UserOutlined />} placeholder="admin / user1 / courier1" autoComplete="username" />
            </Form.Item>
            <Form.Item name="password" label="密码" rules={[
              { required: true, message: '请输入密码' },
              { min: 4, message: '密码至少4个字符' }
            ]}>
              <Input.Password prefix={<LockOutlined />} placeholder="默认密码 123456" autoComplete="current-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={step === 'loading'} style={{ height: 46, fontSize: 15, fontWeight: 600 }}>
              {step === 'loading' ? '正在验证身份...' : '登录系统'}
            </Button>
          </Form>

          <Divider style={{ margin: '24px 0 16px', color: '#bfbfbf', fontSize: 12 }}>三角色演示账号 · 点击即登录</Divider>

          {ACCOUNTS.map((a, i) => (
            <div
              key={i}
              onClick={() => { if (step !== 'loading') doLogin(a.user, a.pwd); }}
              style={{
                cursor: step === 'loading' ? 'not-allowed' : 'pointer',
                padding: 14, marginBottom: i < 2 ? 10 : 0,
                borderRadius: 10, border: `1px solid ${step === 'loading' ? '#f0f0f0' : '#e5eaf1'}`,
                opacity: step === 'loading' ? 0.5 : 1,
                transition: 'all 0.2s', userSelect: 'none',
                background: '#fafafa'
              }}
              onMouseEnter={e => { if (step !== 'loading') e.currentTarget.style.background = a.bg; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fafafa'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: a.color, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0
                }}>{a.icon}</div>
                <div style={{ flex: 1 }}>
                  <Space size={6}>
                    <Text strong style={{ fontSize: 14 }}>{a.label}</Text>
                    <Tag color={a.color} style={{ margin: 0 }}>{a.user} / 123456</Tag>
                  </Space>
                </div>
                <span style={{ color: a.color, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  登录进入 →
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 6, paddingLeft: 48 }}>{a.desc}</div>
              <div style={{ paddingLeft: 48, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {a.features.map((f, fi) => (
                  <Tag key={fi} style={{ margin: 0, fontSize: 11, background: a.bg, color: a.color, border: 'none' }}>{f}</Tag>
                ))}
              </div>
            </div>
          ))}

          {step === 'fail' && (
            <Alert
              type="error"
              showIcon
              message="登录验证未通过"
              description={
                <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                  <div><b>可能原因：</b></div>
                  <div>1. 用户名或密码输入有误（正确账号见上方演示卡片）</div>
                  <div>2. 后端服务未启动（需确认 http://127.0.0.1:59219 可访问）</div>
                  <div>3. 账号权限与角色不匹配</div>
                  <div style={{ marginTop: 6 }}><b>技术详情：</b>{detail}</div>
                </div>
              }
              style={{ marginTop: 16 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
