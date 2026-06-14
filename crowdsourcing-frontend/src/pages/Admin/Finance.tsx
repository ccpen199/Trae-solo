import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  DatePicker,
  Select,
  Input,
  Space,
  Row,
  Col,
  Statistic,
  Tabs,
  Modal,
  Form,
  InputNumber,
  message,
  Descriptions,
  Divider,
  Progress,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  DollarOutlined,
  BankOutlined,
  CreditCardOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ReloadOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { paymentApi, analyticsApi } from '@/api';
import type { Payment, PlatformStats, PaymentStatus, PageParams } from '@/types';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;

const AdminFinance: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<{ date: string; amount: number }[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [releaseVisible, setReleaseVisible] = useState(false);
  const [releaseForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('transactions');
  const [escrowData, setEscrowData] = useState<{
    totalEscrow: number;
    toBeReleased: number;
    releasedToday: number;
    pendingCount: number;
  } | null>(null);

  const [filters, setFilters] = useState<{
    keyword?: string;
    type?: string;
    status?: PaymentStatus;
    dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
  }>({});

  const chartRef = useRef<any>(null);

  const loadData = async () => {
    try {
      const [stats, trend] = await Promise.all([
        analyticsApi.getPlatformStats(),
        analyticsApi.getRevenueTrend(30),
      ]);
      setPlatformStats(stats);
      setRevenueTrend(trend);
      setEscrowData({
        totalEscrow: stats.totalTransactionAmount * 0.3,
        toBeReleased: stats.totalTransactionAmount * 0.15,
        releasedToday: stats.todayTransactionAmount,
        pendingCount: Math.floor(stats.totalTasks * 0.2),
      });
    } catch (error) {
      message.error('加载统计数据失败');
    }
  };

  const loadPayments = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params: PageParams & Record<string, any> = {
        page,
        pageSize,
        ...filters,
        startTime: filters.dateRange?.[0]?.format('YYYY-MM-DD'),
        endTime: filters.dateRange?.[1]?.format('YYYY-MM-DD'),
      };
      delete params.dateRange;
      const response = await paymentApi.getList(params);
      setPayments(response.list);
      setPagination({
        current: page,
        pageSize,
        total: response.total,
      });
    } catch (error) {
      message.error('加载交易记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions' || activeTab === 'escrow') {
      loadPayments();
    }
  }, [filters, activeTab]);

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, keyword: value }));
  };

  const handleTypeChange = (value: string) => {
    setFilters(prev => ({ ...prev, type: value }));
  };

  const handleStatusChange = (value: PaymentStatus) => {
    setFilters(prev => ({ ...prev, status: value }));
  };

  const handleDateRangeChange = (dates: any) => {
    setFilters(prev => ({ ...prev, dateRange: dates }));
  };

  const handleReset = () => {
    setFilters({});
    loadPayments(1, 10);
  };

  const handleViewDetail = (payment: Payment) => {
    setCurrentPayment(payment);
    setDetailVisible(true);
  };

  const handleReleasePayment = (payment: Payment) => {
    setCurrentPayment(payment);
    releaseForm.setFieldsValue({
      taskId: payment.taskId,
      taskTitle: payment.taskTitle,
      amount: payment.amount,
    });
    setReleaseVisible(true);
  };

  const handleSubmitRelease = async () => {
    try {
      const values = await releaseForm.validateFields();
      await paymentApi.releasePayment(values.taskId, values.amount);
      message.success('付款已释放');
      setReleaseVisible(false);
      loadData();
      loadPayments();
    } catch (error) {
      message.error('释放付款失败');
    }
  };

  const getStatusTag = (status: PaymentStatus) => {
    const config: Record<PaymentStatus, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待处理' },
      paid: { color: 'green', text: '已支付' },
      refunded: { color: 'red', text: '已退款' },
      escrow: { color: 'blue', text: '托管中' },
      released: { color: 'cyan', text: '已释放' },
    };
    return <Tag color={config[status].color}>{config[status].text}</Tag>;
  };

  const getTypeTag = (type: string) => {
    const config: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      deposit: { color: 'green', text: '充值', icon: <ArrowUpOutlined /> },
      milestone: { color: 'blue', text: '里程碑付款', icon: <BankOutlined /> },
      refund: { color: 'red', text: '退款', icon: <ArrowDownOutlined /> },
      withdraw: { color: 'orange', text: '提现', icon: <CreditCardOutlined /> },
    };
    const item = config[type] || { color: 'default', text: type, icon: null };
    return (
      <Tag color={item.color} icon={item.icon}>
        {item.text}
      </Tag>
    );
  };

  const columns: ColumnsType<Payment> = [
    {
      title: '交易编号',
      dataIndex: 'paymentNo',
      key: 'paymentNo',
      width: 160,
      render: (text) => <span className="font-mono text-xs">{text}</span>,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => getTypeTag(type),
      filters: [
        { text: '充值', value: 'deposit' },
        { text: '里程碑付款', value: 'milestone' },
        { text: '退款', value: 'refund' },
        { text: '提现', value: 'withdraw' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: '关联任务',
      key: 'task',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span className="text-gray-800 font-medium">{record.taskTitle}</span>
          <span className="text-gray-500 text-xs">{record.taskId}</span>
        </Space>
      ),
    },
    {
      title: '付款方',
      dataIndex: 'payerName',
      key: 'payerName',
      width: 100,
    },
    {
      title: '收款方',
      dataIndex: 'payeeName',
      key: 'payeeName',
      width: 100,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (value: number, record) => (
        <span className={`font-bold ${record.type === 'deposit' || record.type === 'milestone' ? 'text-green-600' : record.type === 'refund' || record.type === 'withdraw' ? 'text-red-600' : 'text-gray-700'}`}>
          {record.type === 'deposit' || record.type === 'milestone' ? '+' : '-'}
          ¥{value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        </span>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: PaymentStatus) => getStatusTag(status),
      filters: [
        { text: '待处理', value: 'pending' },
        { text: '已支付', value: 'paid' },
        { text: '托管中', value: 'escrow' },
        { text: '已释放', value: 'released' },
        { text: '已退款', value: 'refunded' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="link"
             
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {record.status === 'escrow' && (
            <Tooltip title="释放付款">
              <Button
                type="link"
               
                icon={<CheckCircleOutlined />}
                onClick={() => handleReleasePayment(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const revenueChartOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0];
        return `${data.name}<br/>营收: ¥${data.value.toLocaleString('zh-CN')}`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: revenueTrend.map(item => item.date),
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `¥${(value / 1000).toFixed(0)}k`,
      },
    },
    series: [
      {
        name: '营收',
        type: 'line',
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(30, 64, 175, 0.3)' },
              { offset: 1, color: 'rgba(30, 64, 175, 0.05)' },
            ],
          },
        },
        lineStyle: {
          color: '#1E40AF',
          width: 2,
        },
        itemStyle: {
          color: '#1E40AF',
        },
        data: revenueTrend.map(item => item.amount),
      },
    ],
  };

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    loadPayments(newPagination.current, newPagination.pageSize);
  };

  const statCardStyle = {
    borderRadius: '12px',
    border: '1px solid #f0f0f0',
  };

  return (
    <div className="p-6">
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card style={statCardStyle}>
            <Statistic
              title="平台总交易额"
              value={platformStats?.totalTransactionAmount || 0}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              formatter={(value) => (value as number).toLocaleString('zh-CN')}
              valueStyle={{ color: '#1E40AF' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={statCardStyle}>
            <Statistic
              title="今日交易额"
              value={platformStats?.todayTransactionAmount || 0}
              precision={2}
              prefix={<CreditCardOutlined />}
              suffix="元"
              formatter={(value) => (value as number).toLocaleString('zh-CN')}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={statCardStyle}>
            <Statistic
              title="托管资金"
              value={escrowData?.totalEscrow || 0}
              precision={2}
              prefix={<SafetyCertificateOutlined />}
              suffix="元"
              formatter={(value) => (value as number).toLocaleString('zh-CN')}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={statCardStyle}>
            <Statistic
              title="待释放金额"
              value={escrowData?.toBeReleased || 0}
              precision={2}
              prefix={<BankOutlined />}
              suffix="元"
              formatter={(value) => (value as number).toLocaleString('zh-CN')}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="mb-6" title="近30天营收趋势" extra={<Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>}>
        <ReactECharts ref={chartRef} option={revenueChartOption} style={{ height: 300 }} />
      </Card>

      <Card
        title="财务中心"
        tabList={[
          { key: 'transactions', tab: '交易管理' },
          { key: 'escrow', tab: '资金托管' },
          { key: 'payout', tab: '付款记录' },
        ]}
        activeTabKey={activeTab}
        onTabChange={setActiveTab}
        extra={
          activeTab === 'transactions' && (
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
              <Button type="primary" icon={<FileTextOutlined />}>导出报表</Button>
            </Space>
          )
        }
      >
        {activeTab === 'transactions' && (
          <>
            <div className="mb-4">
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Search
                    placeholder="搜索交易编号/任务名称"
                    allowClear
                    enterButton={<SearchOutlined />}
                    size="middle"
                    onSearch={handleSearch}
                  />
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Select
                    placeholder="交易类型"
                    allowClear
                    style={{ width: '100%' }}
                    onChange={handleTypeChange}
                    value={filters.type}
                  >
                    <Option value="deposit">充值</Option>
                    <Option value="milestone">里程碑付款</Option>
                    <Option value="refund">退款</Option>
                    <Option value="withdraw">提现</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Select
                    placeholder="交易状态"
                    allowClear
                    style={{ width: '100%' }}
                    onChange={handleStatusChange}
                    value={filters.status}
                  >
                    <Option value="pending">待处理</Option>
                    <Option value="paid">已支付</Option>
                    <Option value="escrow">托管中</Option>
                    <Option value="released">已释放</Option>
                    <Option value="refunded">已退款</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={24} md={16} lg={12}>
                  <RangePicker
                    style={{ width: '100%' }}
                    onChange={handleDateRangeChange}
                    value={filters.dateRange}
                  />
                </Col>
              </Row>
            </div>

            <Table
              columns={columns}
              dataSource={payments}
              rowKey="id"
              loading={loading}
              pagination={pagination}
              onChange={handleTableChange}
              scroll={{ x: 1300 }}
            />
          </>
        )}

        {activeTab === 'escrow' && (
          <div>
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="托管总金额"
                    value={escrowData?.totalEscrow || 0}
                    precision={2}
                    prefix="¥"
                    formatter={(value) => (value as number).toLocaleString('zh-CN')}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="今日已释放"
                    value={escrowData?.releasedToday || 0}
                    precision={2}
                    prefix="¥"
                    formatter={(value) => (value as number).toLocaleString('zh-CN')}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="待释放笔数"
                    value={escrowData?.pendingCount || 0}
                    suffix="笔"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <div className="mb-2">释放进度</div>
                  <Progress
                    percent={escrowData ? Math.round(((escrowData.totalEscrow - escrowData.toBeReleased) / escrowData.totalEscrow) * 100) : 0}
                    status="active"
                    strokeColor="#1E40AF"
                  />
                </Card>
              </Col>
            </Row>

            <Divider orientation="left">待释放资金列表</Divider>

            <Table
              columns={[
                ...columns.filter(col => col.key !== 'actions'),
                {
                  title: '操作',
                  key: 'actions',
                  width: 150,
                  fixed: 'right',
                  render: (_, record) => (
                    <Space>
                      <Tooltip title="查看详情">
                        <Button
                          type="link"
                         
                          icon={<EyeOutlined />}
                          onClick={() => handleViewDetail(record)}
                        />
                      </Tooltip>
                      {record.status === 'escrow' && (
                        <Button
                          type="primary"
                         
                          icon={<SyncOutlined spin={loading} />}
                          onClick={() => handleReleasePayment(record)}
                        >
                          释放
                        </Button>
                      )}
                    </Space>
                  ),
                },
              ]}
              dataSource={payments.filter(p => p.status === 'escrow')}
              rowKey="id"
              loading={loading}
              pagination={pagination}
              onChange={handleTableChange}
              scroll={{ x: 1300 }}
            />
          </div>
        )}

        {activeTab === 'payout' && (
          <div>
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                <SafetyCertificateOutlined />
                付款安全说明
              </div>
              <p className="text-blue-700 text-sm">
                所有付款均通过第三方托管账户进行，保障交易双方资金安全。任务里程碑完成并经雇主确认后，
                系统将自动释放对应款项给服务商。如有争议，资金将冻结直至争议解决。
              </p>
            </div>

            <Table
              columns={[
                ...columns.filter(col => col.key !== 'type' && col.key !== 'actions'),
                {
                  title: '支付方式',
                  dataIndex: 'transactionId',
                  key: 'transactionId',
                  width: 180,
                  render: (text) => text ? <span className="font-mono text-xs">{text}</span> : '-',
                },
                {
                  title: '支付时间',
                  dataIndex: 'paidAt',
                  key: 'paidAt',
                  width: 160,
                  render: (text: string) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
                },
                {
                  title: '操作',
                  key: 'actions',
                  width: 100,
                  fixed: 'right',
                  render: (_, record) => (
                    <Button
                      type="link"
                     
                      icon={<EyeOutlined />}
                      onClick={() => handleViewDetail(record)}
                    >
                      详情
                    </Button>
                  ),
                },
              ]}
              dataSource={payments.filter(p => p.status === 'paid' || p.status === 'released')}
              rowKey="id"
              loading={loading}
              pagination={pagination}
              onChange={handleTableChange}
              scroll={{ x: 1300 }}
            />
          </div>
        )}
      </Card>

      <Modal
        title="交易详情"
        width={600}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
      >
        {currentPayment && (
          <div>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="交易编号">
                <span className="font-mono">{currentPayment.paymentNo}</span>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(currentPayment.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="交易类型">
                {getTypeTag(currentPayment.type)}
              </Descriptions.Item>
              <Descriptions.Item label="关联任务">
                {currentPayment.taskTitle}
              </Descriptions.Item>
              <Descriptions.Item label="任务ID">
                <span className="font-mono">{currentPayment.taskId}</span>
              </Descriptions.Item>
              <Descriptions.Item label="付款方">
                {currentPayment.payerName} (ID: {currentPayment.payerId})
              </Descriptions.Item>
              <Descriptions.Item label="收款方">
                {currentPayment.payeeName} (ID: {currentPayment.payeeId})
              </Descriptions.Item>
              <Descriptions.Item label="交易金额">
                <span className="font-bold text-lg text-blue-600">
                  ¥{currentPayment.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="交易状态">
                {getStatusTag(currentPayment.status)}
              </Descriptions.Item>
              {currentPayment.transactionId && (
                <Descriptions.Item label="支付凭证">
                  <span className="font-mono">{currentPayment.transactionId}</span>
                </Descriptions.Item>
              )}
              {currentPayment.paidAt && (
                <Descriptions.Item label="支付时间">
                  {dayjs(currentPayment.paidAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              )}
              {currentPayment.remark && (
                <Descriptions.Item label="备注">
                  {currentPayment.remark}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>

      <Modal
        title="释放付款"
        width={500}
        open={releaseVisible}
        onCancel={() => setReleaseVisible(false)}
        onOk={handleSubmitRelease}
        confirmLoading={loading}
        okText="确认释放"
        okButtonProps={{ danger: true }}
      >
        <Form form={releaseForm} layout="vertical">
          <Form.Item name="taskId" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="任务名称" name="taskTitle">
            <Input disabled />
          </Form.Item>
          <Form.Item
            label="释放金额"
            name="amount"
            rules={[{ required: true, message: '请输入释放金额' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\¥\s?|(,*)/g, '') as any}
            />
          </Form.Item>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
            <div className="text-orange-800 text-sm">
              <strong>注意：</strong>释放付款后，资金将立即转入服务商账户，此操作不可撤销。
              请确认任务已按要求完成并通过验收。
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminFinance;
