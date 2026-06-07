import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Space, Select, Input, DatePicker,
  message, Spin, Row, Col, Descriptions, Modal
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, EyeOutlined,
  AuditOutlined, UserOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import api from '../../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    action: '',
    operator_id: '',
    target_type: '',
    dateRange: null,
    keyword: '',
  });

  const ACTION_OPTIONS = [
    { value: 'login', label: '登录' },
    { value: 'logout', label: '登出' },
    { value: 'create', label: '创建' },
    { value: 'update', label: '更新' },
    { value: 'delete', label: '删除' },
    { value: 'approve', label: '审核通过' },
    { value: 'reject', label: '审核拒绝' },
    { value: 'apply', label: '申请' },
  ];

  const TARGET_TYPE_OPTIONS = [
    { value: 'user', label: '用户' },
    { value: 'enterprise', label: '企业' },
    { value: 'job', label: '职位' },
    { value: 'application', label: '申请' },
    { value: 'resume', label: '简历' },
  ];

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async (page = 1, pageSize = 20, extraFilters = {}) => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        ...extraFilters,
      };
      if (extraFilters.dateRange && extraFilters.dateRange.length === 2) {
        params.start_date = extraFilters.dateRange[0].format('YYYY-MM-DD');
        params.end_date = extraFilters.dateRange[1].format('YYYY-MM-DD');
      }
      delete params.dateRange;

      const res = await api.get('/admin/audit-logs', { params });
      setLogs(res.data.logs || []);
      setPagination({
        current: page,
        pageSize,
        total: res.data.total || 0,
      });
    } catch (e) {
      message.error('加载审计日志失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchLogs(1, pagination.pageSize, filters);
  };

  const handleReset = () => {
    const resetFilters = {
      action: '',
      operator_id: '',
      target_type: '',
      dateRange: null,
      keyword: '',
    };
    setFilters(resetFilters);
    fetchLogs(1, pagination.pageSize, resetFilters);
  };

  const handleTableChange = (pag) => {
    fetchLogs(pag.current, pag.pageSize, filters);
  };

  const handleViewDetail = (log) => {
    setCurrentLog(log);
    setDetailVisible(true);
  };

  const getActionTag = (action) => {
    const colorMap = {
      login: 'blue',
      logout: 'default',
      create: 'green',
      update: 'orange',
      delete: 'red',
      approve: 'cyan',
      reject: 'red',
      apply: 'purple',
    };
    const labelMap = {
      login: '登录',
      logout: '登出',
      create: '创建',
      update: '更新',
      delete: '删除',
      approve: '审核通过',
      reject: '审核拒绝',
      apply: '申请',
    };
    return (
      <Tag color={colorMap[action] || 'default'}>
        {labelMap[action] || action}
      </Tag>
    );
  };

  const getTargetTypeText = (type) => {
    const typeMap = {
      user: '用户',
      enterprise: '企业',
      job: '职位',
      application: '申请',
      resume: '简历',
    };
    return typeMap[type] || type;
  };

  const columns = [
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (time) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
          {dayjs(time).format('YYYY-MM-DD HH:mm:ss')}
        </Space>
      ),
      sorter: true,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action) => getActionTag(action),
      filters: ACTION_OPTIONS.map(opt => ({ text: opt.label, value: opt.value })),
      onFilter: (value, record) => record.action === value,
    },
    {
      title: '操作对象',
      dataIndex: 'target_type',
      key: 'target_type',
      width: 100,
      render: (type) => (
        <Tag color="blue">{getTargetTypeText(type)}</Tag>
      ),
      filters: TARGET_TYPE_OPTIONS.map(opt => ({ text: opt.label, value: opt.value })),
      onFilter: (value, record) => record.target_type === value,
    },
    {
      title: '对象ID',
      dataIndex: 'target_id',
      key: 'target_id',
      width: 100,
      render: (id) => id || '-',
    },
    {
      title: '操作人',
      dataIndex: 'operator_name',
      key: 'operator_name',
      width: 120,
      render: (name, record) => (
        <Space>
          <UserOutlined style={{ color: '#1677ff' }} />
          <span>{name}</span>
          {record.operator_role && (
            <Tag color="default" style={{ fontSize: 11 }}>
              {record.operator_role === 'admin' ? '管理员' :
               record.operator_role === 'hr' ? '企业HR' : '求职者'}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '操作描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 130,
      render: (ip) => (
        <span style={{ fontFamily: 'monospace', color: '#8c8c8c', fontSize: 12 }}>
          {ip || '-'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action_col',
      width: 80,
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
  ];

  const renderJsonPreview = (data) => {
    if (!data) return '-';
    try {
      return (
        <pre style={{
          background: '#f6f8fa',
          padding: 12,
          borderRadius: 4,
          maxHeight: 300,
          overflow: 'auto',
          fontSize: 12,
          margin: 0,
        }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      );
    } catch (e) {
      return String(data);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto' }}>
      <div className="page-header">
        <h2>
          <Space>
            <AuditOutlined style={{ color: '#722ed1' }} />
            操作审计日志
          </Space>
        </h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置筛选
          </Button>
        </Space>
      </div>

      <Card className="card-shadow" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="操作类型"
              value={filters.action || undefined}
              onChange={(value) => setFilters({ ...filters, action: value })}
              style={{ width: '100%' }}
              allowClear
            >
              {ACTION_OPTIONS.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="操作对象"
              value={filters.target_type || undefined}
              onChange={(value) => setFilters({ ...filters, target_type: value })}
              style={{ width: '100%' }}
              allowClear
            >
              {TARGET_TYPE_OPTIONS.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="搜索操作人/描述"
              prefix={<UserOutlined />}
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card className="card-shadow">
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {currentLog && (
          <div>
            <Descriptions
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="操作时间" span={2}>
                {dayjs(currentLog.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="操作类型">
                {getActionTag(currentLog.action)}
              </Descriptions.Item>
              <Descriptions.Item label="操作对象">
                <Tag color="blue">{getTargetTypeText(currentLog.target_type)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="对象ID">
                {currentLog.target_id || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="操作人ID">
                {currentLog.operator_id || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="操作人" span={2}>
                <Space>
                  <UserOutlined style={{ color: '#1677ff' }} />
                  <span>{currentLog.operator_name}</span>
                  {currentLog.operator_role && (
                    <Tag color="default">
                      {currentLog.operator_role === 'admin' ? '管理员' :
                       currentLog.operator_role === 'hr' ? '企业HR' : '求职者'}
                    </Tag>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="IP地址" span={2}>
                <span style={{ fontFamily: 'monospace' }}>
                  {currentLog.ip_address || '-'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="User-Agent" span={2}>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                  {currentLog.user_agent || '-'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="操作描述" span={2}>
                {currentLog.description || '-'}
              </Descriptions.Item>
            </Descriptions>

            {currentLog.old_values && (
              <div style={{ marginBottom: 16 }}>
                <div className="section-title" style={{ fontSize: 14, marginBottom: 8 }}>
                  修改前数据
                </div>
                {renderJsonPreview(currentLog.old_values)}
              </div>
            )}

            {currentLog.new_values && (
              <div>
                <div className="section-title" style={{ fontSize: 14, marginBottom: 8 }}>
                  修改后数据
                </div>
                {renderJsonPreview(currentLog.new_values)}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminAuditLogs;
