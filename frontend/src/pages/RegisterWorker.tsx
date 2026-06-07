import React, { useState } from 'react';
import { Form, Input, Button, Card, Select, DatePicker, message, Typography, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, IdcardOutlined, ArrowLeftOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { api } from '../api';

const { Title, Text } = Typography;
const { Option } = Select;

interface RegisterWorkerForm {
  username: string;
  password: string;
  confirmPassword: string;
  realName: string;
  phone: string;
  idCard: string;
  gender: string;
  birthDate: dayjs.Dayjs;
  education: string;
}

const RegisterWorker: React.FC = () => {
  const [form] = Form.useForm<RegisterWorkerForm>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: RegisterWorkerForm) => {
    const { confirmPassword, birthDate, ...submitData } = values;
    setLoading(true);
    try {
      await api.auth.registerWorker({
        ...submitData,
        birthDate: birthDate.format('YYYY-MM-DD')
      });
      message.success('注册成功，请登录');
      navigate('/login');
    } catch (error: any) {
      message.error(error.response?.data?.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/login');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: 600 }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          style={{ color: 'white', marginBottom: '16px' }}
        >
          返回登录
        </Button>
        <Card className="card-shadow">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <TeamOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
            <Title level={3} style={{ margin: 0 }}>工人注册</Title>
            <Text type="secondary">填写个人信息完成注册</Text>
          </div>

          <Form
            form={form}
            name="registerWorker"
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
            size="large"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="username"
                  label="用户名"
                  rules={[
                    { required: true, message: '请输入用户名' },
                    { min: 4, max: 20, message: '用户名长度为4-20个字符' }
                  ]}
                >
                  <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="realName"
                  label="真实姓名"
                  rules={[
                    { required: true, message: '请输入真实姓名' },
                    { pattern: /^[\u4e00-\u9fa5]{2,10}$/, message: '请输入2-10个中文字符' }
                  ]}
                >
                  <Input placeholder="请输入真实姓名" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label="密码"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, max: 20, message: '密码长度为6-20个字符' }
                  ]}
                  hasFeedback
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="confirmPassword"
                  label="确认密码"
                  dependencies={['password']}
                  hasFeedback
                  rules={[
                    { required: true, message: '请确认密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'));
                      }
                    })
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="手机号码"
                  rules={[
                    { required: true, message: '请输入手机号码' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
                  ]}
                >
                  <Input prefix={<PhoneOutlined />} placeholder="请输入手机号码" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="idCard"
                  label="身份证号"
                  rules={[
                    { required: true, message: '请输入身份证号' },
                    { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号' }
                  ]}
                >
                  <Input prefix={<IdcardOutlined />} placeholder="请输入身份证号" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="gender"
                  label="性别"
                  rules={[{ required: true, message: '请选择性别' }]}
                >
                  <Select placeholder="请选择性别">
                    <Option value="male">男</Option>
                    <Option value="female">女</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="birthDate"
                  label="出生日期"
                  rules={[{ required: true, message: '请选择出生日期' }]}
                >
                  <DatePicker 
                    style={{ width: '100%' }} 
                    placeholder="请选择日期"
                    disabledDate={(current) => current && current > dayjs().endOf('day')}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="education"
                  label="学历"
                  rules={[{ required: true, message: '请选择学历' }]}
                >
                  <Select placeholder="请选择学历">
                    <Option value="primary">小学</Option>
                    <Option value="junior">初中</Option>
                    <Option value="senior">高中</Option>
                    <Option value="college">大专</Option>
                    <Option value="bachelor">本科</Option>
                    <Option value="master">硕士</Option>
                    <Option value="doctor">博士</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginTop: '24px' }}>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                注册
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">
                已有账号？<a onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>立即登录</a>
              </Text>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default RegisterWorker;
