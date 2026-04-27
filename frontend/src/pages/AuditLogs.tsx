import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  DatePicker,
  Select,
  Input,
  Button,
  Space,
  Tag,
  Descriptions,
  Modal,
  Tabs,
  Row,
  Col,
  Statistic,
  List,
  Empty,
  message,
  Progress,
} from 'antd';
import {
  FileTextOutlined,
  UserOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import dayjs from 'dayjs';
import {
  AuditLog,
  AuditAction,
  AuditResourceType,
  AuditResult,
} from '../types';
import { auditApi } from '../services/api';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AuditLogs: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [searchForm, setSearchForm] = useState<{
    startTime: dayjs.Dayjs | null;
    endTime: dayjs.Dayjs | null;
    resourceType: AuditResourceType | undefined;
    action: AuditAction | undefined;
    operatorId: string | undefined;
    keyword: string | undefined;
  }>({
    startTime: dayjs().subtract(7, 'day'),
    endTime: dayjs(),
    resourceType: undefined,
    action: undefined,
    operatorId: undefined,
    keyword: undefined,
  });

  const mockLogs: AuditLog[] = [
    {
      id: 'log-1',
      action: AuditAction.EXECUTE,
      resourceType: AuditResourceType.CONTROL_COMMAND,
      resourceId: 'cmd-1',
      resourceName: '灌溉阀门-区域A 控制指令',
      result: AuditResult.SUCCESS,
      actionedAt: dayjs().subtract(1, 'hour').toDate(),
      operatorId: 'user-1',
      operatorName: '农场主',
      clientIp: '192.168.1.100',
      description: '执行手动控制: 开启灌溉阀门',
      newValue: {
        deviceId: 'device-1',
        targetValue: 70,
        operatorName: '农场主',
        reason: '土壤湿度低于阈值',
      },
      relatedCommandId: 'cmd-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'log-2',
      action: AuditAction.UPDATE,
      resourceType: AuditResourceType.ALARM,
      resourceId: 'alarm-1',
      resourceName: '严重: 土壤湿度过低',
      result: AuditResult.SUCCESS,
      actionedAt: dayjs().subtract(2, 'hour').toDate(),
      operatorId: 'user-1',
      operatorName: '农场主',
      clientIp: '192.168.1.100',
      description: '确认告警',
      oldValue: {
        status: 'open',
      },
      newValue: {
        status: 'acknowledged',
      },
      changes: [
        {
          field: 'status',
          oldValue: 'open',
          newValue: 'acknowledged',
        },
      ],
      relatedAlarmId: 'alarm-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'log-3',
      action: AuditAction.CREATE,
      resourceType: AuditResourceType.FARMING_RECORD,
      resourceId: 'record-1',
      resourceName: '区域A灌溉',
      result: AuditResult.SUCCESS,
      actionedAt: dayjs().subtract(3, 'hour').toDate(),
      operatorId: 'user-1',
      operatorName: '农场主',
      clientIp: '192.168.1.100',
      description: '创建农事记录',
      newValue: {
        recordType: 'irrigation',
        title: '区域A灌溉',
        description: '滴灌系统灌溉，持续30分钟',
        locationZone: 'zone-a',
        growthDay: 45,
        quantity: 500,
        quantityUnit: 'L',
        operatorName: '农场主',
      },
      relatedRecordId: 'record-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'log-4',
      action: AuditAction.EXECUTE,
      resourceType: AuditResourceType.ALARM,
      resourceId: 'alarm-2',
      resourceName: '警告: 温度过高',
      result: AuditResult.SUCCESS,
      actionedAt: dayjs().subtract(5, 'hour').toDate(),
      operatorId: 'system',
      operatorName: '系统',
      description: '告警自动调整 (天气智能调整)',
      newValue: {
        isAdjusted: true,
        severity: 'warning',
        originalSeverity: 'critical',
        weatherForecast: {
          predictedRain: true,
          rainProbability: 75,
          hoursUntilRain: 4,
          adjustmentReason: '预计4小时后降雨(概率75%)，降低灌溉告警等级',
        },
      },
      relatedAlarmId: 'alarm-2',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'log-5',
      action: AuditAction.UPDATE,
      resourceType: AuditResourceType.THRESHOLD,
      resourceId: 'threshold-1',
      resourceName: '土壤湿度-临界阈值',
      result: AuditResult.SUCCESS,
      actionedAt: dayjs().subtract(1, 'day').toDate(),
      operatorId: 'user-1',
      operatorName: '农场主',
      clientIp: '192.168.1.100',
      description: '更新环境阈值',
      oldValue: {
        minValue: 30,
        maxValue: 70,
      },
      newValue: {
        minValue: 35,
        maxValue: 65,
      },
      changes: [
        {
          field: 'minValue',
          oldValue: 30,
          newValue: 35,
        },
        {
          field: 'maxValue',
          oldValue: 70,
          newValue: 65,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockOperatorStats = [
    {
      operatorId: 'user-1',
      operatorName: '农场主',
      actionCount: 45,
      successCount: 43,
      failureCount: 2,
    },
    {
      operatorId: 'system',
      operatorName: '系统',
      actionCount: 120,
      successCount: 118,
      failureCount: 2,
    },
    {
      operatorId: 'user-2',
      operatorName: '管理员',
      actionCount: 15,
      successCount: 15,
      failureCount: 0,
    },
  ];

  const mockResourceStats = [
    {
      resourceType: AuditResourceType.SENSOR_READING,
      createCount: 0,
      updateCount: 0,
      deleteCount: 0,
      executeCount: 150,
    },
    {
      resourceType: AuditResourceType.ALARM,
      createCount: 25,
      updateCount: 20,
      deleteCount: 0,
      executeCount: 5,
    },
    {
      resourceType: AuditResourceType.CONTROL_COMMAND,
      createCount: 10,
      updateCount: 5,
      deleteCount: 0,
      executeCount: 15,
    },
    {
      resourceType: AuditResourceType.FARMING_RECORD,
      createCount: 8,
      updateCount: 3,
      deleteCount: 0,
      executeCount: 0,
    },
    {
      resourceType: AuditResourceType.THRESHOLD,
      createCount: 2,
      updateCount: 5,
      deleteCount: 1,
      executeCount: 0,
    },
  ];

  const [operatorStats, setOperatorStats] = useState(mockOperatorStats);
  const [resourceStats, setResourceStats] = useState(mockResourceStats);

  useEffect(() => {
    setLogs(mockLogs);
  }, []);

  const loadLogs = async () => {
    if (!searchForm.startTime || !searchForm.endTime) return;
    try {
      setLoading(true);
      const data = await auditApi.getLogsInRange(
        searchForm.startTime.toISOString(),
        searchForm.endTime.toISOString(),
        searchForm.resourceType,
        searchForm.action,
        searchForm.operatorId,
        100
      );
      if (data && data.length > 0) {
        setLogs(data);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    if (!searchForm.startTime || !searchForm.endTime) return;
    try {
      const opStats = await auditApi.getOperatorStatistics(
        searchForm.startTime.toISOString(),
        searchForm.endTime.toISOString()
      );
      if (opStats && opStats.length > 0) {
        setOperatorStats(opStats);
      }

      const resStats = await auditApi.getResourceStatistics(
        searchForm.startTime.toISOString(),
        searchForm.endTime.toISOString()
      );
      if (resStats && resStats.length > 0) {
        setResourceStats(resStats);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case AuditAction.CREATE:
        return <span style={{ color: '#52c41a' }}>+</span>;
      case AuditAction.UPDATE:
        return <span style={{ color: '#1890ff' }}>✎</span>;
      case AuditAction.DELETE:
        return <span style={{ color: '#ff4d4f' }}>✕</span>;
      case AuditAction.EXECUTE:
        return <span style={{ color: '#faad14' }}>▶</span>;
      default:
        return <span>?</span>;
    }
  };

  const getActionName = (action: AuditAction) => {
    const names: Record<AuditAction, string> = {
      [AuditAction.CREATE]: '创建',
      [AuditAction.READ]: '读取',
      [AuditAction.UPDATE]: '更新',
      [AuditAction.DELETE]: '删除',
      [AuditAction.EXECUTE]: '执行',
      [AuditAction.LOGIN]: '登录',
      [AuditAction.LOGOUT]: '登出',
    };
    return names[action] || action;
  };

  const getActionColor = (action: AuditAction) => {
    const colors: Record<AuditAction, string> = {
      [AuditAction.CREATE]: '#52c41a',
      [AuditAction.READ]: '#1890ff',
      [AuditAction.UPDATE]: '#1890ff',
      [AuditAction.DELETE]: '#ff4d4f',
      [AuditAction.EXECUTE]: '#faad14',
      [AuditAction.LOGIN]: '#722ed1',
      [AuditAction.LOGOUT]: '#999',
    };
    return colors[action] || '#999';
  };

  const getResourceTypeName = (type: AuditResourceType) => {
    const names: Record<AuditResourceType, string> = {
      [AuditResourceType.CROP]: '作物',
      [AuditResourceType.GROWTH_STAGE]: '生长期',
      [AuditResourceType.THRESHOLD]: '阈值',
      [AuditResourceType.SENSOR]: '传感器',
      [AuditResourceType.SENSOR_READING]: '传感器读数',
      [AuditResourceType.ALARM]: '告警',
      [AuditResourceType.CONTROL_DEVICE]: '控制设备',
      [AuditResourceType.CONTROL_COMMAND]: '控制指令',
      [AuditResourceType.FARMING_RECORD]: '农事记录',
      [AuditResourceType.HIGH_YIELD_ANALYSIS]: '高产分析',
      [AuditResourceType.STANDARDIZED_MODEL]: '标准化模型',
      [AuditResourceType.USER]: '用户',
      [AuditResourceType.SETTINGS]: '设置',
    };
    return names[type] || type;
  };

  const getResultColor = (result: AuditResult) => {
    const colors: Record<AuditResult, string> = {
      [AuditResult.SUCCESS]: '#52c41a',
      [AuditResult.PARTIAL]: '#faad14',
      [AuditResult.FAILURE]: '#ff4d4f',
    };
    return colors[result] || '#999';
  };

  const getResultName = (result: AuditResult) => {
    const names: Record<AuditResult, string> = {
      [AuditResult.SUCCESS]: '成功',
      [AuditResult.PARTIAL]: '部分成功',
      [AuditResult.FAILURE]: '失败',
    };
    return names[result] || result;
  };

  const handleViewDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailVisible(true);
  };

  const actionChartData = operatorStats.map((item) => ({
    name: item.operatorName,
    成功: item.successCount,
    失败: item.failureCount,
  }));

  const resourceChartData = resourceStats.map((item) => ({
    name: getResourceTypeName(item.resourceType),
    创建: item.createCount,
    更新: item.updateCount,
    删除: item.deleteCount,
    执行: item.executeCount,
  }));

  const pieData = [
    { name: '创建', value: resourceStats.reduce((sum, item) => sum + item.createCount, 0) },
    { name: '更新', value: resourceStats.reduce((sum, item) => sum + item.updateCount, 0) },
    { name: '删除', value: resourceStats.reduce((sum, item) => sum + item.deleteCount, 0) },
    { name: '执行', value: resourceStats.reduce((sum, item) => sum + item.executeCount, 0) },
  ].filter((item) => item.value > 0);

  const columns = [
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action: AuditAction) => (
        <Tag color={getActionColor(action)}>
          {getActionIcon(action)} {getActionName(action)}
        </Tag>
      ),
    },
    {
      title: '资源类型',
      dataIndex: 'resourceType',
      key: 'resourceType',
      width: 120,
      render: (type: AuditResourceType) => (
        <Tag>{getResourceTypeName(type)}</Tag>
      ),
    },
    {
      title: '资源名称',
      dataIndex: 'resourceName',
      key: 'resourceName',
      ellipsis: true,
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 80,
      render: (result: AuditResult) => (
        <Tag color={getResultColor(result)}>{getResultName(result)}</Tag>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 100,
      render: (name: string) => name || '系统',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '操作时间',
      dataIndex: 'actionedAt',
      key: 'actionedAt',
      width: 180,
      render: (time: Date) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: AuditLog) => (
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

  return (
    <div className="audit-logs">
      <Tabs defaultActiveKey="logs">
        <TabPane
          tab={
            <span>
              <FileTextOutlined /> 审计日志
            </span>
          }
          key="logs"
        >
          <Card
            title="审计日志查询"
            extra={
              <Space>
                <Button icon={<ReloadOutlined />} onClick={loadLogs}>
                  刷新
                </Button>
              </Space>
            }
          >
            <div style={{ marginBottom: 16 }}>
              <Space wrap>
                <RangePicker
                  value={[searchForm.startTime, searchForm.endTime]}
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      setSearchForm((prev) => ({
                        ...prev,
                        startTime: dates[0],
                        endTime: dates[1],
                      }));
                    }
                  }}
                  style={{ width: 300 }}
                />
                <Select
                  placeholder="选择资源类型"
                  style={{ width: 150 }}
                  allowClear
                  value={searchForm.resourceType}
                  onChange={(value) =>
                    setSearchForm((prev) => ({ ...prev, resourceType: value }))
                  }
                >
                  {Object.values(AuditResourceType).map((type) => (
                    <Option key={type} value={type}>
                      {getResourceTypeName(type)}
                    </Option>
                  ))}
                </Select>
                <Select
                  placeholder="选择操作类型"
                  style={{ width: 120 }}
                  allowClear
                  value={searchForm.action}
                  onChange={(value) =>
                    setSearchForm((prev) => ({ ...prev, action: value }))
                  }
                >
                  {Object.values(AuditAction).map((action) => (
                    <Option key={action} value={action}>
                      {getActionName(action)}
                    </Option>
                  ))}
                </Select>
                <Input
                  placeholder="关键词搜索"
                  style={{ width: 200 }}
                  prefix={<SearchOutlined />}
                  value={searchForm.keyword}
                  onChange={(e) =>
                    setSearchForm((prev) => ({ ...prev, keyword: e.target.value }))
                  }
                  allowClear
                />
                <Button type="primary" onClick={loadLogs}>
                  查询
                </Button>
              </Space>
            </div>

            <Table
              columns={columns}
              dataSource={logs}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
              scroll={{ x: 1300 }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <DatabaseOutlined /> 操作统计
            </span>
          }
          key="statistics"
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card
                title="操作概览"
                extra={
                  <Button icon={<ReloadOutlined />} onClick={loadStatistics}>
                    刷新
                  </Button>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="总操作数"
                        value={logs.length}
                        prefix={<DatabaseOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="成功操作"
                        value={logs.filter((l) => l.result === AuditResult.SUCCESS).length}
                        valueStyle={{ color: '#52c41a' }}
                        prefix={<DatabaseOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="失败操作"
                        value={logs.filter((l) => l.result === AuditResult.FAILURE).length}
                        valueStyle={{ color: '#ff4d4f' }}
                        prefix={<DatabaseOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="操作人数"
                        value={new Set(logs.map((l) => l.operatorId)).size}
                        prefix={<UserOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="操作人统计">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={actionChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="成功" fill="#52c41a" />
                    <Bar dataKey="失败" fill="#ff4d4f" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="操作类型分布">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col span={24}>
              <Card title="资源类型操作统计">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={resourceChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="创建" fill="#52c41a" />
                    <Bar dataKey="更新" fill="#1890ff" />
                    <Bar dataKey="删除" fill="#ff4d4f" />
                    <Bar dataKey="执行" fill="#faad14" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col span={24}>
              <Card title="操作人明细">
                <List
                  dataSource={operatorStats}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<UserOutlined style={{ fontSize: 24 }} />}
                        title={item.operatorName}
                        description={
                          <Space>
                            <Tag color="blue">操作数: {item.actionCount}</Tag>
                            <Tag color="green">成功: {item.successCount}</Tag>
                            <Tag color="red">失败: {item.failureCount}</Tag>
                            <Tag>
                              成功率: {item.actionCount > 0
                                ? ((item.successCount / item.actionCount) * 100).toFixed(1)
                                : 0}%
                            </Tag>
                          </Space>
                        }
                      />
                      <Progress
                        percent={
                          item.actionCount > 0
                            ? (item.successCount / item.actionCount) * 100
                            : 0
                        }
                        style={{ width: 200 }}
                        status={
                          item.actionCount > 0 && item.successCount === item.actionCount
                            ? 'success'
                            : 'normal'
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      <Modal
        title="审计日志详情"
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setSelectedLog(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {selectedLog && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="操作类型">
                <Tag color={getActionColor(selectedLog.action)}>
                  {getActionIcon(selectedLog.action)} {getActionName(selectedLog.action)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="结果">
                <Tag color={getResultColor(selectedLog.result)}>
                  {getResultName(selectedLog.result)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="资源类型">
                {getResourceTypeName(selectedLog.resourceType)}
              </Descriptions.Item>
              <Descriptions.Item label="资源名称">
                {selectedLog.resourceName}
              </Descriptions.Item>
              <Descriptions.Item label="操作人">
                {selectedLog.operatorName || '系统'}
              </Descriptions.Item>
              <Descriptions.Item label="客户端IP">
                {selectedLog.clientIp || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="操作时间" span={2}>
                {dayjs(selectedLog.actionedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {selectedLog.description || '-'}
              </Descriptions.Item>
            </Descriptions>

            {selectedLog.changes && selectedLog.changes.length > 0 && (
              <Card title="字段变更" size="small" style={{ marginTop: 16 }}>
                <Table
                  dataSource={selectedLog.changes}
                  rowKey="field"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '字段', dataIndex: 'field', key: 'field' },
                    {
                      title: '旧值',
                      dataIndex: 'oldValue',
                      key: 'oldValue',
                      render: (value: any) => (
                        <Tag color="red">{JSON.stringify(value)}</Tag>
                      ),
                    },
                    {
                      title: '新值',
                      dataIndex: 'newValue',
                      key: 'newValue',
                      render: (value: any) => (
                        <Tag color="green">{JSON.stringify(value)}</Tag>
                      ),
                    },
                  ]}
                />
              </Card>
            )}

            {selectedLog.oldValue && (
              <Card title="旧值" size="small" style={{ marginTop: 16 }}>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                    background: '#fff7e6',
                    padding: 12,
                    borderRadius: 4,
                  }}
                >
                  {JSON.stringify(selectedLog.oldValue, null, 2)}
                </pre>
              </Card>
            )}

            {selectedLog.newValue && (
              <Card title="新值" size="small" style={{ marginTop: 16 }}>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                    background: '#f6ffed',
                    padding: 12,
                    borderRadius: 4,
                  }}
                >
                  {JSON.stringify(selectedLog.newValue, null, 2)}
                </pre>
              </Card>
            )}

            {selectedLog.errorMessage && (
              <Card title="错误信息" size="small" style={{ marginTop: 16 }}>
                <div
                  style={{
                    background: '#fff1f0',
                    padding: 12,
                    borderRadius: 4,
                    color: '#ff4d4f',
                  }}
                >
                  {selectedLog.errorMessage}
                </div>
              </Card>
            )}

            <Card title="关联信息" size="small" style={{ marginTop: 16 }}>
              <Descriptions column={3} size="small">
                <Descriptions.Item label="关联告警">
                  {selectedLog.relatedAlarmId ? (
                    <Tag color="orange">{selectedLog.relatedAlarmId}</Tag>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="关联指令">
                  {selectedLog.relatedCommandId ? (
                    <Tag color="blue">{selectedLog.relatedCommandId}</Tag>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="关联记录">
                  {selectedLog.relatedRecordId ? (
                    <Tag color="green">{selectedLog.relatedRecordId}</Tag>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogs;
