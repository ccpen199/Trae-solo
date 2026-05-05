import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  Modal,
  Form,
  Row,
  Col,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { orderApi, configApi } from '../services/api';

const { Option } = Select;
const { RangePicker } = DatePicker;

const Orders: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<any>({});
  const [dcList, setDcList] = useState<any[]>([]);
  const [warehouseList, setWarehouseList] = useState<any[]>([]);
  const [selectedDcId, setSelectedDcId] = useState<string>('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDistributionCenters();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [page, pageSize, filters]);

  const fetchDistributionCenters = async () => {
    try {
      const response = await configApi.getDistributionCenters();
      setDcList(response.data.data);
    } catch (error) {
      console.error('Failed to fetch distribution centers');
    }
  };

  const fetchWarehouses = async (dcId: string) => {
    if (!dcId) {
      setWarehouseList([]);
      return;
    }
    try {
      const response = await configApi.getWarehouses(dcId);
      setWarehouseList(response.data.data);
    } catch (error) {
      console.error('Failed to fetch warehouses');
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize,
        ...filters,
      };
      const response = await orderApi.getOrders(params);
      const { orders, total: totalCount } = response.data.data;
      setData(orders);
      setTotal(totalCount);
    } catch (error: any) {
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDcChange = (dcId: string) => {
    setSelectedDcId(dcId);
    fetchWarehouses(dcId);
  };

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  const handleReset = () => {
    setFilters({});
    setSelectedDcId('');
    setWarehouseList([]);
    setPage(1);
  };

  const handleEntryCheck = async (orderNo: string) => {
    try {
      const response = await orderApi.entryCheck(orderNo);
      const { eligible, reason } = response.data.data;
      message.success(`订单 ${orderNo} ${eligible ? '准入通过' : `准入拒绝: ${reason}`}`);
      fetchOrders();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '准入检查失败');
    }
  };

  const handleCreateOrder = async () => {
    try {
      const values = await form.validateFields();
      const orderData = {
        ...values,
        orderType: values.orderType,
        distributionCenterId: values.distributionCenterId,
        warehouseId: values.warehouseId,
      };
      await orderApi.createOrder(orderData);
      message.success('订单创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      fetchOrders();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '创建订单失败');
    }
  };

  const orderTypeMap: Record<string, string> = {
    SMALL_MEDIUM: '中小件',
    BULK: '大宗',
    SELF_PICKUP: '自提',
  };

  const orderStatusMap: Record<string, string> = {
    PENDING_ENTRY: '待准入',
    ENTRY_REJECTED: '准入拒绝',
    WAITING_SCHEDULE: '待调度',
    SCHEDULING: '调度中',
    SCHEDULED: '已调度',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    REJECTED: '已拒绝',
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      fixed: 'left' as const,
      width: 180,
    },
    {
      title: '订单类型',
      dataIndex: 'orderType',
      key: 'orderType',
      width: 100,
      render: (val: string) => orderTypeMap[val] || val,
    },
    {
      title: '订单状态',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      width: 100,
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          PENDING_ENTRY: 'default',
          ENTRY_REJECTED: 'red',
          WAITING_SCHEDULE: 'blue',
          SCHEDULING: 'processing',
          SCHEDULED: 'success',
          COMPLETED: 'success',
          CANCELLED: 'default',
          REJECTED: 'red',
        };
        return <Tag color={colorMap[val] || 'default'}>{orderStatusMap[val] || val}</Tag>;
      },
    },
    {
      title: '收货人',
      dataIndex: 'receiverName',
      key: 'receiverName',
      width: 100,
    },
    {
      title: '手机号',
      dataIndex: 'receiverPhone',
      key: 'receiverPhone',
      width: 120,
    },
    {
      title: '件数',
      dataIndex: 'pieceCount',
      key: 'pieceCount',
      width: 80,
    },
    {
      title: '体积(m³)',
      dataIndex: 'volume',
      key: 'volume',
      width: 100,
    },
    {
      title: '重量(kg)',
      dataIndex: 'weight',
      key: 'weight',
      width: 100,
    },
    {
      title: '自提',
      dataIndex: 'isSelfPickup',
      key: 'isSelfPickup',
      width: 80,
      render: (val: boolean) => (val ? <Tag color="orange">是</Tag> : <Tag>否</Tag>),
    },
    {
      title: '当日时效',
      dataIndex: 'isSameDayDelivery',
      key: 'isSameDayDelivery',
      width: 80,
      render: (val: boolean) => (val ? <Tag color="orange">是</Tag> : <Tag>否</Tag>),
    },
    {
      title: '时效已算',
      dataIndex: 'hasTimingCalculated',
      key: 'hasTimingCalculated',
      width: 80,
      render: (val: boolean) => (val ? <Tag color="green">是</Tag> : <Tag color="red">否</Tag>),
    },
    {
      title: '预约一致',
      dataIndex: 'appointmentConsistent',
      key: 'appointmentConsistent',
      width: 80,
      render: (val: boolean) => (val ? <Tag color="green">是</Tag> : <Tag color="red">否</Tag>),
    },
    {
      title: '准入检查结果',
      dataIndex: 'entryCheckResult',
      key: 'entryCheckResult',
      width: 150,
      render: (val: string) => val || '未检查',
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
      fixed: 'right' as const,
      width: 120,
      render: (_: any, record: any) => (
        <Space>
          {record.orderStatus === 'PENDING_ENTRY' && (
            <Button
              type="link"
              size="small"
              onClick={() => handleEntryCheck(record.orderNo)}
            >
              <CheckCircleOutlined /> 准入检查
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const pagination = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number) => `共 ${total} 条`,
    onChange: (p: number, ps: number) => {
      setPage(p);
      setPageSize(ps);
    },
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">订单管理</h2>
      </div>

      <Card>
        <div className="filter-section">
          <Row gutter={16} align="middle">
            <Col span={5}>
              <div className="filter-item">
                <span className="filter-label">订单号：</span>
                <Input
                  placeholder="请输入订单号"
                  value={filters.orderNo}
                  onChange={(e) => setFilters({ ...filters, orderNo: e.target.value })}
                  style={{ width: 200 }}
                />
              </div>
            </Col>
            <Col span={4}>
              <div className="filter-item">
                <span className="filter-label">订单状态：</span>
                <Select
                  placeholder="请选择"
                  allowClear
                  style={{ width: 150 }}
                  value={filters.orderStatus}
                  onChange={(val) => setFilters({ ...filters, orderStatus: val })}
                >
                  {Object.entries(orderStatusMap).map(([key, label]) => (
                    <Option key={key} value={key}>
                      {label}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col span={4}>
              <div className="filter-item">
                <span className="filter-label">订单类型：</span>
                <Select
                  placeholder="请选择"
                  allowClear
                  style={{ width: 150 }}
                  value={filters.orderType}
                  onChange={(val) => setFilters({ ...filters, orderType: val })}
                >
                  {Object.entries(orderTypeMap).map(([key, label]) => (
                    <Option key={key} value={key}>
                      {label}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col span={4}>
              <div className="filter-item">
                <span className="filter-label">配送中心：</span>
                <Select
                  placeholder="请选择"
                  allowClear
                  style={{ width: 150 }}
                  value={filters.distributionCenterId}
                  onChange={(val) => {
                    setFilters({ ...filters, distributionCenterId: val, warehouseId: undefined });
                    handleDcChange(val);
                  }}
                >
                  {dcList.map((dc) => (
                    <Option key={dc.id} value={dc.id}>
                      {dc.name}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col span={4}>
              <div className="filter-item">
                <span className="filter-label">库房：</span>
                <Select
                  placeholder="请选择"
                  allowClear
                  style={{ width: 150 }}
                  value={filters.warehouseId}
                  onChange={(val) => setFilters({ ...filters, warehouseId: val })}
                  disabled={!selectedDcId}
                >
                  {warehouseList.map((wh) => (
                    <Option key={wh.id} value={wh.id}>
                      {wh.name}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col span={3} style={{ textAlign: 'right' }}>
              <Space>
                <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            新建订单
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          scroll={{ x: 2200 }}
        />
      </Card>

      <Modal
        title="新建订单"
        open={createModalVisible}
        onOk={handleCreateOrder}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="orderNo"
                label="订单号"
                rules={[{ required: true, message: '请输入订单号' }]}
              >
                <Input placeholder="请输入订单号，如：ORD-2026-00001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="orderType"
                label="订单类型"
                rules={[{ required: true, message: '请选择订单类型' }]}
              >
                <Select placeholder="请选择">
                  <Option value="SMALL_MEDIUM">中小件</Option>
                  <Option value="BULK">大宗</Option>
                  <Option value="SELF_PICKUP">自提</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="distributionCenterId" label="配送中心">
                <Select
                  placeholder="请选择配送中心"
                  allowClear
                  onChange={(val) => {
                    form.setFieldValue('warehouseId', undefined);
                    handleDcChange(val);
                  }}
                >
                  {dcList.map((dc) => (
                    <Option key={dc.id} value={dc.id}>
                      {dc.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="warehouseId" label="库房">
                <Select
                  placeholder="请选择库房"
                  allowClear
                  disabled={!selectedDcId}
                >
                  {warehouseList.map((wh) => (
                    <Option key={wh.id} value={wh.id}>
                      {wh.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="receiverName" label="收货人">
                <Input placeholder="请输入收货人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="receiverPhone" label="手机号">
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="receiverFixedPhone" label="固定电话">
                <Input placeholder="请输入固定电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="appointmentCalendar" label="预约日历">
                <Input placeholder="请输入预约日期，如：2026-05-05" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="pieceCount" label="件数">
                <Input type="number" placeholder="请输入件数" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="volume" label="体积(m³)">
                <Input type="number" placeholder="请输入体积" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="weight" label="重量(kg)">
                <Input type="number" placeholder="请输入重量" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="isSelfPickup" valuePropName="checked" label="自提订单">
                <Select placeholder="请选择">
                  <Option value={true}>是</Option>
                  <Option value={false}>否</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isSameDayDelivery" valuePropName="checked" label="当日时效">
                <Select placeholder="请选择">
                  <Option value={true}>是</Option>
                  <Option value={false}>否</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="hasTimingCalculated" valuePropName="checked" label="时效已算">
                <Select placeholder="请选择">
                  <Option value={true}>是</Option>
                  <Option value={false}>否</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="appointmentConsistent" valuePropName="checked" label="预约一致">
                <Select placeholder="请选择">
                  <Option value={true}>是</Option>
                  <Option value={false}>否</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Orders;
