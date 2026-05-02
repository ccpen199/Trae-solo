import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Select, message, Tabs, Divider } from 'antd';
import { LoginOutlined, UserAddOutlined, SafetyOutlined, SolutionOutlined, EnvironmentOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Option } = Select;
const { TabPane } = Tabs;

const ROLE_OPTIONS = [
  { value: 'resident', label: '社区居民', icon: <UserOutlined /> },
  { value: 'rider', label: '回收员（骑手）', icon: <EnvironmentOutlined /> },
  { value: 'center', label: '集散中心', icon: <SolutionOutlined /> },
  { value: 'operator', label: '平台运营', icon: <SafetyOutlined /> }
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [registerRole, setRegisterRole] = useState('resident');

  useEffect(() => {
    if (user) {
      navigate(`/${user.role}`);
    }
  }, [user, navigate]);

  const onLoginFinish = async (values) => {
    setLoading(true);
    try {
      const result = await login(values.username, values.password);
      if (result.success) {
        message.success('登录成功！');
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const onRegisterFinish = async (values) => {
    setLoading(true);
    try {
      const result = await register({
        ...values,
        role: registerRole
      });
      if (result.success) {
        message.success('注册成功！');
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const roleLabelRender = (option) => (
    <span>
      {option.icon}
      <span style={{ marginLeft: 8 }}>{option.label}</span>
    </span>
  );

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-title">
          <h1>🌱 垃圾分类回收平台</h1>
          <p>环保回收，共建绿色未来</p>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} centered>
          <TabPane tab="登录" key="login">
            <Form
              name="login"
              layout="vertical"
              onFinish={onLoginFinish}
              autoComplete="off"
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="用户名" 
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="密码"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  block 
                  size="large"
                  loading={loading}
                  icon={<LoginOutlined />}
                >
                  登录
                </Button>
              </Form.Item>
            </Form>

            <Divider>测试账号</Divider>
            <div style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
              <p>居民: resident / 123456</p>
              <p>骑手: rider / 123456</p>
              <p>中心: center / 123456</p>
              <p>运营: operator / 123456</p>
            </div>
          </TabPane>

          <TabPane tab="注册" key="register">
            <Form
              name="register"
              layout="vertical"
              onFinish={onRegisterFinish}
              autoComplete="off"
            >
              <Form.Item
                label="角色类型"
                name="role"
                initialValue={registerRole}
                rules={[{ required: true, message: '请选择角色类型' }]}
              >
                <Select 
                  size="large"
                  className="role-select"
                  value={registerRole}
                  onChange={setRegisterRole}
                  labelRender={roleLabelRender}
                >
                  {ROLE_OPTIONS.map(option => (
                    <Option key={option.value} value={option.value}>
                      {roleLabelRender(option)}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="用户名"
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="请输入用户名" 
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="姓名"
                name="name"
                rules={[{ required: true, message: '请输入真实姓名' }]}
              >
                <Input 
                  placeholder="请输入真实姓名" 
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="手机号"
                name="phone"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
                ]}
              >
                <Input 
                  placeholder="请输入手机号" 
                  size="large"
                />
              </Form.Item>

              {registerRole === 'resident' && (
                <Form.Item label="地址" name="address">
                  <Input 
                    placeholder="请输入详细地址（选填）" 
                    size="large"
                  />
                </Form.Item>
              )}

              <Form.Item
                label="密码"
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入密码"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="确认密码"
                name="confirmPassword"
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
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请再次输入密码"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  block 
                  size="large"
                  loading={loading}
                  icon={<UserAddOutlined />}
                >
                  注册
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default LoginPage;
