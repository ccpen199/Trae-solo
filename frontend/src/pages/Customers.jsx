import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Space, message, Popconfirm, Row, Col, Tag, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { customersApi, reportsApi } from '../api';

const { Option } = Select;

function Customers() {
  const [list, setList] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [traceVisible, setTraceVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [customerTrace, setCustomerTrace] = useState(null);
  const [filters, setFilters] = useState({});
  const [form] = Form.useForm();

  useEffect(() => {
    loadList();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await customersApi.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters
      });
      setList(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
    } catch (error) {
      message.error('加载失败');
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await customersApi.delete(id);
      message.success('删除成功');
      loadList();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await customersApi.update(editingId, values);
        message.success('更新成功');
      } else {
        await customersApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadList();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleViewTrace = async (id) => {
    try {
      const res = await reportsApi.getCustomerTrace(id);
      setCustomerTrace(res.data.data);
      setTraceVisible(true);
    } catch (error) {
      message.error('加载失败');
    }
  };

  const columns = [
    { title: '卡号', dataIndex: 'card_no', key: 'card_no', width: 150 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 120 },
    { title: '卡等级', dataIndex: 'card_level', key: 'card_level', width: 100,
      render: (v) => <Tag color={v === '钻石' ? 'gold' : v === '白金' ? 'blue' : v === '金卡' ? 'orange' : 'default'}>{v}</Tag> },
    { title: '风险等级', dataIndex: 'risk_level', key: 'risk_level', width: 100,
      render: (v) => <Tag color={v === '高' ? 'red' : v === '中' ? 'orange' : 'green'}>{v}</Tag> },
    { title: '信用额度', dataIndex: 'credit_limit', key: 'credit_limit', width: 120, render: (v) => `¥${v?.toLocaleString()}` },
    { title: '账单金额', dataIndex: 'bill_amount', key: 'bill_amount', width: 120, render: (v) => `¥${v?.toLocaleString()}` },
    { title: '操作', key: 'action', width: 200,
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => handleViewTrace(record.id)}>追踪</Button>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>客户管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增客户</Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Select placeholder="卡等级" allowClear style={{ width: '100%' }}
              onChange={(v) => setFilters(prev => ({ ...prev, card_level: v }))}>
              <Option value="普通">普通</Option>
              <Option value="金卡">金卡</Option>
              <Option value="白金">白金</Option>
              <Option value="钻石">钻石</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select placeholder="风险等级" allowClear style={{ width: '100%' }}
              onChange={(v) => setFilters(prev => ({ ...prev, risk_level: v }))}>
              <Option value="低">低</Option>
              <Option value="中">中</Option>
              <Option value="高">高</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Input.Search placeholder="搜索姓名/卡号/电话" allowClear
              onSearch={(v) => setFilters(prev => ({ ...prev, keyword: v || undefined }))} />
          </Col>
        </Row>
      </Card>

      <Table columns={columns} dataSource={list} rowKey="id" loading={loading}
        pagination={{ ...pagination, showSizeChanger: true, showQuickJumper: true, showTotal: total => `共 ${total} 条` }}
        onChange={(p) => setPagination(prev => ({ ...prev, current: p.current, pageSize: p.pageSize }))}
      />

      <Modal title={editingId ? '编辑客户' : '新增客户'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="card_no" label="卡号" rules={[{ required: true, len: 16, message: '请输入16位卡号' }]}>
            <Input placeholder="请输入16位卡号" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="电话" rules={[{ required: true, len: 11, message: '请输入11位手机号' }]}>
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="card_level" label="卡等级" initialValue="普通">
                <Select>
                  <Option value="普通">普通</Option>
                  <Option value="金卡">金卡</Option>
                  <Option value="白金">白金</Option>
                  <Option value="钻石">钻石</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="risk_level" label="风险等级" initialValue="低">
                <Select>
                  <Option value="低">低</Option>
                  <Option value="中">中</Option>
                  <Option value="高">高</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="credit_limit" label="信用额度" initialValue={10000}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bill_amount" label="账单金额" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="installment_history_count" label="分期次数" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="consumption_industries" label="消费行业">
            <Input placeholder="多个行业用逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="客户追踪" open={traceVisible} onCancel={() => setTraceVisible(false)} footer={null} width={1000}>
        {customerTrace && (
          <div>
            <Card title="客户信息" style={{ marginBottom: 16 }}>
              <p>姓名: {customerTrace.customer.name}</p>
              <p>卡号: {customerTrace.customer.card_no}</p>
              <p>电话: {customerTrace.customer.phone}</p>
              <p>卡等级: {customerTrace.customer.card_level}</p>
            </Card>

            <Card title="触达历史" style={{ marginBottom: 16 }}>
              <Table dataSource={customerTrace.touch_history} rowKey="id" pagination={false} size="small">
                <Table.Column title="时间" dataIndex="touch_time" key="touch_time" />
                <Table.Column title="渠道" dataIndex="channel" key="channel" />
                <Table.Column title="结果" dataIndex="result" key="result" />
                <Table.Column title="跟进状态" dataIndex="follow_up_status" key="follow_up_status" />
              </Table>
            </Card>

            <Card title="申请历史">
              <Table dataSource={customerTrace.application_history} rowKey="id" pagination={false} size="small">
                <Table.Column title="申请编号" dataIndex="application_no" key="application_no" />
                <Table.Column title="产品" dataIndex="product_name" key="product_name" />
                <Table.Column title="金额" dataIndex="amount" key="amount" render={v => `¥${v?.toLocaleString()}`} />
                <Table.Column title="状态" dataIndex="status" key="status" />
              </Table>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Customers;
