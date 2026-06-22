import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Select, DatePicker, Tag, Button, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { orderService } from '@/services/order.service';
import type { Order, OrderStatus } from '@shared/types';

const { RangePicker } = DatePicker;

const statusMap: Record<OrderStatus, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待接单' },
  accepted: { color: 'blue', text: '已接单' },
  picking_up: { color: 'cyan', text: '取件中' },
  delivering: { color: 'geekblue', text: '配送中' },
  completed: { color: 'green', text: '已完成' },
  cancelled: { color: 'red', text: '已取消' },
  exception: { color: 'volcano', text: '异常' },
};

const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [orderType, setOrderType] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const result = await orderService.getList({
        page,
        pageSize,
        status,
        type: orderType,
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
      });
      setOrders(result.data);
      setTotal(result.total);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [page, pageSize, status, orderType]);

  const columns: ColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (val: number) => `¥${val.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: OrderStatus) => {
        const item = statusMap[val] || { color: 'default', text: val };
        return <Tag color={item.color}>{item.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/order/${record.id}`)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card className="page-card">
        <div className="filter-bar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Select
            placeholder="订单状态"
            allowClear
            value={status}
            onChange={(val) => setStatus(val)}
            style={{ width: 120 }}
            options={Object.entries(statusMap).map(([key, val]) => ({
              label: val.text,
              value: key,
            }))}
          />
          <Select
            placeholder="订单类型"
            allowClear
            value={orderType}
            onChange={(val) => setOrderType(val)}
            style={{ width: 120 }}
            options={[
              { label: '配送', value: 'delivery' },
              { label: '取件', value: 'pickup' },
              { label: '跑腿', value: 'errands' },
              { label: '代购', value: 'shopping' },
            ]}
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
          />
          <Button icon={<SearchOutlined />} type="primary" onClick={fetchOrders}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setStatus(undefined); setOrderType(undefined); setDateRange(null); fetchOrders(); }}>
            重置
          </Button>
        </div>
        <Table<Order>
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default OrderList;
