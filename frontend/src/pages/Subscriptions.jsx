import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Tag, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { Option } = Select;

function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [form] = Form.useForm();
  const [addressForm] = Form.useForm();

  useEffect(() => {
    loadSubscriptions();
    loadProducts();
  }, []);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await api.get('/subscriptions/my');
        setSubscriptions(response.data.subscriptions);
      }
    } catch (error) {
      console.error('加载订阅失败', error);
    }
    setLoading(false);
  };

  const loadProducts = async () => {
    try {
      const response = await api.get('/products', { params: { category: 'newspaper,magazine', limit: 100 } });
      setProducts(response.data.products);
    } catch (error) {
      console.error('加载商品失败', error);
    }
  };

  const handleCreate = async (values) => {
    try {
      await api.post('/subscriptions', values);
      message.success('订阅成功');
      setModalVisible(false);
      form.resetFields();
      loadSubscriptions();
    } catch (error) {
      message.error(error.response?.data?.error || '订阅失败');
    }
  };

  const handleRenew = async (id) => {
    try {
      await api.put(`/subscriptions/${id}/renew`, { months: 12 });
      message.success('续订成功');
      loadSubscriptions();
    } catch (error) {
      message.error('续订失败');
    }
  };

  const handleAddressChange = async (values) => {
    try {
      await api.post(`/subscriptions/${selectedSubscription.id}/change-address`, values);
      message.success('地址变更申请已提交，等待审批');
      setAddressModalVisible(false);
      addressForm.resetFields();
      loadSubscriptions();
    } catch (error) {
      message.error('申请失败');
    }
  };

  const validateAddress = async (_, value) => {
    if (value) {
      try {
        const response = await api.post('/subscriptions/validate-address', { address: value });
        if (!response.data.valid) {
          return Promise.reject(new Error('地址不完整，请包含省市区街道门牌号'));
        }
      } catch (error) {
        console.error('地址校验失败', error);
      }
    }
    return Promise.resolve();
  };

  const columns = [
    { title: '订阅商品', dataIndex: 'product_name', key: 'product_name' },
    { title: '分类', dataIndex: 'category', key: 'category', render: (cat) => {
      const categories = { newspaper: '报刊', magazine: '杂志' };
      return categories[cat] || cat;
    }},
    { title: '投递地址', dataIndex: 'delivery_address', key: 'delivery_address', ellipsis: true },
    { title: '开始日期', dataIndex: 'start_date', key: 'start_date' },
    { title: '结束日期', dataIndex: 'end_date', key: 'end_date', render: (date) => date || '长期' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status) => (
      <Tag color={status === 'active' ? 'green' : 'default'}>
        {status === 'active' ? '生效中' : '已暂停'}
      </Tag>
    )},
    { title: '自动续订', dataIndex: 'auto_renew', key: 'auto_renew', render: (renew) => (
      renew ? <Tag color="blue">是</Tag> : '否'
    )},
    { title: '操作', key: 'action', render: (_, record) => (
      <Space>
        <Button 
          size="small" 
          icon={<EditOutlined />}
          onClick={() => {
            setSelectedSubscription(record);
            addressForm.setFieldsValue({ new_address: record.delivery_address });
            setAddressModalVisible(true);
          }}
        >
          修改地址
        </Button>
        <Popconfirm title="确定续订一年吗？" onConfirm={() => handleRenew(record.id)}>
          <Button size="small" icon={<ReloadOutlined />} type="primary">续订</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>我的订阅</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新建订阅
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={subscriptions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="新建订阅"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="product_id" label="选择报刊/杂志" rules={[{ required: true }]}>
            <Select>
              {products.filter(p => p.category === 'newspaper' || p.category === 'magazine').map(product => (
                <Option key={product.id} value={product.id}>{product.name} - ¥{product.price}/年</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="delivery_address" label="投递地址" rules={[{ required: true }, { validator: validateAddress }]}>
            <Input.TextArea rows={3} placeholder="请输入详细地址，包含省市区街道门牌号" />
          </Form.Item>
          <Form.Item name="delivery_phone" label="联系电话" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="start_date" label="开始日期" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>确认订阅</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="修改投递地址"
        open={addressModalVisible}
        onCancel={() => setAddressModalVisible(false)}
        footer={null}
      >
        <Form form={addressForm} layout="vertical" onFinish={handleAddressChange}>
          <Form.Item name="new_address" label="新地址" rules={[{ required: true }, { validator: validateAddress }]}>
            <Input.TextArea rows={3} placeholder="请输入详细地址，包含省市区街道门牌号" />
          </Form.Item>
          <div style={{ color: '#999', fontSize: 12, marginBottom: 16 }}>
            提示：地址变更需要管理员审批，审批通过后生效
          </div>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>提交申请</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Subscriptions;
