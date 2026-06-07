import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Select, Button, Tag, Space, Row, Col, Modal, Form, Spin, message } from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import useAuthStore from '../stores/auth';
import { materials as matApi, items as itemsApi } from '../api';

const { Option } = Select;

export default function Materials() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [itemId, setItemId] = useState(undefined);
  const [category, setCategory] = useState(undefined);
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [form] = Form.useForm();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchItems();
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  const fetchItems = async () => {
    try {
      const res = await itemsApi.getItems({ page: 1, page_size: 100 });
      const d = res.data?.data || res.data || {};
      setItems(d.items || d.list || []);
    } catch {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.current, page_size: pagination.pageSize };
      if (keyword) params.keyword = keyword;
      if (itemId) params.item_id = itemId;
      if (category) params.category = category;
      const res = await matApi.getMaterials(params);
      const d = res.data?.data || res.data || {};
      setData(d.items || d.list || []);
      setPagination((prev) => ({ ...prev, total: d.total || 0 }));
    } catch {
      message.error('获取材料列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);
      await matApi.createMaterial(values);
      message.success('添加材料成功');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (err) {
      if (err.response) {
        message.error(err.response?.data?.message || '操作失败');
      }
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    { title: '材料编码', dataIndex: 'code', key: 'code', width: 140 },
    { title: '材料名称', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: '关联事项', dataIndex: 'item_name', key: 'item_name', width: 150, ellipsis: true },
    {
      title: '材料类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (v) => {
        const map = { form: '表格', certificate: '证照', report: '报告', other: '其他' };
        return map[v] || v || '-';
      },
    },
    {
      title: '是否必须',
      dataIndex: 'is_required',
      key: 'is_required',
      width: 90,
      render: (v) => (v ? <Tag color="red">必须</Tag> : <Tag>可选</Tag>),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: () => (
        <Button type="link" size="small">查看</Button>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="请输入关键词"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select placeholder="关联事项" value={itemId} onChange={setItemId} allowClear style={{ width: '100%' }} showSearch optionFilterProp="children">
              {items.map((item) => (
                <Option key={item.id} value={item.id}>{item.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select placeholder="材料类别" value={category} onChange={setCategory} allowClear style={{ width: '100%' }}>
              <Option value="form">表格</Option>
              <Option value="certificate">证照</Option>
              <Option value="report">报告</Option>
              <Option value="other">其他</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={8}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setItemId(undefined); setCategory(undefined); }}>重置</Button>
              {isAdmin && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                  添加材料
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ ...pagination, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          onChange={(pag) => setPagination({ current: pag.current, pageSize: pag.pageSize, total: pag.total })}
        />
      </Card>

      <Modal
        title="添加材料"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        confirmLoading={modalLoading}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="材料编码" rules={[{ required: true, message: '请输入材料编码' }]}>
            <Input placeholder="请输入材料编码" />
          </Form.Item>
          <Form.Item name="name" label="材料名称" rules={[{ required: true, message: '请输入材料名称' }]}>
            <Input placeholder="请输入材料名称" />
          </Form.Item>
          <Form.Item name="item_id" label="关联事项">
            <Select placeholder="请选择关联事项" allowClear showSearch optionFilterProp="children">
              {items.map((item) => (
                <Option key={item.id} value={item.id}>{item.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="category" label="材料类别" rules={[{ required: true, message: '请选择材料类别' }]}>
            <Select placeholder="请选择材料类别">
              <Option value="form">表格</Option>
              <Option value="certificate">证照</Option>
              <Option value="report">报告</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="is_required" label="是否必须" initialValue={true}>
            <Select>
              <Option value={true}>必须</Option>
              <Option value={false}>可选</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
