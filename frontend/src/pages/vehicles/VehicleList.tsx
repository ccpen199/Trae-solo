import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Input, Select, Modal, Form, message, Popconfirm, Row, Col, Alert, Empty } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { vehicleApi, storeApi } from '../../services/api';
import { Vehicle, VehicleStatusMap, FuelTypeMap } from '../../types';

const { Option } = Select;

const VehicleList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [stores, setStores] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({ status: '', keyword: '', store_id: '' });
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterStore, setFilterStore] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [pagination.current, pagination.pageSize, searchKeyword, filterStatus, filterStore]);

  const loadStores = async () => {
    try {
      const res = await storeApi.all();
      setStores(res.data || []);
    } catch (err) {
      console.error('加载门店失败', err);
    }
  };

  const loadVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize
      };
      if (searchKeyword) params.keyword = searchKeyword;
      if (filterStatus) params.status = filterStatus;
      if (filterStore) params.store_id = filterStore;

      const res = await vehicleApi.list(params);
      setVehicles(res.data || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error('加载车辆失败', err);
      setError(err?.message || '加载车辆数据失败');
      message.error('加载车辆数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    form.setFieldsValue(vehicle);
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingVehicle) {
        await vehicleApi.update(editingVehicle.id, values);
        message.success('更新成功');
      } else {
        await vehicleApi.create(values);
        message.success('添加成功');
      }
      setModalVisible(false);
      loadVehicles();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await vehicleApi.updateStatus(id, status);
      message.success('状态更新成功');
      loadVehicles();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '车牌号', dataIndex: 'plate_number', key: 'plate_number' },
    { title: '品牌', dataIndex: 'brand', key: 'brand' },
    { title: '车型', dataIndex: 'model', key: 'model' },
    { title: '颜色', dataIndex: 'color', key: 'color' },
    { title: '燃油类型', dataIndex: 'fuel_type', key: 'fuel_type', render: (t: string) => FuelTypeMap[t] || t },
    { title: '日租金', dataIndex: 'daily_rate', key: 'daily_rate', render: (v: number) => `¥${v}/天` },
    { title: '押金', dataIndex: 'deposit_amount', key: 'deposit_amount', render: (v: number) => `¥${v}` },
    { title: '门店', dataIndex: 'store_name', key: 'store_name' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (status: string, record: Vehicle) => (
        <Space>
          <Tag color={VehicleStatusMap[status]?.color}>
            {VehicleStatusMap[status]?.text}
          </Tag>
          <Select
            size="small"
            style={{ width: 100 }}
            value={status}
            onChange={(value) => handleStatusChange(record.id, value)}
          >
            {Object.entries(VehicleStatusMap).map(([key, val]) => (
              <Option key={key} value={key}>{val.text}</Option>
            ))}
          </Select>
        </Space>
      )
    },
    {
      title: '操作', key: 'action',
      render: (_, record: Vehicle) => (
        <Space size="middle">
          <Button type="link" size="small" onClick={() => navigate(`/vehicles/${record.id}`)}>详情</Button>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
        </Space>
      )
    }
  ];

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">车辆管理</h2>
        <Space>
          <Input
            placeholder="搜索车牌号/品牌/车型"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            allowClear
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            value={filterStatus}
            onChange={(value) => { setFilterStatus(value); setPagination({ ...pagination, current: 1 }); }}
          >
            {Object.entries(VehicleStatusMap).map(([key, val]) => (
              <Option key={key} value={key}>{val.text}</Option>
            ))}
          </Select>
          <Select
            placeholder="门店"
            style={{ width: 150 }}
            allowClear
            value={filterStore}
            onChange={(value) => { setFilterStore(value); setPagination({ ...pagination, current: 1 }); }}
          >
            {stores.map(s => (
              <Option key={s.id} value={s.id}>{s.name}</Option>
            ))}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={loadVehicles}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingVehicle(null); form.resetFields(); setModalVisible(true); }}>
            添加车辆
          </Button>
        </Space>
      </div>

      {error && (
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={loadVehicles}>重试</Button>
          }
        />
      )}

      {!loading && !error && vehicles.length === 0 ? (
        <Empty description="暂无车辆数据" style={{ padding: '60px 0' }} />
      ) : (
        <Table
          columns={columns}
          dataSource={vehicles}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            total,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize })
          }}
        />
      )}

      <Modal
        title={editingVehicle ? '编辑车辆' : '添加车辆'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="plate_number" label="车牌号" rules={[{ required: true, message: '请输入车牌号' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="brand" label="品牌" rules={[{ required: true, message: '请输入品牌' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="model" label="车型" rules={[{ required: true, message: '请输入车型' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="color" label="颜色">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="year" label="年款">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fuel_type" label="燃油类型" rules={[{ required: true }]}>
                <Select>
                  <Option value="gasoline">汽油</Option>
                  <Option value="electric">纯电</Option>
                  <Option value="hybrid">混动</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="transmission" label="变速箱" rules={[{ required: true }]}>
                <Select>
                  <Option value="auto">自动</Option>
                  <Option value="manual">手动</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="seats" label="座位数">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="daily_rate" label="日租金(元)" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="deposit_amount" label="押金(元)" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="insurance_fee" label="保险费(元/天)" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="store_id" label="所属门店" rules={[{ required: true }]}>
                <Select>
                  {stores.map(s => (
                    <Option key={s.id} value={s.id}>{s.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(VehicleStatusMap).map(([key, val]) => (
                    <Option key={key} value={key}>{val.text}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VehicleList;
