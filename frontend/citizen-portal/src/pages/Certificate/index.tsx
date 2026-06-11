import { useEffect, useState } from 'react';
import { Card, List, Space, Tag, Typography } from 'antd';
import { IdcardOutlined } from '@ant-design/icons';
import request from '@/services/request';

const { Title, Paragraph, Text } = Typography;

interface CertificateItem {
  id: string;
  name: string;
  status: string;
  issuedAt: string;
}

export default function Certificate() {
  const [items, setItems] = useState<CertificateItem[]>([]);

  useEffect(() => {
    request.get<unknown, CertificateItem[]>('/certificate/my').then(setItems);
  }, []);

  return (
    <div style={{ padding: 32, background: '#f5f5f5', minHeight: '100%' }}>
      <Title level={2} style={{ color: '#1B5E20' }}>我的证照</Title>
      <Paragraph type="secondary">集中查看电子证照状态和签发时间。</Paragraph>
      <Card>
        <List
          dataSource={items}
          renderItem={(item) => (
            <List.Item>
              <Space>
                <IdcardOutlined style={{ color: '#1B5E20', fontSize: 24 }} />
                <div>
                  <Text strong>{item.name}</Text>
                  <div><Text type="secondary">证照编号：{item.id} · 签发：{item.issuedAt}</Text></div>
                </div>
                <Tag color="green">{item.status}</Tag>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
