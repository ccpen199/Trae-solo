import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Card, message, Space, Divider, Alert, Tag } from 'antd';
import { UserOutlined, LockOutlined, LoadingOutlined, SafetyCertificateOutlined, IdcardOutlined, FileProtectOutlined, BankOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { LoginParams } from '@/types';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: LoginParams & { remember: boolean }) => {
    try {
      setLoading(true);
      const { remember, ...loginParams } = values;
      const result = await login(loginParams);
      
      if (remember) {
        localStorage.setItem('rememberedEmail', loginParams.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      message.success('登录成功，正在进入工作台...');
      
      const role = result.user.role || result.user.userType;
      switch (role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'platform':
          navigate('/platform/dashboard');
          break;
        case 'ops':
          navigate('/ops/dashboard');
          break;
        default:
          message.warning('未知角色类型，请联系管理员');
          navigate('/hall');
      }
    } catch (error: any) {
      const errMsg = error?.message || '登录失败，请检查账号密码';
      if (errMsg.includes('用户不存在')) {
        message.error('账号不存在，请检查邮箱地址');
      } else if (errMsg.includes('密码错误')) {
        message.error('密码错误，请重新输入');
      } else if (errMsg.includes('禁用')) {
        message.error('账号已被禁用，请联系管理员');
      } else if (errMsg.includes('权限')) {
        message.error('权限不足，无法登录该系统');
      } else {
        message.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const rememberedEmail = localStorage.getItem('rememberedEmail');
  const demoAccounts = [
    { label: '管理员', email: 'admin@example.com', password: 'admin123456', role: 'admin', desc: '全量办件管理/运营监控/合规审计' },
    { label: '平台运营', email: 'platform@example.com', password: '123456', role: 'platform', desc: '办件发布/证照管理/数据中心' },
    { label: '运维专员', email: 'ops@example.com', password: '123456', role: 'ops', desc: '承办办件/办理结果/反馈复查' },
  ];

  const roleColors: Record<string, string> = {
    admin: 'red',
    platform: 'blue',
    ops: 'green',
  };

  const fillDemo = (account: typeof demoAccounts[number]) => {
    form.setFieldsValue({
      email: account.email,
      password: account.password,
      remember: true,
    });
  };

  return (
    <Card className="shadow-xl">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">统一用户中心</h2>
        <p className="text-gray-500 text-sm">登录城市服务中枢工作台</p>
      </div>

      <Alert
        type="info"
        showIcon
        icon={<SafetyCertificateOutlined />}
        message="实名认证体系"
        description={
          <div className="text-xs">
            <div className="flex items-center gap-1 mb-1"><IdcardOutlined /> 登录即代表同意实名认证规范</div>
            <div className="flex items-center gap-1 mb-1"><FileProtectOutlined /> 电子证照归集于个人工作台</div>
            <div className="flex items-center gap-1"><BankOutlined /> 角色权限：管理员/平台运营/运维专员</div>
          </div>
        }
        className="mb-4"
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ 
          email: rememberedEmail || 'platform@example.com',
          password: '123456',
          remember: true
        }}
      >
        <Form.Item
          name="email"
          label="账号 / 邮箱"
          rules={[
            { required: true, message: '请输入账号或邮箱' }
          ]}
        >
          <Input 
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="请输入账号或邮箱"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[
            { required: true, message: '请输入密码' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="请输入密码"
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item name="remember" valuePropName="checked">
          <Checkbox className="text-gray-600">记住我</Checkbox>
        </Form.Item>

        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-2">快速填充演示账号：</div>
          <Space wrap size="small">
            {demoAccounts.map((account) => (
              <Button key={account.email} size="small" onClick={() => fillDemo(account)}>
                <Tag color={roleColors[account.role]} className="mr-1" style={{ marginRight: 4 }}>{account.label}</Tag>
                {account.desc.substring(0, 6)}...
              </Button>
            ))}
          </Space>
        </div>

        <Form.Item>
          <button
            type="submit"
            className="h-10 w-full rounded-md bg-primary-700 font-medium text-white transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <LoadingOutlined /> 登录中
              </span>
            ) : (
              '登录工作台'
            )}
          </button>
        </Form.Item>

        <Divider className="!my-3">
          <span className="text-xs text-gray-400">更多入口</span>
        </Divider>

        <div className="flex justify-between text-center text-xs">
          <Link to="/hall" className="text-primary-700 hover:text-primary-800">
            <div className="flex flex-col items-center gap-1">
              <BankOutlined className="text-lg" />
              <span>返回办事大厅</span>
            </div>
          </Link>
          <Link to="/hall/feedback" className="text-primary-700 hover:text-primary-800">
            <div className="flex flex-col items-center gap-1">
              <FileProtectOutlined className="text-lg" />
              <span>市民反馈</span>
            </div>
          </Link>
          <Link to="/register" className="text-primary-700 hover:text-primary-800">
            <div className="flex flex-col items-center gap-1">
              <IdcardOutlined className="text-lg" />
              <span>注册新账号</span>
            </div>
          </Link>
        </div>
      </Form>
    </Card>
  );
};

export default Login;
