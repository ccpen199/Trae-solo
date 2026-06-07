import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Form, Input, Select, Tabs, Button, InputNumber,
  DatePicker, Checkbox, message, Row, Col, Divider, Space,
} from 'antd';
import {
  SendOutlined, CarOutlined, ShoppingOutlined,
  CustomerServiceOutlined, TeamOutlined, EnvironmentOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { orderAPI } from '../../api';

const { TextArea } = Input;
const { TabPane } = Tabs;

const orderTypeOptions = [
  { key: 'pickup_delivery', label: '帮取送', icon: <CarOutlined /> },
  { key: 'purchase', label: '帮买', icon: <ShoppingOutlined /> },
  { key: 'allpurpose', label: '全能帮', icon: <CustomerServiceOutlined /> },
  { key: 'queue', label: '帮排队', icon: <TeamOutlined /> },
];

const priorityOptions = [
  { value: 'normal', label: '普通' },
  { value: 'urgent', label: '加急' },
  { value: 'critical', label: '特急' },
];

export default function PublishOrder() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [orderType, setOrderType] = useState('pickup_delivery');
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        type: orderType,
        deadline: values.deadline?.toISOString(),
      };
      await orderAPI.create(payload);
      message.success('任务发布成功！');
      navigate('/requester/orders');
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card title="发布任务" extra={<SendOutlined />} style={{ marginBottom: 16 }}>
        <Tabs
          activeKey={orderType}
          onChange={(key) => {
            setOrderType(key);
            form.resetFields(['pickup_address', 'delivery_address', 'purchase_items', 'queue_location']);
          }}
          items={orderTypeOptions.map((opt) => ({
            key: opt.key,
            label: (
              <span>
                {opt.icon} {opt.label}
              </span>
            ),
          }))}
        />
      </Card>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            priority: 'normal',
            quality_requirements: [],
          }}
        >
          <Row gutter={24}>
            <Col xs={24} md={16}>
              <Form.Item
                name="title"
                label="任务标题"
                rules={[{ required: true, message: '请输入任务标题' }]}
              >
                <Input placeholder="简要描述您的需求" maxLength={50} />
              </Form.Item>

              <Form.Item
                name="description"
                label="详细描述"
                rules={[{ required: true, message: '请输入详细描述' }]}
              >
                <TextArea rows={4} placeholder="详细描述您的需求，包括注意事项等" maxLength={500} showCount />
              </Form.Item>

              {(orderType === 'pickup_delivery') && (
                <>
                  <Form.Item
                    name="pickup_address"
                    label="取件地址"
                    rules={[{ required: true, message: '请输入取件地址' }]}
                  >
                    <Input prefix={<EnvironmentOutlined />} placeholder="请输入取件地址" />
                  </Form.Item>
                  <Form.Item
                    name="delivery_address"
                    label="送达地址"
                    rules={[{ required: true, message: '请输入送达地址' }]}
                  >
                    <Input prefix={<EnvironmentOutlined />} placeholder="请输入送达地址" />
                  </Form.Item>
                </>
              )}

              {orderType === 'purchase' && (
                <Form.Item
                  name="purchase_items"
                  label="购买清单"
                  rules={[{ required: true, message: '请输入购买清单' }]}
                >
                  <TextArea rows={3} placeholder="请详细列出需要购买的物品及规格" />
                </Form.Item>
              )}

              {orderType === 'queue' && (
                <Form.Item
                  name="queue_location"
                  label="排队地点"
                  rules={[{ required: true, message: '请输入排队地点' }]}
                >
                  <Input prefix={<EnvironmentOutlined />} placeholder="请输入排队地点" />
                </Form.Item>
              )}

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="priority" label="优先级">
                    <Select options={priorityOptions} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="estimated_duration" label="预计时长(分钟)">
                    <InputNumber min={5} max={480} style={{ width: '100%' }} placeholder="预计需要的时间" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="deadline"
                label="截止时间"
                rules={[{ required: true, message: '请选择截止时间' }]}
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>

              <Divider>费用设置</Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="fee"
                    label="服务费(元)"
                    rules={[{ required: true, message: '请输入服务费' }]}
                  >
                    <InputNumber min={0.01} max={9999} precision={2} style={{ width: '100%' }} placeholder="服务费用" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="reward" label="额外奖励(元)">
                    <InputNumber min={0} max={9999} precision={2} style={{ width: '100%' }} placeholder="加急奖励(可选)" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider>质量要求</Divider>

              <Form.Item name="quality_requirements">
                <Checkbox.Group
                  options={[
                    { label: '需要拍照凭证', value: 'photo_proof' },
                    { label: '需要签收确认', value: 'sign_confirm' },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Card
                size="small"
                title="地图选点"
                style={{ marginBottom: 16, background: '#fafafa' }}
              >
                <div style={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f0f0f0',
                  borderRadius: 8,
                  color: '#999',
                }}>
                  <EnvironmentOutlined style={{ fontSize: 32, marginRight: 8 }} />
                  地图占位区域
                </div>
              </Card>

              <Card size="small" title="温馨提示" style={{ background: '#fafafa' }}>
                <ul style={{ paddingLeft: 16, color: '#666', fontSize: 13, lineHeight: 2 }}>
                  <li>服务费将托管至平台，完成后支付</li>
                  <li>加急订单会优先匹配跑腿员</li>
                  <li>额外奖励可提高接单速度</li>
                  <li>请确保地址信息准确</li>
                </ul>
              </Card>
            </Col>
          </Row>

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} size="large" icon={<SendOutlined />}>
                发布任务
              </Button>
              <Button size="large" onClick={() => form.resetFields()}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
