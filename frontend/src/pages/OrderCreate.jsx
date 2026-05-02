import React, { useState } from 'react';
import { Form, Input, InputNumber, Select, Button, Card, Typography, Row, Col, DatePicker, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../utils/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

function OrderCreate() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const submitData = {
        canvasName: values.canvasName,
        canvasWidth: values.canvasWidth || 800,
        canvasHeight: values.canvasHeight || 800,
        canvasBackground: values.canvasBackground || '#ffffff',
        assigneeId: values.assigneeId,
        expectedCompletionTime: values.expectedCompletionTime?.toISOString()
      };

      const response = await orderApi.create(submitData);
      message.success('订单创建成功');
      navigate(`/orders/${response.data.id}`);
    } catch (error) {
      console.error('创建订单失败:', error);
      message.error(error.response?.data?.error || '创建订单失败');
    } finally {
      setLoading(false);
    }
  };

  const presetSizes = [
    { label: '800 x 800 (电商主图)', width: 800, height: 800 },
    { label: '1200 x 400 (横幅)', width: 1200, height: 400 },
    { label: '750 x 1000 (详情页)', width: 750, height: 1000 },
    { label: '1080 x 1080 (社交)', width: 1080, height: 1080 },
    { label: '1920 x 1080 (高清)', width: 1920, height: 1080 }
  ];

  const handleSelectPreset = (preset) => {
    form.setFieldsValue({
      canvasWidth: preset.width,
      canvasHeight: preset.height
    });
  };

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
        <Title level={4} style={{ margin: '0 16px' }}>新建订单</Title>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card title="基本信息">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                canvasWidth: 800,
                canvasHeight: 800,
                canvasBackground: '#ffffff'
              }}
            >
              <Form.Item
                name="canvasName"
                label="画布名称"
                rules={[{ required: true, message: '请输入画布名称' }]}
              >
                <Input placeholder="例如：新品促销主图" />
              </Form.Item>

              <Form.Item label="预设尺寸">
                <Select
                  placeholder="选择常用尺寸"
                  allowClear
                  style={{ width: '100%' }}
                  options={presetSizes.map(p => ({ label: p.label, value: p.label }))}
                  onChange={(value) => {
                    const preset = presetSizes.find(p => p.label === value);
                    if (preset) {
                      handleSelectPreset(preset);
                    }
                  }}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={12}>
                  <Form.Item
                    name="canvasWidth"
                    label="宽度 (px)"
                    rules={[{ required: true, message: '请输入宽度' }]}
                  >
                    <InputNumber
                      min={1}
                      max={10000}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={12}>
                  <Form.Item
                    name="canvasHeight"
                    label="高度 (px)"
                    rules={[{ required: true, message: '请输入高度' }]}
                  >
                    <InputNumber
                      min={1}
                      max={10000}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="canvasBackground"
                label="背景颜色"
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Input type="color" style={{ width: 60, height: 32, padding: 2 }} />
                  <Text type="secondary">选择背景颜色</Text>
                </div>
              </Form.Item>

              <Form.Item
                name="expectedCompletionTime"
                label="期望完成时间"
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 24 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                  size="large"
                >
                  创建订单
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="创建说明">
            <div style={{ lineHeight: 2 }}>
              <p><strong>1. 画布设置</strong></p>
              <p>设置画布的名称、尺寸和背景颜色。可以从预设尺寸中快速选择常用尺寸。</p>
              
              <p style={{ marginTop: 16 }}><strong>2. 订单流程</strong></p>
              <ul style={{ paddingLeft: 20 }}>
                <li>待上传图片</li>
                <li>待编辑</li>
                <li>待套模板</li>
                <li>待导出</li>
                <li>已发布</li>
              </ul>

              <p style={{ marginTop: 16 }}><strong>3. 注意事项</strong></p>
              <ul style={{ paddingLeft: 20 }}>
                <li>画布尺寸建议根据实际用途选择</li>
                <li>创建后可以继续上传图片并编辑</li>
                <li>订单状态会自动根据操作更新</li>
              </ul>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default OrderCreate;
