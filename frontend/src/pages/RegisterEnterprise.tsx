import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, BankOutlined, IdcardOutlined, EnvironmentOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const { Title, Text } = Typography;

interface RegisterEnterpriseForm {
  username: string;
  password: string;
  confirmPassword: string;
  realName: string;
  phone: string;
  companyName: string;
  unifiedCreditCode: string;
  legalRepresentative: string;
  companyAddress: string;
}

const RegisterEnterprise: React.FC = () => {
  const [form] = Form.useForm<RegisterEnterpriseForm>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: RegisterEnterpriseForm) => {
    const { confirmPassword, ...submitData } = values;
    setLoading(true);
    try {
      await api.auth.registerEnterprise(submitData);
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
      <div style={{ width: '100%', maxWidth: 700 }}>
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
            <BankOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
            <Title level={3} style={{ margin: 0 }}>企业注册</Title>
            <Text type="secondary">填写企业信息完成注册</Text>
          </div>

          <Form
            form={form}
            name="registerEnterprise"
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
            size="large"
          >
            <Title level={5} style={{ color: '#1890ff', marginTop: 0 }}>账号信息</Title>
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
                  label="联系人姓名"
                  rules={[
                    { required: true, message: '请输入联系人姓名' },
                    { pattern: /^[\u4e00-\u9fa5]{2,10}$/, message: '请输入2-10个中文字符' }
                  ]}
                >
                  <Input placeholder="请输入联系人姓名" />
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

            <Form.Item
              name="phone"
              label="联系电话"
              rules={[
                { required: true, message: '请输入联系电话' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
              ]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="请输入联系电话" />
            </Form.Item>

            <Title level={5} style={{ color: '#1890ff', marginTop: '16px' }}>企业信息</Title>
            <Form.Item
              name="companyName"
              label="企业名称"
              rules={[
                { required: true, message: '请输入企业名称' },
                { min: 2, max: 100, message: '企业名称长度为2-100个字符' }
              ]}
            >
              <Input prefix={<BankOutlined />} placeholder="请输入企业全称" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="unifiedCreditCode"
                  label="统一社会信用代码"
                  rules={[
                    { required: true, message: '请输入统一社会信用代码' },
                    { pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, message: '请输入正确的18位统一社会信用代码' }
                  ]}
                >
                  <Input prefix={<IdcardOutlined />} placeholder="请输入18位统一社会信用代码" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="legalRepresentative"
                  label="法定代表人"
                  rules={[
                    { required: true, message: '请输入法定代表人姓名' },
                    { pattern: /^[\u4e00-\u9fa5]{2,10}$/, message: '请输入2-10个中文字符' }
                  ]}
                >
                  <Input placeholder="请输入法定代表人姓名" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="companyAddress"
              label="企业地址"
              rules={[
                { required: true, message: '请输入企业地址' },
                { min: 5, max: 200, message: '地址长度为5-200个字符' }
              ]}
            >
              <Input prefix={<EnvironmentOutlined />} placeholder="请输入详细地址" />
            </Form.Item>

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

export default RegisterEnterprise;
