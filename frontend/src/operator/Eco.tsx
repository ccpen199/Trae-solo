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
  Row,
  Col,
  message,
  Spin,
  Empty,
  Tabs,
  Descriptions,
  List,
  Avatar,
  Switch,
  DatePicker,
  Radio,
  Popconfirm,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  GiftOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
  FireOutlined,
  UserOutlined,
  ClockCircleOutlined,
  SendOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { ecoApi, analyticsApi } from '@/api';
import {
  DEVICE_TYPE_MAP,
  DEVICE_TYPE_COLORS,
  DEVICE_TYPE_ICONS,
} from '@/utils/constants';
import { formatPrice, formatDateTime, formatDuration, formatRelativeTime } from '@/utils/format';
import type { Voucher, DeviceType } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const voucherTypeMap: Record<string, { label: string; icon: string; color: string }> = {
  amount: { label: '金额券', icon: '💰', color: '#52c41a' },
  percentage: { label: '折扣券', icon: '🎁', color: '#fa8c16' },
  free: { label: '免费券', icon: '🎫', color: '#722ed1' },
};

const sourceMap: Record<string, { label: string; color: string }> = {
  eco_incentive: { label: '环保激励', color: '#52c41a' },
  promotion: { label: '促销活动', color: '#1890ff' },
  operation: { label: '运营发放', color: '#722ed1' },
  compensation: { label: '补偿', color: '#fa8c16' },
  referral: { label: '推荐奖励', color: '#eb2f96' },
};

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: '有效', color: 'success' },
  expired: { label: '已过期', color: 'error' },
  disabled: { label: '已停用', color: 'default' },
};

const OperatorEco: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('rules');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<string>();
  const [ecoStats, setEcoStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [streakRules, setStreakRules] = useState<any[]>([
    { days: 3, points: 10, voucher: null, enabled: true },
    { days: 7, points: 30, voucher: 'voucher_7day', enabled: true },
    { days: 15, points: 80, voucher: 'voucher_15day', enabled: true },
    { days: 30, points: 200, voucher: 'voucher_30day', enabled: true },
  ]);

  const [voucherModalVisible, setVoucherModalVisible] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [voucherForm] = Form.useForm();
  const [sendForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, typeFilter, statusFilter, searchText]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      };
      if (typeFilter) params.voucherType = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchText) params.keyword = searchText;

      const [vouchersRes, ecoRes, leaderboardRes] = await Promise.all([
        ecoApi.getAvailableVouchers(),
        analyticsApi.getEcoIncentiveStats(),
        ecoApi.getEcoLeaderboard({ limit: 10 }),
      ]);

      if (vouchersRes.success) {
        const allVouchers = vouchersRes.data || [];
        const filtered = allVouchers.filter((v: Voucher) => {
          if (typeFilter && v.voucherType !== typeFilter) return false;
          if (statusFilter && v.status !== statusFilter) return false;
          if (searchText && !v.name.includes(searchText) && !v.code.includes(searchText)) return false;
          return true;
        });
        setVouchers(filtered);
        setPagination((prev) => ({ ...prev, total: filtered.length }));
      }
      if (ecoRes.success) setEcoStats(ecoRes.data);
      if (leaderboardRes.success) setLeaderboard(leaderboardRes.data?.leaderboard || []);
    } catch (error) {
      console.error('Failed to load eco data:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVoucher = () => {
    setEditingVoucher(null);
    voucherForm.resetFields();
    setVoucherModalVisible(true);
  };

  const handleEditVoucher = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    voucherForm.setFieldsValue({
      ...voucher,
      deviceType: voucher.deviceType,
      applicableCommunities: voucher.applicableCommunities || [],
    });
    setVoucherModalVisible(true);
  };

  const handleVoucherSubmit = async (values: any) => {
    try {
      message.success(editingVoucher ? '优惠券更新成功' : '优惠券创建成功');
      setVoucherModalVisible(false);
      voucherForm.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleVoucherStatus = async (voucher: Voucher, status: 'active' | 'disabled') => {
    try {
      message.success(`优惠券${status === 'active' ? '启用' : '停用'}成功`);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSendVoucher = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    sendForm.resetFields();
    setSendModalVisible(true);
  };

  const handleSendSubmit = async (values: any) => {
    try {
      message.success('优惠券发放成功');
      setSendModalVisible(false);
      loadData();
    } catch (error) {
      message.error('发放失败');
    }
  };

  const handleStreakRuleChange = (index: number, field: string, value: any) => {
    const newRules = [...streakRules];
    newRules[index] = { ...newRules[index], [field]: value };
    setStreakRules(newRules);
  };

  const handleSaveStreakRules = () => {
    message.success('激励规则保存成功');
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'top-1';
    if (rank === 2) return 'top-2';
    if (rank === 3) return 'top-3';
    return 'other';
  };

  const voucherColumns = [
    {
      title: '优惠券编码',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <Text strong>{code}</Text>,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'voucherType',
      key: 'voucherType',
      render: (type: string) => {
        const config = voucherTypeMap[type];
        return config ? (
          <Tag color={config.color}>
            {config.icon} {config.label}
          </Tag>
        ) : type;
      },
    },
    {
      title: '优惠',
      key: 'discount',
      render: (_: any, record: Voucher) => {
        if (record.voucherType === 'amount') {
          return <Text strong style={{ color: '#52c41a' }}>{formatPrice(record.discountValue || 0)}</Text>;
        }
        if (record.voucherType === 'percentage') {
          return <Text strong style={{ color: '#fa8c16' }}>{record.discountRate}折</Text>;
        }
        return <Tag color="purple">免费</Tag>;
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
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => {
        const config = sourceMap[source];
        return config ? <Tag color={config.color}>{config.label}</Tag> : source;
      },
    },
    {
      title: '使用门槛',
      dataIndex: 'minSpend',
      key: 'minSpend',
      render: (min: number) => min ? formatPrice(min) : '无门槛',
    },
    {
      title: '库存/已发/已用',
      key: 'stats',
      render: (_: any, record: Voucher) => (
        <Space direction="vertical" size={0}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            库存: {record.totalQuantity ?? '不限'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            已发: {record.issuedCount} | 已用: {record.usedCount}
          </Text>
        </Space>
      ),
    },
    {
      title: '有效期',
      key: 'validity',
      render: (_: any, record: Voucher) => {
        if (record.validity.type === 'fixed') {
          return (
            <Space direction="vertical" size={0}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatDateTime(record.validity.startDate)}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                至 {formatDateTime(record.validity.endDate)}
              </Text>
            </Space>
          );
        }
        return <Text type="secondary">领取后{record.validity.daysAfterReceive}天有效</Text>;
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
      title: '操作',
      key: 'action',
      render: (_: any, record: Voucher) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<SendOutlined />}
            onClick={() => handleSendVoucher(record)}
            disabled={record.status !== 'active'}
          >
            发放
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditVoucher(record)}
          >
            编辑
          </Button>
          {record.status === 'active' ? (
            <Popconfirm
              title="确认停用该优惠券?"
              onConfirm={() => handleVoucherStatus(record, 'disabled')}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<StopOutlined />}>
                停用
              </Button>
            </Popconfirm>
          ) : record.status === 'disabled' ? (
            <Popconfirm
              title="确认启用该优惠券?"
              onConfirm={() => handleVoucherStatus(record, 'active')}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<CheckCircleOutlined />}>
                启用
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {ecoStats && (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <StatCard
                title="累计环保积分"
                value={ecoStats.totalPoints?.toLocaleString() || 0}
                icon={<RiseOutlined />}
                color="#52c41a"
                trend={ecoStats.pointsGrowth || 12.5}
                trendLabel="较上月"
              />
            </Col>
            <Col xs={24} sm={6}>
              <StatCard
                title="累计节电(度)"
                value={ecoStats.totalElectricitySaved?.toLocaleString() || 0}
                icon={<FireOutlined />}
                color="#fa8c16"
              />
            </Col>
            <Col xs={24} sm={6}>
              <StatCard
                title="累计节水(吨)"
                value={ecoStats.totalWaterSaved?.toLocaleString() || 0}
                icon={<EnvironmentOutlined />}
                color="#1890ff"
              />
            </Col>
            <Col xs={24} sm={6}>
              <StatCard
                title="累计减碳(kg)"
                value={ecoStats.totalCarbonSaved?.toLocaleString() || 0}
                icon={<RiseOutlined />}
                color="#52c41a"
              />
            </Col>
          </Row>
        )}

        <Card className="card-shadow">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>环保激励管理</Title>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
          </div>

          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="激励规则配置" key="rules">
              <Card title="连续使用激励规则" size="small">
                <Table
                  dataSource={streakRules}
                  rowKey="days"
                  pagination={false}
                  columns={[
                    {
                      title: '连续使用天数',
                      dataIndex: 'days',
                      key: 'days',
                      render: (days: number, record: any, index: number) => (
                        <Space>
                          <FireOutlined style={{ color: '#fa8c16' }} />
                          <InputNumber
                            min={1}
                            max={365}
                            value={days}
                            onChange={(value) => handleStreakRuleChange(index, 'days', value)}
                          />
                          <Text>天</Text>
                        </Space>
                      ),
                    },
                    {
                      title: '奖励积分',
                      dataIndex: 'points',
                      key: 'points',
                      render: (points: number, record: any, index: number) => (
                        <Space>
                          <InputNumber
                            min={0}
                            value={points}
                            onChange={(value) => handleStreakRuleChange(index, 'points', value)}
                          />
                          <Text type="secondary">积分</Text>
                        </Space>
                      ),
                    },
                    {
                      title: '奖励优惠券',
                      dataIndex: 'voucher',
                      key: 'voucher',
                      render: (voucher: string, record: any, index: number) => (
                        <Select
                          style={{ width: 200 }}
                          placeholder="选择优惠券"
                          allowClear
                          value={voucher}
                          onChange={(value) => handleStreakRuleChange(index, 'voucher', value)}
                        >
                          {vouchers.filter(v => v.status === 'active').map(v => (
                            <Option key={v._id} value={v._id}>{v.name}</Option>
                          ))}
                        </Select>
                      ),
                    },
                    {
                      title: '启用',
                      dataIndex: 'enabled',
                      key: 'enabled',
                      render: (enabled: boolean, record: any, index: number) => (
                        <Switch
                          checked={enabled}
                          onChange={(checked) => handleStreakRuleChange(index, 'enabled', checked)}
                        />
                      ),
                    },
                  ]}
                />
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <Button type="primary" onClick={handleSaveStreakRules}>
                    保存规则
                  </Button>
                </div>
              </Card>

              <Card title="积分获取规则" size="small" style={{ marginTop: 16 }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="每次使用奖励">
                        <InputNumber min={0} defaultValue={5} /> 积分/次
                      </Descriptions.Item>
                      <Descriptions.Item label="每日上限">
                        <InputNumber min={0} defaultValue={20} /> 积分
                      </Descriptions.Item>
                      <Descriptions.Item label="首次使用奖励">
                        <InputNumber min={0} defaultValue={50} /> 积分
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="节能模式额外奖励">
                        <InputNumber min={0} defaultValue={10} /> %
                      </Descriptions.Item>
                      <Descriptions.Item label="错峰使用额外奖励">
                        <InputNumber min={0} defaultValue={15} /> %
                      </Descriptions.Item>
                      <Descriptions.Item label="分享奖励">
                        <InputNumber min={0} defaultValue={20} /> 积分
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                </Row>
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <Button type="primary">保存积分规则</Button>
                </div>
              </Card>
            </TabPane>

            <TabPane tab="优惠券管理" key="vouchers">
              <Space style={{ marginBottom: 16, width: '100%' }} wrap>
                <Search
                  placeholder="搜索优惠券名称/编码"
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="middle"
                  style={{ width: 280 }}
                  onSearch={(value) => {
                    setSearchText(value);
                    setPagination((prev) => ({ ...prev, current: 1 }));
                  }}
                  onChange={(e) => !e.target.value && setSearchText('')}
                />
                <Select
                  placeholder="优惠券类型"
                  allowClear
                  style={{ width: 140 }}
                  value={typeFilter}
                  onChange={(value) => {
                    setTypeFilter(value);
                    setPagination((prev) => ({ ...prev, current: 1 }));
                  }}
                >
                  {Object.entries(voucherTypeMap).map(([value, config]) => (
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
                <Button
                  icon={<PlusOutlined />}
                  type="primary"
                  onClick={handleCreateVoucher}
                >
                  创建优惠券
                </Button>
              </Space>

              <Table
                dataSource={vouchers}
                columns={voucherColumns}
                rowKey="_id"
                pagination={{
                  ...pagination,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条`,
                }}
                onChange={(page) => setPagination((prev) => ({ ...prev, current: page.current!, pageSize: page.pageSize! }))}
              />
            </TabPane>

            <TabPane tab="环保数据统计" key="stats">
              {ecoStats && (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                      <Card size="small">
                        <Statistic
                          title="参与用户数"
                          value={ecoStats.totalUsers || 0}
                          prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Card size="small">
                        <Statistic
                          title="今日活跃用户"
                          value={ecoStats.todayActiveUsers || 0}
                          prefix={<FireOutlined style={{ color: '#fa8c16' }} />}
                          valueStyle={{ color: '#fa8c16' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Card size="small">
                        <Statistic
                          title="平均连续使用天数"
                          value={ecoStats.avgStreakDays?.toFixed(1) || 0}
                          suffix="天"
                          prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Card title="环保贡献统计" size="small">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12}>
                        <List
                          dataSource={[
                            { label: '累计节电', value: ecoStats.totalElectricitySaved || 0, unit: '度', icon: '⚡', color: '#fa8c16' },
                            { label: '累计节水', value: ecoStats.totalWaterSaved || 0, unit: '吨', icon: '💧', color: '#1890ff' },
                          ]}
                          renderItem={(item) => (
                            <List.Item>
                              <List.Item.Meta
                                avatar={
                                  <div
                                    style={{
                                      width: 48,
                                      height: 48,
                                      borderRadius: 8,
                                      background: `${item.color}20`,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: 24,
                                    }}
                                  >
                                    {item.icon}
                                  </div>
                                }
                                title={item.label}
                                description={`累计节省 ${item.value.toLocaleString()} ${item.unit}`}
                              />
                              <Text strong style={{ color: item.color, fontSize: 20 }}>
                                {item.value.toLocaleString()}
                                <Text type="secondary" style={{ fontSize: 14 }}> {item.unit}</Text>
                              </Text>
                            </List.Item>
                          )}
                        />
                      </Col>
                      <Col xs={24} sm={12}>
                        <List
                          dataSource={[
                            { label: '累计减碳', value: ecoStats.totalCarbonSaved || 0, unit: 'kg', icon: '🌱', color: '#52c41a' },
                            { label: '减少排放', value: ecoStats.totalEmissionSaved || 0, unit: 'kg', icon: '☁️', color: '#722ed1' },
                          ]}
                          renderItem={(item) => (
                            <List.Item>
                              <List.Item.Meta
                                avatar={
                                  <div
                                    style={{
                                      width: 48,
                                      height: 48,
                                      borderRadius: 8,
                                      background: `${item.color}20`,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: 24,
                                    }}
                                  >
                                    {item.icon}
                                  </div>
                                }
                                title={item.label}
                                description={`累计减少 ${item.value.toLocaleString()} ${item.unit}`}
                              />
                              <Text strong style={{ color: item.color, fontSize: 20 }}>
                                {item.value.toLocaleString()}
                                <Text type="secondary" style={{ fontSize: 14 }}> {item.unit}</Text>
                              </Text>
                            </List.Item>
                          )}
                        />
                      </Col>
                    </Row>
                  </Card>

                  <Card title="设备类型环保贡献" size="small">
                    <Table
                      dataSource={ecoStats.byDeviceType || []}
                      columns={[
                        {
                          title: '设备类型',
                          dataIndex: 'deviceType',
                          key: 'deviceType',
                          render: (type: string) => (
                            <Space>
                              <span>{DEVICE_TYPE_ICONS[type as DeviceType]}</span>
                              <Text>{DEVICE_TYPE_MAP[type as DeviceType]}</Text>
                            </Space>
                          ),
                        },
                        {
                          title: '使用次数',
                          dataIndex: 'usageCount',
                          key: 'usageCount',
                          render: (v: number) => v.toLocaleString(),
                        },
                        {
                          title: '节电(度)',
                          dataIndex: 'electricitySaved',
                          key: 'electricitySaved',
                          render: (v: number) => v.toLocaleString(),
                        },
                        {
                          title: '节水(吨)',
                          dataIndex: 'waterSaved',
                          key: 'waterSaved',
                          render: (v: number) => v.toLocaleString(),
                        },
                        {
                          title: '减碳(kg)',
                          dataIndex: 'carbonSaved',
                          key: 'carbonSaved',
                          render: (v: number) => v.toLocaleString(),
                        },
                      ]}
                      pagination={false}
                    />
                  </Card>
                </Space>
              )}
            </TabPane>

            <TabPane tab="排行榜" key="leaderboard">
              <Card title="环保排行榜" size="small">
                {leaderboard.length > 0 ? (
                  <List
                    dataSource={leaderboard}
                    renderItem={(item, index) => (
                      <div className="leaderboard-item">
                        <div className={`leaderboard-rank ${getRankStyle(index + 1)}`}>
                          {index + 1}
                        </div>
                        <Avatar
                          size={48}
                          src={item.avatar}
                          icon={<UserOutlined />}
                          style={{ marginRight: 12 }}
                        />
                        <Space direction="vertical" size={0} style={{ flex: 1 }}>
                          <Space>
                            <Text strong>{item.nickname || item.username}</Text>
                            {index < 3 && <TrophyOutlined style={{ color: '#faad14' }} />}
                          </Space>
                          <Space size="large">
                            <Text type="secondary">
                              <FireOutlined style={{ color: '#fa8c16' }} /> 连续{item.streakDays}天
                            </Text>
                            <Text type="secondary">
                              <RiseOutlined style={{ color: '#52c41a' }} /> {item.ecoPoints}积分
                            </Text>
                          </Space>
                        </Space>
                        <Space direction="vertical" align="end">
                          <Text strong style={{ color: '#52c41a', fontSize: 18 }}>
                            {item.ecoPoints?.toLocaleString()}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>积分</Text>
                        </Space>
                      </div>
                    )}
                  />
                ) : (
                  <Empty description="暂无排行榜数据" />
                )}
              </Card>
            </TabPane>
          </Tabs>
        </Card>
      </Space>

      <Modal
        title={editingVoucher ? '编辑优惠券' : '创建优惠券'}
        open={voucherModalVisible}
        onCancel={() => setVoucherModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={voucherForm}
          layout="vertical"
          onFinish={handleVoucherSubmit}
          initialValues={{
            voucherType: 'amount',
            deviceType: 'all',
            source: 'operation',
            status: 'active',
            validity: { type: 'relative', daysAfterReceive: 30 },
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="优惠券名称"
                rules={[{ required: true, message: '请输入名称' }]}
              >
                <Input placeholder="请输入优惠券名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="优惠券编码"
                rules={[{ required: true, message: '请输入编码' }]}
              >
                <Input placeholder="请输入唯一编码" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="voucherType"
                label="优惠券类型"
                rules={[{ required: true }]}
              >
                <Radio.Group>
                  {Object.entries(voucherTypeMap).map(([value, config]) => (
                    <Radio.Button key={value} value={value}>
                      {config.icon} {config.label}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="discountValue"
                label="优惠金额(元)"
                rules={[{ required: true, message: '请输入优惠金额' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  placeholder="请输入金额"
                  style={{ width: '100%' }}
                  prefix="¥"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="discountRate"
                label="折扣率(折)"
              >
                <InputNumber
                  min={0}
                  max={10}
                  step={0.1}
                  placeholder="例如：8.5"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="minSpend"
                label="最低消费(元)"
              >
                <InputNumber
                  min={0}
                  precision={2}
                  placeholder="0表示无门槛"
                  style={{ width: '100%' }}
                  prefix="¥"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="maxDiscount"
                label="最高优惠(元)"
              >
                <InputNumber
                  min={0}
                  precision={2}
                  placeholder="限折扣券"
                  style={{ width: '100%' }}
                  prefix="¥"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="deviceType"
                label="适用设备"
                rules={[{ required: true }]}
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
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="source"
                label="来源"
                rules={[{ required: true }]}
              >
                <Select placeholder="请选择来源">
                  {Object.entries(sourceMap).map(([value, config]) => (
                    <Option key={value} value={value}>
                      <Tag color={config.color}>{config.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalQuantity"
                label="发放总量"
              >
                <InputNumber
                  min={0}
                  placeholder="0表示不限"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Card title="有效期" size="small" type="inner">
            <Form.Item
              name={['validity', 'type']}
              label="有效期类型"
              rules={[{ required: true }]}
            >
              <Radio.Group>
                <Radio.Button value="relative">领取后N天有效</Radio.Button>
                <Radio.Button value="fixed">固定时间段</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, curValues) => prevValues.validity?.type !== curValues.validity?.type}
            >
              {({ getFieldValue }) => {
                const type = getFieldValue(['validity', 'type']);
                if (type === 'relative') {
                  return (
                    <Form.Item
                      name={['validity', 'daysAfterReceive']}
                      label="有效天数"
                      rules={[{ required: true, message: '请输入有效天数' }]}
                    >
                      <InputNumber
                        min={1}
                        placeholder="天"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  );
                }
                return (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name={['validity', 'startDate']}
                        label="开始时间"
                        rules={[{ required: true, message: '请选择开始时间' }]}
                      >
                        <DatePicker style={{ width: '100%' }} showTime />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={['validity', 'endDate']}
                        label="结束时间"
                        rules={[{ required: true, message: '请选择结束时间' }]}
                      >
                        <DatePicker style={{ width: '100%' }} showTime />
                      </Form.Item>
                    </Col>
                  </Row>
                );
              }}
            </Form.Item>
          </Card>

          <Card title="领取条件" size="small" type="inner" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={['ecoCondition', 'streakDays']}
                  label="要求连续使用天数"
                >
                  <InputNumber
                    min={0}
                    placeholder="0表示不限制"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={['ecoCondition', 'minPoints']}
                  label="要求最低积分"
                >
                  <InputNumber
                    min={0}
                    placeholder="0表示不限制"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
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
            </Row>
          </Card>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingVoucher ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setVoucherModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <SendOutlined />
            <span>发放优惠券</span>
            {selectedVoucher && (
              <Tag color={voucherTypeMap[selectedVoucher.voucherType]?.color}>
                {selectedVoucher.name}
              </Tag>
            )}
          </Space>
        }
        open={sendModalVisible}
        onCancel={() => setSendModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={sendForm}
          layout="vertical"
          onFinish={handleSendSubmit}
        >
          <Form.Item
            name="targetType"
            label="发放对象"
            rules={[{ required: true, message: '请选择发放对象' }]}
          >
            <Radio.Group>
              <Radio.Button value="all">全部用户</Radio.Button>
              <Radio.Button value="community">指定社区</Radio.Button>
              <Radio.Button value="users">指定用户</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, curValues) => prevValues.targetType !== curValues.targetType}
          >
            {({ getFieldValue }) => {
              const targetType = getFieldValue('targetType');
              if (targetType === 'community') {
                return (
                  <Form.Item
                    name="communityIds"
                    label="选择社区"
                    rules={[{ required: true, message: '请选择社区' }]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="请选择社区"
                      style={{ width: '100%' }}
                    >
                      <Option value="c1">阳光花园</Option>
                      <Option value="c2">绿城小区</Option>
                      <Option value="c3">幸福里</Option>
                    </Select>
                  </Form.Item>
                );
              }
              if (targetType === 'users') {
                return (
                  <Form.Item
                    name="userIds"
                    label="选择用户"
                    rules={[{ required: true, message: '请选择用户' }]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="搜索用户手机号/昵称"
                      showSearch
                      style={{ width: '100%' }}
                    >
                      <Option value="u1">用户1 - 138****8888</Option>
                      <Option value="u2">用户2 - 139****9999</Option>
                      <Option value="u3">用户3 - 137****7777</Option>
                    </Select>
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item
            name="quantity"
            label="每人发放数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber min={1} defaultValue={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="reason"
            label="发放原因"
          >
            <Input.TextArea rows={3} placeholder="请输入发放原因（选填）" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认发放
              </Button>
              <Button onClick={() => setSendModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
};

export default OperatorEco;
