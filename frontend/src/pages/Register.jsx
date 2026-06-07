import React, { useState } from 'react';
import { Card, Form, Input, Button, Tabs, message, Space, Typography, InputNumber, Select } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { authAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

function Register() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUserRegister = async (values) => {
    setLoading(true);
    try {
      const res = await authAPI.userRegister(values);
      if (res.data.success) {
        message.success('注册成功，请登录');
        navigate('/login');
      }
    } catch (err) {
      message.error(err.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLawyerRegister = async (values) => {
    setLoading(true);
    try {
      const res = await authAPI.lawyerRegister(values);
      if (res.data.success) {
        message.success('注册成功，请等待资质审核');
        navigate('/login');
      }
    } catch (err) {
      message.error(err.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'user',
      label: '用户注册',
      children: (
        <Form name="user_register" onFinish={handleUserRegister} autoComplete="off">
          <Form.Item name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input prefix={<UserOutlined />} placeholder="姓名" size="large" />
          </Form.Item>
          <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input prefix={<PhoneOutlined />} placeholder="手机号" size="large" />
          </Form.Item>
          <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效邮箱' }]}>
            <Input prefix={<UserOutlined />} placeholder="邮箱" size="large" />
          </Form.Item>
          <Form.Item name="user_type" initialValue="individual">
            <Select size="large">
              <Option value="individual">个人用户</Option>
              <Option value="company">企业用户</Option>
            </Select>
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              用户注册
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'lawyer',
      label: '律师入驻',
      children: (
        <Form name="lawyer_register" onFinish={handleLawyerRegister} autoComplete="off">
          <Form.Item name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input prefix={<UserOutlined />} placeholder="姓名" size="large" />
          </Form.Item>
          <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input prefix={<PhoneOutlined />} placeholder="手机号" size="large" />
          </Form.Item>
          <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效邮箱' }]}>
            <Input prefix={<UserOutlined />} placeholder="邮箱" size="large" />
          </Form.Item>
          <Form.Item name="license_number" rules={[{ required: true, message: '请输入执业证号' }]}>
            <Input prefix={<SafetyCertificateOutlined />} placeholder="律师执业证号" size="large" />
          </Form.Item>
          <Form.Item name="practice_area" rules={[{ required: true, message: '请选择执业领域' }]}>
            <Select size="large" placeholder="选择执业领域">
              <Option value="民商事诉讼">民商事诉讼</Option>
              <Option value="刑事辩护">刑事辩护</Option>
              <Option value="知识产权">知识产权</Option>
              <Option value="公司法务">公司法务</Option>
              <Option value="劳动纠纷">劳动纠纷</Option>
              <Option value="婚姻家庭">婚姻家庭</Option>
              <Option value="房产纠纷">房产纠纷</Option>
              <Option value="合同纠纷">合同纠纷</Option>
            </Select>
          </Form.Item>
          <Form.Item name="years_experience" rules={[{ required: true, message: '请输入执业年限' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="执业年限" size="large" />
          </Form.Item>
          <Form.Item name="bio" rules={[{ required: true, message: '请输入个人简介' }]}>
            <TextArea rows={3} placeholder="个人简介（专业背景、成功案例等）" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              提交入驻申请
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', background: '#f0f2f5', padding: '40px 0' }}>
      <Card style={{ width: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>⚖️ 法智云平台</Title>
          <Typography.Text type="secondary">专业法律服务，就在您身边</Typography.Text>
        </Space>
        <div style={{ marginTop: 32 }}>
          <Tabs items={tabItems} centered />
        </div>
      </Card>
    </div>
  );
}

export default Register;
