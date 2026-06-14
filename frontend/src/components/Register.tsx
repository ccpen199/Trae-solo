import { Form, Input, Button, Card, Radio, Typography, Space, Row, Col, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, BankOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { auth } from '../api/endpoints';
import { setToken, setUser } from '../utils/auth';
import type { UserRole } from '../types';
import { useEffect } from 'react';

const { Title, Text } = Typography;

interface RegisterForm {
  role: Exclude<UserRole, 'admin'>;
  companyName?: string;
  industry?: string;
  name?: string;
  phone?: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<RegisterForm>();
  const role = Form.useWatch('role', form);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'enterprise' || roleParam === 'jobseeker') {
      form.setFieldsValue({ role: roleParam });
    }
  }, [searchParams, form]);

  const handleSubmit = async (values: RegisterForm) => {
    const { confirmPassword, ...registerData } = values;

    try {
      const response: any = await auth.register(registerData);
      const result = response?.data || response;
      setToken(result.token);
      setUser(result.user);
      message.success('注册成功，欢迎加入印刷人才招聘平台');

      navigate('/');
    } catch (error: any) {
      console.error('Register failed:', error);
      message.error(error?.response?.data?.message || '注册失败，请重试');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px',
      }}
    >
      <Card style={{ width: 520, boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>
            注册账号
          </Title>
          <Text type="secondary">加入印刷人才招聘平台</Text>
        </div>

        <Form
          form={form}
          name="register"
          onFinish={handleSubmit}
          initialValues={{ role: 'jobseeker' }}
          size="large"
        >
          <Form.Item
            name="role"
            rules={[{ required: true, message: '请选择注册角色' }]}
          >
            <Radio.Group optionType="button" buttonStyle="solid" style={{ width: '100%' }}>
              <Radio.Button value="jobseeker" style={{ width: '50%', textAlign: 'center' }}>
                求职者
              </Radio.Button>
              <Radio.Button value="enterprise" style={{ width: '50%', textAlign: 'center' }}>
                企业
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          {role === 'enterprise' ? (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="companyName"
                    rules={[{ required: true, message: '请输入公司名称' }]}
                  >
                    <Input prefix={<BankOutlined />} placeholder="公司名称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="industry"
                    rules={[{ required: true, message: '请输入所属行业' }]}
                  >
                    <Input placeholder="所属行业" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          ) : (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    rules={[{ required: true, message: '请输入姓名' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="姓名" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
                    ]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="手机号" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位' },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="密码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
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
                <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              注册
            </Button>
          </Form.Item>
        </Form>

        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <Text type="secondary">已有账号？</Text>
          <Link to="/login">立即登录</Link>
        </Space>
      </Card>
    </div>
  );
};

export default Register;
