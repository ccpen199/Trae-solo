import { Form, Input, Button, Card, Typography, App, Tabs } from 'antd';
import { UserOutlined, LockOutlined, TruckOutlined, GlobalOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useState } from 'react';

const { Title, Text, Paragraph } = Typography;

export default function Login() {
  const nav = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const accounts = [
    { user: 'admin', pwd: '123456', role: '平台管理员', desc: '查看仪表盘、品牌管理、拓扑图、API开放中心' },
    { user: 'user1', pwd: '123456', role: '普通用户', desc: '下单、比价、包裹地图、签收验证、投诉' },
    { user: 'courier1', pwd: '123456', role: '快递员', desc: '工作台、待派单聚合、电子签收、SLA监控' },
  ];

  const onFinish = async (v: any) => {
    setLoading(true);
    try {
      const res: any = await api.auth.login(v);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      message.success(`欢迎回来，${res.user.name || res.user.username}！`);
      setTimeout(() => nav('/'), 200);
    } catch (e: any) {
      message.error(e.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 50%, #003eb3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 1080, display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 32, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
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
        </div>
        <div style={{ padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Title level={2} style={{ marginBottom: 4 }}>账号登录</Title>
          <Text type="secondary" style={{ marginBottom: 28, display: 'block' }}>选择下方演示账号快速体验或输入自定义账号</Text>
          <Tabs
            items={[
              {
                key: '1',
                label: '账号密码登录',
                children: (
                  <Form layout="vertical" onFinish={onFinish} size="large">
                    <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]} label="用户名">
                      <Input prefix={<UserOutlined />} placeholder="admin / user1 / courier1" />
                    </Form.Item>
                    <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]} label="密码">
                      <Input.Password prefix={<LockOutlined />} placeholder="默认密码 123456" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 44, fontSize: 15, marginTop: 8 }}>
                      登录系统
                    </Button>
                  </Form>
                )
              }
            ]}
          />
          <div style={{ marginTop: 28, padding: 16, background: '#f5f7fa', borderRadius: 10, border: '1px solid #e5eaf1' }}>
            <Text strong style={{ display: 'block', marginBottom: 12 }}>🎯 演示账号</Text>
            {accounts.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < 2 ? '1px dashed #e5eaf1' : 'none' }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: '#1677ff', marginTop: 7, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>
                    <Text strong code>{a.user}</Text> / <Text code>123456</Text>
                    <span style={{ marginLeft: 8, padding: '1px 6px', background: '#e6f4ff', color: '#1677ff', borderRadius: 4, fontSize: 11 }}>{a.role}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
