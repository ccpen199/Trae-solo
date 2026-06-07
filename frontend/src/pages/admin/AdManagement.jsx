import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../../utils/api';

function AdManagement() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/ads');
      setAds(response.data.ads);
    } catch (error) {
      console.error('加载广告位失败', error);
    }
    setLoading(false);
  };

  const handleCreate = async (values) => {
    try {
      await api.post('/admin/ads', values);
      message.success('广告位创建成功');
      setModalVisible(false);
      form.resetFields();
      loadAds();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '广告位名称', dataIndex: 'name', key: 'name' },
    { title: '位置', dataIndex: 'location', key: 'location' },
    { title: '链接', dataIndex: 'link', key: 'link', ellipsis: true },
    { title: '点击量', dataIndex: 'clicks', key: 'clicks' },
    { title: '曝光量', dataIndex: 'impressions', key: 'impressions' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status) => (
      <Tag color={status === 'active' ? 'green' : 'default'}>
        {status === 'active' ? '启用' : '禁用'}
      </Tag>
    )},
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>广告位管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新增广告位
        </Button>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={ads}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="新增广告位"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="广告位名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="location" label="位置标识" rules={[{ required: true }]}>
            <Input placeholder="如：home_carousel, sidebar" />
          </Form.Item>
          <Form.Item name="image" label="图片URL">
            <Input />
          </Form.Item>
          <Form.Item name="link" label="跳转链接">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              创建广告位
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AdManagement;
