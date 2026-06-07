import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  DatePicker,
  Alert,
  Avatar,
  Tag,
  message,
  Radio,
  Divider,
  Typography,
  Progress,
  Tooltip,
  Descriptions,
  Badge
} from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  SendOutlined,
  SafetyOutlined,
  ToolOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { createOrder, getRecommendedEngineers } from '../services/orderService';
import { getParts } from '../services/adminService';
import useStore from '../store/useStore';

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

const SubmitOrderPage = () => {
  const { setCurrentView, deviceTypeOptions } = useStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [engineers, setEngineers] = useState([]);
  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [diagnosisData, setDiagnosisData] = useState(null);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [partsInventory, setPartsInventory] = useState([]);

  useEffect(() => {
    const saved = sessionStorage.getItem('diagnosisResult');
    if (saved) {
      const data = JSON.parse(saved);
      setDiagnosisData(data);
      form.setFieldsValue({
        deviceType: data.deviceType,
        faultDescription: data.faultDescription
      });
    }
    loadParts();
  }, []);

  const loadParts = async () => {
    try {
      const res = await getParts();
      setPartsInventory(res.data || []);
    } catch (e) {
      console.error('Failed to load parts:', e);
    }
  };

  const loadRecommendedEngineers = async () => {
    try {
      const values = await form.validateFields(['user_address', 'deviceType', 'device_model', 'faultDescription']);
    } catch (error) {
      message.warning('请先填写完整的地址、设备型号和故障描述');
      return;
    }

    setRecommendLoading(true);
    try {
      const res = await getRecommendedEngineers({
        lat: 31.2304,
        lng: 121.4737,
        skills: diagnosisData?.top3?.map(f => f.code)?.join(',') || ''
      });
      setEngineers(res.data || []);
    } catch (error) {
      console.error('Failed to load engineers:', error);
    } finally {
      setRecommendLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const orderData = {
        ...values,
        appointment_time: values.appointmentTime?.toISOString(),
        predicted_faults: diagnosisData?.top3 || [],
        prediction_accuracy: diagnosisData?.predictionAccuracy || null,
        engineer_id: selectedEngineer?.id,
        user_lat: 31.2304,
        user_lng: 121.4737
      };
      
      const res = await createOrder(orderData);
      message.success('订单提交成功！');
      sessionStorage.removeItem('diagnosisResult');
      useStore.getState().selectedOrderId = res.data.id;
      setCurrentView('order-detail');
    } catch (error) {
      message.error('提交失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const getPartsAvailability = (faultCode) => {
    const matched = partsInventory.find(p => p.fault_code === faultCode);
    if (matched) {
      return matched.stock > 10 ? { status: 'success', text: '库存充足', count: matched.stock } :
        matched.stock > 3 ? { status: 'warning', text: '库存紧张', count: matched.stock } :
        { status: 'error', text: '库存不足', count: matched.stock };
    }
    return { status: 'default', text: '未知', count: 0 };
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {diagnosisData && (
        <Alert
          message="已载入智能诊断结果"
          description={
            <Space wrap>
              <Text>预判故障：</Text>
              {diagnosisData.top3?.map(f => (
                <Tag key={f.code} color="blue">{f.name} ({(f.confidence * 100).toFixed(0)}%)</Tag>
              ))}
            </Space>
          }
          type="info"
          showIcon
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="填写订单信息">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="您的姓名"
                    name="user_name"
                    rules={[{ required: true, message: '请输入姓名' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="请输入您的姓名" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="联系电话"
                    name="user_phone"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                    ]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="上门地址"
                name="user_address"
                rules={[{ required: true, message: '请输入地址' }]}
              >
                <Input prefix={<EnvironmentOutlined />} placeholder="请输入详细地址" />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
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
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="设备型号"
                    name="device_model"
                    rules={[{ required: true, message: '请输入设备型号' }]}
                  >
                    <Input placeholder="如：iPhone 13 Pro" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="故障描述"
                name="faultDescription"
                rules={[{ required: true, message: '请描述故障' }]}
              >
                <TextArea rows={3} placeholder="请描述故障现象" />
              </Form.Item>

              <Form.Item
                label="预约时间"
                name="appointmentTime"
                rules={[{ required: true, message: '请选择预约时间' }]}
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  prefix={<ClockCircleOutlined />}
                  placeholder="选择上门时间"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={loading}
                  icon={<SendOutlined />}
                  block
                >
                  提交维修订单
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card 
            title={<Space><TeamOutlined />推荐工程师</Space>}
            loading={recommendLoading}
            extra={
              <Button type="link" onClick={loadRecommendedEngineers}>
                刷新推荐
              </Button>
            }
          >
            <Alert
              message="调度依据说明"
              description="系统综合LBS距离、技能匹配度、配件库存状态进行最优指派"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            {engineers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <TeamOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                  请先填写完整订单信息后点击"刷新推荐"
                </Text>
              </div>
            ) : (
              <Radio.Group
                value={selectedEngineer?.id}
                onChange={(e) => setSelectedEngineer(engineers.find(eng => eng.id === e.target.value))}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {engineers.map(eng => (
                    <Radio key={eng.id} value={eng.id} style={{ width: '100%' }}>
                      <Card 
                        size="small"
                        className={`engineer-card ${selectedEngineer?.id === eng.id ? 'selected' : ''}`}
                        style={{ marginBottom: 8, width: '100%' }}
                      >
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Space>
                              <Avatar size="large" icon={<UserOutlined />} />
                              <div>
                                <Text strong>{eng.name}</Text>
                                <Tag color="blue" style={{ marginLeft: 8 }}>
                                  <SafetyOutlined /> L{eng.certificateLevel}
                                </Tag>
                              </div>
                            </Space>
                            <Space direction="vertical" align="end" size={0}>
                              <Text strong style={{ color: '#1677ff', fontSize: 16 }}>
                                {eng.matchScore}分
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>综合匹配度</Text>
                            </Space>
                          </Space>
                          
                          <Descriptions column={3} size="small" style={{ width: '100%' }}>
                            <Descriptions.Item label={<Text type="secondary">距离</Text>}>
                              <Text strong>{eng.distance}km</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">预计到达</Text>}>
                              <Text strong>{eng.eta}分钟</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">好评率</Text>}>
                              <Text strong>{eng.successRate}%</Text>
                            </Descriptions.Item>
                          </Descriptions>

                          <Divider style={{ margin: '4px 0' }} />
                          
                          <Space direction="vertical" style={{ width: '100%' }} size="small">
                            <Space wrap>
                              <Tooltip title="技能认证证书">
                                <Tag color="green"><SafetyOutlined /> 高级认证工程师</Tag>
                              </Tooltip>
                              <Tooltip title="装备编号">
                                <Tag color="blue"><ToolOutlined /> EQP-{eng.id.toString().padStart(3, '0')}</Tag>
                              </Tooltip>
                              <Tooltip title="服务半径">
                                <Tag color="purple"><EnvironmentOutlined /> 15km</Tag>
                              </Tooltip>
                            </Space>
                            
                            <Space>
                              <Text type="secondary" style={{ fontSize: 12 }}>技能匹配</Text>
                              <Progress percent={parseInt(eng.skillMatch)} size="small" />
                            </Space>
                            
                            <Space>
                              <InboxOutlined style={{ color: '#52c41a' }} />
                              <Text type="secondary" style={{ fontSize: 12 }}>配件库存状态：</Text>
                              {diagnosisData?.top3?.slice(0, 1)?.map(f => {
                                const avail = getPartsAvailability(f.code);
                                return (
                                  <Badge
                                    key={f.code}
                                    status={avail.status}
                                    text={`${f.name}配件: ${avail.text}(${avail.count})`}
                                  />
                                );
                              })}
                            </Space>
                            
                            <Space wrap>
                              {[...Array(5)].map((_, i) => (
                                <CheckCircleOutlined
                                  key={i}
                                  style={{ color: i < Math.round(eng.avgRating) ? '#faad14' : '#d9d9d9' }}
                                />
                              ))}
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {eng.avgRating}分 · {eng.totalOrders}单
                              </Text>
                            </Space>
                          </Space>
                        </Space>
                      </Card>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            )}
          </Card>

          {selectedEngineer && (
            <Alert
              message={`已选择工程师：${selectedEngineer.name}`}
              description={`预计 ${selectedEngineer.eta} 分钟到达，距离 ${selectedEngineer.distance} km`}
              type="success"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Col>
      </Row>
    </Space>
  );
};

export default SubmitOrderPage;
