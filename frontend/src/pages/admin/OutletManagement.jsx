import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../../utils/api';

function OutletManagement() {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadOutlets();
  }, []);

  const loadOutlets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/outlets');
      setOutlets(response.data.outlets);
    } catch (error) {
      console.error('加载网点失败', error);
    }
    setLoading(false);
  };

  const handleCreate = async (values) => {
    try {
      await api.post('/admin/outlets', values);
      message.success('网点创建成功');
      setModalVisible(false);
      form.resetFields();
      loadOutlets();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '网点名称', dataIndex: 'name', key: 'name' },
    { title: '地址', dataIndex: 'address', key: 'address' },
    { title: '城市', dataIndex: 'city', key: 'city' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '营业时间', dataIndex: 'business_hours', key: 'business_hours' },
    { title: '配送范围', dataIndex: 'delivery_area', key: 'delivery_area' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>网点管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新增网点
        </Button>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={outlets}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="新增网点"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="网点名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="地址" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="city" label="城市" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input />
          </Form.Item>
          <Form.Item name="business_hours" label="营业时间">
            <Input placeholder="例如：09:00-18:00" />
          </Form.Item>
          <Form.Item name="delivery_area" label="配送范围">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              创建网点
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default OutletManagement;
