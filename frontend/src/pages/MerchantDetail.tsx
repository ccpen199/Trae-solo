import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Descriptions, Typography, Rate, Tag, Button, message } from 'antd';
import { ShopOutlined, CheckCircleOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { merchantAPI } from '../api';

const { Title, Text } = Typography;

const MerchantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadMerchant(parseInt(id));
    }
  }, [id]);

  const loadMerchant = async (merchantId: number) => {
    setLoading(true);
    try {
      const res = await merchantAPI.getMerchantDetail(merchantId);
      setMerchant(res.data.merchant);
    } catch (error) {
      message.error('加载商家详情失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Card loading />;
  }

  if (!merchant) {
    return <Card><Text type="secondary">商家不存在</Text></Card>;
  }

  return (
    <Card>
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        <div style={{ width: 200, height: 200, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
          <ShopOutlined style={{ fontSize: 80, color: 'white' }} />
        </div>
        <div style={{ flex: 1 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            {merchant.name}
            {merchant.is_verified ? (
              <Tag color="green" style={{ marginLeft: 8 }}>
                <CheckCircleOutlined /> 官方认证
              </Tag>
            ) : null}
          </Title>
          <Tag color="blue" style={{ marginBottom: 16 }}>{merchant.category}</Tag>
          <div style={{ marginBottom: 16 }}>
            <Rate disabled defaultValue={merchant.rating} />
            <Text type="secondary" style={{ marginLeft: 8 }}>{merchant.rating} 分</Text>
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.8 }}>{merchant.description}</p>
          <div style={{ marginTop: 16, display: 'flex', gap: 24 }}>
            <Button type="primary" size="large" icon={<PhoneOutlined />}>联系商家</Button>
            <Button size="large">查看地图</Button>
          </div>
        </div>
      </div>

      <Descriptions column={2} bordered title="商家信息">
        <Descriptions.Item label="所在城市">{merchant.city_name}</Descriptions.Item>
        <Descriptions.Item label="详细地址">
          <EnvironmentOutlined /> {merchant.address}
        </Descriptions.Item>
        <Descriptions.Item label="联系电话">{merchant.phone}</Descriptions.Item>
        <Descriptions.Item label="营业执照">{merchant.license_number}</Descriptions.Item>
        <Descriptions.Item label="入驻时间">{new Date(merchant.created_at).toLocaleDateString()}</Descriptions.Item>
        <Descriptions.Item label="认证状态">
          {merchant.is_verified ? (
            <span style={{ color: '#52c41a' }}>已认证</span>
          ) : (
            <Text type="warning">待审核</Text>
          )}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default MerchantDetailPage;
