import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Typography,
  Space,
  message,
  Spin,
  Empty,
} from 'antd';
import { EyeOutlined, ShopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';

const { Title, Text } = Typography;
const { Meta } = Card;

interface ShowroomItem {
  id: string;
  name: string;
  style: string;
  model_url: string;
  thumbnail_url: string;
  description: string;
  store_id?: string;
  created_at: string;
  store_name?: string;
  store_city?: string;
}

const styleColors: Record<string, string> = {
  现代简约: 'blue',
  北欧风格: 'cyan',
  中式风格: 'gold',
  欧式古典: 'purple',
  日式风格: 'geekblue',
  美式乡村: 'green',
  轻奢风格: 'magenta',
  工业风格: 'default',
};

const ShowroomList: React.FC = () => {
  const [showrooms, setShowrooms] = useState<ShowroomItem[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [activeStyle, setActiveStyle] = useState<string>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchShowrooms = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeStyle) params.style = activeStyle;

      const res = await apiClient.get('/showroom', { params });
      setShowrooms(res.data);
    } catch (error) {
      message.error('获取样板间列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStyles = async () => {
    try {
      const res = await apiClient.get('/showroom/styles');
      setStyles(res.data);
    } catch (error) {
      console.error('获取风格列表失败', error);
    }
  };

  useEffect(() => {
    fetchStyles();
  }, []);

  useEffect(() => {
    fetchShowrooms();
  }, [activeStyle]);

  const handleViewDetail = (id: string) => {
    navigate(`/showroom/${id}`);
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          <ShopOutlined style={{ marginRight: 8 }} />
          云样板间
        </Title>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space wrap size="middle">
          <Text type="secondary">风格分类：</Text>
          <Button
            type={!activeStyle ? 'primary' : 'default'}
            onClick={() => setActiveStyle(undefined)}
          >
            全部
          </Button>
          {styles.map((style) => (
            <Button
              key={style}
              type={activeStyle === style ? 'primary' : 'default'}
              onClick={() => setActiveStyle(style)}
            >
              {style}
            </Button>
          ))}
        </Space>
      </Card>

      <Spin spinning={loading}>
        {showrooms.length > 0 ? (
          <Row gutter={[24, 24]}>
            {showrooms.map((item) => (
              <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                <Card
                  hoverable
                  cover={
                    <div
                      style={{
                        height: 200,
                        background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 48,
                      }}
                    >
                      <ShopOutlined />
                    </div>
                  }
                  actions={[
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewDetail(item.id)}
                    >
                      查看详情
                    </Button>,
                  ]}
                >
                  <Meta
                    title={
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text strong style={{ fontSize: 16 }}>{item.name}</Text>
                        <Tag color={styleColors[item.style] || 'default'}>
                          {item.style}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                        <Text type="secondary" ellipsis={{ tooltip: item.description }}>
                          {item.description}
                        </Text>
                        {item.store_name && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.store_city} · {item.store_name}
                          </Text>
                        )}
                      </Space>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="暂无样板间数据" />
        )}
      </Spin>
    </div>
  );
};

export default ShowroomList;
