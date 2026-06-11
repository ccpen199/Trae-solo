import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Row,
  Col,
  Descriptions,
  Image,
  Empty,
  Popconfirm,
  Drawer,
  Rate,
  List,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  FileTextOutlined,
  StarOutlined,
  CalendarOutlined,
  TagOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { portfolioApi } from '@/api';
import type { PortfolioItem } from '@/types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CATEGORIES = [
  { value: 'logo', label: 'LOGO设计' },
  { value: 'brand', label: '品牌设计' },
  { value: 'ui', label: 'UI设计' },
  { value: 'illustration', label: '插画设计' },
  { value: 'video', label: '视频制作' },
  { value: 'copywriting', label: '文案策划' },
];

const ProviderPortfolio: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [viewingItem, setViewingItem] = useState<PortfolioItem | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadProps['fileList']>([]);
  const [coverFile, setCoverFile] = useState<UploadProps['fileList']>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const data = await portfolioApi.getMyPortfolio();
      setPortfolio(data.list || []);
    } catch (error) {
      message.error('加载作品集失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFileList([]);
    setCoverFile([]);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      title: item.title,
      category: item.category,
      description: item.description,
      skills: item.skills,
      tools: item.tools,
      clientName: item.clientName,
      projectUrl: item.projectUrl,
    });
    setFileList(
      item.attachments?.map(f => ({
        uid: f.id,
        name: f.name,
        status: 'done',
        url: f.url,
      })) || []
    );
    setCoverFile(
      item.coverImage
        ? [
            {
              uid: 'cover',
              name: 'cover',
              status: 'done',
              url: item.coverImage,
            },
          ]
        : []
    );
    setModalVisible(true);
  };

  const handleView = (item: PortfolioItem) => {
    setViewingItem(item);
    setDrawerVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await portfolioApi.deletePortfolioItem(id);
      message.success('删除成功');
      loadPortfolio();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('category', values.category);
      formData.append('description', values.description);
      formData.append('skills', JSON.stringify(values.skills || []));
      formData.append('tools', JSON.stringify(values.tools || []));
      if (values.clientName) formData.append('clientName', values.clientName);
      if (values.projectUrl) formData.append('projectUrl', values.projectUrl);

      coverFile?.forEach((file, index) => {
        if (file.originFileObj) {
          formData.append('cover', file.originFileObj);
        }
      });

      fileList?.forEach((file, index) => {
        if (file.originFileObj) {
          formData.append(`files[${index}]`, file.originFileObj);
        }
      });

      if (editingItem) {
        await portfolioApi.updatePortfolioItem(editingItem.id, formData);
        message.success('作品更新成功');
      } else {
        await portfolioApi.createPortfolioItem(formData);
        message.success('作品添加成功');
      }

      setModalVisible(false);
      loadPortfolio();
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const uploadProps: UploadProps = {
    fileList,
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    beforeUpload: () => false,
    multiple: true,
  };

  const coverUploadProps: UploadProps = {
    fileList: coverFile,
    onChange: ({ fileList: newFileList }) => setCoverFile(newFileList),
    beforeUpload: () => false,
    maxCount: 1,
    accept: 'image/*',
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} style={{ margin: 0 }}>作品集管理</Title>
          <Text type="secondary">展示您的优秀作品，吸引更多客户</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加作品
        </Button>
      </div>

      {portfolio.length === 0 ? (
        <Card>
          <Empty
            description={
              <div>
                <Title level={4}>暂无作品</Title>
                <Text type="secondary" className="block mb-4">
                  添加您的第一个作品，开始展示您的专业能力
                </Text>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                  添加作品
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {portfolio.map(item => (
            <Col xs={24} sm={12} lg={8} key={item.id}>
              <Card
                hoverable
                cover={
                  <div className="h-48 overflow-hidden bg-gray-100">
                    {item.coverImage ? (
                      <Image
                        src={item.coverImage}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        preview={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FileTextOutlined className="text-5xl" />
                      </div>
                    )}
                  </div>
                }
                actions={[
                  <EyeOutlined key="view" onClick={() => handleView(item)} />,
                  <EditOutlined key="edit" onClick={() => handleEdit(item)} />,
                  <Popconfirm
                    title="确定删除这个作品吗？"
                    onConfirm={() => handleDelete(item.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <DeleteOutlined key="delete" className="text-red-500" />
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  title={
                    <div className="flex justify-between items-start">
                      <Text strong className="text-base truncate max-w-[180px]">
                        {item.title}
                      </Text>
                      <Tag color="blue">{CATEGORIES.find(c => c.value === item.category)?.label}</Tag>
                    </div>
                  }
                  description={
                    <div>
                      <Paragraph ellipsis={{ rows: 2 }} className="mb-2 h-10">
                        {item.description}
                      </Paragraph>
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarOutlined className="text-gray-400" />
                        <Text type="secondary" className="text-sm">
                          {dayjs(item.createdAt).format('YYYY-MM-DD')}
                        </Text>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <StarOutlined className="text-yellow-400" />
                        <Text strong>{item.rating?.toFixed(1) || '5.0'}</Text>
                        <Text type="secondary" className="text-sm">
                          ({item.reviewCount || 0} 评价)
                        </Text>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.skills?.slice(0, 3).map((skill, index) => (
                          <Tag key={index} color="geekblue">
                            {skill}
                          </Tag>
                        ))}
                        {item.skills && item.skills.length > 3 && (
                          <Tag>+{item.skills.length - 3}</Tag>
                        )}
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={editingItem ? '编辑作品' : '添加作品'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit}>
            {editingItem ? '保存修改' : '添加作品'}
          </Button>,
        ]}
        width={720}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ skills: [], tools: [] }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="title"
                label="作品标题"
                rules={[{ required: true, message: '请输入作品标题' }]}
              >
                <Input placeholder="给这个作品起一个响亮的标题" maxLength={100} showCount />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="作品分类"
                rules={[{ required: true, message: '请选择作品分类' }]}
              >
                <Select placeholder="请选择分类">
                  {CATEGORIES.map(cat => (
                    <Option key={cat.value} value={cat.value}>
                      {cat.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="clientName" label="客户名称">
                <Input placeholder="请输入客户名称（选填）" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="封面图片"
                name="cover"
                rules={[{ required: !editingItem, message: '请上传封面图片' }]}
              >
                <Upload {...coverUploadProps}>
                  <Button icon={<UploadOutlined />}>选择封面</Button>
                </Upload>
                <Text type="secondary" className="block mt-1 text-sm">
                  建议尺寸 1200x800，支持 JPG、PNG 格式
                </Text>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="description"
                label="作品描述"
                rules={[{ required: true, message: '请输入作品描述' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="详细描述作品的设计思路、创意亮点、实现过程等"
                  showCount
                  maxLength={2000}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="skills"
                label="相关技能"
                rules={[{ required: true, message: '请选择相关技能' }]}
              >
                <Select
                  mode="tags"
                  placeholder="选择或输入相关技能"
                  tokenSeparators={[',']}
                >
                  <Option value="UI设计">UI设计</Option>
                  <Option value="Logo设计">Logo设计</Option>
                  <Option value="品牌设计">品牌设计</Option>
                  <Option value="插画">插画</Option>
                  <Option value="Photoshop">Photoshop</Option>
                  <Option value="Illustrator">Illustrator</Option>
                  <Option value="Figma">Figma</Option>
                  <Option value="Sketch">Sketch</Option>
                  <Option value="AE">After Effects</Option>
                  <Option value="PR">Premiere</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tools" label="使用工具">
                <Select
                  mode="tags"
                  placeholder="选择或输入使用的工具"
                  tokenSeparators={[',']}
                >
                  <Option value="Photoshop">Photoshop</Option>
                  <Option value="Illustrator">Illustrator</Option>
                  <Option value="Figma">Figma</Option>
                  <Option value="Sketch">Sketch</Option>
                  <Option value="After Effects">After Effects</Option>
                  <Option value="Premiere">Premiere</Option>
                  <Option value="Procreate">Procreate</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="projectUrl" label="项目链接">
                <Input placeholder="线上项目地址（选填）" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="作品文件"
                name="files"
                rules={[{ required: !editingItem, message: '请上传作品文件' }]}
              >
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />}>选择文件</Button>
                </Upload>
                <Text type="secondary" className="block mt-1 text-sm">
                  支持图片、视频、PDF、压缩包等格式，可上传多个文件
                </Text>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Drawer
        title="作品详情"
        placement="right"
        width={720}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        destroyOnClose
      >
        {viewingItem && (
          <div>
            <div className="mb-6">
              <Image
                src={viewingItem.coverImage}
                alt={viewingItem.title}
                className="w-full rounded-lg"
              />
            </div>

            <Title level={4} style={{ marginTop: 0 }}>
              {viewingItem.title}
            </Title>

            <div className="flex flex-wrap gap-2 mb-4">
              <Tag color="blue">
                {CATEGORIES.find(c => c.value === viewingItem.category)?.label}
              </Tag>
              {viewingItem.skills?.map((skill, index) => (
                <Tag key={index} color="geekblue">
                  {skill}
                </Tag>
              ))}
            </div>

            <Descriptions column={2} className="mb-6">
              <Descriptions.Item label="客户">
                {viewingItem.clientName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="发布时间">
                {dayjs(viewingItem.createdAt).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="评分">
                <Space>
                  <Rate disabled value={viewingItem.rating || 5} allowHalf />
                  <Text>{viewingItem.rating?.toFixed(1) || '5.0'}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="评价数">
                {viewingItem.reviewCount || 0}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">作品描述</Divider>
            <Paragraph className="mb-6">{viewingItem.description}</Paragraph>

            {viewingItem.tools && viewingItem.tools.length > 0 && (
              <>
                <Divider orientation="left">使用工具</Divider>
                <div className="flex flex-wrap gap-2 mb-6">
                  {viewingItem.tools.map((tool, index) => (
                    <Tag key={index} icon={<TagOutlined />}>
                      {tool}
                    </Tag>
                  ))}
                </div>
              </>
            )}

            {viewingItem.attachments && viewingItem.attachments.length > 0 && (
              <>
                <Divider orientation="left">作品文件</Divider>
                <List
                 
                  dataSource={viewingItem.attachments}
                  renderItem={file => (
                    <List.Item
                      actions={[
                        <Button type="link" href={file.url} target="_blank">
                          下载
                        </Button>,
                      ]}
                    >
                      <FileTextOutlined className="mr-2" />
                      {file.name}
                      <Text type="secondary" className="ml-2">
                        ({file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : ''})
                      </Text>
                    </List.Item>
                  )}
                />
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ProviderPortfolio;
