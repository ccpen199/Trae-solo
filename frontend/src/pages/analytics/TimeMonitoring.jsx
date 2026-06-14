import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Tag,
  Badge,
  message,
  Skeleton,
  Empty,
  Typography,
  Tooltip,
  Progress,
  Avatar,
  Modal,
} from 'antd';
import {
  ClockCircleOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  LineChartOutlined,
  EyeOutlined,
  BellOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';
import useRequest from '../../hooks/useRequest';
import { getTimeMonitoring, getSlaAlerts } from '../../api/analytics';

const { Title, Text } = Typography;

const COLORS = ['#1E6FDB', '#52C41A', '#FAAD14', '#F5222D', '#722ED1'];

const mockData = {
  overview: {
    totalOrders: 12580,
    avgDuration: 3.2,
    slaCompliance: 94.5,
    overtimeOrders: 128,
  },
  trendData: Array.from({ length: 30 }, (_, i) => ({
    date: `${i + 1}日`,
    avgDuration: 2.5 + Math.random() * 2,
  })),
  businessComparison: [
    { name: '社保办理', avgDuration: 3.5, standard: 5 },
    { name: '就业服务', avgDuration: 2.8, standard: 4 },
    { name: '人事考试', avgDuration: 4.2, standard: 6 },
    { name: '政策咨询', avgDuration: 1.5, standard: 2 },
    { name: '培训申请', avgDuration: 3.8, standard: 5 },
  ],
};

const mockSlaAlerts = [
  {
    id: 1,
    orderNo: 'GD202401150001',
    businessType: '社保办理',
    applicant: '张三',
    applyTime: '2024-01-15 09:30:00',
    promiseTime: '2024-01-20 17:30:00',
    handler: '李经办',
    remainingTime: -2.5,
    status: 'overtime',
    level: 'urgent',
  },
  {
    id: 2,
    orderNo: 'GD202401150002',
    businessType: '就业服务',
    applicant: '李四',
    applyTime: '2024-01-15 10:15:00',
    promiseTime: '2024-01-19 17:30:00',
    handler: '王经办',
    remainingTime: 0.5,
    status: 'warning',
    level: 'normal',
  },
  {
    id: 3,
    orderNo: 'GD202401150003',
    businessType: '人事考试',
    applicant: '王五',
    applyTime: '2024-01-15 11:00:00',
    promiseTime: '2024-01-21 17:30:00',
    handler: '张经办',
    remainingTime: 1.2,
    status: 'warning',
    level: 'reminder',
  },
  {
    id: 4,
    orderNo: 'GD202401150004',
    businessType: '政策咨询',
    applicant: '赵六',
    applyTime: '2024-01-15 14:30:00',
    promiseTime: '2024-01-17 17:30:00',
    handler: '刘经办',
    remainingTime: 1.8,
    status: 'normal',
    level: 'reminder',
  },
  {
    id: 5,
    orderNo: 'GD202401150005',
    businessType: '培训申请',
    applicant: '钱七',
    applyTime: '2024-01-15 15:45:00',
    promiseTime: '2024-01-20 17:30:00',
    handler: '陈经办',
    remainingTime: 3.5,
    status: 'normal',
    level: 'normal',
  },
  {
    id: 6,
    orderNo: 'GD202401140008',
    businessType: '社保办理',
    applicant: '孙八',
    applyTime: '2024-01-14 08:30:00',
    promiseTime: '2024-01-19 17:30:00',
    handler: '李经办',
    remainingTime: -1.2,
    status: 'overtime',
    level: 'urgent',
  },
  {
    id: 7,
    orderNo: 'GD202401130012',
    businessType: '就业服务',
    applicant: '周九',
    applyTime: '2024-01-13 14:20:00',
    promiseTime: '2024-01-17 17:30:00',
    handler: '王经办',
    remainingTime: -0.3,
    status: 'overtime',
    level: 'urgent',
  },
  {
    id: 8,
    orderNo: 'GD202401160003',
    businessType: '人事考试',
    applicant: '吴十',
    applyTime: '2024-01-16 09:00:00',
    promiseTime: '2024-01-22 17:30:00',
    handler: '张经办',
    remainingTime: 2.8,
    status: 'normal',
    level: 'normal',
  },
];

const TimeMonitoring = () => {
  const [, forceUpdate] = useState(0);

  const { loading, data: monitoringData } = useRequest(getTimeMonitoring, {
    onError: () => {
      message.error('获取时效监测数据失败');
    },
  });

  const { loading: alertsLoading, data: slaAlerts } = useRequest(getSlaAlerts, {
    onError: () => {
      message.error('获取SLA预警数据失败');
    },
  });

  useEffect(() => {
    const timer = setInterval(() => {
      forceUpdate((n) => n + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const displayData = monitoringData || mockData;
  const displayAlerts = slaAlerts || mockSlaAlerts;

  const formatRemainingTime = (days) => {
    if (days < 0) {
      const absDays = Math.abs(days);
      const hours = Math.floor((absDays % 1) * 24);
      return (
        <Text type="danger" strong>
          已超时 {Math.floor(absDays)}天{hours}小时
        </Text>
      );
    }
    const totalHours = days * 24;
    const hours = Math.floor(totalHours);
    const minutes = Math.floor((totalHours % 1) * 60);
    if (days < 1) {
      return (
        <Text type="warning" strong>
          {hours}小时{minutes}分钟
        </Text>
      );
    }
    return (
      <Text type="success">
        {Math.floor(days)}天{hours}小时
      </Text>
    );
  };

  const getSlaPieData = () => {
    const compliance = displayData.overview.slaCompliance;
    return [
      { name: '达标', value: compliance },
      { name: '未达标', value: 100 - compliance },
    ];
  };

  const getStatusTag = (status, remainingTime) => {
    const statusMap = {
      overtime: { color: 'red', text: '已超时', icon: <ExclamationCircleOutlined /> },
      warning: { color: 'orange', text: '即将超时', icon: <WarningOutlined /> },
      normal: { color: 'green', text: '正常', icon: <CheckCircleOutlined /> },
    };
    const info = statusMap[status] || statusMap.normal;
    return (
      <Tag icon={info.icon} color={info.color}>
        {info.text}
        {status === 'overtime' && ` (${Math.abs(remainingTime).toFixed(1)}天)`}
      </Tag>
    );
  };

  const getLevelTag = (level) => {
    const levelMap = {
      urgent: { color: 'red', text: '紧急' },
      normal: { color: 'orange', text: '一般' },
      reminder: { color: 'blue', text: '提醒' },
    };
    const info = levelMap[level] || levelMap.reminder;
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const handleSupervise = (record) => {
    Modal.confirm({
      title: '催办确认',
      content: `确定要对工单【${record.orderNo}】进行催办吗？`,
      onOk: () => {
        message.success(`已向处理人员【${record.handler}】发送催办通知`);
      },
    });
  };

  const handleViewDetail = (record) => {
    message.info(`查看工单【${record.orderNo}】详情`);
  };

  const alertColumns = [
    {
      title: '工单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
      render: (text) => <Text strong style={{ color: '#1E6FDB' }}>{text}</Text>,
    },
    {
      title: '业务类型',
      dataIndex: 'businessType',
      key: 'businessType',
      width: 100,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
      width: 90,
      render: (text) => (
        <Space size={4}>
          <Avatar size={20} icon={<UserOutlined />} style={{ width: 20, height: 20, fontSize: 10 }} />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      width: 160,
      render: (text) => (
        <Space size={4}>
          <ClockCircleOutlined style={{ color: '#999', fontSize: 12 }} />
          <Text style={{ fontSize: 12 }}>{dayjs(text).format('MM-DD HH:mm')}</Text>
        </Space>
      ),
    },
    {
      title: '承诺办结时间',
      dataIndex: 'promiseTime',
      key: 'promiseTime',
      width: 160,
      render: (text) => (
        <Space size={4}>
          <CheckCircleOutlined style={{ color: '#52C41A', fontSize: 12 }} />
          <Text style={{ fontSize: 12 }}>{dayjs(text).format('MM-DD HH:mm')}</Text>
        </Space>
      ),
    },
    {
      title: '剩余时间',
      dataIndex: 'remainingTime',
      key: 'remainingTime',
      width: 140,
      render: (value) => formatRemainingTime(value),
    },
    {
      title: '当前状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (_, record) => getStatusTag(record.status, record.remainingTime),
    },
    {
      title: '处理人员',
      dataIndex: 'handler',
      key: 'handler',
      width: 100,
      render: (text) => (
        <Space size={4}>
          <Avatar size={20} icon={<UserOutlined />} style={{ width: 20, height: 20, fontSize: 10, background: '#1E6FDB' }} />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="催办">
            <Button
              type="primary"
              size="small"
              danger={record.status === 'overtime'}
              icon={<BellOutlined />}
              onClick={() => handleSupervise(record)}
            >
              催办
            </Button>
          </Tooltip>
          <Tooltip title="查看详情">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            >
              详情
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const renderSlaRingChart = () => {
    const data = getSlaPieData();
    const compliance = displayData.overview.slaCompliance;
    return (
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={55}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
            >
              <Cell fill="#1E6FDB" />
              <Cell fill="#E8E8E8" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <Text strong style={{ fontSize: 20, color: '#1E6FDB' }}>
            {compliance}%
          </Text>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 15 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>时效监测</Title>
        <Space>
          <Button onClick={() => message.info('导出报表')}>导出报表</Button>
          <Button type="primary" onClick={() => message.success('数据已刷新')}>刷新数据</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card bodyStyle={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Statistic
                title={<span style={{ color: '#666', fontSize: 13 }}>工单总数</span>}
                value={displayData.overview.totalOrders}
                suffix="件"
                valueStyle={{ color: '#1E6FDB', fontSize: 28 }}
              />
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#1E6FDB15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  color: '#1E6FDB',
                }}
              >
                <FileTextOutlined />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bodyStyle={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Statistic
                title={<span style={{ color: '#666', fontSize: 13 }}>平均办理时长</span>}
                value={displayData.overview.avgDuration}
                suffix="天"
                valueStyle={{ color: '#FAAD14', fontSize: 28 }}
              />
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#FAAD1415',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  color: '#FAAD14',
                }}
              >
                <ClockCircleOutlined />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bodyStyle={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text style={{ color: '#666', fontSize: 13 }}>SLA达标率</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                  {renderSlaRingChart()}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 8, height: 8, background: '#1E6FDB', borderRadius: '50%' }} />
                      <Text style={{ fontSize: 12 }}>达标</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <div style={{ width: 8, height: 8, background: '#E8E8E8', borderRadius: '50%' }} />
                      <Text style={{ fontSize: 12 }}>未达标</Text>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bodyStyle={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Statistic
                  title={<span style={{ color: '#666', fontSize: 13 }}>超时预警数</span>}
                  value={displayData.overview.overtimeOrders}
                  suffix="件"
                  valueStyle={{ color: '#F5222D', fontSize: 28 }}
                />
                <Badge
                  count={displayAlerts.filter((a) => a.status === 'overtime').length}
                  showZero
                  color="#F5222D"
                  style={{ marginTop: 4 }}
                >
                  <Text type="danger" style={{ fontSize: 12 }}>
                    紧急 {displayAlerts.filter((a) => a.level === 'urgent').length} 件
                  </Text>
                </Badge>
              </div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#F5222D15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  color: '#F5222D',
                }}
              >
                <WarningOutlined />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <LineChartOutlined style={{ color: '#1E6FDB' }} />
            办理时长趋势（近30天）
          </Space>
        }
        style={{ marginBottom: 24 }}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ height: 300, padding: 24 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData.trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="天" />
              <RechartsTooltip
                formatter={(value) => [`${value.toFixed(2)}天`, '平均办理时长']}
                labelFormatter={(label) => `近30天 - ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgDuration"
                name="平均办理时长"
                stroke="#1E6FDB"
                strokeWidth={3}
                dot={{ fill: '#1E6FDB', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card
        title={
          <Space>
            <BellOutlined style={{ color: '#F5222D' }} />
            SLA预警列表
            <Badge count={displayAlerts.filter((a) => a.status !== 'normal').length} size="small" />
          </Space>
        }
        style={{ marginBottom: 24 }}
        bodyStyle={{ padding: 0 }}
        extra={
          <Space>
            <Button size="small" onClick={() => message.success('刷新成功')}>刷新</Button>
            <Button type="primary" size="small" danger onClick={() => message.info('批量催办功能')}>
              批量催办
            </Button>
          </Space>
        }
      >
        <Table
          columns={alertColumns}
          dataSource={displayAlerts}
          rowKey="id"
          loading={alertsLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条预警`,
          }}
          locale={{ emptyText: <Empty description="暂无预警数据" /> }}
          scroll={{ x: 1200 }}
          onRow={(record) => ({
            style: {
              background: record.status === 'overtime' ? '#FFF1F0' : record.status === 'warning' ? '#FFFBE6' : undefined,
            },
          })}
        />
      </Card>

      <Card
        title={
          <Space>
            <BarChartOutlined style={{ color: '#52C41A' }} />
            各业务类型平均办理时长对比
          </Space>
        }
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ height: 350, padding: 24 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayData.businessComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="天" />
              <RechartsTooltip
                formatter={(value) => [`${value}天`, '']}
              />
              <Legend />
              <Bar
                dataKey="avgDuration"
                name="实际平均时长"
                fill="#1E6FDB"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="standard"
                name="标准时限"
                fill="#E8E8E8"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default TimeMonitoring;
