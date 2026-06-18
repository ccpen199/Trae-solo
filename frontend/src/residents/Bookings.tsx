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
  Dropdown,
  MenuProps,
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  PlayCircleOutlined,
  StopOutlined,
  CloseOutlined,
  MoreOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { bookingApi } from '@/api';
import type { Booking } from '@/types';
import { DEVICE_TYPE_MAP, DEVICE_TYPE_COLORS, DEVICE_TYPE_ICONS } from '@/utils/constants';
import { formatPrice, formatDateTime, formatDuration } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ResidentBookings: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useAppStore();
  const [activeTab, setActiveTab] = useState('active');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, [activeTab]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const params: any = {
        pageSize: 50,
      };
      if (activeTab === 'active') {
        params.status = ['pending', 'confirmed', 'active'];
      } else {
        params.status = ['completed', 'cancelled', 'expired', 'refunded'];
      }

      const response = await bookingApi.getBookings(params);
      if (response.success) {
        setBookings(response.data?.list || []);
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || '加载预约列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailModalVisible(true);
  };

  const handleCancelBooking = async (booking: Booking) => {
    Modal.confirm({
      title: '确认取消预约',
      content: `确定要取消 ${booking.device?.name} 的预约吗？`,
      okText: '确认取消',
      okType: 'danger',
      cancelText: '再想想',
      onOk: async () => {
        try {
          setActionLoading(booking._id);
          const response = await bookingApi.cancelBooking(booking._id);
          if (response.success) {
            showNotification('success', '预约已取消');
            loadBookings();
          }
        } catch (error: any) {
          showNotification('error', error.response?.data?.message || '取消预约失败');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleStartBooking = async (booking: Booking) => {
    try {
      setActionLoading(booking._id);
      const response = await bookingApi.startBooking(booking._id);
      if (response.success) {
        showNotification('success', '设备已启动');
        navigate(`/resident/bookings/${booking._id}`);
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || '启动设备失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteBooking = async (booking: Booking) => {
    Modal.confirm({
      title: '确认完成使用',
      content: `确定要结束 ${booking.device?.name} 的使用吗？`,
      okText: '确认完成',
      cancelText: '继续使用',
      onOk: async () => {
        try {
          setActionLoading(booking._id);
          const response = await bookingApi.completeBooking(booking._id);
          if (response.success) {
            showNotification('success', '使用已完成');
            loadBookings();
          }
        } catch (error: any) {
          showNotification('error', error.response?.data?.message || '结束使用失败');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const getActionMenu = (booking: Booking): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: '查看详情',
        onClick: () => handleViewDetail(booking),
      },
    ];

    if (booking.status === 'confirmed') {
      items.push({
        key: 'start',
        icon: <PlayCircleOutlined />,
        label: '启动设备',
        onClick: () => handleStartBooking(booking),
      });
    }

    if (booking.status === 'active') {
      items.push({
        key: 'complete',
        icon: <StopOutlined />,
        label: '完成使用',
        onClick: () => handleCompleteBooking(booking),
      });
    }

    if (booking.status === 'pending' || booking.status === 'confirmed') {
      items.push({ type: 'divider' });
      items.push({
        key: 'cancel',
        icon: <CloseOutlined />,
        label: '取消预约',
        danger: true,
        onClick: () => handleCancelBooking(booking),
      });
    }

    return items;
  };

  const renderBookingItem = (booking: Booking) => {
    const deviceColor = DEVICE_TYPE_COLORS[booking.deviceType];
    const deviceIcon = DEVICE_TYPE_ICONS[booking.deviceType];

    return (
      <List.Item
        key={booking._id}
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
            <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space align="center">
                <Text strong>{booking.device?.name || booking.bookingNo}</Text>
                <Tag color="blue">{DEVICE_TYPE_MAP[booking.deviceType]}</Tag>
                <StatusBadge type="booking" status={booking.status} />
              </Space>
              <Dropdown
                menu={{ items: getActionMenu(booking) }}
                trigger={['click']}
                disabled={actionLoading === booking._id}
              >
                <Button
                  type="text"
                  icon={<MoreOutlined />}
                  loading={actionLoading === booking._id}
                />
              </Dropdown>
            </Space>
          }
          description={
            <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 8 }}>
              <Space size="middle">
                <Text type="secondary">
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {formatDateTime(booking.startTime)} - {formatDateTime(booking.endTime, 'HH:mm')}
                </Text>
                <Text type="secondary">
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {formatDuration(booking.duration)}
                </Text>
              </Space>
              {booking.device?.location && (
                <Text type="secondary">
                  <EnvironmentOutlined style={{ marginRight: 4 }} />
                  {booking.device.location.building} {booking.device.location.floor}{booking.device.location.room}
                </Text>
              )}
              <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space size="middle">
                  <Text type="secondary">预约号：{booking.bookingNo}</Text>
                  <Text strong style={{ color: deviceColor }}>
                    {formatPrice(booking.pricing.finalAmount)}
                  </Text>
                </Space>
                {booking.status === 'confirmed' && (
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleStartBooking(booking)}
                    loading={actionLoading === booking._id}
                  >
                    启动设备
                  </Button>
                )}
                {booking.status === 'active' && (
                  <Button
                    type="primary"
                    size="small"
                    icon={<StopOutlined />}
                    onClick={() => handleCompleteBooking(booking)}
                    loading={actionLoading === booking._id}
                  >
                    完成使用
                  </Button>
                )}
                {(booking.status === 'pending' || booking.status === 'confirmed') && (
                  <Button
                    size="small"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => handleCancelBooking(booking)}
                    loading={actionLoading === booking._id}
                  >
                    取消预约
                  </Button>
                )}
              </Space>
            </Space>
          }
        />
      </List.Item>
    );
  };

  return (
    <div className="page-container">
      <Card
        className="card-shadow"
        style={{ marginBottom: 24 }}
        title={
          <Space align="center">
            <Title level={4} style={{ margin: 0 }}>预约管理</Title>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadBookings}
              loading={loading}
              size="small"
            />
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<CalendarOutlined />}
            onClick={() => navigate('/resident/devices')}
          >
            新建预约
          </Button>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          items={[
            {
              key: 'active',
              label: `我的预约 (${bookings.filter(b => ['pending', 'confirmed', 'active'].includes(b.status)).length})`,
            },
            {
              key: 'history',
              label: `历史预约 (${bookings.filter(b => ['completed', 'cancelled', 'expired', 'refunded'].includes(b.status)).length})`,
            },
          ]}
        />
      </Card>

      <Card className="card-shadow">
        {loading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : bookings.length > 0 ? (
          <List
            dataSource={bookings}
            renderItem={renderBookingItem}
            style={{ padding: '0 8px' }}
          />
        ) : (
          <Empty
            description={activeTab === 'active' ? '暂无进行中的预约' : '暂无历史预约记录'}
            style={{ padding: '40px 0' }}
          >
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              onClick={() => navigate('/resident/devices')}
            >
              去预约设备
            </Button>
          </Empty>
        )}
      </Card>

      <Modal
        title="预约详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          selectedBooking?.status === 'confirmed' && (
            <Button
              key="start"
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => {
                setDetailModalVisible(false);
                handleStartBooking(selectedBooking);
              }}
              loading={actionLoading === selectedBooking?._id}
            >
              启动设备
            </Button>
          ),
          selectedBooking?.status === 'active' && (
            <Button
              key="complete"
              type="primary"
              icon={<StopOutlined />}
              onClick={() => {
                setDetailModalVisible(false);
                handleCompleteBooking(selectedBooking);
              }}
              loading={actionLoading === selectedBooking?._id}
            >
              完成使用
            </Button>
          ),
          (selectedBooking?.status === 'pending' || selectedBooking?.status === 'confirmed') && (
            <Button
              key="cancel"
              danger
              icon={<CloseOutlined />}
              onClick={() => {
                setDetailModalVisible(false);
                handleCancelBooking(selectedBooking);
              }}
              loading={actionLoading === selectedBooking?._id}
            >
              取消预约
            </Button>
          ),
        ]}
        width={600}
      >
        {selectedBooking && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card
              style={{
                background: `linear-gradient(135deg, ${DEVICE_TYPE_COLORS[selectedBooking.deviceType]}10 0%, ${DEVICE_TYPE_COLORS[selectedBooking.deviceType]}20 100%)`,
                border: 'none',
              }}
            >
              <Space align="center" size={16}>
                <div
                  style={{
                    fontSize: '48px',
                    background: `${DEVICE_TYPE_COLORS[selectedBooking.deviceType]}20`,
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  {DEVICE_TYPE_ICONS[selectedBooking.deviceType]}
                </div>
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {selectedBooking.device?.name || selectedBooking.bookingNo}
                  </Title>
                  <Space size="middle" style={{ marginTop: 4 }}>
                    <Tag color="blue">{DEVICE_TYPE_MAP[selectedBooking.deviceType]}</Tag>
                    <StatusBadge type="booking" status={selectedBooking.status} />
                  </Space>
                </div>
              </Space>
            </Card>

            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="预约编号" span={2}>
                {selectedBooking.bookingNo}
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {formatDateTime(selectedBooking.startTime)}
              </Descriptions.Item>
              <Descriptions.Item label="结束时间">
                {formatDateTime(selectedBooking.endTime)}
              </Descriptions.Item>
              <Descriptions.Item label="使用时长">
                {formatDuration(selectedBooking.duration)}
              </Descriptions.Item>
              <Descriptions.Item label="使用模式">
                {selectedBooking.mode || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="设备位置" span={2}>
                {selectedBooking.device?.location
                  ? `${selectedBooking.device.location.building} ${selectedBooking.device.location.floor}${selectedBooking.device.location.room}`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="基础服务费">
                {formatPrice(selectedBooking.pricing.basePrice)}
              </Descriptions.Item>
              <Descriptions.Item label="单价">
                {formatPrice(selectedBooking.pricing.unitPrice)}/10分钟
              </Descriptions.Item>
              <Descriptions.Item label="总金额">
                {formatPrice(selectedBooking.pricing.totalAmount)}
              </Descriptions.Item>
              <Descriptions.Item label="优惠金额">
                {formatPrice(selectedBooking.pricing.discountAmount)}
              </Descriptions.Item>
              <Descriptions.Item label="实付金额" span={2}>
                <Text strong style={{ color: DEVICE_TYPE_COLORS[selectedBooking.deviceType], fontSize: '18px' }}>
                  {formatPrice(selectedBooking.pricing.finalAmount)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {formatDateTime(selectedBooking.createdAt)}
              </Descriptions.Item>
              {selectedBooking.note && (
                <Descriptions.Item label="备注" span={2}>
                  {selectedBooking.note}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default ResidentBookings;
