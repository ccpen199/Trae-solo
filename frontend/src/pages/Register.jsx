import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Checkbox, message, Steps, Descriptions, Tag, Typography, Alert, Divider, Row, Col } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  PhoneOutlined,
  IdcardOutlined,
  WalletOutlined,
  TagOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  BankOutlined,
  ShoppingOutlined,
  CarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { authApi, userApi } from '../services/api';

const { Text, Title } = Typography;

const businessSteps = [
  { title: '手机号注册', desc: '手机号即为主身份，无需绑卡', icon: <PhoneOutlined /> },
  { title: '实名认证', desc: '可选填身份证，提升服务权限', icon: <IdcardOutlined /> },
  { title: '开通钱包', desc: '自动开通钱包，支持充值消费', icon: <WalletOutlined /> },
  { title: '领取优惠券', desc: '新用户专享优惠，首单立减', icon: <TagOutlined /> },
  { title: '服务消费', desc: '外卖/打车/缴费/商超全场景', icon: <ShoppingOutlined /> },
];

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [regInfo, setRegInfo] = useState(null);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { confirm, hasBankCard, ...rest } = values;
      const data = { ...rest, hasBankCard: !!hasBankCard };
      const res = await authApi.register(data);
      const result = res.data;

      if (result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('userInfo', JSON.stringify(result.user));
        localStorage.setItem('permissions', JSON.stringify(result.permissions || []));
        localStorage.setItem('workbenchPath', result.workbenchPath || '/orders');
      }

      setRegInfo(result.user);
      setRegistered(true);
      message.success('注册成功！');
    } catch (err) {
      const errMsg = err.response?.data?.error || '注册失败';
      if (errMsg.includes('已注册')) {
        message.error('该手机号已注册，请直接登录');
      } else {
        message.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (registered && regInfo) {
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
        <div style={{ width: 640 }}>
          <Card style={{ borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>注册成功</Title>
              <Text type="secondary">欢迎加入建行本地生活服务平台</Text>
            </div>

            <Alert
              message="非银行卡用户注册成功"
              description={
                regInfo.hasBankCard
                  ? '您已绑定建行卡，可享受银行卡快捷支付。'
                  : '您以非绑卡方式注册，手机号即为主身份标识，可正常使用全部服务。后续可在个人中心绑定银行卡。'
              }
              type={regInfo.hasBankCard ? 'success' : 'info'}
              showIcon
              style={{ marginBottom: 20 }}
            />

            <Descriptions title="账户信息" bordered column={2} size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="手机号（主身份）">
                <Tag color="blue" icon={<PhoneOutlined />}>{regInfo.phone}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="角色">
                <Tag color="orange">{regInfo.role === 'user' ? '普通用户' : regInfo.role === 'admin' ? '管理员' : '商户'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="实名认证">
                <Tag color={regInfo.idCardVerified ? 'green' : 'default'} icon={<IdcardOutlined />}>
                  {regInfo.idCardVerified ? '已认证' : '未认证'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="银行卡绑定">
                <Tag color={regInfo.hasBankCard ? 'green' : 'default'} icon={<BankOutlined />}>
                  {regInfo.hasBankCard ? '已绑定' : '未绑定（免绑卡）'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="钱包余额">
                <Tag icon={<WalletOutlined />}>¥{Number(regInfo.walletBalance || 0).toFixed(2)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="优惠券池">
                <Tag icon={<TagOutlined />}>0 张可用</Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider>注册后可用的业务链路</Divider>

            <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Card size="small" hoverable>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <ShoppingOutlined style={{ color: '#1677ff' }} />
                    <Text strong>餐饮外卖</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>浏览套餐 → 下单 → 餐单+配送单 → 支付</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" hoverable>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <CarOutlined style={{ color: '#52c41a' }} />
                    <Text strong>出行打车</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>叫车 → 计价规则匹配 → 配送单 → 支付</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" hoverable>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <FileTextOutlined style={{ color: '#faad14' }} />
                    <Text strong>政务缴费</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>账单模板 → 缴费单 → 支付单 → 出票</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" hoverable>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <ShoppingOutlined style={{ color: '#722ed1' }} />
                    <Text strong>商超零售</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>选品 → 配送单+支付单 → 履约</Text>
                </Card>
              </Col>
            </Row>

            <div style={{ background: '#fff7e6', borderRadius: 8, padding: '12px 16px', marginBottom: 20, border: '1px solid #ffd591' }}>
              <Text style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                <SafetyCertificateOutlined style={{ marginRight: 4, color: '#fa8c16' }} />下一步建议
              </Text>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                • 前往「个人中心」完成实名认证，解锁更多服务权限
              </Text>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                • 前往「钱包」充值余额，即刻享受便捷支付
              </Text>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                • 浏览「商品」领取新用户专享优惠券
              </Text>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                type="primary"
                size="large"
                block
                onClick={() => {
                  const wb = localStorage.getItem('workbenchPath') || '/orders';
                  navigate(wb, { replace: true });
                }}
              >
                进入工作台
              </Button>
              <Button
                size="large"
                block
                onClick={() => navigate('/login', { replace: true })}
              >
                返回登录
              </Button>
            </div>
          </Card>
        </div>
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
          padding: '40px 60px',
          color: '#fff',
        }}
      >
        <div style={{ maxWidth: 460, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <BankOutlined style={{ fontSize: 40 }} />
            <div>
              <Title level={2} style={{ color: '#fff', margin: 0 }}>免绑卡注册</Title>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>手机号即为主身份，无需绑定银行卡</Text>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, display: 'block', marginBottom: 16 }}>
              注册后业务链路
            </Text>
            <Steps
              direction="vertical"
              size="small"
              current={-1}
              items={businessSteps.map((s) => ({
                title: <Text style={{ color: '#fff', fontSize: 13 }}>{s.title}</Text>,
                description: <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{s.desc}</Text>,
              }))}
            />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 20 }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, display: 'block', marginBottom: 8 }}>
              <SafetyCertificateOutlined style={{ marginRight: 4 }} />银保监合规声明
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block' }}>
              所有资金流水符合银保监穿透式监管要求，风控事件全链路记录可查
            </Text>
          </div>
        </div>
      </div>

      <div
        style={{
          width: 440,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#fff',
          borderTopLeftRadius: 24,
          borderBottomLeftRadius: 24,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ width: 360, padding: '0 20px' }}>
          <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>创建账号</Title>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
            手机号为主身份标识，无需绑定建行卡
          </Text>

          <Form name="register" onFinish={onFinish} size="large" initialValues={{ hasBankCard: false }} autoComplete="off">
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
              <Input.Password prefix={<LockOutlined />} placeholder="密码（至少6位）" />
            </Form.Item>
            <Form.Item
              name="confirm"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
            </Form.Item>
            <Form.Item name="realName">
              <Input prefix={<UserOutlined />} placeholder="真实姓名（选填，用于实名认证）" />
            </Form.Item>
            <Form.Item name="idCard">
              <Input prefix={<IdcardOutlined />} placeholder="身份证号（选填，用于实名认证）" />
            </Form.Item>
            <Form.Item name="hasBankCard" valuePropName="checked">
              <Checkbox>
                <Text type="secondary">是否已绑定建行卡（不绑定也可正常使用全部服务）</Text>
              </Checkbox>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44, fontSize: 16 }}>
                注册
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ margin: '12px 0' }} />

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">已有账号？</Text>
            <Link to="/login" style={{ marginLeft: 4, fontWeight: 600 }}>立即登录</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
