import { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, Checkbox, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, getCaptcha, getPermissions } from '@/services/api/auth';
import { useUserStore } from '@/stores/useUserStore';
import { usePermissionStore } from '@/stores/usePermissionStore';
import { encryptMD5 } from '@/utils/crypto';
import type { CaptchaData } from '@/services/api/auth';

interface LoginFormData {
  username: string;
  password: string;
  captcha: string;
  remember: boolean;
}

export default function LoginForm() {
  const [form] = Form.useForm<LoginFormData>();
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken: setStoreToken, setUserInfo } = useUserStore();
  const { setRoutes, setButtons } = usePermissionStore();

  const [loading, setLoading] = useState(false);
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const fetchCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    try {
      const res = await getCaptcha();
      if (res.code === 200 && res.data) {
        setCaptchaData(res.data);
      }
    } catch {
      message.error('获取验证码失败');
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  const handleSubmit = async (values: LoginFormData) => {
    if (!captchaData) {
      message.warning('请先获取验证码');
      return;
    }

    setLoading(true);
    try {
      const res = await login({
        username: values.username,
        password: values.password,
        captchaId: captchaData.captchaId,
        captcha: values.captcha,
        smsCode: '123456',
        phone: '13800138000',
      });

      if (res.code === 200 && res.data) {
        const { token, userInfo } = res.data;

        setStoreToken(token);
        setUserInfo(userInfo);
        localStorage.setItem('token', token);

        try {
          const permRes = await getPermissions();
          if (permRes.code === 200 && permRes.data) {
            setRoutes(permRes.data.routes);
            setButtons(permRes.data.buttons);
          }
        } catch {
          console.warn('获取权限数据失败，使用默认权限');
        }

        if (values.remember) {
          localStorage.setItem('remembered_username', values.username);
        }

        message.success('登录成功');
        const from = (location.state as { from?: string })?.from || '/';
        navigate(from, { replace: true });
      } else {
        message.error(res.message || '登录失败');
        fetchCaptcha();
      }
    } catch {
      message.error('登录失败，请稍后重试');
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('remembered_username');
    if (saved) {
      form.setFieldsValue({ username: saved, remember: true });
    }
  }, [form]);

  return (
    <div className="w-full">
      <Form
        form={form}
        name="login"
        onFinish={handleSubmit}
        autoComplete="off"
        size="large"
        initialValues={{ remember: false }}
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input
            prefix={<UserOutlined className="text-blue-400" />}
            placeholder="请输入用户名"
            className="h-12 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 rounded-xl"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-blue-400" />}
            placeholder="请输入密码"
            className="h-12 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 rounded-xl"
          />
        </Form.Item>

        <div className="flex gap-3 mb-2">
          <Form.Item
            name="captcha"
            className="flex-1 mb-0"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <Input
              placeholder="验证码"
              maxLength={4}
              className="h-12 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 rounded-xl uppercase"
            />
          </Form.Item>

          <div
            className="relative w-28 h-12 rounded-xl overflow-hidden cursor-pointer border border-slate-600 bg-slate-800/50 flex items-center justify-center group"
            onClick={fetchCaptcha}
          >
            {captchaLoading ? (
              <Spin size="small" />
            ) : captchaData ? (
              <>
                <img
                  src={captchaData.captchaImage}
                  alt="验证码"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ReloadOutlined className="text-white text-lg" />
                </div>
              </>
            ) : (
              <span className="text-slate-400 text-xs">点击获取</span>
            )}
          </div>
        </div>

        <Form.Item name="remember" valuePropName="checked" className="mb-4 mt-4">
          <Checkbox className="text-slate-300 [&>.ant-checkbox+span]:text-slate-300">记住用户名</Checkbox>
        </Form.Item>

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            className="h-12 text-lg font-medium rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 border-none shadow-lg shadow-blue-500/30"
          >
            {loading ? '登录中...' : '安全登录'}
          </Button>
        </Form.Item>
      </Form>

      <div className="mt-6 text-center text-xs text-slate-500">
        <p>测试账号：admin / 123456</p>
        <p className="mt-1">验证码：看图输入 · 短信自动填充</p>
      </div>
    </div>
  );
}
