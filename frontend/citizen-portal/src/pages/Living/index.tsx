import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, List, Rate, Row, Select, Typography, message } from 'antd';
import { createAppointment, getServices, type ServiceItem } from '@/services/living';
import { LIVING_CATEGORIES } from '@/utils/constants';

const { Title, Paragraph, Text } = Typography;

export default function Living() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadServices = async (category?: string, keyword?: string) => {
    setLoading(true);
    try {
      setServices(await getServices(category, keyword));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleAppointment = async (serviceId: string) => {
    await createAppointment({ serviceId, date: '2026-06-12', time: '10:00', address: '贵阳市云岩区' });
    message.success('预约已提交');
  };

  return (
    <div style={{ padding: 32, background: '#f5f5f5', minHeight: '100%' }}>
      <Title level={2} style={{ color: '#1B5E20' }}>生活服务</Title>
      <Paragraph type="secondary">家政、装修、出行等服务统一预约。</Paragraph>

      <Card style={{ marginBottom: 24 }}>
        <Form layout="inline" onFinish={(values) => loadServices(values.category, values.keyword)}>
          <Form.Item name="category">
            <Select
              allowClear
              placeholder="服务类型"
              style={{ width: 180 }}
              options={LIVING_CATEGORIES.map((item) => ({ label: item.label, value: item.key }))}
            />
          </Form.Item>
          <Form.Item name="keyword">
            <Input allowClear placeholder="关键词" style={{ width: 240 }} />
          </Form.Item>
          <Button type="primary" htmlType="submit">筛选</Button>
        </Form>
      </Card>

      <List
        grid={{ gutter: 16, xs: 1, sm: 2, lg: 3 }}
        loading={loading}
        dataSource={services}
        renderItem={(item) => (
          <List.Item>
            <Card
              title={item.name}
              actions={[<Button key="book" type="primary" onClick={() => handleAppointment(item.id)}>立即预约</Button>]}
            >
              <Paragraph>{item.description}</Paragraph>
              <Row justify="space-between" align="middle">
                <Col><Text strong>¥{item.price}</Text></Col>
                <Col><Rate disabled allowHalf defaultValue={item.rating} /></Col>
              </Row>
              <Text type="secondary">{item.provider}</Text>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}
