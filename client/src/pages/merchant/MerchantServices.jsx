import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Table,
  message,
  Tag,
  Typography,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Switch,
  Popconfirm,
  Image,
  Empty,
  Spin
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  AppstoreOutlined,
  EyeOutlined,
  HeartOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { serviceAPI } from '../../api/index.js';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

const CATEGORIES = [
  { value: 'photography', label: '婚纱摄影' },
  { value: 'emcee', label: '司仪主持' },
  { value: 'hotel', label: '婚宴酒店' },
  { value: 'wedding_dress', label: '婚纱礼服' }
];

const CATEGORY_COLORS = {
  photography: '#ff4d6d',
  emcee: '#722ed1',
  hotel: '#1890ff',
  wedding_dress: '#eb2f96'
};

const MerchantServices = () => {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [form] = Form.useForm();
  const [imageList, setImageList] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);

  useEffect(() => {
    fetchServices();
  }, [pagination.current]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await serviceAPI.list({
        page: pagination.current,
        pageSize: pagination.pageSize
      });
      setServices(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0
      }));
    } catch (error) {
      message.error('获取服务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingService(null);
    form.resetFields();
    setImageList([]);
    setTags([]);
    setTagInput('');
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingService(record);
    form.setFieldsValue({
      ...record,
      price: record.price / 100,
      original_price: record.original_price ? record.original_price / 100 : undefined
    });
    setImageList(record.images?.map((img, index) => ({
      uid: `-${index}`,
      name: `image-${index}`,
      status: 'done',
      url: img
    })) || []);
    setTags(record.tags || []);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await serviceAPI.delete(id);
      message.success('删除成功');
      fetchServices();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleToggleStatus = async (record) => {
    try {
      const newStatus = record.status === 1 ? 0 : 1;
      await serviceAPI.update(record.id, { status: newStatus });
      message.success(newStatus === 1 ? '上架成功' : '下架成功');
      fetchServices();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const images = imageList.filter(img => img.url || img.response).map(img => img.url || img.response);
      
      const data = {
        ...values,
        price: values.price * 100,
        original_price: values.original_price ? values.original_price * 100 : undefined,
        images,
        tags
      };

      if (editingService) {
        await serviceAPI.update(editingService.id, data);
        message.success('更新成功');
      } else {
        await serviceAPI.create(data);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchServices();
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      message.error(editingService ? '更新失败' : '创建失败');
    }
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const uploadProps = {
    listType: 'picture-card',
    fileList: imageList,
    onChange: ({ fileList }) => setImageList(fileList),
    beforeUpload: () => false,
    customRequest: ({ file, onSuccess }) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        onSuccess(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const columns = [
    {
      title: '服务信息',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {record.images?.[0] ? (
            <Image
              width={60}
              height={60}
              src={record.images[0]}
              style={{ borderRadius: 8, objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: 60,
              height: 60,
              borderRadius: 8,
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <InboxOutlined style={{ color: '#ccc' }} />
            </div>
          )}
          <Space direction="vertical" size={0}>
            <Text strong>{text}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description?.slice(0, 30)}{record.description?.length > 30 ? '...' : ''}
            </Text>
          </Space>
        </Space>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => {
        const cat = CATEGORIES.find(c => c.value === category);
        return (
          <Tag color={CATEGORY_COLORS[category]}>
            {cat?.label || category}
          </Tag>
        );
      }
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: '#ff4d6d', fontSize: 16 }}>
            ¥{(price / 100).toLocaleString()}
          </Text>
          {record.original_price && (
            <Text delete type="secondary" style={{ fontSize: 12 }}>
              ¥{(record.original_price / 100).toLocaleString()}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags) => (
        <Space wrap size={[4, 4]}>
          {tags?.slice(0, 3).map((tag, index) => (
            <Tag key={index} style={{ margin: 0 }}>{tag}</Tag>
          ))}
          {tags?.length > 3 && <Tag>...</Tag>}
        </Space>
      )
    },
    {
      title: '数据',
      key: 'stats',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space size={12}>
            <span><EyeOutlined style={{ color: '#1890ff' }} /> {record.view_count || 0}</span>
            <span><HeartOutlined style={{ color: '#ff4d6d' }} /> {record.like_count || 0}</span>
          </Space>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => (
        <Switch
          checked={status === 1}
          checkedChildren="上架"
          unCheckedChildren="下架"
          onChange={() => handleToggleStatus(record)}
        />
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该服务？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ marginBottom: 8, color: '#ff4d6d' }}>
            <AppstoreOutlined style={{ marginRight: 12 }} />
            服务管理
          </Title>
          <Text type="secondary">
            管理您的服务项目，发布、编辑或下架服务
          </Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{
            background: 'linear-gradient(135deg, #ff4d6d 0%, #ff7875 100%)',
            border: 'none',
            borderRadius: 8,
            height: 44,
            padding: '0 24px'
          }}
        >
          新增服务
        </Button>
      </div>

      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Spin spinning={loading}>
          {services.length > 0 ? (
            <Table
              columns={columns}
              dataSource={services}
              rowKey="id"
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条服务`,
                onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
              }}
              scroll={{ x: 900 }}
            />
          ) : (
            <Empty description="暂无服务，点击右上角新增服务" style={{ padding: '60px 0' }} />
          )}
        </Spin>
      </Card>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AppstoreOutlined style={{ color: '#ff4d6d' }} />
            {editingService ? '编辑服务' : '新增服务'}
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText="保存"
        cancelText="取消"
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col xs={24} sm={16}>
              <Form.Item
                name="name"
                label="服务名称"
                rules={[{ required: true, message: '请输入服务名称' }]}
              >
                <Input placeholder="请输入服务名称" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="category"
                label="服务分类"
                rules={[{ required: true, message: '请选择服务分类' }]}
              >
                <Select placeholder="请选择分类" size="large">
                  {CATEGORIES.map(cat => (
                    <Option key={cat.value} value={cat.value}>{cat.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="服务描述"
            rules={[{ required: true, message: '请输入服务描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述您的服务内容、特色等" size="large" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="price"
                label="现价（元）"
                rules={[{ required: true, message: '请输入现价' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入现价"
                  size="large"
                  min={0}
                  precision={2}
                  prefix="¥"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="original_price"
                label="原价（元）"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入原价（选填）"
                  size="large"
                  min={0}
                  precision={2}
                  prefix="¥"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="服务标签">
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space wrap size={[8, 8]}>
                {tags.map((tag, index) => (
                  <Tag
                    key={index}
                    closable
                    onClose={(e) => {
                      e.preventDefault();
                      handleRemoveTag(tag);
                    }}
                    style={{ fontSize: 13, padding: '4px 8px' }}
                  >
                    {tag}
                  </Tag>
                ))}
              </Space>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="输入标签后按回车添加"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onPressEnter={handleAddTag}
                  size="large"
                />
                <Button onClick={handleAddTag} size="large">添加</Button>
              </Space.Compact>
            </Space>
          </Form.Item>

          <Form.Item label="服务图片">
            <Dragger {...uploadProps} accept="image/*" multiple>
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ color: '#ff4d6d', fontSize: 48 }} />
              </p>
              <p className="ant-upload-text">点击或拖拽图片到此处上传</p>
              <p className="ant-upload-hint">支持 JPG、PNG 格式，建议上传 3-5 张高清图片</p>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MerchantServices;
