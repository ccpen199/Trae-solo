import React, { useState, useEffect } from 'react';
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
  Timeline,
  Drawer,
  Descriptions,
  message,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  ExportOutlined,
  EyeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import { auditApi } from '@/api';
import type { AuditLog, AuditAction, RiskLevel, PageParams } from '@/types';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

const AdminAuditLog: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState<AuditLog | null>(null);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [timelineLogs, setTimelineLogs] = useState<AuditLog[]>([]);

  const [filters, setFilters] = useState<{
    keyword?: string;
    action?: AuditAction;
    riskLevel?: RiskLevel;
    dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
    userRole?: string;
  }>({});

  const loadLogs = async (page = 1, pageSize = 10) => {
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
      const response = await auditApi.getLogs(params);
      setLogs(response.list);
      setPagination({
        current: page,
        pageSize,
        total: response.total,
      });
    } catch (error) {
      message.error('加载审计日志失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, keyword: value }));
  };

  const handleActionChange = (value: AuditAction) => {
    setFilters(prev => ({ ...prev, action: value }));
  };

  const handleRiskLevelChange = (value: RiskLevel) => {
    setFilters(prev => ({ ...prev, riskLevel: value }));
  };

  const handleDateRangeChange = (dates: any) => {
    setFilters(prev => ({ ...prev, dateRange: dates }));
  };

  const handleUserRoleChange = (value: string) => {
    setFilters(prev => ({ ...prev, userRole: value }));
  };

  const handleReset = () => {
    setFilters({});
    loadLogs(1, 10);
  };

  const handleExport = async () => {
    try {
      await auditApi.exportLogs(filters);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleViewDetail = (log: AuditLog) => {
    setCurrentLog(log);
    setDetailVisible(true);
  };

  const handleViewTimeline = async (log: AuditLog) => {
    try {
      const response = await auditApi.getUserLogs(log.userId, { pageSize: 20 });
      setTimelineLogs(response.list);
      setTimelineVisible(true);
    } catch (error) {
      message.error('加载用户操作记录失败');
    }
  };

  const getRiskLevelTag = (level: RiskLevel) => {
    const config = {
      low: { color: 'green', icon: <CheckCircleOutlined />, text: '低风险' },
      medium: { color: 'orange', icon: <ExclamationCircleOutlined />, text: '中风险' },
      high: { color: 'red', icon: <WarningOutlined />, text: '高风险' },
    };
    const { color, icon, text } = config[level];
    return (
      <Tag color={color} icon={icon}>
        {text}
      </Tag>
    );
  };

  const getActionTag = (action: AuditAction) => {
    const colorMap: Record<AuditAction, string> = {
      login: 'blue',
      logout: 'default',
      create_task: 'green',
      update_task: 'cyan',
      delete_task: 'red',
      place_bid: 'purple',
      submit_work: 'geekblue',
      make_payment: 'gold',
      open_dispute: 'orange',
      resolve_dispute: 'green',
      account_update: 'magenta',
    };
    return <Tag color={colorMap[action]}>{action}</Tag>;
  };

  const columns: ColumnsType<AuditLog> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
    },
    {
      title: '用户',
      dataIndex: 'userName',
      key: 'userName',
      width: 120,
      render: (text, record) => (
        <Space>
          <span>{text}</span>
          <Tag color={record.userRole === 'admin' ? 'red' : record.userRole === 'employer' ? 'blue' : 'green'}>
            {record.userRole}
          </Tag>
        </Space>
      ),
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 140,
      render: (action: AuditAction) => getActionTag(action),
      filters: [
        { text: '登录', value: 'login' },
        { text: '登出', value: 'logout' },
        { text: '创建任务', value: 'create_task' },
        { text: '更新任务', value: 'update_task' },
        { text: '删除任务', value: 'delete_task' },
        { text: '投标', value: 'place_bid' },
        { text: '提交作品', value: 'submit_work' },
        { text: '支付', value: 'make_payment' },
        { text: '发起争议', value: 'open_dispute' },
        { text: '解决争议', value: 'resolve_dispute' },
        { text: '账户更新', value: 'account_update' },
      ],
      onFilter: (value, record) => record.action === value,
    },
    {
      title: '操作描述',
      dataIndex: 'actionName',
      key: 'actionName',
      width: 150,
    },
    {
      title: '目标对象',
      key: 'target',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span className="text-gray-800 font-medium">{record.targetType}</span>
          <span className="text-gray-500 text-xs">{record.targetName || record.targetId}</span>
        </Space>
      ),
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (level: RiskLevel) => getRiskLevelTag(level),
      filters: [
        { text: '低风险', value: 'low' },
        { text: '中风险', value: 'medium' },
        { text: '高风险', value: 'high' },
      ],
      onFilter: (value, record) => record.riskLevel === value,
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 130,
      render: (text) => text || '-',
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
          <Tooltip title="用户时间线">
            <Button
              type="link"
             
              icon={<ReloadOutlined />}
              onClick={() => handleViewTimeline(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    loadLogs(newPagination.current, newPagination.pageSize);
  };

  return (
    <div className="p-6">
      <Card
        title="合规审计日志"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
            <Button type="primary" icon={<ExportOutlined />} onClick={handleExport}>
              导出数据
            </Button>
          </Space>
        }
      >
        <div className="mb-4">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8} lg={6}>
              <Search
                placeholder="搜索用户名/IP/目标ID"
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                onSearch={handleSearch}
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={5}>
              <Select
                placeholder="操作类型"
                allowClear
                style={{ width: '100%' }}
                onChange={handleActionChange}
                value={filters.action}
              >
                <Option value="login">登录</Option>
                <Option value="logout">登出</Option>
                <Option value="create_task">创建任务</Option>
                <Option value="update_task">更新任务</Option>
                <Option value="delete_task">删除任务</Option>
                <Option value="place_bid">投标</Option>
                <Option value="submit_work">提交作品</Option>
                <Option value="make_payment">支付</Option>
                <Option value="open_dispute">发起争议</Option>
                <Option value="resolve_dispute">解决争议</Option>
                <Option value="account_update">账户更新</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8} lg={5}>
              <Select
                placeholder="风险等级"
                allowClear
                style={{ width: '100%' }}
                onChange={handleRiskLevelChange}
                value={filters.riskLevel}
              >
                <Option value="low">低风险</Option>
                <Option value="medium">中风险</Option>
                <Option value="high">高风险</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8} lg={5}>
              <Select
                placeholder="用户角色"
                allowClear
                style={{ width: '100%' }}
                onChange={handleUserRoleChange}
                value={filters.userRole}
              >
                <Option value="employer">雇主</Option>
                <Option value="provider">服务商</Option>
                <Option value="admin">管理员</Option>
              </Select>
            </Col>
            <Col xs={24} sm={24} md={16} lg={9}>
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
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Drawer
        title="审计日志详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentLog && (
          <div>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="操作时间">
                {dayjs(currentLog.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="用户">
                <Space>
                  <span>{currentLog.userName}</span>
                  <Tag>{currentLog.userRole}</Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="用户ID">{currentLog.userId}</Descriptions.Item>
              <Descriptions.Item label="操作类型">
                {getActionTag(currentLog.action)}
              </Descriptions.Item>
              <Descriptions.Item label="操作描述">{currentLog.actionName}</Descriptions.Item>
              <Descriptions.Item label="目标类型">{currentLog.targetType}</Descriptions.Item>
              <Descriptions.Item label="目标ID">{currentLog.targetId}</Descriptions.Item>
              <Descriptions.Item label="目标名称">{currentLog.targetName || '-'}</Descriptions.Item>
              <Descriptions.Item label="风险等级">
                {getRiskLevelTag(currentLog.riskLevel)}
              </Descriptions.Item>
              <Descriptions.Item label="IP地址">{currentLog.ipAddress || '-'}</Descriptions.Item>
              <Descriptions.Item label="用户代理">{currentLog.userAgent || '-'}</Descriptions.Item>
            </Descriptions>

            <Card title="操作详情" className="mt-4">
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(currentLog.details, null, 2)}
              </pre>
            </Card>
          </div>
        )}
      </Drawer>

      <Drawer
        title="用户操作时间线"
        width={500}
        open={timelineVisible}
        onClose={() => setTimelineVisible(false)}
      >
        {timelineLogs.length > 0 ? (
          <Timeline mode="left">
            {timelineLogs.map((log) => (
              <Timeline.Item
                key={log.id}
                color={log.riskLevel === 'high' ? 'red' : log.riskLevel === 'medium' ? 'orange' : 'green'}
                label={dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              >
                <div className="mb-2">
                  <Space>
                    {getActionTag(log.action)}
                    {getRiskLevelTag(log.riskLevel)}
                  </Space>
                </div>
                <div className="text-gray-700 font-medium">{log.actionName}</div>
                <div className="text-gray-500 text-sm mt-1">
                  目标: {log.targetType} - {log.targetName || log.targetId}
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <div className="text-center py-10 text-gray-400">
            暂无操作记录
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AdminAuditLog;
