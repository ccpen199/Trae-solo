import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Select, message, Alert } from 'antd';
import { LockOutlined, MobileOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

const demoAccounts = [
  { role: 'PROVINCE_ADMIN', phone: '13800000001', label: '省级运营管理员', desc: '全省数据、资金监管、地市配置' },
  { role: 'CITY_OPERATOR', phone: '13800000101', label: '广州地市运营', desc: '广州市订单/预警/揽收员管理' },
  { role: 'APPROVER', phone: '13800000201', label: '广州审批员', desc: '签注/身份证审批工作台' },
  { role: 'COURIER', phone: '138000003011', label: '广州揽收员', desc: '工单接单、收件、派件闭环' },
  { role: 'APPLICANT', phone: '13912345678', label: '申请人(已实名)', desc: '签注/违章/免检/身份证申请' },
];

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('PROVINCE_ADMIN');
  const [errorTip, setErrorTip] = useState('');
  const [form] = Form.useForm();

  if (token) return <Navigate to="/" replace />;

  const currentAccount = demoAccounts.find(a => a.role === selectedRole);

  useEffect(() => {
    if (currentAccount) {
      form.setFieldsValue({ phone: currentAccount.phone, password: 'Admin@123456', role: selectedRole });
    }
  }, [selectedRole]);

  const handle = async (v: any) => {
    setErrorTip('');
    setLoading(true);
    try {
      await login(v.phone, v.password);
      message.success('登录成功');
      navigate('/');
    } catch (err: any) {
      const msg = err?.message || err?.msg || '登录失败，请检查账号密码';
      setErrorTip(msg);
      if (!msg.includes('过期')) message.error(msg);
    } finally { setLoading(false); }
  };

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

          <Card style={{ borderRadius: 10, marginTop: 20, border: '1px solid #f0f0f0' }} size="small">
            <div style={{ fontSize: 13, color: '#595959', marginBottom: 10 }}>
              <SafetyOutlined style={{ color: '#00B42A' }} /> 快速选择演示角色：
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {demoAccounts.map(a => (
                <Button key={a.role} size="small" type={selectedRole === a.role ? 'primary' : 'default'}
                  onClick={() => setSelectedRole(a.role)}>{a.label}</Button>
              ))}
            </div>
            {currentAccount && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: '#f6ffed', borderRadius: 6, fontSize: 12 }}>
                <div><b>账号：</b>{currentAccount.phone}　<b>密码：</b>Admin@123456</div>
                <div style={{ color: '#8c8c8c', marginTop: 4 }}>权限范围：{currentAccount.desc}</div>
              </div>
            )}
          </Card>

          {errorTip && (
            <Alert type="error" message={errorTip} showIcon style={{ marginTop: 16 }} closable onClose={() => setErrorTip('')} />
          )}

          <Form form={form} layout="vertical" style={{ marginTop: 16 }} onFinish={handle}
            initialValues={{ phone: currentAccount?.phone, password: 'Admin@123456', role: selectedRole }}>
            <Form.Item label="账号（手机号）" name="phone" rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1\d{10,14}$/, message: '手机号格式不正确' }]}>
              <Input prefix={<MobileOutlined />} size="large" placeholder="请输入手机号/工号" maxLength={15} />
            </Form.Item>
            <Form.Item label="登录密码" name="password" rules={[{ required: true, message: '请输入密码' }, { min: 8, message: '密码至少8位' }]}>
              <Input.Password prefix={<LockOutlined />} size="large" placeholder="请输入密码" />
            </Form.Item>
            <Form.Item label="验证角色" name="role" rules={[{ required: true, message: '请选择角色' }]}>
              <Select options={[
                { value: 'PROVINCE_ADMIN', label: '省级运营管理员' },
                { value: 'CITY_OPERATOR', label: '地市运营管理员' },
                { value: 'APPROVER', label: '审批机关人员' },
                { value: 'COURIER', label: '邮政揽收员' },
                { value: 'APPLICANT', label: '普通申请人' },
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
