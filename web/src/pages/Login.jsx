import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Card, message, Alert, Space, Divider, Tag, Spin } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined, ScanOutlined, InfoCircleOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../stores/auth';

const ROLE_MAP = {
  super_admin: { label: '超级管理员', color: 'red' },
  admin: { label: '管理员', color: 'orange' },
  operator: { label: '经办人', color: 'blue' },
  reviewer: { label: '审核人', color: 'green' },
  user: { label: '办事人', color: 'default' },
};

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [loginResult, setLoginResult] = useState(null);
  const [navigating, setNavigating] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const onFinish = async (values) => {
    setLoading(true);
    setLoginResult(null);
    try {
      const user = await login(values.username, values.password);
      const roleInfo = ROLE_MAP[user.role] || { label: user.role, color: 'default' };
      setLoginResult({
        success: true,
        user,
        message: `欢迎回来，${user.real_name || user.username}！`,
        roleLabel: roleInfo.label,
        roleColor: roleInfo.color,
        userType: user.user_type === 'enterprise' ? '企业法人' : user.user_type === 'staff' ? '工作人员' : '自然人',
        department: user.department_name || '未分配部门',
        authLevel: user.role === 'super_admin' || user.role === 'admin' ? '完全授权' : user.role === 'operator' || user.role === 'reviewer' ? '业务授权' : '基本权限',
        caVerified: false,
        faceVerified: false,
      });
      message.success('登录成功，正在进入工作台...');
      setNavigating(true);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const errorMsg = err.response?.data?.error || err.response?.data?.message || '登录失败';
      let detail = '';
      let hint = '';
      if (status === 401) {
        detail = '用户名或密码不正确，请核实后重试';
        hint = '如忘记密码，请联系管理员重置';
      } else if (status === 403) {
        if (errorMsg.includes('禁用')) {
          detail = '该账号已被管理员禁用，无法登录';
          hint = '请联系所属部门管理员或政务服务管理局了解详情';
        } else if (errorMsg.includes('锁定')) {
          detail = '该账号已被锁定，暂时无法登录';
          hint = '请联系管理员解锁，或等待锁定时间结束后重试';
        } else {
          detail = errorMsg;
          hint = '请联系管理员处理';
        }
      } else if (status === 400) {
        detail = errorMsg;
        hint = '请检查输入信息是否完整';
      } else if (!status) {
        detail = '无法连接到服务器，请检查网络连接';
        hint = '如持续无法连接，请联系技术支持';
      } else {
        detail = errorMsg;
        hint = '请稍后重试或联系管理员';
      }
      setLoginResult({
        success: false,
        detail,
        hint,
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
      <Spin spinning={navigating} tip="正在进入工作台...">
        <Card
          style={{
            width: 480,
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
            <p style={{ color: '#666', marginTop: 8, fontSize: 14 }}>统一身份认证 · 对接省政务云CA</p>
          </div>

          {loginResult && !loginResult.success && (
            <Alert
              type="error"
              showIcon
              icon={<WarningOutlined />}
              message="登录失败"
              description={
                <div>
                  <div>{loginResult.detail}</div>
                  {loginResult.hint && (
                    <div style={{ marginTop: 4, color: '#666', fontSize: 12 }}>
                      <InfoCircleOutlined style={{ marginRight: 4 }} />
                      {loginResult.hint}
                    </div>
                  )}
                </div>
              }
              closable
              onClose={() => setLoginResult(null)}
              style={{ marginBottom: 16 }}
            />
          )}

          {loginResult && loginResult.success && (
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              message={loginResult.message}
              description={
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <div>身份类型：{loginResult.userType}　
                    <Tag color={loginResult.roleColor}>{loginResult.roleLabel}</Tag>
                  </div>
                  <div>所属部门：{loginResult.department}　授权级别：{loginResult.authLevel}</div>
                  <div>
                    <Tag color={loginResult.caVerified ? 'green' : 'orange'} style={{ fontSize: 11 }}>
                      <SafetyCertificateOutlined /> 省政务云CA认证{loginResult.caVerified ? '已通过' : '未验证'}
                    </Tag>
                    <Tag color={loginResult.faceVerified ? 'green' : 'orange'} style={{ fontSize: 11 }}>
                      <ScanOutlined /> 人脸识别{loginResult.faceVerified ? '已通过' : '未验证'}
                    </Tag>
                  </div>
                </Space>
              }
              style={{ marginBottom: 16 }}
            />
          )}

          <Form name="login" onFinish={onFinish} size="large" initialValues={{ remember: true }}>
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" autoComplete="username" />
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" autoComplete="current-password" />
            </Form.Item>

            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>记住我</Checkbox>
                </Form.Item>
                <span style={{ color: '#999', fontSize: 12 }}>CA认证与人脸识别可在登录后完成</span>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: 44, fontSize: 16 }}
              >
                登录
              </Button>
            </Form.Item>

            <Divider style={{ margin: '12px 0' }}>
              <span style={{ color: '#999', fontSize: 12 }}>其他方式</span>
            </Divider>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 8 }}>
              <Button icon={<SafetyCertificateOutlined />} size="small" onClick={() => message.info('CA证书认证功能对接中，请联系管理员开通')}>
                CA证书登录
              </Button>
              <Button icon={<ScanOutlined />} size="small" onClick={() => message.info('人脸识别功能对接中，请联系管理员开通')}>
                人脸识别登录
              </Button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 12 }}>
              还没有账号？
              <Link to="/register" style={{ color: '#1890ff' }}>
                立即注册
              </Link>
            </div>
          </Form>

          <div style={{ marginTop: 12, padding: '8px 12px', background: '#f6f8fa', borderRadius: 4, fontSize: 12, color: '#888' }}>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>演示账号：</div>
            <div>超级管理员：admin / admin123</div>
            <div>平台管理员：platform / admin123</div>
            <div>经办人员：ops / admin123</div>
            <div>审核人员：reviewer / admin123</div>
            <div>办事人：citizen / admin123</div>
          </div>
        </Card>
      </Spin>
    </div>
  );
}
