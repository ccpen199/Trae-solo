import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs, Alert, Space, Tag, Divider } from 'antd';
import { UserOutlined, LockOutlined, ShopOutlined, TeamOutlined, SafetyOutlined, CrownOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const { TabPane } = Tabs;

function Login({ setUser }) {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState('personal');
  const [loading, setLoading] = useState(false);
  const demoValues = {
    personal: { username: 'user1', password: '123456' },
    enterprise: { username: 'admin', password: 'admin123' },
    admin: { username: 'admin', password: 'admin123' }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', values);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      message.success(`欢迎回来，${user.real_name || user.username}！`);
      
      if (user.type === 'enterprise' && user.username === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.type === 'enterprise') {
        navigate('/profile');
      } else {
        navigate('/');
      }
    } catch (error) {
      message.error(error.response?.data?.error || '登录失败');
    }
    setLoading(false);
  };

  const getAccountTypeDesc = () => {
    if (loginType === 'personal') {
      return '个人账户适用于个人用户购买邮品、查询包裹、管理订阅等服务';
    } else if (loginType === 'enterprise') {
      return '企业账户支持企业集采、批量订阅、定制服务、账单管理等企业级功能';
    } else {
      return '管理后台仅供内部管理员使用，包含内容审核、数据统计、运营管理等功能';
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #006633 0%, #00994d 50%, #00331a 100%)',
      padding: 24
    }}>
      <div style={{ maxWidth: 900, width: '100%', display: 'flex', gap: 24 }}>
        <div style={{ flex: 1, color: 'white', padding: '40px 20px' }}>
          <h1 style={{ color: 'white', fontSize: 36, marginBottom: 16 }}>中国邮政</h1>
          <h2 style={{ color: '#99ffbb', fontSize: 20, marginBottom: 32, fontWeight: 'normal' }}>
            统一数字服务门户平台
          </h2>
          
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                background: 'rgba(255,255,255,0.2)', 
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShopOutlined style={{ fontSize: 20 }} />
              </div>
              <div>
                <div style={{ fontWeight: 500 }}>邮品商城</div>
                <div style={{ fontSize: 12, color: '#99ffbb', opacity: 0.8 }}>
                  集邮票品、报刊订阅、文创产品一站式选购
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                background: 'rgba(255,255,255,0.2)', 
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TeamOutlined style={{ fontSize: 20 }} />
              </div>
              <div>
                <div style={{ fontWeight: 500 }}>包裹查询</div>
                <div style={{ fontSize: 12, color: '#99ffbb', opacity: 0.8 }}>
                  普邮、EMS、国际邮件全程追踪
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                background: 'rgba(255,255,255,0.2)', 
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <SafetyOutlined style={{ fontSize: 20 }} />
              </div>
              <div>
                <div style={{ fontWeight: 500 }}>安全保障</div>
                <div style={{ fontSize: 12, color: '#99ffbb', opacity: 0.8 }}>
                  邮政级安全加密，保障您的信息安全
                </div>
              </div>
            </div>
          </Space>
        </div>

        <Card style={{ width: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <Tabs 
            activeKey={loginType} 
            onChange={setLoginType}
            centered
            size="large"
          >
            <TabPane 
              tab={<span><UserOutlined /> 个人用户</span>} 
              key="personal" 
            />
            <TabPane 
              tab={<span><ShopOutlined /> 企业用户</span>} 
              key="enterprise" 
            />
            <TabPane 
              tab={<span><CrownOutlined /> 管理后台</span>} 
              key="admin" 
            />
          </Tabs>

          <Alert
            message={
              <div>
                <Space>
                  {loginType === 'personal' && <Tag color="green">个人账户</Tag>}
                  {loginType === 'enterprise' && <Tag color="blue">企业账户</Tag>}
                  {loginType === 'admin' && <Tag color="purple">管理员</Tag>}
                  <span>{getAccountTypeDesc()}</span>
                </Space>
              </div>
            }
            type="info"
            showIcon={false}
            style={{ marginBottom: 24, fontSize: 12 }}
          />

          <Form
            key={loginType}
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            initialValues={demoValues[loginType]}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名或邮箱' }]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder={
                  loginType === 'admin' ? '管理员账号' : 
                  loginType === 'enterprise' ? '企业账号/邮箱' : 
                  '用户名/邮箱'
                } 
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="密码" 
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                style={{ width: '100%', height: 44 }}
                loading={loading}
              >
                {loginType === 'admin' ? '登录管理后台' : '安全登录'}
              </Button>
            </Form.Item>

            {loginType !== 'admin' && (
              <>
                <Divider style={{ margin: '16px 0' }} plain>
                  <span style={{ color: '#999' }}>还没有账户？</span>
                </Divider>
                
                <div style={{ textAlign: 'center' }}>
                  <Link to="/register">
                    <Button size="large" style={{ width: 160 }}>
                      立即注册{loginType === 'enterprise' ? '企业账户' : '个人账户'}
                    </Button>
                  </Link>
                </div>
              </>
            )}

            <div style={{ 
              textAlign: 'center', 
              marginTop: 24, 
              padding: 12, 
              background: '#f5f5f5', 
              borderRadius: 8,
              fontSize: 12 
            }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>演示账号</div>
              <Space direction="vertical" size={4} style={{ width: '100%', textAlign: 'left' }}>
                <div>• 管理员：<code>admin / admin123</code></div>
                <div>• 企业用户：<code>admin / admin123</code></div>
                <div>• 个人用户：<code>user1 / 123456</code></div>
              </Space>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export default Login;
