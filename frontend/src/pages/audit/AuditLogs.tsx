import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Input,
  Space,
  Tag,
  Descriptions,
  Modal,
} from 'antd';
import {
  FileSearchOutlined,
  UserOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { auditApi } from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Search } = Input;

const AuditLogs: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    dateRange: [],
  });
  const [statistics, setStatistics] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const actions = [
    { value: 'CONTENT_CREATE', label: '创建内容' },
    { value: 'CONTENT_UPDATE', label: '更新内容' },
    { value: 'CONTENT_DELETE', label: '删除内容' },
    { value: 'CONTENT_STATUS_CHANGE', label: '状态变更' },
    { value: 'WORKFLOW_START', label: '开始审核' },
    { value: 'REVIEW_PROCESS', label: '处理审核' },
    { value: 'MEDIA_UPLOAD', label: '上传媒体' },
    { value: 'MEDIA_DELETE', label: '删除媒体' },
    { value: 'DISTRIBUTION_CREATE', label: '创建分发' },
    { value: 'DISTRIBUTION_RETRY', label: '重试分发' },
    { value: 'CATEGORY_CREATE', label: '创建分类' },
  ];

  const resourceTypes = [
    { value: 'CONTENT', label: '内容' },
    { value: 'MEDIA', label: '媒体' },
    { value: 'WORKFLOW', label: '工作流' },
    { value: 'DISTRIBUTION', label: '分发' },
    { value: 'CATEGORY', label: '分类' },
    { value: 'USER', label: '用户' },
  ];

  useEffect(() => {
    fetchLogs();
    fetchStatistics();
  }, [pagination.current, pagination.pageSize]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.current,
        limit: pagination.pageSize,
      };

      if (filters.action) params.action = filters.action;
      if (filters.resourceType) params.resourceType = filters.resourceType;

      const response: any = await auditApi.getLogs(params);
      setLogs(response.data?.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data?.total || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response: any = await auditApi.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleViewDetail = (record: any) => {
    setSelectedLog(record);
    setShowModal(true);
  };

  const getActionText = (action: string) => {
    const map: Record<string, string> = {
      CONTENT_CREATE: '创建内容',
      CONTENT_UPDATE: '更新内容',
      CONTENT_DELETE: '删除内容',
      CONTENT_STATUS_CHANGE: '状态变更',
      WORKFLOW_START: '开始审核',
      REVIEW_PROCESS: '处理审核',
      MEDIA_UPLOAD: '上传媒体',
      MEDIA_DELETE: '删除媒体',
      DISTRIBUTION_CREATE: '创建分发',
      DISTRIBUTION_RETRY: '重试分发',
      CATEGORY_CREATE: '创建分类',
      USER_LOGIN: '用户登录',
    };
    return map[action] || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes('DELETE') || action.includes('REJECT')) return 'error';
    if (action.includes('CREATE') || action.includes('START')) return 'success';
    if (action.includes('UPDATE') || action.includes('PROCESS')) return 'processing';
    return 'default';
  };

  const getResourceTypeText = (type: string) => {
    const map: Record<string, string> = {
      CONTENT: '内容',
      MEDIA: '媒体',
      WORKFLOW: '工作流',
      DISTRIBUTION: '分发',
      CATEGORY: '分类',
      USER: '用户',
    };
    return map[type] || type;
  };

  const columns = [
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 150,
      render: (action: string) => (
        <Tag color={getActionColor(action)}>{getActionText(action)}</Tag>
      ),
    },
    {
      title: '资源类型',
      dataIndex: 'resourceType',
      key: 'resourceType',
      width: 100,
      render: (type: string) => <Tag>{getResourceTypeText(type)}</Tag>,
    },
    {
      title: '资源标题',
      dataIndex: 'resourceTitle',
      key: 'resourceTitle',
      ellipsis: true,
      width: 200,
      render: (title: string) => title || '-',
    },
    {
      title: '操作用户',
      dataIndex: 'username',
      key: 'username',
      width: 100,
      render: (username: string) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <UserOutlined />
          {username || '-'}
        </span>
      ),
    },
    {
      title: '状态码',
      dataIndex: 'statusCode',
      key: 'statusCode',
      width: 80,
      render: (code: number) => (
        <Tag color={code === 200 || code === 201 ? 'success' : 'error'}>{code}</Tag>
      ),
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: any) => (
        <a onClick={() => handleViewDetail(record)}>
          <EyeOutlined /> 详情
        </a>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>审计日志</h2>
        <p style={{ color: 'rgba(0,0,0,0.45)' }}>查看所有系统操作日志</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="总操作数"
              value={statistics?.totalLogs || 0}
              prefix={<FileSearchOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="创建操作"
              value={statistics?.byAction?.find((a: any) => a.action?.includes('CREATE'))?.count || 0}
              prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="更新操作"
              value={statistics?.byAction?.find((a: any) => a.action?.includes('UPDATE'))?.count || 0}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="删除操作"
              value={statistics?.byAction?.find((a: any) => a.action?.includes('DELETE'))?.count || 0}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Select
            placeholder="操作类型"
            style={{ width: 150 }}
            allowClear
            value={filters.action || undefined}
            onChange={(v) => setFilters({ ...filters, action: v })}
          >
            {actions.map((a) => (
              <Select.Option key={a.value} value={a.value}>
                {a.label}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="资源类型"
            style={{ width: 150 }}
            allowClear
            value={filters.resourceType || undefined}
            onChange={(v) => setFilters({ ...filters, resourceType: v })}
          >
            {resourceTypes.map((r) => (
              <Select.Option key={r.value} value={r.value}>
                {r.label}
              </Select.Option>
            ))}
          </Select>
          <RangePicker
            placeholder={['开始日期', '结束日期']}
            onChange={(dates) => setFilters({ ...filters, dateRange: dates || [] })}
          />
          <Button type="primary" onClick={fetchLogs} icon={<SearchOutlined />}>
            搜索
          </Button>
          <Button
            onClick={() => {
              setFilters({ action: '', resourceType: '', dateRange: [] });
              setPagination({ ...pagination, current: 1 });
            }}
          >
            重置
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) =>
              setPagination({ ...pagination, current: page, pageSize }),
          }}
        />
      </Card>

      <Modal
        title="操作详情"
        open={showModal}
        onCancel={() => setShowModal(false)}
        width={700}
        footer={null}
      >
        {selectedLog && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="操作类型">
                <Tag color={getActionColor(selectedLog.action)}>
                  {getActionText(selectedLog.action)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="资源类型">
                <Tag>{getResourceTypeText(selectedLog.resourceType)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="资源ID">
                {selectedLog.resourceId || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="资源标题">
                {selectedLog.resourceTitle || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="操作用户">
                {selectedLog.username || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="用户ID">
                {selectedLog.userId || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="操作时间" span={2}>
                {dayjs(selectedLog.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="请求路径" span={2}>
                {selectedLog.requestPath || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="请求方法">
                {selectedLog.requestMethod || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态码">
                <Tag color={selectedLog.statusCode === 200 || selectedLog.statusCode === 201 ? 'success' : 'error'}>
                  {selectedLog.statusCode || '-'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {selectedLog.oldValue && (
              <div style={{ marginTop: 16 }}>
                <h4>旧值：</h4>
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, overflow: 'auto' }}>
                  {JSON.stringify(selectedLog.oldValue, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.newValue && (
              <div style={{ marginTop: 16 }}>
                <h4>新值：</h4>
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, overflow: 'auto' }}>
                  {JSON.stringify(selectedLog.newValue, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogs;
