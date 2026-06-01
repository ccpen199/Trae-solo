import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Tag, message, Row, Col, Card } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { clientAPI, userAPI } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form] = Form.useForm();
  const [accountants, setAccountants] = useState([]);
  const [filters, setFilters] = useState({ status: '', risk_level: '' });

  useEffect(() => {
    loadClients();
    loadAccountants();
  }, [filters]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const res = await clientAPI.getAll(filters);
      setClients(res.data);
    } finally {
      setLoading(false);
    }
  };

  const loadAccountants = async () => {
    const res = await userAPI.getAll({ role: 'accountant' });
    setAccountants(res.data);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingClient) {
        await clientAPI.update(editingClient.id, values);
        message.success('客户更新成功');
      } else {
        await clientAPI.create(values);
        message.success('客户创建成功');
      }
      setModalVisible(false);
      setEditingClient(null);
      form.resetFields();
      loadClients();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    form.setFieldsValue(client);
    setModalVisible(true);
  };

  const getRiskTag = (level) => {
    const colors = { normal: 'green', medium: 'orange', high: 'red' };
    const labels = { normal: '正常', medium: '中风险', high: '高风险' };
    return <Tag color={colors[level]}>{labels[level]}</Tag>;
  };

  const getStatusTag = (status) => {
    const colors = { active: 'green', inactive: 'red', pending: 'orange' };
    const labels = { active: '活跃', inactive: '停用', pending: '待激活' };
    return <Tag color={colors[status]}>{labels[status]}</Tag>;
  };

  const columns = [
    { title: '客户名称', dataIndex: 'company_name', key: 'company_name' },
    { title: '税号', dataIndex: 'tax_id', key: 'tax_id' },
    { title: '联系人', dataIndex: 'contact_person', key: 'contact_person' },
    { title: '联系电话', dataIndex: 'contact_phone', key: 'contact_phone' },
    { title: '服务套餐', dataIndex: 'service_package', key: 'service_package' },
    { title: '开票规模', dataIndex: 'invoice_scale', key: 'invoice_scale', render: (val) => `${val}万` },
    { title: '所属会计', dataIndex: 'accountant_name', key: 'accountant_name' },
    { title: '风险等级', dataIndex: 'risk_level', key: 'risk_level', render: (level) => getRiskTag(level) },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status) => getStatusTag(status) },
    { title: '合同到期', dataIndex: 'contract_end_date', key: 'contract_end_date', render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-' },
    { title: '操作', key: 'action', render: (_, record) => (
      <Space>
        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
      </Space>
    ) }
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>客户档案管理</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingClient(null); form.resetFields(); setModalVisible(true); }}>新增客户</Button>
        </div>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Select placeholder="状态筛选" style={{ width: '100%' }} allowClear onChange={(value) => setFilters({ ...filters, status: value || '' })}>
              <Option value="active">活跃</Option>
              <Option value="inactive">停用</Option>
              <Option value="pending">待激活</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select placeholder="风险等级" style={{ width: '100%' }} allowClear onChange={(value) => setFilters({ ...filters, risk_level: value || '' })}>
              <Option value="normal">正常</Option>
              <Option value="medium">中风险</Option>
              <Option value="high">高风险</Option>
            </Select>
          </Col>
        </Row>

        <Table columns={columns} dataSource={clients} loading={loading} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title={editingClient ? '编辑客户' : '新增客户'} open={modalVisible} onCancel={() => { setModalVisible(false); setEditingClient(null); form.resetFields(); }} onOk={() => form.submit()} width={800}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="company_name" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}>
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tax_id" label="税号">
                <Input placeholder="请输入税号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="contact_person" label="联系人">
                <Input placeholder="请输入联系人" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contact_phone" label="联系电话">
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contact_email" label="邮箱">
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contract_start_date" label="合同开始日期">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contract_end_date" label="合同结束日期">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tax_types" label="税种">
                <Input placeholder="请输入税种，逗号分隔" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="invoice_scale" label="开票规模（万元）">
                <Input type="number" placeholder="请输入开票规模" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="service_package" label="服务套餐">
                <Select placeholder="请选择服务套餐">
                  <Option value="基础套餐">基础套餐</Option>
                  <Option value="标准套餐">标准套餐</Option>
                  <Option value="高级套餐">高级套餐</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="assigned_accountant_id" label="所属会计">
                <Select placeholder="请选择会计">
                  {accountants.map(acc => <Option key={acc.id} value={acc.id}>{acc.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="risk_level" label="风险等级" initialValue="normal">
                <Select>
                  <Option value="normal">正常</Option>
                  <Option value="medium">中风险</Option>
                  <Option value="high">高风险</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" initialValue="active">
                <Select>
                  <Option value="active">活跃</Option>
                  <Option value="inactive">停用</Option>
                  <Option value="pending">待激活</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="risk_notes" label="风险备注">
            <Input.TextArea rows={3} placeholder="请输入风险备注" />
          </Form.Item>
          <Form.Item name="delivery_habit" label="资料交付习惯">
            <Input.TextArea rows={2} placeholder="请输入资料交付习惯" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Clients;
