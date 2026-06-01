import React, { useState, useEffect } from 'react';
import { Table, Button, Select, Card, message, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { logAPI } from '../utils/api';

const { Option } = Select;

function AuditLogs() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [page, pageSize, actionFilter, resourceFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resource_type = resourceFilter;
      const response = await logAPI.getAuditLogs(params);
      setData(response.data.list);
      setTotal(response.data.total);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getActionTag = (action) => {
    const actionMap = {
      create: { color: 'green', text: '创建' },
      update: { color: 'blue', text: '更新' },
      delete: { color: 'red', text: '删除' },
      login: { color: 'purple', text: '登录' },
      review: { color: 'orange', text: '审核' },
      update_status: { color: 'cyan', text: '状态更新' },
    };
    const config = actionMap[action] || { color: 'default', text: action };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '用户',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 100,
      render: (text) => text || '系统',
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action) => getActionTag(action),
    },
    {
      title: '资源类型',
      dataIndex: 'resource_type',
      key: 'resource_type',
      width: 120,
    },
    {
      title: '资源ID',
      dataIndex: 'resource_id',
      key: 'resource_id',
      width: 100,
    },
    {
      title: '旧值',
      dataIndex: 'old_value',
      key: 'old_value',
      ellipsis: true,
      render: (v) => v ? <code style={{ fontSize: 11 }}>{v.slice(0, 100)}</code> : '-',
    },
    {
      title: '新值',
      dataIndex: 'new_value',
      key: 'new_value',
      ellipsis: true,
      render: (v) => v ? <code style={{ fontSize: 11 }}>{v.slice(0, 100)}</code> : '-',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 130,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">权限审计</h1>
        <p style={{ color: '#666' }}>查看系统操作审计日志和权限变更记录</p>
      </div>

      <Card>
        <div className="filter-bar">
          <Select
            placeholder="操作类型"
            value={actionFilter}
            onChange={setActionFilter}
            allowClear
            style={{ width: 140 }}
          >
            <Option value="create">创建</Option>
            <Option value="update">更新</Option>
            <Option value="delete">删除</Option>
            <Option value="login">登录</Option>
            <Option value="review">审核</Option>
          </Select>
          <Select
            placeholder="资源类型"
            value={resourceFilter}
            onChange={setResourceFilter}
            allowClear
            style={{ width: 140 }}
          >
            <Option value="application">应用</Option>
            <Option value="api_key">密钥</Option>
            <Option value="task">任务</Option>
            <Option value="change_order">变更单</Option>
            <Option value="alert">告警</Option>
            <Option value="user">用户</Option>
          </Select>
          <Button onClick={loadData}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setActionFilter(''); setResourceFilter(''); setPage(1); loadData(); }}>
            重置
          </Button>
        </div>

        <Table
          loading={loading}
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>
    </div>
  );
}

export default AuditLogs;
