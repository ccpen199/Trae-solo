import React, { useState } from 'react';
import { Form, Input, Button, Card, Select, message, Alert, Tag, Divider } from 'antd';
import { UserOutlined, LockOutlined, IdcardOutlined, PhoneOutlined, SafetyCertificateOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../api';
import useAuthStore from '../stores/auth';

const { Option } = Select;

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [registerResult, setRegisterResult] = useState(null);
  const navigate = useNavigate();
  const loginStore = useAuthStore((s) => s.login);

  const onFinish = async (values) => {
    setLoading(true);
    setRegisterResult(null);
    try {
      const submitData = {
        username: values.username,
        password: values.password,
        real_name: values.real_name,
        phone: values.phone,
        user_type: values.user_type,
        id_number: values.id_number,
      };
      await auth.register(submitData);
      try {
        const user = await loginStore(submitData.username, submitData.password);
        setRegisterResult({
          success: true,
          user,
          message: '注册成功，已自动登录并进入工作台',
        });
        const userTypeLabel = user.user_type === 'enterprise' ? '企业法人' : '自然人';
        message.success(`注册成功！身份：${userTypeLabel}，正在进入工作台...`);
        navigate('/dashboard', { replace: true });
      } catch {
        setRegisterResult({
          success: true,
          user: null,
          message: '注册成功，请使用新账号登录',
        });
        message.success('注册成功，请登录');
        navigate('/login', { replace: true });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || '注册失败';
      setRegisterResult({
        success: false,
        message: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #001529 0%, #003a8c 50%, #1890ff 100%)',
      }}
    >
      <Card
        style={{
          width: 520,
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1890ff, #001529)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <span style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>云</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 'bold', color: '#001529', margin: 0 }}>
            云南省一体化政务服务平台
          </h1>
          <p style={{ color: '#666', marginTop: 8, fontSize: 14 }}>统一身份注册 · 自然人/企业法人</p>
        </div>

        {registerResult && !registerResult.success && (
          <Alert
            type="error"
            showIcon
            message="注册失败"
            description={registerResult.message}
            closable
            onClose={() => setRegisterResult(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        {registerResult && registerResult.success && (
          <Alert
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            message={registerResult.message}
            description={
              registerResult.user ? (
                <div>
                  <div>用户名：{registerResult.user.username}　
                    <Tag color={registerResult.user.user_type === 'enterprise' ? 'purple' : 'blue'}>
                      {registerResult.user.user_type === 'enterprise' ? '企业法人' : '自然人'}
                    </Tag>
                  </div>
                  <div>角色权限：{registerResult.user.role === 'user' ? '办事人（基本权限）' : registerResult.user.role}</div>
                  <div style={{ marginTop: 4 }}>
                    <Tag color="orange" style={{ fontSize: 11 }}>
                      <SafetyCertificateOutlined /> 省政务云CA认证未验证
                    </Tag>
                  </div>
                </div>
              ) : null
            }
            style={{ marginBottom: 16 }}
          />
        )}

        <Form name="register" onFinish={onFinish} size="large">
          <Form.Item name="user_type" rules={[{ required: true, message: '请选择用户类型' }]}>
            <Select placeholder="请选择用户类型">
              <Option value="person">自然人（个人办事）</Option>
              <Option value="enterprise">企业法人（企业办事）</Option>
            </Select>
          </Form.Item>

          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '用户名至少3位' }]}>
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item name="real_name" rules={[{ required: true, message: '请输入真实姓名' }]}>
            <Input prefix={<IdcardOutlined />} placeholder="请输入真实姓名" />
          </Form.Item>

          <Form.Item name="id_number" rules={[{ required: true, message: '请输入身份证号' }, { len: 18, message: '请输入18位身份证号' }]}>
            <Input prefix={<IdcardOutlined />} placeholder="请输入18位身份证号" maxLength={18} />
          </Form.Item>

          <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}>
            <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" maxLength={11} />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码（至少6位）" />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请确认密码" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 44, fontSize: 16 }}
            >
              注 册
            </Button>
          </Form.Item>

          <Divider style={{ margin: '8px 0' }} />

          <div style={{ textAlign: 'center' }}>
            已有账号？
            <Link to="/login" style={{ color: '#1890ff' }}>
              立即登录
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
