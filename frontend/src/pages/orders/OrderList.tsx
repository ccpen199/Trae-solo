import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Table,
  Card,
  Tag,
  Space,
  Modal,
  message,
  Row,
  Col,
  Progress,
  Rate,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  SendOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  SolutionOutlined,
  StarOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orderApi, workerApi } from '../../api';
import {
  Order,
  OrderStatus,
  OrderMode,
  WorkerRole,
  OrderStatusMap,
  OrderStatusColor,
  OrderModeMap,
  WorkerRoleMap,
  GrabRecord,
  Worker,
} from '../../types';

const { Option } = Select;

export default function OrderList() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<any>({});
  const [searchForm] = Form.useForm();
  const navigate = useNavigate();

  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [workerList, setWorkerList] = useState<Worker[]>([]);

  const [grabOpen, setGrabOpen] = useState(false);
  const [grabRecords, setGrabRecords] = useState<GrabRecord[]>([]);
  const [grabAcceptLoading, setGrabAcceptLoading] = useState(false);
  const [currentGrabOrderId, setCurrentGrabOrderId] = useState<string>('');

  useEffect(() => {
    fetchList();
  }, [page, pageSize, filters]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize,
        ...filters,
      };
      const result = await orderApi.list(params);
      setList(result.list || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values: any) => {
    const cleanedFilters: any = {};
    Object.keys(values).forEach((key) => {
      if (values[key] !== undefined && values[key] !== '' && values[key] !== null) {
        cleanedFilters[key] = values[key];
      }
    });
    setFilters(cleanedFilters);
    setPage(1);
    setTimeout(() => fetchList(), 0);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setFilters({});
    setPage(1);
    setTimeout(() => fetchList(), 0);
  };

  const openDispatchModal = async (orderId: string) => {
    setCurrentOrderId(orderId);
    setSelectedWorkerId('');
    setDispatchOpen(true);
    try {
      const result = await workerApi.list({ pageSize: 100 });
      setWorkerList(result.list || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDispatch = async () => {
    if (!selectedWorkerId) {
      message.warning('请选择派单阿姨');
      return;
    }
    setDispatchLoading(true);
    try {
      await orderApi.accept(currentOrderId, selectedWorkerId);
      message.success('派单成功');
      setDispatchOpen(false);
      fetchList();
    } catch (error) {
      console.error(error);
    } finally {
      setDispatchLoading(false);
    }
  };

  const openGrabModal = async (orderId: string) => {
    setCurrentGrabOrderId(orderId);
    setGrabOpen(true);
    try {
      const result = await orderApi.detail(orderId);
      setGrabRecords(result.grab_records || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleGrabAccept = async (record: GrabRecord) => {
    Modal.confirm({
      title: '确认接单',
      content: `确定将订单派给 ${record.worker_name} 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        setGrabAcceptLoading(true);
        try {
          await orderApi.accept(currentGrabOrderId, record.worker_id);
          message.success('接单成功');
          setGrabOpen(false);
          fetchList();
        } catch (error) {
          console.error(error);
        } finally {
          setGrabAcceptLoading(false);
        }
      },
    });
  };

  const handleCheckin = async (record: Order) => {
    Modal.confirm({
      title: '打卡确认',
      content: (
        <div>
          <p>模拟GPS定位和人脸识别打卡</p>
          <p style={{ color: '#666', fontSize: 12 }}>
            经度: 121.4737 &nbsp; 纬度: 31.2304
          </p>
          <p style={{ color: '#52c41a', fontSize: 12 }}>人脸识别: 通过 ✓</p>
        </div>
      ),
      okText: '确认打卡',
      cancelText: '取消',
      onOk: async () => {
        try {
          const gps = { lng: 121.4737, lat: 31.2304 };
          await orderApi.checkin(record.id, gps, true);
          message.success('打卡成功');
          fetchList();
        } catch (error) {
          console.error(error);
        }
      },
    });
  };

  const renderActions = (record: Order) => {
    const status = record.status;
    const actions = [];

    if (status === 'pending') {
      if (record.mode === 'dispatch') {
        actions.push(
          <Button
            key="dispatch"
            type="link"
            size="small"
            icon={<SendOutlined />}
            onClick={() => openDispatchModal(record.id)}
          >
            派单
          </Button>
        );
      } else {
        actions.push(
          <Button
            key="grab"
            type="link"
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={() => openGrabModal(record.id)}
          >
            查看抢单
          </Button>
        );
      }
    }

    if (status === 'accepted') {
      actions.push(
        <Button
          key="checkin"
          type="link"
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={() => handleCheckin(record)}
        >
          打卡
        </Button>
      );
    }

    if (status === 'in_progress') {
      actions.push(
        <Button
          key="nodes"
          type="link"
          size="small"
          icon={<SolutionOutlined />}
          onClick={() => navigate(`/orders/${record.id}`)}
        >
          节点
        </Button>
      );
    }

    if (status === 'completed') {
      actions.push(
        <Button
          key="review"
          type="link"
          size="small"
          icon={<StarOutlined />}
          onClick={() => navigate(`/orders/${record.id}`)}
        >
          评价
        </Button>
      );
    }

    actions.push(
      <Button
        key="detail"
        type="link"
        size="small"
        icon={<EyeOutlined />}
        onClick={() => navigate(`/orders/${record.id}`)}
      >
        详情
      </Button>
    );

    return <Space size={0}>{actions}</Space>;
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      width: 130,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', color: '#666', fontSize: 12 }}>
          {text.slice(0, 12)}...
        </span>
      ),
    },
    {
      title: '订单标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text: string, record: Order) => (
        <a
          style={{ cursor: 'pointer', color: '#1677ff' }}
          onClick={() => navigate(`/orders/${record.id}`)}
        >
          {text}
        </a>
      ),
    },
    {
      title: '服务类型',
      dataIndex: 'service_type',
      key: 'service_type',
      width: 100,
      render: (role: WorkerRole) => (
        <Tag color="blue">{WorkerRoleMap[role] || role}</Tag>
      ),
    },
    {
      title: '模式',
      dataIndex: 'mode',
      key: 'mode',
      width: 100,
      render: (mode: OrderMode) => (
        <Tag color={mode === 'grab' ? 'orange' : 'purple'}>
          {mode === 'grab' ? <ThunderboltOutlined /> : <SendOutlined />}
          &nbsp;{OrderModeMap[mode]}
        </Tag>
      ),
    },
    {
      title: '雇主名',
      dataIndex: 'employer_name',
      key: 'employer_name',
      width: 100,
      render: (text: string) => (
        <Space size={4}>
          <UserOutlined style={{ color: '#1677ff' }} />
          <span>{text || '-'}</span>
        </Space>
      ),
    },
    {
      title: '阿姨名',
      dataIndex: 'worker_name',
      key: 'worker_name',
      width: 100,
      render: (text: string) => (
        <Space size={4}>
          <UserOutlined style={{ color: '#52c41a' }} />
          <span>{text || <Tag color="default">未分配</Tag>}</span>
        </Space>
      ),
    },
    {
      title: '预算区间',
      key: 'budget',
      width: 130,
      align: 'center' as const,
      render: (_: any, record: Order) => (
        <span style={{ fontWeight: 500, color: '#fa8c16' }}>
          ¥{record.budget_min} - ¥{record.budget_max}
        </span>
      ),
    },
    {
      title: '服务进度',
      key: 'progress',
      width: 150,
      align: 'center' as const,
      render: (_: any, record: Order) => {
        const completed = record.completed_nodes || 0;
        const total = record.total_nodes || 0;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        return (
          <div style={{ width: 120 }}>
            <Progress
              percent={percent}
              size="small"
              status={percent === 100 ? 'success' : 'active'}
            />
            <div style={{ fontSize: 11, color: '#999' }}>
              {completed}/{total} 节点
            </div>
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: OrderStatus) => (
        <Tag color={OrderStatusColor[status]} style={{ margin: 0 }}>
          {OrderStatusMap[status]}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (text: string) => (
        <Space size={4}>
          <ClockCircleOutlined style={{ color: '#999', fontSize: 12 }} />
          <span style={{ fontSize: 12, color: '#666' }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: Order) => renderActions(record),
    },
  ];

  return (
    <div className="page-container">
      <Card className="filter-card" style={{ marginBottom: 16 }} bodyStyle={{ padding: 20 }}>
        <Form form={searchForm} layout="vertical" onFinish={handleSearch}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="status" label="订单状态">
                <Select placeholder="请选择状态" allowClear>
                  {Object.entries(OrderStatusMap).map(([key, text]) => (
                    <Option key={key} value={key}>
                      {text}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="mode" label="订单模式">
                <Select placeholder="请选择模式" allowClear>
                  {Object.entries(OrderModeMap).map(([key, text]) => (
                    <Option key={key} value={key}>
                      {text}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="service_type" label="服务类型">
                <Select placeholder="请选择服务类型" allowClear>
                  {Object.entries(WorkerRoleMap).map(([key, text]) => (
                    <Option key={key} value={key}>
                      {text}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="city" label="城市">
                <Input placeholder="请输入城市" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={16} lg={18}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="订单标题/雇主/阿姨" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={8} lg={6}>
              <Form.Item label=" " colon={false}>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
                    搜索
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card
        className="table-card"
        bodyStyle={{ padding: 20 }}
        title={<span>订单列表 ({total})</span>}
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title="派单"
        open={dispatchOpen}
        onCancel={() => setDispatchOpen(false)}
        onOk={handleDispatch}
        confirmLoading={dispatchLoading}
        okText="确认派单"
        cancelText="取消"
        width={520}
      >
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontWeight: 500 }}>选择接单阿姨：</span>
        </div>
        <Select
          showSearch
          placeholder="搜索并选择阿姨"
          optionFilterProp="children"
          value={selectedWorkerId}
          onChange={(val) => setSelectedWorkerId(val)}
          style={{ width: '100%' }}
          size="large"
        >
          {workerList.map((worker) => (
            <Option key={worker.id} value={worker.id}>
              <Space>
                <span>{worker.name}</span>
                <Tag color="blue">{WorkerRoleMap[worker.role]}</Tag>
                <Rate disabled allowHalf value={worker.rating} style={{ fontSize: 12 }} />
                <span style={{ color: '#999', fontSize: 12 }}>
                  {worker.rating.toFixed(1)} · {worker.order_count}单
                </span>
              </Space>
            </Option>
          ))}
        </Select>
      </Modal>

      <Modal
        title="抢单列表"
        open={grabOpen}
        onCancel={() => setGrabOpen(false)}
        footer={[
          <Button key="close" onClick={() => setGrabOpen(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {grabRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            暂无抢单记录
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {grabRecords.map((record) => (
              <Card
                key={record.id}
                size="small"
                className="card-hover"
                styles={{ body: { padding: 16 } }}
                style={{
                  borderColor:
                    record.status === 'accepted' ? '#52c41a' : '#e8e8e8',
                  background:
                    record.status === 'accepted' ? '#f6ffed' : 'white',
                }}
                actions={
                  record.status === 'pending'
                    ? [
                        <Button
                          key="accept"
                          type="primary"
                          size="small"
                          loading={grabAcceptLoading}
                          onClick={() => handleGrabAccept(record)}
                        >
                          确认接单
                        </Button>,
                      ]
                    : []
                }
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Space>
                    <UserOutlined style={{ color: '#52c41a' }} />
                    <span style={{ fontWeight: 500, fontSize: 15 }}>
                      {record.worker_name}
                    </span>
                    <Tag color={record.status === 'accepted' ? 'green' : 'orange'}>
                      {record.status === 'accepted' ? '已接单' : '抢单中'}
                    </Tag>
                  </Space>
                  <Space>
                    <Rate disabled allowHalf value={record.worker_rating} style={{ fontSize: 12 }} />
                    <span style={{ color: '#666', fontSize: 12 }}>
                      {record.worker_rating.toFixed(1)}
                    </span>
                  </Space>
                </div>
                <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                  <ClockCircleOutlined /> {record.grab_time}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
