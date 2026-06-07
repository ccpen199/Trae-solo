import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  Progress,
  Tag,
  Divider,
  message,
  Upload,
  Typography
} from 'antd';
import {
  SearchOutlined,
  CameraOutlined,
  AudioOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { diagnose } from '../services/faultService';
import useStore from '../store/useStore';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const FaultDiagnosisPage = () => {
  const { setCurrentView, deviceTypeOptions } = useStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDiagnose = async (values) => {
    setLoading(true);
    try {
      const res = await diagnose(values);
      setResult(res.data);
      message.success('诊断完成');
    } catch (error) {
      message.error('诊断失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = () => {
    const values = form.getFieldsValue();
    if (result) {
      sessionStorage.setItem('diagnosisResult', JSON.stringify({
        ...result,
        deviceType: values.deviceType,
        faultDescription: values.text
      }));
    }
    setCurrentView('submit-order');
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'normal';
    return 'exception';
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="智能故障诊断引擎" extra={<Tag color="blue">AI驱动</Tag>}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleDiagnose}
          initialValues={{ deviceType: 'smartphone' }}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                label="设备类型"
                name="deviceType"
                rules={[{ required: true, message: '请选择设备类型' }]}
              >
                <Select>
                  {deviceTypeOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="故障描述"
            name="text"
            rules={[{ required: true, message: '请描述故障现象' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细描述您遇到的问题，例如：手机开不了机，充电没反应，屏幕闪烁等..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="上传故障图片" name="image">
                <Upload.Dragger
                  multiple={false}
                  beforeUpload={() => false}
                  accept="image/*"
                >
                  <p className="ant-upload-drag-icon">
                    <CameraOutlined style={{ fontSize: 32, color: '#1677ff' }} />
                  </p>
                  <p className="ant-upload-text">点击或拖拽上传故障图片</p>
                  <p className="ant-upload-hint">支持 JPG、PNG 格式，帮助更准确诊断</p>
                </Upload.Dragger>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Card size="small" title={<Space><AudioOutlined />语音输入</Space>}>
                <div className="upload-area">
                  <AudioOutlined style={{ fontSize: 48, color: '#1677ff', marginBottom: 12 }} />
                  <p>点击开始语音描述故障</p>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    支持语音转文字，更便捷的输入方式
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SearchOutlined />}
                loading={loading}
              >
                开始智能诊断
              </Button>
              <Button size="large" onClick={() => form.resetFields()}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {result && (
        <Card 
          title={
            <Space>
              <ToolOutlined />
              诊断结果
              <Tag color="green">准确率: {(result.predictionAccuracy * 100).toFixed(1)}%</Tag>
            </Space>
          }
          extra={
            <Button type="primary" onClick={handleCreateOrder}>
              提交维修订单 <ArrowRightOutlined />
            </Button>
          }
        >
          <Title level={5} style={{ marginBottom: 16 }}>
            识别到关键词：{result.keywords?.join('、') || '无'}
          </Title>
          
          <Row gutter={[16, 16]}>
            {result.top3?.map((fault, index) => (
              <Col xs={24} md={8} key={fault.code}>
                <Card 
                  className="fault-card"
                  size="small"
                  title={
                    <Space>
                      <Tag color={index === 0 ? 'red' : index === 1 ? 'orange' : 'blue'}>
                        TOP{index + 1}
                      </Tag>
                      <span>{fault.name}</span>
                    </Space>
                  }
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div>
                      <Text type="secondary">故障代码：</Text>
                      <Text code>{fault.code}</Text>
                    </div>
                    <div>
                      <Text type="secondary">置信度：</Text>
                      <Progress
                        percent={Math.round(fault.confidence * 100)}
                        status={getConfidenceColor(fault.confidence)}
                        size="small"
                      />
                    </div>
                    <div>
                      <Text type="secondary">预估费用：</Text>
                      <Text strong style={{ color: '#faad14', fontSize: 16 }}>
                        ¥{fault.estimatedCost}
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary">预计工时：</Text>
                      <Text>{fault.estimatedHours} 小时</Text>
                    </div>
                    <div>
                      <Text type="secondary">难度等级：</Text>
                      <Space>
                        {[...Array(5)].map((_, i) => (
                          <CheckCircleOutlined
                            key={i}
                            style={{ color: i < fault.difficulty ? '#faad14' : '#d9d9d9' }}
                          />
                        ))}
                      </Space>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <Text type="secondary">{fault.description}</Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </Space>
  );
};

export default FaultDiagnosisPage;
