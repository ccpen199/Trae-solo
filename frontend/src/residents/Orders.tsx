import React, { useEffect, useState } from 'react';
import {
  Card,
  Tabs,
  List,
  Space,
  Typography,
  Button,
  Tag,
  Modal,
  Descriptions,
  Skeleton,
  Empty,
  Pagination,
  Alert,
  Radio,
} from 'antd';
import {
  ShoppingOutlined,
  EyeOutlined,
  ReloadOutlined,
  PayCircleOutlined,
  RollbackOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { orderApi } from '@/api';
import type { Order, OrderStatus, PaymentStatus } from '@/types';
import { DEVICE_TYPE_MAP, DEVICE_TYPE_COLORS, DEVICE_TYPE_ICONS } from '@/utils/constants';
import { formatPrice, formatDateTime, formatDuration } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge';

const { Title, Text } = Typography;
const { Group: RadioGroup, Button: RadioButton } = Radio;

interface TabKey {
  key: OrderStatus | 'all';
  label: string;
  paymentStatus?: PaymentStatus[];
}

const TAB_KEYS: TabKey[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待支付', paymentStatus: ['unpaid'] },
  { key: 'processing', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'refunded', label: '已退款' },
];

const ResidentOrders: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useAppStore();
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    loadOrders();
  }, [activeTab, pagination.current, pagination.pageSize]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      };

      if (activeTab !== 'all') {
        params.status = activeTab;
      }

      const response = await orderApi.getOrders(params);
      if (response.success) {
        setOrders(response.data?.list || []);
        setPagination((prev) => ({
          ...prev,
          total: response.data?.pagination?.total || 0,
        }));
        loadStats();
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || '加载订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsRes: Record<string, number> = {};
      for (const tab of TAB_KEYS) {
        if (tab.key === 'all') continue;
        const res = await orderApi.getOrders({ pageSize: 1, status: tab.key });
        statsRes[tab.key] = res.data?.pagination?.total || 0;
      }
      setStats(statsRes);
    } catch (error) {
      console.error('Failed to load order stats:', error);
    }
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  const handlePayOrder = async (order: Order) => {
    Modal.confirm({
      title: '确认支付',
      content: `确定要支付订单 ${order.orderNo}，金额 ${formatPrice(order.amount)} 吗？`,
      okText: '确认支付',
      okType: 'primary',
      cancelText: '取消',
      onOk: async () => {
        try {
          setActionLoading(order._id);
          const response = await orderApi.payOrder(order._id, {
            paymentMethod: 'balance',
          });
          if (response.success) {
            showNotification('success', '支付成功');
            loadOrders();
          }
        } catch (error: any) {
          showNotification('error', error.response?.data?.message || '支付失败');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleRefundOrder = async (order: Order) => {
    Modal.confirm({
      title: '申请退款',
      content: `确定要对订单 ${order.orderNo} 申请退款吗？`,
      okText: '确认申请',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          setActionLoading(order._id);
          const response = await orderApi.handleInterrupt({
            orderId: order._id,
            interruptReason: '用户申请退款',
          });
          if (response.success) {
            showNotification('success', `退款申请已提交，将退款 ${formatPrice(response.data?.refundAmount || 0)}`);
            loadOrders();
          }
        } catch (error: any) {
          showNotification('error', error.response?.data?.message || '退款申请失败');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination((prev) => ({ ...prev, current: page, pageSize }));
  };

  const renderOrderItem = (order: Order) => {
    const deviceType = order.device?.deviceType;
    const deviceColor = deviceType ? DEVICE_TYPE_COLORS[deviceType] : '#1890ff';
    const deviceIcon = deviceType ? DEVICE_TYPE_ICONS[deviceType] : '📦';

    return (
      <List.Item
        key={order._id}
        style={{
          padding: '16px 0',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <List.Item.Meta
          avatar={
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                background: `${deviceColor}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              {deviceIcon}
            </div>
          }
          title={
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space align="center">
                  <Text strong>{order.device?.name || order.orderNo}</Text>
                  {deviceType && (
                    <Tag color="blue">{DEVICE_TYPE_MAP[deviceType]}</Tag>
                  )}
                  <StatusBadge type="order" status={order.status} />
                  <StatusBadge type="payment" status={order.paymentStatus} />
                </Space>
                <Text strong style={{ color: deviceColor, fontSize: '16px' }}>
                  {formatPrice(order.amount)}
                </Text>
              </Space>

              {order.interruptInfo?.interrupted && (
                <Alert
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                  message={
                    <Space>
                      <Text type="warning">订单异常中断</Text>
                      {order.interruptInfo.autoRefund && (
                        <Tag color="purple">已自动退款</Tag>
                      )}
                      {order.refundAmount !== undefined && order.refundAmount > 0 && (
                        <Text type="success">退款金额: {formatPrice(order.refundAmount)}</Text>
                      )}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Text type="secondary">
                        中断原因: {order.interruptInfo.interruptReason || '未知原因'}
                      </Text>
                      {order.interruptInfo.usedDuration !== undefined && (
                        <Text type="secondary">
                          已使用时长: {formatDuration(order.interruptInfo.usedDuration)}
                        </Text>
                      )}
                    </Space>
                  }
                />
              )}
            </Space>
          }
          description={
            <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 8 }}>
              <Space size="middle" wrap>
                <Text type="secondary">
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {formatDateTime(order.createdAt)}
                </Text>
                {order.booking && (
                  <Text type="secondary">
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {formatDuration(order.booking.duration)}
                  </Text>
                )}
                {order.device?.location && (
                  <Text type="secondary">
                    <EnvironmentOutlined style={{ marginRight: 4 }} />
                    {order.device.location.building} {order.device.location.floor}{order.device.location.room}
                  </Text>
                )}
              </Space>
              <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text type="secondary">订单号：{order.orderNo}</Text>
                <Space size="small">
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetail(order)}
                  >
                    查看详情
                  </Button>
                  {order.paymentStatus === 'unpaid' && order.status === 'pending' && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<PayCircleOutlined />}
                      onClick={() => handlePayOrder(order)}
                      loading={actionLoading === order._id}
                    >
                      去支付
                    </Button>
                  )}
                  {order.status === 'processing' && order.paymentStatus === 'paid' && (
                    <Button
                      size="small"
                      danger
                      icon={<RollbackOutlined />}
                      onClick={() => handleRefundOrder(order)}
                      loading={actionLoading === order._id}
                    >
                      申请退款
                    </Button>
                  )}
                </Space>
              </Space>
            </Space>
          }
        />
      </List.Item>
    );
  };

  const renderTabItems = () => {
    return TAB_KEYS.map((tab) => ({
      key: tab.key,
      label: tab.key === 'all' ? tab.label : `${tab.label} (${stats[tab.key] || 0})`,
    }));
  };

  return (
    <div className="page-container">
      <Card
        className="card-shadow"
        style={{ marginBottom: 24 }}
        title={
          <Space align="center">
            <Title level={4} style={{ margin: 0 }}>订单中心</Title>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadOrders}
              loading={loading}
              size="small"
            />
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<ShoppingOutlined />}
            onClick={() => navigate('/resident/devices')}
          >
            去下单
          </Button>
        }
      >
        <RadioGroup
          value={activeTab}
          onChange={(e) => {
            setActiveTab(e.target.value);
            setPagination((prev) => ({ ...prev, current: 1 }));
          }}
          size="large"
          style={{ marginBottom: 16 }}
        >
          {TAB_KEYS.map((tab) => (
            <RadioButton key={tab.key} value={tab.key}>
              {tab.key === 'all' ? tab.label : `${tab.label} (${stats[tab.key] || 0})`}
            </RadioButton>
          ))}
        </RadioGroup>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key as OrderStatus | 'all');
            setPagination((prev) => ({ ...prev, current: 1 }));
          }}
          size="large"
          items={renderTabItems()}
        />
      </Card>

      <Card className="card-shadow">
        {loading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : orders.length > 0 ? (
          <>
            <List
              dataSource={orders}
              renderItem={renderOrderItem}
              style={{ padding: '0 8px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                showSizeChanger
                showQuickJumper
                showTotal={(total) => `共 ${total} 条订单`}
                onChange={handlePageChange}
                onShowSizeChange={handlePageChange}
              />
            </div>
          </>
        ) : (
          <Empty
            description="暂无订单记录"
            style={{ padding: '40px 0' }}
          >
            <Button
              type="primary"
              icon={<ShoppingOutlined />}
              onClick={() => navigate('/resident/devices')}
            >
              去下单
            </Button>
          </Empty>
        )}
      </Card>

      <Modal
        title="订单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          selectedOrder?.paymentStatus === 'unpaid' && selectedOrder?.status === 'pending' && (
            <Button
              key="pay"
              type="primary"
              icon={<PayCircleOutlined />}
              onClick={() => {
                setDetailModalVisible(false);
                handlePayOrder(selectedOrder);
              }}
              loading={actionLoading === selectedOrder?._id}
            >
              去支付
            </Button>
          ),
          selectedOrder?.status === 'processing' && selectedOrder?.paymentStatus === 'paid' && (
            <Button
              key="refund"
              danger
              icon={<RollbackOutlined />}
              onClick={() => {
                setDetailModalVisible(false);
                handleRefundOrder(selectedOrder);
              }}
              loading={actionLoading === selectedOrder?._id}
            >
              申请退款
            </Button>
          ),
        ]}
        width={600}
      >
        {selectedOrder && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {(() => {
              const orderDeviceType = selectedOrder.device?.deviceType;
              return (
                <Card
                  style={{
                    background: `linear-gradient(135deg, ${orderDeviceType ? DEVICE_TYPE_COLORS[orderDeviceType] : '#1890ff'}10 0%, ${orderDeviceType ? DEVICE_TYPE_COLORS[orderDeviceType] : '#1890ff'}20 100%)`,
                    border: 'none',
                  }}
                >
                  <Space align="center" size={16}>
                    <div
                      style={{
                        fontSize: '48px',
                        background: `${orderDeviceType ? DEVICE_TYPE_COLORS[orderDeviceType] : '#1890ff'}20`,
                        borderRadius: '12px',
                        padding: '16px',
                      }}
                    >
                      {orderDeviceType ? DEVICE_TYPE_ICONS[orderDeviceType] : '📦'}
                    </div>
                    <div>
                      <Title level={4} style={{ margin: 0 }}>
                        {selectedOrder.device?.name || selectedOrder.orderNo}
                      </Title>
                      <Space size="middle" style={{ marginTop: 4 }}>
                        {orderDeviceType && (
                          <Tag color="blue">{DEVICE_TYPE_MAP[orderDeviceType]}</Tag>
                        )}
                    <StatusBadge type="order" status={selectedOrder.status} />
                    <StatusBadge type="payment" status={selectedOrder.paymentStatus} />
                  </Space>
                </div>
              </Space>
                </Card>
              );
            })()}

            {selectedOrder.interruptInfo?.interrupted && (
              <Alert
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                message="订单异常中断"
                description={
                  <Space direction="vertical" size="small">
                    <Text>中断原因: {selectedOrder.interruptInfo.interruptReason || '未知原因'}</Text>
                    <Text>中断时间: {formatDateTime(selectedOrder.interruptInfo.interruptTime)}</Text>
                    {selectedOrder.interruptInfo.usedDuration !== undefined && (
                      <Text>已使用时长: {formatDuration(selectedOrder.interruptInfo.usedDuration)}</Text>
                    )}
                    {selectedOrder.interruptInfo.autoRefund && (
                      <Space align="center">
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <Text type="success">已自动退款 {formatPrice(selectedOrder.refundAmount || 0)}</Text>
                      </Space>
                    )}
                    {selectedOrder.refundReason && (
                      <Text type="secondary">退款原因: {selectedOrder.refundReason}</Text>
                    )}
                  </Space>
                }
              />
            )}

            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="订单编号" span={2}>
                {selectedOrder.orderNo}
              </Descriptions.Item>
              <Descriptions.Item label="订单类型">
                {selectedOrder.orderType === 'booking' ? '设备使用' :
                 selectedOrder.orderType === 'recharge' ? '账户充值' :
                 selectedOrder.orderType === 'package' ? '套餐购买' :
                 selectedOrder.orderType === 'penalty' ? '违约金' :
                 selectedOrder.orderType === 'refund' ? '退款' : selectedOrder.orderType}
              </Descriptions.Item>
              <Descriptions.Item label="支付方式">
                {selectedOrder.paymentMethod === 'wechat' ? '微信支付' :
                 selectedOrder.paymentMethod === 'alipay' ? '支付宝' :
                 selectedOrder.paymentMethod === 'balance' ? '余额支付' :
                 selectedOrder.paymentMethod === 'voucher' ? '优惠券' : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="订单金额">
                {formatPrice(selectedOrder.amount)}
              </Descriptions.Item>
              <Descriptions.Item label="实付金额">
                <Text strong style={{ color: '#1890ff' }}>
                  {formatPrice(selectedOrder.paidAmount || selectedOrder.amount)}
                </Text>
              </Descriptions.Item>
              {selectedOrder.balanceUsed !== undefined && selectedOrder.balanceUsed > 0 && (
                <Descriptions.Item label="余额抵扣">
                  {formatPrice(selectedOrder.balanceUsed)}
                </Descriptions.Item>
              )}
              {selectedOrder.voucherDiscount !== undefined && selectedOrder.voucherDiscount > 0 && (
                <Descriptions.Item label="优惠券抵扣">
                  {formatPrice(selectedOrder.voucherDiscount)}
                </Descriptions.Item>
              )}
              {selectedOrder.refundAmount !== undefined && selectedOrder.refundAmount > 0 && (
                <Descriptions.Item label="退款金额">
                  <Text type="success">{formatPrice(selectedOrder.refundAmount)}</Text>
                </Descriptions.Item>
              )}
              {selectedOrder.booking && (
                <>
                  <Descriptions.Item label="使用时长">
                    {formatDuration(selectedOrder.booking.duration)}
                  </Descriptions.Item>
                  <Descriptions.Item label="使用模式">
                    {selectedOrder.booking.mode || '-'}
                  </Descriptions.Item>
                </>
              )}
              {selectedOrder.device?.location && (
                <Descriptions.Item label="设备位置" span={2}>
                  {selectedOrder.device.location.building} {selectedOrder.device.location.floor}{selectedOrder.device.location.room}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="创建时间" span={2}>
                {formatDateTime(selectedOrder.createdAt)}
              </Descriptions.Item>
              {selectedOrder.paidAt && (
                <Descriptions.Item label="支付时间" span={2}>
                  {formatDateTime(selectedOrder.paidAt)}
                </Descriptions.Item>
              )}
              {selectedOrder.completedAt && (
                <Descriptions.Item label="完成时间" span={2}>
                  {formatDateTime(selectedOrder.completedAt)}
                </Descriptions.Item>
              )}
              {selectedOrder.transactionId && (
                <Descriptions.Item label="交易流水号" span={2}>
                  {selectedOrder.transactionId}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default ResidentOrders;
