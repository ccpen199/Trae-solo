import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Space,
  Tag,
  message,
  Skeleton,
  Empty,
  Typography,
  Select,
  DatePicker,
  Form,
  Input,
  Modal,
  Alert,
  List,
  Avatar,
} from 'antd';
import {
  SafetyOutlined,
  PieChartOutlined,
  WarningOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import useRequest from '../../hooks/useRequest';
import { getAuditLogs } from '../../api/analytics';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;

const COLORS = ['#1E6FDB', '#52C41A', '#FAAD14', '#F5222D', '#722ED1', '#13C2C2'];

const operationTypes = [
  { key: 'login', label: '用户登录' },
  { key: 'logout', label: '用户退出' },
  { key: 'query', label: '数据查询' },
  { key: 'create', label: '数据新增' },
  { key: 'update', label: '数据修改' },
  { key: 'delete', label: '数据删除' },
  { key: 'export', label: '数据导出' },
  { key: 'config', label: '配置修改' },
];

const highRiskOperations = ['delete', 'config', 'export'];

const mockData = {
  logs: [
    {
      id: 1,
      operateTime: '2024-01-15 14:32:18',
      operator: 'admin',
      operatorName: '系统管理员',
      operationType: 'login',
      operationContent: '用户登录系统',
      ipAddress: '192.168.1.100',
      status: 'success',
      userAgent: 'Chrome 120.0.0.0 / Windows 10',
    },
    {
      id: 2,
      operateTime: '2024-01-15 14:28:45',
      operator: 'zhangsan',
      operatorName: '张三',
      operationType: 'delete',
      operationContent: '删除用户数据，ID: 12345',
      ipAddress: '192.168.1.105',
      status: 'success',
      userAgent: 'Firefox 121.0 / MacOS 14.2',
      isHighRisk: true,
    },
    {
      id: 3,
      operateTime: '2024-01-15 14:25:30',
      operator: 'lisi',
      operatorName: '李四',
      operationType: 'update',
      operationContent: '修改工单状态，工单号: GD202401150001',
      ipAddress: '192.168.1.108',
      status: 'success',
      userAgent: 'Edge 120.0.0.0 / Windows 11',
    },
    {
      id: 4,
      operateTime: '2024-01-15 14:20:12',
      operator: 'wangwu',
      operatorName: '王五',
      operationType: 'export',
      operationContent: '导出用户数据报表，共12580条',
      ipAddress: '192.168.1.110',
      status: 'success',
      userAgent: 'Chrome 120.0.0.0 / Windows 10',
      isHighRisk: true,
    },
    {
      id: 5,
      operateTime: '2024-01-15 14:15:08',
      operator: 'zhaoliu',
      operatorName: '赵六',
      operationType: 'config',
      operationContent: '修改系统配置项: session.timeout = 1800',
      ipAddress: '192.168.1.115',
      status: 'success',
      userAgent: 'Safari 17.2 / MacOS 14.2',
      isHighRisk: true,
    },
    {
      id: 6,
      operateTime: '2024-01-15 14:10:55',
      operator: 'qianqi',
      operatorName: '钱七',
      operationType: 'query',
      operationContent: '查询社保账户信息，身份证号: 110***********1234',
      ipAddress: '192.168.1.120',
      status: 'success',
      userAgent: 'Chrome 120.0.0.0 / Windows 10',
    },
    {
      id: 7,
      operateTime: '2024-01-15 14:05:33',
      operator: 'sunba',
      operatorName: '孙八',
      operationType: 'create',
      operationContent: '创建新工单，工单号: GD202401150008',
      ipAddress: '192.168.1.125',
      status: 'success',
      userAgent: 'Chrome 120.0.0.0 / Windows 10',
    },
    {
      id: 8,
      operateTime: '2024-01-15 14:00:21',
      operator: 'zhoujiu',
      operatorName: '周九',
      operationType: 'login',
      operationContent: '用户登录失败 - 密码错误',
      ipAddress: '192.168.1.130',
      status: 'failed',
      userAgent: 'Chrome 120.0.0.0 / Windows 10',
    },
    {
      id: 9,
      operateTime: '2024-01-15 13:55:47',
      operator: 'wushi',
      operatorName: '吴十',
      operationType: 'logout',
      operationContent: '用户退出系统',
      ipAddress: '192.168.1.135',
      status: 'success',
      userAgent: 'Firefox 121.0 / Windows 10',
    },
    {
      id: 10,
      operateTime: '2024-01-15 13:50:15',
      operator: 'admin',
      operatorName: '系统管理员',
      operationType: 'config',
      operationContent: '修改用户权限: zhangsan - 新增管理员权限',
      ipAddress: '192.168.1.100',
      status: 'success',
      userAgent: 'Chrome 120.0.0.0 / Windows 10',
      isHighRisk: true,
    },
  ],
  typeStats: [
    { name: '用户登录', value: 285, type: 'login' },
    { name: '数据查询', value: 1520, type: 'query' },
    { name: '数据新增', value: 186, type: 'create' },
    { name: '数据修改', value: 342, type: 'update' },
    { name: '数据删除', value: 28, type: 'delete' },
    { name: '数据导出', value: 45, type: 'export' },
    { name: '配置修改', value: 18, type: 'config' },
    { name: '用户退出', value: 265, type: 'logout' },
  ],
  highRiskAlerts: [
    {
      id: 2,
      time: '2024-01-15 14:28:45',
      operator: 'zhangsan',
      content: '删除用户数据，ID: 12345',
      level: 'high',
    },
    {
      id: 4,
      time: '2024-01-15 14:20:12',
      operator: 'wangwu',
      content: '导出用户数据报表，共12580条',
      level: 'high',
    },
    {
      id: 5,
      time: '2024-01-15 14:15:08',
      operator: 'zhaoliu',
      content: '修改系统配置项: session.timeout = 1800',
      level: 'medium',
    },
    {
      id: 10,
      time: '2024-01-15 13:50:15',
      operator: 'admin',
      content: '修改用户权限: zhangsan - 新增管理员权限',
      level: 'high',
    },
  ],
};

const AuditLogs = () => {
  const [filterForm] = Form.useForm();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [operator, setOperator] = useState('');
  const [operationType, setOperationType] = useState('');
  const [status, setStatus] = useState('');

  const { loading, data: auditData, refresh } = useRequest(getAuditLogs, {
    onError: () => {
      message.error('获取审计日志失败');
    },
  });

  const displayData = auditData || mockData;

  const getTypeLabel = (type) => {
    const typeMap = operationTypes.find((t) => t.key === type);
    return typeMap?.label || type;
  };

  const getTypeColor = (type) => {
    const colorMap = {
      login: '#1E6FDB',
      logout: '#722ED1',
      query: '#13C2C2',
      create: '#52C41A',
      update: '#FAAD14',
      delete: '#F5222D',
      export: '#FA8C16',
      config: '#EB2F96',
    };
    return colorMap[type] || '#1E6FDB';
  };

  const getStatusTag = (status) => {
    const statusMap = {
      success: { color: 'success', text: '成功', icon: <CheckCircleOutlined /> },
      failed: { color: 'error', text: '失败', icon: <CloseCircleOutlined /> },
    };
    const info = statusMap[status] || statusMap.success;
    return <Tag icon={info.icon} color={info.color}>{info.text}</Tag>;
  };

  const getLevelTag = (level) => {
    const levelMap = {
      high: { color: 'red', text: '高危' },
      medium: { color: 'orange', text: '中危' },
      low: { color: 'blue', text: '低危' },
    };
    const info = levelMap[level] || levelMap.low;
    return <Tag color={info.color} icon={<ExclamationCircleOutlined />}>{info.text}</Tag>;
  };

  const handleViewDetail = (record) => {
    setCurrentLog(record);
    setDetailModalVisible(true);
  };

  const handleSearch = () => {
    message.info('正在筛选日志...');
  };

  const handleReset = () => {
    filterForm.resetFields();
    setDateRange(null);
    setOperator('');
    setOperationType('');
    setStatus('');
    refresh();
    message.success('筛选条件已重置');
  };

  const handleExport = () => {
    message.success('正在导出审计日志，请稍候...');
    setTimeout(() => {
      message.success('审计日志已导出');
    }, 1500);
  };

  const filteredLogs = displayData.logs.filter((item) => {
    if (operationType && item.operationType !== operationType) return false;
    if (status && item.status !== status) return false;
    if (operator && !item.operator.includes(operator) && !item.operatorName.includes(operator)) return false;
    return true;
  });

  const columns = [
    {
      title: '操作时间',
      dataIndex: 'operateTime',
      key: 'operateTime',
      width: 180,
      render: (text) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#1E6FDB' }} />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 120,
      render: (text, record) => (
        <Space>
          <Avatar size={24} icon={<UserOutlined />} style={{ width: 24, height: 24, fontSize: 12 }} />
          <div>
            <div><Text strong>{text}</Text></div>
            <Text type="secondary" style={{ fontSize: 11 }}>@{record.operator}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: '操作类型',
      dataIndex: 'operationType',
      key: 'operationType',
      width: 120,
      render: (type) => {
        const isHighRisk = highRiskOperations.includes(type);
        return (
          <Tag
            color={isHighRisk ? 'red' : 'blue'}
            style={{ background: isHighRisk ? undefined : `${getTypeColor(type)}15`, color: isHighRisk ? undefined : getTypeColor(type), border: 'none' }}
          >
            {getTypeLabel(type)}
            {isHighRisk && <ExclamationCircleOutlined style={{ marginLeft: 4 }} />}
          </Tag>
        );
      },
    },
    {
      title: '操作内容',
      dataIndex: 'operationContent',
      key: 'operationContent',
      ellipsis: true,
      render: (text, record) => (
        <Space>
          {record.isHighRisk && <WarningOutlined style={{ color: '#F5222D' }} />}
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 140,
      render: (text) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#722ED1' }} />
          <Text code>{text}</Text>
        </Space>
      ),
    },
    {
      title: '操作结果',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];

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
        <Title level={3} style={{ margin: 0 }}>审计日志</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>刷新</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
            导出日志
          </Button>
        </Space>
      </div>

      <Card
        style={{ marginBottom: 24 }}
        bodyStyle={{ padding: 16 }}
      >
        <Form
          form={filterForm}
          layout="horizontal"
          onFinish={handleSearch}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="时间范围" style={{ marginBottom: 0 }}>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item label="操作人" style={{ marginBottom: 0 }}>
                <Search
                  placeholder="输入操作人"
                  allowClear
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  onSearch={handleSearch}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item label="操作类型" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="全部类型"
                  allowClear
                  value={operationType || undefined}
                  onChange={(value) => setOperationType(value || '')}
                  style={{ width: '100%' }}
                >
                  {operationTypes.map((type) => (
                    <Option key={type.key} value={type.key}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item label="操作结果" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="全部结果"
                  allowClear
                  value={status || undefined}
                  onChange={(value) => setStatus(value || '')}
                  style={{ width: '100%' }}
                >
                  <Option value="success">成功</Option>
                  <Option value="failed">失败</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  查询
                </Button>
                <Button onClick={handleReset}>重置</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <SafetyOutlined style={{ color: '#1E6FDB' }} />
                操作日志
              </Space>
            }
            bodyStyle={{ padding: 0 }}
          >
            <Table
              columns={columns}
              dataSource={filteredLogs}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条日志`,
              }}
              locale={{ emptyText: <Empty description="暂无日志数据" /> }}
              size="middle"
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card
                title={
                  <Space>
                    <PieChartOutlined style={{ color: '#722ED1' }} />
                    操作类型统计
                  </Space>
                }
                bodyStyle={{ padding: 16 }}
              >
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={displayData.typeStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {displayData.typeStats.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getTypeColor(entry.type)}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value) => [`${value}次`, '操作次数']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            <Col xs={24}>
              <Card
                title={
                  <Space>
                    <WarningOutlined style={{ color: '#F5222D' }} />
                    高危操作预警
                    <Tag color="red" style={{ marginLeft: 8 }}>
                      {displayData.highRiskAlerts.length}条
                    </Tag>
                  </Space>
                }
                bodyStyle={{ padding: 0 }}
              >
                {displayData.highRiskAlerts.length > 0 && (
                  <Alert
                    message={`检测到 ${displayData.highRiskAlerts.length} 条高危操作，请及时关注`}
                    type="warning"
                    showIcon
                    style={{ margin: 16, borderRadius: 8 }}
                  />
                )}
                <List
                  dataSource={displayData.highRiskAlerts}
                  renderItem={(item) => (
                    <List.Item
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        const log = displayData.logs.find((l) => l.id === item.id);
                        if (log) handleViewDetail(log);
                      }}
                    >
                      <List.Item.Meta
                        avatar={getLevelTag(item.level)}
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text strong>@{item.operator}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.time}
                            </Text>
                          </div>
                        }
                        description={<Text type="danger">{item.content}</Text>}
                      />
                    </List.Item>
                  )}
                  locale={{ emptyText: <Empty description="暂无高危操作" descriptionStyle={{ color: '#999' }} /> }}
                  style={{ maxHeight: 300, overflow: 'auto' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      <Modal
        title="操作详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {currentLog && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>操作时间</Text>
                  <div style={{ fontSize: 14, marginTop: 4 }}>
                    <ClockCircleOutlined style={{ color: '#1E6FDB', marginRight: 4 }} />
                    {currentLog.operateTime}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>操作结果</Text>
                  <div style={{ marginTop: 4 }}>{getStatusTag(currentLog.status)}</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>操作人</Text>
                  <div style={{ fontSize: 14, marginTop: 4 }}>
                    <UserOutlined style={{ color: '#1E6FDB', marginRight: 4 }} />
                    {currentLog.operatorName} (@{currentLog.operator})
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>操作类型</Text>
                  <div style={{ marginTop: 4 }}>
                    <Tag
                      color={highRiskOperations.includes(currentLog.operationType) ? 'red' : 'blue'}
                    >
                      {getTypeLabel(currentLog.operationType)}
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col span={24}>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>IP地址</Text>
                  <div style={{ fontSize: 14, marginTop: 4 }}>
                    <EnvironmentOutlined style={{ color: '#722ED1', marginRight: 4 }} />
                    <Text code>{currentLog.ipAddress}</Text>
                  </div>
                </div>
              </Col>
              <Col span={24}>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>操作内容</Text>
                  <div
                    style={{
                      marginTop: 8,
                      padding: 16,
                      background: '#f5f7fa',
                      borderRadius: 8,
                      fontSize: 14,
                    }}
                  >
                    {currentLog.operationContent}
                  </div>
                </div>
              </Col>
              <Col span={24}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>客户端信息</Text>
                  <div
                    style={{
                      marginTop: 8,
                      padding: 12,
                      background: '#f5f7fa',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#666',
                      wordBreak: 'break-all',
                    }}
                  >
                    {currentLog.userAgent}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogs;
