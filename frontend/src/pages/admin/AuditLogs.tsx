import React from 'react';
import { Card, Table, Tag, Input, Select, DatePicker } from 'antd';
import { api } from '../../services/api';
import { AuditLog } from '../../types';
import dayjs from 'dayjs';

const { Search } = Input;
const { RangePicker } = DatePicker;

const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pagination, setPagination] = React.useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = React.useState({
    action: '',
    targetType: '',
    userId: ''
  });

  const fetchLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize
      };

      if (filters.action) params.action = filters.action;
      if (filters.targetType) params.targetType = filters.targetType;
      if (filters.userId) params.userId = filters.userId;

      const response = await api.get('/admin/audit-logs', { params });
      
      if (response.data.success) {
        setLogs(response.data.data);
      }
    } catch (error) {
      console.error('获取审计日志失败:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination, filters]);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: string) => id.substring(0, 8) + '...'
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 150,
      render: (action: string) => {
        let color = 'default';
        if (action.includes('delete') || action.includes('ban')) color = 'red';
        if (action.includes('create')) color = 'green';
        if (action.includes('update')) color = 'blue';
        if (action.includes('mute')) color = 'orange';
        return <Tag color={color}>{action}</Tag>;
      }
    },
    {
      title: '目标类型',
      dataIndex: 'targetType',
      key: 'targetType',
      width: 100
    },
    {
      title: '目标ID',
      dataIndex: 'targetId',
      key: 'targetId',
      width: 150,
      render: (id: string) => id ? id.substring(0, 12) + '...' : '-'
    },
    {
      title: '操作者',
      dataIndex: 'user',
      key: 'user',
      width: 100,
      render: (user: any) => user?.username || '系统'
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
      render: (ip: string) => ip || '-'
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    }
  ];

  const actionOptions = [
    { value: '', label: '全部' },
    { value: 'create_post', label: '创建帖子' },
    { value: 'update_post', label: '更新帖子' },
    { value: 'delete_post', label: '删除帖子' },
    { value: 'delete_comment', label: '删除评论' },
    { value: 'mute_user', label: '禁言用户' },
    { value: 'unmute_user', label: '解除禁言' },
    { value: 'ban_user', label: '封禁用户' },
    { value: 'unban_user', label: '解除封禁' }
  ];

  const targetTypeOptions = [
    { value: '', label: '全部' },
    { value: 'post', label: '帖子' },
    { value: 'comment', label: '评论' },
    { value: 'user', label: '用户' },
    { value: 'report', label: '举报' }
  ];

  return (
    <div className="admin-audit-logs">
      <Card title="审计日志">
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Select
            placeholder="操作类型"
            style={{ width: 150 }}
            allowClear
            options={actionOptions}
            onChange={(value) => setFilters({ ...filters, action: value || '' })}
          />
          <Select
            placeholder="目标类型"
            style={{ width: 150 }}
            allowClear
            options={targetTypeOptions}
            onChange={(value) => setFilters({ ...filters, targetType: value || '' })}
          />
          <Search
            placeholder="用户ID"
            style={{ width: 200 }}
            allowClear
            onSearch={(value) => setFilters({ ...filters, userId: value })}
          />
        </div>

        <Table
          dataSource={logs}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
            onShowSizeChange: (current, size) => setPagination({ ...pagination, current, pageSize: size })
          }}
        />
      </Card>
    </div>
  );
};

export default AdminAuditLogs;
