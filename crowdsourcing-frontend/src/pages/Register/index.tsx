import React, { useState } from 'react';
import { Form, Input, Button, Card, Radio, Steps, message, Space } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  PhoneOutlined,
  BuildOutlined,
  LoadingOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole, RegisterParams } from '@/types';
import { authApi } from '@/api';

const { Step } = Steps;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [form] = Form.useForm();

  const roleOptions = [
    {
      value: 'platform' as UserRole,
      label: '平台运营',
      description: '发布办件、跟踪进度、管理服务',
      icon: '�️'
    },
    {
      value: 'ops' as UserRole,
      label: '运维专员',
      description: '承接办件、提交办理结果',
      icon: '�'
    }
  ];

  const sendVerifyCode = async () => {
    const email = form.getFieldValue('email');
    if (!email) {
      message.warning('请先输入邮箱');
      return;
    }

    try {
      setCodeLoading(true);
      await authApi.sendVerifyCode(email);
      message.success('验证码已发送');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Send verify code error:', error);
    } finally {
      setCodeLoading(false);
    }
  };

  const handleNext = async () => {
    try {
      await form.validateFields(currentStep === 0 ? ['role'] : ['name', 'email', 'verifyCode', 'password']);
      if (currentStep < 2) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (values: RegisterParams & { verifyCode: string }) => {
    try {
      setLoading(true);
      const { verifyCode, ...registerParams } = values;
      await authApi.register(registerParams);
      message.success('注册成功，请登录');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="py-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">请选择您的角色</h3>
            <Form.Item
              name="role"
              rules={[{ required: true, message: '请选择用户类型' }]}
            >
              <Radio.Group className="w-full">
                <Space direction="vertical" className="w-full">
                  {roleOptions.map((option) => (
                    <Radio.Button 
                      key={option.value} 
                      value={option.value}
                      className="w-full !h-auto !py-4 !px-6 !rounded-lg !mb-2 !border-gray-200 hover:!border-primary-500"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{option.icon}</span>
                        <div className="text-left">
                          <div className="font-medium text-gray-800">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.description}</div>
                        </div>
                      </div>
                    </Radio.Button>
                  ))}
                </Space>
              </Radio.Group>
            </Form.Item>
          </div>
        );

      case 1:
        return (
          <div className="py-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">填写账户信息</h3>
            <Form.Item
              name="name"
              label="姓名"
              rules={[{ required: true, message: '请输入真实姓名' }]}
            >
              <Input 
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="请输入真实姓名"
               
              />
            </Form.Item>
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input 
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="请输入邮箱"
               
              />
            </Form.Item>
            <Form.Item
              name="verifyCode"
              label="验证码"
              rules={[{ required: true, message: '请输入验证码' }]}
            >
              <div className="flex gap-2">
                <Input 
                  placeholder="请输入验证码"
                 
                  className="flex-1"
                  maxLength={6}
                />
                <Button 
                 
                  onClick={sendVerifyCode}
                  loading={codeLoading}
                  disabled={countdown > 0}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </Button>
              </div>
            </Form.Item>
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
              hasFeedback
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="请输入密码（至少6个字符）"
               
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="确认密码"
              dependencies={['password']}
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
              hasFeedback
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="请再次输入密码"
               
              />
            </Form.Item>
            <Form.Item
              name="phone"
              label="手机号码（选填）"
              rules={[
                { 
                  pattern: /^1[3-9]\d{9}$/, 
                  message: '请输入有效的手机号码',
                  validateTrigger: 'onBlur'
                }
              ]}
            >
              <Input 
                prefix={<PhoneOutlined className="text-gray-400" />}
                placeholder="请输入手机号码"
               
              />
            </Form.Item>
            <Form.Item
              name="company"
              label="所属部门（选填）"
            >
              <Input 
                prefix={<BuildOutlined className="text-gray-400" />}
                placeholder="请输入所属部门或单位"
               
              />
            </Form.Item>
          </div>
        );

      case 2:
        return (
          <div className="py-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircleOutlined className="text-4xl text-green-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">确认注册信息</h3>
            <p className="text-gray-500 mb-6">请确认以下注册信息无误</p>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">用户类型：</span>
                  <span className="text-gray-800 font-medium">
                    {form.getFieldValue('role') === 'platform' ? '平台运营' : '运维专员'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">名称：</span>
                  <span className="text-gray-800 font-medium">{form.getFieldValue('name')}</span>
                </div>
                <div>
                  <span className="text-gray-500">邮箱：</span>
                  <span className="text-gray-800 font-medium">{form.getFieldValue('email')}</span>
                </div>
                {form.getFieldValue('phone') && (
                  <div>
                    <span className="text-gray-500">手机：</span>
                    <span className="text-gray-800 font-medium">{form.getFieldValue('phone')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="shadow-xl">
      <Steps current={currentStep} className="mb-6">
        <Step title="选择角色" />
        <Step title="填写信息" />
        <Step title="完成注册" />
      </Steps>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        {renderStepContent()}

        <div className="flex justify-between mt-6">
          {currentStep > 0 ? (
            <Button 
              onClick={handlePrev}
              icon={<ArrowLeftOutlined />}
             
            >
              上一步
            </Button>
          ) : (
            <div />
          )}
          
          {currentStep < 2 ? (
            <Button 
              type="primary" 
              onClick={handleNext}
             
            >
              下一步
            </Button>
          ) : (
            <Button 
              type="primary" 
              htmlType="submit"
             
              loading={loading}
              icon={loading && <LoadingOutlined />}
            >
              完成注册
            </Button>
          )}
        </div>

        <div className="text-center text-gray-500 mt-6">
          已有账户？
          <Link to="/login" className="text-primary-700 hover:text-primary-800 font-medium ml-1">
            立即登录
          </Link>
        </div>
      </Form>
    </Card>
  );
};

export default Register;
