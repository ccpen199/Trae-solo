import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Tag,
  Popconfirm,
  Image,
  Tabs,
  Statistic,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  StockOutlined,
  EyeOutlined,
  ShopOutlined
} from '@ant-design/icons';
import { inventoryApi } from '../api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { TextArea } = Input;

function Inventory() {
  const [activeTab, setActiveTab] = useState('list');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [stockForm] = Form.useForm();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await inventoryApi.getList(100, 0);
      if (result.success) {
        setProducts(result.data.list || []);
      }
    } catch (error) {
      message.error('加载商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values) => {
    try {
      const result = await inventoryApi.create({
        name: values.name,
        description: values.description,
        price: values.price,
        originalPrice: values.originalPrice || values.price,
        imageUrl: values.imageUrl,
        stock: values.stock || 0,
        status: 'active'
      });

      if (result.success) {
        message.success('商品创建成功');
        setCreateModalVisible(false);
        form.resetFields();
        loadProducts();
      }
    } catch (error) {
      message.error('创建商品失败');
    }
  };

  const handleEdit = async (values) => {
    if (!selectedProduct) return;

    try {
      const result = await inventoryApi.update(selectedProduct.id, {
        name: values.name,
        description: values.description,
        price: values.price,
        originalPrice: values.originalPrice,
        imageUrl: values.imageUrl,
        status: values.status
      });

      if (result.success) {
        message.success('商品更新成功');
        setEditModalVisible(false);
        loadProducts();
      }
    } catch (error) {
      message.error('更新商品失败');
    }
  };

  const handleAddStock = async (values) => {
    if (!selectedProduct) return;

    try {
      const result = await inventoryApi.addStock(
        selectedProduct.id,
        values.quantity,
        values.reason || '补充库存'
      );

      if (result.success) {
        message.success('库存添加成功');
        setStockModalVisible(false);
        stockForm.resetFields();
        loadProducts();
      }
    } catch (error) {
      message.error('添加库存失败');
    }
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    editForm.setFieldsValue({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.original_price,
      imageUrl: product.image_url,
      status: product.status
    });
    setEditModalVisible(true);
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setStockModalVisible(true);
  };

  const columns = [
    {
      title: '商品',
      key: 'product',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {record.image_url && (
            <Image
              src={record.image_url}
              width={60}
              height={60}
              style={{ objectFit: 'cover', borderRadius: 4 }}
            />
          )}
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <div style={{ color: '#666', fontSize: 12 }}>
              {record.description?.substring(0, 50) || '-'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '价格',
      key: 'price',
      render: (_, record) => (
        <div>
          <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: 16 }}>
            ¥{record.price?.toFixed(2) || '0.00'}
          </span>
          {record.original_price && record.original_price > record.price && (
            <span style={{ color: '#999', textDecoration: 'line-through', marginLeft: 8 }}>
              ¥{record.original_price?.toFixed(2)}
            </span>
          )}
        </div>
      ),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock) => (
        <span style={{ 
          color: stock > 100 ? '#52c41a' : stock > 10 ? '#1890ff' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {stock || 0}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let text = status;
        
        if (status === 'active') {
          color = 'green';
          text = '上架中';
        } else if (status === 'inactive') {
          color = 'default';
          text = '已下架';
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<StockOutlined />} onClick={() => openStockModal(record)}>
            补货
          </Button>
        </>
      ),
    },
  ];

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    totalStock: products.reduce((sum, p) => sum + (p.stock || 0), 0),
    totalValue: products.reduce((sum, p) => sum + (p.stock || 0) * (p.price || 0), 0)
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>商品管理</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
        >
          添加商品
        </Button>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="商品总数"
              value={stats.total}
              prefix={<ShopOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="上架中"
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="总库存"
              value={stats.totalStock}
              prefix={<StockOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="库存价值"
              value={stats.totalValue}
              prefix="¥"
              precision={2}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 件商品`,
            showSizeChanger: true,
            showQuickJumper: true
          }}
        />
      </Card>

      <Modal
        title="添加商品"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => form.submit()}
        okText="创建"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ status: 'active' }}
        >
          <Form.Item
            name="name"
            label="商品名称"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="商品描述"
          >
            <TextArea rows={3} placeholder="请输入商品描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="售价"
                rules={[{ required: true, message: '请输入售价' }]}
              >
                <InputNumber
                  min={0.01}
                  step={0.01}
                  precision={2}
                  placeholder="请输入售价"
                  style={{ width: '100%' }}
                  prefix="¥"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="originalPrice"
                label="原价"
              >
                <InputNumber
                  min={0.01}
                  step={0.01}
                  precision={2}
                  placeholder="请输入原价"
                  style={{ width: '100%' }}
                  prefix="¥"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="stock"
                label="库存"
                rules={[{ required: true, message: '请输入库存' }]}
              >
                <InputNumber
                  min={0}
                  placeholder="请输入库存数量"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
              >
                <Select placeholder="选择状态">
                  <Select.Option value="active">上架</Select.Option>
                  <Select.Option value="inactive">下架</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="imageUrl"
            label="商品图片链接"
          >
            <Input placeholder="请输入商品图片链接" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑商品"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => editForm.submit()}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEdit}
        >
          <Form.Item
            name="name"
            label="商品名称"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="商品描述"
          >
            <TextArea rows={3} placeholder="请输入商品描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="售价"
                rules={[{ required: true, message: '请输入售价' }]}
              >
                <InputNumber
                  min={0.01}
                  step={0.01}
                  precision={2}
                  placeholder="请输入售价"
                  style={{ width: '100%' }}
                  prefix="¥"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="originalPrice"
                label="原价"
              >
                <InputNumber
                  min={0.01}
                  step={0.01}
                  precision={2}
                  placeholder="请输入原价"
                  style={{ width: '100%' }}
                  prefix="¥"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="status"
            label="状态"
          >
            <Select placeholder="选择状态">
              <Select.Option value="active">上架</Select.Option>
              <Select.Option value="inactive">下架</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label="商品图片链接"
          >
            <Input placeholder="请输入商品图片链接" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="补充库存"
        open={stockModalVisible}
        onCancel={() => setStockModalVisible(false)}
        onOk={() => stockForm.submit()}
        okText="确认"
        cancelText="取消"
      >
        {selectedProduct && (
          <div style={{ marginBottom: 16 }}>
            <p><strong>商品:</strong> {selectedProduct.name}</p>
            <p><strong>当前库存:</strong> {selectedProduct.stock}</p>
          </div>
        )}
        <Form
          form={stockForm}
          layout="vertical"
          onFinish={handleAddStock}
        >
          <Form.Item
            name="quantity"
            label="补充数量"
            rules={[{ required: true, message: '请输入补充数量' }]}
          >
            <InputNumber
              min={1}
              placeholder="请输入补充数量"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="备注原因"
          >
            <TextArea rows={2} placeholder="请输入备注原因（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Inventory;
