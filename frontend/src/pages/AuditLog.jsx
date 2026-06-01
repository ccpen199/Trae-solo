import React, { useState, useEffect } from 'react';
import { 
  Table, Space, Tag, Typography, Card, Select, Input
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { auditApi } from '../services/api.js';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const actionColors = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  execute: 'purple',
  approve: 'green',
  reject: 'red',
  submit: 'orange',
  rollback: 'orange',
  acknowledge: 'blue',
  resolve: 'green',
  close: 'default'
};

function AuditLog() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const response = await auditApi.getList({ ...filters, page, page_size: pageSize });
      setData(response.data.data);
      setPagination({
        current: page,
        pageSize,
        total: response.data.total
      });
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (action) => <Tag color={actionColors[action] || 'default'}>{action}</Tag>,
      width: 100
    },
    {
      title: '资源类型',
      dataIndex: 'resource_type',
      key: 'resource_type',
      width: 120,
      filters: [
        { text: '应用', value: 'application' },
        { text: '环境', value: 'environment' },
        { text: '压测任务', value: 'stress_task' },
        { text: '变更单', value: 'change_order' },
        { text: '告警', value: 'alert' },
        { text: 'API密钥', value: 'api_key' }
      ],
      onFilter: (value, record) => record.resource_type === value
    },
    {
      title: '资源ID',
      dataIndex: 'resource_id',
      key: 'resource_id',
      width: 150,
      ellipsis: true
    },
    {
      title: '操作人',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 100
    },
    {
      title: '原因/说明',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true
    },
    {
      title: '变更详情',
      dataIndex: 'old_value',
      key: 'change',
      render: (_, record) => {
        if (record.action === 'create') {
          return <Tag color="green">新建资源</Tag>;
        }
        if (record.action === 'delete') {
          return <Tag color="red">删除资源</Tag>;
        }
        return <Text type="secondary">已更新</Text>;
      },
      width: 100
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d) => dayjs(d).format('YYYY-MM-DD HH:mm:ss'),
      width: 180,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at)
    }
  ];

  return (
    <div className="table-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>审计日志</Title>
          <Text type="secondary">记录所有系统操作和变更历史</Text>
        </div>
        <Space>
          <Select
            placeholder="按资源类型筛选"
            style={{ width: 150 }}
            allowClear
            onChange={(v) => setFilters({ ...filters, resource_type: v })}
          >
            <Option value="application">应用</Option>
            <Option value="environment">环境</Option>
            <Option value="stress_task">压测任务</Option>
            <Option value="change_order">变更单</Option>
            <Option value="alert">告警</Option>
            <Option value="api_key">API密钥</Option>
          </Select>
          <Select
            placeholder="按操作类型筛选"
            style={{ width: 150 }}
            allowClear
            onChange={(v) => setFilters({ ...filters, action: v })}
          >
            <Option value="create">创建</Option>
            <Option value="update">更新</Option>
            <Option value="delete">删除</Option>
            <Option value="execute">执行</Option>
            <Option value="approve">批准</Option>
            <Option value="reject">驳回</Option>
          </Select>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => loadData(page, pageSize)
        }}
        size="small"
      />
    </div>
  );
}

export default AuditLog;
