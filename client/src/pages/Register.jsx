import React, { useState } from 'react';
import { Form, Input, Button, Card, Radio, message, Layout, Typography, Select } from 'antd';
import { HeartOutlined, LockOutlined, ShopOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/index.js';
import { setToken, setUser } from '../utils/auth.js';

const { Title, Text } = Typography;
const { Content } = Layout;
const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('couple');
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await authAPI.register({
        username: values.username,
        password: values.password,
        role,
        real_name: values.real_name,
        phone: values.phone,
        city: values.city,
        company_name: values.company_name,
        category: values.category
      });

      setToken(response.data.token);
      setUser(response.data.user);
      message.success('注册成功');
      navigate(role === 'merchant' ? '/merchant/dashboard' : '/');
    } catch (error) {
      const errors = error.response?.data?.errors;
      const firstValidationMessage = Array.isArray(errors) && errors.length > 0 ? errors[0].msg : '';
      message.error(error.response?.data?.error || error.response?.data?.message || firstValidationMessage || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (event) => {
    const nextRole = event.target.value;
    setRole(nextRole);
    form.setFieldsValue({ role: nextRole });
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' }}>
      <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Card
          style={{ width: 460, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', borderRadius: 16 }}
          bodyStyle={{ padding: 40 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <HeartOutlined style={{ fontSize: 48, color: '#ff4d6d', marginBottom: 16 }} />
            <Title level={2} style={{ margin: 0, color: '#ff4d6d' }}>加入婚嫁优选</Title>
            <Text type="secondary">创建账号，开始筹备或经营婚礼服务</Text>
          </div>

          <Form
            form={form}
            name="register"
            onFinish={handleSubmit}
            autoComplete="off"
            size="large"
            initialValues={{ role: 'couple', category: 'photography' }}
          >
            <Form.Item style={{ marginBottom: 20 }}>
              <Radio.Group value={role} onChange={handleRoleChange} block>
                <Radio.Button value="couple">我是新人</Radio.Button>
                <Radio.Button value="merchant">我是商家</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, max: 20, message: '用户名长度为 3-20 位' }
              ]}
              style={{ marginBottom: 16 }}
            >
              <Input prefix={<UserOutlined />} placeholder="用户名" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少 6 位' }
              ]}
              style={{ marginBottom: 16 }}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请再次输入密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  }
                })
              ]}
              style={{ marginBottom: 16 }}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
            </Form.Item>

            <Form.Item
              name="real_name"
              rules={[{ required: true, message: '请输入联系人姓名' }]}
              style={{ marginBottom: 16 }}
            >
              <Input placeholder="联系人姓名" />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={[{ required: true, message: '请输入联系电话' }]}
              style={{ marginBottom: 16 }}
            >
              <Input placeholder="联系电话" />
            </Form.Item>

            <Form.Item
              name="city"
              rules={[{ required: true, message: '请选择城市' }]}
              style={{ marginBottom: role === 'merchant' ? 16 : 24 }}
            >
              <Select placeholder="所在城市">
                {['北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '西安', '重庆'].map(city => (
                  <Option key={city} value={city}>{city}</Option>
                ))}
              </Select>
            </Form.Item>

            {role === 'merchant' && (
              <>
                <Form.Item
                  name="company_name"
                  rules={[{ required: true, message: '请输入商家名称' }]}
                  style={{ marginBottom: 16 }}
                >
                  <Input prefix={<ShopOutlined />} placeholder="商家名称" />
                </Form.Item>

                <Form.Item
                  name="category"
                  rules={[{ required: true, message: '请选择服务类别' }]}
                  style={{ marginBottom: 24 }}
                >
                  <Select placeholder="服务类别">
                    <Option value="photography">婚纱摄影</Option>
                    <Option value="emcee">司仪主持</Option>
                    <Option value="hotel">婚宴酒店</Option>
                    <Option value="wedding_dress">婚纱礼服</Option>
                  </Select>
                </Form.Item>
              </>
            )}

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: 44,
                  fontSize: 16,
                  background: 'linear-gradient(135deg, #ff4d6d 0%, #ff7875 100%)',
                  border: 'none',
                  borderRadius: 8
                }}
              >
                注册
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">
                已有账号？ <Link to="/login" style={{ color: '#ff4d6d' }}>立即登录</Link>
              </Text>
            </div>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default Register;
