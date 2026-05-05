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
  Empty,
  List,
  Avatar,
  Tabs,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  message,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  EnvironmentOutlined,
  UserOutlined,
  StarOutlined,
  CalendarOutlined,
  HomeOutlined,
  TagOutlined,
  RightOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useUserStore } from '@/stores/userStore';
import { demandService } from '@/services/demandService';
import { houseService } from '@/services/houseService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const houseTypes = [
  { label: '公寓', value: 'apartment' },
  { label: '住宅', value: 'house' },
  { label: '别墅', value: 'villa' },
  { label: 'LOFT', value: 'loft' },
  { label: '单间', value: 'studio' },
];

const cities = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '三亚', '南京',
  '武汉', '西安', '重庆', '厦门', '苏州', '青岛', '大连', '天津'
];

const amenities = [
  { label: 'WiFi', value: 'wifi' },
  { label: '免费停车', value: 'parking' },
  { label: '厨房', value: 'kitchen' },
  { label: '洗衣机', value: 'washing_machine' },
  { label: '空调', value: 'air_conditioner' },
  { label: '暖气', value: 'heater' },
  { label: '电视', value: 'tv' },
  { label: '冰箱', value: 'refrigerator' },
  { label: '阳台', value: 'balcony' },
  { label: '泳池', value: 'swimming_pool' },
  { label: '允许吸烟', value: 'smoking_allowed' },
  { label: '允许携带宠物', value: 'pet_allowed' },
];

function Demand() {
  const navigate = useNavigate();
  const { user, token } = useUserStore();
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(false);
  const [demands, setDemands] = useState([]);
  const [myDemands, setMyDemands] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [createForm] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const tabItems = [
    { key: 'list', label: '全部需求' },
    { key: 'my', label: '我的需求' },
  ];

  useEffect(() => {
    if (activeTab === 'list') {
      fetchDemands();
    } else {
      fetchMyDemands();
    }
  }, [activeTab]);

  const fetchDemands = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
      };

      const result = await demandService.getDemands(params);
      setDemands(result.demands || []);
      setPagination({
        ...pagination,
        total: result.pagination?.total || 0,
      });
    } catch (error) {
      console.error('获取需求列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyDemands = async () => {
    if (!token) {
      setMyDemands([]);
      return;
    }
    try {
      setLoading(true);
      const result = await demandService.getMyDemands({ limit: 50 });
      setMyDemands(result.demands || []);
    } catch (error) {
      console.error('获取我的需求失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleCreateClick = () => {
    if (!token) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    createForm.resetFields();
    setShowCreateModal(true);
  };

  const handleSubmitCreate = async (values) => {
    try {
      setLoading(true);

      const checkInDate = values.checkInOut?.[0];
      const checkOutDate = values.checkInOut?.[1];

      if (!checkInDate || !checkOutDate) {
        message.error('请选择入住和退房日期');
        return;
      }

      const demandData = {
        ...values,
        checkInDate: checkInDate.format('YYYY-MM-DD'),
        checkOutDate: checkOutDate.format('YYYY-MM-DD'),
      };

      delete demandData.checkInOut;

      const result = await demandService.createDemand(demandData);
      message.success(`需求发布成功！已匹配到 ${result.matchedCount || 0} 套房源`);
      setShowCreateModal(false);
      fetchMyDemands();
    } catch (error) {
      console.error('发布需求失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDetailClick = async (demand) => {
    try {
      setLoading(true);
      const result = await demandService.getDemandDetail(demand.id);
      setSelectedDemand(result);
      setShowDetailModal(true);
    } catch (error) {
      console.error('获取需求详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDemand = async (demandId) => {
    Modal.confirm({
      title: '确认关闭需求',
      content: '关闭后该需求将不再展示给房东，确定要关闭吗？',
      okText: '确认关闭',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await demandService.updateDemandStatus(demandId, 'closed');
          message.success('需求已关闭');
          fetchMyDemands();
        } catch (error) {
          console.error('关闭需求失败:', error);
        }
      },
    });
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      published: { label: '发布中', color: 'green' },
      draft: { label: '草稿', color: 'default' },
      expired: { label: '已过期', color: 'orange' },
      closed: { label: '已关闭', color: 'default' },
      booked: { label: '已预订', color: 'blue' },
    };
    return statusMap[status] || { label: status, color: 'default' };
  };

  const renderDemandItem = (demand, isMyDemand = false) => {
    const statusInfo = getStatusInfo(demand.status);
    return (
      <Card
        key={demand.id}
        hoverable
        onClick={() => handleDetailClick(demand)}
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[24, 8]}>
          <Col flex="auto">
            <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
              <Col>
                <Space>
                  <Text strong style={{ fontSize: 16 }}>
                    {demand.title}
                  </Text>
                  {demand.isUrgent && (
                    <Tag color="red">
                      <ClockCircleOutlined /> 加急
                    </Tag>
                  )}
                  <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                </Space>
              </Col>
              <Col>
                <Space>
                  {demand.viewCount && (
                    <Text type="secondary">
                      <EyeOutlined style={{ marginRight: 4 }} />
                      {demand.viewCount} 次浏览
                    </Text>
                  )}
                  {demand.matchedCount > 0 && (
                    <Tag color="green">
                      已匹配 {demand.matchedCount} 套房源
                    </Tag>
                  )}
                </Space>
              </Col>
            </Row>

            <Row gutter={[24, 8]} style={{ marginBottom: 8 }}>
              <Col>
                <Space>
                  <EnvironmentOutlined style={{ color: '#999' }} />
                  <Text type="secondary">
                    {demand.city}
                    {demand.district && ` · ${demand.district}`}
                  </Text>
                </Space>
              </Col>
              <Col>
                <Space>
                  <CalendarOutlined style={{ color: '#999' }} />
                  <Text type="secondary">
                    {dayjs(demand.checkInDate).format('MM-DD')} 至{' '}
                    {dayjs(demand.checkOutDate).format('MM-DD')}
                    （{demand.nights} 晚）
                  </Text>
                </Space>
              </Col>
              <Col>
                <Space>
                  <UserOutlined style={{ color: '#999' }} />
                  <Text type="secondary">{demand.maxGuests} 人</Text>
                </Space>
              </Col>
              {demand.minPrice && demand.maxPrice && (
                <Col>
                  <Space>
                    <TagOutlined style={{ color: '#999' }} />
                    <Text type="secondary">
                      预算 ¥{demand.minPrice} - ¥{demand.maxPrice}/晚
                    </Text>
                  </Space>
                </Col>
              )}
            </Row>

            {demand.houseType && demand.houseType.length > 0 && (
              <Row style={{ marginBottom: 8 }}>
                <Space>
                  {demand.houseType.map((type) => (
                    <Tag key={type}>
                      {houseTypes.find((t) => t.value === type)?.label || type}
                    </Tag>
                  ))}
                </Space>
              </Row>
            )}

            {demand.description && (
              <Paragraph
                ellipsis={{ rows: 2 }}
                style={{ marginBottom: 0 }}
              >
                {demand.description}
              </Paragraph>
            )}
          </Col>

          {isMyDemand && (
            <Col flex="none">
              <Space direction="vertical">
                <Button type="link" onClick={(e) => {
                  e.stopPropagation();
                  handleDetailClick(demand);
                }}>
                  查看详情
                </Button>
                {demand.status === 'published' && (
                  <Button
                    type="link"
                    danger
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseDemand(demand.id);
                    }}
                  >
                    关闭需求
                  </Button>
                )}
              </Space>
            </Col>
          )}
        </Row>

        {demand.user && (
          <Row align="middle" style={{ marginTop: 12 }}>
            <Avatar
              size={28}
              icon={<UserOutlined />}
              src={demand.user.avatar}
              style={{ backgroundColor: '#ff4d4f', marginRight: 8 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {demand.user.nickname}
              {demand.user.isVerified && (
                <Tag color="green" style={{ marginLeft: 8, fontSize: 11 }}>
                  已认证
                </Tag>
              )}
              <span style={{ marginLeft: 8 }}>
                发布于 {dayjs(demand.createdAt).format('MM-DD HH:mm')}
              </span>
            </Text>
          </Row>
        )}
      </Card>
    );
  };

  const renderListContent = () => (
    <Card
      title="全部找房需求"
      bordered={false}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateClick}>
          发布需求
        </Button>
      }
    >
      <Spin spinning={loading}>
        {demands.length === 0 ? (
          <Empty
            description={
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  暂无找房需求
                </Text>
                <Button type="primary" onClick={handleCreateClick}>
                  发布我的需求
                </Button>
              </div>
            }
            style={{ padding: '60px 0' }}
          />
        ) : (
          <div>{demands.map((demand) => renderDemandItem(demand))}</div>
        )}
      </Spin>
    </Card>
  );

  const renderMyContent = () => (
    <Card
      title="我的需求"
      bordered={false}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateClick}>
          发布新需求
        </Button>
      }
    >
      <Spin spinning={loading}>
        {!token ? (
          <Empty
            description={
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  请先登录查看我的需求
                </Text>
                <Button type="primary" onClick={() => navigate('/login')}>
                  去登录
                </Button>
              </div>
            }
            style={{ padding: '60px 0' }}
          />
        ) : myDemands.length === 0 ? (
          <Empty
            description={
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  您还没有发布过找房需求
                </Text>
                <Button type="primary" onClick={handleCreateClick}>
                  发布需求
                </Button>
              </div>
            }
            style={{ padding: '60px 0' }}
          />
        ) : (
          <div>{myDemands.map((demand) => renderDemandItem(demand, true))}</div>
        )}
      </Spin>
    </Card>
  );

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <SearchOutlined style={{ marginRight: 8 }} />
            找房需求
          </Title>
          <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
            发布您的找房需求，让房东主动联系您
          </Text>
        </Col>
        <Col>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleCreateClick}>
            发布需求
          </Button>
        </Col>
      </Row>

      <Card bordered={false}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
        />

        <Divider style={{ margin: '16px 0' }} />

        {activeTab === 'list' ? renderListContent() : renderMyContent()}
      </Card>

      <Modal
        title="发布找房需求"
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        footer={null}
        width={700}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleSubmitCreate}
          initialValues={{
            maxGuests: 2,
            isUrgent: false,
          }}
        >
          <Row gutter={[16, 0]}>
            <Col span={24}>
              <Form.Item
                label="需求标题"
                name="title"
                rules={[{ required: true, message: '请输入需求标题' }]}
              >
                <Input placeholder="例如：北京3居室家庭出游" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                label="目标城市"
                name="city"
                rules={[{ required: true, message: '请选择目标城市' }]}
              >
                <Select
                  placeholder="请选择城市"
                  showSearch
                  options={cities.map((c) => ({ label: c, value: c }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="区域" name="district">
                <Input placeholder="例如：朝阳区" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                label="入住日期"
                name="checkInOut"
                rules={[{ required: true, message: '请选择入住日期' }]}
              >
                <RangePicker
                  style={{ width: '100%' }}
                  placeholder={['入住日期', '退房日期']}
                  disabledDate={(current) =>
                    current && current < dayjs().startOf('day')
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="入住人数"
                name="maxGuests"
                rules={[{ required: true, message: '请选择入住人数' }]}
              >
                <Select
                  placeholder="请选择人数"
                  options={[
                    { label: '1人', value: 1 },
                    { label: '2人', value: 2 },
                    { label: '3人', value: 3 },
                    { label: '4人', value: 4 },
                    { label: '5人', value: 5 },
                    { label: '6人及以上', value: 6 },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item label="最低预算（元/晚）" name="minPrice">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入最低预算"
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="最高预算（元/晚）" name="maxPrice">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入最高预算"
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item label="户型偏好" name="houseType">
                <Select
                  mode="multiple"
                  placeholder="请选择户型偏好（可多选）"
                  options={houseTypes}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="卧室数量" name="bedrooms">
                <Select
                  placeholder="请选择卧室数量"
                  options={[
                    { label: '不限', value: undefined },
                    { label: '1室', value: 1 },
                    { label: '2室', value: 2 },
                    { label: '3室', value: 3 },
                    { label: '4室及以上', value: 4 },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="设施需求" name="amenities">
            <Select
              mode="multiple"
              placeholder="请选择需要的设施（可多选）"
              options={amenities}
            />
          </Form.Item>

          <Form.Item label="需求描述" name="description">
            <TextArea
              rows={4}
              placeholder="请详细描述您的找房需求，例如：家庭出游，需要靠近地铁，有儿童设施等..."
            />
          </Form.Item>

          <Form.Item label="特殊要求" name="specialRequirements">
            <Input placeholder="例如：需要有停车位、允许携带宠物等" />
          </Form.Item>

          <Form.Item label="是否加急" name="isUrgent" valuePropName="checked">
            <Switch />
            <Text type="secondary" style={{ marginLeft: 8 }}>
              加急需求会优先展示给房东
            </Text>
          </Form.Item>

          <Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Button block onClick={() => setShowCreateModal(false)}>
                  取消
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  type="primary"
                  block
                  htmlType="submit"
                  loading={loading}
                  size="large"
                >
                  发布需求
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="需求详情"
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        footer={null}
        width={700}
      >
        {selectedDemand && (
          <Spin spinning={loading}>
            <Card bordered={false}>
              <Title level={4} style={{ marginBottom: 16 }}>
                {selectedDemand.demand?.title}
                {selectedDemand.demand?.isUrgent && (
                  <Tag color="red" style={{ marginLeft: 8 }}>
                    加急
                  </Tag>
                )}
              </Title>

              <Descriptions column={2} bordered>
                <Descriptions.Item label="目标城市">
                  {selectedDemand.demand?.city}
                </Descriptions.Item>
                <Descriptions.Item label="区域">
                  {selectedDemand.demand?.district || '不限'}
                </Descriptions.Item>
                <Descriptions.Item label="入住日期">
                  {dayjs(selectedDemand.demand?.checkInDate).format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label="退房日期">
                  {dayjs(selectedDemand.demand?.checkOutDate).format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label="入住人数">
                  {selectedDemand.demand?.maxGuests} 人
                </Descriptions.Item>
                <Descriptions.Item label="入住晚数">
                  {selectedDemand.demand?.nights} 晚
                </Descriptions.Item>
                <Descriptions.Item label="预算">
                  {selectedDemand.demand?.minPrice && selectedDemand.demand?.maxPrice
                    ? `¥${selectedDemand.demand.minPrice} - ¥${selectedDemand.demand.maxPrice}/晚`
                    : '不限'}
                </Descriptions.Item>
                <Descriptions.Item label="发布时间">
                  {dayjs(selectedDemand.demand?.createdAt).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              </Descriptions>

              {selectedDemand.demand?.description && (
                <div style={{ marginTop: 16 }}>
                  <Text strong>需求描述：</Text>
                  <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                    {selectedDemand.demand.description}
                  </Paragraph>
                </div>
              )}

              {selectedDemand.matchedHouses && selectedDemand.matchedHouses.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <Divider />
                  <Title level={5} style={{ marginBottom: 16 }}>
                    匹配到的房源（{selectedDemand.matchedHouses.length} 套）
                  </Title>
                  <Row gutter={[16, 16]}>
                    {selectedDemand.matchedHouses.slice(0, 6).map((house) => (
                      <Col xs={24} sm={12} key={house.id}>
                        <Card
                          hoverable
                          onClick={() => {
                            setShowDetailModal(false);
                            navigate(`/houses/${house.id}`);
                          }}
                          bodyStyle={{ padding: 0 }}
                        >
                          <div
                            style={{
                              height: 120,
                              backgroundImage: `url(${house.images?.[0] || 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400'})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              borderRadius: '8px 8px 0 0',
                            }}
                          />
                          <div style={{ padding: 12 }}>
                            <div className="ellipsis" style={{ fontWeight: 500 }}>
                              {house.title}
                            </div>
                            <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {house.city} · {house.district}
                              </Text>
                              <Text style={{ color: '#ff4d4f', fontWeight: 600 }}>
                                ¥{house.pricePerNight}/晚
                              </Text>
                            </div>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </Card>
          </Spin>
        )}
      </Modal>
    </div>
  );
}

export default Demand;