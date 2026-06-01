import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, InputNumber, Space, Tag, message, Row, Col, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { taxAPI, clientAPI } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const TaxDeclarations = () => {
  const [declarations, setDeclarations] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({ month: '', status: '' });

  useEffect(() => {
    loadDeclarations();
    loadClients();
  }, [filters]);

  const loadDeclarations = async () => {
    setLoading(true);
    try {
      const res = await taxAPI.getAll(filters);
      setDeclarations(res.data);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    const res = await clientAPI.getAll({ status: 'active' });
    setClients(res.data);
  };

  const handleSubmit = async (values) => {
    try {
      await taxAPI.create(values);
      message.success('申报记录创建成功');
      setModalVisible(false);
      form.resetFields();
      loadDeclarations();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getStatusTag = (status) => {
    const colors = { pending: 'orange', submitted: 'blue', success: 'green', failed: 'red', overdue: 'red' };
    const labels = { pending: '待申报', submitted: '已提交', success: '申报成功', failed: '申报失败', overdue: '已逾期' };
    return <Tag color={colors[status]}>{labels[status]}</Tag>;
  };

  const columns = [
    { title: '客户名称', dataIndex: 'company_name', key: 'company_name' },
    { title: '月份', dataIndex: 'month', key: 'month' },
    { title: '税种', dataIndex: 'tax_type', key: 'tax_type' },
    { title: '税额', dataIndex: 'tax_amount', key: 'tax_amount', render: (amount) => `¥${amount?.toFixed(2)}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status) => getStatusTag(status) },
    { title: '处理人', dataIndex: 'handler_name', key: 'handler_name' },
    { title: '申报日期', dataIndex: 'declaration_date', key: 'declaration_date', render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm') },
    { title: '操作', key: 'action', render: (_, record) => (
      <Space>
        <Button type="link" onClick={() => { taxAPI.updateStatus(record.id, 'success'); loadDeclarations(); }}>申报成功</Button>
        <Button type="link" onClick={() => { taxAPI.updateStatus(record.id, 'overdue'); loadDeclarations(); }}>标记逾期</Button>
      </Space>
    ) }
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>报税管理</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>新建申报记录</Button>
        </div>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Select placeholder="选择月份" style={{ width: '100%' }} allowClear onChange={(value) => setFilters({ ...filters, month: value || '' })}>
              {Array.from({ length: 12 }, (_, i) => {
                const date = dayjs().subtract(i, 'month');
                return <Option key={i} value={date.format('YYYY-MM')}>{date.format('YYYY-MM')}</Option>;
              })}
            </Select>
          </Col>
          <Col span={6}>
            <Select placeholder="状态" style={{ width: '100%' }} allowClear onChange={(value) => setFilters({ ...filters, status: value || '' })}>
              <Option value="pending">待申报</Option>
              <Option value="success">申报成功</Option>
              <Option value="overdue">已逾期</Option>
            </Select>
          </Col>
        </Row>

        <Table columns={columns} dataSource={declarations} loading={loading} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="新建申报记录" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="client_id" label="客户" rules={[{ required: true, message: '请选择客户' }]}>
            <Select placeholder="请选择客户">
              {clients.map(client => <Option key={client.id} value={client.id}>{client.company_name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="month" label="月份" rules={[{ required: true, message: '请选择月份' }]}>
            <Select placeholder="请选择月份">
              {Array.from({ length: 12 }, (_, i) => {
                const date = dayjs().subtract(i, 'month');
                return <Option key={i} value={date.format('YYYY-MM')}>{date.format('YYYY-MM')}</Option>;
              })}
            </Select>
          </Form.Item>
          <Form.Item name="tax_type" label="税种" rules={[{ required: true, message: '请输入税种' }]}>
            <Select mode="tags" placeholder="请输入或选择税种">
              <Option value="增值税">增值税</Option>
              <Option value="企业所得税">企业所得税</Option>
              <Option value="个人所得税">个人所得税</Option>
              <Option value="印花税">印花税</Option>
            </Select>
          </Form.Item>
          <Form.Item name="tax_amount" label="税额">
            <InputNumber min={0} style={{ width: '100%' }} formatter={(value) => `¥ ${value}`} parser={(value) => value.replace('¥ ', '')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaxDeclarations;
