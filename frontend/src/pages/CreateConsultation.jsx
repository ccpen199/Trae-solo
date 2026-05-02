import React, { useState } from 'react';
import { Form, Input, Select, InputNumber, Button, Card, Row, Col, message, Steps, Result, Descriptions } from 'antd';
import { FileTextOutlined, DollarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const CATEGORIES = [
  { id: 'civil', name: '民事纠纷', icon: 'balance' },
  { id: 'contract', name: '合同纠纷', icon: 'file-text' },
  { id: 'labor', name: '劳动争议', icon: 'briefcase' },
  { id: 'criminal', name: '刑事辩护', icon: 'shield' },
  { id: 'corporate', name: '公司事务', icon: 'building' },
  { id: 'intellectual', name: '知识产权', icon: 'lightbulb' },
  { id: 'real_estate', name: '房产纠纷', icon: 'home' },
  { id: 'traffic', name: '交通事故', icon: 'car' },
  { id: 'consumer', name: '消费维权', icon: 'shopping-cart' }
];

const URGENCY_LEVELS = [
  { value: 'normal', label: '普通' },
  { value: 'urgent', label: '紧急' },
  { value: 'emergency', label: '加急' }
];

const CreateConsultation = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [consultationData, setConsultationData] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinishBasic = async (values) => {
    setConsultationData(values);
    setCurrentStep(1);
  };

  const onFinishConfirm = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/consultations', consultationData);
      if (response.success) {
        setCurrentStep(2);
        setConsultationData({
          ...consultationData,
          id: response.consultation.id
        });
      }
    } catch (error) {
      console.error('创建咨询失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/api/consultations/${consultationData.id}/pay`);
      if (response.success) {
        message.success('支付成功，律师已接单');
        navigate(`/consultations/${consultationData.id}`);
      }
    } catch (error) {
      console.error('支付失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: '填写基本信息',
      icon: <FileTextOutlined />
    },
    {
      title: '确认信息',
      icon: <CheckCircleOutlined />
    },
    {
      title: '支付完成',
      icon: <DollarOutlined />
    }
  ];

  return (
    <Card title="发布法律咨询">
      <Steps current={currentStep} items={steps} style={{ marginBottom: '32px' }} />

      {currentStep === 0 && (
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinishBasic}
          initialValues={{ urgency: 'normal', budgetAmount: 100 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="咨询标题"
                rules={[{ required: true, message: '请输入咨询标题' }]}
              >
                <Input placeholder="请简要描述您的法律问题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="咨询分类"
                rules={[{ required: true, message: '请选择咨询分类' }]}
              >
                <Select placeholder="选择咨询分类">
                  {CATEGORIES.map(cat => (
                    <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="详细描述"
            rules={[{ required: true, message: '请详细描述您的法律问题' }]}
          >
            <TextArea
              rows={8}
              placeholder="请详细描述您遇到的法律问题，包括：
1. 事情发生的时间和地点
2. 涉及的人物和事件经过
3. 您的诉求和疑问
4. 是否有相关证据材料"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="urgency"
                label="紧急程度"
                rules={[{ required: true, message: '请选择紧急程度' }]}
              >
                <Select>
                  {URGENCY_LEVELS.map(level => (
                    <Option key={level.value} value={level.value}>{level.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="budgetAmount"
                label="预算金额（元）"
                rules={[{ required: true, message: '请输入预算金额' }]}
              >
                <InputNumber
                  min={50}
                  max={10000}
                  prefix="¥"
                  style={{ width: '100%' }}
                  placeholder="建议金额：根据问题复杂度，50-10000元不等"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: '24px' }}>
            <Button type="primary" size="large" htmlType="submit">
              下一步：确认信息
            </Button>
          </Form.Item>
        </Form>
      )}

      {currentStep === 1 && consultationData && (
        <div>
          <Descriptions title="确认咨询信息" bordered column={1}>
            <Descriptions.Item label="咨询标题">{consultationData.title}</Descriptions.Item>
            <Descriptions.Item label="咨询分类">
              {CATEGORIES.find(c => c.id === consultationData.category)?.name || consultationData.category}
            </Descriptions.Item>
            <Descriptions.Item label="紧急程度">
              {URGENCY_LEVELS.find(u => u.value === consultationData.urgency)?.label || consultationData.urgency}
            </Descriptions.Item>
            <Descriptions.Item label="详细描述">{consultationData.description}</Descriptions.Item>
            <Descriptions.Item label="预算金额" labelStyle={{ fontWeight: 'bold', color: '#1890ff' }}>
              <span style={{ fontSize: '20px', color: '#1890ff', fontWeight: 'bold' }}>
                ¥ {consultationData.budgetAmount}
              </span>
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <Button size="large" onClick={() => setCurrentStep(0)}>
              上一步
            </Button>
            <Button type="primary" size="large" onClick={onFinishConfirm} loading={loading}>
              确认创建并支付
            </Button>
          </div>
        </div>
      )}

      {currentStep === 2 && consultationData && (
        <Result
          status="success"
          title="咨询单创建成功！"
          subTitle="请完成支付以推送至匹配的律师"
          extra={[
            <div key="info" style={{ marginBottom: '16px' }}>
              <p><strong>咨询编号：</strong>{consultationData.id}</p>
              <p><strong>待支付金额：</strong><span style={{ fontSize: '20px', color: '#1890ff', fontWeight: 'bold' }}>
                ¥ {consultationData.budgetAmount}
              </span></p>
              <p><strong>说明：</strong>支付成功后，系统将通过路由引擎自动匹配专长律师并推送咨询单</p>
            </div>,
            <Button key="pay" type="primary" size="large" onClick={handlePay} loading={loading}>
              立即支付
            </Button>,
            <Button key="view" size="large" onClick={() => navigate(`/consultations/${consultationData.id}`)}>
              查看咨询单
            </Button>,
            <Button key="list" size="large" onClick={() => navigate('/consultations')}>
              返回咨询列表
            </Button>
          ]}
        />
      )}
    </Card>
  );
};

export default CreateConsultation;
