import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Tag,
  Input,
  Select,
  Button,
  Avatar,
  Rate,
  Spin,
  Empty,
  Drawer,
  List,
  Badge,
  Descriptions,
  Alert,
  Statistic,
  Divider,
  Tabs,
  Table,
  Modal,
  message,
  Timeline,
} from 'antd';
import {
  SearchOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  CalendarOutlined,
  DollarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  ArrowRightOutlined,
  BellOutlined,
  UserOutlined,
  HomeOutlined,
  FlagOutlined,
} from '@ant-design/icons';
import { providerAPI, statsAPI, gridAPI } from '../services/api';

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const Services = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<any[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<any[]>([]);
  const [grids, setGrids] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [serviceType, setServiceType] = useState<string>('');
  const [selectedGrid, setSelectedGrid] = useState<string>('');
  const [reviewStatus, setReviewStatus] = useState<string>('');
  const [certifiedOnly, setCertifiedOnly] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [renewalList, setRenewalList] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProviders();
  }, [searchText, serviceType, selectedGrid, reviewStatus, certifiedOnly, providers]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [providersRes, renewalRes, disputesRes, settlementsRes, gridsRes] = await Promise.all([
        providerAPI.getList(),
        providerAPI.getRenewalList(),
        statsAPI.getDisputes(),
        statsAPI.getSettlements(),
        gridAPI.getList(),
      ]);
      setProviders(providersRes.data || []);
      setFilteredProviders(providersRes.data || []);
      setRenewalList(renewalRes.data || []);
      setDisputes(disputesRes.data || []);
      setSettlements(settlementsRes.data || []);
      setGrids(gridsRes.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProviders = () => {
    let filtered = [...providers];

    if (searchText) {
      filtered = filtered.filter((p) =>
        p.name.includes(searchText) || p.service_type.includes(searchText)
      );
    }

    if (serviceType) {
      filtered = filtered.filter((p) => p.service_type === serviceType);
    }

    if (selectedGrid) {
      filtered = filtered.filter((p) => p.grid_code === selectedGrid);
    }

    if (reviewStatus) {
      filtered = filtered.filter((p) => p.review_status === reviewStatus);
    }

    if (certifiedOnly) {
      filtered = filtered.filter((p) => p.street_certified);
    }

    setFilteredProviders(filtered);
  };

  const serviceTypes = ['家政服务', '家电维修', '拼车出行', '餐饮外卖', '二手交易', '求职招聘'];

  const getReviewStatusTag = (status: string, date?: string) => {
    const today = new Date();
    const reviewDate = date ? new Date(date) : null;
    const daysDiff = reviewDate ? Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

    switch (status) {
      case 'approved':
        return (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            年审通过
            {daysDiff !== null && daysDiff <= 30 && (
              <span className="ml-1 text-orange-500">({daysDiff}天后到期)</span>
            )}
          </Tag>
        );
      case 'pending':
        return <Tag color="warning" icon={<ClockCircleOutlined />}>待审核</Tag>;
      case 'expired':
        return <Tag color="error" icon={<WarningOutlined />}>已过期</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const getDisputeStatusTag = (status: string) => {
    switch (status) {
      case 'resolved': return <Tag color="success">已解决</Tag>;
      case 'pending': return <Tag color="warning">待处理</Tag>;
      case 'rejected': return <Tag color="error">已驳回</Tag>;
      default: return <Tag>未知</Tag>;
    }
  };

  const getSettlementStatusTag = (status: string) => {
    switch (status) {
      case 'completed': return <Tag color="success">已结算</Tag>;
      case 'paid': return <Tag color="blue">已打款</Tag>;
      case 'pending': return <Tag color="warning">待结算</Tag>;
      default: return <Tag>未知</Tag>;
    }
  };

  const handleRenewal = async (providerId: number) => {
    try {
      const today = new Date();
      today.setFullYear(today.getFullYear() + 1);
      await providerAPI.renew(providerId, today.toISOString().split('T')[0]);
      message.success('年审更新成功！审核人：社区管理员');
      loadData();
      setShowRenewalModal(false);
    } catch (error) {
      message.error('年审更新失败');
    }
  };

  const handleDisputeSubmit = () => {
    if (!disputeReason) {
      message.error('请填写纠纷原因');
      return;
    }
    message.success('纠纷已提交，社区管理员将在24小时内处理');
    setShowDisputeModal(false);
    setDisputeReason('');
  };

  const approvedCount = providers.filter((p) => p.review_status === 'approved').length;
  const pendingCount = providers.filter((p) => p.review_status === 'pending').length;
  const expiredCount = providers.filter((p) => p.review_status === 'expired').length;
  const pendingSettlementCount = settlements.filter((s) => s.status === 'pending').length;
  const pendingDisputeCount = disputes.filter((d) => d.status === 'pending').length;

  const renewalColumns = [
    {
      title: '服务商名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '服务类型',
      dataIndex: 'service_type',
      key: 'service_type',
      render: (type: string) => <Tag color="orange">{type}</Tag>,
    },
    {
      title: '当前状态',
      dataIndex: 'review_status',
      key: 'review_status',
      render: (status: string) => getReviewStatusTag(status),
    },
    {
      title: '年审到期日',
      dataIndex: 'annual_review_date',
      key: 'annual_review_date',
      render: (date: string, record: any) => (
        <span className={record.review_status === 'expired' ? 'text-red-500 font-bold' : ''}>
          {date}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="primary" size="small" onClick={() => handleRenewal(record.id)}>
          立即年审
        </Button>
      ),
    },
  ];

  const settlementColumns = [
    {
      title: '结算周期',
      dataIndex: 'period',
      key: 'period',
    },
    {
      title: '结算金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => <span className="text-orange-500 font-bold">¥{amount}</span>,
    },
    {
      title: '归属网格',
      dataIndex: 'grid_code',
      key: 'grid_code',
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '审核人',
      dataIndex: 'reviewer',
      key: 'reviewer',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getSettlementStatusTag(status),
    },
  ];

  const disputeColumns = [
    {
      title: '需求ID',
      dataIndex: 'demand_id',
      key: 'demand_id',
    },
    {
      title: '纠纷描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '归属网格',
      dataIndex: 'grid_code',
      key: 'grid_code',
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '审核人',
      dataIndex: 'reviewer',
      key: 'reviewer',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getDisputeStatusTag(status),
    },
    {
      title: '处理结果',
      dataIndex: 'resolution',
      key: 'resolution',
      render: (r: string) => r || '-',
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeInUp">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Noto Serif SC, serif' }}>
              <span className="gradient-text">本地服务商</span>
            </h1>
            <p className="text-gray-500">经街道备案认证的优质服务商，LBS强绑定展示</p>
          </div>
          <div className="flex gap-3">
            <Button type="primary" icon={<BellOutlined />} onClick={() => setShowRenewalModal(true)}>
              年审提醒
              {renewalList.length > 0 && (
                <Badge count={renewalList.length} className="ml-2" />
              )}
            </Button>
            <Button onClick={() => navigate('/admin/settlement')} icon={<DollarOutlined />}>
              团长结算
            </Button>
          </div>
        </div>
      </div>

      {(pendingCount > 0 || expiredCount > 0) && (
        <Alert
          message={
            <div>
              有 <span className="text-orange-500 font-bold">{pendingCount}</span> 家服务商待审核，
              <span className="text-red-500 font-bold">{expiredCount}</span> 家已过期，请及时处理
            </div>
          }
          type="warning"
          showIcon
          className="mb-6"
          action={
            <Button size="small" type="primary" ghost onClick={() => setShowRenewalModal(true)}>
              查看处理
            </Button>
          }
        />
      )}

      <Card className="mb-6 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <Select
            placeholder="服务网格（LBS绑定）"
            style={{ width: 200 }}
            allowClear
            value={selectedGrid || undefined}
            onChange={setSelectedGrid}
          >
            {grids.map((g: any) => (
              <Option key={g.code} value={g.code}>
                <Tag color="blue" className="mr-2">LBS</Tag>
                {g.name}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="服务类型"
            style={{ width: 150 }}
            allowClear
            value={serviceType || undefined}
            onChange={setServiceType}
          >
            {serviceTypes.map((type) => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>

          <Select
            placeholder="年审状态"
            style={{ width: 150 }}
            allowClear
            value={reviewStatus || undefined}
            onChange={setReviewStatus}
          >
            <Option value="approved">年审通过</Option>
            <Option value="pending">待审核</Option>
            <Option value="expired">已过期</Option>
          </Select>

          <Button
            type={certifiedOnly ? 'primary' : 'default'}
            onClick={() => setCertifiedOnly(!certifiedOnly)}
          >
            <SafetyCertificateOutlined /> 仅街道备案
          </Button>

          <Search
            placeholder="搜索服务商名称"
            allowClear
            style={{ width: 250 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />

          <div className="ml-auto text-gray-500">
            共 <span className="text-orange-500 font-bold">{filteredProviders.length}</span> 家服务商
            {selectedGrid && <span className="ml-2">(当前网格)</span>}
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center">
            <Statistic
              title="认证服务商"
              value={providers.filter((p) => p.street_certified).length}
              prefix={<SafetyCertificateOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center">
            <Statistic
              title="待年审"
              value={pendingCount + expiredCount}
              prefix={<CalendarOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div className="text-xs text-gray-400 mt-1">
              待审核{pendingCount} · 已过期{expiredCount}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center">
            <Statistic
              title="待结算"
              value={pendingSettlementCount}
              prefix={<DollarOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center">
            <Statistic
              title="纠纷待处理"
              value={pendingDisputeCount}
              prefix={<WarningOutlined className="text-red-500" />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {filteredProviders.length === 0 ? (
        <Empty description="暂无符合条件的服务商" />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredProviders.map((provider) => (
            <Col xs={24} sm={12} lg={8} key={provider.id}>
              <Card
                className="card-hover h-full cursor-pointer"
                onClick={() => setSelectedProvider(provider)}
              >
                <div className="flex items-start gap-4">
                  <Badge.Ribbon
                    text={provider.review_status === 'expired' ? '年审过期' : provider.review_status === 'pending' ? '待审核' : ''}
                    color={provider.review_status === 'expired' ? 'red' : provider.review_status === 'pending' ? 'orange' : 'blue'}
                    style={{ display: provider.review_status === 'approved' ? 'none' : 'block' }}
                  >
                    <Avatar
                      size={64}
                      icon={<ShopOutlined />}
                      className="bg-gradient-to-br from-orange-400 to-orange-600"
                    />
                  </Badge.Ribbon>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg truncate">{provider.name}</h3>
                      {provider.street_certified && (
                        <Tag color="green" icon={<SafetyCertificateOutlined />}>
                          街道备案
                        </Tag>
                      )}
                    </div>
                    <Tag color="orange" className="mb-2">{provider.service_type}</Tag>
                    <div className="space-y-1 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <EnvironmentOutlined />
                        <span className="truncate">{provider.grid_code}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PhoneOutlined />
                        <span>{provider.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getReviewStatusTag(provider.review_status, provider.annual_review_date)}
                    {provider.certification_no && (
                      <Tag color="blue" icon={<FileTextOutlined />}>
                        备案号: {provider.certification_no.slice(-6)}
                      </Tag>
                    )}
                  </div>
                  <Button type="link" size="small">
                    查看详情 <ArrowRightOutlined />
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Drawer
        title="服务商详情"
        placement="right"
        onClose={() => setSelectedProvider(null)}
        open={!!selectedProvider}
        width={520}
      >
        {selectedProvider && (
          <div className="space-y-6">
            <div className="h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center relative">
              <Avatar
                size={80}
                icon={<ShopOutlined />}
                className="bg-gradient-to-br from-orange-400 to-orange-600 text-4xl"
              />
              <div className="absolute top-3 right-3">
                {selectedProvider.street_certified && (
                  <Tag color="green" icon={<SafetyCertificateOutlined />}>
                    街道备案认证
                  </Tag>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-2">{selectedProvider.name}</h2>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Tag color="orange">{selectedProvider.service_type}</Tag>
                {getReviewStatusTag(selectedProvider.review_status)}
                <Rate disabled defaultValue={4.5} />
              </div>
            </div>

            <Tabs defaultActiveKey="basic">
              <TabPane tab="基本信息" key="basic">
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="备案编号">
                    {selectedProvider.certification_no || '未备案'}
                  </Descriptions.Item>
                  <Descriptions.Item label="街道认证">
                    {selectedProvider.street_certified ? (
                      <span className="text-green-500"><CheckCircleOutlined /> 已通过街道备案</span>
                    ) : (
                      <span className="text-gray-400">未认证</span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="服务网格">
                    <Tag color="blue" icon={<EnvironmentOutlined />}>
                      {selectedProvider.grid_code}
                    </Tag>
                    <span className="text-gray-400 ml-2 text-sm">（LBS强绑定）</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="联系人">
                    {selectedProvider.contact_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="联系电话">
                    {selectedProvider.phone}
                  </Descriptions.Item>
                  <Descriptions.Item label="年审到期日">
                    <span className={selectedProvider.review_status === 'expired' ? 'text-red-500 font-bold' : ''}>
                      {selectedProvider.annual_review_date || '未设置'}
                    </span>
                    {selectedProvider.reviewer && (
                      <div className="text-xs text-gray-500 mt-1">
                        审核人: {selectedProvider.reviewer}
                      </div>
                    )}
                  </Descriptions.Item>
                  {selectedProvider.review_note && (
                    <Descriptions.Item label="审核备注">
                      {selectedProvider.review_note}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="入驻时间">
                    {selectedProvider.created_at?.split('T')[0] || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </TabPane>

              <TabPane tab="年审记录" key="review">
                <Timeline>
                  <Timeline.Item color="green">
                    <p className="font-medium">当前年审状态</p>
                    <p className="text-sm">状态: {selectedProvider.review_status === 'approved' ? '已通过' : selectedProvider.review_status === 'pending' ? '待审核' : '已过期'}</p>
                    <p className="text-sm text-gray-500">到期日: {selectedProvider.annual_review_date}</p>
                    {selectedProvider.reviewer && (
                      <p className="text-sm text-gray-500">审核人: {selectedProvider.reviewer}</p>
                    )}
                  </Timeline.Item>
                  <Timeline.Item color="blue">
                    <p className="font-medium">入驻备案</p>
                    <p className="text-sm text-gray-500">{selectedProvider.created_at?.split('T')[0]}</p>
                  </Timeline.Item>
                </Timeline>
              </TabPane>

              <TabPane tab="结算记录" key="settlement">
                <Table
                  dataSource={settlements.filter((s: any) => s.provider_id === selectedProvider.id)}
                  columns={settlementColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </TabPane>

              <TabPane tab="纠纷记录" key="dispute">
                <Table
                  dataSource={disputes.filter((d: any) => d.provider_id === selectedProvider.id)}
                  columns={disputeColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </TabPane>
            </Tabs>

            <Divider />

            <div className="space-y-3">
              <Button type="primary" block size="large">
                <PhoneOutlined /> 联系服务商
              </Button>
              <Row gutter={8}>
                <Col span={8}>
                  <Button block onClick={() => handleRenewal(selectedProvider.id)}>
                    <CalendarOutlined /> 立即年审
                  </Button>
                </Col>
                <Col span={8}>
                  <Button block onClick={() => navigate('/admin/settlement')}>
                    <DollarOutlined /> 查看结算
                  </Button>
                </Col>
                <Col span={8}>
                  <Button block danger onClick={() => setShowDisputeModal(true)}>
                    <FlagOutlined /> 纠纷申诉
                  </Button>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title="年审提醒管理"
        open={showRenewalModal}
        onCancel={() => setShowRenewalModal(false)}
        footer={null}
        width={900}
      >
        <div className="mb-4 space-y-2">
          <Alert
            message="年审状态说明"
            description={
              <div className="flex gap-6">
                <div><Tag color="success">年审通过</Tag> - 资质有效</div>
                <div><Tag color="warning">待审核</Tag> - 等待管理员审核</div>
                <div><Tag color="error">已过期</Tag> - 需立即年审</div>
              </div>
            }
            type="info"
            showIcon
          />
        </div>
        <Table
          dataSource={renewalList}
          columns={renewalColumns}
          rowKey="id"
          pagination={false}
        />
      </Modal>

      <Modal
        title="申请纠纷调解"
        open={showDisputeModal}
        onCancel={() => setShowDisputeModal(false)}
        onOk={handleDisputeSubmit}
        okText="提交申诉"
        okButtonProps={{ danger: true }}
      >
        <Alert
          message="社区调解说明"
          description="社区管理员将在24小时内介入调解，请如实填写纠纷原因"
          type="warning"
          showIcon
          className="mb-4"
        />
        <div>
          <label className="block mb-2 font-medium">纠纷原因</label>
          <Input.TextArea
            rows={4}
            placeholder="请详细描述纠纷情况..."
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Services;
