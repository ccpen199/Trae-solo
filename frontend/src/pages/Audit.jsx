import React, { useState, useEffect } from 'react';
import { Table, Typography, Card, Tag, Select, Input, Space } from 'antd';
import { auditAPI } from '../services/api';

const { Title } = Typography;

const Audit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({ module: '', action: '' });

  const loadLogs = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const response = await auditAPI.getAll({
        page,
        pageSize,
        ...filters,
      });
      setLogs(response.data.logs);
      setPagination({
        current: page,
        pageSize,
        total: response.data.total,
      });
    } catch (error) {
      console.error('加载审计日志失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1, pagination.pageSize);
  }, [filters]);

  const actionLabels = {
    create: '创建',
    update: '更新',
    delete: '删除',
    login: '登录',
    logout: '登出',
    export: '导出',
    withdraw: '撤回',
    password: '修改密码',
  };

  const moduleLabels = {
    users: '用户管理',
    cases: '案件管理',
    evidence: '证据管理',
    auth: '认证',
    groups: '分组管理',
  };

  const actionColors = {
    create: 'green',
    update: 'blue',
    delete: 'red',
    login: 'cyan',
    logout: 'gray',
    export: 'purple',
    withdraw: 'orange',
    password: 'gold',
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      sorter: true,
    },
    {
      title: '用户',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 100,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (module) => <Tag color="blue">{moduleLabels[module] || module}</Tag>,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action) => <Tag color={actionColors[action] || 'default'}>{actionLabels[action] || action}</Tag>,
    },
    {
      title: '记录ID',
      dataIndex: 'record_id',
      key: 'record_id',
      width: 100,
      render: (id) => id || '-',
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 130,
    },
  ];

  const handleTableChange = (pagination) => {
    loadLogs(pagination.current, pagination.pageSize);
  };

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>审计日志</Title>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="筛选模块"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, module: value || '' })}
          >
            {Object.entries(moduleLabels).map(([key, label]) => (
              <Select.Option key={key} value={key}>{label}</Select.Option>
            ))}
          </Select>
          <Select
            placeholder="筛选操作"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, action: value || '' })}
          >
            {Object.entries(actionLabels).map(([key, label]) => (
              <Select.Option key={key} value={key}>{label}</Select.Option>
            ))}
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default Audit;
