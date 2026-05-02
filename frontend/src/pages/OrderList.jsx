import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Select, Input, Card, message, Popconfirm, Statistic, Row, Col } from 'antd';
import { PlusOutlined, EyeOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orderApi, reportApi } from '../services/api';
import { STATUS_NAMES, STATUS_COLORS, ORDER_STATUS } from '../utils/constants';
import dayjs from 'dayjs';

const { Search } = Input;

const OrderList = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await orderApi.getList({
        ...filters,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      if (response.data.success) {
        const result = response.data.data;
        setData(result.data || []);
        setPagination({
          current: result.page,
          pageSize: result.pageSize,
          total: result.total,
        });
      }
    } catch (error) {
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await reportApi.getOverview();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [pagination.current, pagination.pageSize, filters]);

  const handleStatusChange = (value) => {
    setFilters(prev => ({ ...prev, status: value || undefined }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, order_no: value || undefined }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleCancel = async (id) => {
    try {
      const response = await orderApi.cancel(id, {});
      if (response.data.success) {
        message.success('订单已取消');
        fetchData();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '取消失败');
    }
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
    },
    {
      title: '起点',
      dataIndex: 'origin_address',
      key: 'origin_address',
      ellipsis: true,
    },
    {
      title: '终点',
      dataIndex: 'dest_address',
      key: 'dest_address',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {STATUS_NAMES[status] || status}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/orders/${record.id}`)}
          >
            详情
          </Button>
          {record.status !== ORDER_STATUS.ARRIVED && record.status !== ORDER_STATUS.CANCELLED && (
            <Popconfirm
              title="确定要取消这个订单吗？"
              onConfirm={() => handleCancel(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                取消
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: ORDER_STATUS.PENDING_LOCATION, label: STATUS_NAMES[ORDER_STATUS.PENDING_LOCATION] },
    { value: ORDER_STATUS.PENDING_ROUTE_PLAN, label: STATUS_NAMES[ORDER_STATUS.PENDING_ROUTE_PLAN] },
    { value: ORDER_STATUS.NAVIGATING, label: STATUS_NAMES[ORDER_STATUS.NAVIGATING] },
    { value: ORDER_STATUS.PENDING_TRACK_RECORD, label: STATUS_NAMES[ORDER_STATUS.PENDING_TRACK_RECORD] },
    { value: ORDER_STATUS.ARRIVED, label: STATUS_NAMES[ORDER_STATUS.ARRIVED] },
    { value: ORDER_STATUS.CANCELLED, label: STATUS_NAMES[ORDER_STATUS.CANCELLED] },
    { value: ORDER_STATUS.EXCEPTION, label: STATUS_NAMES[ORDER_STATUS.EXCEPTION] },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="总订单数"
              value={stats?.total || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="待处理"
              value={stats?.pending || 0}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已完成"
              value={stats?.completed || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="异常单"
              value={stats?.exception || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="订单列表"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/create')}
          >
            创建订单
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <Select
            style={{ width: 150 }}
            placeholder="选择状态"
            value={filters.status || undefined}
            onChange={handleStatusChange}
            options={statusOptions}
            allowClear
          />
          <Search
            placeholder="搜索订单号"
            style={{ width: 200 }}
            onSearch={handleSearch}
            enterButton
          />
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            刷新
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPagination({ current: page, pageSize, total: pagination.total });
            },
            onShowSizeChange: (current, size) => {
              setPagination({ current: 1, pageSize: size, total: pagination.total });
            },
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default OrderList;
