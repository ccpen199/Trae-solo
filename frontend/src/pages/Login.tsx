import { Form, Input, Button, Card, Typography, Tabs, Spin, Alert } from 'antd';
import { UserOutlined, LockOutlined, TruckOutlined, GlobalOutlined, CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useState, useEffect } from 'react';

const { Title, Text, Paragraph } = Typography;

type LoginStep = 'idle' | 'requesting' | 'success' | 'error';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<LoginStep>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t) {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        const name = u.name || u.username || '用户';
        setStep('success');
        setStatusMsg(`检测到已登录，正在跳转，欢迎 ${name}...`);
        const role = u.role || '';
        setTimeout(() => redirectByRole(role), 600);
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const redirectByRole = (role: string) => {
    try {
      let target = '/';
      if (role === 'courier') target = '/couriers';
      else if (role === 'user') target = '/orders';
      else target = '/';
      setStatusMsg(`跳转至 ${target} ...`);
      setDebugInfo(prev => prev + `\n[跳转] window.location = '${target}'`);
      window.location.href = target;
    } catch (err: any) {
      setDebugInfo(prev => prev + `\n[跳转异常] ${err.message}\n强制跳转根路径`);
      window.location.href = '/';
    }
  };

  const accounts = [
    { user: 'admin', pwd: '123456', role: '平台管理员', desc: '运营仪表盘、品牌资源池、网点拓扑、API开放中心', target: '/' },
    { user: 'user1', pwd: '123456', role: '普通用户', desc: '下单发件、比价引擎、包裹跟踪、签收验证、投诉', target: '/orders' },
    { user: 'courier1', pwd: '123456', role: '快递员', desc: '待派单聚合、上门协商、电子签收、SLA监控', target: '/couriers' },
  ];

  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', msg: string) => {
    try {
      if (type === 'error') alert('❌ ' + msg);
      else if (type === 'success') console.log('✅', msg);
    } catch (e) { /* ignore */ }
  };

  const doLogin = async (username: string, password: string) => {
    if (!username || !password) {
      setStep('error');
      setErrMsg('请输入用户名和密码');
      showAlert('error', '请输入用户名和密码');
      return;
    }

    setLoading(true);
    setStep('requesting');
    setStatusMsg('正在连接后端服务（POST /api/auth/login）...');
    setErrMsg('');
    setDebugInfo(`[开始] 用户名: ${username}`);
    const start = Date.now();

    try {
      const res = await axios.post('/api/auth/login', {
        username: username.trim(),
        password: password
      }, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });

      const data = res.data;
      const elapsed = Date.now() - start;
      setDebugInfo(prev => prev + `\n[HTTP ${res.status}] 耗时: ${elapsed}ms\n[响应体] keys: ${Object.keys(data).join(', ')}`);

      if (!data || !data.token) {
        throw new Error('响应异常：缺少 token 字段，请检查后端接口');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user || {}));
      setDebugInfo(prev => prev + `\n[存储] token 长度: ${data.token.length}\n[用户] ${data.user?.username || ''} role=${data.user?.role || ''}`);

      const role = data.user?.role || '';
      const name = data.user?.name || data.user?.username || username;
      setStep('success');
      setStatusMsg(`登录成功！欢迎 ${name}，正在跳转...`);
      setDebugInfo(prev => prev + `\n[角色] ${role} → 分流跳转`);
      showAlert('success', `登录成功：${name}`);

      setTimeout(() => redirectByRole(role), 500);

    } catch (e: any) {
      const elapsed = Date.now() - start;
      console.error('[Login] error:', e);
      setLoading(false);
      setStep('error');

      let tip = '';
      const code = e?.response?.status;
      const serverMsg = e?.response?.data?.message || '';

      if (e.code === 'ERR_NETWORK' || e.message?.includes('ECONNREFUSED') || e.message?.includes('Network Error')) {
        tip = '后端服务未启动！请联系技术人员启动 http://127.0.0.1:59219';
      } else if (code === 401 || serverMsg === '用户名或密码错误') {
        tip = `账号或密码错误（HTTP 401）\n正确账号：admin / user1 / courier1，密码：123456`;
      } else if (code === 400) {
        tip = `请求参数不完整（HTTP 400）：${serverMsg || '请检查输入'}`;
      } else if (code === 500) {
        tip = `服务器内部错误（HTTP 500）：${serverMsg || '后端异常，请检查日志'}`;
      } else if (e.code === 'ECONNABORTED') {
        tip = '请求超时（10秒未响应）：后端服务可能卡住';
      } else {
        tip = `${e.message || '未知错误'}（HTTP ${code || 'N/A'}）`;
      }

      setErrMsg(tip);
      setDebugInfo(prev => prev + `\n[错误] 耗时: ${elapsed}ms\n  code: ${e.code || 'N/A'}\n  HTTP: ${code || 'N/A'}\n  message: ${e.message || 'N/A'}\n  server: ${serverMsg || 'N/A'}`);
      showAlert('error', tip);

    } finally {
      setLoading(false);
    }
  };

  const onFinish = (v: any) => doLogin(v.username, v.password);
  const quickLogin = (a: typeof accounts[0]) => {
    if (loading) return;
    doLogin(a.user, a.pwd);
  };

  const statusColor =
    step === 'success' ? '#52c41a' :
    step === 'error' ? '#ff4d4f' :
    step === 'requesting' ? '#1677ff' : '#bfbfbf';

  const StatusIcon =
    step === 'success' ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} /> :
    step === 'error' ? <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} /> :
    step === 'requesting' ? <Spin indicator={<LoadingOutlined style={{ color: '#1677ff' }} spin />} /> :
    null;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 50%, #003eb3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 1120, display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 32, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        {/* 左侧品牌介绍 */}
        <div style={{ padding: 48, background: 'linear-gradient(160deg, #001529 0%, #003a8c 100%)', color: '#fff', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(22,119,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GlobalOutlined style={{ fontSize: 28, color: '#69b1ff' }} />
            </div>
            <div>
              <Title level={3} style={{ color: '#fff', margin: 0 }}>快递全链路协同平台</Title>
              <Text style={{ color: 'rgba(255,255,255,0.65)' }}>Express Open Platform · 开放协同 · 智能调度</Text>
            </div>
          </div>

          <Title level={2} style={{ color: '#fff', marginBottom: 16 }}>连接 30+ 快递品牌<br/>一站式智能物流服务</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 1.8 }}>
            面向快递全链路协同的开放平台，覆盖快递员资源池、包裹生命周期跟踪、智能比价决策。
            提供快递员轻量化工作台、用户包裹地图可视化、后台网络拓扑与服务质量仪表盘、API开放中心。
          </Paragraph>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 32 }}>
            {[
              { icon: <TruckOutlined />, t: '快递员资源池', d: '统一认证·服务评级' },
              { icon: <GlobalOutlined />, t: '30+品牌API', d: '申通/中通/顺丰等' },
              { icon: '📍', t: '实时地图追踪', d: '位置·倒计时·语音' },
              { icon: '⚡', t: '智能比价引擎', d: '价格·时效·覆盖度' },
            ].map((f, i) => (
              <Card key={i} size="small" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }} styles={{ body: { padding: '12px 14px' } }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{f.t}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{f.d}</div>
              </Card>
            ))}
          </div>

          {debugInfo && (
            <div style={{
              marginTop: 24, padding: 14, background: 'rgba(0,0,0,0.5)', borderRadius: 10,
              fontSize: 11, color: '#8c8c8c', fontFamily: 'monospace', whiteSpace: 'pre-wrap',
              lineHeight: 1.6, maxHeight: 180, overflow: 'auto'
            }}>
              <div style={{ color: '#69b1ff', marginBottom: 4 }}>🔧 调试信息（开发环境）</div>
              {debugInfo}
            </div>
          )}
        </div>

        {/* 右侧登录表单 */}
        <div style={{ padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Title level={2} style={{ marginBottom: 4 }}>账号登录</Title>
          <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>选择下方演示账号快速体验或输入自定义账号</Text>

          {/* 登录状态条：100% 可视化反馈 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', marginBottom: 16,
            borderRadius: 10, border: `1px solid ${statusColor}`,
            background: step === 'error' ? '#fff2f0' : step === 'success' ? '#f6ffed' : step === 'requesting' ? '#e6f4ff' : '#fafafa'
          }}>
            {StatusIcon}
            <Text style={{
              color: statusColor, fontWeight: 500, fontSize: 13, lineHeight: 1.5,
              whiteSpace: 'pre-wrap', flex: 1
            }}>
              {step === 'idle' ? '👋 请输入账号密码，或点击下方演示账号快速登录' :
               step === 'requesting' ? statusMsg :
               step === 'success' ? statusMsg :
               `❌ 登录失败：${errMsg}`}
            </Text>
          </div>

          {step === 'error' && (
            <Alert
              type="error"
              showIcon
              message="登录失败"
              description={
                <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                  {errMsg.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                  {debugInfo && (
                    <div style={{ marginTop: 8, padding: 8, background: '#fff', borderRadius: 6, fontFamily: 'monospace', fontSize: 11, color: '#8c8c8c', whiteSpace: 'pre-wrap' }}>
                      <div style={{ color: '#fa8c16', marginBottom: 4 }}>Debug:</div>
                      {debugInfo}
                    </div>
                  )}
                </div>
              }
              style={{ marginBottom: 16 }}
            />
          )}

          <Tabs
            items={[
              {
                key: '1',
                label: '账号密码登录',
                children: (
                  <Form layout="vertical" onFinish={onFinish} size="large" disabled={loading}>
                    <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]} label="用户名">
                      <Input prefix={<UserOutlined />} placeholder="admin / user1 / courier1" />
                    </Form.Item>
                    <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]} label="密码">
                      <Input.Password prefix={<LockOutlined />} placeholder="默认密码 123456" />
                    </Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={loading}
                      style={{ height: 44, fontSize: 15, marginTop: 8 }}
                    >
                      {loading ? '正在登录...' : '登录系统'}
                    </Button>
                  </Form>
                )
              }
            ]}
          />

          {/* 演示账号卡片 - 可点击快速登录 */}
          <div style={{ marginTop: 24, padding: 16, background: '#f5f7fa', borderRadius: 10, border: '1px solid #e5eaf1' }}>
            <Text strong style={{ display: 'block', marginBottom: 12 }}>🎯 演示账号（点击卡片立即登录）</Text>
            {accounts.map((a, i) => (
              <div
                key={i}
                onClick={() => quickLogin(a)}
                style={{
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 8px',
                  borderBottom: i < 2 ? '1px dashed #e5eaf1' : 'none',
                  borderRadius: 8,
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 0.2s',
                  userSelect: 'none'
                }}
                onMouseEnter={e => !loading && (e.currentTarget.style.background = 'rgba(22,119,255,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: a.role === '平台管理员' ? '#1677ff' :
                              a.role === '普通用户' ? '#52c41a' : '#fa8c16',
                  color: '#fff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 700, fontSize: 14,
                  flexShrink: 0, marginTop: 1
                }}>
                  {a.role === '平台管理员' ? '管' : a.role === '普通用户' ? '用' : '快'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                    <Text strong code>{a.user}</Text>
                    <span style={{ margin: '0 4px', color: '#bfbfbf' }}>/</span>
                    <Text code>123456</Text>
                    <span style={{
                      marginLeft: 8, padding: '2px 8px',
                      background: a.role === '平台管理员' ? '#e6f4ff' :
                                  a.role === '普通用户' ? '#f6ffed' : '#fff7e6',
                      color: a.role === '平台管理员' ? '#1677ff' :
                             a.role === '普通用户' ? '#52c41a' : '#fa8c16',
                      borderRadius: 4, fontSize: 11, fontWeight: 500
                    }}>{a.role}</span>
                    <span style={{ float: 'right', color: '#1677ff', fontSize: 12, fontWeight: 500 }}>
                      立即登录 →
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 3 }}>{a.desc}</div>
                  <div style={{ fontSize: 11, color: '#bfbfbf', marginTop: 2 }}>
                    登录后自动跳转至：<Text code style={{ background: 'transparent', padding: 0, fontSize: 11 }}>{a.target}</Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
