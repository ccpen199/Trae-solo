import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Upload,
  Modal,
  Form,
  Input,
  Select,
  message,
  Row,
  Col,
  Typography,
  Tag,
  Popconfirm,
  Image,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  PictureOutlined,
  PrinterOutlined,
  ScissorOutlined,
} from '@ant-design/icons';
import type { Portfolio, PortfolioType } from '../../types';
import { jobseeker } from '../../api/endpoints';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const categoryConfig: Record<PortfolioType, { label: string; icon: React.ReactNode; color: string }> = {
  prepress: { label: '印前设计', icon: <PictureOutlined />, color: 'blue' },
  printing: { label: '印刷过程', icon: <PrinterOutlined />, color: 'green' },
  postpress: { label: '印后工艺', icon: <ScissorOutlined />, color: 'orange' },
};

const PortfolioManager = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [editingItem, setEditingItem] = useState<Portfolio | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [thumbnailList, setThumbnailList] = useState<UploadFile[]>([]);
  const [activeCategory, setActiveCategory] = useState<PortfolioType | 'all'>('all');

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    setLoading(true);
    try {
      const response = await jobseeker.portfolio();
      setPortfolios(response.data || []);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setFileList([]);
    setThumbnailList([]);
    setModalVisible(true);
  };

  const handleEdit = (item: Portfolio) => {
    setEditingItem(item);
    form.setFieldsValue({
      title: item.title,
      description: item.description,
      type: item.type,
    });
    setFileList(item.fileUrl ? [{
      uid: '-1',
      name: 'file',
      status: 'done',
      url: item.fileUrl,
    }] : []);
    setThumbnailList(item.thumbnailUrl ? [{
      uid: '-2',
      name: 'thumbnail',
      status: 'done',
      url: item.thumbnailUrl,
    }] : []);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await jobseeker.deletePortfolio(id);
      message.success('删除成功');
      fetchPortfolios();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handlePreview = (item: Portfolio) => {
    setPreviewImage(item.thumbnailUrl || item.fileUrl);
    setPreviewVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('type', values.type);
      if (values.description) {
        formData.append('description', values.description);
      }
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('file', fileList[0].originFileObj);
      }
      if (thumbnailList.length > 0 && thumbnailList[0].originFileObj) {
        formData.append('thumbnail', thumbnailList[0].originFileObj);
      }
      await jobseeker.addPortfolio(formData);
      message.success(editingItem ? '更新成功' : '添加成功');
      setModalVisible(false);
      fetchPortfolios();
    } catch (error) {
      message.error('请检查表单填写是否正确');
    }
  };

  const fileUploadProps: UploadProps = {
    fileList,
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    beforeUpload: () => false,
    accept: 'image/*,.pdf',
    maxCount: 1,
  };

  const thumbnailUploadProps: UploadProps = {
    fileList: thumbnailList,
    onChange: ({ fileList: newFileList }) => setThumbnailList(newFileList),
    beforeUpload: () => false,
    accept: 'image/*',
    maxCount: 1,
  };

  const filteredPortfolios = activeCategory === 'all'
    ? portfolios
    : portfolios.filter(p => p.type === activeCategory);

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            作品集管理
          </Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            上传作品
          </Button>
        </Col>
      </Row>

      <Space style={{ marginBottom: '16px' }} wrap>
        <Button
          type={activeCategory === 'all' ? 'primary' : 'default'}
          onClick={() => setActiveCategory('all')}
        >
          全部
        </Button>
        {(Object.keys(categoryConfig) as PortfolioType[]).map(key => (
          <Button
            key={key}
            type={activeCategory === key ? 'primary' : 'default'}
            icon={categoryConfig[key].icon}
            onClick={() => setActiveCategory(key)}
          >
            {categoryConfig[key].label}
          </Button>
        ))}
      </Space>

      {loading ? (
        <Card loading />
      ) : filteredPortfolios.length === 0 ? (
        <Empty description="暂无作品，点击上方按钮上传您的第一个作品" />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredPortfolios.map(item => (
            <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
              <Card
                hoverable
                cover={
                  <div style={{ height: '180px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                    {item.thumbnailUrl || item.fileUrl ? (
                      <Image
                        src={item.thumbnailUrl || item.fileUrl}
                        alt={item.title}
                        height={180}
                        preview={false}
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ fontSize: '48px', color: '#d9d9d9' }}>
                        {categoryConfig[item.type].icon}
                      </div>
                    )}
                  </div>
                }
                actions={[
                  <EyeOutlined key="preview" onClick={() => handlePreview(item)} />,
                  <EditOutlined key="edit" onClick={() => handleEdit(item)} />,
                  <Popconfirm
                    title="确定要删除这个作品吗？"
                    onConfirm={() => handleDelete(item.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <DeleteOutlined key="delete" />
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  title={item.title}
                  description={
                    <>
                      <Tag color={categoryConfig[item.type].color} style={{ marginBottom: '8px' }}>
                        {categoryConfig[item.type].icon} {categoryConfig[item.type].label}
                      </Tag>
                      <div style={{ color: '#666', fontSize: '12px' }}>
                        {item.description || '暂无描述'}
                      </div>
                    </>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={editingItem ? '编辑作品' : '上传作品'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText={editingItem ? '更新' : '上传'}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="作品标题"
            rules={[{ required: true, message: '请输入作品标题' }]}
          >
            <Input placeholder="请输入作品标题" />
          </Form.Item>
          <Form.Item
            name="type"
            label="作品分类"
            rules={[{ required: true, message: '请选择作品分类' }]}
          >
            <Select placeholder="请选择作品分类">
              {(Object.keys(categoryConfig) as PortfolioType[]).map(key => (
                <Option key={key} value={key}>
                  {categoryConfig[key].icon} {categoryConfig[key].label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label="作品描述"
          >
            <TextArea rows={3} placeholder="请描述您的作品，包括使用的工艺、设备、材料等" />
          </Form.Item>
          <Form.Item label="作品文件（图片/PDF）">
            <Upload {...fileUploadProps}>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              支持 JPG、PNG、PDF 格式，单个文件不超过 10MB
            </Text>
          </Form.Item>
          <Form.Item label="缩略图（可选）">
            <Upload {...thumbnailUploadProps}>
              <Button icon={<UploadOutlined />}>选择图片</Button>
            </Upload>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              用于列表展示，建议尺寸 400x300
            </Text>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={previewVisible}
        title="作品预览"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        {previewImage ? (
          <Image src={previewImage} alt="预览" style={{ width: '100%' }} />
        ) : (
          <Empty description="暂无预览图" />
        )}
      </Modal>
    </div>
  );
};

export default PortfolioManager;
