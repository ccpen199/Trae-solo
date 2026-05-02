import React from 'react';
import { Card, Table, Tag, Button, Space, Input, Select, DatePicker, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../api';
import { STATUS_NAMES, STATUS_COLORS, STEP_NAMES, ORDER_TYPE_NAMES } from '../utils/constants';
import dayjs from 'dayjs';

const { Search } = Input;
const { RangePicker } = DatePicker;

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [pagination, setPagination] = React.useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = React.useState({
    status: undefined,
    currentStep: undefined,
    type: undefined,
  });

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderApi.getList({
        ...filters,
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
      });
      setOrders(res.data);
      setPagination((prev) => ({ ...prev, total: res.data.length }));
    } catch (error) {
      console.error('获取工单列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.current, pagination.pageSize]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const columns = [
    {
      title: '工单编号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
      fixed: 'left',
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => ORDER_TYPE_NAMES[type] || type,
    },
    {
      title: '当前步骤',
      dataIndex: 'current_step',
      key: 'current_step',
      width: 120,
      render: (step) => (
        <Tag color="blue">{STEP_NAMES[step] || step}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {STATUS_NAMES[status] || status}
        </Tag>
      ),
    },
    {
      title: '发起人',
      dataIndex: 'initiator_name',
      key: 'initiator_name',
      width: 100,
    },
    {
      title: '当前负责人',
      dataIndex: 'current_owner_name',
      key: 'current_owner_name',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/orders/${record.id}`)}>
          查看详情
        </Button>
      ),
    },
  ];

  const statusOptions = Object.entries(STATUS_NAMES).map(([key, value]) => ({
    label: value,
    value: key,
  }));

  const stepOptions = Object.entries(STEP_NAMES).map(([key, value]) => ({
    label: value,
    value: key,
  }));

  const typeOptions = Object.entries(ORDER_TYPE_NAMES).map(([key, value]) => ({
    label: value,
    value: key,
  }));

  return (
    <div>
      <div className="page-title">工单管理</div>

      <Card className="page-card">
        <div className="search-box" style={{ marginBottom: 16 }}>
          <Row gutter={16} style={{ width: '100%' }}>
            <Col span={6}>
              <Select
                placeholder="选择状态"
                allowClear
                style={{ width: '100%' }}
                options={statusOptions}
                value={filters.status}
                onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="选择步骤"
                allowClear
                style={{ width: '100%' }}
                options={stepOptions}
                value={filters.currentStep}
                onChange={(value) => setFilters((prev) => ({ ...prev, currentStep: value }))}
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="选择类型"
                allowClear
                style={{ width: '100%' }}
                options={typeOptions}
                value={filters.type}
                onChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
              />
            </Col>
            <Col span={6}>
              <Space>
                <Button
                  type="primary"
                  onClick={() => {
                    setPagination((prev) => ({ ...prev, current: 1 }));
                    fetchOrders();
                  }}
                >
                  搜索
                </Button>
                <Button
                  onClick={() => {
                    setFilters({ status: undefined, currentStep: undefined, type: undefined });
                    setPagination((prev) => ({ ...prev, current: 1 }));
                  }}
                >
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) =>
              setPagination((prev) => ({ ...prev, current: page, pageSize })),
          }}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div>暂无工单数据</div>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default OrderList;
