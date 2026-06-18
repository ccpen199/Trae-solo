import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  List,
  Space,
  Typography,
  Button,
  Tag,
  Modal,
  Radio,
  Descriptions,
  Skeleton,
  Empty,
  Divider,
  Statistic,
  Tooltip,
  Alert,
} from 'antd';
import {
  WalletOutlined,
  FireOutlined,
  CalendarOutlined,
  PlusOutlined,
  GiftOutlined,
  EyeOutlined,
  ReloadOutlined,
  PayCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { orderApi, ecoApi } from '@/api';
import type { Order } from '@/types';
import { DEVICE_TYPE_MAP, DEVICE_TYPE_COLORS, DEVICE_TYPE_ICONS } from '@/utils/constants';
import { formatPrice, formatDateTime, formatRelativeTime } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';

const { Title, Text } = Typography;
const { Group: RadioGroup, Button: RadioButton } = Radio;

const RECHARGE_AMOUNTS = [50, 100, 200, 500, 1000];

const PAYMENT_METHODS = [
  { value: 'wechat', label: '微信支付', icon: '💚', color: '#07c160' },
  { value: 'alipay', label: '支付宝', icon: '💙', color: '#1677ff' },
  { value: 'balance', label: '余额支付', icon: '💰', color: '#faad14' },
];

const ResidentWallet: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>(null);
  const [ecoStatus, setEcoStatus] = useState<any>(null);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('wechat');
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [myVouchersCount, setMyVouchersCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [walletRes, ecoRes, vouchersRes] = await Promise.all([
        orderApi.getWallet(),
        ecoApi.getMyEcoStatus(),
        ecoApi.getMyVouchers(),
      ]);

      if (walletRes.success) {
        setWallet(walletRes.data);
      }
      if (ecoRes.success) {
        setEcoStatus(ecoRes.data);
      }
      if (vouchersRes.success) {
        setMyVouchersCount(vouchersRes.data?.total || 0);
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async () => {
    const amount = customAmount || selectedAmount;
    if (!amount || amount <= 0) {
      showNotification('warning', '请选择或输入充值金额');
      return;
    }

    try {
      setRechargeLoading(true);
      const response = await orderApi.recharge({
        amount,
        paymentMethod,
      });

      if (response.success) {
        showNotification('success', `充值成功，已到账 ${formatPrice(amount)}`);
        setRechargeModalVisible(false);
        loadData();
        resetRechargeForm();
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || '充值失败');
    } finally {
      setRechargeLoading(false);
    }
  };

  const resetRechargeForm = () => {
    setSelectedAmount(100);
    setCustomAmount(null);
    setPaymentMethod('wechat');
  };

  const getTransactionIcon = (order: Order) => {
    if (order.orderType === 'recharge') {
      return <PlusOutlined style={{ color: '#52c41a' }} />;
    }
    if (order.orderType === 'refund') {
      return <PayCircleOutlined style={{ color: '#722ed1' }} />;
    }
    const deviceType = order.device?.deviceType;
    if (deviceType) {
      return (
        <span style={{ fontSize: '16px' }}>
          {DEVICE_TYPE_ICONS[deviceType]}
        </span>
      );
    }
    return <WalletOutlined style={{ color: '#1890ff' }} />;
  };

  const getTransactionAmount = (order: Order) => {
    if (order.orderType === 'recharge' || order.orderType === 'refund') {
      return (
        <Text strong style={{ color: '#52c41a' }}>
          +{formatPrice(order.amount)}
        </Text>
      );
    }
    return (
      <Text strong style={{ color: '#ff4d4f' }}>
        -{formatPrice(order.amount)}
      </Text>
    );
  };

  const getTransactionTitle = (order: Order) => {
    if (order.orderType === 'recharge') return '账户充值';
    if (order.orderType === 'refund') return '退款';
    if (order.orderType === 'penalty') return '违约金';
    const deviceType = order.device?.deviceType;
    if (deviceType) {
      return `${DEVICE_TYPE_MAP[deviceType]}使用`;
    }
    return order.orderType;
  };

  return (
    <div className="page-container">
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <>
          <Card
            className="card-shadow"
            style={{
              marginBottom: 24,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
            }}
            bodyStyle={{ padding: '32px 24px' }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space align="center" size={16}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                    }}
                  >
                    💰
                  </div>
                  <div>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>
                      账户余额
                    </Text>
                    <Title
                      level={2}
                      style={{
                        color: '#fff',
                        margin: '4px 0 0 0',
                        fontWeight: 700,
                      }}
                    >
                      {formatPrice(wallet?.balance || 0)}
                    </Title>
                  </div>
                </Space>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={() => setRechargeModalVisible(true)}
                  style={{
                    background: '#fff',
                    color: '#764ba2',
                    border: 'none',
                    fontWeight: 600,
                    height: '44px',
                    padding: '0 24px',
                  }}
                >
                  充值
                </Button>
              </Space>

              <Divider style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '16px 0' }} />

              <Row gutter={[16, 16]}>
                <Col xs={12} sm={8}>
                  <Statistic
                    title={
                      <Space align="center">
                        <FireOutlined style={{ color: '#ffd700' }} />
                        <Text style={{ color: 'rgba(255,255,255,0.85)' }}>环保积分</Text>
                      </Space>
                    }
                    value={ecoStatus?.ecoPoints || 0}
                    valueStyle={{ color: '#fff' }}
                    suffix={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>分</Text>}
                  />
                </Col>
                <Col xs={12} sm={8}>
                  <Statistic
                    title={
                      <Space align="center">
                        <CalendarOutlined style={{ color: '#ffd700' }} />
                        <Text style={{ color: 'rgba(255,255,255,0.85)' }}>连续使用</Text>
                      </Space>
                    }
                    value={wallet?.streakDays || 0}
                    valueStyle={{ color: '#fff' }}
                    suffix={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>天</Text>}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title={
                      <Space align="center">
                        <GiftOutlined style={{ color: '#ffd700' }} />
                        <Text style={{ color: 'rgba(255,255,255,0.85)' }}>可用优惠券</Text>
                      </Space>
                    }
                    value={myVouchersCount}
                    valueStyle={{ color: '#fff' }}
                    suffix={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>张</Text>}
                  />
                </Col>
              </Row>
            </Space>
          </Card>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="累计消费"
                value={formatPrice(
                  wallet?.transactions
                    ?.filter((t: Order) => t.orderType !== 'recharge' && t.orderType !== 'refund')
                    .reduce((sum: number, t: Order) => sum + (t.amount || 0), 0) || 0
                )}
                icon={<WalletOutlined />}
                color="#1890ff"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="累计充值"
                value={formatPrice(
                  wallet?.transactions
                    ?.filter((t: Order) => t.orderType === 'recharge')
                    .reduce((sum: number, t: Order) => sum + (t.amount || 0), 0) || 0
                )}
                icon={<PlusOutlined />}
                color="#52c41a"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="累计节省"
                value={formatPrice(
                  wallet?.transactions
                    ?.filter((t: Order) => t.voucherDiscount)
                    .reduce((sum: number, t: Order) => sum + (t.voucherDiscount || 0), 0) || 0
                )}
                icon={<GiftOutlined />}
                color="#722ed1"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="优惠券"
                value={`${myVouchersCount} 张`}
                icon={<GiftOutlined />}
                color="#faad14"
                onClick={() => navigate('/resident/eco')}
              />
            </Col>
          </Row>

          <Card
            className="card-shadow"
            title={
              <Space align="center">
                <Title level={5} style={{ margin: 0 }}>交易记录</Title>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadData}
                  size="small"
                />
              </Space>
            }
            extra={
              <Button
                type="link"
                onClick={() => navigate('/resident/orders')}
              >
                查看全部订单
              </Button>
            }
          >
            {wallet?.transactions?.length > 0 ? (
              <List
                dataSource={wallet.transactions.slice(0, 10)}
                renderItem={(item: Order) => (
                  <List.Item
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {getTransactionIcon(item)}
                        </div>
                      }
                      title={
                        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Text strong>{getTransactionTitle(item)}</Text>
                          {getTransactionAmount(item)}
                        </Space>
                      }
                      description={
                        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Space>
                            {item.device?.name && (
                              <Text type="secondary">{item.device.name}</Text>
                            )}
                            <StatusBadge type="payment" status={item.paymentStatus} />
                          </Space>
                          <Tooltip title={formatDateTime(item.createdAt)}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {formatRelativeTime(item.createdAt)}
                            </Text>
                          </Tooltip>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无交易记录" style={{ padding: '40px 0' }} />
            )}
          </Card>
        </>
      )}

      <Modal
        title="账户充值"
        open={rechargeModalVisible}
        onCancel={() => {
          setRechargeModalVisible(false);
          resetRechargeForm();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setRechargeModalVisible(false);
              resetRechargeForm();
            }}
          >
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            icon={<PayCircleOutlined />}
            onClick={handleRecharge}
            loading={rechargeLoading}
            disabled={!selectedAmount && !customAmount}
          >
            确认充值 {formatPrice(customAmount || selectedAmount)}
          </Button>,
        ]}
        width={480}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ marginBottom: 12, display: 'block' }}>
              选择充值金额
            </Text>
            <Row gutter={[12, 12]}>
              {RECHARGE_AMOUNTS.map((amount) => (
                <Col xs={8} key={amount}>
                  <Card
                    hoverable
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount(null);
                    }}
                    style={{
                      textAlign: 'center',
                      borderColor: selectedAmount === amount && !customAmount ? '#1890ff' : '#d9d9d9',
                      background: selectedAmount === amount && !customAmount ? '#e6f7ff' : '#fff',
                      cursor: 'pointer',
                    }}
                    bodyStyle={{ padding: '16px 8px' }}
                  >
                    <Text
                      strong
                      style={{
                        fontSize: '20px',
                        color: selectedAmount === amount && !customAmount ? '#1890ff' : '#262626',
                      }}
                    >
                      {formatPrice(amount)}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          <div>
            <Text strong style={{ marginBottom: 12, display: 'block' }}>
              支付方式
            </Text>
            <RadioGroup
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {PAYMENT_METHODS.map((method) => (
                  <RadioButton
                    key={method.value}
                    value={method.value}
                    style={{
                      width: '100%',
                      height: 'auto',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Space align="center">
                      <span style={{ fontSize: '20px' }}>{method.icon}</span>
                      <Text strong>{method.label}</Text>
                    </Space>
                    {method.value === 'balance' && (
                      <Tag color="blue">余额 {formatPrice(wallet?.balance || 0)}</Tag>
                    )}
                  </RadioButton>
                ))}
              </Space>
            </RadioGroup>
          </div>

          <Alert
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            message="充值说明"
            description={
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  • 充值金额即时到账，可用于支付设备使用费
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  • 余额长期有效，不可提现，可申请退款
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  • 充值后可在交易记录中查看明细
                </Text>
              </Space>
            }
          />
        </Space>
      </Modal>
    </div>
  );
};

export default ResidentWallet;
