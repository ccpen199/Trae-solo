import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Input, Select, Modal, Form, message, DatePicker, Descriptions, Divider, Card, Empty, Popconfirm, Row, Col } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { orderApi, vehicleApi, storeApi, userApi } from '../../services/api';
import { Order, OrderStatusMap } from '../../types';

const { RangePicker } = DatePicker;
const { Option } = Select;

const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({ status: '', keyword: '' });

  useEffect(() => {
    loadOrders();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.list({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters
      });
      setOrders(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('加载订单失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (id: number) => {
    try {
      await orderApi.pay(id);
      message.success('支付成功');
      loadOrders();
    } catch (err) {
      message.error('支付失败');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await orderApi.cancel(id);
      message.success('订单已取消');
      loadOrders();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 160 },
    { title: '客户', dataIndex: 'user_name', key: 'user_name' },
    { title: '车辆', dataIndex: 'plate_number', key: 'plate_number', render: (v: string, r: Order) => `${v} (${r.brand} ${r.model})` },
    { title: '取车门店', dataIndex: 'pickup_store_name', key: 'pickup_store_name' },
    { title: '还车门店', dataIndex: 'return_store_name', key: 'return_store_name' },
    { title: '租期', key: 'period', render: (_, r: Order) => `${r.pickup_time?.slice(0, 10)} 至 ${r.return_time?.slice(0, 10)}` },
    { title: '天数', dataIndex: 'total_days', key: 'total_days', render: (d: number) => `${d}天` },
    { title: '总金额', dataIndex: 'total_amount', key: 'total_amount', render: (v: number) => `¥${v}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={OrderStatusMap[s]?.color}>{OrderStatusMap[s]?.text}</Tag> },
    {
      title: '操作', key: 'action', width: 200,
      render: (_, record: Order) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/orders/${record.id}`)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button type="link" size="small" onClick={() => handlePay(record.id)}>支付</Button>
              <Popconfirm title="确定取消该订单?" onConfirm={() => handleCancel(record.id)}>
                <Button type="link" size="small" danger>取消</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">订单管理</h2>
        <Space>
          <Input
            placeholder="搜索订单号/客户/车牌号"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            allowClear
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          />
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, status: value })}
          >
            {Object.entries(OrderStatusMap).map(([key, val]) => (
              <Option key={key} value={key}>{val.text}</Option>
            ))}
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/orders/create')}>
            创建订单
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          ...pagination,
          total,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (page, pageSize) => setPagination({ current: page, pageSize })
        }}
      />
    </div>
  );
};

export default OrderList;
