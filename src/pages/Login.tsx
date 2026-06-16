import { useState } from 'react';
import { Form, Input, Button, Checkbox, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const { Password } = Input;

interface LoginFormValues {
  username: string;
  password: string;
  remember: boolean;
}

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [form] = Form.useForm<LoginFormValues>();
  const [caLoading, setCaLoading] = useState(false);

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      const success = await login(values.username, values.password);
      if (success) {
        message.success('登录成功');
        navigate('/');
      } else {
        message.error('用户名或密码错误');
      }
    } catch {
      message.error('登录失败，请稍后重试');
    }
  };

  const handleCaLogin = async () => {
    setCaLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      message.info('省政务云CA登录功能开发中');
    } finally {
      setCaLoading(false);
    }
  };

  const handleForgetPassword = () => {
    message.info('忘记密码功能开发中');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gov-gray-50">
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-primary-300 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full bg-primary-200 blur-2xl transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <SafetyCertificateOutlined className="text-3xl text-white" />
            </div>
            <span className="text-white text-xl font-semibold">政务服务中台</span>
          </div>
          
          <h1 className="text-white text-4xl md:text-5xl font-bold mb-6 leading-tight">
            省级一体化<br />
            政务服务中台
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-md leading-relaxed">
            构建统一、高效、智能的政务服务体系，让数据多跑路，群众少跑腿，全面提升政务服务能力和水平。
          </p>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-8 text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gov-green"></div>
              <span>安全可靠</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gov-green"></div>
              <span>高效便捷</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gov-green"></div>
              <span>智能服务</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="md:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-500 rounded-2xl mb-4 shadow-lg shadow-primary-500/30">
              <SafetyCertificateOutlined className="text-3xl text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gov-gray-700 mb-2">省级一体化政务服务中台</h2>
            <p className="text-gov-gray-400">欢迎登录</p>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-8 md:p-10">
            <div className="hidden md:block mb-8">
              <h2 className="text-2xl font-bold text-gov-gray-700 mb-2">欢迎登录</h2>
              <p className="text-gov-gray-400">请输入您的账号信息</p>
            </div>

            <Form
              form={form}
              name="login"
              onFinish={handleSubmit}
              autoComplete="off"
              size="large"
              layout="vertical"
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' }
                ]}
              >
                <Input
                  prefix={<UserOutlined className="text-gov-gray-400" />}
                  placeholder="请输入用户名"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' }
                ]}
              >
                <Password
                  prefix={<LockOutlined className="text-gov-gray-400" />}
                  placeholder="请输入密码"
                  className="rounded-lg"
                  autoComplete="current-password"
                />
              </Form.Item>

              <div className="flex justify-between items-center mb-6">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox className="text-gov-gray-500">记住我</Checkbox>
                </Form.Item>
                <button
                  type="button"
                  onClick={handleForgetPassword}
                  className="text-primary-500 hover:text-primary-600 text-sm transition-colors"
                >
                  忘记密码？
                </button>
              </div>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  className="w-full h-11 rounded-lg text-base font-medium gov-btn-primary"
                >
                  {isLoading ? '登录中...' : '登 录'}
                </Button>
              </Form.Item>
            </Form>

            <Divider className="my-6">
              <span className="text-gov-gray-400 text-sm">其他登录方式</span>
            </Divider>

            <Button
              icon={<SafetyCertificateOutlined />}
              onClick={handleCaLogin}
              loading={caLoading}
              className="w-full h-11 rounded-lg text-base font-medium border-primary-200 text-primary-600 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 transition-all"
            >
              省政务云CA登录
            </Button>
          </div>

          <div className="text-center mt-8 text-gov-gray-400 text-sm">
            <p>© 2025 省级一体化政务服务中台 版权所有</p>
            <p className="mt-1">技术支持：省大数据中心</p>
          </div>
        </div>
      </div>
    </div>
  );
}
