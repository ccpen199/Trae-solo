import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, message, Popconfirm, Tabs, Card, Row, Col, InputNumber } from 'antd';
import { PlusOutlined, SyncOutlined, DeleteOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { productsAPI, shopsAPI } from '../services/api';

interface SKU {
  id: number;
  sku_code: string;
  attributes: any;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  platform_skus: any;
}

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  brand: string;
  images: string[];
  attributes: any;
  status: string;
  skus?: SKU[];
  created_at: string;
}

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [skuModalVisible, setSkuModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [skuForm] = Form.useForm();
  const [shops, setShops] = useState<any[]>([]);

  useEffect(() => {
    loadProducts();
    loadShops();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data.products);
    } catch (error) {
      message.error('加载商品失败');
    } finally {
      setLoading(false);
    }
  };

  const loadShops = async () => {
    try {
      const response = await shopsAPI.getAll({ status: 'active' });
      setShops(response.data.shops);
    } catch (error) {
      console.error('Failed to load shops');
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue(product);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, values);
        message.success('更新成功');
      } else {
        await productsAPI.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadProducts();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await productsAPI.delete(id);
      message.success('删除成功');
      loadProducts();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handlePublish = async (product: Product) => {
    try {
      const platforms = shops.map(s => s.platform);
      const uniquePlatforms = [...new Set(platforms)];
      const response = await productsAPI.publish(product.id, uniquePlatforms);
      message.success(`商品已发布至 ${uniquePlatforms.length} 个平台`);
    } catch (error) {
      message.error('发布失败');
    }
  };

  const handleAddSKU = (product: Product) => {
    setSelectedProduct(product);
    skuForm.resetFields();
    setSkuModalVisible(true);
  };

  const handleSKUSubmit = async () => {
    try {
      const values = await skuForm.validateFields();
      values.product_id = selectedProduct!.id;
      await fetch('/api/skus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(values)
      });
      message.success('SKU添加成功');
      setSkuModalVisible(false);
      loadProducts();
    } catch (error) {
      message.error('添加失败');
    }
  };

  const columns: ColumnsType<Product> = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.category}</div>
        </div>
      )
    },
    {
      title: '品牌',
      dataIndex: 'brand',
      key: 'brand'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          active: { color: 'success', text: '已上架' },
          inactive: { color: 'default', text: '已下架' },
          draft: { color: 'processing', text: '草稿' }
        };
        const { color, text } = statusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'SKU数量',
      key: 'sku_count',
      render: (_, record) => record.skus?.length || 0
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
          <Button type="link" size="small" onClick={() => handleAddSKU(record)}>
            添加SKU
          </Button>
          <Button type="link" size="small" icon={<UploadOutlined />} onClick={() => handlePublish(record)}>
            发布
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="确定删除该商品?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const skuColumns: ColumnsType<SKU> = [
    {
      title: 'SKU编码',
      dataIndex: 'sku_code',
      key: 'sku_code'
    },
    {
      title: '属性',
      dataIndex: 'attributes',
      key: 'attributes',
      render: (attrs: any) => JSON.stringify(attrs)
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `$${price.toFixed(2)}`
    },
    {
      title: '成本',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost: number) => `$${cost.toFixed(2)}`
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number, record: SKU) => (
        <span style={{ color: stock < record.min_stock ? '#f5222d' : 'inherit' }}>
          {stock}
        </span>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>商品管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加商品
        </Button>
      </div>

      <Tabs
        items={[{
          key: 'list',
          label: '商品列表',
          children: (
            <Table
              columns={columns}
              dataSource={products}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ padding: '0 0 0 40px' }}>
                    <h4>SKU列表</h4>
                    <Table
                      columns={skuColumns}
                      dataSource={record.skus || []}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  </div>
                )
              }}
            />
          )
        }]}
      />

      <Modal
        title={editingProduct ? '编辑商品' : '添加商品'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="商品名称" rules={[{ required: true, message: '请输入商品名称' }]}>
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          <Form.Item name="description" label="商品描述">
            <Input.TextArea rows={3} placeholder="请输入商品描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="分类">
                <Input placeholder="请输入分类" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="brand" label="品牌">
                <Input placeholder="请输入品牌" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="添加SKU"
        open={skuModalVisible}
        onOk={handleSKUSubmit}
        onCancel={() => setSkuModalVisible(false)}
      >
        <Form form={skuForm} layout="vertical">
          <Form.Item name="price" label="价格" rules={[{ required: true, message: '请输入价格' }]}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="cost" label="成本" rules={[{ required: true, message: '请输入成本' }]}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="stock" label="库存">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="min_stock" label="最低库存预警">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductManagement;