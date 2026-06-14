import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Tag,
  message,
  Skeleton,
  Empty,
  Descriptions,
  Typography,
} from 'antd';
import {
  WalletOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import useRequest from '../../hooks/useRequest';
import { getAccounts, getPaymentHistory } from '../../api/insurance';
import { formatMoney } from '../../utils/format';

const { Title, Text } = Typography;

const insuranceTypes = [
  { key: 'pension', label: '养老保险', color: '#1E6FDB' },
  { key: 'medical', label: '医疗保险', color: '#52C41A' },
  { key: 'unemployment', label: '失业保险', color: '#FAAD14' },
  { key: 'injury', label: '工伤保险', color: '#F5222D' },
  { key: 'maternity', label: '生育保险', color: '#EB2F96' },
];

const mockAccounts = {
  totalMonths: 128,
  personalBalance: 85620.5,
  status: 'active',
  lastPaymentDate: '2024-01-15',
  pension: {
    baseInfo: {
      accountNumber: 'P202001001234',
      startDate: '2015-03-01',
      totalMonths: 128,
      personalBalance: 58620.5,
      companyBalance: 125800.3,
      paymentBase: 8500,
      status: '正常参保',
    },
    paymentHistory: [
      { id: 1, month: '2024-01', base: 8500, company: 1275, personal: 680, total: 1955 },
      { id: 2, month: '2023-12', base: 8500, company: 1275, personal: 680, total: 1955 },
      { id: 3, month: '2023-11', base: 8500, company: 1275, personal: 680, total: 1955 },
      { id: 4, month: '2023-10', base: 8000, company: 1200, personal: 640, total: 1840 },
      { id: 5, month: '2023-09', base: 8000, company: 1200, personal: 640, total: 1840 },
      { id: 6, month: '2023-08', base: 8000, company: 1200, personal: 640, total: 1840 },
      { id: 7, month: '2023-07', base: 8000, company: 1200, personal: 640, total: 1840 },
      { id: 8, month: '2023-06', base: 7500, company: 1125, personal: 600, total: 1725 },
      { id: 9, month: '2023-05', base: 7500, company: 1125, personal: 600, total: 1725 },
      { id: 10, month: '2023-04', base: 7500, company: 1125, personal: 600, total: 1725 },
      { id: 11, month: '2023-03', base: 7500, company: 1125, personal: 600, total: 1725 },
      { id: 12, month: '2023-02', base: 7500, company: 1125, personal: 600, total: 1725 },
      { id: 13, month: '2023-01', base: 7500, company: 1125, personal: 600, total: 1725 },
    ],
    benefits: [
      { id: 1, date: '2023-12-15', type: '养老金调整', amount: 150, status: '已发放' },
      { id: 2, date: '2023-06-15', type: '养老金调整', amount: 120, status: '已发放' },
    ],
  },
  medical: {
    baseInfo: {
      accountNumber: 'M202001001234',
      startDate: '2015-03-01',
      totalMonths: 128,
      personalBalance: 12580.3,
      companyBalance: 25800.5,
      paymentBase: 8500,
      status: '正常参保',
    },
    paymentHistory: [
      { id: 1, month: '2024-01', base: 8500, company: 680, personal: 170, total: 850 },
      { id: 2, month: '2023-12', base: 8500, company: 680, personal: 170, total: 850 },
      { id: 3, month: '2023-11', base: 8500, company: 680, personal: 170, total: 850 },
    ],
    benefits: [],
  },
  unemployment: {
    baseInfo: {
      accountNumber: 'U202001001234',
      startDate: '2015-03-01',
      totalMonths: 128,
      personalBalance: 8520.2,
      companyBalance: 12800.3,
      paymentBase: 8500,
      status: '正常参保',
    },
    paymentHistory: [
      { id: 1, month: '2024-01', base: 8500, company: 42.5, personal: 42.5, total: 85 },
      { id: 2, month: '2023-12', base: 8500, company: 42.5, personal: 42.5, total: 85 },
    ],
    benefits: [],
  },
  injury: {
    baseInfo: {
      accountNumber: 'I202001001234',
      startDate: '2015-03-01',
      totalMonths: 128,
      personalBalance: 0,
      companyBalance: 8560.8,
      paymentBase: 8500,
      status: '正常参保',
    },
    paymentHistory: [
      { id: 1, month: '2024-01', base: 8500, company: 42.5, personal: 0, total: 42.5 },
      { id: 2, month: '2023-12', base: 8500, company: 42.5, personal: 0, total: 42.5 },
    ],
    benefits: [],
  },
  maternity: {
    baseInfo: {
      accountNumber: 'MA202001001234',
      startDate: '2015-03-01',
      totalMonths: 128,
      personalBalance: 0,
      companyBalance: 5820.5,
      paymentBase: 8500,
      status: '正常参保',
    },
    paymentHistory: [
      { id: 1, month: '2024-01', base: 8500, company: 68, personal: 0, total: 68 },
      { id: 2, month: '2023-12', base: 8500, company: 68, personal: 0, total: 68 },
    ],
    benefits: [],
  },
};

const Accounts = () => {
  const [activeTab, setActiveTab] = useState('pension');

  const { loading, data: accounts } = useRequest(getAccounts, {
    onError: () => {
      message.error('获取账户信息失败');
    },
  });

  const { loading: historyLoading } = useRequest(getPaymentHistory, {
    onError: () => {
      message.error('获取缴费历史失败');
    },
  });

  const displayData = accounts || mockAccounts;
  const currentInsurance = displayData[activeTab] || displayData.pension;

  const getStatusTag = (status) => {
    const statusMap = {
      active: { color: 'success', text: '正常参保', icon: <CheckCircleOutlined /> },
      suspended: { color: 'warning', text: '暂停参保', icon: <ClockCircleOutlined /> },
      terminated: { color: 'error', text: '已终止', icon: <CheckCircleOutlined /> },
    };
    const statusInfo = statusMap[status] || statusMap.active;
    return <Tag icon={statusInfo.icon} color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const handleExport = (type) => {
    message.success(`正在导出${type === 'pdf' ? 'PDF' : 'Excel'}文件...`);
  };

  const columns = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      sorter: (a, b) => a.month.localeCompare(b.month),
      width: 120,
    },
    {
      title: '缴费基数',
      dataIndex: 'base',
      key: 'base',
      sorter: (a, b) => a.base - b.base,
      render: (value) => formatMoney(value),
    },
    {
      title: '单位缴纳',
      dataIndex: 'company',
      key: 'company',
      sorter: (a, b) => a.company - b.company,
      render: (value) => formatMoney(value),
    },
    {
      title: '个人缴纳',
      dataIndex: 'personal',
      key: 'personal',
      sorter: (a, b) => a.personal - b.personal,
      render: (value) => formatMoney(value),
    },
    {
      title: '合计',
      dataIndex: 'total',
      key: 'total',
      sorter: (a, b) => a.total - b.total,
      render: (value) => <Text strong style={{ color: '#1E6FDB' }}>{formatMoney(value)}</Text>,
    },
  ];

  const benefitColumns = [
    {
      title: '发放日期',
      dataIndex: 'date',
      key: 'date',
      width: 150,
    },
    {
      title: '待遇类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (value) => <Text type="success" strong>{formatMoney(value)}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (value) => <Tag color="success">{value}</Tag>,
    },
  ];

  const chartData = currentInsurance.paymentHistory.slice(0, 12).reverse().map(item => ({
    month: item.month.slice(5) + '月',
    单位缴纳: item.company,
    个人缴纳: item.personal,
    合计: item.total,
  }));

  const overviewCards = [
    {
      title: '累计缴费月数',
      value: displayData.totalMonths,
      suffix: '个月',
      icon: <CalendarOutlined />,
      color: '#1E6FDB',
    },
    {
      title: '个人账户余额',
      value: displayData.personalBalance,
      prefix: '¥',
      icon: <WalletOutlined />,
      color: '#52C41A',
    },
    {
      title: '当前参保状态',
      value: null,
      render: () => getStatusTag(displayData.status),
      icon: <CheckCircleOutlined />,
      color: '#FAAD14',
    },
    {
      title: '最近缴费时间',
      value: displayData.lastPaymentDate,
      icon: <ClockCircleOutlined />,
      color: '#722ED1',
    },
  ];

  if (loading || historyLoading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 15 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>社保账户</Title>
        <Space>
          <Button icon={<FilePdfOutlined />} onClick={() => handleExport('pdf')}>
            导出PDF
          </Button>
          <Button type="primary" icon={<FileExcelOutlined />} onClick={() => handleExport('excel')}>
            导出Excel
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {overviewCards.map((card, index) => (
          <Col xs={12} sm={12} md={6} key={index}>
            <Card bodyStyle={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Statistic
                  title={<span style={{ color: '#666', fontSize: 13 }}>{card.title}</span>}
                  value={card.value}
                  prefix={card.prefix}
                  suffix={card.suffix}
                  formatter={card.render || ((value) => typeof value === 'number' ? value.toLocaleString() : value)}
                  valueStyle={{ color: card.color, fontSize: 24 }}
                />
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `${card.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    color: card.color,
                  }}
                >
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title={
          <Space>
            <LineChartOutlined style={{ color: '#1E6FDB' }} />
            近12个月缴费趋势
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatMoney(value)} />
              <Tooltip
                formatter={(value) => [formatMoney(value), '']}
                labelFormatter={(label) => `${label}份`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="单位缴纳"
                stroke="#1E6FDB"
                strokeWidth={2}
                dot={{ fill: '#1E6FDB', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="个人缴纳"
                stroke="#52C41A"
                strokeWidth={2}
                dot={{ fill: '#52C41A', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="合计"
                stroke="#FAAD14"
                strokeWidth={3}
                dot={{ fill: '#FAAD14', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card
        tabList={insuranceTypes.map(type => ({
          key: type.key,
          tab: (
            <Space>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: type.color,
              }} />
              {type.label}
            </Space>
          ),
        }))}
        activeTabKey={activeTab}
        onTabChange={setActiveTab}
      >
        <div style={{ marginBottom: 24 }}>
          <Title level={5} style={{ marginBottom: 16 }}>账户基本信息</Title>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="账户编号">{currentInsurance.baseInfo.accountNumber}</Descriptions.Item>
            <Descriptions.Item label="参保状态">
              <Tag color="success">{currentInsurance.baseInfo.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="参保开始日期">{currentInsurance.baseInfo.startDate}</Descriptions.Item>
            <Descriptions.Item label="累计缴费月数">{currentInsurance.baseInfo.totalMonths} 个月</Descriptions.Item>
            <Descriptions.Item label="当前缴费基数">{formatMoney(currentInsurance.baseInfo.paymentBase)}</Descriptions.Item>
            <Descriptions.Item label="个人账户余额">
              <Text strong style={{ color: '#52C41A' }}>{formatMoney(currentInsurance.baseInfo.personalBalance)}</Text>
            </Descriptions.Item>
            {currentInsurance.baseInfo.companyBalance > 0 && (
              <Descriptions.Item label="单位账户余额" span={2}>
                <Text strong style={{ color: '#1E6FDB' }}>{formatMoney(currentInsurance.baseInfo.companyBalance)}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Title level={5} style={{ marginBottom: 16 }}>缴费明细</Title>
          <Table
            columns={columns}
            dataSource={currentInsurance.paymentHistory}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
            locale={{ emptyText: <Empty description="暂无缴费记录" /> }}
          />
        </div>

        {currentInsurance.benefits && currentInsurance.benefits.length > 0 && (
          <div>
            <Title level={5} style={{ marginBottom: 16 }}>待遇发放记录</Title>
            <Table
              columns={benefitColumns}
              dataSource={currentInsurance.benefits}
              rowKey="id"
              pagination={false}
              locale={{ emptyText: <Empty description="暂无待遇发放记录" /> }}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default Accounts;
