import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Select,
  Switch,
  DatePicker,
  Tabs,
  Divider,
  message,
  Space,
  Row,
  Col,
  Tag,
  Modal,
  List,
  Empty,
  Popconfirm,
} from 'antd';
import {
  SaveOutlined,
  SendOutlined,
  ArrowLeftOutlined,
  HistoryOutlined,
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { contentApi, mediaApi, workflowApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { TabPane } = Tabs;

const ContentEditor: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contentId, setContentId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const [diffResult, setDiffResult] = useState<any>(null);
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();
  const params = useParams();
  const user = useAuthStore((state) => state.user);
  const isEdit = !!params.id;

  useEffect(() => {
    fetchCategories();
    if (params.id) {
      setContentId(params.id);
      fetchContent(params.id);
      fetchVersions(params.id);
    }
  }, [params.id]);

  const fetchCategories = async () => {
    try {
      const response: any = await contentApi.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchContent = async (id: string) => {
    setLoading(true);
    try {
      const response: any = await contentApi.getById(id);
      const data = response.data;
      form.setFieldsValue({
        title: data.title,
        summary: data.summary,
        contentBody: data.contentBody,
        categoryId: data.categoryId,
        isFeatured: data.isFeatured,
        isUrgent: data.isUrgent,
        scheduledPublishAt: data.scheduledPublishAt ? dayjs(data.scheduledPublishAt) : undefined,
        featuredImageUrl: data.featuredImageUrl,
      });
      setFeaturedImage(data.featuredImageUrl);
    } catch (error) {
      message.error('获取内容失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async (id: string) => {
    try {
      const response: any = await contentApi.getVersions(id);
      setVersions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    }
  };

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      const data = {
        ...values,
        scheduledPublishAt: values.scheduledPublishAt?.toISOString(),
        featuredImageUrl: featuredImage,
        changeReason: '内容更新',
      };

      let result;
      if (contentId) {
        result = await contentApi.update(contentId, data);
        message.success('保存成功');
        fetchVersions(contentId);
      } else {
        result = await contentApi.create(data);
        message.success('创建成功');
        const newId = result.data?.id;
        if (newId) {
          setContentId(newId);
          navigate(`/content/edit/${newId}`, { replace: true });
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!contentId) {
      message.warning('请先保存内容');
      return;
    }

    try {
      await workflowApi.start(contentId);
      message.success('已提交审核');
      fetchContent(contentId);
    } catch (error: any) {
      message.error(error.response?.data?.message || '提交失败');
    }
  };

  const handleCompareVersions = async () => {
    if (selectedVersions.length !== 2) {
      message.warning('请选择两个版本进行对比');
      return;
    }

    if (!contentId) return;

    try {
      const response: any = await contentApi.compareVersions(
        contentId,
        selectedVersions[0],
        selectedVersions[1]
      );
      setDiffResult(response.data);
    } catch (error) {
      message.error('版本对比失败');
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const response: any = await mediaApi.upload(file);
      const newAsset = response.data;
      setMediaAssets([...mediaAssets, newAsset]);
      message.success('上传成功');
    } catch (error) {
      message.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSetFeatured = (url: string) => {
    setFeaturedImage(url);
    form.setFieldsValue({ featuredImageUrl: url });
    setShowMediaModal(false);
  };

  const versionColumns = [
    {
      title: '版本号',
      dataIndex: 'versionNumber',
      key: 'versionNumber',
      render: (v: number) => <Tag color="blue">v{v}</Tag>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '修改原因',
      dataIndex: 'changeReason',
      key: 'changeReason',
    },
    {
      title: '创建者',
      dataIndex: ['createdBy', 'displayName'],
      key: 'createdBy',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/content')}
          style={{ marginBottom: 8 }}
        >
          返回列表
        </Button>
        <h2 style={{ margin: 0 }}>{isEdit ? '编辑内容' : '新建内容'}</h2>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          isFeatured: false,
          isUrgent: false,
        }}
      >
        <Tabs defaultActiveKey="basic">
          <TabPane tab="基本信息" key="basic">
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={16}>
                <Card title="内容编辑">
                  <Form.Item
                    name="title"
                    label="标题"
                    rules={[{ required: true, message: '请输入标题' }]}
                  >
                    <Input placeholder="请输入内容标题" size="large" />
                  </Form.Item>

                  <Form.Item name="summary" label="摘要">
                    <TextArea rows={3} placeholder="请输入内容摘要" showCount maxLength={500} />
                  </Form.Item>

                  <Form.Item name="contentBody" label="正文">
                    <TextArea rows={15} placeholder="请输入正文内容" style={{ fontFamily: 'monospace' }} />
                  </Form.Item>
                </Card>
              </Col>

              <Col xs={24} lg={8}>
                <Card title="设置">
                  <Form.Item name="categoryId" label="分类">
                    <Select placeholder="选择分类" options={categories.map((c) => ({ label: c.name, value: c.id }))} />
                  </Form.Item>

                  <Form.Item label="封面图片">
                    <div>
                      {featuredImage ? (
                        <div style={{ position: 'relative', marginBottom: 8 }}>
                          <img
                            src={featuredImage}
                            alt="封面"
                            style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 4 }}
                          />
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => setFeaturedImage(null)}
                            style={{ position: 'absolute', top: 8, right: 8 }}
                          >
                            移除
                          </Button>
                        </div>
                      ) : (
                        <Button
                          icon={<UploadOutlined />}
                          onClick={() => setShowMediaModal(true)}
                          block
                        >
                          选择封面图片
                        </Button>
                      )}
                    </div>
                  </Form.Item>

                  <Form.Item name="scheduledPublishAt" label="计划发布时间">
                    <DatePicker showTime style={{ width: '100%' }} />
                  </Form.Item>

                  <Divider />

                  <Form.Item name="isFeatured" label="头条推荐" valuePropName="checked">
                    <Switch />
                  </Form.Item>

                  <Form.Item name="isUrgent" label="紧急内容" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Card>

                <Card title="操作" style={{ marginTop: 16 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} block>
                      保存
                    </Button>
                    <Button icon={<SendOutlined />} onClick={handleSubmitReview} block>
                      提交审核
                    </Button>
                    {isEdit && (
                      <Button
                        icon={<HistoryOutlined />}
                        onClick={() => setShowVersionModal(true)}
                        block
                      >
                        版本历史
                      </Button>
                    )}
                  </Space>
                </Card>
              </Col>
            </Row>
          </TabPane>

          {isEdit && (
            <TabPane tab="版本历史" key="versions">
              <Card>
                <List
                  dataSource={versions}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button type="link" icon={<EyeOutlined />} size="small">
                          查看
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Tag color="blue">v{item.versionNumber}</Tag>}
                        title={item.title}
                        description={
                          <div>
                            <span>修改原因: {item.changeReason}</span>
                            <Divider type="vertical" />
                            <span>创建者: {item.createdBy?.displayName || '-'}</span>
                            <Divider type="vertical" />
                            <span>时间: {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </TabPane>
          )}
        </Tabs>
      </Form>

      <Modal
        title="版本历史"
        open={showVersionModal}
        onCancel={() => setShowVersionModal(false)}
        width={900}
        footer={null}
      >
        {versions.length > 0 ? (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h4>选择两个版本进行对比:</h4>
              <Row gutter={16}>
                <Col span={12}>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="选择版本1"
                    value={selectedVersions[0] || undefined}
                    onChange={(v) => setSelectedVersions([v, selectedVersions[1]])}
                  >
                    {versions.map((v) => (
                      <Select.Option key={v.versionNumber} value={v.versionNumber}>
                        v{v.versionNumber} - {v.title}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
                <Col span={12}>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="选择版本2"
                    value={selectedVersions[1] || undefined}
                    onChange={(v) => setSelectedVersions([selectedVersions[0], v])}
                  >
                    {versions.map((v) => (
                      <Select.Option key={v.versionNumber} value={v.versionNumber}>
                        v{v.versionNumber} - {v.title}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
              </Row>
              <Button
                type="primary"
                style={{ marginTop: 16 }}
                onClick={handleCompareVersions}
                disabled={selectedVersions.length !== 2}
              >
                对比版本
              </Button>
            </div>

            {diffResult && (
              <Card title="对比结果" size="small">
                <pre className="diff-viewer">
                  {JSON.stringify(diffResult, null, 2)}
                </pre>
              </Card>
            )}

            <Divider />

            <List
              dataSource={versions}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Tag color="blue">v{item.versionNumber}</Tag>}
                    title={item.title}
                    description={
                      <div>
                        <span>修改原因: {item.changeReason}</span>
                        <Divider type="vertical" />
                        <span>创建者: {item.createdBy?.displayName || '-'}</span>
                        <Divider type="vertical" />
                        <span>时间: {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        ) : (
          <Empty description="暂无版本历史" />
        )}
      </Modal>

      <Modal
        title="选择媒体文件"
        open={showMediaModal}
        onCancel={() => setShowMediaModal(false)}
        width={800}
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <input
            type="file"
            style={{ display: 'none' }}
            id="file-upload"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            loading={uploading}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            上传图片
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          {mediaAssets.map((asset) => (
            <Col span={6} key={asset.id}>
              <Card
                hoverable
                style={{
                  border: featuredImage === asset.filePath ? '2px solid #1890ff' : 'none',
                }}
                onClick={() => handleSetFeatured(asset.filePath)}
              >
                <div
                  style={{
                    height: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f5f5f5',
                    marginBottom: 8,
                  }}
                >
                  {asset.mimeType?.startsWith('image') ? (
                    <img
                      src={asset.filePath}
                      alt={asset.originalFilename}
                      style={{ maxWidth: '100%', maxHeight: 100 }}
                    />
                  ) : (
                    <FileTextOutlined style={{ fontSize: 48, color: '#999' }} />
                  )}
                </div>
                <div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {asset.originalFilename}
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {mediaAssets.length === 0 && (
          <Empty description="暂无媒体文件，请上传" />
        )}
      </Modal>
    </div>
  );
};

export default ContentEditor;
