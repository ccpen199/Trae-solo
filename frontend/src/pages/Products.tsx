import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Tag, Space, Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { QualificationProduct, getProducts, createProduct } from '../api/products';

const { Option } = Select;

const Products: React.FC = () => {
  const [products, setProducts] = useState<QualificationProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<QualificationProduct | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      message.error('加载产品列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await createProduct({
        ...values,
        isActive: true
      });
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadProducts();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const columns = [
    { title: '产品名称', dataIndex: 'name', key: 'name' },
    { title: '资质类型', dataIndex: 'qualificationType', key: 'qualificationType' },
    { title: '办理地区', dataIndex: 'region', key: 'region' },
    { title: '预计周期', dataIndex: 'estimatedCycle', key: 'estimatedCycle', render: (days: number) => `${days}天` },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => price ? `¥${price.toLocaleString()}` : '-'
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? '启用' : '停用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: QualificationProduct) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => {
            setSelectedProduct(record);
            setDetailVisible(true);
          }}>
            详情
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>资质产品库</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          添加产品
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title="添加资质产品"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="产品名称" rules={[{ required: true }]}>
            <Input placeholder="请输入产品名称" />
          </Form.Item>
          <Form.Item name="qualificationType" label="资质类型" rules={[{ required: true }]}>
            <Select placeholder="请选择资质类型">
              <Option value="施工总承包">施工总承包</Option>
              <Option value="专业承包">专业承包</Option>
              <Option value="设计资质">设计资质</Option>
              <Option value="监理资质">监理资质</Option>
            </Select>
          </Form.Item>
          <Form.Item name="region" label="办理地区" rules={[{ required: true }]}>
            <Input placeholder="请输入办理地区" />
          </Form.Item>
          <Form.Item name="estimatedCycle" label="预计周期(天)" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入预计周期" />
          </Form.Item>
          <Form.Item name="price" label="价格(元)">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入价格" />
          </Form.Item>
          <Form.Item name="description" label="产品描述">
            <Input.TextArea rows={4} placeholder="请输入产品描述" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="产品详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedProduct && (
          <div>
            <p><strong>产品名称：</strong>{selectedProduct.name}</p>
            <p><strong>资质类型：</strong>{selectedProduct.qualificationType}</p>
            <p><strong>办理地区：</strong>{selectedProduct.region}</p>
            <p><strong>预计周期：</strong>{selectedProduct.estimatedCycle}天</p>
            <p><strong>价格：</strong>{selectedProduct.price ? `¥${selectedProduct.price.toLocaleString()}` : '-'}</p>
            <p><strong>产品描述：</strong>{selectedProduct.description || '-'}</p>
            
            <h4 style={{ marginTop: 16 }}>人员要求</h4>
            {selectedProduct.personnelRequirements?.length > 0 ? (
              <ul>
                {selectedProduct.personnelRequirements.map((req: any) => (
                  <li key={req.id}>{req.certificateType} - {req.count}人</li>
                ))}
              </ul>
            ) : <p>暂无人员要求</p>}

            <h4 style={{ marginTop: 16 }}>材料清单</h4>
            {selectedProduct.materialTemplates?.length > 0 ? (
              <ul>
                {selectedProduct.materialTemplates.map((mat: any) => (
                  <li key={mat.id}>
                    {mat.name}
                    {mat.isRequired && <Tag color="red" style={{ marginLeft: 8 }}>必填</Tag>}
                  </li>
                ))}
              </ul>
            ) : <p>暂无材料清单</p>}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Products;
