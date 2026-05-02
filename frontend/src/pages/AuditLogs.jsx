import React, { useState, useEffect } from 'react';
import { Table, Card, Spin, Empty, Tag, Input, Select, DatePicker, Button } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { auditApi } from '../services/api.js';
import { formatDateTime } from '../utils/status.js';

const { RangePicker } = DatePicker;
const { Option } = Select;

function AuditLogs() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    action: '',
    tableName: '',
    search: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await auditApi.getLogs();
      setLogs(res.data.logs || []);
    } catch (error) {
      console.error('Fetch audit logs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => formatDateTime(text),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      defaultSortOrder: 'descend'
    },
    {
      title: '操作用户',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (val) => val || '-'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role) => {
        const roleMap = {
          borrower: '借款人',
          manager: '客户经理',
          risk_expert: '风控专家',
          approval_director: '审批总监',
          admin: '管理员'
        };
        return <Tag>{roleMap[role] || role}</Tag>;
      }
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 150,
      render: (action) => {
        const actionMap = {
          create: <Tag color="green">创建</Tag>,
          update: <Tag color="blue">更新</Tag>,
          delete: <Tag color="red">删除</Tag>,
          submit: <Tag color="cyan">提交</Tag>,
          review: <Tag color="purple">审核</Tag>,
          approve: <Tag color="green">审批通过</Tag>,
          reject: <Tag color="red">拒绝</Tag>,
          return: <Tag color="orange">退回</Tag>,
          confirm: <Tag color="cyan">确认</Tag>,
          repay: <Tag color="green">还款</Tag>,
          assign: <Tag color="blue">分配</Tag>
        };
        return actionMap[action] || <Tag>{action}</Tag>;
      }
    },
    {
      title: '操作表',
      dataIndex: 'target_type',
      key: 'target_type',
      width: 150
    },
    {
      title: '记录ID',
      dataIndex: 'target_id',
      key: 'target_id',
      width: 80
    },
    {
      title: '状态变更',
      key: 'state_change',
      width: 200,
      render: (_, record) => {
        const before = record.before_state;
        const after = record.after_state;
        if (!before && !after) return '-';
        return (
          <span style={{ fontSize: '12px', color: '#666' }}>
            {before || '-'}
            {after && <span style={{ color: '#1890ff' }}> → {after}</span>}
          </span>
        );
      }
    }
  ];

  return (
    <div>
      <div className="page-title">审计日志</div>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索用户名或表名"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Select
            placeholder="操作类型"
            style={{ width: 120 }}
            allowClear
            value={filters.action || undefined}
            onChange={(val) => setFilters({ ...filters, action: val })}
          >
            <Option value="create">创建</Option>
            <Option value="update">更新</Option>
            <Option value="review">审核</Option>
            <Option value="approve">审批通过</Option>
            <Option value="reject">拒绝</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            刷新
          </Button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin tip="加载中..." />
          </div>
        ) : logs.length > 0 ? (
          <Table
            columns={columns}
            dataSource={logs}
            rowKey="id"
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              defaultPageSize: 20
            }}
          />
        ) : (
          <Empty description="暂无审计日志" />
        )}
      </Card>
    </div>
  );
}

export default AuditLogs;
