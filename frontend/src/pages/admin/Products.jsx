import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Tag, Modal, Form, Input, InputNumber, Switch, Upload, Image, message, Spin, Popconfirm, Select, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, ArrowDownOutlined, UploadOutlined, InboxOutlined } from '@ant-design/icons';
import { getAdminProducts, createProduct, updateProduct } from '../../api/admin';

const { Option } = Select;
const { Dragger } = Upload;

const Products = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getAdminProducts();
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'active',
      category: 'daily',
      stock: 0,
      points: 0
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingProduct(record);
    form.setFieldsValue({
      ...record,
      image: [{ url: record.image }]
    });
    setModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      const formData = {
        ...values,
        image: values.image?.[0]?.url || values.image || ''
      };
      delete formData.image;

      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        message.success('商品更新成功');
      } else {
        await createProduct(formData);
        message.success('商品创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (err) {
      console.error(err);
      message.error('保存失败');
    }
  };

  const handleOffline = async (id) => {
    try {
      await updateProduct(id, { status: 'inactive' });
      message.success('商品已下架');
      loadData();
    } catch (err) {
      console.error(err);
      message.error('操作失败');
    }
  };

  const handleOnline = async (id) => {
    try {
      await updateProduct(id, { status: 'active' });
      message.success('商品已上架');
      loadData();
    } catch (err) {
      console.error(err);
      message.error('操作失败');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      active: { color: 'green', text: '上架中' },
      inactive: { color: 'default', text: '已下架' },
      out_of_stock: { color: 'red', text: '缺货' }
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getCategoryTag = (category) => {
    const categoryMap = {
      daily: { color: 'blue', text: '日常用品' },
      food: { color: 'orange', text: '食品饮料' },
      digital: { color: 'purple', text: '数码产品' },
      fashion: { color: 'pink', text: '时尚美妆' },
      transport: { color: 'green', text: '交通出行' },
      other: { color: 'default', text: '其他' }
    };
    const config = categoryMap[category] || { color: 'default', text: category };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '商品图片',
      dataIndex: 'image',
      key: 'image',
      width: 100,
      render: (image) => (
        <Image
          width={50}
          height={50}
          src={image}
          fallback="https://via.placeholder.com/50"
          style={{ borderRadius: 4 }}
        />
      )
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => getCategoryTag(category)
    },
    {
      title: '所需积分',
      dataIndex: 'points',
      key: 'points',
      width: 120,
      render: (points) => <span style={{ color: '#fa8c16', fontWeight: 500 }}>{points} 积分</span>
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      render: (stock) => (
        <span style={{ color: stock < 10 ? '#f5222d' : undefined }}>{stock}</span>
      )
    },
    {
      title: '已兑换',
      dataIndex: 'exchanged_count',
      key: 'exchanged_count',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => {
        if (record.stock <= 0 && status === 'active') {
          return <Tag color="red">缺货</Tag>;
        }
        return getStatusTag(status);
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.status === 'active' ? (
            <Popconfirm
              title="确定要下架该商品吗？"
              onConfirm={() => handleOffline(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger icon={<ArrowDownOutlined />}>下架</Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="确定要上架该商品吗？"
              onConfirm={() => handleOnline(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" icon={<PlusOutlined />}>上架</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const uploadProps = {
    name: 'file',
    multiple: false,
    maxCount: 1,
    beforeUpload: () => false,
    listType: 'picture-card'
  };

  return (
    <div className="admin-products">
      <Card bordered={false}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 500, fontSize: 16 }}>积分商品列表</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增商品
          </Button>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
            scroll={{ x: 1100 }}
          />
        </Spin>
      </Card>

      <Modal
        title={editingProduct ? '编辑商品' : '新增商品'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{ category: 'daily', status: 'active', stock: 0, points: 0 }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="image"
                label="商品图片"
                valuePropName="fileList"
                getValueFromEvent={(e) => {
                  if (Array.isArray(e)) return e;
                  return e?.fileList;
                }}
              >
                <Upload {...uploadProps}>
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>上传图片</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="name"
                label="商品名称"
                rules={[{ required: true, message: '请输入商品名称' }]}
              >
                <Input placeholder="请输入商品名称" maxLength={100} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="category"
                label="商品分类"
                rules={[{ required: true, message: '请选择商品分类' }]}
              >
                <Select>
                  <Option value="daily">日常用品</Option>
                  <Option value="food">食品饮料</Option>
                  <Option value="digital">数码产品</Option>
                  <Option value="fashion">时尚美妆</Option>
                  <Option value="transport">交通出行</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="points"
                label="所需积分"
                rules={[{ required: true, message: '请输入所需积分' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="stock"
                label="库存数量"
                rules={[{ required: true, message: '请输入库存数量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="状态"
                valuePropName="checked"
              >
                <Switch checkedChildren="上架" unCheckedChildren="下架" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="description"
            label="商品描述"
          >
            <Input.TextArea rows={4} placeholder="请输入商品描述" maxLength={500} showCount />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;
