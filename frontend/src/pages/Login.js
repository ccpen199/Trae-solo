import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Typography, Select } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const roleLabels = {
  tenderer: '招标方',
  bidder: '竞买人',
  supervisor: '监管人员',
  auditor: '审计员',
  expert: '专家',
  finance: '财务人员'
};

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await login(values.username, values.password);
      if (result.success) {
        message.success(`登录成功，欢迎 ${result.data.realName || result.data.username}`);
        setTimeout(() => {
          navigate('/');
        }, 500);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card 
        style={{ 
          width: 420, 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          borderRadius: 8
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <SafetyCertificateOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          <Title level={3} style={{ marginTop: 16, marginBottom: 8 }}>
            政府采购管理业务系统
          </Title>
          <Text type="secondary">基于 xm-11093 端口规划</Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名 (如: admin, tenderer, bidder)"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码 (如: Admin123!)"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
              size="large"
            >
              登录系统
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <Text strong>测试账户：</Text>
          <div style={{ marginTop: 8, fontSize: 12 }}>
            <Text type="secondary">管理员: admin / Admin123!</Text><br/>
            <Text type="secondary">招标方: tenderer / Tenderer123!</Text><br/>
            <Text type="secondary">竞买人: bidder / Bidder123!</Text><br/>
            <Text type="secondary">审计员: auditor / Auditor123!</Text>
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            后端端口: 110931 | 前端端口: 110932
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;
