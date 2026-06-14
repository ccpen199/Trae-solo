import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, Select, Modal, Form, Input, InputNumber, DatePicker, message } from 'antd';
import { FileProtectOutlined, PlusOutlined, EditOutlined, CheckCircleOutlined, ClockCircleOutlined, TruckOutlined } from '@ant-design/icons';
import { getMaterialPlans, createMaterialPlan, updateMaterialStatus, getProjects } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ErpMaterials = () => {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const statusMap = {
    pending: { color: 'orange', text: '待采购', icon: <ClockCircleOutlined /> },
    ordered: { color: 'blue', text: '已下单', icon: <TruckOutlined /> },
    delivered: { color: 'green', text: '已到货', icon: <CheckCircleOutlined /> },
    cancelled: { color: 'default', text: '已取消', icon: <ClockCircleOutlined /> }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, projectFilter, statusFilter]);

  const loadProjects = async () => {
    const res = await getProjects({ pageSize: 100 });
    if (res.code === 200) {
      setProjects(res.data.list);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const res = await getMaterialPlans({
      page: pagination.current,
      pageSize: pagination.pageSize,
      project_id: projectFilter,
      status: statusFilter
    });
    if (res.code === 200) {
      setData(res.data);
    }
    setLoading(false);
  };

  const handleSubmit = async (values) => {
    const payload = {
      ...values,
      planned_arrival_date: values.planned_arrival_date.format('YYYY-MM-DD'),
      total_price: values.quantity * values.unit_price
    };

    const res = await createMaterialPlan(payload);
    if (res.code === 200) {
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadData();
    }
  };

  const handleStatusChange = async (id, status) => {
    const res = await updateMaterialStatus(id, {
      status,
      actual_arrival_date: status === 'delivered' ? dayjs().format('YYYY-MM-DD') : null
    });
    if (res.code === 200) {
      message.success('状态已更新');
      loadData();
    }
  };

  const columns = [
    { title: '材料名称', dataIndex: 'material_name', key: 'material_name', ellipsis: true },
    { title: '规格', dataIndex: 'specification', key: 'specification', width: 120 },
    { title: '品牌', dataIndex: 'brand', key: 'brand', width: 100 },
    { title: '数量', key: 'qty', width: 100, render: (_, r) => `${r.quantity} ${r.unit}` },
    { title: '单价(元)', dataIndex: 'unit_price', key: 'unit_price', width: 100, render: v => v?.toFixed(2) },
    { title: '小计(元)', dataIndex: 'total_price', key: 'total_price', width: 110, render: v => <span style={{ color: '#f5222d', fontWeight: 500 }}>{v?.toFixed(2)}</span> },
    { title: '供应商', dataIndex: 'supplier', key: 'supplier', width: 120, ellipsis: true },
    { title: '计划到货', dataIndex: 'planned_arrival_date', key: 'planned', width: 110 },
    { title: '实际到货', dataIndex: 'actual_arrival_date', key: 'actual', width: 110 },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100,
      render: v => <Tag color={statusMap[v]?.color}>{statusMap[v]?.icon} {statusMap[v]?.text}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'pending' && (
            <Button type="link" size="small" onClick={() => handleStatusChange(record.id, 'ordered')}>下单</Button>
          )}
          {record.status === 'ordered' && (
            <Button type="link" size="small" onClick={() => handleStatusChange(record.id, 'delivered')}>到货</Button>
          )}
        </Space>
      )
    }
  ];

  const totalAmount = data.reduce((sum, item) => sum + (item.total_price || 0), 0);
  const deliveredAmount = data.filter(i => i.status === 'delivered').reduce((sum, item) => sum + (item.total_price || 0), 0);
  const pendingAmount = data.filter(i => i.status === 'pending' || i.status === 'ordered').reduce((sum, item) => sum + (item.total_price || 0), 0);

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>
          <FileProtectOutlined style={{ marginRight: 8 }} />
          材料进场计划
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalVisible(true); }}>
          新增材料
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <div style={{ fontSize: 12, color: '#888' }}>材料总额</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#f5222d' }}>¥{totalAmount.toFixed(2)}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <div style={{ fontSize: 12, color: '#888' }}>已到货</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>¥{deliveredAmount.toFixed(2)}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <div style={{ fontSize: 12, color: '#888' }}>待到货</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#fa8c16' }}>¥{pendingAmount.toFixed(2)}</div>
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Select
          placeholder="选择项目"
          allowClear
          style={{ width: 240 }}
          value={projectFilter || undefined}
          onChange={v => setProjectFilter(v || '')}
          options={projects.map(p => ({ label: p.title, value: p.id }))}
        />
        <Select
          placeholder="状态筛选"
          allowClear
          style={{ width: 160 }}
          value={statusFilter || undefined}
          onChange={v => setStatusFilter(v || '')}
        >
          {Object.entries(statusMap).map(([k, v]) => (
            <Select.Option key={k} value={k}>{v.text}</Select.Option>
          ))}
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条`
        }}
        onChange={(p) => setPagination(prev => ({ ...prev, current: p.current, pageSize: p.pageSize }))}
      />

      <Modal
        title="新增材料计划"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="project_id" label="所属项目" rules={[{ required: true }]}>
            <Select options={projects.map(p => ({ label: p.title, value: p.id }))} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="material_name" label="材料名称" rules={[{ required: true }]}>
                <Input placeholder="如: PPR水管" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="specification" label="规格" rules={[{ required: true }]}>
                <Input placeholder="如: Dn25" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="brand" label="品牌">
                <Input placeholder="品牌名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
                <Input placeholder="如: 米、个、桶" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="unit_price" label="单价(元)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="planned_arrival_date" label="计划到货日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="supplier" label="供应商">
            <Input placeholder="供应商名称" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ErpMaterials;
