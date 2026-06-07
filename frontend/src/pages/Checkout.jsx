import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Input, Space, Tag, List, Statistic, Divider, message, Steps } from 'antd';
import { ArrowLeftOutlined, CreditCardOutlined, SafetyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { ordersAPI, eventsAPI } from '../api';

function Checkout() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const data = sessionStorage.getItem('checkoutData');
    if (!data) {
      message.warning('请先选择座位');
      navigate(-1);
      return;
    }
    const parsed = JSON.parse(data);
    setCheckoutData(parsed);
    loadEvent(parsed.eventId);
  }, []);

  const loadEvent = async (eventId) => {
    try {
      const res = await eventsAPI.detail(eventId);
      setEvent(res.event);
    } catch (err) {
      message.error('加载活动信息失败');
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const data = {
        ...checkoutData,
        contactName: values.contactName,
        contactPhone: values.contactPhone,
        idCard: values.idCard
      };
      const res = await ordersAPI.create(data);
      await ordersAPI.pay(res.orderId);
      sessionStorage.removeItem('checkoutData');
      message.success('购票成功！');
      navigate(`/orders/${res.orderId}`);
    } catch (err) {
      message.error(err.response?.data?.error || '提交订单失败');
    } finally {
      setLoading(false);
    }
  };

  if (!checkoutData || !event) {
    return <div style={{ padding: 60, textAlign: 'center' }}>加载中...</div>;
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
        <h2 style={{ margin: 0 }}>确认订单</h2>
      </Space>

      <Steps
        current={1}
        items={[
          { title: '选择座位', icon: <CheckCircleOutlined /> },
          { title: '确认订单', icon: <CreditCardOutlined /> },
          { title: '完成支付', icon: <SafetyOutlined /> }
        ]}
        style={{ marginBottom: 32 }}
      />

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card title="活动信息" style={{ marginBottom: 24 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 120, height: 80, background: 'linear-gradient(135deg, #1890ff, #722ed1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 32 }}>
                  🎫
                </div>
                <div>
                  <h3 style={{ marginBottom: 8 }}>{event.title}</h3>
                  <p style={{ color: '#666', margin: 0 }}>{event.venue} | {event.start_time}</p>
                </div>
              </div>
            </Space>
          </Card>

          <Card title="已选座位" style={{ marginBottom: 24 }}>
            <Space wrap size="small">
              {checkoutData.seatIds?.map((id, idx) => (
                <Tag key={id} color="blue">座位 {idx + 1}</Tag>
              ))}
            </Space>
          </Card>

          <Card title="实名制信息">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="contactName"
                    label="联系人姓名"
                    rules={[{ required: true, message: '请输入联系人姓名' }]}
                  >
                    <Input placeholder="请输入真实姓名" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="contactPhone"
                    label="联系电话"
                    rules={[
                      { required: true, message: '请输入联系电话' },
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入有效手机号' }
                    ]}
                  >
                    <Input placeholder="请输入手机号" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="idCard"
                label="身份证号"
                rules={[
                  { required: true, message: '请输入身份证号' },
                  { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入有效身份证号' }
                ]}
              >
                <Input placeholder="请输入身份证号用于实名制核验" />
              </Form.Item>
              <p style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>
                <SafetyOutlined /> 根据公安部门要求，观演需进行实名制核验，请确保信息准确
              </p>
              <Divider />
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                block
                loading={loading}
                icon={<CreditCardOutlined />}
                style={{ height: 48, fontSize: 16 }}
              >
                确认支付
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card style={{ position: 'sticky', top: 80 }} title="订单摘要">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <List
                size="small"
                dataSource={checkoutData.seatIds || []}
                renderItem={() => (
                  <List.Item style={{ justifyContent: 'space-between' }}>
                    <span>演出票 x1</span>
                    <span>¥--</span>
                  </List.Item>
                )}
              />
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>数量</span>
                <span>{checkoutData.seatIds?.length || 0} 张</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>优惠</span>
                <span style={{ color: '#52c41a' }}>-¥0.00</span>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <Statistic title="应付金额" value={0} prefix="¥" precision={2} valueStyle={{ color: '#ff4d4f', fontSize: 24 }} />
              <Space direction="vertical" size="small" style={{ fontSize: 12, color: '#999' }}>
                <span>✅ 7天无理由退款保障</span>
                <span>✅ 电子票自动发送</span>
                <span>✅ 官方正品保障</span>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Checkout;
