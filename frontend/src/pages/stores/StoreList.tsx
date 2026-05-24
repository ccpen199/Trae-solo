import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Input, Select, Modal, Form, message, Row, Col, Alert, Empty } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { storeApi } from '../../services/api';
import { Store } from '../../types';

const { Option } = Select;

const StoreList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [form] = Form.useForm();
  const [searchCity, setSearchCity] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStores();
  }, [pagination.current, pagination.pageSize, searchCity]);

  const loadStores = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize
      };
      if (searchCity) params.city = searchCity;

      const res = await storeApi.list(params);
      setStores(res.data || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error('加载门店失败', err);
      setError(err?.message || '加载门店数据失败');
      message.error('加载门店数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    form.setFieldsValue(store);
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingStore) {
        await storeApi.update(editingStore.id, values);
        message.success('更新成功');
      } else {
        await storeApi.create(values);
        message.success('添加成功');
      }
      setModalVisible(false);
      loadStores();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '门店名称', dataIndex: 'name', key: 'name' },
    { title: '城市', dataIndex: 'city', key: 'city' },
    { title: '地址', dataIndex: 'address', key: 'address' },
    { title: '联系人', dataIndex: 'contact_person', key: 'contact_person' },
    { title: '联系电话', dataIndex: 'contact_phone', key: 'contact_phone' },
    { title: '营业时间', dataIndex: 'business_hours', key: 'business_hours' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: number) => s === 1 ? <Tag color="success">营业中</Tag> : <Tag color="default">已关闭</Tag> },
    {
      title: '操作', key: 'action',
      render: (_, record: Store) => (
        <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
      )
    }
  ];

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">门店管理</h2>
        <Space>
          <Input
            placeholder="搜索城市"
            prefix={<SearchOutlined />}
            style={{ width: 150 }}
            allowClear
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            onPressEnter={handleSearch}
          />
          <Button icon={<ReloadOutlined />} onClick={loadStores}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingStore(null); form.resetFields(); setModalVisible(true); }}>
            添加门店
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
            <Button size="small" icon={<ReloadOutlined />} onClick={loadStores}>重试</Button>
          }
        />
      )}

      {!loading && !error && stores.length === 0 ? (
        <Empty description="暂无门店数据" style={{ padding: '60px 0' }} />
      ) : (
        <Table
          columns={columns}
          dataSource={stores}
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

      <Modal title={editingStore ? '编辑门店' : '添加门店'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="门店名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="city" label="城市" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="province" label="省份">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="district" label="区/县">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="详细地址" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contact_person" label="联系人">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contact_phone" label="联系电话">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="business_hours" label="营业时间">
            <Input placeholder="例如：09:00-21:00" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select>
                <Option value={1}>营业中</Option>
                <Option value={0}>已关闭</Option>
              </Select>
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

export default StoreList;
