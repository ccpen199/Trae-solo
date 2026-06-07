import { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Space, Select, message, Tag } from 'antd';
import { adminAPI } from '../../api';
import dayjs from 'dayjs';

function Sales() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.sales({});
      setOrders(res.orders || []);
    } catch (err) {
      message.error('加载销售数据失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 180 },
    { title: '活动名称', dataIndex: 'title', key: 'title' },
    { title: '用户', dataIndex: 'username', key: 'username', width: 100 },
    {
      title: '金额',
      dataIndex: 'pay_amount',
      key: 'pay_amount',
      width: 100,
      render: (v) => `¥${v}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v) => {
        if (v === 'paid') return <Tag color="green">已支付</Tag>;
        if (v === 'refunded') return <Tag color="orange">已退款</Tag>;
        return <Tag>{v}</Tag>;
      }
    },
    {
      title: '支付时间',
      dataIndex: 'paid_at',
      key: 'paid_at',
      width: 180,
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <h2 style={{ margin: 0 }}>销售统计</h2>

      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </Space>
  );
}

export default Sales;
