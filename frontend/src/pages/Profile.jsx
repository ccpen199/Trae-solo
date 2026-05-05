import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Button,
  Typography,
  Space,
  Tag,
  Divider,
  Spin,
  Avatar,
  List,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Descriptions,
  Statistic,
  Tabs,
} from 'antd';
import {
  UserOutlined,
  HomeOutlined,
  HeartOutlined,
  FileTextOutlined,
  MessageOutlined,
  SettingOutlined,
  EditOutlined,
  BellOutlined,
  HistoryOutlined,
  TagOutlined,
  PlusOutlined,
  SafetyOutlined,
  PhoneOutlined,
  RightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useUserStore } from '@/stores/userStore';
import { userService } from '@/services/userService';
import { houseService } from '@/services/houseService';
import { orderService } from '@/services/orderService';

const { Title, Text, Paragraph } = Typography;

function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile, becomeLandlord } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBecomeLandlordModal, setShowBecomeLandlordModal] = useState(false);
  const [editForm] = Form.useForm();
  const [landlordForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('profile');
  const [browseHistory, setBrowseHistory] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    orderCount: 0,
    favoriteCount: 0,
    reviewCount: 0,
    couponCount: 0,
  });

  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'orders',
      icon: <FileTextOutlined />,
      label: '我的订单',
    },
    {
      key: 'favorites',
      icon: <HeartOutlined />,
      label: '我的收藏',
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: '浏览记录',
    },
    {
      key: 'coupons',
      icon: <TagOutlined />,
      label: '我的优惠券',
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: '消息通知',
    },
  ];

  useEffect(() => {
    if (activeTab === 'history') {
      fetchBrowseHistory();
    } else if (activeTab === 'coupons') {
      fetchCoupons();
    } else if (activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [activeTab]);

  const fetchBrowseHistory = async () => {
    try {
      setLoading(true);
      const result = await userService.getBrowseHistory({ limit: 20 });
      setBrowseHistory(result.houses || []);
    } catch (error) {
      console.error('获取浏览记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const result = await userService.getMyCoupons({ limit: 20 });
      setCoupons(result.coupons || []);
    } catch (error) {
      console.error('获取优惠券失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const result = await userService.getNotifications({ limit: 20 });
      setNotifications(result.notifications || []);
    } catch (error) {
      console.error('获取通知失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (key) => {
    if (key === 'orders') {
      navigate('/orders');
    } else if (key === 'favorites') {
      navigate('/favorites');
    } else {
      setActiveTab(key);
    }
  };

  const handleEditProfile = () => {
    editForm.setFieldsValue({
      nickname: user?.nickname || '',
      phone: user?.phone || '',
      avatar: user?.avatar || '',
    });
    setShowEditModal(true);
  };

  const handleSubmitEdit = async (values) => {
    try {
      setLoading(true);
      await updateProfile(values);
      message.success('资料更新成功');
      setShowEditModal(false);
    } catch (error) {
      console.error('更新资料失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBecomeLandlord = async (values) => {
    try {
      setLoading(true);
      await becomeLandlord();
      message.success('恭喜您成为房东！');
      setShowBecomeLandlordModal(false);
    } catch (error) {
      console.error('成为房东失败:', error);
      message.error('成为房东失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    Modal.confirm({
      title: '确认清空浏览记录',
      content: '确定要清空所有浏览记录吗？此操作不可恢复。',
      okText: '确认清空',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await userService.clearBrowseHistory();
          message.success('浏览记录已清空');
          setBrowseHistory([]);
        } catch (error) {
          console.error('清空浏览记录失败:', error);
        }
      },
    });
  };

  const handleHouseClick = (houseId) => {
    navigate(`/houses/${houseId}`);
  };

  const renderUserInfo = () => (
    <Card bordered={false} style={{ marginBottom: 24 }}>
      <Row gutter={[24, 16]}>
        <Col flex="none">
          <Avatar
            size={80}
            icon={<UserOutlined />}
            src={user?.avatar}
            style={{ backgroundColor: '#ff4d4f', fontSize: 32 }}
          />
        </Col>
        <Col flex="auto">
          <Space align="center" style={{ marginBottom: 8 }}>
            <Title level={3} style={{ margin: 0 }}>
              {user?.nickname || '用户'}
            </Title>
            {user?.role === 'landlord' && (
              <Tag color="purple">
                <HomeOutlined /> 房东
              </Tag>
            )}
            {user?.isVerified && (
              <Tag color="green">
                <SafetyOutlined /> 已认证
              </Tag>
            )}
          </Space>
          <Space size={24} style={{ marginBottom: 12 }}>
            <Text type="secondary">
              <PhoneOutlined style={{ marginRight: 4 }} />
              {user?.phone || '未绑定手机'}
            </Text>
            <Text type="secondary">
              注册时间：{dayjs(user?.createdAt).format('YYYY-MM-DD')}
            </Text>
          </Space>
          <Space>
            <Button type="primary" onClick={handleEditProfile}>
              <EditOutlined /> 编辑资料
            </Button>
            {user?.role !== 'landlord' && (
              <Button onClick={() => setShowBecomeLandlordModal(true)}>
                <PlusOutlined /> 成为房东
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  );

  const renderStats = () => (
    <Card bordered={false} style={{ marginBottom: 24 }}>
      <Row gutter={[24, 16]}>
        <Col xs={12} sm={6}>
          <Statistic
            title="订单数量"
            value={stats.orderCount}
            prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
            onClick={() => navigate('/orders')}
            style={{ cursor: 'pointer' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="收藏房源"
            value={stats.favoriteCount}
            prefix={<HeartOutlined style={{ color: '#ff4d4f' }} />}
            onClick={() => navigate('/favorites')}
            style={{ cursor: 'pointer' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="优惠券"
            value={stats.couponCount}
            prefix={<TagOutlined style={{ color: '#52c41a' }} />}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="评价数量"
            value={stats.reviewCount}
            prefix={<StarOutlined style={{ color: '#faad14' }} />}
          />
        </Col>
      </Row>
    </Card>
  );

  const renderProfileContent = () => (
    <Card title="个人资料" bordered={false}>
      <Descriptions column={2}>
        <Descriptions.Item label="用户名">{user?.nickname || '未设置'}</Descriptions.Item>
        <Descriptions.Item label="手机号">
          {user?.phone || '未绑定'}
        </Descriptions.Item>
        <Descriptions.Item label="用户角色">
          {user?.role === 'landlord' ? '房东' : '普通用户'}
        </Descriptions.Item>
        <Descriptions.Item label="认证状态">
          {user?.isVerified ? (
            <Tag color="green">已认证</Tag>
          ) : (
            <Tag color="orange">未认证</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="注册时间">
          {dayjs(user?.createdAt).format('YYYY-MM-DD HH:mm')}
        </Descriptions.Item>
        <Descriptions.Item label="最后登录">
          {dayjs(user?.updatedAt).format('YYYY-MM-DD HH:mm')}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );

  const renderHistoryContent = () => (
    <Card
      title="浏览记录"
      bordered={false}
      extra={
        browseHistory.length > 0 && (
          <Button type="link" danger onClick={handleClearHistory}>
            清空记录
          </Button>
        )
      }
    >
      <Spin spinning={loading}>
        {browseHistory.length === 0 ? (
          <Empty description="暂无浏览记录" />
        ) : (
          <Row gutter={[24, 24]}>
            {browseHistory.map((house) => (
              <Col xs={24} sm={12} md={8} key={house.id}>
                <Card
                  hoverable
                  onClick={() => handleHouseClick(house.id)}
                  bodyStyle={{ padding: 0 }}
                >
                  <div
                    style={{
                      height: 140,
                      backgroundImage: `url(${house.images?.[0] || 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '8px 8px 0 0',
                      position: 'relative',
                    }}
                  >
                    <Tag
                      color="blue"
                      style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                      }}
                    >
                      {house.city}
                    </Tag>
                  </div>
                  <div style={{ padding: 12 }}>
                    <div className="ellipsis" style={{ fontWeight: 500, marginBottom: 8 }}>
                      {house.title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {house.district} · {house.maxGuests}人
                      </Text>
                      <Text style={{ color: '#ff4d4f', fontWeight: 600 }}>
                        ¥{house.pricePerNight}/晚
                      </Text>
                    </div>
                    {house.viewedAt && (
                      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                        浏览于 {dayjs(house.viewedAt).format('MM-DD HH:mm')}
                      </Text>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </Card>
  );

  const renderCouponsContent = () => (
    <Card title="我的优惠券" bordered={false}>
      <Spin spinning={loading}>
        {coupons.length === 0 ? (
          <Empty
            description={
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  暂无可用优惠券
                </Text>
                <Button type="primary" onClick={() => navigate('/houses')}>
                  去逛逛
                </Button>
              </div>
            }
          />
        ) : (
          <Row gutter={[24, 24]}>
            {coupons.map((coupon) => (
              <Col xs={24} sm={12} md={8} key={coupon.id}>
                <Card
                  bordered={false}
                  style={{
                    background: coupon.status === 'available' ? 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)' : '#f5f5f5',
                    color: coupon.status === 'available' ? '#fff' : '#999',
                    borderRadius: 12,
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>
                      ¥{coupon.discountAmount}
                    </div>
                    <Text
                      style={{
                        color: coupon.status === 'available' ? 'rgba(255,255,255,0.8)' : '#999',
                      }}
                    >
                      {coupon.name}
                    </Text>
                    <Divider
                      style={{
                        margin: '12px 0',
                        borderColor: coupon.status === 'available' ? 'rgba(255,255,255,0.3)' : '#e8e8e8',
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        color: coupon.status === 'available' ? 'rgba(255,255,255,0.7)' : '#999',
                      }}
                    >
                      有效期至 {dayjs(coupon.expireDate).format('YYYY-MM-DD')}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </Card>
  );

  const renderNotificationsContent = () => (
    <Card title="消息通知" bordered={false}>
      <Spin spinning={loading}>
        {notifications.length === 0 ? (
          <Empty description="暂无消息通知" />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                style={{
                  background: notification.isRead ? '#fff' : '#f0f5ff',
                  padding: '16px 24px',
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={40}
                      style={{
                        background: notification.isRead ? '#f0f0f0' : '#1890ff',
                        color: notification.isRead ? '#999' : '#fff',
                      }}
                      icon={<BellOutlined />}
                    />
                  }
                  title={
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Text strong>{notification.title}</Text>
                        {!notification.isRead && (
                          <Tag color="red" style={{ marginLeft: 8 }}>
                            新消息
                          </Tag>
                        )}
                      </Col>
                      <Col>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(notification.createdAt).format('MM-DD HH:mm')}
                        </Text>
                      </Col>
                    </Row>
                  }
                  description={
                    <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                      {notification.content}
                    </Paragraph>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Spin>
    </Card>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileContent();
      case 'history':
        return renderHistoryContent();
      case 'coupons':
        return renderCouponsContent();
      case 'notifications':
        return renderNotificationsContent();
      default:
        return renderProfileContent();
    }
  };

  return (
    <div>
      {renderUserInfo()}
      {renderStats()}

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={6}>
          <Card bordered={false}>
            <List
              dataSource={menuItems}
              renderItem={(item) => (
                <List.Item
                  key={item.key}
                  onClick={() => handleMenuClick(item.key)}
                  style={{
                    cursor: 'pointer',
                    background: activeTab === item.key ? '#fff1f0' : 'transparent',
                    borderRadius: 8,
                    padding: '12px 16px',
                    marginBottom: 4,
                  }}
                >
                  <List.Item.Meta
                    avatar={<span style={{ color: activeTab === item.key ? '#ff4d4f' : '#666' }}>{item.icon}</span>}
                    title={
                      <Text
                        style={{
                          color: activeTab === item.key ? '#ff4d4f' : '#333',
                          fontWeight: activeTab === item.key ? 600 : 400,
                        }}
                      >
                        {item.label}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          {renderContent()}
        </Col>
      </Row>

      <Modal
        title="编辑个人资料"
        open={showEditModal}
        onCancel={() => setShowEditModal(false)}
        footer={null}
        width={500}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleSubmitEdit}
        >
          <Form.Item label="昵称" name="nickname" rules={[{ required: true, message: '请输入昵称' }]}>
            <Input placeholder="请输入昵称" />
          </Form.Item>

          <Form.Item label="手机号" name="phone">
            <Input placeholder="请输入手机号" disabled />
          </Form.Item>

          <Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Button block onClick={() => setShowEditModal(false)}>
                  取消
                </Button>
              </Col>
              <Col span={12}>
                <Button type="primary" block htmlType="submit" loading={loading}>
                  保存
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="成为房东"
        open={showBecomeLandlordModal}
        onCancel={() => setShowBecomeLandlordModal(false)}
        footer={null}
        width={500}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              fontSize: 48,
              color: '#ff4d4f',
              marginBottom: 16,
            }}
          >
            <HomeOutlined />
          </div>
          <Title level={4}>成为房东，轻松赚取收入</Title>
          <Text type="secondary">
            发布您的房源，迎接来自世界各地的房客
          </Text>
        </div>

        <Form
          form={landlordForm}
          layout="vertical"
          onFinish={handleBecomeLandlord}
        >
          <Form.Item label="真实姓名" name="realName">
            <Input placeholder="请输入真实姓名" />
          </Form.Item>

          <Form.Item label="身份证号" name="idCard">
            <Input placeholder="请输入身份证号" />
          </Form.Item>

          <Form.Item label="房源地址" name="houseAddress">
            <Input placeholder="请输入房源地址" />
          </Form.Item>

          <Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Button block onClick={() => setShowBecomeLandlordModal(false)}>
                  取消
                </Button>
              </Col>
              <Col span={12}>
                <Button type="primary" block htmlType="submit" loading={loading}>
                  提交申请
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Profile;