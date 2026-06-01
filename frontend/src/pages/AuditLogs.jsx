import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Select, Row, Col } from 'antd';
import { logAPI, userAPI } from '../services/api';
import dayjs from 'dayjs';

const AuditLogs = () => {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadData();
    loadUsers();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await logAPI.auditLogs(filters);
      setData(res.data);
    } catch (err) {
      console.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await userAPI.list();
      setUsers(res.data);
    } catch (err) {
      console.error('加载用户失败');
    }
  };

  const actionOptions = [
    { label: '创建', value: 'create' },
    { label: '更新', value: 'update' },
    { label: '删除', value: 'delete' },
    { label: '审批', value: 'approve' },
    { label: '执行', value: 'execute' },
    { label: '重试', value: 'retry' },
    { label: '取消', value: 'cancel' },
    { label: '处理', value: 'handle' },
    { label: '登录', value: 'login' },
  ];

  const resourceOptions = [
    { label: '应用', value: 'application' },
    { label: '规则', value: 'mask_rule' },
    { label: '任务', value: 'task' },
    { label: '变更单', value: 'change_order' },
    { label: '告警', value: 'alert' },
    { label: '用户', value: 'user' },
  ];

  const columns = [
    {
      title: '审计ID',
      dataIndex: 'audit_id',
      key: 'audit_id',
      width: 140,
    },
    {
      title: '用户',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 100,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action) => {
        const opt = actionOptions.find(o => o.value === action);
        return opt?.label || action;
      },
    },
    {
      title: '资源类型',
      dataIndex: 'resource_type',
      key: 'resource_type',
      width: 120,
      render: (type) => {
        const opt = resourceOptions.find(o => o.value === type);
        return opt?.label || type;
      },
    },
    {
      title: '资源ID',
      dataIndex: 'resource_id',
      key: 'resource_id',
      width: 100,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 120,
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">审计日志</h2>
        <Button onClick={loadData}>刷新</Button>
      </div>

      <div className="filter-form">
        <Row gutter={16}>
          <Col span={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择用户"
              allowClear
              onChange={(v) => setFilters({ ...filters, userId: v })}
            >
              {users.map(u => (
                <Select.Option key={u.id} value={u.id}>{u.name}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="操作类型"
              allowClear
              onChange={(v) => setFilters({ ...filters, action: v })}
            >
              {actionOptions.map(o => (
                <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="资源类型"
              allowClear
              onChange={(v) => setFilters({ ...filters, resourceType: v })}
            >
              {resourceOptions.map(o => (
                <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Button type="primary" onClick={loadData}>查询</Button>
            <Button style={{ marginLeft: 8 }} onClick={() => { setFilters({}); loadData(); }}>重置</Button>
          </Col>
        </Row>
      </div>

      <div className="card-content">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </div>
    </div>
  );
};

export default AuditLogs;
