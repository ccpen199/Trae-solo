import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Row,
  Col,
  DatePicker,
  message,
  Avatar,
  Tooltip,
  Typography
} from 'antd';

const { Text } = Typography;
import {
  SearchOutlined,
  EyeOutlined,
  ToolOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  UserOutlined
} from '@ant-design/icons';
import { getOrders, updateOrderStatus, assignEngineer } from '../services/orderService';
import useStore from '../store/useStore';
import dayjs from 'dayjs';

const { Option } = Select;

const OrderListPage = () => {
  const { setCurrentView, orderStatusMap } = useStore();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadOrders();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await getOrders({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters
      });
      setOrders(res.data.list || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      message.error('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (id) => {
    useStore.getState().selectedOrderId = id;
    setCurrentView('order-detail');
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateOrderStatus(id, { status: newStatus });
      message.success('状态更新成功');
      loadOrders();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const columns = [
    {
      title: '订单信息',
      key: 'order',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Tag color="blue">{record.order_no}</Tag>
            <Text strong>{record.device_model}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.fault_description}
          </Text>
        </Space>
      )
    },
    {
      title: '用户信息',
      key: 'user',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text>{record.user_name}</Text>
          </Space>
          <Space size="small" style={{ fontSize: 12 }}>
            <PhoneOutlined />
            <Text type="secondary">{record.user_phone}</Text>
          </Space>
        </Space>
      )
    },
    {
      title: '地址',
      dataIndex: 'user_address',
      key: 'address',
      ellipsis: true,
      render: (text) => (
        <Space size="small">
          <EnvironmentOutlined />
          <Tooltip title={text}>
            <span>{text}</span>
          </Tooltip>
        </Space>
      )
    },
    {
      title: '工程师',
      key: 'engineer',
      render: (_, record) => record.Engineer ? (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{record.Engineer.name}</Text>
        </Space>
      ) : <Text type="secondary">未指派</Text>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const s = orderStatusMap[status] || { text: '未知', color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      }
    },
    {
      title: '费用',
      dataIndex: 'total_cost',
      key: 'cost',
      render: (cost) => <Text strong style={{ color: '#faad14' }}>¥{cost || 0}</Text>
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            详情
          </Button>
          {record.status === 0 && (
            <Button
              type="link"
              size="small"
              onClick={() => handleStatusChange(record.id, 1)}
            >
              接单
            </Button>
          )}
        </Space>
      )
    }
  ];

  const handleSearch = () => {
    setPagination(p => ({ ...p, current: 1 }));
  };

  return (
    <Card title="订单管理">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card size="small">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8} md={6}>
              <Input
                placeholder="搜索订单号/用户"
                prefix={<SearchOutlined />}
                onChange={(e) => setFilters(f => ({ ...f, keyword: e.target.value }))}
                onPressEnter={handleSearch}
              />
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Select
                placeholder="订单状态"
                style={{ width: '100%' }}
                allowClear
                onChange={(v) => setFilters(f => ({ ...f, status: v }))}
              >
                {Object.entries(orderStatusMap).map(([key, val]) => (
                  <Option key={key} value={parseInt(key)}>{val.text}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={8} md={4}>
              <DatePicker
                style={{ width: '100%' }}
                onChange={(date) => setFilters(f => ({ ...f, date: date?.format('YYYY-MM-DD') }))}
              />
            </Col>
            <Col xs={24} sm={24} md={10}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  搜索
                </Button>
                <Button onClick={() => { setFilters({}); handleSearch(); }}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize })
          }}
        />
      </Space>
    </Card>
  );
};

export default OrderListPage;
