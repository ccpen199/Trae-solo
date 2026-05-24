import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Input, Select, Modal, Form, message, Button, DatePicker, InputNumber } from 'antd';
import { SearchOutlined, PlusOutlined, CheckOutlined } from '@ant-design/icons';
import { violationApi, vehicleApi, userApi } from '../../services/api';
import { Violation, ViolationStatusMap } from '../../types';

const { Option } = Select;

const ViolationList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [modalVisible, setModalVisible] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({ status: '' });

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, vehRes, custRes] = await Promise.all([
        violationApi.list({ page: pagination.current, pageSize: pagination.pageSize, ...filters }),
        vehicleApi.list({ pageSize: 100 }),
        userApi.customers().catch(() => ({ data: [] }))
      ]);
      setViolations(vRes.data || []);
      setTotal(vRes.total || 0);
      setVehicles(vehRes.data || []);
      setCustomers(custRes.data || []);
    } catch (err) {
      console.error('加载数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      await violationApi.create({
        ...values,
        violation_time: values.violation_time?.toISOString()
      });
      message.success('添加成功');
      setModalVisible(false);
      loadData();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await violationApi.updateStatus(id, status);
      message.success('状态更新成功');
      loadData();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '客户', dataIndex: 'user_name', key: 'user_name' },
    { title: '车牌号', dataIndex: 'plate_number', key: 'plate_number' },
    { title: '违章时间', dataIndex: 'violation_time', key: 'violation_time', render: (v?: string) => v?.slice(0, 19).replace('T', ' ') || '-' },
    { title: '违章地点', dataIndex: 'violation_location', key: 'violation_location', render: (v?: string) => v || '-' },
    { title: '违章类型', dataIndex: 'violation_type', key: 'violation_type', render: (v?: string) => v || '-' },
    { title: '罚款', dataIndex: 'fine_amount', key: 'fine_amount', render: (v: number) => `¥${v}` },
    { title: '扣分', dataIndex: 'deduction_points', key: 'deduction_points', render: (v: number) => `${v}分` },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (status: string, record: Violation) => (
        <Space>
          <Tag color={ViolationStatusMap[status]?.color}>{ViolationStatusMap[status]?.text}</Tag>
          <Select
            size="small"
            style={{ width: 100 }}
            value={status}
            onChange={(value) => handleStatusChange(record.id, value)}
          >
            {Object.entries(ViolationStatusMap).map(([key, val]) => (
              <Option key={key} value={key}>{val.text}</Option>
            ))}
          </Select>
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">违章管理</h2>
        <Space>
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ status: value })}
          >
            {Object.entries(ViolationStatusMap).map(([key, val]) => (
              <Option key={key} value={key}>{val.text}</Option>
            ))}
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalVisible(true); }}>
            录入违章
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={violations}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          total,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (page, pageSize) => setPagination({ current: page, pageSize })
        }}
      />

      <Modal title="录入违章" open={modalVisible} onCancel={() => setModalVisible(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="vehicle_id" label="选择车辆" rules={[{ required: true }]}>
            <Select placeholder="请选择车辆" showSearch optionFilterProp="children">
              {vehicles.map(v => (
                <Option key={v.id} value={v.id}>{v.plate_number} - {v.brand} {v.model}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="user_id" label="涉及客户" rules={[{ required: true }]}>
            <Select placeholder="请选择客户" showSearch optionFilterProp="children">
              {customers.map(c => (
                <Option key={c.id} value={c.id}>{c.real_name} ({c.phone})</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="violation_time" label="违章时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="violation_location" label="违章地点">
            <Input />
          </Form.Item>
          <Form.Item name="violation_type" label="违章类型" rules={[{ required: true }]}>
            <Input placeholder="如：超速、违停、闯红灯等" />
          </Form.Item>
          <Form.Item name="fine_amount" label="罚款金额(元)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="deduction_points" label="扣分" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} max={12} />
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

export default ViolationList;
