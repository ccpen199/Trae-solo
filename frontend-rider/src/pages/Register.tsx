import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Select, message } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

const { Option } = Select;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSendCode = async () => {
    const phone = form.getFieldValue('phone');
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      message.error('请输入正确的手机号');
      return;
    }

    try {
      await authService.sendCode(phone);
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
      console.error('Send code error:', error);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await authService.register(values);
      message.success('注册成功，请登录');
      navigate('/login');
    } catch (error) {
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-blue-500 to-blue-600 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-center mb-6">骑手注册</h2>

          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item
              name="name"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="请输入真实姓名"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="请输入手机号"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="code"
              rules={[{ required: true, message: '请输入验证码' }]}
            >
              <div className="flex gap-2">
                <Input
                  prefix={<SafetyCertificateOutlined className="text-gray-400" />}
                  placeholder="验证码"
                  size="large"
                  maxLength={6}
                />
                <Button
                  type="default"
                  size="large"
                  onClick={handleSendCode}
                  disabled={countdown > 0}
                  style={{ minWidth: 120 }}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </Button>
              </div>
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' },
              ]}
              hasFeedback
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="请设置密码"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
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
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="请确认密码"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="vehicleType"
              rules={[{ required: true, message: '请选择车辆类型' }]}
            >
              <Select
                prefix={<CarOutlined className="text-gray-400" />}
                placeholder="请选择车辆类型"
                size="large"
              >
                <Option value="electric_scooter">电动车</Option>
                <Option value="motorcycle">摩托车</Option>
                <Option value="car">汽车</Option>
                <Option value="bicycle">自行车</Option>
                <Option value="walk">步行</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="vehiclePlate"
              rules={[{ required: true, message: '请输入车牌号' }]}
            >
              <Input
                prefix={<CarOutlined className="text-gray-400" />}
                placeholder="请输入车牌号（如有）"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
              >
                注册
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center text-sm text-gray-500">
            已有账号？
            <Link to="/login" className="text-blue-500 ml-1">立即登录</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
