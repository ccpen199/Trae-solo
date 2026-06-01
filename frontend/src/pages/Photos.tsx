import React, { useEffect, useState, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Image,
  Button,
  Upload,
  Select,
  message,
  Typography,
  Space,
  Alert,
  Tag,
  Modal,
  Form,
  Input,
} from 'antd';
import {
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  CameraOutlined,
} from '@ant-design/icons';
import { photoAPI } from '../services/api';
import { Photo, PHOTO_CATEGORY_MAP } from '../types';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const PhotoManagement: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('accident_overview');
  const [requiredCheck, setRequiredCheck] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [retakeModalVisible, setRetakeModalVisible] = useState(false);
  const [retakePhoto, setRetakePhoto] = useState<Photo | null>(null);
  const [retakeForm] = Form.useForm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (taskId) {
      loadPhotos();
      checkRequired();
    }
  }, [taskId]);

  const loadPhotos = async () => {
    try {
      const response = await photoAPI.getPhotos(taskId!);
      setPhotos(response.data);
    } catch (error) {
      message.error('加载照片失败');
    }
  };

  const checkRequired = async () => {
    try {
      const response = await photoAPI.checkRequired(taskId!);
      setRequiredCheck(response.data);
    } catch (error) {
      console.error('检查必传照片失败');
    }
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('photos', file);
      formData.append('category', category);
      formData.append('shoot_time', new Date().toISOString());

      const response = await photoAPI.uploadPhotos(taskId!, formData);
      if (response.data && response.data.length > 0) {
        message.success('照片上传成功');
        loadPhotos();
        checkRequired();
      }
    } catch (error) {
      message.error('照片上传失败');
    } finally {
      setLoading(false);
    }
    return false;
  };

  const handleRetake = async (values: any) => {
    if (!retakePhoto) return;

    setLoading(true);
    try {
      const formData = new FormData();
      if (values.photo && values.photo.length > 0) {
        formData.append('photo', values.photo[0].originFileObj);
      }
      formData.append('retake_reason', values.retake_reason);
      formData.append('shoot_time', new Date().toISOString());

      await photoAPI.retakePhoto(taskId!, retakePhoto.id, formData);
      message.success('补拍照片上传成功');
      setRetakeModalVisible(false);
      retakeForm.resetFields();
      loadPhotos();
    } catch (error) {
      message.error('补拍照片上传失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    try {
      await photoAPI.deletePhoto(photoId);
      message.success('照片删除成功');
      loadPhotos();
      checkRequired();
    } catch (error) {
      message.error('照片删除失败');
    }
  };

  const groupedPhotos = photos.reduce((acc, photo) => {
    if (!acc[photo.category]) {
      acc[photo.category] = [];
    }
    acc[photo.category].push(photo);
    return acc;
  }, {} as Record<string, Photo[]>);

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>照片管理</Title>

      {requiredCheck && (
        <Alert
          message={requiredCheck.has_all_required ? '所有必传照片已上传' : '缺少必传照片'}
          description={
            requiredCheck.has_all_required
              ? '照片上传完整，可以继续进行定损操作'
              : `缺少: ${requiredCheck.missing_categories?.map((c: string) => PHOTO_CATEGORY_MAP[c]).join(', ')}`
          }
          type={requiredCheck.has_all_required ? 'success' : 'warning'}
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Select
            value={category}
            onChange={setCategory}
            style={{ width: 200 }}
          >
            {Object.entries(PHOTO_CATEGORY_MAP).map(([value, label]) => (
              <Option key={value} value={value}>{label}</Option>
            ))}
          </Select>

          <Upload
            customRequest={({ file }) => handleUpload(file as File)}
            showUploadList={false}
            accept="image/*"
            multiple
          >
            <Button type="primary" icon={<UploadOutlined />} loading={loading}>
              上传照片
            </Button>
          </Upload>

          <Button icon={<CameraOutlined />} onClick={() => fileInputRef.current?.click()}>
            拍照
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleUpload(e.target.files[0]);
              }
            }}
          />
        </Space>
      </Card>

      {Object.entries(groupedPhotos).map(([cat, catPhotos]) => (
        <Card
          key={cat}
          title={`${PHOTO_CATEGORY_MAP[cat]} (${catPhotos.length})`}
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 16]}>
            {catPhotos.map((photo) => (
              <Col key={photo.id} xs={12} sm={8} md={6} lg={4}>
                <div style={{ position: 'relative' }}>
                  <Image
                    src={photo.file_path}
                    alt={photo.file_name}
                    style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4 }}
                    preview={false}
                  />
                  {photo.is_retake ? (
                    <Tag color="orange" style={{ position: 'absolute', top: 4, left: 4 }}>
                      补拍
                    </Tag>
                  ) : null}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    padding: '4px 8px',
                    fontSize: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span>{dayjs(photo.shoot_time).format('HH:mm')}</span>
                    <Space size="small">
                      <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          setPreviewImage(photo.file_path);
                          setPreviewVisible(true);
                        }}
                        style={{ color: '#fff', padding: 0 }}
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          setRetakePhoto(photo);
                          setRetakeModalVisible(true);
                        }}
                        style={{ color: '#fff', padding: 0 }}
                      />
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(photo.id)}
                        style={{ color: '#ff4d4f', padding: 0 }}
                      />
                    </Space>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      ))}

      {photos.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#999' }}>
            <CameraOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>暂无照片，请上传</p>
          </div>
        </Card>
      )}

      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="80%"
        centered
      >
        <img src={previewImage} style={{ width: '100%' }} alt="预览" />
      </Modal>

      <Modal
        title="补拍照片"
        open={retakeModalVisible}
        onCancel={() => {
          setRetakeModalVisible(false);
          retakeForm.resetFields();
        }}
        onOk={() => retakeForm.submit()}
        confirmLoading={loading}
      >
        <Form form={retakeForm} layout="vertical" onFinish={handleRetake}>
          <Form.Item
            name="photo"
            label="选择照片"
            rules={[{ required: true, message: '请选择照片' }]}
          >
            <Upload
              beforeUpload={() => false}
              accept="image/*"
              listType="picture-card"
              maxCount={1}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>选择照片</div>
              </div>
            </Upload>
          </Form.Item>
          <Form.Item name="retake_reason" label="补拍原因">
            <TextArea rows={3} placeholder="请输入补拍原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PhotoManagement;
