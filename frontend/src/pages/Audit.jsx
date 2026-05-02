import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Input, Button, Space, Select, DatePicker, message, Spin } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { auditApi } from '../services/api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Audit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    resource_type: '',
    dateRange: null,
    search: '',
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async (searchFilters = {}) => {
    setLoading(true);
    try {
      const response = await auditApi.getLogs({
        ...filters,
        ...searchFilters,
        limit: 100,
      });
      setLogs(response.data.data.logs || []);
    } catch (error) {
      message.error('获取审计日志失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    const colors = {
      create: 'green',
      update: 'blue',
      delete: 'red',
      read: 'default',
      login: 'purple',
      logout: 'orange',
      pay: 'cyan',
      cancel: 'orange',
      activate: 'green',
      suspend: 'warning',
      fail: 'red',
      send: 'blue',
    };
    return colors[action] || 'default';
  };

  const getActionText = (action) => {
    const names = {
      create: '创建',
      update: '更新',
      delete: '删除',
      read: '读取',
      login: '登录',
      logout: '登出',
      pay: '支付',
      cancel: '取消',
      activate: '激活',
      suspend: '暂停',
      fail: '失败',
      send: '发送',
    };
    return names[action] || action;
  };

  const getResourceTypeText = (type) => {
    const names = {
      user: '用户',
      plan: '套餐',
      subscription: '订阅',
      invoice: '账单',
      payment: '支付',
      notification: '通知',
      entitlement: '权益',
      auth: '认证',
      system: '系统',
    };
    return names[type] || type;
  };

  const handleSearch = () => {
    fetchLogs(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      action: '',
      resource_type: '',
      dateRange: null,
      search: '',
    };
    setFilters(resetFilters);
    fetchLogs(resetFilters);
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action) => (
        <Tag color={getActionColor(action)}>
          {getActionText(action)}
        </Tag>
      ),
    },
    {
      title: '资源类型',
      dataIndex: 'resource_type',
      key: 'resource_type',
      width: 100,
      render: (type) => getResourceTypeText(type),
    },
    {
      title: '资源ID',
      dataIndex: 'resource_id',
      key: 'resource_id',
      width: 100,
      render: (id) => id || '-',
    },
    {
      title: '操作人',
      dataIndex: 'user_display_name',
      key: 'user',
      width: 120,
      render: (text, record) => (
        <span>
          {text || record.user_username || '系统'}
          {record.user_ip && (
            <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>
              ({record.user_ip})
            </span>
          )}
        </span>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (desc) => desc || '-',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 style={{ margin: 0 }}>审计查询</h2>
      </div>

      <Card className="dashboard-card" style={{ marginBottom: 24 }}>
        <Space wrap>
          <Input
            placeholder="搜索描述"
            style={{ width: 200 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="操作类型"
            style={{ width: 120 }}
            allowClear
            value={filters.action || undefined}
            onChange={(v) => setFilters({ ...filters, action: v || '' })}
          >
            <Option value="create">创建</Option>
            <Option value="update">更新</Option>
            <Option value="delete">删除</Option>
            <Option value="login">登录</Option>
            <Option value="pay">支付</Option>
            <Option value="cancel">取消</Option>
            <Option value="activate">激活</Option>
          </Select>
          <Select
            placeholder="资源类型"
            style={{ width: 120 }}
            allowClear
            value={filters.resource_type || undefined}
            onChange={(v) => setFilters({ ...filters, resource_type: v || '' })}
          >
            <Option value="user">用户</Option>
            <Option value="plan">套餐</Option>
            <Option value="subscription">订阅</Option>
            <Option value="invoice">账单</Option>
            <Option value="payment">支付</Option>
            <Option value="auth">认证</Option>
          </Select>
          <RangePicker
            value={filters.dateRange}
            onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </Card>

      <Card className="dashboard-card">
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default Audit;
