import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, message, Alert, Divider, Tag, Row, Col, Typography, Space, Spin, Result, Card } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  OrderedListOutlined,
  BankOutlined,
  PhoneOutlined,
  ArrowRightOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { authApi } from '../services/api';

const { Text, Title } = Typography;

const demoAccounts = [
  {
    role: 'admin',
    label: '审核运营',
    phone: '13800000001',
    password: 'admin123',
    icon: <AuditOutlined />,
    color: '#1677ff',
    desc: '商户入驻审核→费率配置→异常仲裁→数据报表',
    workbench: '/providers/audit',
    entrances: ['服务商审核', '费率配置', '异常订单仲裁', '数据报表', '风控事件'],
  },
  {
    role: 'merchant',
    label: '商户运营',
    phone: '13800000002',
    password: 'merchant123',
    icon: <ShopOutlined />,
    color: '#52c41a',
    desc: '商品上架管理→订单履约→服务商入驻',
    workbench: '/products',
    entrances: ['服务商入驻', '商品上架', '订单履约'],
  },
  {
    role: 'user',
    label: '普通用户',
    phone: '13800000003',
    password: 'user123',
    icon: <ShoppingCartOutlined />,
    color: '#faad14',
    desc: '外卖下单→打车出行→政务缴费→商超零售',
    workbench: '/orders',
    entrances: ['外卖下单', '打车出行', '政务缴费', '商超零售', '钱包充值', '优惠券', '订单查询', '资金流水'],
  },
];

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [loginErrorCode, setLoginErrorCode] = useState(null);
  const [quickLoading, setQuickLoading] = useState(null);
  const [loginSuccess, setLoginSuccess] = useState(null);
  const navigate = useNavigate();

  const doLogin = useCallback(async (values, quickRole) => {
    if (quickRole) setQuickLoading(quickRole);
    else setLoading(true);
    setLoginError(null);
    setLoginErrorCode(null);
    setLoginSuccess(null);

    try {
      const res = await authApi.login(values);
      const data = res.data;
      const token = data.token;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('userInfo', JSON.stringify(data.user));
        localStorage.setItem('permissions', JSON.stringify(data.permissions || []));
        localStorage.setItem('workbenchPath', data.workbenchPath || '/dashboard');
        localStorage.setItem('loginTime', Date.now().toString());

        const roleMap = { admin: '审核运营', merchant: '商户运营', user: '普通用户' };
        const target = data.workbenchPath || '/dashboard';

        setLoginSuccess({
          role: roleMap[data.user.role] || '用户',
          phone: data.user.phone,
          target,
          permissions: data.permissions || [],
          hasBankCard: data.user.hasBankCard,
        });

        message.success(`登录成功，欢迎${roleMap[data.user.role] || ''} ${data.user.phone}`);

        setTimeout(() => {
          window.location.href = target;
        }, 800);
      } else {
        setLoginError('登录失败：服务器未返回认证令牌，请联系管理员');
        setLoginErrorCode('NO_TOKEN');
        message.error('登录失败：服务器未返回认证令牌');
      }
    } catch (err) {
      const status = err.response?.status;
      const errData = err.response?.data;
      const errMsg = errData?.error || '';
      const errCode = errData?.code;

      if (status === 401 && errCode === 'AUTH_FAILED') {
        setLoginError('账号校验失败：手机号或密码不匹配');
        setLoginErrorCode('AUTH_FAILED');
        message.warning('账号校验失败：请检查手机号和密码');
      } else if (status === 403 && errCode === 'ACCOUNT_DISABLED') {
        setLoginError('风控拦截：该账号已被管理员禁用');
        setLoginErrorCode('ACCOUNT_DISABLED');
        message.error('风控拦截：账号已被禁用，申诉请拨打 95533');
      } else if (status === 400) {
        const detail = Array.isArray(errData?.errors) ? errData.errors.map((e) => e.msg).join('；') : errMsg;
        setLoginError(detail || '请求参数错误');
        setLoginErrorCode('BAD_REQUEST');
        message.warning(detail || '参数校验失败');
      } else if (err.code === 'ECONNABORTED' || !err.response) {
        setLoginError('网络异常：无法连接到服务端，请检查网络或稍后重试');
        setLoginErrorCode('NETWORK_ERROR');
        message.error('网络异常：连接服务器超时');
      } else if (status >= 500) {
        setLoginError(`服务端异常（HTTP ${status}）：${errMsg || '系统内部错误'}`);
        setLoginErrorCode('SERVER_ERROR');
        message.error('服务端异常，请稍后重试');
      } else {
        setLoginError(errMsg || `登录失败（HTTP ${status || 'unknown'}）`);
        setLoginErrorCode('UNKNOWN_ERROR');
        message.error(errMsg || '登录失败');
      }
    } finally {
      setLoading(false);
      setQuickLoading(null);
    }
  }, [navigate]);

  const onFinish = (values) => doLogin(values, null);

  const handleQuickLogin = (account) => {
    doLogin({ phone: account.phone, password: account.password }, account.role);
  };

  const getErrorAlert = () => {
    if (!loginError) return null;

    const alertMap = {
      AUTH_FAILED: {
        type: 'warning',
        message: '账号校验失败',
        description: (
          <div>
            <div>手机号或密码不匹配，请检查后重新输入。</div>
            <div style={{ marginTop: 6 }}>
              <Text type="warning" style={{ fontSize: 12 }}>• 连续输错5次将触发风控锁定</Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>• 如忘记密码可通过「免绑卡注册」重新创建</Text>
            </div>
          </div>
        ),
      },
      ACCOUNT_DISABLED: {
        type: 'error',
        message: '风控拦截：账号已禁用',
        description: (
          <div>
            <div>该账号已被管理员禁用，所有操作已暂停。</div>
            <div style={{ marginTop: 6 }}>
              <Text type="danger" style={{ fontSize: 12 }}>• 申诉请拨打建行客服热线 95533</Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>• 所有资金流水受银保监穿透式监管保护，可申请复核</Text>
            </div>
          </div>
        ),
      },
      NETWORK_ERROR: {
        type: 'error',
        message: '网络连接异常',
        description: (
          <div>
            <div>无法连接到服务端，请检查网络或稍后重试。</div>
            <div style={{ marginTop: 6 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>• 如持续出现请联系技术支持</Text>
            </div>
          </div>
        ),
      },
      BAD_REQUEST: {
        type: 'warning',
        message: '参数校验失败',
        description: loginError,
      },
      SERVER_ERROR: {
        type: 'error',
        message: '服务端异常',
        description: loginError,
      },
      NO_TOKEN: {
        type: 'error',
        message: '认证失败',
        description: loginError,
      },
    };

    const cfg = alertMap[loginErrorCode] || { type: 'error', message: '登录失败', description: loginError };

    return (
      <Alert
        message={cfg.message}
        description={cfg.description}
        type={cfg.type}
        showIcon
        closable
        onClose={() => setLoginError(null)}
        style={{ marginBottom: 16 }}
      />
    );
  };

  if (loginSuccess) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #003087 0%, #0050b3 40%, #1a4fa0 100%)',
        }}
      >
        <Card style={{ width: 480, borderRadius: 12 }}>
          <Result
            status="success"
            title={`欢迎，${loginSuccess.role}`}
            subTitle={`${loginSuccess.phone} 登录成功，正在进入工作台...`}
            icon={<LoadingOutlined style={{ color: '#52c41a', fontSize: 48 }} />}
            extra={[
              <Button type="primary" icon={<ArrowRightOutlined />} key="go">
                正在跳转至 {loginSuccess.target}
              </Button>,
            ]}
          />
          <Divider>工作台入口</Divider>
          <Row gutter={[8, 8]}>
            {loginSuccess.entrances?.map((e) => (
              <Col span={12} key={e}>
                <Tag color="blue" style={{ width: '100%', textAlign: 'center', padding: '6px 12px', fontSize: 13 }}>
                  {e}
                </Tag>
              </Col>
            ))}
          </Row>
          <Divider style={{ margin: '12px 0' }} />
          {loginSuccess.hasBankCard === false && (
            <Alert
              message="免绑卡用户"
              description="您以非银行卡方式注册，可正常使用全部服务。如需绑卡可在个人中心操作。"
              type="info"
              showIcon
              size="small"
            />
          )}
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #003087 0%, #0050b3 40%, #1a4fa0 100%)',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px 48px',
          color: '#fff',
        }}
      >
        <div style={{ maxWidth: 520, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <BankOutlined style={{ fontSize: 42 }} />
            <div>
              <Title level={2} style={{ color: '#fff', margin: 0 }}>建行本地生活服务中台</Title>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>中国建设银行 · 本地生活服务聚合平台</Text>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, display: 'block', marginBottom: 12 }}>
              四大核心场景 · 银保监穿透式监管
            </Text>
            <Row gutter={[10, 10]}>
              <Col span={12}>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px' }}>
                  <ShoppingCartOutlined style={{ marginRight: 6 }} />餐饮外卖
                </div>
              </Col>
              <Col span={12}>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px' }}>
                  <OrderedListOutlined style={{ marginRight: 6 }} />出行打车
                </div>
              </Col>
              <Col span={12}>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px' }}>
                  <SafetyCertificateOutlined style={{ marginRight: 6 }} />政务缴费
                </div>
              </Col>
              <Col span={12}>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px' }}>
                  <ShopOutlined style={{ marginRight: 6 }} />商超零售
                </div>
              </Col>
            </Row>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 20 }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, display: 'block', marginBottom: 12 }}>
              角色工作台与业务入口
            </Text>
            {demoAccounts.map((a) => (
              <div key={a.role} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {a.icon}
                  <Text style={{ color: '#fff', fontWeight: 600 }}>{a.label}</Text>
                  <Tag color={a.color} style={{ marginLeft: 8 }}>
                    → {a.workbench}
                  </Tag>
                </div>
                <div style={{ paddingLeft: 30, flexWrap: 'wrap', display: 'flex', gap: 4 }}>
                  {a.entrances.map((e) => (
                    <Tag key={e} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', fontSize: 11 }}>
                      {e}
                    </Tag>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          width: 440,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#fff',
          borderTopLeftRadius: 24,
          borderBottomLeftRadius: 24,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ width: 360, padding: '0 20px' }}>
          <Title level={3} style={{ textAlign: 'center', marginBottom: 6 }}>账号登录</Title>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 20 }}>
            手机号为主身份，支持非建行卡用户免绑卡登录
          </Text>

          {getErrorAlert()}

          <Form name="login" onFinish={onFinish} size="large" autoComplete="off" initialValues={{ phone: '', password: '' }}>
            <Form.Item
              name="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1\d{10}$/, message: '请输入正确的11位手机号' },
              ]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="手机号（主身份标识）" maxLength={11} />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: 44, fontSize: 16 }}
                icon={loading ? <LoadingOutlined /> : null}
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ margin: '8px 0 16px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>演示账号一键登录</Text>
          </Divider>

          <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
            {demoAccounts.map((account) => (
              <Button
                key={account.role}
                block
                size="middle"
                icon={quickLoading === account.role ? <LoadingOutlined /> : account.icon}
                loading={quickLoading === account.role}
                disabled={!!quickLoading}
                style={{
                  textAlign: 'left',
                  height: 50,
                  borderColor: account.color,
                  color: account.color,
                  borderWidth: 1.5,
                }}
                onClick={() => handleQuickLogin(account)}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>{account.label}</span>
                <span style={{ color: '#999', fontSize: 11, marginLeft: 8 }}>
                  {account.phone} · 直达 {account.workbench}
                </span>
                <ArrowRightOutlined style={{ float: 'right', color: account.color, marginTop: 4 }} />
              </Button>
            ))}
          </Space>

          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <Text type="secondary">还没有账号？</Text>
            <Link to="/register" style={{ marginLeft: 4, fontWeight: 600 }}>免绑卡注册</Link>
          </div>

          <div style={{ background: '#f6f8fa', borderRadius: 8, padding: '10px 14px' }}>
            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 3 }}>
              <SafetyCertificateOutlined style={{ marginRight: 4 }} />安全与合规
            </Text>
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
              • 所有资金流水符合银保监穿透式监管要求
            </Text>
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
              • 异常登录将触发风控事件记录并可复查
            </Text>
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
              • 非建行卡用户可正常使用全部服务
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
