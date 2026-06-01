import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, Space, Tag, message } from 'antd';
import { getWorkOrders, createWorkOrder, getProducts, getBoms } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;

function WorkOrders() {
  const [data, setData] = useState([]);
  const [products, setProducts] = useState([]);
  const [boms, setBoms] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
    fetchProducts();
    fetchBoms();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getWorkOrders();
      setData(res.data);
    } catch (error) {
      console.error('获取工单失败:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch (error) {
      console.error('获取产品失败:', error);
    }
  };

  const fetchBoms = async () => {
    try {
      const res = await getBoms();
      setBoms(res.data);
    } catch (error) {
      console.error('获取BOM失败:', error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      await createWorkOrder({
        ...values,
        planned_start_date: values.planned_start_date?.format('YYYY-MM-DD'),
        planned_end_date: values.planned_end_date?.format('YYYY-MM-DD'),
        created_by: 'admin'
      });
      message.success('工单创建成功');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      created: { color: 'default', text: '已创建' },
      pending: { color: 'processing', text: '待开工' },
      running: { color: 'processing', text: '生产中' },
      completed: { color: 'success', text: '已完成' }
    };
    const s = statusMap[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const getKittingStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'default', text: '待检查' },
      ready: { color: 'success', text: '已齐套' },
      shortage: { color: 'error', text: '缺料' }
    };
    const s = statusMap[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const columns = [
    { title: '工单号', dataIndex: 'wo_no', key: 'wo_no', width: 140 },
    { title: '产品编码', dataIndex: 'product_code', key: 'product_code', width: 120 },
    { title: '产品名称', dataIndex: 'product_name', key: 'product_name' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
    { title: '产线', dataIndex: 'production_line', key: 'production_line', width: 100 },
    { title: '计划开工', dataIndex: 'planned_start_date', key: 'start', width: 120 },
    { title: '计划完工', dataIndex: 'planned_end_date', key: 'end', width: 120 },
    { title: '工单状态', dataIndex: 'status', key: 'status', width: 100,
      render: (text) => getStatusTag(text)
    },
    { title: '齐套状态', dataIndex: 'kitting_status', key: 'kitting', width: 100,
      render: (text) => getKittingStatusTag(text)
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="page-title" style={{ margin: 0 }}>工单管理</h2>
        <Button type="primary" onClick={() => setModalVisible(true)}>新建工单</Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新建工单"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="wo_no" label="工单号" rules={[{ required: true }]}>
            <Input placeholder="例如: WO-2024-0001" />
          </Form.Item>
          <Form.Item name="product_id" label="产品" rules={[{ required: true }]}>
            <Select placeholder="请选择产品">
              {products.map(p => (
                <Option key={p.id} value={p.id}>{p.code} - {p.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="bom_id" label="BOM版本">
            <Select placeholder="请选择BOM">
              {boms.map(b => (
                <Option key={b.id} value={b.id}>{b.product_code} - {b.version}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="quantity" label="生产数量" rules={[{ required: true }]}>
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item name="production_line" label="生产产线">
            <Select placeholder="请选择产线">
              <Option value="Line-A">Line-A</Option>
              <Option value="Line-B">Line-B</Option>
              <Option value="Line-C">Line-C</Option>
            </Select>
          </Form.Item>
          <Space>
            <Form.Item name="planned_start_date" label="计划开工日期" rules={[{ required: true }]}>
              <DatePicker />
            </Form.Item>
            <Form.Item name="planned_end_date" label="计划完工日期" rules={[{ required: true }]}>
              <DatePicker />
            </Form.Item>
          </Space>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>创建</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default WorkOrders;
