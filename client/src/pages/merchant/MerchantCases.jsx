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
  Spin,
  DatePicker
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  PictureOutlined,
  EyeOutlined,
  HeartOutlined,
  CalendarOutlined,
  DollarOutlined,
  InboxOutlined,
  VideoCameraOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { caseAPI, serviceAPI } from '../../api/index.js';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

const CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '西安', '重庆'];

const MerchantCases = () => {
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState([]);
  const [services, setServices] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [form] = Form.useForm();
  const [imageList, setImageList] = useState([]);
  const [videoList, setVideoList] = useState([]);
  const [coverImage, setCoverImage] = useState(null);

  useEffect(() => {
    fetchCases();
    fetchServices();
  }, [pagination.current]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const response = await caseAPI.list({
        page: pagination.current,
        pageSize: pagination.pageSize
      });
      setCases(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0
      }));
    } catch (error) {
      message.error('获取案例列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await serviceAPI.list({ pageSize: 100 });
      setServices(response.data.data || []);
    } catch (error) {
      message.error('获取服务列表失败');
    }
  };

  const handleAdd = () => {
    setEditingCase(null);
    form.resetFields();
    setImageList([]);
    setVideoList([]);
    setCoverImage(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCase(record);
    form.setFieldsValue({
      ...record,
      budget: record.budget ? record.budget / 100 : undefined,
      date: record.date ? dayjs(record.date) : undefined
    });
    setImageList(record.images?.map((img, index) => ({
      uid: `-${index}`,
      name: `image-${index}`,
      status: 'done',
      url: img
    })) || []);
    setVideoList(record.videos?.map((video, index) => ({
      uid: `-${index}`,
      name: `video-${index}`,
      status: 'done',
      url: video
    })) || []);
    setCoverImage(record.cover_image ? {
      uid: '-cover',
      name: 'cover',
      status: 'done',
      url: record.cover_image
    } : null);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await caseAPI.delete(id);
      message.success('删除成功');
      fetchCases();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleToggleStatus = async (record) => {
    try {
      const newStatus = record.status === 1 ? 0 : 1;
      await caseAPI.update(record.id, { status: newStatus });
      message.success(newStatus === 1 ? '已发布' : '已下架');
      fetchCases();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const images = imageList.filter(img => img.url || img.response).map(img => img.url || img.response);
      const videos = videoList.filter(v => v.url || v.response).map(v => v.url || v.response);
      const cover = coverImage?.url || coverImage?.response || images[0] || '';
      
      const data = {
        ...values,
        budget: values.budget ? values.budget * 100 : undefined,
        date: values.date ? values.date.format('YYYY-MM-DD') : undefined,
        cover_image: cover,
        images,
        videos
      };

      if (editingCase) {
        await caseAPI.update(editingCase.id, data);
        message.success('更新成功');
      } else {
        await caseAPI.create(data);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchCases();
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      message.error(editingCase ? '更新失败' : '创建失败');
    }
  };

  const imageUploadProps = {
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

  const coverUploadProps = {
    listType: 'picture-card',
    fileList: coverImage ? [coverImage] : [],
    onChange: ({ fileList }) => setCoverImage(fileList[0] || null),
    beforeUpload: () => false,
    customRequest: ({ file, onSuccess }) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        onSuccess(e.target.result);
      };
      reader.readAsDataURL(file);
    },
    maxCount: 1
  };

  const videoUploadProps = {
    listType: 'text',
    fileList: videoList,
    onChange: ({ fileList }) => setVideoList(fileList),
    beforeUpload: () => false,
    customRequest: ({ file, onSuccess }) => {
      const url = URL.createObjectURL(file);
      onSuccess(url);
    }
  };

  const columns = [
    {
      title: '封面',
      dataIndex: 'cover_image',
      key: 'cover_image',
      width: 100,
      render: (cover) => (
        cover ? (
          <Image
            width={60}
            height={60}
            src={cover}
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
        )
      )
    },
    {
      title: '案例信息',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.description?.slice(0, 40)}{record.description?.length > 40 ? '...' : ''}
          </Text>
          {record.service_name && (
            <Tag color="blue" style={{ marginTop: 4, width: 'fit-content' }}>
              {record.service_name}
            </Tag>
          )}
        </Space>
      )
    },
    {
      title: '图片',
      dataIndex: 'images',
      key: 'images',
      width: 80,
      render: (images) => (
        <Tag>{images?.length || 0} 张</Tag>
      )
    },
    {
      title: '预算',
      dataIndex: 'budget',
      key: 'budget',
      width: 120,
      render: (budget) => (
        budget ? (
          <Text strong style={{ color: '#1890ff' }}>
            ¥{(budget / 100).toLocaleString()}
          </Text>
        ) : <Text type="secondary">-</Text>
      )
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date) => date || '-'
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 100,
      render: (city) => city || '-'
    },
    {
      title: '数据',
      key: 'stats',
      width: 120,
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
          checkedChildren="发布"
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
            title="确定删除该案例？"
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
            <PictureOutlined style={{ marginRight: 12 }} />
            案例管理
          </Title>
          <Text type="secondary">
            管理您的婚礼案例，上传真实案例展示实力
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
          新增案例
        </Button>
      </div>

      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Spin spinning={loading}>
          {cases.length > 0 ? (
            <Table
              columns={columns}
              dataSource={cases}
              rowKey="id"
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 个案例`,
                onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
              }}
              scroll={{ x: 1100 }}
            />
          ) : (
            <Empty description="暂无案例，点击右上角新增案例" style={{ padding: '60px 0' }} />
          )}
        </Spin>
      </Card>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PictureOutlined style={{ color: '#ff4d6d' }} />
            {editingCase ? '编辑案例' : '新增案例'}
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText="保存"
        cancelText="取消"
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col xs={24} sm={16}>
              <Form.Item
                name="title"
                label="案例标题"
                rules={[{ required: true, message: '请输入案例标题' }]}
              >
                <Input placeholder="请输入案例标题，如：浪漫海滨婚礼" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="service_id"
                label="关联服务"
              >
                <Select placeholder="选择关联服务（选填）" size="large" allowClear>
                  {services.map(service => (
                    <Option key={service.id} value={service.id}>{service.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="案例描述"
            rules={[{ required: true, message: '请输入案例描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述婚礼案例的故事、特色、亮点等" size="large" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="budget"
                label="预算（元）"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="婚礼预算"
                  size="large"
                  min={0}
                  precision={2}
                  prefix="¥"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="date"
                label="婚礼日期"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="选择日期"
                  size="large"
                  suffixIcon={<CalendarOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="city"
                label="城市"
              >
                <Select placeholder="选择城市" size="large" allowClear>
                  {CITIES.map(city => (
                    <Option key={city} value={city}>{city}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="封面图片">
            <Upload {...coverUploadProps} accept="image/*">
              <div style={{ width: 120, height: 120, border: '1px dashed #d9d9d9', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <UploadOutlined style={{ color: '#ff4d6d', fontSize: 28 }} />
                <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>上传封面</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item label="案例图片">
            <Dragger {...imageUploadProps} accept="image/*" multiple>
              <p className="ant-upload-drag-icon">
                <PictureOutlined style={{ color: '#ff4d6d', fontSize: 48 }} />
              </p>
              <p className="ant-upload-text">点击或拖拽图片到此处上传</p>
              <p className="ant-upload-hint">支持 JPG、PNG 格式，建议上传高清婚礼现场图片</p>
            </Dragger>
          </Form.Item>

          <Form.Item label="视频链接">
            <Upload {...videoUploadProps} accept="video/*" multiple>
              <Button icon={<VideoCameraOutlined />} size="large">
                上传视频
              </Button>
            </Upload>
            {videoList.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {videoList.map((video, index) => (
                  <div key={index} style={{ color: '#666', fontSize: 12 }}>
                    {video.name}
                  </div>
                ))}
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MerchantCases;
