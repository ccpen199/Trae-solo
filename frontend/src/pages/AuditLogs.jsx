import { useState, useEffect } from 'react';
import { Card, Table, Tag, Select, Input, Space, Form, Button, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { accessApi } from '../services/api';
import dayjs from 'dayjs';

function AuditLogs({ user }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await accessApi.getAuditLogs(filters);
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch (err) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const actionTypes = [
    { value: 'login', label: '登录' },
    { value: 'logout', label: '登出' },
    { value: 'create_credential', label: '创建凭据' },
    { value: 'update_credential', label: '更新凭据' },
    { value: 'delete_credential', label: '删除凭据' },
    { value: 'reveal_credential', label: '查看明文' },
    { value: 'copy_credential', label: '复制凭据' },
    { value: 'freeze_credential', label: '冻结凭据' },
    { value: 'unfreeze_credential', label: '解冻凭据' },
    { value: 'create_access_request', label: '申请访问' },
    { value: 'approve_access_request', label: '批准申请' },
    { value: 'deny_access_request', label: '拒绝申请' },
    { value: 'create_access_grant', label: '授予权限' },
    { value: 'revoke_access_grant', label: '撤销权限' },
    { value: 'create_incident', label: '创建事件' },
    { value: 'rotate_credential', label: '轮换凭据' },
  ];

  const columns = [
    { title: '时间', dataIndex: 'created_at', key: 'time',
      render: d => dayjs(d).format('YYYY-MM-DD HH:mm:ss'),
      width: 180,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      defaultSortOrder: 'descend'
    },
    { title: '用户', dataIndex: 'user_name', key: 'user', width: 120 },
    { title: '操作', dataIndex: 'action', key: 'action',
      render: a => <Tag color="blue">{a}</Tag>,
      width: 150,
      filters: actionTypes,
      onFilter: (v, r) => r.action === v
    },
    { title: '资源类型', dataIndex: 'resource_type', key: 'resource_type',
      render: t => t ? <Tag>{t}</Tag> : '-',
      width: 120
    },
    { title: '资源ID', dataIndex: 'resource_id', key: 'resource_id', width: 100 },
    { title: 'IP地址', dataIndex: 'ip_address', key: 'ip', width: 130 },
    { title: '详情', dataIndex: 'details', key: 'details',
      render: d => {
        try {
          const parsed = JSON.parse(d);
          return <span style={{ color: '#666', fontSize: 12 }}>{JSON.stringify(parsed)}</span>;
        } catch {
          return d;
        }
      }
    },
  ];

  return (
    <Card title="审计日志" extra={
      <Space>
        <Input.Search
          placeholder="搜索动作"
          allowClear
          onSearch={v => setFilters(prev => ({ ...prev, action: v || undefined }))}
          style={{ width: 200 }}
        />
        <Select
          placeholder="资源类型"
          allowClear
          style={{ width: 150 }}
          onChange={v => setFilters(prev => ({ ...prev, resource_type: v || undefined }))}
        >
          <Select.Option value="credential">凭据</Select.Option>
          <Select.Option value="user">用户</Select.Option>
          <Select.Option value="team">团队</Select.Option>
          <Select.Option value="incident">事件</Select.Option>
        </Select>
      </Space>
    }>
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        pagination={{
          total,
          pageSize: 20,
          showSizeChanger: true,
          showTotal: t => `共 ${t} 条`,
        }}
        scroll={{ x: 1200 }}
      />
    </Card>
  );
}

export default AuditLogs;
