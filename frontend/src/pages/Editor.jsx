import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Button, Space, Typography, Tag, InputNumber, Slider,
  Select, Input, ColorPicker, Modal, Form, List, message, Divider,
  Upload, Row, Col, Statistic, Popconfirm, Tabs
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, PlusOutlined, DeleteOutlined,
  EyeOutlined, EyeInvisibleOutlined, LockOutlined, UnlockOutlined,
  UpOutlined, DownOutlined, TagsOutlined, ExportOutlined,
  UploadOutlined, FileTextOutlined
} from '@ant-design/icons';
import { orderApi, templateApi } from '../utils/api';
import { useAuthStore } from '../store/useStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Dragger } = Upload;
const { TabPane } = Tabs;

function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const { user } = useAuthStore();
  const [form] = Form.useForm();

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

  const handleAddLayer = async () => {
    try {
      const layerData = {
        layerName: `图层 ${(orderDetail?.layers?.length || 0) + 1}`,
        layerType: 'image',
        positionX: 0,
        positionY: 0,
        width: orderDetail?.order?.canvas_width || 800,
        height: orderDetail?.order?.canvas_height || 800
      };
      
      await orderApi.addLayer(id, layerData);
      message.success('图层添加成功');
      loadOrderDetail();
    } catch (error) {
      console.error('添加图层失败:', error);
      message.error('添加图层失败');
    }
  };

  const handleAddTextLayer = async () => {
    try {
      const layerData = {
        layerName: `文字图层 ${(orderDetail?.layers?.length || 0) + 1}`,
        layerType: 'text',
        textContent: '双击编辑文字',
        positionX: 50,
        positionY: 50,
        width: 200,
        height: 50,
        fontSize: 24,
        fontColor: '#000000'
      };
      
      await orderApi.addLayer(id, layerData);
      message.success('文字图层添加成功');
      loadOrderDetail();
    } catch (error) {
      console.error('添加文字图层失败:', error);
      message.error('添加文字图层失败');
    }
  };

  const handleUpdateLayer = async (layerId, updates) => {
    try {
      await orderApi.updateLayer(id, layerId, updates);
      loadOrderDetail();
    } catch (error) {
      console.error('更新图层失败:', error);
      message.error('更新图层失败');
    }
  };

  const handleDeleteLayer = async (layerId) => {
    message.info('删除功能需后端配合实现');
  };

  const handleMoveLayer = async (layerId, direction) => {
    if (!selectedLayer) return;
    
    const layers = [...(orderDetail?.layers || [])];
    const currentIndex = layers.findIndex(l => l.id === layerId);
    
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'up') {
      newIndex = currentIndex - 1;
    } else {
      newIndex = currentIndex + 1;
    }
    
    if (newIndex < 0 || newIndex >= layers.length) return;
    
    const currentLayer = layers[currentIndex];
    const targetLayer = layers[newIndex];
    
    await handleUpdateLayer(layerId, { zIndex: targetLayer.z_index });
    await handleUpdateLayer(targetLayer.id, { zIndex: currentLayer.z_index });
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) {
      message.warning('请选择一个模板');
      return;
    }

    try {
      await orderApi.applyTemplate(id, { templateId: selectedTemplate });
      message.success('模板应用成功，等待审核中');
      setTemplateModalVisible(false);
      setSelectedTemplate(null);
      navigate(`/orders/${id}`);
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
      navigate(`/orders/${id}`);
    } catch (error) {
      console.error('导出失败:', error);
      message.error(error.response?.data?.error || '导出失败');
    }
  };

  const order = orderDetail?.order;
  const layers = orderDetail?.layers || [];
  const images = orderDetail?.images || [];

  const sortedLayers = [...layers].sort((a, b) => a.z_index - b.z_index);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/orders/${id}`)}
        >
          返回
        </Button>
        <Title level={4} style={{ margin: '0 16px' }}>
          图片编辑器 - {order?.order_no}
        </Title>
        <Tag color={order?.status === 'pending_edit' ? 'processing' : 'default'}>
          {order?.status === 'pending_edit' ? '编辑中' : order?.statusName}
        </Tag>
        
        <Space style={{ marginLeft: 'auto' }}>
          <Button icon={<SaveOutlined />}>保存</Button>
          <Button icon={<TagsOutlined />} onClick={() => setTemplateModalVisible(true)}>
            套用模板
          </Button>
          <Button type="primary" icon={<ExportOutlined />} onClick={() => setExportModalVisible(true)}>
            导出
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col xs={24} md={6}>
          <Card 
            title="图层列表" 
            size="small"
            extra={
              <Space>
                <Button type="link" size="small" icon={<PlusOutlined />} onClick={handleAddLayer}>
                  图片
                </Button>
                <Button type="link" size="small" icon={<FileTextOutlined />} onClick={handleAddTextLayer}>
                  文字
                </Button>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <List
              dataSource={sortedLayers}
              renderItem={(layer, index) => (
                <List.Item
                  className={`layer-item ${selectedLayer?.id === layer.id ? 'selected' : ''}`}
                  onClick={() => setSelectedLayer(layer)}
                  actions={[
                    <Button
                      type="text"
                      size="small"
                      icon={layer.is_visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateLayer(layer.id, { isVisible: !layer.is_visible });
                      }}
                    />,
                    <Button
                      type="text"
                      size="small"
                      icon={layer.is_locked ? <LockOutlined /> : <UnlockOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateLayer(layer.id, { isLocked: !layer.is_locked });
                      }}
                    />,
                    <Button
                      type="text"
                      size="small"
                      icon={<UpOutlined />}
                      disabled={index === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveLayer(layer.id, 'up');
                      }}
                    />,
                    <Button
                      type="text"
                      size="small"
                      icon={<DownOutlined />}
                      disabled={index === sortedLayers.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveLayer(layer.id, 'down');
                      }}
                    />,
                    <Popconfirm
                      title="确定删除此图层？"
                      onConfirm={(e) => {
                        e?.stopPropagation();
                        handleDeleteLayer(layer.id);
                      }}
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{layer.layer_name}</Text>
                        <Tag color={layer.layer_type === 'text' ? 'blue' : 'green'}>
                          {layer.layer_type === 'text' ? '文字' : '图片'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Text type="secondary">
                        层级: {layer.z_index} | 
                        位置: ({layer.position_x}, {layer.position_y})
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          {images.length === 0 && (
            <Card title="上传图片" size="small">
              <Dragger
                customRequest={({ file }) => handleImageUpload(file)}
                accept="image/*"
                showUploadList={false}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽上传图片</p>
              </Dragger>
            </Card>
          )}
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="画布预览"
            size="small"
            extra={
              <Text type="secondary">
                {order?.canvas_width} x {order?.canvas_height} px
              </Text>
            }
          >
            <div className="canvas-area">
              <div 
                className="canvas-wrapper"
                style={{
                  width: Math.min(order?.canvas_width || 800, 600),
                  height: Math.min(order?.canvas_height || 800, 400),
                  background: order?.canvas_background || '#ffffff',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {sortedLayers.map(layer => (
                  <div
                    key={layer.id}
                    className={`canvas-layer ${selectedLayer?.id === layer.id ? 'selected' : ''}`}
                    style={{
                      left: layer.position_x,
                      top: layer.position_y,
                      width: layer.width || 100,
                      height: layer.height || 100,
                      opacity: layer.opacity !== undefined ? layer.opacity : 1,
                      display: layer.is_visible ? 'block' : 'none',
                      background: layer.layer_type === 'text' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(200, 200, 255, 0.5)',
                      border: '1px dashed #999'
                    }}
                    onClick={() => setSelectedLayer(layer)}
                  >
                    <div style={{
                      padding: 8,
                      fontSize: 12,
                      color: '#666'
                    }}>
                      {layer.layer_name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card title="属性面板" size="small">
            {selectedLayer ? (
              <div>
                <Form layout="vertical" size="small">
                  <Form.Item label="图层名称">
                    <Input 
                      value={selectedLayer.layer_name}
                      onChange={(e) => {
                        const updated = { ...selectedLayer, layer_name: e.target.value };
                        setSelectedLayer(updated);
                      }}
                      onBlur={(e) => handleUpdateLayer(selectedLayer.id, { layerName: e.target.value })}
                    />
                  </Form.Item>

                  <Form.Item label="图层类型">
                    <Tag color={selectedLayer.layer_type === 'text' ? 'blue' : 'green'}>
                      {selectedLayer.layer_type === 'text' ? '文字' : '图片'}
                    </Tag>
                  </Form.Item>

                  <Divider>位置</Divider>

                  <Row gutter={8}>
                    <Col span={12}>
                      <Form.Item label="X">
                        <InputNumber
                          style={{ width: '100%' }}
                          value={selectedLayer.position_x}
                          onChange={(value) => {
                            const updated = { ...selectedLayer, position_x: value };
                            setSelectedLayer(updated);
                            handleUpdateLayer(selectedLayer.id, { positionX: value });
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Y">
                        <InputNumber
                          style={{ width: '100%' }}
                          value={selectedLayer.position_y}
                          onChange={(value) => {
                            const updated = { ...selectedLayer, position_y: value };
                            setSelectedLayer(updated);
                            handleUpdateLayer(selectedLayer.id, { positionY: value });
                          }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider>尺寸</Divider>

                  <Row gutter={8}>
                    <Col span={12}>
                      <Form.Item label="宽度">
                        <InputNumber
                          style={{ width: '100%' }}
                          value={selectedLayer.width}
                          onChange={(value) => {
                            const updated = { ...selectedLayer, width: value };
                            setSelectedLayer(updated);
                            handleUpdateLayer(selectedLayer.id, { width: value });
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="高度">
                        <InputNumber
                          style={{ width: '100%' }}
                          value={selectedLayer.height}
                          onChange={(value) => {
                            const updated = { ...selectedLayer, height: value };
                            setSelectedLayer(updated);
                            handleUpdateLayer(selectedLayer.id, { height: value });
                          }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider>显示</Divider>

                  <Form.Item label="不透明度">
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={selectedLayer.opacity !== undefined ? selectedLayer.opacity : 1}
                      onChange={(value) => {
                        const updated = { ...selectedLayer, opacity: value };
                        setSelectedLayer(updated);
                        handleUpdateLayer(selectedLayer.id, { opacity: value });
                      }}
                    />
                  </Form.Item>

                  <Form.Item label="层级">
                    <InputNumber
                      style={{ width: '100%' }}
                      value={selectedLayer.z_index}
                      onChange={(value) => {
                        const updated = { ...selectedLayer, z_index: value };
                        setSelectedLayer(updated);
                        handleUpdateLayer(selectedLayer.id, { zIndex: value });
                      }}
                    />
                  </Form.Item>
                </Form>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <Text type="secondary">请选择一个图层编辑属性</Text>
              </div>
            )}
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
          <Text type="secondary">选择要套用的模板，系统会将模板样式应用到当前订单并提交审核。</Text>
        </div>
        
        <Row gutter={[16, 16]}>
          {templates.map(template => (
            <Col xs={24} sm={12} key={template.id}>
              <Card
                hoverable
                className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                onClick={() => setSelectedTemplate(template.id)}
                bordered={selectedTemplate === template.id}
                style={{
                  borderColor: selectedTemplate === template.id ? '#1890ff' : undefined,
                  boxShadow: selectedTemplate === template.id ? '0 0 0 2px rgba(24, 144, 255, 0.3)' : undefined
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    height: 80, 
                    background: template.is_locked ? '#fff2e8' : '#f0f0f0', 
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 4
                  }}>
                    <TagsOutlined style={{ fontSize: 32, color: '#999' }} />
                    {template.is_locked && (
                      <Tag color="orange" style={{ position: 'absolute', top: 8, right: 8 }}>
                        已锁定
                      </Tag>
                    )}
                  </div>
                  <Text strong>{template.template_name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {template.canvas_width} x {template.canvas_height}
                  </Text>
                  {template.category && (
                    <Tag size="small" style={{ marginTop: 8 }}>{template.category}</Tag>
                  )}
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

export default Editor;
