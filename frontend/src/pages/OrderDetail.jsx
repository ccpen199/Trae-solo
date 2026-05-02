import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Descriptions, Tag, Button, Space, Timeline, Divider, 
  Upload, Typography, Row, Col, List, Avatar, Statistic, message,
  Steps, Modal, Form, Input, Select, InputNumber
} from 'antd';
import { 
  ArrowLeftOutlined, EditOutlined, UploadOutlined, 
  EyeOutlined, PlusOutlined, FileImageOutlined,
  TagsOutlined, ExportOutlined, InboxOutlined
} from '@ant-design/icons';
import { orderApi, templateApi } from '../utils/api';
import { useAuthStore } from '../store/useStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Dragger } = Upload;
const { Step } = Steps;

const STATUS_COLORS = {
  pending_upload: 'default',
  pending_edit: 'processing',
  pending_template: 'warning',
  pending_export: 'orange',
  published: 'success',
  cancelled: 'default',
  rejected: 'error'
};

const STATUS_NAMES = {
  pending_upload: '待上传',
  pending_edit: '待编辑',
  pending_template: '待套模板',
  pending_export: '待导出',
  published: '已发布',
  cancelled: '已取消',
  rejected: '已驳回'
};

const STATUS_ORDER = [
  'pending_upload',
  'pending_edit',
  'pending_template',
  'pending_export',
  'published'
];

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (id) {
      loadOrderDetail();
      loadTemplates();
    }
  }, [id]);

  const loadOrderDetail = async () => {
    setLoading(true);
    try {
      const response = await orderApi.getById(id);
      setOrderDetail(response.data);
    } catch (error) {
      console.error('加载订单详情失败:', error);
      message.error('加载订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await templateApi.list();
      setTemplates(response.data);
    } catch (error) {
      console.error('加载模板列表失败:', error);
    }
  };

  const handleImageUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      await orderApi.uploadImage(id, formData);
      message.success('图片上传成功');
      loadOrderDetail();
    } catch (error) {
      console.error('上传图片失败:', error);
      message.error('上传图片失败');
    }
    return false;
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) {
      message.warning('请选择一个模板');
      return;
    }

    try {
      await orderApi.applyTemplate(id, { templateId: selectedTemplate });
      message.success('模板应用成功');
      setTemplateModalVisible(false);
      setSelectedTemplate(null);
      loadOrderDetail();
    } catch (error) {
      console.error('应用模板失败:', error);
      message.error(error.response?.data?.error || '应用模板失败');
    }
  };

  const handleExport = async (values) => {
    try {
      await orderApi.exportImage(id, {
        format: values.format || 'png',
        width: values.width || orderDetail?.order?.canvas_width,
        height: values.height || orderDetail?.order?.canvas_height
      });
      message.success('导出成功');
      setExportModalVisible(false);
      loadOrderDetail();
    } catch (error) {
      console.error('导出失败:', error);
      message.error(error.response?.data?.error || '导出失败');
    }
  };

  const getCurrentStepIndex = () => {
    const status = orderDetail?.order?.status;
    const index = STATUS_ORDER.indexOf(status);
    return index >= 0 ? index : 0;
  };

  const getAvailableActions = () => {
    const status = orderDetail?.order?.status;
    const actions = [];

    if (status === 'pending_upload') {
      actions.push({ key: 'edit', label: '进入编辑', icon: <EditOutlined /> });
    }

    if (status === 'pending_edit' && 
        (user?.role === 'creator' || user?.role === 'design_operation' || user?.role === 'admin')) {
      actions.push({ key: 'edit', label: '编辑', icon: <EditOutlined /> });
      actions.push({ key: 'template', label: '套用模板', icon: <TagsOutlined /> });
    }

    if (status === 'pending_export' && 
        (user?.role === 'creator' || user?.role === 'design_operation' || user?.role === 'admin')) {
      actions.push({ key: 'export', label: '导出', icon: <ExportOutlined /> });
    }

    return actions;
  };

  const order = orderDetail?.order;
  const images = orderDetail?.images || [];
  const layers = orderDetail?.layers || [];
  const timeline = orderDetail?.timeline || [];
  const orderTemplates = orderDetail?.orderTemplates || [];
  const exports = orderDetail?.exports || [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/orders')}
        >
          返回
        </Button>
        <Title level={4} style={{ margin: '0 16px' }}>
          订单详情 - {order?.order_no}
        </Title>
        <Tag color={STATUS_COLORS[order?.status]} style={{ fontSize: 14, padding: '4px 12px' }}>
          {STATUS_NAMES[order?.status]}
        </Tag>
        
        <Space style={{ marginLeft: 'auto' }}>
          {getAvailableActions().map(action => (
            <Button
              key={action.key}
              type={action.key === 'edit' ? 'primary' : 'default'}
              icon={action.icon}
              onClick={() => {
                if (action.key === 'edit') {
                  navigate(`/orders/${id}/edit`);
                } else if (action.key === 'template') {
                  setTemplateModalVisible(true);
                } else if (action.key === 'export') {
                  setExportModalVisible(true);
                }
              }}
            >
              {action.label}
            </Button>
          ))}
        </Space>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Steps
          current={getCurrentStepIndex()}
          items={STATUS_ORDER.map((status, index) => ({
            title: STATUS_NAMES[status],
            description: index <= getCurrentStepIndex() ? '已完成' : '待处理'
          }))}
        />
      </Card>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card title="基本信息" style={{ marginBottom: 24 }}>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="订单号">{order?.order_no}</Descriptions.Item>
              <Descriptions.Item label="画布名称">{order?.canvas_name}</Descriptions.Item>
              <Descriptions.Item label="画布尺寸">
                {order?.canvas_width} x {order?.canvas_height} px
              </Descriptions.Item>
              <Descriptions.Item label="背景颜色">
                <div style={{ 
                  width: 20, 
                  height: 20, 
                  background: order?.canvas_background,
                  border: '1px solid #d9d9d9',
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  marginRight: 8
                }} />
                {order?.canvas_background}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">{order?.creator_name}</Descriptions.Item>
              <Descriptions.Item label="负责人">{order?.assignee_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {order?.created_at ? dayjs(order.created_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {order?.updated_at ? dayjs(order.updated_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="期望完成时间" span={2}>
                {order?.expected_completion_time 
                  ? dayjs(order.expected_completion_time).format('YYYY-MM-DD HH:mm') 
                  : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {order?.status === 'pending_upload' && (
            <Card title="上传图片" style={{ marginBottom: 24 }}>
              <Dragger
                customRequest={({ file }) => handleImageUpload(file)}
                accept="image/*"
                showUploadList={false}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽图片到此处上传</p>
                <p className="ant-upload-hint">支持 JPG、PNG、GIF 等格式</p>
              </Dragger>
            </Card>
          )}

          {images.length > 0 && (
            <Card title="图片列表" style={{ marginBottom: 24 }}>
              <List
                dataSource={images}
                renderItem={(img) => (
                  <List.Item actions={[
                    <Button type="link" size="small">预览</Button>
                  ]}>
                    <List.Item.Meta
                      avatar={<Avatar icon={<FileImageOutlined />} />}
                      title={img.file_name}
                      description={
                        <Text type="secondary">
                          版本 {img.version} | 
                          {(img.file_size / 1024).toFixed(2)} KB | 
                          {dayjs(img.created_at).format('YYYY-MM-DD HH:mm')}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {layers.length > 0 && (
            <Card title="图层列表" style={{ marginBottom: 24 }}>
              <List
                dataSource={layers}
                renderItem={(layer) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{layer.layer_name}</Text>
                          <Tag>{layer.layer_type}</Tag>
                          {layer.is_locked ? <Tag color="orange">已锁定</Tag> : null}
                          {!layer.is_visible ? <Tag>已隐藏</Tag> : null}
                        </Space>
                      }
                      description={
                        <Text type="secondary">
                          位置: ({layer.position_x}, {layer.position_y}) | 
                          尺寸: {layer.width} x {layer.height} | 
                          层级: {layer.z_index}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {orderTemplates.length > 0 && (
            <Card title="模板应用记录" style={{ marginBottom: 24 }}>
              <List
                dataSource={orderTemplates}
                renderItem={(ot) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text>模板: {ot.template_name}</Text>
                          <Tag color={ot.status === 'approved' ? 'success' : 'warning'}>
                            {ot.status === 'approved' ? '已通过' : ot.status === 'pending' ? '待审核' : '已驳回'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space split="|">
                          <Text type="secondary">
                            申请人: {ot.applied_by_name}
                          </Text>
                          <Text type="secondary">
                            时间: {dayjs(ot.applied_at).format('YYYY-MM-DD HH:mm')}
                          </Text>
                          {ot.review_comment && (
                            <Text type="secondary">
                              审核意见: {ot.review_comment}
                            </Text>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {exports.length > 0 && (
            <Card title="导出记录" style={{ marginBottom: 24 }}>
              <List
                dataSource={exports}
                renderItem={(exp) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text>{exp.file_name}</Text>
                          <Tag>{exp.export_format.toUpperCase()}</Tag>
                        </Space>
                      }
                      description={
                        <Space split="|">
                          <Text type="secondary">
                            尺寸: {exp.export_width} x {exp.export_height}
                          </Text>
                          <Text type="secondary">
                            导出人: {exp.exported_by_name}
                          </Text>
                          <Text type="secondary">
                            时间: {dayjs(exp.exported_at).format('YYYY-MM-DD HH:mm')}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card title="操作时间轴" style={{ marginBottom: 24 }}>
            <Timeline
              items={timeline.map((item, index) => ({
                key: index,
                children: (
                  <div className="timeline-content">
                    <Text strong>{item.action}</Text>
                    {item.comment && (
                      <p style={{ margin: '4px 0', color: '#666' }}>{item.comment}</p>
                    )}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.user_name || '系统'} | {dayjs(item.created_at).format('MM-DD HH:mm')}
                    </Text>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="套用模板"
        open={templateModalVisible}
        onCancel={() => setTemplateModalVisible(false)}
        onOk={handleApplyTemplate}
        okText="确认套用"
        cancelText="取消"
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">选择要套用的模板，系统会将模板样式应用到当前订单。</Text>
        </div>
        
        <Row gutter={[16, 16]}>
          {templates.map(template => (
            <Col xs={24} sm={12} key={template.id}>
              <Card
                hoverable
                className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    height: 80, 
                    background: '#f0f0f0', 
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <TagsOutlined style={{ fontSize: 32, color: '#999' }} />
                  </div>
                  <Text strong>{template.template_name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {template.canvas_width} x {template.canvas_height}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Modal>

      <Modal
        title="导出配置"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          layout="vertical"
          onFinish={handleExport}
          initialValues={{
            format: 'png',
            width: order?.canvas_width,
            height: order?.canvas_height
          }}
        >
          <Form.Item name="format" label="导出格式">
            <Select>
              <Select.Option value="png">PNG</Select.Option>
              <Select.Option value="jpg">JPG</Select.Option>
              <Select.Option value="webp">WebP</Select.Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="width" label="宽度 (px)">
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="height" label="高度 (px)">
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setExportModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认导出</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default OrderDetail;
