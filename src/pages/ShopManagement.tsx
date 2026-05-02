import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, SyncOutlined, DeleteOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { shopsAPI } from '../services/api';

interface Shop {
  id: number;
  name: string;
  platform: string;
  status: string;
  auth_token?: string;
  created_at: string;
  updated_at: string;
}

const platformColors: Record<string, string> = {
  amazon: '#FF9900',
  ebay: '#E53238',
  shopify: '#96BF48',
  tiktok: '#000000'
};

const ShopManagement: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [form] = Form.useForm();
  const [authorizeModalVisible, setAuthorizeModalVisible] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    setLoading(true);
    try {
      const response = await shopsAPI.getAll();
      setShops(response.data.shops);
    } catch (error) {
      message.error('加载店铺失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingShop(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (shop: Shop) => {
    setEditingShop(shop);
    form.setFieldsValue(shop);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingShop) {
        await shopsAPI.update(editingShop.id, values);
        message.success('更新成功');
      } else {
        await shopsAPI.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadShops();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await shopsAPI.delete(id);
      message.success('删除成功');
      loadShops();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleAuthorize = (shop: Shop) => {
    setSelectedShop(shop);
    setAuthorizeModalVisible(true);
  };

  const handleAuthorizeSubmit = async () => {
    try {
      await shopsAPI.authorize(selectedShop!.id, 'mock_auth_code');
      message.success('授权成功');
      setAuthorizeModalVisible(false);
      loadShops();
    } catch (error) {
      message.error('授权失败');
    }
  };

  const handleSync = async (shop: Shop) => {
    try {
      await shopsAPI.sync(shop.id);
      message.success('同步成功');
    } catch (error) {
      message.error('同步失败');
    }
  };

  const columns: ColumnsType<Shop> = [
    {
      title: '店铺名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => (
        <Tag color={platformColors[platform]} style={{ textTransform: 'uppercase' }}>
          {platform}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          active: { color: 'success', text: '已授权' },
          inactive: { color: 'default', text: '未授权' },
          pending: { color: 'processing', text: '待授权' }
        };
        const { color, text } = statusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          {record.status !== 'active' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleAuthorize(record)}
            >
              授权
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<SyncOutlined />}
            onClick={() => handleSync(record)}
          >
            同步
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确定删除该店铺?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>店铺管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加店铺
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={shops}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingShop ? '编辑店铺' : '添加店铺'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="店铺名称"
            rules={[{ required: true, message: '请输入店铺名称' }]}
          >
            <Input placeholder="请输入店铺名称" />
          </Form.Item>
          <Form.Item
            name="platform"
            label="平台"
            rules={[{ required: true, message: '请选择平台' }]}
          >
            <Select placeholder="请选择平台">
              <Select.Option value="amazon">Amazon</Select.Option>
              <Select.Option value="ebay">eBay</Select.Option>
              <Select.Option value="shopify">Shopify</Select.Option>
              <Select.Option value="tiktok">TikTok Shop</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="店铺授权"
        open={authorizeModalVisible}
        onOk={handleAuthorizeSubmit}
        onCancel={() => setAuthorizeModalVisible(false)}
      >
        <p>即将为店铺 <strong>{selectedShop?.name}</strong> 进行授权操作。</p>
        <p style={{ color: '#999' }}>
          在生产环境中，这将跳转到相应平台的授权页面。
        </p>
      </Modal>
    </div>
  );
};

export default ShopManagement;