import { useState, useEffect } from 'react';
import { Table, Tag, Button, Select, Space, Modal, Form, Input, InputNumber, message } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { productApi } from '../../services/api';

const categoryMap = {
  food_delivery: { label: '餐饮外卖', color: 'orange' },
  ride_hailing: { label: '出行打车', color: 'blue' },
  gov_payment: { label: '政务缴费', color: 'green' },
  retail: { label: '商超零售', color: 'purple' },
};

const statusMap = {
  on_sale: { label: '在售', color: 'green' },
  off_sale: { label: '下架', color: 'red' },
  draft: { label: '草稿', color: 'default' },
};

export default function ProductList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({ category: undefined, status: undefined });
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await productApi.getList({ page, pageSize, ...filters });
      const d = res.data.data || res.data;
      setData(d.list || d.records || []);
      setPagination({ current: page, pageSize, total: d.total || 0 });
    } catch {
      message.error('获取商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleTableChange = (pag) => {
    fetchData(pag.current, pag.pageSize);
  };

  const openAdd = () => {
    setEditRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEdit = (record) => {
    setEditRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      if (editRecord) {
        await productApi.update(editRecord.id, values);
        message.success('更新成功');
      } else {
        await productApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData(pagination.current, pagination.pageSize);
    } catch (err) {
      if (err.response) message.error('操作失败');
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    { title: '商品名称', dataIndex: 'name', key: 'name' },
    { title: '服务商', dataIndex: 'providerName', key: 'providerName' },
    { title: 'SKU编码', dataIndex: 'skuCode', key: 'skuCode' },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (v) => {
        const c = categoryMap[v] || { label: v, color: 'default' };
        return <Tag color={c.color}>{c.label}</Tag>;
      },
    },
    { title: '售价', dataIndex: 'price', key: 'price', render: (v) => `¥${v}` },
    { title: '原价', dataIndex: 'originalPrice', key: 'originalPrice', render: (v) => v ? `¥${v}` : '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const s = statusMap[v] || { label: v, color: 'default' };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="类别筛选"
          allowClear
          style={{ width: 140 }}
          value={filters.category}
          onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
        >
          {Object.entries(categoryMap).map(([k, v]) => (
            <Select.Option key={k} value={k}>{v.label}</Select.Option>
          ))}
        </Select>
        <Select
          placeholder="状态筛选"
          allowClear
          style={{ width: 140 }}
          value={filters.status}
          onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
        >
          {Object.entries(statusMap).map(([k, v]) => (
            <Select.Option key={k} value={k}>{v.label}</Select.Option>
          ))}
        </Select>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          新增商品
        </Button>
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ ...pagination, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        onChange={handleTableChange}
      />
      <Modal
        title={editRecord ? '编辑商品' : '新增商品'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitLoading}
        okText="提交"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="商品名称" rules={[{ required: true, message: '请输入商品名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="providerId" label="服务商ID" rules={[{ required: true, message: '请输入服务商ID' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="skuCode" label="SKU编码" rules={[{ required: true, message: '请输入SKU编码' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="类别" rules={[{ required: true, message: '请选择类别' }]}>
            <Select>
              {Object.entries(categoryMap).map(([k, v]) => (
                <Select.Option key={k} value={k}>{v.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="price" label="售价" rules={[{ required: true, message: '请输入售价' }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item name="originalPrice" label="原价">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
