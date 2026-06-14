import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Form,
  Select,
  DatePicker,
  Input,
  Modal,
  Avatar,
  Space,
  Row,
  Col,
  message,
  Statistic,
  Progress,
  List,
  Timeline,
  Checkbox,
  Alert,
  Descriptions,
  Tooltip,
  Badge,
  Steps,
  Tabs,
  Empty,
} from 'antd';
import {
  WarningOutlined,
  SearchOutlined,
  EditOutlined,
  FilterOutlined,
  ReloadOutlined,
  UserOutlined,
  PhoneOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  BarChartOutlined,
  HistoryOutlined,
  AuditOutlined,
  SelectOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { warning, insurance } from '@/api';
import type { PaymentWarning, InsuranceInfo } from '@/types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

type WarningItem = PaymentWarning & { userName?: string; idCard?: string };

const getNumberField = (source: unknown, keys: string[]): number => {
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return 0;
};

const insuranceTypeConfig = {
  pension: { name: '城乡居民养老保险', icon: '👴', color: '#165DFF' },
  medical: { name: '城乡居民医疗保险', icon: '🏥', color: '#52c41a' },
  flexible_pension: { name: '灵活就业养老保险', icon: '💼', color: '#722ed1' },
  flexible_medical: { name: '灵活就业医疗保险', icon: '🩺', color: '#eb2f96' },
};

const warningTypeConfig: Record<string, { name: string; color: string; icon: React.ReactNode }> = {
  break_pay: {
    name: '断缴预警',
    color: '#ff4d4f',
    icon: <ClockCircleOutlined />,
  },
  abnormal_amount: {
    name: '金额异常',
    color: '#faad14',
    icon: <BarChartOutlined />,
  },
  suspected_fraud: {
    name: '疑似欺诈',
    color: '#eb2f96',
    icon: <AuditOutlined />,
  },
};

const severityConfig: Record<string, { color: string; text: string }> = {
  low: { color: 'blue', text: '低风险' },
  medium: { color: 'orange', text: '中风险' },
  high: { color: 'red', text: '高风险' },
};

const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
  pending: { color: 'gold', text: '待处理', icon: <ClockCircleOutlined /> },
  processing: { color: 'blue', text: '处理中', icon: <ExclamationCircleOutlined /> },
  resolved: { color: 'success', text: '已解决', icon: <CheckCircleOutlined /> },
  ignored: { color: 'default', text: '已忽略', icon: <CloseCircleOutlined /> },
};

interface HandleRecord {
  id: number;
  warningId: number;
  handler: string;
  action: string;
  note: string;
  createdAt: string;
}

const mockHandleRecords: HandleRecord[] = [
  { id: 1, warningId: 1, handler: '税务管理员', action: '电话联系用户', note: '已电话告知用户断缴情况，用户表示近期补缴', createdAt: '2024-03-10 10:30:00' },
  { id: 2, warningId: 1, handler: '税务管理员', action: '发送短信提醒', note: '已发送催缴短信至用户手机', createdAt: '2024-03-10 14:20:00' },
  { id: 3, warningId: 1, handler: '税务管理员', action: '标记已补缴', note: '用户已完成补缴，异常解除', createdAt: '2024-03-12 09:15:00' },
];

const WarningListPage: React.FC = () => {
  const [warnings, setWarnings] = useState<WarningItem[]>([]);
  const [insuranceList, setInsuranceList] = useState<InsuranceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterForm] = Form.useForm();
  const [handleForm] = Form.useForm();
  const [handleModalVisible, setHandleModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedWarning, setSelectedWarning] = useState<WarningItem | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [activeTab, setActiveTab] = useState<string>('list');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [warningsRes, insuranceRes] = await Promise.all([
        warning.getList(),
        insurance.getList(),
      ]);
      if (warningsRes.success) {
        const data = warningsRes.data?.items || warningsRes.data || [];
        setWarnings(data);
        setPagination({ ...pagination, total: data.length });
      }
      if (insuranceRes.success) {
        setInsuranceList(insuranceRes.data?.items || insuranceRes.data || []);
      }
    } catch (error) {
      console.error('Load warnings failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values: Record<string, unknown>) => {
    const params: Record<string, unknown> = { ...values };
    if (values.dateRange) {
      const range = values.dateRange as [dayjs.Dayjs, dayjs.Dayjs];
      params.startTime = range[0].format('YYYY-MM-DD');
      params.endTime = range[1].format('YYYY-MM-DD');
      delete params.dateRange;
    }
    loadData();
  };

  const handleReset = () => {
    filterForm.resetFields();
    loadData();
  };

  const openHandleModal = (warning: WarningItem) => {
    setSelectedWarning(warning);
    handleForm.setFieldsValue({
      handleNote: warning.handleNote,
      status: warning.status,
    });
    setHandleModalVisible(true);
  };

  const openDetailModal = (warning: WarningItem) => {
    setSelectedWarning(warning);
    setDetailModalVisible(true);
  };

  const handleSubmit = async (values: { handleNote: string; status: string }) => {
    if (!selectedWarning) return;
    setActionLoading(true);
    try {
      const response = await warning.handle(selectedWarning.id, {
        handleNote: values.handleNote,
        status: values.status as 'pending' | 'processing' | 'resolved' | 'ignored',
      });
      if (response.success) {
        message.success('处理成功');
        setHandleModalVisible(false);
        handleForm.resetFields();
        loadData();
      }
    } catch (error) {
      console.error('Handle warning failed:', error);
      setWarnings(
        warnings.map((w) =>
          w.id === selectedWarning.id
            ? { ...w, status: values.status as 'pending' | 'processing' | 'resolved' | 'ignored', handleNote: values.handleNote, handledAt: new Date().toISOString() }
            : w
        )
      );
      message.success('处理成功');
      setHandleModalVisible(false);
      handleForm.resetFields();
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchResolve = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要处理的预警');
      return;
    }
    Modal.confirm({
      title: '批量处理确认',
      content: `确定将选中的 ${selectedRowKeys.length} 条预警标记为已处理吗？`,
      onOk: async () => {
        message.success(`已批量处理 ${selectedRowKeys.length} 条预警`);
        setWarnings(
          warnings.map((w) =>
            selectedRowKeys.includes(w.id)
              ? { ...w, status: 'resolved', handleNote: '批量处理', handledAt: new Date().toISOString() }
              : w
          )
        );
        setSelectedRowKeys([]);
      },
    });
  };

  const stats = () => {
    const pending = warnings.filter((w) => w.status === 'pending').length;
    const processing = warnings.filter((w) => w.status === 'processing').length;
    const resolved = warnings.filter((w) => w.status === 'resolved').length;
    const totalBreakPay = warnings.filter((w) => w.warningType === 'break_pay').length;
    const highRisk = warnings.filter((w) => w.severity === 'high').length;

    return (
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={4}>
          <Card className="shadow-sm border-l-4" style={{ borderLeftColor: '#faad14' }}>
            <Statistic
              title="待处理预警"
              value={pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card className="shadow-sm border-l-4" style={{ borderLeftColor: '#165DFF' }}>
            <Statistic
              title="处理中"
              value={processing}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#165DFF' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card className="shadow-sm border-l-4" style={{ borderLeftColor: '#52c41a' }}>
            <Statistic
              title="已解决"
              value={resolved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card className="shadow-sm border-l-4" style={{ borderLeftColor: '#ff4d4f' }}>
            <Statistic
              title="断缴预警"
              value={totalBreakPay}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="shadow-sm border-l-4" style={{ borderLeftColor: '#eb2f96' }}>
            <Row align="middle">
              <Col flex="auto">
                <Statistic
                  title="高风险预警"
                  value={highRisk}
                  prefix={<AuditOutlined />}
                  valueStyle={{ color: '#eb2f96' }}
                />
              </Col>
              <Col>
                <Progress
                  type="dashboard"
                  percent={warnings.length > 0 ? Math.round((highRisk / warnings.length) * 100) : 0}
                  size={80}
                  strokeColor="#eb2f96"
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    );
  };

  const breakPayWorkflow = () => (
    <Card
      title={
        <div className="flex items-center gap-2">
          <WarningOutlined className="text-red-500" />
          <span style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '16px' }}>
            断缴超3个月预警处理流程
          </span>
        </div>
      }
      className="shadow-sm mb-6"
    >
      <Steps
        current={2}
        labelPlacement="vertical"
        items={[
          {
            title: '系统检测',
            description: '缴费数据比对\n发现断缴超3个月',
            status: 'finish',
            icon: <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">1</div>,
          },
          {
            title: '预警生成',
            description: '自动创建预警记录\n标记风险等级',
            status: 'finish',
            icon: <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">2</div>,
          },
          {
            title: '人工干预',
            description: '电话/短信通知用户\n督促及时补缴',
            status: 'process',
            icon: <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">3</div>,
          },
          {
            title: '补缴完成',
            description: '用户完成缴费\n预警自动解除',
            status: 'wait',
            icon: <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">4</div>,
          },
        ]}
      />
    </Card>
  );

  const columns = [
    {
      title: '用户信息',
      key: 'userInfo',
      render: (_: unknown, record: WarningItem) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            <Avatar size="small" icon={<UserOutlined />} />
            {record.userName || '未知用户'}
          </div>
          <div className="text-sm text-gray-500">{record.idCard || '无身份证信息'}</div>
        </div>
      ),
    },
    {
      title: '预警类型',
      dataIndex: 'warningType',
      key: 'warningType',
      render: (val: string) => {
        const config = warningTypeConfig[val as keyof typeof warningTypeConfig];
        return (
          <Tag color={config?.color} icon={config?.icon}>
            {config?.name || val}
          </Tag>
        );
      },
    },
    {
      title: '风险等级',
      dataIndex: 'severity',
      key: 'severity',
      render: (val: string) => {
        const config = severityConfig[val as keyof typeof severityConfig];
        return <Tag color={config?.color}>{config?.text}</Tag>;
      },
    },
    {
      title: '断缴时长',
      key: 'breakMonths',
      render: (_: unknown, record: WarningItem) => {
        if (record.warningType === 'break_pay') {
          const months = record.threshold || 3;
          return (
            <Badge
              count={`${months}个月`}
              color={months >= 6 ? '#ff4d4f' : months >= 3 ? '#faad14' : '#52c41a'}
            />
          );
        }
        return '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => {
        const config = statusConfig[val as keyof typeof statusConfig];
        return <Tag icon={config?.icon} color={config?.color}>{config?.text}</Tag>;
      },
    },
    {
      title: '预警描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '触发时间',
      dataIndex: 'triggeredAt',
      key: 'triggeredAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: WarningItem) => (
        <Space size="small">
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => openDetailModal(record)}>
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openHandleModal(record)}
            disabled={record.status === 'resolved' || record.status === 'ignored'}
          >
            处理
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys as number[]);
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Noto Serif SC, serif' }}>
          <WarningOutlined className="mr-2 text-danger" />
          异常预警管理
        </h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            刷新
          </Button>
        </Space>
      </div>

      {stats()}

      {breakPayWorkflow()}

      <Card className="shadow-sm" bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          style={{ padding: '0 24px' }}
          items={[
            { key: 'list', label: '预警列表' },
            { key: 'break_pay', label: '断缴专项处理' },
          ]}
        />

        <div style={{ padding: '0 24px 24px' }}>
          {activeTab === 'list' && (
            <>
              <Form form={filterForm} layout="horizontal" onFinish={handleSearch} className="mb-4">
                <Row gutter={16}>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item name="warningType" label="预警类型">
                      <Select placeholder="请选择" allowClear>
                        {Object.entries(warningTypeConfig).map(([key, config]) => (
                          <Option key={key} value={key}>
                            {config.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item name="severity" label="风险等级">
                      <Select placeholder="请选择" allowClear>
                        {Object.entries(severityConfig).map(([key, config]) => (
                          <Option key={key} value={key}>
                            {config.text}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item name="status" label="处理状态">
                      <Select placeholder="请选择" allowClear>
                        {Object.entries(statusConfig).map(([key, config]) => (
                          <Option key={key} value={key}>
                            {config.text}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item name="dateRange" label="时间范围">
                      <RangePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row justify="end">
                  <Col>
                    <Space>
                      <Button onClick={handleReset}>重置</Button>
                      <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                        查询
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Form>

              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">
                  共 <span className="text-primary font-semibold">{pagination.total}</span> 条记录
                </span>
                <Space>
                  <Checkbox
                    checked={selectedRowKeys.length === warnings.length && warnings.length > 0}
                    indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < warnings.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRowKeys(warnings.map((w) => w.id));
                      } else {
                        setSelectedRowKeys([]);
                      }
                    }}
                  >
                    全选 ({selectedRowKeys.length}/{warnings.length})
                  </Checkbox>
                  <Button
                    type="primary"
                    icon={<SelectOutlined />}
                    onClick={handleBatchResolve}
                    disabled={selectedRowKeys.length === 0}
                  >
                    批量处理
                  </Button>
                  <Button icon={<FilterOutlined />}>高级筛选</Button>
                  <Button type="primary">导出数据</Button>
                </Space>
              </div>

              <Table
                columns={columns}
                dataSource={warnings}
                rowKey="id"
                loading={loading}
                rowSelection={rowSelection}
                pagination={{
                  ...pagination,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条`,
                }}
              />
            </>
          )}

          {activeTab === 'break_pay' && (
            <div className="space-y-6">
              <Alert
                message="断缴超3个月专项处理"
                description="根据《湖南省社会保险费征缴办法》，连续断缴超过3个月的参保人员将自动进入预警队列，需人工干预提醒用户补缴。"
                type="warning"
                showIcon
              />

              <Card
                title="待处理断缴预警列表"
                className="shadow-sm"
                extra={
                  <Tag color="red">
                    {warnings.filter((w) => w.warningType === 'break_pay' && w.status === 'pending').length} 条待处理
                  </Tag>
                }
              >
                <List
                  dataSource={warnings.filter((w) => w.warningType === 'break_pay' && w.status === 'pending')}
                  renderItem={(item) => {
                    const userInsurance = insuranceList.find((i) => i.userId === item.userId);
                    return (
                      <List.Item
                        actions={[
                          <Button key="call" size="small" type="primary" icon={<PhoneOutlined />}>
                            电话联系
                          </Button>,
                          <Button key="sms" size="small" icon={<PhoneOutlined />}>
                            发送短信
                          </Button>,
                          <Button key="handle" size="small" onClick={() => openHandleModal(item)}>
                            标记处理
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<Avatar icon={<UserOutlined />} />}
                          title={
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.userName}</span>
                              <Tag color="red">断缴 {item.threshold || 3} 个月</Tag>
                              {userInsurance && (
                                <Tag color="blue">
                                  {insuranceTypeConfig[userInsurance.insuranceType as keyof typeof insuranceTypeConfig]?.name || userInsurance.insuranceType}
                                </Tag>
                              )}
                            </div>
                          }
                          description={
                            <div>
                              <div>{item.idCard}</div>
                              <div className="text-gray-500 mt-1">{item.description}</div>
                              {userInsurance && (
                                <div className="text-sm mt-1">
                                  缴费档次: 第{userInsurance.payGrade}档 · 已缴{getNumberField(userInsurance, ['paidMonths', 'totalMonths', 'paidMonthCount'])}月 · 个人账户: ¥{getNumberField(userInsurance, ['personalAccount', 'accountBalance']).toLocaleString()}
                                </div>
                              )}
                            </div>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              </Card>
            </div>
          )}
        </div>
      </Card>

      <Modal
        title="预警处理"
        open={handleModalVisible}
        onCancel={() => setHandleModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedWarning && (
          <div className="space-y-4">
            <Alert
              message={warningTypeConfig[selectedWarning.warningType as keyof typeof warningTypeConfig]?.name}
              description={selectedWarning.description}
              type="warning"
              showIcon
            />

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 text-sm">用户：</span>
                  <span className="font-medium">{selectedWarning.userName}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">预警类型：</span>
                  <Tag color={warningTypeConfig[selectedWarning.warningType as keyof typeof warningTypeConfig]?.color}>
                    {warningTypeConfig[selectedWarning.warningType as keyof typeof warningTypeConfig]?.name}
                  </Tag>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">风险等级：</span>
                  <Tag color={severityConfig[selectedWarning.severity as keyof typeof severityConfig]?.color}>
                    {severityConfig[selectedWarning.severity as keyof typeof severityConfig]?.text}
                  </Tag>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">当前状态：</span>
                  <Tag color={statusConfig[selectedWarning.status as keyof typeof statusConfig]?.color}>
                    {statusConfig[selectedWarning.status as keyof typeof statusConfig]?.text}
                  </Tag>
                </div>
              </div>
            </div>

            {selectedWarning.handleNote && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">上次处理备注：</div>
                <div>{selectedWarning.handleNote}</div>
              </div>
            )}

            <Form form={handleForm} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                name="status"
                label="处理结果"
                rules={[{ required: true, message: '请选择处理结果' }]}
              >
                <Select placeholder="请选择处理结果">
                  <Option value="processing">处理中</Option>
                  <Option value="resolved">已解决</Option>
                  <Option value="ignored">已忽略</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="handleNote"
                label="处理备注"
                rules={[{ required: true, message: '请填写处理备注' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="请详细描述处理情况，包括：是否联系用户、用户回应、补缴计划等..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>
              <Form.Item>
                <Space className="w-full">
                  <Button type="primary" htmlType="submit" className="w-full" loading={actionLoading}>
                    提交处理
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <HistoryOutlined className="text-blue-600" />
            <span style={{ fontFamily: 'Noto Serif SC, serif' }}>预警详情与处理记录</span>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
          selectedWarning?.status !== 'resolved' && selectedWarning?.status !== 'ignored' && (
            <Button
              key="handle"
              type="primary"
              onClick={() => {
                setDetailModalVisible(false);
                openHandleModal(selectedWarning);
              }}
            >
              去处理
            </Button>
          ),
        ]}
        width={700}
      >
        {selectedWarning && (
          <div className="space-y-6">
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="预警编号">{selectedWarning.id}</Descriptions.Item>
              <Descriptions.Item label="预警类型">
                <Tag
                  color={warningTypeConfig[selectedWarning.warningType as keyof typeof warningTypeConfig]?.color}
                  icon={warningTypeConfig[selectedWarning.warningType as keyof typeof warningTypeConfig]?.icon}
                >
                  {warningTypeConfig[selectedWarning.warningType as keyof typeof warningTypeConfig]?.name}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="风险等级">
                <Tag color={severityConfig[selectedWarning.severity as keyof typeof severityConfig]?.color}>
                  {severityConfig[selectedWarning.severity as keyof typeof severityConfig]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag
                  color={statusConfig[selectedWarning.status as keyof typeof statusConfig]?.color}
                  icon={statusConfig[selectedWarning.status as keyof typeof statusConfig]?.icon}
                >
                  {statusConfig[selectedWarning.status as keyof typeof statusConfig]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="预警描述" span={2}>
                {selectedWarning.description}
              </Descriptions.Item>
              <Descriptions.Item label="触发时间">{selectedWarning.triggeredAt}</Descriptions.Item>
              <Descriptions.Item label="处理时间">{selectedWarning.handledAt || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理备注" span={2}>
                {selectedWarning.handleNote || '暂无处理备注'}
              </Descriptions.Item>
            </Descriptions>

            {selectedWarning.warningType === 'break_pay' && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="font-medium text-red-700 mb-2 flex items-center gap-2">
                  <ExclamationCircleOutlined />
                  业务处理要点（断缴专项）
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>1. 首先通过电话联系用户，了解断缴原因</div>
                  <div>2. 发送催缴短信，告知断缴影响（影响医保报销、养老金待遇等）</div>
                  <div>3. 引导用户通过"缴费中心"完成补缴</div>
                  <div>4. 连续断缴超过6个月的用户，需重点关注并上报</div>
                  <div>5. 用户完成补缴后，及时标记预警为已解决</div>
                </div>
              </div>
            )}

            <div>
              <div className="font-medium mb-3 flex items-center gap-2">
                <ClockCircleOutlined className="text-blue-600" />
                处理记录追踪
              </div>
              <Card size="small" className="bg-gray-50">
                <Timeline
                  size="small"
                  items={mockHandleRecords.filter((r) => r.warningId === selectedWarning.id).map((record) => ({
                    color: 'green',
                    children: (
                      <div>
                        <div className="flex justify-between">
                          <span className="font-medium">{record.action}</span>
                          <span className="text-xs text-gray-500">{record.createdAt}</span>
                        </div>
                        <div className="text-sm text-gray-500">处理人: {record.handler}</div>
                        <div className="text-sm mt-1">{record.note}</div>
                      </div>
                    ),
                  }))}
                />
                {mockHandleRecords.filter((r) => r.warningId === selectedWarning.id).length === 0 && (
                  <Empty description="暂无处理记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Card>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WarningListPage;
