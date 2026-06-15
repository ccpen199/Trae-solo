import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Select, Input, Space, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const { Option } = Select;

function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [status, setStatus] = useState<string | undefined>();
  const [type, setType] = useState<string | undefined>();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, [page, status, type]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize };
      if (status) params.status = status;
      if (type) params.type = type;
      const data: any = await api.get('/admin/orders/all', { params });
      setOrders(data.orders);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待接单', color: 'orange' },
      bidding: { text: '竞价中', color: 'magenta' },
      accepted: { text: '已接单', color: 'blue' },
      in_progress: { text: '进行中', color: 'green' },
      completed: { text: '已完成', color: 'default' },
      cancelled: { text: '已取消', color: 'red' },
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      labor: '用工',
      delivery: '找车',
      moving: '搬家',
    };
    return typeMap[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      labor: 'blue',
      delivery: 'green',
      moving: 'orange',
    };
    return colorMap[type] || 'default';
  };

  const handleViewOrder = (record: any) => {
    navigate(`/${record.type}/${record.id}`);
  };

  const columns = [
    {
      title: '订单类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color={getTypeColor(type)}>{getTypeText(type)}</Tag>,
    },
    {
      title: '订单标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '金额',
      dataIndex: 'total_price',
      key: 'total_price',
      render: (price: number) => <span style={{ color: '#fa8c16', fontWeight: 500 }}>¥{price}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = getStatusText(status);
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '城市/地址',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: '发布时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button size="small" type="link" onClick={() => handleViewOrder(record)}>
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div className="page-container">
      <h2 style={{ marginBottom: 16 }}>📋 订单管理</h2>

      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <Select
            placeholder="订单类型"
            style={{ width: 150 }}
            allowClear
            value={type}
            onChange={setType}
          >
            <Option value="labor">用工订单</Option>
            <Option value="delivery">找车订单</Option>
            <Option value="moving">搬家订单</Option>
          </Select>
          <Select
            placeholder="订单状态"
            style={{ width: 150 }}
            allowClear
            value={status}
            onChange={setStatus}
          >
            <Option value="pending">待接单</Option>
            <Option value="bidding">竞价中</Option>
            <Option value="accepted">已接单</Option>
            <Option value="in_progress">进行中</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
          <Input
            placeholder="搜索订单"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            onPressEnter={fetchOrders}
          />
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>
    </div>
  );
}

export default AdminOrders;
