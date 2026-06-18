import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Space,
  Typography,
  Button,
  List,
  Avatar,
  Tag,
  Skeleton,
  Empty,
} from 'antd';
import {
  QrcodeOutlined,
  CalendarOutlined,
  ShoppingOutlined,
  WalletOutlined,
  EnvironmentOutlined,
  FireOutlined,
  GiftOutlined,
  ArrowRightOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '@/store';
import { deviceApi, orderApi, ecoApi } from '@/api';
import type { Device } from '@/types';
import { DEVICE_TYPE_MAP, DEVICE_TYPE_COLORS } from '@/utils/constants';
import { formatPrice } from '@/utils/format';
import DeviceCard from '@/components/DeviceCard';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';

const { Title, Text } = Typography;

const ResidentHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setLoading, showNotification } = useAppStore();
  const [nearbyDevices, setNearbyDevices] = useState<Device[]>([]);
  const [loading, setPageLoading] = useState(true);
  const [ecoStatus, setEcoStatus] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setPageLoading(true);
      const [devicesRes, walletRes, ecoRes] = await Promise.all([
        deviceApi.getDevices({ pageSize: 4, status: 'online' }),
        orderApi.getWallet(),
        ecoApi.getMyEcoStatus(),
      ]);

      if (devicesRes.success) {
        setNearbyDevices(devicesRes.data?.list || []);
      }
      if (walletRes.success) {
        setWallet(walletRes.data);
      }
      if (ecoRes.success) {
        setEcoStatus(ecoRes.data);
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || '加载数据失败');
    } finally {
      setPageLoading(false);
    }
  };

  const handleDeviceClick = (device: Device) => {
    navigate(`/resident/devices/${device._id}`);
  };

  const handleQuickAction = (path: string) => {
    navigate(path);
  };

  const quickActions = [
    {
      icon: <QrcodeOutlined style={{ fontSize: '28px', color: '#1890ff' }} />,
      label: '扫码启动',
      path: '/resident/scan',
      color: '#e6f7ff',
    },
    {
      icon: <CalendarOutlined style={{ fontSize: '28px', color: '#722ed1' }} />,
      label: '我的预约',
      path: '/resident/bookings',
      color: '#f9f0ff',
    },
    {
      icon: <ShoppingOutlined style={{ fontSize: '28px', color: '#13c2c2' }} />,
      label: '我的订单',
      path: '/resident/orders',
      color: '#e6fffb',
    },
    {
      icon: <WalletOutlined style={{ fontSize: '28px', color: '#52c41a' }} />,
      label: '我的钱包',
      path: '/resident/wallet',
      color: '#f6ffed',
    },
  ];

  if (loading) {
    return (
      <div className="page-container">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space align="center" size={16}>
            <Avatar size={64} src={user?.avatar} icon={!user?.avatar && <UserOutlined />} />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {user?.nickname || user?.username || '居民用户'}
              </Title>
              <Space size={8} style={{ marginTop: 4 }}>
                <Tag color="blue">居民</Tag>
                <Text type="secondary">
                  <EnvironmentOutlined /> {user?.communityId || '未绑定社区'}
                </Text>
              </Space>
            </div>
          </Space>
          {ecoStatus?.streakDays > 0 && (
            <Space align="center">
              <FireOutlined style={{ color: '#faad14', fontSize: '20px' }} />
              <Text strong style={{ color: '#faad14' }}>
                连续 {ecoStatus.streakDays} 天
              </Text>
            </Space>
          )}
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            title="账户余额"
            value={formatPrice(wallet?.balance || 0)}
            icon={<WalletOutlined />}
            color="#1890ff"
            onClick={() => navigate('/resident/wallet')}
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            title="环保积分"
            value={ecoStatus?.ecoPoints || 0}
            icon={<FireOutlined />}
            color="#52c41a"
            trend={12}
            trendLabel="较上周"
            onClick={() => navigate('/resident/eco')}
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            title="连续打卡"
            value={`${ecoStatus?.streakDays || 0}天`}
            icon={<CalendarOutlined />}
            color="#faad14"
            onClick={() => navigate('/resident/eco')}
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            title="可用优惠券"
            value={ecoStatus?.availableVouchers?.length || 0}
            icon={<GiftOutlined />}
            color="#722ed1"
            onClick={() => navigate('/resident/eco')}
          />
        </Col>
      </Row>

      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 16 }}>快捷入口</Title>
        <Row gutter={[16, 16]}>
          {quickActions.map((action, index) => (
            <Col xs={12} sm={6} key={index}>
              <div
                onClick={() => handleQuickAction(action.path)}
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: action.color,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ marginBottom: 8 }}>{action.icon}</div>
                <Text strong>{action.label}</Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {ecoStatus?.nextReward && (
        <Card
          className="card-shadow"
          style={{
            marginBottom: 24,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
          }}
        >
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space align="center" size={16}>
              <GiftOutlined style={{ fontSize: '32px' }} />
              <div>
                <Title level={5} style={{ color: '#fff', margin: 0 }}>环保激励</Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                  再使用 {ecoStatus.nextReward.remaining} 次即可获得 {ecoStatus.nextReward.rewardName}
                </Text>
              </div>
            </Space>
            <Button
              type="default"
              size="small"
              onClick={() => navigate('/resident/eco')}
              style={{ borderColor: '#fff', color: '#fff' }}
            >
              查看详情
            </Button>
          </Space>
          <div className="eco-progress" style={{ marginTop: 16, background: 'rgba(255,255,255,0.2)' }}>
            <div
              className="eco-progress-bar"
              style={{
                width: `${ecoStatus.nextReward.progress}%`,
                background: '#fff',
              }}
            />
          </div>
        </Card>
      )}

      <Card
        className="card-shadow"
        title={
          <Space align="center">
            <Title level={5} style={{ margin: 0 }}>附近设备</Title>
            <Tag color="blue">{nearbyDevices.length} 台可用</Tag>
          </Space>
        }
        extra={
          <Button
            type="link"
            onClick={() => navigate('/resident/devices')}
            icon={<ArrowRightOutlined />}
          >
            查看全部
          </Button>
        }
      >
        {nearbyDevices.length > 0 ? (
          <Row gutter={[16, 16]}>
            {nearbyDevices.map((device) => (
              <Col xs={24} sm={12} lg={6} key={device._id}>
                <DeviceCard device={device} onClick={handleDeviceClick} />
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="暂无可用设备" />
        )}
      </Card>

      {ecoStatus?.recentLogs && ecoStatus.recentLogs.length > 0 && (
        <Card className="card-shadow" title={<Title level={5} style={{ margin: 0 }}>最近动态</Title>}>
          <List
            dataSource={ecoStatus.recentLogs.slice(0, 3)}
            renderItem={(item: any) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<FireOutlined />} style={{ backgroundColor: DEVICE_TYPE_COLORS[item.deviceType] || '#1890ff' }} />}
                  title={
                    <Space>
                      <Text>使用{DEVICE_TYPE_MAP[item.deviceType] || '设备'}</Text>
                      <Tag color="green">+{item.points} 积分</Tag>
                    </Space>
                  }
                  description={item.time || '刚刚'}
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
};

export default ResidentHome;
