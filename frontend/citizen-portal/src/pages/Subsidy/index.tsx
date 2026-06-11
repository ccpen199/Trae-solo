import { useEffect, useState } from 'react';
import { Button, Card, Col, List, QRCode, Row, Space, Tag, Typography, message } from 'antd';
import { GiftOutlined } from '@ant-design/icons';
import { getAvailableSubsidies, verifySubsidy, type SubsidyItem } from '@/services/subsidy';

const { Title, Paragraph, Text } = Typography;

export default function Subsidy() {
  const [items, setItems] = useState<SubsidyItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAvailableSubsidies().then(setItems).finally(() => setLoading(false));
  }, []);

  const handleVerify = async (code: string) => {
    const result = await verifySubsidy(code);
    message.success(`${result.subsidyName} 核销成功，抵扣 ¥${result.amount}`);
  };

  return (
    <div style={{ padding: 32, background: '#f5f5f5', minHeight: '100%' }}>
      <Title level={2} style={{ color: '#1B5E20' }}>消费补贴</Title>
      <Paragraph type="secondary">查看可用补贴，出示二维码完成商户核销。</Paragraph>

      <List
        loading={loading}
        grid={{ gutter: 16, xs: 1, md: 2 }}
        dataSource={items}
        renderItem={(item) => (
          <List.Item>
            <Card>
              <Row gutter={16} align="middle">
                <Col flex="auto">
                  <Space direction="vertical" size={8}>
                    <Space>
                      <GiftOutlined style={{ color: '#1B5E20' }} />
                      <Text strong>{item.name}</Text>
                      <Tag color="green">{item.status === 'available' ? '可使用' : item.status}</Tag>
                    </Space>
                    <Title level={3} style={{ margin: 0 }}>¥{item.amount}</Title>
                    <Text type="secondary">{item.source}</Text>
                    <Text type="secondary">有效期：{item.validFrom} 至 {item.validTo}</Text>
                    <Button type="primary" onClick={() => handleVerify(item.qrCode || item.id)}>模拟核销</Button>
                  </Space>
                </Col>
                <Col>
                  <QRCode value={item.qrCode || item.id} size={112} />
                </Col>
              </Row>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}
