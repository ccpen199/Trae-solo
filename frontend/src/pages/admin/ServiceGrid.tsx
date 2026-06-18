import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Input,
  InputNumber,
  Select,
  Modal,
  Form,
  message,
  Spin,
  Table,
  Progress,
  Empty,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  ThunderboltOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  GlobalOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { adminApi } from '../../api';
import type { ServiceGrid as ServiceGridType } from '../../types';

const { Option } = Select;

interface EditableState {
  [key: string]: {
    worker_capacity?: number;
    min_rating?: number;
    max_orders_per_day?: number;
  };
}

export default function ServiceGrid() {
  const [loading, setLoading] = useState(false);
  const [grids, setGrids] = useState<ServiceGridType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [filterCity, setFilterCity] = useState<string | undefined>(undefined);
  const [cityOptions, setCityOptions] = useState<string[]>([]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm] = Form.useForm();

  const [editing, setEditing] = useState<EditableState>({});
  const [editLoading, setEditLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchGrids();
  }, [page, pageSize, filterCity]);

  const fetchGrids = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize,
      };
      if (filterCity) {
        params.city = filterCity;
      }
      const result = await adminApi.serviceGrids(params);
      const list = result.list || [];
      setGrids(list);
      setTotal(result.total || 0);
      const cities = Array.from(new Set(list.map((g: ServiceGridType) => g.city))) as string[];
      setCityOptions(cities);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGrid = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateLoading(true);
      await adminApi.createGrid(values);
      message.success('服务网格创建成功');
      setCreateModalOpen(false);
      createForm.resetFields();
      setPage(1);
      setTimeout(() => fetchGrids(), 0);
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      console.error(error);
    } finally {
      setCreateLoading(false);
    }
  };

  const startEditing = (id: string, field: string, currentValue: number) => {
    setEditing((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: currentValue,
      },
    }));
  };

  const updateEditValue = (id: string, field: string, value: number | null) => {
    if (value === null || value === undefined) return;
    setEditing((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const cancelEditing = (id: string) => {
    setEditing((prev) => {
      const newEdit = { ...prev };
      delete newEdit[id];
      return newEdit;
    });
  };

  const saveEdit = async (grid: ServiceGridType) => {
    const editData = editing[grid.id];
    if (!editData) return;

    setEditLoading(grid.id);
    try {
      const updateData: any = {};
      if (editData.worker_capacity !== undefined) {
        updateData.worker_capacity = editData.worker_capacity;
      }
      if (editData.min_rating !== undefined) {
        updateData.min_rating = editData.min_rating;
      }
      if (editData.max_orders_per_day !== undefined) {
        updateData.max_orders_per_day = editData.max_orders_per_day;
      }
      await adminApi.updateGrid(grid.id, updateData);
      message.success('更新成功');
      cancelEditing(grid.id);
      fetchGrids();
    } catch (error) {
      console.error(error);
    } finally {
      setEditLoading(null);
    }
  };

  const renderEditableCell = (
    grid: ServiceGridType,
    field: 'worker_capacity' | 'min_rating' | 'max_orders_per_day',
    min: number,
    max: number,
    step: number,
    formatter?: (val: number) => string
  ) => {
    const isEditing = editing[grid.id]?.[field] !== undefined;
    const currentValue = editing[grid.id]?.[field] ?? (grid as any)[field];

    if (isEditing) {
      return (
        <Space size={4}>
          <InputNumber
            size="small"
            min={min}
            max={max}
            step={step}
            value={currentValue}
            onChange={(val) => updateEditValue(grid.id, field, val)}
            style={{ width: 90 }}
          />
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            loading={editLoading === grid.id}
            onClick={() => saveEdit(grid)}
          />
          <Button
            size="small"
            icon={<CloseOutlined />}
            onClick={() => cancelEditing(grid.id)}
            disabled={editLoading === grid.id}
          />
        </Space>
      );
    }

    return (
      <Space>
        <span style={{ fontWeight: 500 }}>
          {formatter ? formatter((grid as any)[field]) : (grid as any)[field]}
        </span>
        <Tooltip title="点击编辑">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => startEditing(grid.id, field, (grid as any)[field])}
          />
        </Tooltip>
      </Space>
    );
  };

  const renderCapacityCell = (grid: ServiceGridType) => {
    const isEditing = editing[grid.id]?.worker_capacity !== undefined;
    if (isEditing) {
      return renderEditableCell(grid, 'worker_capacity', 1, 10000, 1);
    }

    const capacity = grid.worker_capacity;
    const actual = grid.actual_workers ?? grid.current_workers ?? 0;
    const percent = capacity > 0 ? Math.min(100, Math.round((actual / capacity) * 100)) : 0;
    const color = percent >= 90 ? '#f5222d' : percent >= 70 ? '#fa8c16' : '#52c41a';

    return (
      <div style={{ minWidth: 200 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <Space>
            <span style={{ fontSize: 13 }}>
              <TeamOutlined style={{ color: '#52c41a', marginRight: 4 }} />
              <span style={{ color: '#52c41a', fontWeight: 600 }}>{actual}</span>
            </span>
            <span style={{ color: '#999' }}>/</span>
            <Space>
              <span style={{ fontSize: 13 }}>
                <span style={{ fontWeight: 500 }}>{capacity}</span>
              </span>
              <Tooltip title="点击编辑容量">
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => startEditing(grid.id, 'worker_capacity', capacity)}
                />
              </Tooltip>
            </Space>
          </Space>
          <Tag color={percent >= 90 ? 'red' : percent >= 70 ? 'orange' : 'green'} style={{ margin: 0 }}>
            {percent}%
          </Tag>
        </div>
        <Progress
          percent={percent}
          strokeColor={color}
          showInfo={false}
          size="small"
        />
      </div>
    );
  };

  const columns = [
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 130,
      fixed: 'left' as const,
      render: (text: string) => (
        <Space>
          <GlobalOutlined style={{ color: '#1677ff' }} />
          <Tag color="blue" style={{ margin: 0 }}>{text || '-'}</Tag>
        </Space>
      ),
    },
    {
      title: '区域',
      dataIndex: 'district',
      key: 'district',
      width: 130,
      render: (text: string) => (
        <Space>
          <ApartmentOutlined style={{ color: '#722ed1' }} />
          <span style={{ fontWeight: 500 }}>{text || '-'}</span>
        </Space>
      ),
    },
    {
      title: '阿姨容量 / 在网阿姨',
      key: 'capacity',
      width: 260,
      render: (_: any, record: ServiceGridType) => renderCapacityCell(record),
    },
    {
      title: '订单需求',
      dataIndex: 'order_demand',
      key: 'order_demand',
      width: 130,
      align: 'right' as const,
      sorter: (a: ServiceGridType, b: ServiceGridType) => a.order_demand - b.order_demand,
      render: (val: number) => (
        <Space>
          <ShoppingCartOutlined style={{ color: '#13c2c2' }} />
          <span style={{ fontWeight: 600, color: '#13c2c2' }}>{val || 0}</span>
        </Space>
      ),
    },
    {
      title: '最低评分门槛',
      key: 'min_rating',
      width: 180,
      render: (_: any, record: ServiceGridType) =>
        renderEditableCell(record, 'min_rating', 0, 5, 0.1, (v) => `${v.toFixed(1)} ⭐`),
    },
    {
      title: '每日最大单量',
      key: 'max_orders_per_day',
      width: 180,
      render: (_: any, record: ServiceGridType) =>
        renderEditableCell(record, 'max_orders_per_day', 1, 1000, 1, (v) => `${v} 单/日`),
    },
  ];

  return (
    <div className="page-container">
      <Card
        className="card-hover"
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: 0 }}
        title={
          <Space>
            <EnvironmentOutlined style={{ color: '#1677ff', fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>服务网格管理</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchGrids()}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
            >
              新增网格
            </Button>
          </Space>
        }
      >
        <div style={{ padding: 16 }}>
          <Card
            size="small"
            className="card-hover"
            style={{ marginBottom: 16 }}
            bodyStyle={{ padding: 12 }}
          >
            <Row gutter={16} align="middle">
              <Col xs={24} sm={12}>
                <Space>
                  <span style={{ color: '#666' }}>城市筛选：</span>
                  <Select
                    placeholder="全部城市"
                    allowClear
                    style={{ width: 180 }}
                    showSearch
                    value={filterCity}
                    onChange={(val) => {
                      setFilterCity(val);
                      setPage(1);
                    }}
                  >
                    {cityOptions.map((city) => (
                      <Option key={city} value={city}>
                        {city}
                      </Option>
                    ))}
                  </Select>
                </Space>
              </Col>
            </Row>
          </Card>

          <Spin spinning={loading}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={grids}
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
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无服务网格数据"
                  />
                ),
              }}
              scroll={{ x: 1100 }}
            />
          </Spin>
        </div>
      </Card>

      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#1677ff' }} />
            <span>新增服务网格</span>
          </Space>
        }
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
        }}
        onOk={handleCreateGrid}
        confirmLoading={createLoading}
        okText="创建网格"
        cancelText="取消"
        width={560}
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{
            worker_capacity: 50,
            order_demand: 30,
            min_rating: 3.5,
            max_orders_per_day: 20,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="city"
                label="城市"
                rules={[{ required: true, message: '请输入城市' }]}
              >
                <Input
                  placeholder="如：上海"
                  prefix={<GlobalOutlined style={{ color: '#999' }} />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="district"
                label="区域"
                rules={[{ required: true, message: '请输入区域' }]}
              >
                <Input
                  placeholder="如：浦东新区"
                  prefix={<ApartmentOutlined style={{ color: '#999' }} />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="worker_capacity"
                label="阿姨容量"
                rules={[{ required: true, message: '请输入阿姨容量' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={10000}
                  step={1}
                  placeholder="50"
                  addonAfter={<TeamOutlined style={{ color: '#999' }} />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="order_demand"
                label="订单需求"
                rules={[{ required: true, message: '请输入订单需求' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={10000}
                  step={1}
                  placeholder="30"
                  addonAfter={<ShoppingCartOutlined style={{ color: '#999' }} />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="min_rating"
                label="最低评分门槛"
                rules={[{ required: true, message: '请输入最低评分' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={5}
                  step={0.1}
                  placeholder="3.5"
                  addonAfter={<StarOutlined style={{ color: '#fa8c16' }} />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="max_orders_per_day"
                label="每日最大单量"
                rules={[{ required: true, message: '请输入每日最大单量' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={1000}
                  step={1}
                  placeholder="20"
                  addonAfter={<ThunderboltOutlined style={{ color: '#999' }} />}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
