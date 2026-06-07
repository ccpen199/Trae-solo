import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Select, message, Tag } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api from '../../utils/api';

const { Option } = Select;
const { TextArea } = Form.Item;

function ContentReview() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/products/review');
      setProducts(response.data.products);
    } catch (error) {
      console.error('加载待审核商品失败', error);
    }
    setLoading(false);
  };

  const handleReview = (product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleSubmitReview = async (values) => {
    try {
      await api.post(`/admin/products/${selectedProduct.id}/review`, values);
      message.success('审核完成');
      setModalVisible(false);
      form.resetFields();
      loadProducts();
    } catch (error) {
      message.error('审核失败');
    }
  };

  const columns = [
    { title: '商品ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '商品名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    { title: '价格', dataIndex: 'price', key: 'price', render: (val) => `¥${val}` },
    { title: '库存', dataIndex: 'stock', key: 'stock' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status) => (
      <Tag color={status === 'pending' ? 'orange' : status === 'approved' ? 'green' : 'red'}>
        {status === 'pending' ? '待审核' : status === 'approved' ? '已通过' : '已拒绝'}
      </Tag>
    )},
    { title: '审核意见', dataIndex: 'comments', key: 'comments' },
    { title: '操作', key: 'action', render: (_, record) => (
      <Button type="primary" size="small" onClick={() => handleReview(record)}>
        审核
      </Button>
    )},
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>内容审核中心</h1>
      <Card>
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="商品审核"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        {selectedProduct && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h4>{selectedProduct.name}</h4>
              <p>{selectedProduct.description}</p>
            </div>
            <Form form={form} layout="vertical" onFinish={handleSubmitReview}>
              <Form.Item name="status" label="审核结果" rules={[{ required: true }]}>
                <Select>
                  <Option value="approved">通过</Option>
                  <Option value="rejected">拒绝</Option>
                </Select>
              </Form.Item>
              <Form.Item name="comments" label="审核意见">
                <TextArea rows={3} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                  提交审核
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ContentReview;
