import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Upload,
  Button,
  message,
  Empty,
  Tag,
  Input,
  Select,
  Modal,
  Descriptions,
  Image,
  Popconfirm,
} from 'antd';
import {
  UploadOutlined,
  SearchOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { mediaApi } from '../../services/api';
import dayjs from 'dayjs';

const { Search } = Input;

const MediaLibrary: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  });
  const [filters, setFilters] = useState({
    keyword: '',
    assetType: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  useEffect(() => {
    fetchMedia();
  }, [pagination.current, pagination.pageSize]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.current,
        limit: pagination.pageSize,
      };

      if (filters.assetType) params.assetType = filters.assetType;

      const response: any = await mediaApi.getList(params);
      setMediaList(response.data?.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data?.total || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      const response: any = await mediaApi.upload(file);
      message.success('上传成功');
      fetchMedia();
    } catch (error) {
      message.error('上传失败');
    }
    return false;
  };

  const handleDelete = async (id: string) => {
    try {
      await mediaApi.delete(id);
      message.success('删除成功');
      fetchMedia();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleViewDetail = (item: any) => {
    setSelectedMedia(item);
    setShowModal(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IMAGE':
        return <PictureOutlined style={{ fontSize: 48, color: '#1890ff' }} />;
      case 'VIDEO':
        return <VideoCameraOutlined style={{ fontSize: 48, color: '#722ed1' }} />;
      case 'AUDIO':
        return <SoundOutlined style={{ fontSize: 48, color: '#52c41a' }} />;
      default:
        return <FileTextOutlined style={{ fontSize: 48, color: '#faad14' }} />;
    }
  };

  const getTypeText = (type: string) => {
    const texts: Record<string, string> = {
      IMAGE: '图片',
      VIDEO: '视频',
      AUDIO: '音频',
      DOCUMENT: '文档',
      OTHER: '其他',
    };
    return texts[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      IMAGE: 'blue',
      VIDEO: 'purple',
      AUDIO: 'green',
      DOCUMENT: 'orange',
      OTHER: 'default',
    };
    return colors[type] || 'default';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <div className="page-header">
        <h2>媒体库</h2>
        <p style={{ color: 'rgba(0,0,0,0.45)' }}>管理所有媒体资源文件</p>
      </div>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
          <Search
            placeholder="搜索文件名"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            onSearch={() => fetchMedia()}
          />
          <Select
            placeholder="选择类型"
            style={{ width: 150 }}
            allowClear
            value={filters.assetType || undefined}
            onChange={(v) => {
              setFilters({ ...filters, assetType: v });
            }}
          >
            <Select.Option value="IMAGE">图片</Select.Option>
            <Select.Option value="VIDEO">视频</Select.Option>
            <Select.Option value="AUDIO">音频</Select.Option>
            <Select.Option value="DOCUMENT">文档</Select.Option>
          </Select>
          <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*,video/*,audio/*,.pdf,.doc,.docx">
            <Button type="primary" icon={<UploadOutlined />}>
              上传文件
            </Button>
          </Upload>
        </div>

        {mediaList.length > 0 ? (
          <Row gutter={[16, 16]}>
            {mediaList.map((item) => (
              <Col xs={12} sm={8} md={6} key={item.id}>
                <Card
                  hoverable
                  cover={
                    <div
                      style={{
                        height: 150,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f5f5f5',
                        position: 'relative',
                      }}
                    >
                      {item.mimeType?.startsWith('image') ? (
                        <img
                          src={item.filePath || 'placeholder'}
                          alt={item.originalFilename}
                          style={{ maxWidth: '100%', maxHeight: 150, objectFit: 'contain' }}
                        />
                      ) : (
                        getTypeIcon(item.assetType)
                      )}
                      {item.isUsed && (
                        <Tag
                          color="green"
                          style={{ position: 'absolute', top: 8, right: 8 }}
                        >
                          已使用
                        </Tag>
                      )}
                    </div>
                  }
                  actions={[
                    <EyeOutlined key="view" onClick={() => handleViewDetail(item)} />,
                    <Popconfirm
                      key="delete"
                      title="确定删除?"
                      onConfirm={() => handleDelete(item.id)}
                    >
                      <DeleteOutlined style={{ color: '#ff4d4f' }} />
                    </Popconfirm>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <div
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.originalFilename}
                      </div>
                    }
                    description={
                      <div style={{ fontSize: 12 }}>
                        <Tag color={getTypeColor(item.assetType)} style={{ marginBottom: 4 }}>
                          {getTypeText(item.assetType)}
                        </Tag>
                        <div style={{ color: 'rgba(0,0,0,0.45)' }}>
                          {formatFileSize(item.fileSize)}
                        </div>
                        <div style={{ color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>
                          {dayjs(item.createdAt).format('YYYY-MM-DD')}
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty
            description="暂无媒体文件"
            style={{ padding: '60px 0' }}
          >
            <Upload beforeUpload={handleUpload} showUploadList={false}>
              <Button type="primary" icon={<UploadOutlined />}>
                上传第一个文件
              </Button>
            </Upload>
          </Empty>
        )}
      </Card>

      <Modal
        title="媒体详情"
        open={showModal}
        onCancel={() => setShowModal(false)}
        width={700}
        footer={null}
      >
        {selectedMedia && (
          <div>
            <div
              style={{
                background: '#f5f5f5',
                padding: 24,
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              {selectedMedia.mimeType?.startsWith('image') ? (
                <Image
                  src={selectedMedia.filePath}
                  alt={selectedMedia.originalFilename}
                  style={{ maxHeight: 300 }}
                />
              ) : (
                getTypeIcon(selectedMedia.assetType)
              )}
            </div>

            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="文件名">
                {selectedMedia.originalFilename}
              </Descriptions.Item>
              <Descriptions.Item label="存储路径">
                {selectedMedia.filePath}
              </Descriptions.Item>
              <Descriptions.Item label="文件类型">
                <Tag color={getTypeColor(selectedMedia.assetType)}>
                  {getTypeText(selectedMedia.assetType)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="文件大小">
                {formatFileSize(selectedMedia.fileSize)}
              </Descriptions.Item>
              <Descriptions.Item label="MIME类型">
                {selectedMedia.mimeType}
              </Descriptions.Item>
              <Descriptions.Item label="是否使用">
                <Tag color={selectedMedia.isUsed ? 'green' : 'default'}>
                  {selectedMedia.isUsed ? '已使用' : '未使用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="AI标签" span={2}>
                {selectedMedia.aiTags?.length > 0 ? (
                  selectedMedia.aiTags.map((tag: string, index: number) => (
                    <Tag key={index}>{tag}</Tag>
                  ))
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="上传时间" span={2}>
                {dayjs(selectedMedia.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MediaLibrary;
