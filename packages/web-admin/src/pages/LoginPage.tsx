import React, { useState } from 'react';
import { Form, Input, Button, Card, Select, Tabs, message } from 'antd';
import { LockOutlined, MobileOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  if (token) return <Navigate to="/" replace />;
  const [role, setRole] = useState('PROVINCE_ADMIN');

  const handle = async (v: any) => {
    setLoading(true);
    try { await login(v.phone, v.password); navigate('/'); }
    catch { /* handled */ }
    finally { setLoading(false); }
  };

  const demoAccounts = [
    { role: 'PROVINCE_ADMIN', phone: '13800000001', label: '省级运营管理员' },
    { role: 'CITY_OPERATOR', phone: '13800000101', label: '广州地市运营' },
    { role: 'APPROVER', phone: '13800000201', label: '广州审批员' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #003A8C 0%, #00B42A 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40,
    }}>
      <div style={{ width: 1080, display: 'grid', gridTemplateColumns: '1.2fr 1fr', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 80px rgba(0,0,0,0.2)' }}>
        <div style={{ background: 'linear-gradient(135deg, #001529 0%, #003a8c 100%)', color: '#fff', padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              📮 邮政政务便民服务平台
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 60, lineHeight: 1.2 }}>
              广东省21地市<br/>
              政务便民服务<br/>
              协同运营平台
            </div>
            <div style={{ marginTop: 16, opacity: 0.8, fontSize: 14, lineHeight: 1.8 }}>
              证件签注 · 车管业务 · 身份证补换领<br/>
              敏感字段脱敏存储 · 代缴资金监管账户隔离<br/>
              全流程时效预警 · 地市分级运营后台
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, opacity: 0.9 }}>
            <div><div style={{ fontSize: 28, fontWeight: 700 }}>21</div><div style={{ fontSize: 12, opacity: 0.7 }}>服务地市</div></div>
            <div><div style={{ fontSize: 28, fontWeight: 700 }}>400+</div><div style={{ fontSize: 12, opacity: 0.7 }}>违章城市</div></div>
            <div><div style={{ fontSize: 28, fontWeight: 700 }}>99.9%</div><div style={{ fontSize: 12, opacity: 0.7 }}>SLA达成率</div></div>
          </div>
        </div>
        <div style={{ background: '#fff', padding: 48 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1f1f1f' }}>运营后台登录</div>
          <div style={{ fontSize: 13, color: '#8c8c8c', marginTop: 6 }}>仅限授权人员登录，所有操作均审计记录</div>
          <Card style={{ borderRadius: 10, marginTop: 24, border: '1px solid #f0f0f0' }} size="small">
            <div style={{ fontSize: 13, color: '#595959', marginBottom: 10 }}>
              <SafetyOutlined style={{ color: '#00B42A' }} /> 选择登录角色（仅演示）：
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {demoAccounts.map(a => (
                <Button key={a.role} size="small" type={role === a.role ? 'primary' : 'default'}
                  onClick={() => setRole(a.role)}>{a.label}</Button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>
              账号：{demoAccounts.find(a => a.role === role)?.phone} · 密码：Admin@123456
            </div>
          </Card>
          <Form layout="vertical" style={{ marginTop: 20 }} onFinish={handle}
            initialValues={{ phone: demoAccounts.find(a => a.role === role)?.phone, password: 'Admin@123456' }}>
            <Form.Item label="账号（手机号）" name="phone" rules={[{ required: true, pattern: /^1\d{10}$/ }]}>
              <Input prefix={<MobileOutlined />} size="large" placeholder="请输入手机号" />
            </Form.Item>
            <Form.Item label="登录密码" name="password" rules={[{ required: true, min: 8 }]}>
              <Input.Password prefix={<LockOutlined />} size="large" placeholder="请输入密码" />
            </Form.Item>
            <Form.Item label="验证角色" name="role" rules={[{ required: true }]} initialValue={role}>
              <Select options={[
                { value: 'PROVINCE_ADMIN', label: '省级运营管理员' },
                { value: 'CITY_OPERATOR', label: '地市运营管理员' },
                { value: 'APPROVER', label: '审批机关人员' },
                { value: 'COURIER', label: '邮政揽收员' },
              ]} />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>登录运营后台</Button>
          </Form>
          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#8c8c8c' }}>
            登录即代表您已阅读并同意《运营后台管理规范》
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
