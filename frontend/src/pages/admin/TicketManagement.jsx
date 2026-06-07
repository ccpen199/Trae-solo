import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import api from '../../utils/api';

function TicketManagement() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/tickets');
      setTickets(response.data.tickets);
    } catch (error) {
      console.error('加载工单失败', error);
    }
    setLoading(false);
  };

  const handleAssign = async (id) => {
    try {
      await api.put(`/admin/tickets/${id}/assign`);
      message.success('工单已分配');
      loadTickets();
    } catch (error) {
      message.error('分配失败');
    }
  };

  const getTypeText = (type) => {
    const types = {
      refund: '退订申请',
      resend: '补寄申请',
      damage: '破损索赔',
      other: '其他问题'
    };
    return types[type] || type;
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'red',
      processing: 'blue',
      closed: 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      open: '待处理',
      processing: '处理中',
      closed: '已关闭'
    };
    return texts[status] || status;
  };

  const columns = [
    { title: '工单号', dataIndex: 'id', key: 'id', width: 80 },
    { title: '用户', dataIndex: 'username', key: 'username' },
    { title: '类型', dataIndex: 'type', key: 'type', render: getTypeText },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '优先级', dataIndex: 'priority', key: 'priority', render: (p) => (
      <Tag color={p === 'high' ? 'red' : p === 'normal' ? 'blue' : 'default'}>
        {p === 'high' ? '高' : p === 'normal' ? '普通' : '低'}
      </Tag>
    )},
    { title: '状态', dataIndex: 'status', key: 'status', render: (status) => (
      <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
    )},
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    { title: '操作', key: 'action', render: (_, record) => record.status === 'open' && (
      <Button type="primary" size="small" onClick={() => handleAssign(record.id)}>
        接单处理
      </Button>
    )},
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>工单管理</h1>
      <Card>
        <Table
          columns={columns}
          dataSource={tickets}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}

export default TicketManagement;
