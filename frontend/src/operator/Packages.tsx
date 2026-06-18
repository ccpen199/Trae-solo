import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  InputNumber,
  Switch,
  Row,
  Col,
  message,
  Popconfirm,
  Spin,
  Empty,
  Descriptions,
  Tabs,
  List,
  Statistic,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  GiftOutlined,
  ShoppingOutlined,
  DollarOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import StatCard from '@/components/StatCard';
import { packageApi, orderApi } from '@/api';
import {
  DEVICE_TYPE_MAP,
  DEVICE_TYPE_COLORS,
  DEVICE_TYPE_ICONS,
} from '@/utils/constants';
import { formatPrice, formatDateTime, formatDuration } from '@/utils/format';
import type { Package, DeviceType } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const packageTypeMap: Record<string, { label: string; icon: string; color: string }> = {
  times: { label: '次卡', icon: '🎟️', color: '#1890ff' },
  duration: { label: '时长卡', icon: '⏱️', color: '#52c41a' },
  unlimited: { label: '无限卡', icon: '♾️', color: '#722ed1' },
  combo: { label: '组合套餐', icon: '🎁', color: '#fa8c16' },
};

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  active: { label: '已上架', color: 'success' },
  paused: { label: '已下架', color: 'warning' },
  expired: { label: '已过期', color: 'error' },
};

const OperatorPackages: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>();
  const [typeFilter, setTypeFilter] = useState<string>();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [salesData, setSalesData] = useState<any>(null);

  const [form] = Form.useForm();

  useEffect(() => {
    loadPackages();
  }, [pagination.current, pagination.pageSize, statusFilter, typeFilter, searchText]);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.packageType = typeFilter;
      if (searchText) params.keyword = searchText;

      const res = await packageApi.getPackages(params);
      if (res.success) {
        setPackages(res.data?.list || []);
        setPagination((prev) => ({
          ...prev,
          total: res.data?.pagination?.total || 0,
        }));
      }
    } catch (error) {
      console.error('Failed to load packages:', error);
      message.error('加载套餐列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPackage(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    form.setFieldsValue({
      ...pkg,
      features: pkg.features || [],
      applicableCommunities: pkg.applicableCommunities || [],
      applicableGrids: pkg.applicableGrids || [],
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingPackage) {
        const res = await packageApi.updatePackage(editingPackage._id, values);
        if (res.success) {
          message.success('套餐更新成功');
          setModalVisible(false);
          loadPackages();
        } else {
          message.error(res.message || '更新失败');
        }
      } else {
        const res = await packageApi.createPackage(values);
        if (res.success) {
          message.success('套餐创建成功');
          setModalVisible(false);
          form.resetFields();
          loadPackages();
        } else {
          message.error(res.message || '创建失败');
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleStatusChange = async (pkg: Package, status: 'active' | 'paused') => {
    try {
      const res = await packageApi.updatePackageStatus(pkg._id, status);
      if (res.success) {
        message.success(`套餐${status === 'active' ? '上架' : '下架'}成功`);
        loadPackages();
      } else {
        message.error(res.message || '操作失败');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleViewDetail = async (pkg: Package) => {
    setSelectedPackage(pkg);
    setDetailVisible(true);

    try {
      const res = await orderApi.getOrders({ packageId: pkg._id, pageSize: 100 });
      if (res.success) {
        const orders = res.data?.list || [];
        setSalesData({
          totalSales: orders.length,
          totalRevenue: orders.reduce((sum: number, order: any) => sum + order.amount, 0),
          totalUsers: new Set(orders.map((o: any) => o.userId)).size,
          recentOrders: orders.slice(0, 10),
        });
      }
    } catch (error) {
      console.error('Failed to load sales data:', error);
    }
  };

  const columns = [
    {
      title: '套餐名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Package) => (
        <Space>
          <span style={{ fontSize: 20 }}>{packageTypeMap[record.packageType]?.icon}</span>
          <Space direction="vertical" size={0}>
            <Text strong>{name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.code}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'packageType',
      key: 'packageType',
      render: (type: string) => {
        const config = packageTypeMap[type];
        return config ? <Tag color={config.color}>{config.label}</Tag> : type;
      },
    },
    {
      title: '适用设备',
      dataIndex: 'deviceType',
      key: 'deviceType',
      render: (type: string) => {
        if (type === 'all') return <Tag>全部设备</Tag>;
        return (
          <Tag color={DEVICE_TYPE_COLORS[type as DeviceType]}>
            {DEVICE_TYPE_ICONS[type as DeviceType]} {DEVICE_TYPE_MAP[type as DeviceType]}
          </Tag>
        );
      },
    },
    {
      title: '价格',
      key: 'price',
      render: (_: any, record: Package) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>
            {formatPrice(record.pricing.sellingPrice)}
          </Text>
          {record.pricing.originalPrice && (
            <Text delete type="secondary" style={{ fontSize: 12 }}>
              {formatPrice(record.pricing.originalPrice)}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '权益',
      key: 'benefits',
      render: (_: any, record: Package) => {
        const benefits = [];
        if (record.benefits.times) benefits.push(`${record.benefits.times}次`);
        if (record.benefits.duration) benefits.push(formatDuration(record.benefits.duration));
        if (record.benefits.validityDays) benefits.push(`${record.benefits.validityDays}天有效期`);
        if (record.benefits.discountRate) benefits.push(`${record.benefits.discountRate}折优惠`);
        return benefits.join(' / ');
      },
    },
    {
      title: '销量',
      dataIndex: 'soldCount',
      key: 'soldCount',
      render: (count: number) => <Text strong>{count}</Text>,
    },
    {
      title: '库存',
      dataIndex: 'totalStock',
      key: 'totalStock',
      render: (stock: number, record: Package) => {
        if (!stock) return <Tag color="green">不限</Tag>;
        const remaining = stock - record.soldCount;
        return (
          <Space>
            <Text>{remaining}</Text>
            <Text type="secondary">/ {stock}</Text>
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = statusMap[status];
        return config ? <Tag color={config.color}>{config.label}</Tag> : status;
      },
    },
    {
      title: '有效期',
      key: 'validity',
      render: (_: any, record: Package) => {
        if (record.startDate && record.endDate) {
          return (
            <Space direction="vertical" size={0}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatDateTime(record.startDate)}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                至 {formatDateTime(record.endDate)}
              </Text>
            </Space>
          );
        }
        return <Text type="secondary">长期有效</Text>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Package) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<GiftOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={record.status === 'expired'}
          >
            编辑
          </Button>
          {record.status === 'active' && (
            <Popconfirm
              title="确认下架该套餐?"
              description="下架后用户将无法购买"
              onConfirm={() => handleStatusChange(record, 'paused')}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<StopOutlined />}>
                下架
              </Button>
            </Popconfirm>
          )}
          {(record.status === 'paused' || record.status === 'draft') && (
            <Popconfirm
              title="确认上架该套餐?"
              onConfirm={() => handleStatusChange(record, 'active')}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<CheckCircleOutlined />}>
                上架
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card className="card-shadow">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>套餐定价管理</Title>
            <Space>
              <Button
                icon={<PlusOutlined />}
                type="primary"
                onClick={handleCreate}
              >
                创建套餐
              </Button>
              <Button icon={<ReloadOutlined />} onClick={loadPackages}>
                刷新
              </Button>
            </Space>
          </div>

          <Space style={{ marginBottom: 16, width: '100%' }} wrap>
            <Input.Search
              placeholder="搜索套餐名称/编码"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              style={{ width: 280 }}
              onSearch={(value: string) => {
                setSearchText(value);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => !e.target.value && setSearchText('')}
            />
            <Select
              placeholder="套餐类型"
              allowClear
              style={{ width: 140 }}
              value={typeFilter}
              onChange={(value) => {
                setTypeFilter(value);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
            >
              {Object.entries(packageTypeMap).map(([value, config]) => (
                <Option key={value} value={value}>
                  <Tag color={config.color}>{config.icon} {config.label}</Tag>
                </Option>
              ))}
            </Select>
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 140 }}
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
            >
              {Object.entries(statusMap).map(([value, config]) => (
                <Option key={value} value={value}>
                  <Tag color={config.color}>{config.label}</Tag>
                </Option>
              ))}
            </Select>
          </Space>

          <Table
            dataSource={packages}
            columns={columns}
            rowKey="_id"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            onChange={(page) => setPagination((prev) => ({ ...prev, current: page.current!, pageSize: page.pageSize! }))}
          />
        </Card>
      </Space>

      <Modal
        title={editingPackage ? '编辑套餐' : '创建套餐'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            deviceType: 'all',
            packageType: 'times',
            status: 'draft',
            features: [],
            benefits: {
              validityDays: 30,
            },
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="套餐名称"
                rules={[{ required: true, message: '请输入套餐名称' }]}
              >
                <Input placeholder="请输入套餐名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="套餐编码"
                rules={[{ required: true, message: '请输入套餐编码' }]}
              >
                <Input placeholder="请输入唯一编码" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="packageType"
                label="套餐类型"
                rules={[{ required: true, message: '请选择套餐类型' }]}
              >
                <Select placeholder="请选择套餐类型">
                  {Object.entries(packageTypeMap).map(([value, config]) => (
                    <Option key={value} value={value}>
                      {config.icon} {config.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="deviceType"
                label="适用设备"
                rules={[{ required: true, message: '请选择适用设备' }]}
              >
                <Select placeholder="请选择适用设备">
                  <Option value="all">全部设备</Option>
                  {Object.entries(DEVICE_TYPE_MAP).map(([value, label]) => (
                    <Option key={value} value={value}>
                      {DEVICE_TYPE_ICONS[value as DeviceType]} {label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true }]}
              >
                <Select placeholder="请选择状态">
                  {Object.entries(statusMap).map(([value, config]) => (
                    <Option key={value} value={value}>{config.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Card title="价格设置" size="small" type="inner">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name={['pricing', 'originalPrice']}
                  label="原价"
                >
                  <InputNumber
                    min={0}
                    precision={2}
                    placeholder="请输入原价"
                    style={{ width: '100%' }}
                    prefix="¥"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name={['pricing', 'sellingPrice']}
                  label="售价"
                  rules={[{ required: true, message: '请输入售价' }]}
                >
                  <InputNumber
                    min={0}
                    precision={2}
                    placeholder="请输入售价"
                    style={{ width: '100%' }}
                    prefix="¥"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="totalStock"
                  label="库存"
                >
                  <InputNumber
                    min={0}
                    placeholder="0表示不限"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="权益设置" size="small" type="inner" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item
                  name={['benefits', 'times']}
                  label="使用次数"
                >
                  <InputNumber
                    min={0}
                    placeholder="次卡必填"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name={['benefits', 'duration']}
                  label="使用时长"
                >
                  <InputNumber
                    min={0}
                    placeholder="分钟"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name={['benefits', 'validityDays']}
                  label="有效期"
                  rules={[{ required: true, message: '请输入有效期' }]}
                >
                  <InputNumber
                    min={1}
                    placeholder="天"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name={['benefits', 'discountRate']}
                  label="折扣率"
                >
                  <InputNumber
                    min={0}
                    max={10}
                    step={0.1}
                    placeholder="例如：8.5折"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="套餐特色" size="small" type="inner" style={{ marginTop: 16 }}>
            <Form.Item
              name="description"
              label="套餐描述"
            >
              <Input.TextArea rows={3} placeholder="请输入套餐描述" />
            </Form.Item>
            <Form.Item
              name="features"
              label="特色权益"
            >
              <Select
                mode="tags"
                placeholder="输入后回车添加特色权益"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Card>

          <Card title="适用范围" size="small" type="inner" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="applicableCommunities"
                  label="适用社区"
                >
                  <Select
                    mode="multiple"
                    placeholder="不选表示全部社区"
                    style={{ width: '100%' }}
                  >
                    <Option value="c1">阳光花园</Option>
                    <Option value="c2">绿城小区</Option>
                    <Option value="c3">幸福里</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="applicableGrids"
                  label="适用网格"
                >
                  <Select
                    mode="multiple"
                    placeholder="不选表示全部网格"
                    style={{ width: '100%' }}
                  >
                    <Option value="g1">网格A</Option>
                    <Option value="g2">网格B</Option>
                    <Option value="g3">网格C</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="limitPerUser"
                  label="每人限购"
                >
                  <InputNumber
                    min={0}
                    placeholder="0表示不限购"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="sort"
                  label="排序权重"
                >
                  <InputNumber
                    min={0}
                    placeholder="数值越大越靠前"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="有效期" size="small" type="inner" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="startDate"
                  label="开始时间"
                >
                  <DatePicker style={{ width: '100%' }} showTime />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="endDate"
                  label="结束时间"
                >
                  <DatePicker style={{ width: '100%' }} showTime />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingPackage ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <span style={{ fontSize: 20 }}>
              {selectedPackage && packageTypeMap[selectedPackage.packageType]?.icon}
            </span>
            <span>{selectedPackage?.name}</span>
            <Tag color={selectedPackage ? statusMap[selectedPackage.status]?.color : 'default'}>
              {selectedPackage && statusMap[selectedPackage.status]?.label}
            </Tag>
          </Space>
        }
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={900}
      >
        {selectedPackage && (
          <Tabs defaultActiveKey="info">
            <TabPane tab="套餐信息" key="info">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="套餐编码">{selectedPackage.code}</Descriptions.Item>
                <Descriptions.Item label="套餐类型">
                  <Tag color={packageTypeMap[selectedPackage.packageType]?.color}>
                    {packageTypeMap[selectedPackage.packageType]?.icon} {packageTypeMap[selectedPackage.packageType]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="适用设备">
                  {selectedPackage.deviceType === 'all' ? (
                    <Tag>全部设备</Tag>
                  ) : (
                    <Tag color={DEVICE_TYPE_COLORS[selectedPackage.deviceType as DeviceType]}>
                      {DEVICE_TYPE_ICONS[selectedPackage.deviceType as DeviceType]} {DEVICE_TYPE_MAP[selectedPackage.deviceType as DeviceType]}
                    </Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="售价">
                  <Text strong style={{ color: '#ff4d4f', fontSize: 18 }}>
                    {formatPrice(selectedPackage.pricing.sellingPrice)}
                  </Text>
                  {selectedPackage.pricing.originalPrice && (
                    <Text delete type="secondary" style={{ marginLeft: 8 }}>
                      {formatPrice(selectedPackage.pricing.originalPrice)}
                    </Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="已售">{selectedPackage.soldCount}份</Descriptions.Item>
                <Descriptions.Item label="库存">
                  {selectedPackage.totalStock ? `${selectedPackage.totalStock - selectedPackage.soldCount}/${selectedPackage.totalStock}` : '不限'}
                </Descriptions.Item>
                <Descriptions.Item label="权益">
                  <Space direction="vertical" size={0}>
                    {selectedPackage.benefits.times && <Text>• {selectedPackage.benefits.times}次使用</Text>}
                    {selectedPackage.benefits.duration && <Text>• {formatDuration(selectedPackage.benefits.duration)}</Text>}
                    {selectedPackage.benefits.validityDays && <Text>• {selectedPackage.benefits.validityDays}天有效期</Text>}
                    {selectedPackage.benefits.discountRate && <Text>• {selectedPackage.benefits.discountRate}折优惠</Text>}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="特色">
                  {selectedPackage.features?.map((f, i) => (
                    <Tag key={i}>{f}</Tag>
                  ))}
                </Descriptions.Item>
                <Descriptions.Item label="描述" span={2}>
                  {selectedPackage.description}
                </Descriptions.Item>
              </Descriptions>
            </TabPane>

            <TabPane tab="销售统计" key="sales">
              {salesData ? (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                      <StatCard
                        title="总销量"
                        value={salesData.totalSales}
                        icon={<ShoppingOutlined />}
                        color="#1890ff"
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <StatCard
                        title="总收入"
                        value={formatPrice(salesData.totalRevenue)}
                        icon={<DollarOutlined />}
                        color="#52c41a"
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <StatCard
                        title="购买人数"
                        value={salesData.totalUsers}
                        icon={<UserOutlined />}
                        color="#722ed1"
                      />
                    </Col>
                  </Row>

                  <Card title="最近订单" size="small">
                    {salesData.recentOrders?.length > 0 ? (
                      <List
                        dataSource={salesData.recentOrders}
                        renderItem={(order: any) => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={
                                <div
                                  style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 8,
                                    background: '#e6f7ff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 18,
                                  }}
                                >
                                  <GiftOutlined />
                                </div>
                              }
                              title={
                                <Space>
                                  <Text strong>订单: {order.orderNo}</Text>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {order.user?.nickname || order.userId}
                                  </Text>
                                </Space>
                              }
                              description={
                                <Space>
                                  <Text type="secondary">
                                    <ClockCircleOutlined /> {formatDateTime(order.createdAt)}
                                  </Text>
                                </Space>
                              }
                            />
                            <Text strong style={{ color: '#52c41a' }}>
                              +{formatPrice(order.amount)}
                            </Text>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty description="暂无订单" />
                    )}
                  </Card>
                </Space>
              ) : (
                <Empty description="暂无销售数据" />
              )}
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </Spin>
  );
};

export default OperatorPackages;
