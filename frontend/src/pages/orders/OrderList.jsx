import { useState, useEffect } from 'react';
import { Table, Tag, Button, Select, Space, Modal, Descriptions, DatePicker, message, Popconfirm } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { orderApi } from '../../services/api';

const { RangePicker } = DatePicker;

const categoryMap = {
  food_delivery: { label: '餐饮外卖', color: 'orange' },
  ride_hailing: { label: '出行打车', color: 'blue' },
  gov_payment: { label: '政务缴费', color: 'green' },
  retail: { label: '商超零售', color: 'purple' },
};

const statusMap = {
  pending: { label: '待处理', color: 'gold' },
  paid: { label: '已支付', color: 'blue' },
  fulfilled: { label: '已完成', color: 'green' },
  cancelled: { label: '已取消', color: 'red' },
  refunding: { label: '退款中', color: 'orange' },
  refunded: { label: '已退款', color: 'default' },
};

export default function OrderList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({ status: undefined, category: undefined, dateRange: null });
  const [detailVisible, setDetailVisible] = useState(false);
  const [current, setCurrent] = useState(null);

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }
      const res = await orderApi.getList(params);
      const d = res.data.data || res.data;
      setData(d.list || d.records || []);
      setPagination({ current: page, pageSize, total: d.total || 0 });
    } catch {
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters.status, filters.category, filters.dateRange]);

  const handleTableChange = (pag) => {
    fetchData(pag.current, pag.pageSize);
  };

  const viewDetail = async (record) => {
    try {
      const res = await orderApi.getById(record.id);
      setCurrent(res.data.data || res.data);
      setDetailVisible(true);
    } catch {
      setCurrent(record);
      setDetailVisible(true);
    }
  };

  const handleCancel = async (id) => {
    try {
      await orderApi.cancel(id, {});
      message.success('订单已取消');
      fetchData(pagination.current, pagination.pageSize);
    } catch {
      message.error('取消订单失败');
    }
  };

  const handleFulfill = async (id) => {
    try {
      await orderApi.fulfill(id, {});
      message.success('订单已完成');
      fetchData(pagination.current, pagination.pageSize);
    } catch {
      message.error('完成订单失败');
    }
  };

  const columns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
    { title: '用户手机号', dataIndex: 'userPhone', key: 'userPhone' },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (v) => {
        const c = categoryMap[v] || { label: v, color: 'default' };
        return <Tag color={c.color}>{c.label}</Tag>;
      },
    },
    { title: '总金额', dataIndex: 'totalAmount', key: 'totalAmount', render: (v) => `¥${v}` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const s = statusMap[v] || { label: v, color: 'default' };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    { title: '城市', dataIndex: 'city', key: 'city' },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => viewDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' || record.status === 'paid' ? (
            <Popconfirm title="确定取消该订单吗？" onConfirm={() => handleCancel(record.id)}>
              <Button type="link" danger>取消</Button>
            </Popconfirm>
          ) : null}
          {record.status === 'paid' ? (
            <Popconfirm title="确定完成该订单吗？" onConfirm={() => handleFulfill(record.id)}>
              <Button type="link">完成</Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="状态筛选"
          allowClear
          style={{ width: 140 }}
          value={filters.status}
          onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
        >
          {Object.entries(statusMap).map(([k, v]) => (
            <Select.Option key={k} value={k}>{v.label}</Select.Option>
          ))}
        </Select>
        <Select
          placeholder="类别筛选"
          allowClear
          style={{ width: 140 }}
          value={filters.category}
          onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
        >
          {Object.entries(categoryMap).map(([k, v]) => (
            <Select.Option key={k} value={k}>{v.label}</Select.Option>
          ))}
        </Select>
        <RangePicker
          value={filters.dateRange}
          onChange={(v) => setFilters((f) => ({ ...f, dateRange: v }))}
        />
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ ...pagination, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        onChange={handleTableChange}
      />
      <Modal title="订单详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={700}>
        {current && (
          <>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="订单号">{current.orderNo}</Descriptions.Item>
              <Descriptions.Item label="用户手机号">{current.userPhone}</Descriptions.Item>
              <Descriptions.Item label="类别">{(categoryMap[current.category] || {}).label || current.category}</Descriptions.Item>
              <Descriptions.Item label="总金额">¥{current.totalAmount}</Descriptions.Item>
              <Descriptions.Item label="状态">{(statusMap[current.status] || {}).label || current.status}</Descriptions.Item>
              <Descriptions.Item label="城市">{current.city}</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>{current.createdAt ? dayjs(current.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
            </Descriptions>
            {current.subOrders && current.subOrders.length > 0 && (
              <>
                <h4>子订单</h4>
                <Table
                  rowKey="id"
                  size="small"
                  pagination={false}
                  dataSource={current.subOrders}
                  columns={[
                    { title: '商品名称', dataIndex: 'productName' },
                    { title: '服务商', dataIndex: 'providerName' },
                    { title: '金额', dataIndex: 'amount', render: (v) => `¥${v}` },
                    { title: '状态', dataIndex: 'status', render: (v) => { const s = statusMap[v] || { label: v, color: 'default' }; return <Tag color={s.color}>{s.label}</Tag>; } },
                  ]}
                />
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
