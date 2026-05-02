import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Card, Select, Input, Typography, Popconfirm, message } from 'antd';
import { EditOutlined, EyeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../utils/api';
import { useAuthStore } from '../store/useStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;

const STATUS_COLORS = {
  pending_upload: 'default',
  pending_edit: 'processing',
  pending_template: 'warning',
  pending_export: 'orange',
  published: 'success',
  cancelled: 'default',
  rejected: 'error'
};

const STATUS_NAMES = {
  pending_upload: '待上传',
  pending_edit: '待编辑',
  pending_template: '待套模板',
  pending_export: '待导出',
  published: '已发布',
  cancelled: '已取消',
  rejected: '已驳回'
};

function OrderList() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState(null);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) {
        params.status = statusFilter;
      }
      const response = await orderApi.list(params);
      setOrders(response.data);
    } catch (error) {
      console.error('加载订单失败:', error);
      message.error('加载订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchText) return true;
    const text = searchText.toLowerCase();
    return (
      order.order_no?.toLowerCase().includes(text) ||
      order.canvas_name?.toLowerCase().includes(text) ||
      order.creator_name?.toLowerCase().includes(text) ||
      order.assignee_name?.toLowerCase().includes(text)
    );
  });

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (text) => <Text strong style={{ color: '#1890ff' }}>{text}</Text>,
      width: 180
    },
    {
      title: '画布名称',
      dataIndex: 'canvas_name',
      key: 'canvas_name',
      width: 180
    },
    {
      title: '画布尺寸',
      key: 'size',
      width: 120,
      render: (_, record) => (
        <Text type="secondary">
          {record.canvas_width} x {record.canvas_height}
        </Text>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={STATUS_COLORS[status]}>
          {STATUS_NAMES[status]}
        </Tag>
      )
    },
    {
      title: '创建人',
      dataIndex: 'creator_name',
      key: 'creator_name',
      width: 100
    },
    {
      title: '负责人',
      dataIndex: 'assignee_name',
      key: 'assignee_name',
      width: 100
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 160,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/orders/${record.id}`)}
          >
            详情
          </Button>
          {['pending_upload', 'pending_edit', 'pending_template', 'pending_export'].includes(record.status) && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/orders/${record.id}/edit`)}
            >
              编辑
            </Button>
          )}
        </Space>
      )
    }
  ];

  const statusOptions = [
    { value: null, label: '全部状态' },
    ...Object.entries(STATUS_NAMES).map(([value, label]) => ({
      value,
      label
    }))
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>订单管理</Title>
        {(user?.role === 'design_operation' || user?.role === 'merchant' || user?.role === 'admin') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/orders/create')}
          >
            新建订单
          </Button>
        )}
      </div>

      <Card>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <Select
            style={{ width: 180 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            placeholder="选择状态"
            allowClear
          />
          <Search
            placeholder="搜索订单号/画布名称"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 320 }}
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button onClick={loadOrders}>刷新</Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          scroll={{ x: 1400 }}
        />
      </Card>
    </div>
  );
}

export default OrderList;
