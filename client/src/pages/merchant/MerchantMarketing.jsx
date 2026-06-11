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
  DatePicker,
  Badge
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  GiftOutlined,
  CalendarOutlined,
  PercentageOutlined,
  ClockCircleOutlined,
  InboxOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { marketingAPI } from '../../api/index.js';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const ACTIVITY_TYPES = [
  { value: 'discount', label: '折扣优惠', icon: <PercentageOutlined /> },
  { value: 'gift', label: '赠品活动', icon: <GiftOutlined /> },
  { value: 'package', label: '套餐优惠', icon: <GiftOutlined /> },
  { value: 'limited', label: '限时特惠', icon: <ClockCircleOutlined /> }
];

const ACTIVITY_TYPE_CONFIG = {
  discount: { label: '折扣优惠', color: 'red', icon: <PercentageOutlined /> },
  gift: { label: '赠品活动', color: 'green', icon: <GiftOutlined /> },
  package: { label: '套餐优惠', color: 'blue', icon: <GiftOutlined /> },
  limited: { label: '限时特惠', color: 'orange', icon: <ClockCircleOutlined /> }
};

const CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '西安', '重庆'];

const MerchantMarketing = () => {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [form] = Form.useForm();
  const [coverImage, setCoverImage] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, [pagination.current]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await marketingAPI.list({
        page: pagination.current,
        pageSize: pagination.pageSize
      });
      setActivities(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0
      }));
    } catch (error) {
      message.error('获取活动列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getActivityStatus = (activity) => {
    const now = dayjs();
    const startDate = dayjs(activity.start_date);
    const endDate = dayjs(activity.end_date);

    if (now.isBefore(startDate)) {
      return { text: '即将开始', color: 'blue', days: startDate.diff(now, 'day') };
    } else if (now.isAfter(endDate)) {
      return { text: '已结束', color: 'default', days: 0 };
    } else {
      return { text: '进行中', color: 'success', days: endDate.diff(now, 'day') };
    }
  };

  const handleAdd = () => {
    setEditingActivity(null);
    form.resetFields();
    setCoverImage(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingActivity(record);
    form.setFieldsValue({
      ...record,
      dateRange: [dayjs(record.start_date), dayjs(record.end_date)],
      discount: record.discount ? record.discount * 10 : undefined
    });
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
      await marketingAPI.delete(id);
      message.success('删除成功');
      fetchActivities();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleToggleStatus = async (record) => {
    try {
      const newStatus = record.status === 1 ? 0 : 1;
      await marketingAPI.update(record.id, { status: newStatus });
      message.success(newStatus === 1 ? '已上架' : '已下架');
      fetchActivities();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const cover = coverImage?.url || coverImage?.response || '';
      
      const data = {
        ...values,
        start_date: values.dateRange[0].format('YYYY-MM-DD'),
        end_date: values.dateRange[1].format('YYYY-MM-DD'),
        discount: values.discount ? values.discount / 10 : undefined,
        cover_image: cover
      };

      delete data.dateRange;

      if (editingActivity) {
        await marketingAPI.update(editingActivity.id, data);
        message.success('更新成功');
      } else {
        await marketingAPI.create(data);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchActivities();
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      message.error(editingActivity ? '更新失败' : '创建失败');
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
            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <GiftOutlined style={{ color: '#fff', fontSize: 24 }} />
          </div>
        )
      )
    },
    {
      title: '活动信息',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => {
        const typeConfig = ACTIVITY_TYPE_CONFIG[record.activity_type];
        const status = getActivityStatus(record);
        return (
          <Space direction="vertical" size={0}>
            <Space size={8}>
              <Text strong>{text}</Text>
              <Tag color={typeConfig?.color}>
                {typeConfig?.icon} {typeConfig?.label}
              </Tag>
              <Badge status={status.color === 'success' ? 'success' : status.color === 'default' ? 'default' : 'processing'} text={status.text} />
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description?.slice(0, 50)}{record.description?.length > 50 ? '...' : ''}
            </Text>
          </Space>
        );
      }
    },
    {
      title: '活动时间',
      key: 'date',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {record.start_date}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            至 {record.end_date}
          </Text>
        </Space>
      )
    },
    {
      title: '优惠内容',
      key: 'offer',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.discount && (
            <Tag color="red">
              <PercentageOutlined /> {Math.round(record.discount * 10)} 折
            </Tag>
          )}
          {record.gift && (
            <Tag color="green">
              <GiftOutlined /> {record.gift}
            </Tag>
          )}
        </Space>
      )
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 100,
      render: (city) => city || '-'
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
            title="确定删除该活动？"
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
            <GiftOutlined style={{ marginRight: 12 }} />
            营销活动
          </Title>
          <Text type="secondary">
            创建营销活动，吸引更多客户
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
          新增活动
        </Button>
      </div>

      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Spin spinning={loading}>
          {activities.length > 0 ? (
            <Table
              columns={columns}
              dataSource={activities}
              rowKey="id"
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 个活动`,
                onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
              }}
              scroll={{ x: 1100 }}
            />
          ) : (
            <Empty description="暂无活动，点击右上角新增活动" style={{ padding: '60px 0' }} />
          )}
        </Spin>
      </Card>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GiftOutlined style={{ color: '#ff4d6d' }} />
            {editingActivity ? '编辑活动' : '新增活动'}
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
                name="title"
                label="活动标题"
                rules={[{ required: true, message: '请输入活动标题' }]}
              >
                <Input placeholder="请输入活动标题，如：520特惠全场8折" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="activity_type"
                label="活动类型"
                rules={[{ required: true, message: '请选择活动类型' }]}
              >
                <Select placeholder="选择类型" size="large">
                  {ACTIVITY_TYPES.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="活动描述"
            rules={[{ required: true, message: '请输入活动描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述活动内容、参与条件、使用规则等" size="large" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="dateRange"
                label="活动时间"
                rules={[{ required: true, message: '请选择活动时间' }]}
              >
                <RangePicker
                  style={{ width: '100%' }}
                  size="large"
                  placeholder={['开始日期', '结束日期']}
                  suffixIcon={<CalendarOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="city"
                label="适用城市"
              >
                <Select placeholder="选择城市（选填）" size="large" allowClear>
                  {CITIES.map(city => (
                    <Option key={city} value={city}>{city}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="discount"
                label="折扣力度（折）"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="输入折扣，如：8 表示8折"
                  size="large"
                  min={0.1}
                  max={9.9}
                  step={0.1}
                  precision={1}
                  suffix="折"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="gift"
                label="赠品内容"
              >
                <Input placeholder="赠品内容，如：赠送精美相册" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="活动封面">
            <Upload {...coverUploadProps} accept="image/*">
              <div style={{ width: 120, height: 120, border: '1px dashed #d9d9d9', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <UploadOutlined style={{ color: '#ff4d6d', fontSize: 28 }} />
                <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>上传封面</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MerchantMarketing;
