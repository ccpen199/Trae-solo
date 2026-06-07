import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Select, Alert, Divider, Tag } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Option } = Select;

const roleAccounts = [
  { role: 'personal', username: 'person1', desc: '缴存人', descFull: '个人缴存用户，可查询账户、申请提取、查看贷款' },
  { role: 'unit_admin', username: 'unit_admin', desc: '单位经办员', descFull: '单位管理人员，可办理汇缴、查询本单位缴存情况' },
  { role: 'developer', username: 'developer', desc: '开发商', descFull: '开发商用户，可办理项目备案、预售资金监管' },
  { role: 'supervisor', username: 'supervisor_bj', desc: '监管员', descFull: '公积金中心监管人员，可审批提取、监测风险、查看审计' },
  { role: 'super_admin', username: 'admin', desc: '系统管理员', descFull: '平台超级管理员，可管理所有中心和用户' }
];

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('personal');
  const [loginStatus, setLoginStatus] = useState(null);
  const [form] = Form.useForm();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = '/dashboard';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  useEffect(() => {
    const selectedAccount = roleAccounts.find(r => r.role === selectedRole);
    if (selectedAccount) {
      form.setFieldsValue({
        username: selectedAccount.username,
        password: '123456'
      });
    }
  }, [selectedRole, form]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const expired = params.get('expired');
    if (expired) {
      setLoginStatus({ type: 'warning', message: '登录已过期，请重新登录' });
    }
  }, [location]);

  const onFinish = async (values) => {
    setLoading(true);
    setLoginStatus(null);

    try {
      const userData = await login(values.username, values.password);
      
      const roleInfo = roleAccounts.find(r => r.role === userData.role);
      setLoginStatus({ 
        type: 'success', 
        message: `登录成功！欢迎 ${userData.name}（${roleInfo?.desc || userData.role}）` 
      });

      message.success({
        content: `登录成功，正在进入${roleInfo?.desc || ''}工作台...`,
        duration: 2
      });
    } catch (error) {
      const errorData = error.response?.data;
      const errorMsg = errorData?.error || '登录失败';
      const errorCode = errorData?.code || '';
      const suggestion = errorData?.suggestion || '';
      let detailMsg = suggestion || errorMsg;
      
      if (!error.response) {
        detailMsg = '网络连接失败，无法连接到服务器。请确认后端服务正在运行（端口59037）';
      }

      setLoginStatus({ 
        type: 'error', 
        message: detailMsg,
        description: `用户名：${values.username} | 错误码：${errorCode || error.response?.status || 'NETWORK_ERROR'}`
      });

      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setLoginStatus(null);
  };

  const selectedAccount = roleAccounts.find(r => r.role === selectedRole);

  return (
    <div className="login-container">
      <Card className="login-card" style={{ width: 480 }}>
        <div className="login-title">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 12,
            marginBottom: 8 
          }}>
            <SafetyCertificateOutlined style={{ fontSize: 36, color: '#1890ff' }} />
            <h2 style={{ margin: 0 }}>全国住房公积金统一服务中台</h2>
          </div>
          <p style={{ color: '#666', marginTop: 8, marginBottom: 16 }}>欢迎登录，请选择您的角色</p>
        </div>

        {loginStatus && (
          <Alert
            type={loginStatus.type}
            message={loginStatus.message}
            description={loginStatus.description}
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          name="login"
          initialValues={{ 
            role: selectedRole,
            username: selectedAccount?.username, 
            password: '123456' 
          }}
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="role"
            label={<span><strong>选择身份角色</strong></span>}
            rules={[{ required: true, message: '请选择角色' }]}
            tooltip="不同角色拥有不同的功能权限，请选择与您匹配的身份"
          >
            <Select 
              value={selectedRole} 
              onChange={handleRoleChange}
              size="large"
              optionFilterProp="children"
            >
              {roleAccounts.map(r => (
                <Option key={r.role} value={r.role}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{r.desc}</span>
                    <Tag color="blue">{r.username}</Tag>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {selectedAccount && (
            <Alert
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              message={`${selectedAccount.desc}工作台`}
              description={selectedAccount.descFull}
              style={{ marginBottom: 16 }}
            />
          )}

          <Divider style={{ margin: '12px 0' }} />

          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="请输入用户名" 
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请输入密码" 
              size="large"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block 
              size="large"
            >
              {loading ? '正在登录...' : '安全登录'}
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
            <p>演示环境默认密码：<code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>123456</code></p>
            <p style={{ marginTop: 4, color: '#bbb' }}>
              所有操作均会记录审计日志，请遵守相关规定
            </p>
          </div>
        </Form>
      </Card>
    </div>
  );
}
